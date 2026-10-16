import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../types';

export const getAdminAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalBuses = await prisma.bus.count();
    const activeBuses = await prisma.bus.count({
      where: { status: { in: ['IN_TRANSIT', 'ON_TIME'] } },
    });
    const simulatingBuses = await prisma.bus.count({
      where: { isSimulating: true },
    });

    const totalRoutes = await prisma.route.count();
    const totalSchedules = await prisma.schedule.count();

    const confirmedBookings = await prisma.booking.findMany({
      where: { status: 'CONFIRMED' },
      select: { totalAmount: true },
    });

    const cancelledBookingsCount = await prisma.booking.count({
      where: { status: 'CANCELLED' },
    });

    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    const totalSeats = await prisma.seat.count();
    const bookedSeats = await prisma.seat.count({ where: { isBooked: true } });
    const occupancyRate = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

    // Recent 10 bookings
    const recentBookings = await prisma.booking.findMany({
      take: 10,
      orderBy: { bookingDate: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        schedule: {
          include: {
            bus: { select: { busNumber: true, operator: true } },
            route: { select: { routeName: true } },
          },
        },
      },
    });

    // Popular routes with booking counts
    const routes = await prisma.route.findMany({
      include: {
        schedules: {
          include: {
            _count: { select: { bookings: true } },
          },
        },
      },
    });

    const routeStats = routes.map((r) => {
      const bookingsCount = r.schedules.reduce((acc, s) => acc + s._count.bookings, 0);
      return {
        id: r.id,
        routeName: r.routeName,
        source: r.source,
        destination: r.destination,
        distanceKm: r.totalDistanceKm,
        totalBookings: bookingsCount,
      };
    }).sort((a, b) => b.totalBookings - a.totalBookings);

    // Active alarms count
    const activeAlarmsCount = await prisma.destinationAlarm.count({
      where: { status: 'ACTIVE' },
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalRevenue,
          totalBookings: confirmedBookings.length + cancelledBookingsCount,
          confirmedBookings: confirmedBookings.length,
          cancelledBookings: cancelledBookingsCount,
          totalUsers,
          totalBuses,
          activeBuses,
          simulatingBuses,
          totalRoutes,
          totalSchedules,
          occupancyRate,
          activeAlarmsCount,
        },
        routeStats,
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};
