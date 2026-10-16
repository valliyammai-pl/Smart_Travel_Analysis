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
}

export async function checkAlarmsForBus(
  busId: string,
  busNumber: string,
  currentLat: number,
  currentLng: number
) {
  try {
    // 1. Find all active alarms for schedules running on this bus
    const activeAlarms = await prisma.destinationAlarm.findMany({
      where: {
        status: AlarmStatus.ACTIVE,
        schedule: {
          busId,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        booking: { select: { id: true, bookingReference: true } },
      },
    });

    if (activeAlarms.length === 0) return;

    let io: any;
    try {
      io = getIO();
    } catch {
      // Socket not yet initialized
      return;
    }

    for (const alarm of activeAlarms) {
      const distanceMeters = haversineDistanceMeters(
        currentLat,
        currentLng,
        alarm.targetLatitude,
        alarm.targetLongitude
      );

      // Check 200m arrival threshold (highest priority)
      if (distanceMeters <= 200) {
        if (!alarm.threshold200mTriggered) {
          await prisma.destinationAlarm.update({
            where: { id: alarm.id },
            data: {
              threshold200mTriggered: true,
              threshold500mTriggered: true,
              threshold2kmTriggered: true,
              status: AlarmStatus.TRIGGERED,
            },
          });

          const message = `🚨 Arrived! You are within 200 meters of ${alarm.targetStopName}. Please prepare to disembark!`;

          await prisma.notification.create({
            data: {
              userId: alarm.userId,
              title: `Arrived at ${alarm.targetStopName}!`,
              message,
              type: NotificationType.ALARM_200M,
              metadata: {
                alarmId: alarm.id,
                busNumber,
                distanceMeters,
                stopName: alarm.targetStopName,
              },
            },
          });

          const payload: AlarmTriggerPayload = {
            alarmId: alarm.id,
            bookingId: alarm.bookingId,
            busId,
            busNumber,
            threshold: '200m',
            distanceMeters,
            targetStopName: alarm.targetStopName,
            timestamp: new Date().toISOString(),
            message,
            severity: 'critical',
          };

          io.to(`user_${alarm.userId}`).emit('destination_alarm', payload);
          io.to(`bus_${busId}`).emit('destination_alarm_broadcast', payload);
        }
      }
      // Check 500m threshold
      else if (distanceMeters <= 500) {
        if (!alarm.threshold500mTriggered) {
          await prisma.destinationAlarm.update({
            where: { id: alarm.id },
            data: {
              threshold500mTriggered: true,
              threshold2kmTriggered: true,
            },
          });

          const message = `⚠️ Destination close! Only 500 meters remaining to ${alarm.targetStopName}. Gather your belongings.`;

          await prisma.notification.create({
            data: {
              userId: alarm.userId,
              title: `Approaching ${alarm.targetStopName} (500m)`,
              message,
              type: NotificationType.ALARM_500M,
              metadata: {
                alarmId: alarm.id,
                busNumber,
                distanceMeters,
                stopName: alarm.targetStopName,
              },
            },
          });

          const payload: AlarmTriggerPayload = {
            alarmId: alarm.id,
            bookingId: alarm.bookingId,
            busId,
            busNumber,
            threshold: '500m',
            distanceMeters,
            targetStopName: alarm.targetStopName,
            timestamp: new Date().toISOString(),
            message,
            severity: 'warning',
          };

          io.to(`user_${alarm.userId}`).emit('destination_alarm', payload);
        }
      }
      // Check 2km threshold
      else if (distanceMeters <= 2000) {
        if (!alarm.threshold2kmTriggered) {
          await prisma.destinationAlarm.update({
            where: { id: alarm.id },
            data: {
              threshold2kmTriggered: true,
            },
          });

          const message = `🔔 Wake Up Alarm: Bus is 2 km from your stop (${alarm.targetStopName}). Prepare to get ready!`;

          await prisma.notification.create({
            data: {
              userId: alarm.userId,
              title: `2 km to ${alarm.targetStopName}`,
              message,
              type: NotificationType.ALARM_200M ? NotificationType.ALARM_2KM : NotificationType.SYSTEM,
              metadata: {
                alarmId: alarm.id,
                busNumber,
                distanceMeters,
                stopName: alarm.targetStopName,
              },
            },
          });

          const payload: AlarmTriggerPayload = {
            alarmId: alarm.id,
            bookingId: alarm.bookingId,
            busId,
            busNumber,
            threshold: '2km',
            distanceMeters,
            targetStopName: alarm.targetStopName,
            timestamp: new Date().toISOString(),
            message,
            severity: 'info',
          };

          io.to(`user_${alarm.userId}`).emit('destination_alarm', payload);
        }
      }
    }
  } catch (err) {
    console.error('Error checking destination alarms:', err);
  }
}
