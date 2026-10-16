import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { RouteStop, SimulatedBusLocation } from '../types';

// Fix for default Leaflet marker icons in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Bus Icon with heading rotation and pulsating lavender aura
const createBusIcon = (heading: number = 0, isSimulated: boolean = true) => {
  return L.divIcon({
    className: 'custom-bus-marker',
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(140, 104, 227, 0.25); animation: pulse-ring 1.8s infinite;"></div>
        <div style="position: relative; width: 32px; height: 32px; border-radius: 50%; background: #6736c0; border: 2px solid #ffffff; box-shadow: 0 4px 12px rgba(103, 54, 192, 0.4); display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg); transition: transform 0.4s ease;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <path d="M9 17h6"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
};

// Custom Stop Icon
const createStopIcon = (stopNumber: number, isDestination: boolean = false) => {
  const bg = isDestination ? '#f43f5e' : '#8c68e3';
  return L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div style="width: 26px; height: 26px; border-radius: 50%; background: ${bg}; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold; font-family: sans-serif;">
        ${stopNumber}
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });
};

// Auto-center map controller
const MapViewUpdater: React.FC<{ center: [number, number]; zoom?: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom || map.getZoom());
  }, [center[0], center[1]]);
  return null;
};

interface BusMapProps {
  busLocation?: SimulatedBusLocation | null;
  stops?: RouteStop[];
  destinationStopName?: string;
  height?: string;
}

export const BusMap: React.FC<BusMapProps> = ({
  busLocation,
  stops = [],
  destinationStopName,
  height = '500px',
}) => {
  // Determine map center: bus location or first stop or default Bangalore
  const defaultCenter: [number, number] = busLocation
    ? [busLocation.latitude, busLocation.longitude]
    : stops.length > 0
    ? [stops[0].latitude, stops[0].longitude]
    : [12.9778, 77.5726];

  // Build polyline coordinates
  const polylinePositions: [number, number][] = stops.map((s) => [s.latitude, s.longitude]);

  // Find destination stop coordinates if specified
  const destinationStop = stops.find(
    (s) => s.stopName.toLowerCase() === destinationStopName?.toLowerCase()
  );

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-lavender-200 shadow-lavender shadow-md">
      {/* Simulation Watermark / Badge */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-lavender-200 shadow-md flex items-center space-x-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
        <span className="text-xs font-bold text-slate-800">
          🛰️ Telemetry: <span className="text-lavender-700">Simulated GPS Live</span>
        </span>
      </div>

      <div style={{ height }}>
        <MapContainer
          center={defaultCenter}
          zoom={8}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <MapViewUpdater center={defaultCenter} />

          {/* OpenStreetMap Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Route Line */}
          {polylinePositions.length > 1 && (
            <Polyline
              positions={polylinePositions}
              color="#7949d6"
              weight={4}
              opacity={0.8}
              dashArray="6, 8"
            />
          )}

          {/* Stops Markers */}
          {stops.map((stop, idx) => {
            const isTarget = stop.stopName.toLowerCase() === destinationStopName?.toLowerCase();
            return (
              <Marker
                key={stop.id || idx}
                position={[stop.latitude, stop.longitude]}
                icon={createStopIcon(idx + 1, isTarget)}
              >
                <Popup>
                  <div className="p-1">
                    <div className="text-xs font-bold text-lavender-700 uppercase">Stop #{idx + 1}</div>
                    <div className="text-sm font-semibold text-slate-900">{stop.stopName}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Distance: {stop.distanceFromSourceKm} km • Est: {stop.estimatedMinutesFromSource} mins
                    </div>
                    {isTarget && (
                      <div className="mt-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                        🎯 Active Destination Alarm Target
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Destination Geofence Alert Circles (2km, 500m, 200m) if destination is set */}
          {destinationStop && (
            <>
              {/* 2 km circle */}
              <Circle
                center={[destinationStop.latitude, destinationStop.longitude]}
                radius={2000}
                pathOptions={{ color: '#8c68e3', fillColor: '#8c68e3', fillOpacity: 0.08, dashArray: '4, 4' }}
              />
              {/* 500 m circle */}
              <Circle
                center={[destinationStop.latitude, destinationStop.longitude]}
                radius={500}
                pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.15 }}
              />
              {/* 200 m circle */}
              <Circle
                center={[destinationStop.latitude, destinationStop.longitude]}
                radius={200}
                pathOptions={{ color: '#f43f5e', fillColor: '#f43f5e', fillOpacity: 0.25 }}
              />
            </>
          )}

          {/* Real-Time Bus Marker */}
          {busLocation && (
            <Marker
              position={[busLocation.latitude, busLocation.longitude]}
              icon={createBusIcon(busLocation.heading, busLocation.isSimulated)}
            >
              <Popup>
                <div className="p-1 min-w-[180px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-lavender-700">🚌 {busLocation.busNumber}</span>
                    <span className="text-[10px] font-bold bg-lavender-100 text-lavender-700 px-1.5 py-0.5 rounded">
                      Simulated GPS
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1.5">
                    Speed: <strong className="text-slate-900">{busLocation.speed} km/h</strong>
                  </div>
                  {busLocation.nextStopName && (
                    <div className="text-xs text-slate-600 mt-1">
                      Next Stop: <strong className="text-slate-900">{busLocation.nextStopName}</strong>
                    </div>
                  )}
                  {busLocation.etaToNextStopMinutes !== undefined && (
                    <div className="text-xs text-slate-600">
                      Next Stop ETA: <strong className="text-lavender-700">{busLocation.etaToNextStopMinutes} mins</strong>
                    </div>
                  )}
                  {busLocation.etaToDestinationMinutes !== undefined && (
                    <div className="text-xs text-slate-600">
                      Destination ETA: <strong className="text-slate-900">{busLocation.etaToDestinationMinutes} mins</strong>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
};
