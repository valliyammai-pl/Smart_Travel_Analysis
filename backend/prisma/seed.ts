import { PrismaClient, Role, BusType, BusStatus, ScheduleStatus, BookingStatus, AlarmStatus, NotificationType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Clean existing records in reverse dependency order
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

  // 2. Hash passwords
  const adminPasswordHash = await bcrypt.hash('Admin@1234', 10);
  const userPasswordHash = await bcrypt.hash('User@1234', 10);

  // 3. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@smarttravel.com',
      password: adminPasswordHash,
      name: 'System Administrator',
      phone: '+91 98765 43210',
      role: Role.ADMIN,
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      email: 'user@smarttravel.com',
      password: userPasswordHash,
      name: 'Priya Sharma',
      phone: '+91 98765 12345',
      role: Role.USER,
    },
  });

  const demoUser2 = await prisma.user.create({
    data: {
      email: 'sarah@smarttravel.com',
      password: userPasswordHash,
      name: 'Sarah Jenkins',
      phone: '+91 91234 56789',
      role: Role.USER,
    },
  });

  console.log('✅ Users seeded');

  // 4. Create Buses
  const bus1 = await prisma.bus.create({
    data: {
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

  const bus2 = await prisma.bus.create({
    data: {
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

  const bus3 = await prisma.bus.create({
    data: {
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

  const bus4 = await prisma.bus.create({
    data: {
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

  console.log('✅ Buses seeded');

  // 5. Create Routes & Stops
  const route1 = await prisma.route.create({
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
  });

  const route2 = await prisma.route.create({
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
  });

  const route3 = await prisma.route.create({
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
  });

  console.log('✅ Routes and Stops seeded');

  // 6. Create Schedules
  const now = new Date();
  
  // Schedule 1: Bus 1 on Route 1 (In Progress / Active today)
  const depTime1 = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
  const arrTime1 = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours from now
  const schedule1 = await prisma.schedule.create({
    data: {
      busId: bus1.id,
      routeId: route1.id,
      departureTime: depTime1,
      arrivalTime: arrTime1,
      fare: 850.0,
      status: ScheduleStatus.IN_PROGRESS,
    },
  });

  // Schedule 2: Bus 2 on Route 2 (In Progress today)
  const depTime2 = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago
  const arrTime2 = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
  const schedule2 = await prisma.schedule.create({
    data: {
      busId: bus2.id,
      routeId: route2.id,
      departureTime: depTime2,
      arrivalTime: arrTime2,
      fare: 450.0,
      status: ScheduleStatus.IN_PROGRESS,
    },
  });

  // Schedule 3: Bus 3 on Route 3 (Scheduled tonight)
  const depTime3 = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  const arrTime3 = new Date(now.getTime() + 14 * 60 * 60 * 1000);
  const schedule3 = await prisma.schedule.create({
    data: {
      busId: bus3.id,
      routeId: route3.id,
      departureTime: depTime3,
      arrivalTime: arrTime3,
      fare: 1250.0,
      status: ScheduleStatus.SCHEDULED,
    },
  });

  // Schedule 4: Bus 4 on Route 1 (Scheduled tomorrow morning)
  const depTime4 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const arrTime4 = new Date(now.getTime() + 30 * 60 * 60 * 1000);
  const schedule4 = await prisma.schedule.create({
    data: {
      busId: bus4.id,
      routeId: route1.id,
      departureTime: depTime4,
      arrivalTime: arrTime4,
      fare: 550.0,
      status: ScheduleStatus.SCHEDULED,
    },
  });

  console.log('✅ Schedules seeded');

  // Helper function to generate seats
  async function generateSeats(scheduleId: string, count: number, basePrice: number) {
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
    await prisma.seat.createMany({ data: seatsData });
  }

  await generateSeats(schedule1.id, 30, 850);
  await generateSeats(schedule2.id, 36, 450);
  await generateSeats(schedule3.id, 32, 1250);
  await generateSeats(schedule4.id, 40, 550);

  console.log('✅ Seats generated for all schedules');

  // Mark seat 1A and 1B as booked for schedule1
  await prisma.seat.updateMany({
    where: {
      scheduleId: schedule1.id,
      seatNumber: { in: ['1A', '1B'] },
    },
    data: { isBooked: true },
  });

  // 7. Create Demo Bookings
  const booking1 = await prisma.booking.create({
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

  const booking2 = await prisma.booking.create({
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

  console.log('✅ Bookings seeded');

  // 8. Create Destination Alarm for demo user
  const alarm1 = await prisma.destinationAlarm.create({
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

  console.log('✅ Destination Alarm seeded');

  // 9. Create Notifications
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
      {
        userId: demoUser2.id,
        title: 'Booking Confirmed!',
        message: 'Your seat 1B on Bangalore to Chennai Express (ST-101) is confirmed. Reference: BK-ST4512.',
        type: NotificationType.BOOKING_CONFIRMED,
        isRead: true,
      },
    ],
  });

  console.log('✅ Notifications seeded');

  console.log('\n🎉 Seed completed successfully!');
  console.log('----------------------------------------------------');
  console.log('Admin:    admin@smarttravel.com / Admin@1234');
  console.log('User:     user@smarttravel.com / User@1234');
  console.log('User 2:   sarah@smarttravel.com / User@1234');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
