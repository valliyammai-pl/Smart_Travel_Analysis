import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { useAlarm } from '../context/AlarmContext';
import { Bus, Schedule, SimulatedBusLocation } from '../types';
import { BusMap } from '../components/BusMap';
import {
  Compass,
  Gauge,
  MapPin,
  Clock,
  Radio,
  BellRing,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const LiveTracking: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const busIdParam = searchParams.get('busId');
  const targetStopParam = searchParams.get('targetStop') || '';

  const { triggerManualTestAlert } = useAlarm();

  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<string>(busIdParam || '');
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null);
  const [currentLocation, setCurrentLocation] = useState<SimulatedBusLocation | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch all buses
  useEffect(() => {
    async function fetchBuses() {
      try {
        const res = await api.get('/buses');
        if (res.success && res.data) {
          setBuses(res.data);
          if (!selectedBusId && res.data.length > 0) {
            setSelectedBusId(res.data[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchBuses();
  }, []);

  // 2. Fetch selected bus details & schedule
  useEffect(() => {
    if (!selectedBusId) return;

    async function loadBusDetails() {
      try {
        const res = await api.get(`/buses/${selectedBusId}`);
        if (res.success && res.data) {
          const busData: Bus = res.data;
          setSelectedBus(busData);

          const sched = busData.schedules?.[0] || null;
          setActiveSchedule(sched);

          // Seed current location from bus model until socket updates
          if (busData.currentLat && busData.currentLng) {
            setCurrentLocation({
              busId: busData.id,
              busNumber: busData.busNumber,
              latitude: busData.currentLat,
              longitude: busData.currentLng,
              speed: busData.speed || 60,
              heading: busData.heading || 0,
              status: busData.status,
              isSimulated: true,
              dataSource: 'GPS_SIMULATOR',
              timestamp: busData.lastUpdated || new Date().toISOString(),
              nextStopName: sched?.route.stops?.[1]?.stopName || 'En route',
            });
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadBusDetails();
  }, [selectedBusId]);

  // 3. Socket.IO Real-time tracking listener
  useEffect(() => {
    if (!selectedBusId) return;

    const socket = getSocket();
    socket.emit('join_bus', selectedBusId);

    const handleLocationUpdate = (payload: SimulatedBusLocation) => {
      if (payload.busId === selectedBusId) {
        setCurrentLocation(payload);
      }
    };

    socket.on('bus_location_update', handleLocationUpdate);

    return () => {
      socket.emit('leave_bus', selectedBusId);
      socket.off('bus_location_update', handleLocationUpdate);
    };
  }, [selectedBusId]);

  const handleSelectBus = (id: string) => {
    setSelectedBusId(id);
    setSearchParams({ busId: id, ...(targetStopParam && { targetStop: targetStopParam }) });
  };

  const stops = activeSchedule?.route?.stops || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-white rounded-3xl p-5 border border-lavender-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Live GPS Radar & Telemetry
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-lavender-100 text-lavender-700">
              Simulated Stream
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            {selectedBus ? `${selectedBus.operator} (${selectedBus.busNumber})` : 'Fleet Live Radar'}
          </h1>
        </div>

        {/* Bus Selector */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-600 shrink-0">Switch Vehicle:</label>
          <select
            value={selectedBusId}
            onChange={(e) => handleSelectBus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-lavender-500 w-full md:w-64"
          >
            {buses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.busNumber} • {b.operator}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Map & Telemetry Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Center (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <BusMap
            busLocation={currentLocation}
            stops={stops}
            destinationStopName={targetStopParam}
            height="520px"
          />

          {/* Telemetry Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-lavender-100 shadow-sm">
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1">
                <Gauge className="w-4 h-4 text-lavender-600" />
                <span>Instant Speed</span>
              </div>
              <div className="text-xl font-black text-slate-900">
                {currentLocation?.speed || 60} <span className="text-xs font-normal text-slate-400">km/h</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-lavender-100 shadow-sm">
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1">
                <Compass className="w-4 h-4 text-lavender-600" />
                <span>Bearing</span>
              </div>
              <div className="text-xl font-black text-slate-900">
                {currentLocation?.heading || 0}° <span className="text-xs font-normal text-slate-400">Heading</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-lavender-100 shadow-sm">
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1">
                <MapPin className="w-4 h-4 text-lavender-600" />
                <span>Next Stop In</span>
              </div>
              <div className="text-xl font-black text-slate-900">
                {currentLocation?.distanceToNextStopKm?.toFixed(1) || '14.2'}{' '}
                <span className="text-xs font-normal text-slate-400">km</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-lavender-100 shadow-sm">
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1">
                <Clock className="w-4 h-4 text-lavender-600" />
                <span>Next Stop ETA</span>
              </div>
              <div className="text-xl font-black text-lavender-700">
                {currentLocation?.etaToNextStopMinutes || '18'}{' '}
                <span className="text-xs font-normal text-slate-400">mins</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Route Progress & Alarm Test Trigger (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Destination Alarm Simulator Controller Card */}
          <div className="bg-gradient-to-br from-lavender-900 to-lavender-950 text-white rounded-3xl p-6 shadow-xl border border-lavender-700/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-lavender-500/30 flex items-center justify-center text-lavender-300">
                  <BellRing className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm">Smart Alarm Tester</h3>
              </div>
              <span className="text-[10px] uppercase font-bold bg-lavender-500/40 text-lavender-200 px-2 py-0.5 rounded-full">
                Interactive
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Test how the Smart Destination Alarm triggers synthesized audio chimes and urgent warning dialogs at each threshold.
            </p>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                type="button"
                onClick={() => triggerManualTestAlert('2km', targetStopParam || 'Destination Stop')}
                className="py-2 px-1 rounded-xl bg-lavender-800/80 hover:bg-lavender-700 text-[11px] font-bold border border-lavender-600 transition-colors text-center"
              >
                🔔 2 km Test
              </button>
              <button
                type="button"
                onClick={() => triggerManualTestAlert('500m', targetStopParam || 'Destination Stop')}
                className="py-2 px-1 rounded-xl bg-amber-600/80 hover:bg-amber-500 text-[11px] font-bold border border-amber-400 transition-colors text-center"
              >
                ⚠️ 500 m Test
              </button>
              <button
                type="button"
                onClick={() => triggerManualTestAlert('200m', targetStopParam || 'Destination Stop')}
                className="py-2 px-1 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-[11px] font-bold border border-rose-400 transition-colors text-center"
              >
                🚨 200 m Test
              </button>
            </div>
          </div>

          {/* Route Stops Timeline */}
          <div className="bg-white rounded-3xl p-6 border border-lavender-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Route Stops Progress</h3>
              <span className="text-xs text-slate-400">{stops.length} Total Stops</span>
            </div>

            <div className="space-y-4 relative pl-4 max-h-[380px] overflow-y-auto pr-1">
              {/* Continuous vertical line */}
              <div className="absolute left-[22px] top-2 bottom-2 w-0.5 bg-lavender-200"></div>

              {stops.map((stop, idx) => {
                const isTarget = stop.stopName.toLowerCase() === targetStopParam.toLowerCase();
                const isPassed =
                  currentLocation?.completedStopsCount !== undefined &&
                  idx < currentLocation.completedStopsCount;
                const isCurrentNext =
                  currentLocation?.nextStopName?.toLowerCase() === stop.stopName.toLowerCase();

                return (
                  <div key={stop.id} className="relative flex items-start space-x-3 text-xs">
                    {/* Marker circle */}
                    <div
                      className={`w-4 h-4 rounded-full shrink-0 mt-0.5 z-10 flex items-center justify-center ${
                        isTarget
                          ? 'bg-rose-500 ring-4 ring-rose-100'
                          : isPassed
                          ? 'bg-emerald-500 ring-2 ring-white'
                          : isCurrentNext
                          ? 'bg-lavender-600 ring-4 ring-lavender-200 animate-pulse'
                          : 'bg-white border-2 border-slate-300'
                      }`}
                    ></div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${isTarget ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
                          {stop.stopName}
                        </span>
                        <span className="text-[10px] text-slate-400">{stop.distanceFromSourceKm} km</span>
                      </div>
                      {isTarget && (
                        <span className="inline-block mt-0.5 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                          Your Alert Destination
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
