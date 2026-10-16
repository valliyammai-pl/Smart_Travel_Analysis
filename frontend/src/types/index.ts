export type Role = 'USER' | 'ADMIN';

export type BusType = 'AC_SLEEPER' | 'AC_SEATER' | 'NON_AC_SEATER' | 'DELUXE_EXPRESS';
export type BusStatus = 'ON_TIME' | 'DELAYED' | 'IN_TRANSIT' | 'COMPLETED' | 'MAINTENANCE';
export type ScheduleStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type BookingStatus = 'CONFIRMED' | 'CANCELLED';
export type AlarmStatus = 'ACTIVE' | 'TRIGGERED' | 'DISMISSED';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: Role;
  createdAt: string;
}

export interface RouteStop {
  id: string;
  routeId: string;
  stopName: string;
  stopOrder: number;
  latitude: number;
  longitude: number;
  distanceFromSourceKm: number;
  estimatedMinutesFromSource: number;
}

export interface Route {
  id: string;
  routeName: string;
  source: string;
  destination: string;
  totalDistanceKm: number;
  estimatedMinutes: number;
  stops: RouteStop[];
}

export interface Bus {
  id: string;
  busNumber: string;
  operator: string;
  type: BusType;
  totalSeats: number;
  currentLat?: number;
  currentLng?: number;
  speed?: number;
  heading?: number;
  isSimulating: boolean;
  status: BusStatus;
  lastUpdated?: string;
  schedules?: Schedule[];
}

export interface Seat {
  id: string;
  scheduleId: string;
  seatNumber: string;
  seatType: string;
  price: number;
  isBooked: boolean;
}

export interface Schedule {
  id: string;
  busId: string;
  routeId: string;
  departureTime: string;
  arrivalTime: string;
  fare: number;
  status: ScheduleStatus;
  bus: Bus;
  route: Route;
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
  seats?: Seat[];
}

export interface DestinationAlarm {
  id: string;
  userId: string;
  bookingId?: string;
  scheduleId: string;
  targetLatitude: number;
  targetLongitude: number;
  targetStopName: string;
  threshold2kmTriggered: boolean;
  threshold500mTriggered: boolean;
  threshold200mTriggered: boolean;
  status: AlarmStatus;
  createdAt: string;
  schedule?: Schedule;
  booking?: Booking;
}

export interface Booking {
  id: string;
  bookingReference: string;
  userId: string;
  scheduleId: string;
  seatNumbers: string[];
  totalAmount: number;
  status: BookingStatus;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  pickupStop?: string;
  dropoffStop?: string;
  bookingDate: string;
  cancelledAt?: string;
  schedule: Schedule;
  alarms?: DestinationAlarm[];
  user?: { name: string; email: string };
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

export interface SimulatedBusLocation {
  busId: string;
  busNumber: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status: string;
  isSimulated: true;
  dataSource: 'GPS_SIMULATOR';
  timestamp: string;
  nextStopName?: string;
  distanceToNextStopKm?: number;
  etaToNextStopMinutes?: number;
  finalDestinationName?: string;
  distanceToDestinationKm?: number;
  etaToDestinationMinutes?: number;
  completedStopsCount?: number;
  totalStopsCount?: number;
}
