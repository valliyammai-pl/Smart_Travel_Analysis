import {
  PrismaClient,
  Role,
  BusType,
  BusStatus,
  ScheduleStatus,
  BookingStatus,
  AlarmStatus,
  NotificationType,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DIRECT_URL or DATABASE_URL must be set to run database seed.');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const isProduction = process.env.NODE_ENV === 'production';
  console.log(`🌱 Starting database seed (Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'})...`);

  // 1. Cleaning records is ONLY permitted in development if explicit RESET_DB=true is specified
  if (!isProduction && process.env.RESET_DB === 'true') {
    console.log('🧹 RESET_DB=true detected in development: clearing existing records...');
    await prisma.notification.deleteMany();
    await prisma.destinationAlarm.deleteMany();
    await prisma.busGpsLog.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.seat.deleteMany();
    await prisma.schedule.deleteMany();
    await prisma.routeStop.deleteMany();
    await prisma.route.deleteMany();
    await prisma.bus.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Cleaned previous records');
  } else {
    console.log('🛡️ Idempotent seeding active: preserving all existing data.');
  }

  // 2. Initial Administrator Setup
  const existingAdmin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
  });

  if (existingAdmin) {
    console.log(`ℹ️ Existing administrator detected (${existingAdmin.email}); preserving account.`);
  } else {
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || (!isProduction ? 'admin@smarttravel.com' : '');
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || (!isProduction ? 'Admin@1234' : '');

    if (adminEmail && adminPassword) {
      const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
      await prisma.user.upsert({
        where: { email: adminEmail },
        update: { role: Role.ADMIN },
        create: {
          email: adminEmail,
          password: adminPasswordHash,
          name: 'System Administrator',
          phone: '+91 98765 43210',
          role: Role.ADMIN,
        },
      });
      console.log(`✅ Administrator account configured for: ${adminEmail}`);
    } else {
      console.warn(
        '⚠️ No administrator account exists and INITIAL_ADMIN_EMAIL / INITIAL_ADMIN_PASSWORD were not provided. Skipping administrator creation.'
      );
    }
  }

  // 3. Demo Passengers (created in development or when explicitly requested)
  let demoUser: any = null;
  let demoUser2: any = null;

  if (!isProduction || process.env.SEED_DEMO_USERS === 'true') {
    const devPassword = process.env.DEV_USER_PASSWORD || 'User@1234';
    const userPasswordHash = await bcrypt.hash(devPassword, 10);

    demoUser = await prisma.user.upsert({
      where: { email: 'user@smarttravel.com' },
      update: {},
      create: {
        email: 'user@smarttravel.com',
        password: userPasswordHash,
        name: 'Priya Sharma',
        phone: '+91 98765 12345',
        role: Role.USER,
      },
    });

    demoUser2 = await prisma.user.upsert({
      where: { email: 'sarah@smarttravel.com' },
      update: {},
      create: {
        email: 'sarah@smarttravel.com',
        password: userPasswordHash,
        name: 'Sarah Jenkins',
        phone: '+91 91234 56789',
        role: Role.USER,
      },
    });

    console.log('✅ Demo passengers verified / created');
  }

  // 4. Create or Upsert Buses
  const bus1 = await prisma.bus.upsert({
    where: { busNumber: 'ST-101' },
    update: {},
    create: {
      busNumber: 'ST-101',
      operator: 'Lavender Royal Line',
      type: BusType.AC_SLEEPER,
      totalSeats: 30,
      currentLat: 12.9246,
      currentLng: 79.1350,
      speed: 68.5,
      heading: 82.0,
      isSimulating: true,
      status: BusStatus.IN_TRANSIT,
      lastUpdated: new Date(),
    },
  });

  const bus2 = await prisma.bus.upsert({
    where: { busNumber: 'ST-202' },
    update: {},
    create: {
      busNumber: 'ST-202',
      operator: 'Purple Horizon Express',
      type: BusType.AC_SEATER,
      totalSeats: 36,
      currentLat: 18.7557,
      currentLng: 73.4091,
      speed: 74.0,
      heading: 135.0,
      isSimulating: true,
      status: BusStatus.IN_TRANSIT,
      lastUpdated: new Date(),
    },
  });

  const bus3 = await prisma.bus.upsert({
    where: { busNumber: 'ST-303' },
    update: {},
    create: {
      busNumber: 'ST-303',
      operator: 'Deccan Cruiser',
      type: BusType.DELUXE_EXPRESS,
      totalSeats: 32,
      currentLat: 15.8281,
      currentLng: 78.0373,
      speed: 78.2,
      heading: 195.0,
      isSimulating: true,
      status: BusStatus.IN_TRANSIT,
      lastUpdated: new Date(),
    },
  });

  const bus4 = await prisma.bus.upsert({
    where: { busNumber: 'ST-404' },
    update: {},
    create: {
      busNumber: 'ST-404',
      operator: 'Metro Commute',
      type: BusType.NON_AC_SEATER,
      totalSeats: 40,
      currentLat: 12.9778,
      currentLng: 77.5726,
      speed: 0,
      heading: 0,
      isSimulating: false,
      status: BusStatus.ON_TIME,
      lastUpdated: new Date(),
    },
  });

  console.log('✅ Bus fleet verified / created');

  // 5. Create Routes & Stops
  let route1 = await prisma.route.findFirst({
    where: { routeName: 'Bangalore to Chennai Express' },
    include: { stops: true },
  });

  if (!route1) {
    route1 = await prisma.route.create({
      data: {
        routeName: 'Bangalore to Chennai Express',
        source: 'Bangalore (Majestic)',
        destination: 'Chennai (Koyambedu)',
        totalDistanceKm: 345,
        estimatedMinutes: 360,
        stops: {
          create: [
            { stopName: 'Majestic Central, Bangalore', stopOrder: 0, latitude: 12.9778, longitude: 77.5726, distanceFromSourceKm: 0, estimatedMinutesFromSource: 0 },
            { stopName: 'Electronic City Toll, Bangalore', stopOrder: 1, latitude: 12.8452, longitude: 77.6602, distanceFromSourceKm: 22, estimatedMinutesFromSource: 35 },
            { stopName: 'Hosur Bus Station', stopOrder: 2, latitude: 12.7356, longitude: 77.8281, distanceFromSourceKm: 45, estimatedMinutesFromSource: 65 },
            { stopName: 'Krishnagiri Bypass', stopOrder: 3, latitude: 12.5266, longitude: 78.2144, distanceFromSourceKm: 98, estimatedMinutesFromSource: 120 },
            { stopName: 'Vellore Old Bus Stand', stopOrder: 4, latitude: 12.9246, longitude: 79.1350, distanceFromSourceKm: 215, estimatedMinutesFromSource: 220 },
            { stopName: 'Sriperumbudur Junction', stopOrder: 5, latitude: 12.9692, longitude: 79.9443, distanceFromSourceKm: 305, estimatedMinutesFromSource: 310 },
            { stopName: 'Koyambedu Bus Terminus, Chennai', stopOrder: 6, latitude: 13.0694, longitude: 80.1948, distanceFromSourceKm: 345, estimatedMinutesFromSource: 360 },
          ],
        },
      },
      include: { stops: true },
    });
  }

  let route2 = await prisma.route.findFirst({
    where: { routeName: 'Mumbai to Pune Superfast' },
    include: { stops: true },
  });

  if (!route2) {
    route2 = await prisma.route.create({
      data: {
        routeName: 'Mumbai to Pune Superfast',
        source: 'Mumbai (Dadar)',
        destination: 'Pune (Shivajinagar)',
        totalDistanceKm: 152,
        estimatedMinutes: 180,
        stops: {
          create: [
            { stopName: 'Dadar TT Circle, Mumbai', stopOrder: 0, latitude: 19.0178, longitude: 72.8478, distanceFromSourceKm: 0, estimatedMinutesFromSource: 0 },
            { stopName: 'Vashi Highway, Navi Mumbai', stopOrder: 1, latitude: 19.0745, longitude: 72.9978, distanceFromSourceKm: 28, estimatedMinutesFromSource: 40 },
            { stopName: 'Panvel Expressway Point', stopOrder: 2, latitude: 18.9894, longitude: 73.1175, distanceFromSourceKm: 48, estimatedMinutesFromSource: 65 },
            { stopName: 'Lonavala Toll Plaza', stopOrder: 3, latitude: 18.7557, longitude: 73.4091, distanceFromSourceKm: 95, estimatedMinutesFromSource: 115 },
            { stopName: 'Wakad Bridge, Pune', stopOrder: 4, latitude: 18.5987, longitude: 73.7686, distanceFromSourceKm: 135, estimatedMinutesFromSource: 155 },
            { stopName: 'Shivajinagar Station, Pune', stopOrder: 5, latitude: 18.5314, longitude: 73.8446, distanceFromSourceKm: 152, estimatedMinutesFromSource: 180 },
          ],
        },
      },
      include: { stops: true },
    });
  }

  let route3 = await prisma.route.findFirst({
    where: { routeName: 'Hyderabad to Bangalore Highway Liner' },
    include: { stops: true },
  });

  if (!route3) {
    route3 = await prisma.route.create({
      data: {
        routeName: 'Hyderabad to Bangalore Highway Liner',
        source: 'Hyderabad (MGBS)',
        destination: 'Bangalore (Majestic)',
        totalDistanceKm: 570,
        estimatedMinutes: 540,
        stops: {
          create: [
            { stopName: 'MGBS Central, Hyderabad', stopOrder: 0, latitude: 17.3789, longitude: 78.4816, distanceFromSourceKm: 0, estimatedMinutesFromSource: 0 },
            { stopName: 'Shamshabad Airport Junction', stopOrder: 1, latitude: 17.2403, longitude: 78.4294, distanceFromSourceKm: 32, estimatedMinutesFromSource: 45 },
            { stopName: 'Jadcherla Toll', stopOrder: 2, latitude: 16.7644, longitude: 78.1408, distanceFromSourceKm: 95, estimatedMinutesFromSource: 105 },
            { stopName: 'Kurnool Bus Stand', stopOrder: 3, latitude: 15.8281, longitude: 78.0373, distanceFromSourceKm: 215, estimatedMinutesFromSource: 210 },
            { stopName: 'Anantapur Bypass', stopOrder: 4, latitude: 14.6819, longitude: 77.6006, distanceFromSourceKm: 360, estimatedMinutesFromSource: 340 },
            { stopName: 'Hebbal Flyover, Bangalore', stopOrder: 5, latitude: 13.0358, longitude: 77.5970, distanceFromSourceKm: 555, estimatedMinutesFromSource: 515 },
            { stopName: 'Majestic Bus Station, Bangalore', stopOrder: 6, latitude: 12.9778, longitude: 77.5726, distanceFromSourceKm: 570, estimatedMinutesFromSource: 540 },
          ],
        },
      },
      include: { stops: true },
    });
  }

  console.log('✅ Routes and Stops verified / created');

  // 6. Create Schedules & Seats
  const now = new Date();

  // Helper function to generate seats idempotently
  async function ensureSeats(scheduleId: string, count: number, basePrice: number) {
    const existingCount = await prisma.seat.count({ where: { scheduleId } });
    if (existingCount >= count) return;

    const seatRows = ['A', 'B', 'C', 'D'];
    const seatsData = [];
    const rows = Math.ceil(count / 4);

    for (let r = 1; r <= rows; r++) {
      for (let s = 0; s < 4; s++) {
        if (seatsData.length >= count) break;
        const seatNum = `${r}${seatRows[s]}`;
        const isWindow = s === 0 || s === 3;
        seatsData.push({
          scheduleId,
          seatNumber: seatNum,
          seatType: isWindow ? 'WINDOW' : 'AISLE',
          price: isWindow ? basePrice + 50 : basePrice,
          isBooked: false,
        });
      }
    }

    for (const seat of seatsData) {
      await prisma.seat.upsert({
        where: {
          scheduleId_seatNumber: {
            scheduleId: seat.scheduleId,
            seatNumber: seat.seatNumber,
          },
        },
        update: {},
        create: seat,
      });
    }
  }

  // Schedule 1: Bus 1 on Route 1
  let schedule1 = await prisma.schedule.findFirst({
    where: { busId: bus1.id, routeId: route1.id },
  });
  if (!schedule1) {
    schedule1 = await prisma.schedule.create({
      data: {
        busId: bus1.id,
        routeId: route1.id,
        departureTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        arrivalTime: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        fare: 850.0,
        status: ScheduleStatus.IN_PROGRESS,
      },
    });
  }
  await ensureSeats(schedule1.id, 30, 850);

  // Schedule 2: Bus 2 on Route 2
  let schedule2 = await prisma.schedule.findFirst({
    where: { busId: bus2.id, routeId: route2.id },
  });
  if (!schedule2) {
    schedule2 = await prisma.schedule.create({
      data: {
        busId: bus2.id,
        routeId: route2.id,
        departureTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        arrivalTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        fare: 450.0,
        status: ScheduleStatus.IN_PROGRESS,
      },
    });
  }
  await ensureSeats(schedule2.id, 36, 450);

  // Schedule 3: Bus 3 on Route 3
  let schedule3 = await prisma.schedule.findFirst({
    where: { busId: bus3.id, routeId: route3.id },
  });
  if (!schedule3) {
    schedule3 = await prisma.schedule.create({
      data: {
        busId: bus3.id,
        routeId: route3.id,
        departureTime: new Date(now.getTime() + 5 * 60 * 60 * 1000),
        arrivalTime: new Date(now.getTime() + 14 * 60 * 60 * 1000),
        fare: 1250.0,
        status: ScheduleStatus.SCHEDULED,
      },
    });
  }
  await ensureSeats(schedule3.id, 32, 1250);

  // Schedule 4: Bus 4 on Route 1
  let schedule4 = await prisma.schedule.findFirst({
    where: { busId: bus4.id, routeId: route1.id },
  });
  if (!schedule4) {
    schedule4 = await prisma.schedule.create({
      data: {
        busId: bus4.id,
        routeId: route1.id,
        departureTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        arrivalTime: new Date(now.getTime() + 30 * 60 * 60 * 1000),
        fare: 550.0,
        status: ScheduleStatus.SCHEDULED,
      },
    });
  }
  await ensureSeats(schedule4.id, 40, 550);

  console.log('✅ Schedules and seats verified / created');

  // 7. Seed Demo Bookings and Alarms in Development Mode
  if (!isProduction && demoUser && demoUser2) {
    // Check if demo bookings exist
    let booking1 = await prisma.booking.findUnique({
      where: { bookingReference: 'BK-ST8921' },
    });

    if (!booking1) {
      // Mark seat 1A as booked
      await prisma.seat.updateMany({
        where: { scheduleId: schedule1.id, seatNumber: '1A' },
        data: { isBooked: true },
      });

      booking1 = await prisma.booking.create({
        data: {
          bookingReference: 'BK-ST8921',
          userId: demoUser.id,
          scheduleId: schedule1.id,
          seatNumbers: ['1A'],
          totalAmount: 900.0,
          status: BookingStatus.CONFIRMED,
          passengerName: 'Priya Sharma',
          passengerEmail: 'user@smarttravel.com',
          passengerPhone: '+91 98765 12345',
          pickupStop: 'Majestic Central, Bangalore',
          dropoffStop: 'Koyambedu Bus Terminus, Chennai',
          bookingDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        },
      });
    }

    let booking2 = await prisma.booking.findUnique({
      where: { bookingReference: 'BK-ST4512' },
    });

    if (!booking2) {
      await prisma.seat.updateMany({
        where: { scheduleId: schedule1.id, seatNumber: '1B' },
        data: { isBooked: true },
      });

      booking2 = await prisma.booking.create({
        data: {
          bookingReference: 'BK-ST4512',
          userId: demoUser2.id,
          scheduleId: schedule1.id,
          seatNumbers: ['1B'],
          totalAmount: 850.0,
          status: BookingStatus.CONFIRMED,
          passengerName: 'Sarah Jenkins',
          passengerEmail: 'sarah@smarttravel.com',
          passengerPhone: '+91 91234 56789',
          pickupStop: 'Electronic City Toll, Bangalore',
          dropoffStop: 'Vellore Old Bus Stand',
          bookingDate: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        },
      });
    }

    // Destination Alarm for demo user
    const existingAlarm = await prisma.destinationAlarm.findFirst({
      where: { userId: demoUser.id, scheduleId: schedule1.id },
    });

    if (!existingAlarm) {
      await prisma.destinationAlarm.create({
        data: {
          userId: demoUser.id,
          bookingId: booking1.id,
          scheduleId: schedule1.id,
          targetLatitude: 13.0694,
          targetLongitude: 80.1948,
          targetStopName: 'Koyambedu Bus Terminus, Chennai',
          threshold2kmTriggered: false,
          threshold500mTriggered: false,
          threshold200mTriggered: false,
          status: AlarmStatus.ACTIVE,
        },
      });
    }

    // Notifications
    const existingNotifs = await prisma.notification.count({ where: { userId: demoUser.id } });
    if (existingNotifs === 0) {
      await prisma.notification.createMany({
        data: [
          {
            userId: demoUser.id,
            title: 'Booking Confirmed!',
            message: 'Your seat 1A on Bangalore to Chennai Express (ST-101) is confirmed. Reference: BK-ST8921.',
            type: NotificationType.BOOKING_CONFIRMED,
            isRead: false,
            metadata: { bookingReference: 'BK-ST8921' },
          },
          {
            userId: demoUser.id,
            title: 'Smart Alarm Enabled',
            message: 'Destination alarm activated for Koyambedu Bus Terminus, Chennai. You will be alerted at 2 km, 500 m, and 200 m.',
            type: NotificationType.SYSTEM,
            isRead: false,
          },
        ],
      });
    }

    console.log('✅ Demo bookings & alarms verified in development mode');
  }

  console.log('\n🎉 Database seed completed idempotently!');
  if (!isProduction) {
    console.log('ℹ️ Development mode: local test accounts are ready.');
  } else {
    console.log('ℹ️ Production mode: records preserved, no secret keys or passwords exposed.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
