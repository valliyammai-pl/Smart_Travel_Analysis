import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { BookingStatus, NotificationType, AlarmStatus } from '@prisma/client';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../types';

export const createBookingSchema = z.object({
  scheduleId: z.string().uuid(),
  seatNumbers: z.array(z.string()).min(1, 'At least one seat must be selected'),
  passengerName: z.string().min(2),
  passengerEmail: z.string().email(),
  passengerPhone: z.string().min(8),
  pickupStop: z.string().optional(),
  dropoffStop: z.string().optional(),
  enableAlarm: z.boolean().default(false),
  targetLatitude: z.number().optional(),
  targetLongitude: z.number().optional(),
});

export const createBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const {
      scheduleId,
      seatNumbers,
      passengerName,
      passengerEmail,
      passengerPhone,
      pickupStop,
      dropoffStop,
      enableAlarm,
      targetLatitude,
      targetLongitude,
    } = req.body;

    // Execute in Prisma interactive transaction to prevent race conditions & double-booking
    const bookingResult = await prisma.$transaction(async (tx) => {
      // 1. Verify schedule exists and is valid
      const schedule = await tx.schedule.findUnique({
        where: { id: scheduleId },
        include: {
          bus: true,
          route: {
            include: {
              stops: { orderBy: { stopOrder: 'asc' } },
            },
          },
        },
      });

      if (!schedule) {
        throw new Error('Schedule not found');
      }

      // 2. Fetch requested seats and check availability
      const seats = await tx.seat.findMany({
        where: {
          scheduleId,
          seatNumber: { in: seatNumbers },
        },
      });

      if (seats.length !== seatNumbers.length) {
        throw new Error('One or more selected seats do not exist');
      }

      const alreadyBooked = seats.filter((s) => s.isBooked);
      if (alreadyBooked.length > 0) {
        const bookedSeatNames = alreadyBooked.map((s) => s.seatNumber).join(', ');
        throw new Error(`Seat(s) ${bookedSeatNames} are already booked`);
      }

      // 3. Calculate total amount
      const totalAmount = seats.reduce((sum, s) => sum + s.price, 0);

      // 4. Mark seats as booked
      await tx.seat.updateMany({
        where: {
          scheduleId,
          seatNumber: { in: seatNumbers },
        },
        data: { isBooked: true },
      });

      // 5. Generate unique booking reference
      const bookingRef = `BK-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

      // 6. Create booking
      const newBooking = await tx.booking.create({
        data: {
          bookingReference: bookingRef,
          userId: req.user!.userId,
          scheduleId,
          seatNumbers,
          totalAmount,
          passengerName,
          passengerEmail,
          passengerPhone,
          pickupStop: pickupStop || schedule.route.source,
          dropoffStop: dropoffStop || schedule.route.destination,
          status: BookingStatus.CONFIRMED,
        },
        include: {
          schedule: {
            include: {
              bus: true,
              route: true,
            },
          },
        },
      });

      // 7. If enableAlarm is requested, set up destination alarm
      if (enableAlarm && targetLatitude && targetLongitude && dropoffStop) {
        await tx.destinationAlarm.create({
          data: {
            userId: req.user!.userId,
            bookingId: newBooking.id,
            scheduleId,
            targetLatitude,
            targetLongitude,
            targetStopName: dropoffStop,
            status: AlarmStatus.ACTIVE,
          },
        });
      } else if (enableAlarm && dropoffStop) {
        // Look up coordinates from route stops if not provided
        const matchedStop = schedule.route.stops.find(
          (s) => s.stopName.toLowerCase() === dropoffStop.toLowerCase()
        );
        if (matchedStop) {
          await tx.destinationAlarm.create({
            data: {
              userId: req.user!.userId,
              bookingId: newBooking.id,
              scheduleId,
              targetLatitude: matchedStop.latitude,
              targetLongitude: matchedStop.longitude,
              targetStopName: matchedStop.stopName,
              status: AlarmStatus.ACTIVE,
            },
          });
        }
      }

      // 8. Create confirmation notification
      await tx.notification.create({
        data: {
          userId: req.user!.userId,
          title: 'Booking Confirmed!',
          message: `Your booking for ${schedule.route.routeName} (${seatNumbers.join(', ')}) is confirmed. Reference: ${bookingRef}`,
          type: NotificationType.BOOKING_CONFIRMED,
          metadata: {
            bookingReference: bookingRef,
            bookingId: newBooking.id,
            seatNumbers,
          },
        },
      });

      return newBooking;
    });

    res.status(201).json({
      success: true,
      message: 'Booking completed successfully',
      data: bookingResult,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create booking',
    });
  }
};

export const cancelBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const id = req.params.id as string;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { schedule: { include: { route: true } } },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Ensure non-admin users can only cancel their own bookings
    if (req.user.role !== 'ADMIN' && booking.userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'You are not authorized to cancel this booking' });
    }

    if (booking.status === BookingStatus.CANCELLED) {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    // Execute atomic cancellation
    await prisma.$transaction(async (tx) => {
      // 1. Release seats
      await tx.seat.updateMany({
        where: {
          scheduleId: booking.scheduleId,
          seatNumber: { in: booking.seatNumbers },
        },
        data: { isBooked: false },
      });

      // 2. Update booking status
      await tx.booking.update({
        where: { id },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });

      // 3. Dismiss any active destination alarms for this booking
      await tx.destinationAlarm.updateMany({
        where: { bookingId: id },
        data: { status: AlarmStatus.DISMISSED },
      });

      // 4. Create cancellation notification
      await tx.notification.create({
        data: {
          userId: booking.userId,
          title: 'Booking Cancelled',
          message: `Booking ${booking.bookingReference} for ${booking.schedule.route.routeName} has been cancelled and seats released.`,
          type: NotificationType.BOOKING_CANCELLED,
          metadata: { bookingReference: booking.bookingReference },
        },
      });
    });

    res.json({ success: true, message: 'Booking cancelled and seats successfully released' });
  } catch (error) {
    next(error);
  }
};

export const getMyBookings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.userId },
      include: {
        schedule: {
          include: {
            bus: true,
            route: {
              include: {
                stops: { orderBy: { stopOrder: 'asc' } },
              },
            },
          },
        },
        alarms: true,
      },
      orderBy: { bookingDate: 'desc' },
    });

    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id }, { bookingReference: id }],
      },
      include: {
        schedule: {
          include: {
            bus: true,
            route: {
              include: {
                stops: { orderBy: { stopOrder: 'asc' } },
              },
            },
          },
        },
        alarms: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (req.user && req.user.role !== 'ADMIN' && booking.userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

export const getAllBookings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        schedule: {
          include: {
            bus: true,
            route: true,
          },
        },
      },
      orderBy: { bookingDate: 'desc' },
    });

    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};
