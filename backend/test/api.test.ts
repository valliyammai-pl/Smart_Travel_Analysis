import http from 'http';
import createApp from '../src/app';
import { prisma } from '../src/config/db';

async function runTests() {
  console.log('🧪 Starting SmartTravel API Test Suite...\n');
  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(5099, () => {
      resolve();
    });
  });

  const baseUrl = 'http://localhost:5099/api';
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
  let adminToken = '';
  let scheduleId = '';
  let createdBookingId = '';
  let createdAlarmId = '';

  try {
    // 1. Health check
    await test('Health check endpoint', async () => {
      const res = await fetch(`${baseUrl}/health`);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const data = await res.json();
      if (data.status !== 'healthy') throw new Error('Expected status to be healthy');
    });

    // 2. User login
    await test('User authentication (login)', async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@smarttravel.com',
          password: 'User@1234',
        }),
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (!data.data.token) throw new Error('No token returned');
      userToken = data.data.token;
    });

    // 3. Admin login
    await test('Admin authentication (login)', async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@smarttravel.com',
          password: 'Admin@1234',
        }),
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (data.data.user.role !== 'ADMIN') throw new Error('User is not admin');
      adminToken = data.data.token;
    });

    // 4. Fetch buses
    await test('Fetch all buses', async () => {
      const res = await fetch(`${baseUrl}/buses`);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data.data) || data.data.length === 0) throw new Error('No buses found');
    });

    // 5. Fetch routes
    await test('Fetch all routes with stops', async () => {
      const res = await fetch(`${baseUrl}/routes`);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data.data) || data.data.length === 0) throw new Error('No routes found');
      if (data.data[0].stops.length === 0) throw new Error('Route has no stops');
    });

    // 6. Search schedules
    await test('Search schedules and verify seat availability', async () => {
      const res = await fetch(`${baseUrl}/schedules`);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data.data) || data.data.length === 0) throw new Error('No schedules found');
      const item = data.data[0];
      scheduleId = item.id;
      if (typeof item.availableSeats !== 'number') throw new Error('availableSeats calculation missing');
    });

    // 7. Get schedule seat map
    await test('Get schedule details with real-time seat matrix', async () => {
      const res = await fetch(`${baseUrl}/schedules/${scheduleId}`);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (!data.data.seats || data.data.seats.length === 0) throw new Error('No seats returned in schedule');
    });

    // 8. Create booking
    await test('Create booking with seat reservation and alarm option', async () => {
      const res = await fetch(`${baseUrl}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          scheduleId,
          seatNumbers: ['3A'],
          passengerName: 'Test Traveler',
          passengerEmail: 'traveler@test.com',
          passengerPhone: '+91 99999 88888',
          enableAlarm: true,
          dropoffStop: 'Koyambedu Bus Terminus, Chennai',
        }),
      });
      if (res.status !== 201) {
        const errText = await res.text();
        throw new Error(`Booking failed (${res.status}): ${errText}`);
      }
      const data = await res.json();
      createdBookingId = data.data.id;
      if (!data.data.bookingReference) throw new Error('No booking reference');
    });

    // 9. Fetch user bookings
    await test('Fetch user booking history', async () => {
      const res = await fetch(`${baseUrl}/bookings/my-bookings`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      const found = data.data.find((b: any) => b.id === createdBookingId);
      if (!found) throw new Error('Newly created booking not found in user history');
    });

    // 10. Destination alarms
    await test('Fetch active destination alarms', async () => {
      const res = await fetch(`${baseUrl}/alarms`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data.data)) throw new Error('Expected alarms array');
      if (data.data.length > 0) {
        createdAlarmId = data.data[0].id;
      }
    });

    // 11. Test alarm trigger simulation
    if (createdAlarmId) {
      await test('Simulate test threshold trigger for alarm (2km, 500m, 200m)', async () => {
        const res = await fetch(`${baseUrl}/alarms/${createdAlarmId}/test-trigger`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({ threshold: '500m' }),
        });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
      });
    }

    // 12. Cancel booking and release seats
    await test('Cancel booking and verify seat release', async () => {
      const res = await fetch(`${baseUrl}/bookings/${createdBookingId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}`);

      // Verify seat 3A is released in schedule
      const schedRes = await fetch(`${baseUrl}/schedules/${scheduleId}`);
      const schedData = await schedRes.json();
      const seat3A = schedData.data.seats.find((s: any) => s.seatNumber === '3A');
      if (seat3A?.isBooked) throw new Error('Seat 3A was not released after booking cancellation');
    });

    // 13. Admin analytics
    await test('Fetch admin analytics and metrics', async () => {
      const res = await fetch(`${baseUrl}/analytics`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (typeof data.data.overview.totalRevenue !== 'number') throw new Error('Missing revenue in analytics');
      if (typeof data.data.overview.occupancyRate !== 'number') throw new Error('Missing occupancyRate');
    });

  } finally {
    server.close();
    await prisma.$disconnect();
  }

  console.log(`\n================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
