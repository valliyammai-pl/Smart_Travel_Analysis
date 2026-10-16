/**
 * Geo calculation utilities for SmartTravel GPS simulator and Destination Alarms
 */

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Calculates great-circle distance between two coordinates in kilometers using Haversine formula
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 100) / 100;
}

/**
 * Calculates distance in meters
 */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return Math.round(haversineDistanceKm(lat1, lon1, lat2, lon2) * 1000);
}

/**
 * Calculates heading/bearing between two coordinates in degrees (0 - 360)
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  const bearingRad = Math.atan2(y, x);
  const bearingDeg = (toDeg(bearingRad) + 360) % 360;
  return Math.round(bearingDeg * 10) / 10;
}

/**
 * Linearly interpolates between two geo points by fraction (0.0 to 1.0)
 */
export function interpolatePosition(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  fraction: number
): { lat: number; lng: number } {
  const f = Math.max(0, Math.min(1, fraction));
  return {
    lat: start.lat + (end.lat - start.lat) * f,
    lng: start.lng + (end.lng - start.lng) * f,
  };
}

/**
 * Calculates Estimated Time of Arrival in minutes given remaining distance and current speed
 */
export function calculateETA(distanceKm: number, speedKmH: number = 50): number {
  const effectiveSpeed = speedKmH > 10 ? speedKmH : 40; // Default minimum urban/highway mix
  const hours = distanceKm / effectiveSpeed;
  return Math.max(1, Math.round(hours * 60));
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}
