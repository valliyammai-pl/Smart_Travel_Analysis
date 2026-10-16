import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { ScheduleStatus } from '@prisma/client';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../types';

export const createScheduleSchema = z.object({
  busId: z.string().uuid(),
  routeId: z.string().uuid(),
  departureTime: z.string().datetime(),
  arrivalTime: z.string().datetime(),
  fare: z.number().positive(),
  status: z.nativeEnum(ScheduleStatus).default(ScheduleStatus.SCHEDULED),
});

export const searchSchedules = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { source, destination, date } = req.query;

    const whereClause: any = {};

    if (source || destination) {
      whereClause.route = {};
      if (source && typeof source === 'string') {
        whereClause.route.source = { contains: source, mode: 'insensitive' };
      }
      if (destination && typeof destination === 'string') {
        whereClause.route.destination = { contains: destination, mode: 'insensitive' };
      }
    }

    if (date && typeof date === 'string') {
      const searchDate = new Date(date);
      const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));
      whereClause.departureTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const schedules = await prisma.schedule.findMany({
      where: whereClause,
      include: {
        bus: true,
        route: {
          include: {
            stops: {
              orderBy: { stopOrder: 'asc' },
            },
          },
        },
        seats: {
          select: {
            id: true,
            seatNumber: true,
            isBooked: true,
          },
        },
      },
      orderBy: { departureTime: 'asc' },
    });

    const formatted = schedules.map((schedule) => {
      const totalSeats = schedule.seats.length;
      const bookedSeats = schedule.seats.filter((s) => s.isBooked).length;
      const availableSeats = totalSeats - bookedSeats;

      return {
        id: schedule.id,
        busId: schedule.busId,
        routeId: schedule.routeId,
        departureTime: schedule.departureTime,
        arrivalTime: schedule.arrivalTime,
        fare: schedule.fare,
        status: schedule.status,
        bus: schedule.bus,
        route: schedule.route,
        totalSeats,
        bookedSeats,
        availableSeats,
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const getScheduleById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        bus: true,
        route: {
          include: {
            stops: {
              orderBy: { stopOrder: 'asc' },
            },
          },
        },
        seats: {
          orderBy: { seatNumber: 'asc' },
        },
      },
    });

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    const totalSeats = schedule.seats.length;
    const bookedSeats = schedule.seats.filter((s) => s.isBooked).length;
    const availableSeats = totalSeats - bookedSeats;

    res.json({
      success: true,
      data: {
        ...schedule,
        totalSeats,
        bookedSeats,
        availableSeats,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createSchedule = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { busId, routeId, departureTime, arrivalTime, fare, status } = req.body;

    const bus = await prisma.bus.findUnique({ where: { id: busId } });
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    const schedule = await prisma.schedule.create({
      data: {
        busId,
        routeId,
        departureTime: new Date(departureTime),
        arrivalTime: new Date(arrivalTime),
        fare,
        status: status || ScheduleStatus.SCHEDULED,
      },
    });

    // Auto generate seats for this schedule based on bus totalSeats
    const seatRows = ['A', 'B', 'C', 'D'];
    const seatsData = [];
    const rows = Math.ceil(bus.totalSeats / 4);

    for (let r = 1; r <= rows; r++) {
      for (let s = 0; s < 4; s++) {
        if (seatsData.length >= bus.totalSeats) break;
        const seatNum = `${r}${seatRows[s]}`;
        const isWindow = s === 0 || s === 3;
        seatsData.push({
          scheduleId: schedule.id,
          seatNumber: seatNum,
          seatType: isWindow ? 'WINDOW' : 'AISLE',
          price: isWindow ? fare + 50 : fare,
          isBooked: false,
        });
      }
    }

    await prisma.seat.createMany({ data: seatsData });

    const fullSchedule = await prisma.schedule.findUnique({
      where: { id: schedule.id },
      include: {
        bus: true,
        route: true,
        seats: true,
      },
    });

    res.status(201).json({ success: true, data: fullSchedule });
  } catch (error) {
    next(error);
  }
};

export const updateSchedule = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const updated = await prisma.schedule.update({
      where: { id },
      data: req.body,
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteSchedule = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.schedule.delete({ where: { id } });
    res.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error) {
    next(error);
  }
};
