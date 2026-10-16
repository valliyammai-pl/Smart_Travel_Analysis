import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AlarmStatus, NotificationType } from '@prisma/client';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../types';
import { getIO } from '../socket';
import { evaluateAlarmForDistance } from '../services/alarm.service';

export const createAlarmSchema = z.object({
  scheduleId: z.string().uuid(),
  bookingId: z.string().uuid().optional(),
  targetLatitude: z.number(),
  targetLongitude: z.number(),
  targetStopName: z.string().min(2),
});

export const getUserAlarms = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const alarms = await prisma.destinationAlarm.findMany({
      where: { userId: req.user.userId },
      include: {
        schedule: {
          include: {
            bus: true,
            route: true,
          },
        },
        booking: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: alarms });
  } catch (error) {
    next(error);
  }
};

export const createAlarm = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { scheduleId, bookingId, targetLatitude, targetLongitude, targetStopName } = req.body;

    // Check if an active alarm for this schedule already exists
    const existing = await prisma.destinationAlarm.findFirst({
      where: {
        userId: req.user.userId,
        scheduleId,
        status: AlarmStatus.ACTIVE,
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An active alarm is already set for this journey.',
        data: existing,
      });
    }

    const alarm = await prisma.destinationAlarm.create({
      data: {
        userId: req.user.userId,
        scheduleId,
        bookingId,
        targetLatitude,
        targetLongitude,
        targetStopName,
        status: AlarmStatus.ACTIVE,
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

    res.status(201).json({
      success: true,
      message: `Alarm set for ${targetStopName}! You will be alerted at 2 km, 500 m, and 200 m.`,
      data: alarm,
    });
  } catch (error) {
    next(error);
  }
};

export const dismissAlarm = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const alarm = await prisma.destinationAlarm.findUnique({ where: { id } });
    if (!alarm) {
      return res.status(404).json({ success: false, message: 'Alarm not found' });
    }

    if (req.user && req.user.role !== 'ADMIN' && alarm.userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const updated = await prisma.destinationAlarm.update({
      where: { id },
      data: { status: AlarmStatus.DISMISSED },
    });

    res.json({ success: true, message: 'Alarm dismissed', data: updated });
  } catch (error) {
    next(error);
  }
};

export const resetAlarm = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const alarm = await prisma.destinationAlarm.findUnique({ where: { id } });
    if (!alarm) {
      return res.status(404).json({ success: false, message: 'Alarm not found' });
    }

    if (req.user && req.user.role !== 'ADMIN' && alarm.userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const updated = await prisma.destinationAlarm.update({
      where: { id },
      data: {
        status: AlarmStatus.ACTIVE,
        threshold2kmTriggered: false,
        threshold500mTriggered: false,
        threshold200mTriggered: false,
      },
    });

    res.json({ success: true, message: 'Alarm reset and re-armed', data: updated });
  } catch (error) {
    next(error);
  }
};

export const testTriggerThreshold = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { threshold } = req.body; // '2km' | '500m' | '200m'

    const alarm = await prisma.destinationAlarm.findUnique({
      where: { id },
      include: { schedule: { include: { bus: true } } },
    });

    if (!alarm) {
      return res.status(404).json({ success: false, message: 'Alarm not found' });
    }

    const distanceMeters = threshold === '200m' ? 180 : threshold === '500m' ? 480 : 1950;
    const severity = threshold === '200m' ? 'critical' : threshold === '500m' ? 'warning' : 'info';
    const message = `[TEST SIMULATION] Destination alarm triggered for ${alarm.targetStopName} (${threshold} threshold)!`;

    try {
      const io = getIO();
      io.to(`user_${alarm.userId}`).emit('destination_alarm', {
        alarmId: alarm.id,
        bookingId: alarm.bookingId,
        busId: alarm.schedule.bus.id,
        busNumber: alarm.schedule.bus.busNumber,
        threshold,
        distanceMeters,
        targetStopName: alarm.targetStopName,
        timestamp: new Date().toISOString(),
        message,
        severity,
      });
    } catch {}

    res.json({ success: true, message: `Emitted test alarm for ${threshold}` });
  } catch (error) {
    next(error);
  }
};

export const simulateDistanceSchema = z.object({
  distanceMeters: z.number().min(0, 'Distance must be non-negative'),
});

export const simulateDistanceTest = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const id = req.params.id as string;
    const { distanceMeters } = req.body;

    const alarm = await prisma.destinationAlarm.findUnique({
      where: { id },
      include: { schedule: { include: { bus: true } } },
    });

    if (!alarm) {
      return res.status(404).json({ success: false, message: 'Alarm not found' });
    }

    // Role-based security check: only the owner or an admin can run distance simulations
    if (req.user.role !== 'ADMIN' && alarm.userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied: unauthorized user' });
    }

    const busInfo = {
      busId: alarm.schedule.bus.id,
      busNumber: alarm.schedule.bus.busNumber,
    };

    // Evaluate distance with strict duplicate prevention and zero booking mutation
    const result = await evaluateAlarmForDistance(alarm, distanceMeters, busInfo, true);

    res.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
