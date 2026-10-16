import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../types';

export const stopSchema = z.object({
  stopName: z.string().min(2),
  stopOrder: z.number().int().min(0),
  latitude: z.number(),
  longitude: z.number(),
  distanceFromSourceKm: z.number().min(0),
  estimatedMinutesFromSource: z.number().int().min(0),
});

export const createRouteSchema = z.object({
  routeName: z.string().min(3),
  source: z.string().min(2),
  destination: z.string().min(2),
  totalDistanceKm: z.number().positive(),
  estimatedMinutes: z.number().int().positive(),
  stops: z.array(stopSchema).min(2, 'Route must have at least 2 stops (origin and destination)'),
});

export const getAllRoutes = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const routes = await prisma.route.findMany({
      include: {
        stops: {
          orderBy: { stopOrder: 'asc' },
        },
        _count: {
          select: { schedules: true },
        },
      },
      orderBy: { routeName: 'asc' },
    });

    res.json({ success: true, data: routes });
  } catch (error) {
    next(error);
  }
};

export const getRouteById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        stops: {
          orderBy: { stopOrder: 'asc' },
        },
        schedules: {
          include: { bus: true },
          orderBy: { departureTime: 'asc' },
        },
      },
    });

    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    res.json({ success: true, data: route });
  } catch (error) {
    next(error);
  }
};

export const createRoute = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { routeName, source, destination, totalDistanceKm, estimatedMinutes, stops } = req.body;

    const route = await prisma.route.create({
      data: {
        routeName,
        source,
        destination,
        totalDistanceKm,
        estimatedMinutes,
        stops: {
          create: stops,
        },
      },
      include: {
        stops: {
          orderBy: { stopOrder: 'asc' },
        },
      },
    });

    res.status(201).json({ success: true, data: route });
  } catch (error) {
    next(error);
  }
};

export const deleteRoute = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.route.delete({ where: { id } });
    res.json({ success: true, message: 'Route deleted successfully' });
  } catch (error) {
    next(error);
  }
};
