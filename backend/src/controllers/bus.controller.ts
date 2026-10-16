import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { BusType, BusStatus } from '@prisma/client';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../types';

export const createBusSchema = z.object({
  busNumber: z.string().min(2, 'Bus number required'),
  operator: z.string().min(2, 'Operator name required'),
  type: z.nativeEnum(BusType).default(BusType.AC_SEATER),
  totalSeats: z.number().int().min(10).max(60).default(36),
  currentLat: z.number().optional(),
  currentLng: z.number().optional(),
  status: z.nativeEnum(BusStatus).default(BusStatus.ON_TIME),
  isSimulating: z.boolean().default(true),
});

export const updateBusSchema = createBusSchema.partial();

export const getAllBuses = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const buses = await prisma.bus.findMany({
      include: {
        schedules: {
          where: {
            status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          },
          include: {
            route: {
              include: {
                stops: {
                  orderBy: { stopOrder: 'asc' },
                },
              },
            },
          },
          orderBy: { departureTime: 'asc' },
          take: 1,
        },
      },
      orderBy: { busNumber: 'asc' },
    });

    res.json({ success: true, data: buses });
  } catch (error) {
    next(error);
  }
};

export const getBusById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const bus = await prisma.bus.findUnique({
      where: { id },
      include: {
        schedules: {
          include: {
            route: {
              include: {
                stops: {
                  orderBy: { stopOrder: 'asc' },
                },
              },
            },
          },
          orderBy: { departureTime: 'desc' },
        },
        gpsLogs: {
          orderBy: { recordedAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    res.json({ success: true, data: bus });
  } catch (error) {
    next(error);
  }
};

export const createBus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const bus = await prisma.bus.create({
      data: req.body,
    });
    res.status(201).json({ success: true, data: bus });
  } catch (error) {
    next(error);
  }
};

export const updateBus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const bus = await prisma.bus.update({
      where: { id },
      data: req.body,
    });
    res.json({ success: true, data: bus });
  } catch (error) {
    next(error);
  }
};

export const deleteBus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.bus.delete({ where: { id } });
    res.json({ success: true, message: 'Bus deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const toggleBusSimulation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const bus = await prisma.bus.findUnique({ where: { id } });
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    const updated = await prisma.bus.update({
      where: { id },
      data: { isSimulating: !bus.isSimulating },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
