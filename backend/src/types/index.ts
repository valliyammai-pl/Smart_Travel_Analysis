import { Request } from 'express';
import { Role } from '@prisma/client';

export interface UserPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
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
