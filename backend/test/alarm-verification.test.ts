import http from 'http';
import { io as ClientSocket } from 'socket.io-client';
import createApp from '../src/app';
import { initSocket } from '../src/socket';
import { prisma } from '../src/config/db';

async function runAlarmVerificationTests() {
  console.log('🧪 Starting SmartTravel Destination Alarm End-to-End Verification Test Suite...\n');

  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);

  const TEST_PORT = 5088;
  await new Promise<void>((resolve) => {
    server.listen(TEST_PORT, () => {
      resolve();
    });
  });

  const baseUrl = `http://localhost:${TEST_PORT}/api`;
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  let userToken = '';
  let otherUserToken = '';
  let alarmId = '';
  let bookingId = '';
  let initialBookingData: any = null;
  let socketClient: any = null;

  try {
    // 1. Authenticate primary user (user@smarttravel.com)
    await test('Authenticate primary passenger', async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@smarttravel.com',
          password: 'User@1234',
        }),
      });
      const data = await res.json();
      if (!data.data?.token) throw new Error('No user token returned');
      userToken = data.data.token;
    });

    // 2. Authenticate second user (sarah@smarttravel.com)
    await test('Authenticate secondary user for RBAC isolation tests', async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'sarah@smarttravel.com',
          password: 'User@1234',
        }),
      });
      const data = await res.json();
      if (!data.data?.token) throw new Error('No second user token returned');
      otherUserToken = data.data.token;
    });

    // 3. Locate or create active alarm and associate booking for primary user
    await test('Locate or prepare active alarm and record booking state', async () => {
      const res = await fetch(`${baseUrl}/alarms`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const data = await res.json();
      if (!data.data || data.data.length === 0) {
        throw new Error('No alarm found for user@smarttravel.com');
      }
      const alarm = data.data[0];
      alarmId = alarm.id;
      bookingId = alarm.bookingId;

      // Reset alarm to pristine clean state
      await fetch(`${baseUrl}/alarms/${alarmId}/reset`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${userToken}` },
      });

      // Record booking state to verify zero booking mutation
      if (bookingId) {
        initialBookingData = await prisma.booking.findUnique({
          where: { id: bookingId },
        });
      }
    });

    // 4. Security: Unauthorized request without token
    await test('Security: Reject unauthenticated simulation requests with 401', async () => {
      const res = await fetch(`${baseUrl}/alarms/${alarmId}/simulate-distance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distanceMeters: 1500 }),
      });
      if (res.status !== 401) {
        throw new Error(`Expected 401, got ${res.status}`);
      }
    });

    // 5. Security: Cross-user authorization check
    await test('Security: Reject unauthorized user attempting to simulate another user alarm with 403', async () => {
      const res = await fetch(`${baseUrl}/alarms/${alarmId}/simulate-distance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${otherUserToken}`,
        },
        body: JSON.stringify({ distanceMeters: 1500 }),
      });
      if (res.status !== 403) {
        throw new Error(`Expected 403, got ${res.status}`);
      }
    });

    // 6. Socket.IO connection verification
    await test('Socket.IO real-time connection and room registration', async () => {
      socketClient = ClientSocket(`http://localhost:${TEST_PORT}`, {
        transports: ['websocket'],
        auth: { token: userToken },
      });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Socket connection timed out')), 4000);
        socketClient.on('connect', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    });

    // 7. Distance 2500 m: Outside geofence corridor (> 2 km)
    await test('Distance 2500 m: Verify no alarm triggered (>2 km threshold)', async () => {
      const res = await fetch(`${baseUrl}/alarms/${alarmId}/simulate-distance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ distanceMeters: 2500 }),
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const body = await res.json();
      const result = body.data;

      if (result.triggered !== false) {
        throw new Error(`Expected triggered=false at 2500m, got ${result.triggered}`);
      }
      if (result.duplicatePrevented !== false) {
        throw new Error(`Expected duplicatePrevented=false at 2500m`);
      }

      // Verify DB flags remain false
      const dbAlarm = await prisma.destinationAlarm.findUnique({ where: { id: alarmId } });
      if (dbAlarm?.threshold2kmTriggered || dbAlarm?.threshold500mTriggered || dbAlarm?.threshold200mTriggered) {
        throw new Error('Database flags prematurely set at 2500m');
      }
    });

    // 8. Distance 1500 m: Crosses 2 km threshold (<= 2000 m and > 500 m)
    await test('Distance 1500 m: Crosses 2 km threshold -> Triggers Stage 1 (2km) chime & notification', async () => {
      // Listen for socket event
      const socketPromise = new Promise<any>((resolve) => {
        socketClient.once('destination_alarm', (payload: any) => {
          resolve(payload);
        });
      });

      const res = await fetch(`${baseUrl}/alarms/${alarmId}/simulate-distance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ distanceMeters: 1500 }),
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const body = await res.json();
      const result = body.data;

      if (result.triggered !== true) {
        throw new Error(`Expected triggered=true at 1500m, got ${result.triggered}`);
      }
      if (result.threshold !== '2km') {
        throw new Error(`Expected threshold="2km", got ${result.threshold}`);
      }
      if (result.duplicatePrevented !== false) {
        throw new Error(`Expected duplicatePrevented=false for first crossing`);
      }

      // Verify Socket.IO event received
      const socketEvent = await socketPromise;
      if (socketEvent.threshold !== '2km' || socketEvent.distanceMeters !== 1500) {
        throw new Error(`Unexpected socket payload: ${JSON.stringify(socketEvent)}`);
      }

      // Verify DB alarm state
      const dbAlarm = await prisma.destinationAlarm.findUnique({ where: { id: alarmId } });
      if (!dbAlarm?.threshold2kmTriggered) {
        throw new Error('threshold2kmTriggered not set to true in PostgreSQL');
      }
      if (dbAlarm?.threshold500mTriggered || dbAlarm?.threshold200mTriggered) {
        throw new Error('Later thresholds incorrectly set at 1500m');
      }

      // Verify Notification created
      const notif = await prisma.notification.findFirst({
        where: {
          type: 'ALARM_2KM',
          metadata: { path: ['alarmId'], equals: alarmId },
        },
      });
      if (!notif) throw new Error('ALARM_2KM notification was not persisted in database');
    });

    // 9. Duplicate Prevention at 1500 m (second call)
    await test('Duplicate Prevention: Calling 1500 m a second time suppresses duplicate alarm', async () => {
      let duplicateSocketFired = false;
      const duplicateListener = () => {
        duplicateSocketFired = true;
      };
      socketClient.on('destination_alarm', duplicateListener);

      const res = await fetch(`${baseUrl}/alarms/${alarmId}/simulate-distance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ distanceMeters: 1500 }),
      });
      const body = await res.json();
      const result = body.data;

      if (result.triggered !== false) {
        throw new Error('Expected triggered=false on duplicate call');
      }
      if (result.duplicatePrevented !== true) {
        throw new Error('Expected duplicatePrevented=true on duplicate call');
      }

      // Give a moment to confirm no socket was emitted
      await new Promise((resolve) => setTimeout(resolve, 200));
      socketClient.off('destination_alarm', duplicateListener);

      if (duplicateSocketFired) {
        throw new Error('Duplicate socket event was fired!');
      }

      // Verify count of 2KM notifications in DB is exactly 1
      const count = await prisma.notification.count({
        where: {
          type: 'ALARM_2KM',
          metadata: { path: ['alarmId'], equals: alarmId },
        },
      });
      if (count !== 1) {
        throw new Error(`Expected exactly 1 notification, found ${count}`);
      }
    });

    // 10. Distance 400 m: Crosses 500 m threshold (<= 500 m and > 200 m)
    await test('Distance 400 m: Crosses 500 m threshold -> Triggers Stage 2 (500m) warning beep & notification', async () => {
      const socketPromise = new Promise<any>((resolve) => {
        socketClient.once('destination_alarm', (payload: any) => {
          resolve(payload);
        });
      });

      const res = await fetch(`${baseUrl}/alarms/${alarmId}/simulate-distance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ distanceMeters: 400 }),
      });
      const body = await res.json();
      const result = body.data;

      if (result.triggered !== true || result.threshold !== '500m') {
        throw new Error(`Expected Stage 2 trigger, got triggered=${result.triggered}, threshold=${result.threshold}`);
      }
      if (result.duplicatePrevented !== false) {
        throw new Error('Expected duplicatePrevented=false on first 500m crossing');
      }

      const socketEvent = await socketPromise;
      if (socketEvent.threshold !== '500m') {
        throw new Error(`Expected socket threshold 500m, got ${socketEvent.threshold}`);
      }

      // Verify DB state
      const dbAlarm = await prisma.destinationAlarm.findUnique({ where: { id: alarmId } });
      if (!dbAlarm?.threshold500mTriggered || !dbAlarm?.threshold2kmTriggered) {
        throw new Error('threshold500mTriggered or threshold2kmTriggered not set');
      }
      if (dbAlarm?.threshold200mTriggered) {
        throw new Error('threshold200mTriggered should still be false at 400m');
      }

      const notif = await prisma.notification.findFirst({
        where: {
          type: 'ALARM_500M',
          metadata: { path: ['alarmId'], equals: alarmId },
        },
      });
      if (!notif) throw new Error('ALARM_500M notification was not persisted');
    });

    // 11. Duplicate Prevention at 400 m and 350 m
    await test('Duplicate Prevention: Calling 400 m again suppresses duplicate 500m alarm', async () => {
      const res = await fetch(`${baseUrl}/alarms/${alarmId}/simulate-distance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ distanceMeters: 400 }),
      });
      const body = await res.json();
      const result = body.data;

      if (result.triggered !== false || result.duplicatePrevented !== true) {
        throw new Error('Failed to prevent duplicate at 400m');
      }

      const count = await prisma.notification.count({
        where: {
          type: 'ALARM_500M',
          metadata: { path: ['alarmId'], equals: alarmId },
        },
      });
      if (count !== 1) throw new Error(`Expected 1 ALARM_500M notification, found ${count}`);
    });

    // 12. Distance 150 m: Crosses 200 m threshold (<= 200 m)
    await test('Distance 150 m: Crosses 200 m threshold -> Triggers Stage 3 (200m) siren & sets TRIGGERED status', async () => {
      const socketPromise = new Promise<any>((resolve) => {
        socketClient.once('destination_alarm', (payload: any) => {
          resolve(payload);
        });
      });

      const res = await fetch(`${baseUrl}/alarms/${alarmId}/simulate-distance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ distanceMeters: 150 }),
      });
      const body = await res.json();
      const result = body.data;

      if (result.triggered !== true || result.threshold !== '200m') {
        throw new Error(`Expected Stage 3 trigger, got triggered=${result.triggered}, threshold=${result.threshold}`);
      }

      const socketEvent = await socketPromise;
      if (socketEvent.threshold !== '200m') {
        throw new Error(`Expected socket threshold 200m, got ${socketEvent.threshold}`);
      }

      const dbAlarm = await prisma.destinationAlarm.findUnique({ where: { id: alarmId } });
      if (!dbAlarm?.threshold200mTriggered || dbAlarm?.status !== 'TRIGGERED') {
        throw new Error('threshold200mTriggered not true or status not TRIGGERED');
      }

      const notif = await prisma.notification.findFirst({
        where: {
          type: 'ALARM_200M',
          metadata: { path: ['alarmId'], equals: alarmId },
        },
      });
      if (!notif) throw new Error('ALARM_200M notification was not persisted');
    });

    // 13. Duplicate Prevention at 150 m (second call)
    await test('Duplicate Prevention: Calling 150 m again suppresses duplicate arrival alarm', async () => {
      const res = await fetch(`${baseUrl}/alarms/${alarmId}/simulate-distance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ distanceMeters: 150 }),
      });
      const body = await res.json();
      const result = body.data;

      if (result.triggered !== false || result.duplicatePrevented !== true) {
        throw new Error('Failed to prevent duplicate at 150m');
      }

      const count = await prisma.notification.count({
        where: {
          type: 'ALARM_200M',
          metadata: { path: ['alarmId'], equals: alarmId },
        },
      });
      if (count !== 1) throw new Error(`Expected 1 ALARM_200M notification, found ${count}`);
    });

    // 14. Verification of Zero Booking Mutation
    await test('Data Integrity: Real bookings are never mutated by alarm simulation tests', async () => {
      if (bookingId && initialBookingData) {
        const currentBooking = await prisma.booking.findUnique({
          where: { id: bookingId },
        });

        if (currentBooking?.status !== initialBookingData.status) {
          throw new Error(`Booking status mutated! Expected ${initialBookingData.status}, got ${currentBooking?.status}`);
        }
        if (currentBooking?.totalAmount !== initialBookingData.totalAmount) {
          throw new Error('Booking totalAmount was mutated');
        }
        if (JSON.stringify(currentBooking?.seatNumbers) !== JSON.stringify(initialBookingData.seatNumbers)) {
          throw new Error('Booking seatNumbers were mutated');
        }
      }
    });

    // 15. Reset & Re-arm Verification
    await test('Reset & Re-arm: Clears all threshold flags and allows fresh re-triggering', async () => {
      const resetRes = await fetch(`${baseUrl}/alarms/${alarmId}/reset`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (resetRes.status !== 200) throw new Error(`Status ${resetRes.status}`);

      const dbAlarm = await prisma.destinationAlarm.findUnique({ where: { id: alarmId } });
      if (dbAlarm?.threshold2kmTriggered || dbAlarm?.threshold500mTriggered || dbAlarm?.threshold200mTriggered) {
        throw new Error('Threshold flags were not cleared on reset');
      }
      if (dbAlarm?.status !== 'ACTIVE') {
        throw new Error(`Status is ${dbAlarm?.status}, expected ACTIVE`);
      }

      // Test that 1500m triggers Stage 1 again after reset
      const retriggerRes = await fetch(`${baseUrl}/alarms/${alarmId}/simulate-distance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ distanceMeters: 1500 }),
      });
      const body = await retriggerRes.json();
      if (body.data?.triggered !== true || body.data?.threshold !== '2km') {
        throw new Error('Alarm failed to re-trigger after reset');
      }
    });

  } finally {
    if (socketClient) {
      socketClient.disconnect();
    }
    server.close();
    await prisma.$disconnect();
  }

  console.log(`\n========================================================`);
  console.log(`Alarm End-to-End Verification: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAlarmVerificationTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
