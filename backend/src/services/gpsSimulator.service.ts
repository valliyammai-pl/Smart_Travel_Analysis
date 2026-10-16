import { prisma } from '../config/db';
import { getIO } from '../socket';
import {
  haversineDistanceKm,
  calculateBearing,
  interpolatePosition,
  calculateETA,
} from '../utils/geo';
import { checkAlarmsForBus } from './alarm.service';
import { SimulatedBusLocation } from '../types';

interface BusSimulatorState {
  currentStopIndex: number;
  fraction: number;
  direction: 'FORWARD' | 'REVERSE';
}

const simulatorStateMap = new Map<string, BusSimulatorState>();
let simulationInterval: NodeJS.Timeout | null = null;
let tickCount = 0;

export async function tickSimulation() {
  try {
    tickCount++;
    let io: any;
    try {
      io = getIO();
    } catch {
      return;
    }

    // Find all buses marked for simulation
    const buses = await prisma.bus.findMany({
      where: { isSimulating: true },
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
          take: 1,
        },
      },
    });

    for (const bus of buses) {
      const schedule = bus.schedules[0];
      if (!schedule || !schedule.route.stops || schedule.route.stops.length < 2) {
        continue;
      }

      const stops = schedule.route.stops;
      let state = simulatorStateMap.get(bus.id);

      if (!state) {
        // Initialize state based on closest stop to bus's current location or stop 0
        let closestIndex = 0;
        if (bus.currentLat && bus.currentLng) {
          let minDistance = Infinity;
          stops.forEach((stop, idx) => {
            const dist = haversineDistanceKm(bus.currentLat!, bus.currentLng!, stop.latitude, stop.longitude);
            if (dist < minDistance) {
              minDistance = dist;
              closestIndex = idx;
            }
          });
        }
        state = {
          currentStopIndex: Math.min(closestIndex, stops.length - 2),
          fraction: 0.1,
          direction: 'FORWARD',
        };
        simulatorStateMap.set(bus.id, state);
      }

      const stopA = stops[state.currentStopIndex];
      const stopB = stops[state.currentStopIndex + 1];

      if (!stopA || !stopB) {
        state.currentStopIndex = 0;
        state.fraction = 0;
        continue;
      }

      // Progress forward along the segment
      // Segment distance in km
      const segmentDist = haversineDistanceKm(stopA.latitude, stopA.longitude, stopB.latitude, stopB.longitude);
      // Realistic speed between 45 and 75 km/h, with occasional traffic slow down
      const baseSpeed = 60 + Math.sin(tickCount + bus.busNumber.charCodeAt(0)) * 15;
      const speed = Math.max(30, Math.min(85, Math.round(baseSpeed * 10) / 10));

      // In 3 seconds at `speed` km/h, distance traveled is speed * (3/3600) km
      const distancePerTick = speed * (3 / 3600);
      const fractionStep = segmentDist > 0 ? distancePerTick / segmentDist : 0.05;

      state.fraction += fractionStep;

      // When reaching next stop
      if (state.fraction >= 1.0) {
        state.fraction = 0;
        if (state.currentStopIndex + 2 < stops.length) {
          state.currentStopIndex++;
        } else {
          // Reached the final destination stop! Reset to start to continue continuous simulation
          state.currentStopIndex = 0;
        }
      }

      // Calculate current interpolated position
      const fromCoord = { lat: stopA.latitude, lng: stopA.longitude };
      const toCoord = { lat: stopB.latitude, lng: stopB.longitude };
      const currentPos = interpolatePosition(fromCoord, toCoord, state.fraction);
      const heading = calculateBearing(fromCoord.lat, fromCoord.lng, toCoord.lat, toCoord.lng);

      // Distance and ETA to next stop
      const distToNextStopKm = haversineDistanceKm(currentPos.lat, currentPos.lng, stopB.latitude, stopB.longitude);
      const etaToNextStopMins = calculateETA(distToNextStopKm, speed);

      // Distance and ETA to final destination stop
      const finalStop = stops[stops.length - 1];
      const distToFinalKm = haversineDistanceKm(currentPos.lat, currentPos.lng, finalStop.latitude, finalStop.longitude);
      const etaToFinalMins = calculateETA(distToFinalKm, speed);

      // Update bus in PostgreSQL database
      await prisma.bus.update({
        where: { id: bus.id },
        data: {
          currentLat: currentPos.lat,
          currentLng: currentPos.lng,
          speed,
          heading,
          lastUpdated: new Date(),
        },
      });

      // Periodically record GPS log (every 10 ticks = 30 seconds)
      if (tickCount % 10 === 0) {
        await prisma.busGpsLog.create({
          data: {
            busId: bus.id,
            latitude: currentPos.lat,
            longitude: currentPos.lng,
            speed,
            heading,
          },
        }).catch(() => {});
      }

      // Check destination alarms for all users with bookings/alarms on this bus
      await checkAlarmsForBus(bus.id, bus.busNumber, currentPos.lat, currentPos.lng);

      // Broadcast real-time location payload with clear simulation labelling
      const locationPayload: SimulatedBusLocation = {
        busId: bus.id,
        busNumber: bus.busNumber,
        latitude: currentPos.lat,
        longitude: currentPos.lng,
        speed,
        heading,
        status: bus.status,
        isSimulated: true,
        dataSource: 'GPS_SIMULATOR',
        timestamp: new Date().toISOString(),
        nextStopName: stopB.stopName,
        distanceToNextStopKm: distToNextStopKm,
        etaToNextStopMinutes: etaToNextStopMins,
        finalDestinationName: finalStop.stopName,
        distanceToDestinationKm: distToFinalKm,
        etaToDestinationMinutes: etaToFinalMins,
        completedStopsCount: state.currentStopIndex + 1,
        totalStopsCount: stops.length,
      };

      // Emit to rooms
      io.to('all_buses').emit('bus_location_update', locationPayload);
      io.to(`bus_${bus.id}`).emit('bus_location_update', locationPayload);
    }
  } catch (error) {
    console.error('Error in tickSimulation:', error);
  }
}

export function startGpsSimulator(intervalMs: number = 3000) {
  if (simulationInterval) {
    clearInterval(simulationInterval);
  }
  console.log(`🛰️ GPS Simulator running every ${intervalMs}ms (Simulation Mode: ON, clearly labeled)`);
  simulationInterval = setInterval(tickSimulation, intervalMs);
}

export function stopGpsSimulator() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    console.log('🛑 GPS Simulator stopped');
  }
}
