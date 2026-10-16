import { AlarmStatus, NotificationType } from '@prisma/client';
import { prisma } from '../config/db';
import { getIO } from '../socket';
import { haversineDistanceMeters } from '../utils/geo';

export interface AlarmTriggerPayload {
  alarmId: string;
  bookingId?: string | null;
  busId: string;
  busNumber: string;
  threshold: '2km' | '500m' | '200m';
  distanceMeters: number;
  targetStopName: string;
  timestamp: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  isSimulated?: boolean;
}

export interface AlarmEvaluationResult {
  alarmId: string;
  distanceMeters: number;
  triggered: boolean;
  threshold?: '2km' | '500m' | '200m';
  duplicatePrevented: boolean;
  targetStopName: string;
  message: string;
  severity?: 'info' | 'warning' | 'critical';
  isSimulated: boolean;
  previousThresholds: {
    threshold2km: boolean;
    threshold500m: boolean;
    threshold200m: boolean;
  };
  currentThresholds: {
    threshold2km: boolean;
    threshold500m: boolean;
    threshold200m: boolean;
  };
}

/**
 * Pure evaluation function for destination alarm threshold detection.
 * Enforces strict single-trigger per stage, duplicate suppression,
 * and zero booking mutation.
 */
export async function evaluateAlarmForDistance(
  alarm: {
    id: string;
    userId: string;
    bookingId?: string | null;
    targetStopName: string;
    threshold2kmTriggered: boolean;
    threshold500mTriggered: boolean;
    threshold200mTriggered: boolean;
    status: AlarmStatus;
  },
  distanceMeters: number,
  busInfo: {
    busId: string;
    busNumber: string;
  },
  isSimulation: boolean = false
): Promise<AlarmEvaluationResult> {
  const previousThresholds = {
    threshold2km: alarm.threshold2kmTriggered,
    threshold500m: alarm.threshold500mTriggered,
    threshold200m: alarm.threshold200mTriggered,
  };

  let io: any = null;
  try {
    io = getIO();
  } catch {}

  // 1. Stage 3: <= 200m (Arrival Threshold - Highest Priority)
  if (distanceMeters <= 200) {
    if (alarm.threshold200mTriggered) {
      return {
        alarmId: alarm.id,
        distanceMeters,
        triggered: false,
        threshold: '200m',
        duplicatePrevented: true,
        targetStopName: alarm.targetStopName,
        message: `200m arrival threshold already triggered. Duplicate suppressed.`,
        severity: 'critical',
        isSimulated: isSimulation,
        previousThresholds,
        currentThresholds: previousThresholds,
      };
    }

    // Trigger Stage 3
    await prisma.destinationAlarm.update({
      where: { id: alarm.id },
      data: {
        threshold200mTriggered: true,
        threshold500mTriggered: true,
        threshold2kmTriggered: true,
        status: AlarmStatus.TRIGGERED,
      },
    });

    const prefix = isSimulation ? '[TEST MODE] ' : '';
    const message = `${prefix}🚨 Arrived! You are within 200 meters of ${alarm.targetStopName}. Please prepare to disembark!`;

    await prisma.notification.create({
      data: {
        userId: alarm.userId,
        title: `${prefix}Arrived at ${alarm.targetStopName}!`,
        message,
        type: NotificationType.ALARM_200M,
        metadata: {
          alarmId: alarm.id,
          busNumber: busInfo.busNumber,
          distanceMeters,
          stopName: alarm.targetStopName,
          isSimulated: isSimulation,
        },
      },
    });

    const payload: AlarmTriggerPayload = {
      alarmId: alarm.id,
      bookingId: alarm.bookingId,
      busId: busInfo.busId,
      busNumber: busInfo.busNumber,
      threshold: '200m',
      distanceMeters,
      targetStopName: alarm.targetStopName,
      timestamp: new Date().toISOString(),
      message,
      severity: 'critical',
      isSimulated: isSimulation,
    };

    if (io) {
      io.to(`user_${alarm.userId}`).emit('destination_alarm', payload);
      io.to(`bus_${busInfo.busId}`).emit('destination_alarm_broadcast', payload);
    }

    return {
      alarmId: alarm.id,
      distanceMeters,
      triggered: true,
      threshold: '200m',
      duplicatePrevented: false,
      targetStopName: alarm.targetStopName,
      message,
      severity: 'critical',
      isSimulated: isSimulation,
      previousThresholds,
      currentThresholds: {
        threshold2km: true,
        threshold500m: true,
        threshold200m: true,
      },
    };
  }

  // 2. Stage 2: <= 500m (Warning Threshold)
  if (distanceMeters <= 500) {
    if (alarm.threshold500mTriggered) {
      return {
        alarmId: alarm.id,
        distanceMeters,
        triggered: false,
        threshold: '500m',
        duplicatePrevented: true,
        targetStopName: alarm.targetStopName,
        message: `500m threshold already triggered. Duplicate suppressed.`,
        severity: 'warning',
        isSimulated: isSimulation,
        previousThresholds,
        currentThresholds: previousThresholds,
      };
    }

    // Trigger Stage 2
    await prisma.destinationAlarm.update({
      where: { id: alarm.id },
      data: {
        threshold500mTriggered: true,
        threshold2kmTriggered: true,
      },
    });

    const prefix = isSimulation ? '[TEST MODE] ' : '';
    const message = `${prefix}⚠️ Destination close! Only 500 meters remaining to ${alarm.targetStopName}. Gather your belongings.`;

    await prisma.notification.create({
      data: {
        userId: alarm.userId,
        title: `${prefix}Approaching ${alarm.targetStopName} (500m)`,
        message,
        type: NotificationType.ALARM_500M,
        metadata: {
          alarmId: alarm.id,
          busNumber: busInfo.busNumber,
          distanceMeters,
          stopName: alarm.targetStopName,
          isSimulated: isSimulation,
        },
      },
    });

    const payload: AlarmTriggerPayload = {
      alarmId: alarm.id,
      bookingId: alarm.bookingId,
      busId: busInfo.busId,
      busNumber: busInfo.busNumber,
      threshold: '500m',
      distanceMeters,
      targetStopName: alarm.targetStopName,
      timestamp: new Date().toISOString(),
      message,
      severity: 'warning',
      isSimulated: isSimulation,
    };

    if (io) {
      io.to(`user_${alarm.userId}`).emit('destination_alarm', payload);
    }

    return {
      alarmId: alarm.id,
      distanceMeters,
      triggered: true,
      threshold: '500m',
      duplicatePrevented: false,
      targetStopName: alarm.targetStopName,
      message,
      severity: 'warning',
      isSimulated: isSimulation,
      previousThresholds,
      currentThresholds: {
        threshold2km: true,
        threshold500m: true,
        threshold200m: false,
      },
    };
  }

  // 3. Stage 1: <= 2000m (2 km Wake-Up Threshold)
  if (distanceMeters <= 2000) {
    if (alarm.threshold2kmTriggered) {
      return {
        alarmId: alarm.id,
        distanceMeters,
        triggered: false,
        threshold: '2km',
        duplicatePrevented: true,
        targetStopName: alarm.targetStopName,
        message: `2km threshold already triggered. Duplicate suppressed.`,
        severity: 'info',
        isSimulated: isSimulation,
        previousThresholds,
        currentThresholds: previousThresholds,
      };
    }

    // Trigger Stage 1
    await prisma.destinationAlarm.update({
      where: { id: alarm.id },
      data: {
        threshold2kmTriggered: true,
      },
    });

    const prefix = isSimulation ? '[TEST MODE] ' : '';
    const message = `${prefix}🔔 Wake Up Alarm: Bus is 2 km from your stop (${alarm.targetStopName}). Prepare to get ready!`;

    await prisma.notification.create({
      data: {
        userId: alarm.userId,
        title: `${prefix}2 km to ${alarm.targetStopName}`,
        message,
        type: NotificationType.ALARM_2KM,
        metadata: {
          alarmId: alarm.id,
          busNumber: busInfo.busNumber,
          distanceMeters,
          stopName: alarm.targetStopName,
          isSimulated: isSimulation,
        },
      },
    });

    const payload: AlarmTriggerPayload = {
      alarmId: alarm.id,
      bookingId: alarm.bookingId,
      busId: busInfo.busId,
      busNumber: busInfo.busNumber,
      threshold: '2km',
      distanceMeters,
      targetStopName: alarm.targetStopName,
      timestamp: new Date().toISOString(),
      message,
      severity: 'info',
      isSimulated: isSimulation,
    };

    if (io) {
      io.to(`user_${alarm.userId}`).emit('destination_alarm', payload);
    }

    return {
      alarmId: alarm.id,
      distanceMeters,
      triggered: true,
      threshold: '2km',
      duplicatePrevented: false,
      targetStopName: alarm.targetStopName,
      message,
      severity: 'info',
      isSimulated: isSimulation,
      previousThresholds,
      currentThresholds: {
        threshold2km: true,
        threshold500m: false,
        threshold200m: false,
      },
    };
  }

  // 4. Distance > 2000m: Outside all threshold zones
  return {
    alarmId: alarm.id,
    distanceMeters,
    triggered: false,
    duplicatePrevented: false,
    targetStopName: alarm.targetStopName,
    message: `Distance ${distanceMeters}m is outside all configured alert thresholds (>2000m). No alert required.`,
    isSimulated: isSimulation,
    previousThresholds,
    currentThresholds: previousThresholds,
  };
}

/**
 * Checks all active alarms for buses during real-time GPS simulation
 */
export async function checkAlarmsForBus(
  busId: string,
  busNumber: string,
  currentLat: number,
  currentLng: number
) {
  try {
    const activeAlarms = await prisma.destinationAlarm.findMany({
      where: {
        status: AlarmStatus.ACTIVE,
        schedule: {
          busId,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        },
      },
    });

    if (activeAlarms.length === 0) return;

    for (const alarm of activeAlarms) {
      const distanceMeters = haversineDistanceMeters(
        currentLat,
        currentLng,
        alarm.targetLatitude,
        alarm.targetLongitude
      );

      await evaluateAlarmForDistance(
        alarm,
        distanceMeters,
        { busId, busNumber },
        false
      );
    }
  } catch (err) {
    console.error('Error checking destination alarms:', err);
  }
}
