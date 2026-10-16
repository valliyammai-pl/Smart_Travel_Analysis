-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "BusType" AS ENUM ('AC_SLEEPER', 'AC_SEATER', 'NON_AC_SEATER', 'DELUXE_EXPRESS');

-- CreateEnum
CREATE TYPE "BusStatus" AS ENUM ('ON_TIME', 'DELAYED', 'IN_TRANSIT', 'COMPLETED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AlarmStatus" AS ENUM ('ACTIVE', 'TRIGGERED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ALARM_2KM', 'ALARM_500M', 'ALARM_200M', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'SCHEDULE_UPDATE', 'SYSTEM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buses" (
    "id" TEXT NOT NULL,
    "busNumber" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "type" "BusType" NOT NULL DEFAULT 'AC_SEATER',
    "totalSeats" INTEGER NOT NULL DEFAULT 36,
    "currentLat" DOUBLE PRECISION,
    "currentLng" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION DEFAULT 0,
    "heading" DOUBLE PRECISION DEFAULT 0,
    "isSimulating" BOOLEAN NOT NULL DEFAULT true,
    "status" "BusStatus" NOT NULL DEFAULT 'ON_TIME',
    "lastUpdated" TIMESTAMP(3),

    CONSTRAINT "buses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "routeName" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "totalDistanceKm" DOUBLE PRECISION NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_stops" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "stopName" TEXT NOT NULL,
    "stopOrder" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "distanceFromSourceKm" DOUBLE PRECISION NOT NULL,
    "estimatedMinutesFromSource" INTEGER NOT NULL,

    CONSTRAINT "route_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "busId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "departureTime" TIMESTAMP(3) NOT NULL,
    "arrivalTime" TIMESTAMP(3) NOT NULL,
    "fare" DOUBLE PRECISION NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seats" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "seatNumber" TEXT NOT NULL,
    "seatType" TEXT NOT NULL DEFAULT 'STANDARD',
    "price" DOUBLE PRECISION NOT NULL,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "bookingReference" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "seatNumbers" TEXT[],
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "passengerName" TEXT NOT NULL,
    "passengerEmail" TEXT NOT NULL,
    "passengerPhone" TEXT NOT NULL,
    "pickupStop" TEXT,
    "dropoffStop" TEXT,
    "bookingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destination_alarms" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT,
    "scheduleId" TEXT NOT NULL,
    "targetLatitude" DOUBLE PRECISION NOT NULL,
    "targetLongitude" DOUBLE PRECISION NOT NULL,
    "targetStopName" TEXT NOT NULL,
    "threshold2kmTriggered" BOOLEAN NOT NULL DEFAULT false,
    "threshold500mTriggered" BOOLEAN NOT NULL DEFAULT false,
    "threshold200mTriggered" BOOLEAN NOT NULL DEFAULT false,
    "status" "AlarmStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "destination_alarms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bus_gps_logs" (
    "id" TEXT NOT NULL,
    "busId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "heading" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bus_gps_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "buses_busNumber_key" ON "buses"("busNumber");

-- CreateIndex
CREATE INDEX "route_stops_routeId_stopOrder_idx" ON "route_stops"("routeId", "stopOrder");

-- CreateIndex
CREATE INDEX "schedules_busId_idx" ON "schedules"("busId");

-- CreateIndex
CREATE INDEX "schedules_routeId_idx" ON "schedules"("routeId");

-- CreateIndex
CREATE INDEX "seats_scheduleId_idx" ON "seats"("scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "seats_scheduleId_seatNumber_key" ON "seats"("scheduleId", "seatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_bookingReference_key" ON "bookings"("bookingReference");

-- CreateIndex
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");

-- CreateIndex
CREATE INDEX "bookings_scheduleId_idx" ON "bookings"("scheduleId");

-- CreateIndex
CREATE INDEX "destination_alarms_userId_idx" ON "destination_alarms"("userId");

-- CreateIndex
CREATE INDEX "destination_alarms_scheduleId_idx" ON "destination_alarms"("scheduleId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "bus_gps_logs_busId_recordedAt_idx" ON "bus_gps_logs"("busId", "recordedAt");

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_busId_fkey" FOREIGN KEY ("busId") REFERENCES "buses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seats" ADD CONSTRAINT "seats_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destination_alarms" ADD CONSTRAINT "destination_alarms_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destination_alarms" ADD CONSTRAINT "destination_alarms_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destination_alarms" ADD CONSTRAINT "destination_alarms_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus_gps_logs" ADD CONSTRAINT "bus_gps_logs_busId_fkey" FOREIGN KEY ("busId") REFERENCES "buses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

