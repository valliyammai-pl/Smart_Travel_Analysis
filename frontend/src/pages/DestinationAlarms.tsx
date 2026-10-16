import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAlarm } from '../context/AlarmContext';
import { DestinationAlarm, Schedule } from '../types';
import { AlarmTestPanel } from '../components/AlarmTestPanel';
import {
  BellRing,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  XCircle,
  Volume2,
  MapPin,
  Clock,
  Sparkles,
  Wrench,
  ChevronDown,
} from 'lucide-react';

export const DestinationAlarms: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { playAlarmSound, triggerManualTestAlert } = useAlarm();
  const [alarms, setAlarms] = useState<DestinationAlarm[]>([]);
  const [selectedAlarmId, setSelectedAlarmId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [creatingDemo, setCreatingDemo] = useState(false);

  const fetchAlarms = async () => {
    try {
      const res = await api.get('/alarms');
      if (res.success && res.data) {
        setAlarms(res.data);
        if (res.data.length > 0 && !selectedAlarmId) {
          setSelectedAlarmId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAlarms();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const handleDismiss = async (id: string) => {
    try {
      const res = await api.patch(`/alarms/${id}/dismiss`);
      if (res.success) {
        setMessage('Alarm dismissed');
        fetchAlarms();
      }
    } catch (err: any) {
      setMessage(err.message || 'Action failed');
    }
  };

  const handleReset = async (id: string) => {
    try {
      const res = await api.patch(`/alarms/${id}/reset`);
      if (res.success) {
        setMessage('Alarm reset and re-armed for all thresholds');
        fetchAlarms();
      }
    } catch (err: any) {
      setMessage(err.message || 'Action failed');
    }
  };

  // Helper to create a quick test alarm if user doesn't have one
  const handleCreateDemoAlarm = async () => {
    setCreatingDemo(true);
    try {
      const schedRes = await api.get('/schedules');
      if (schedRes.success && schedRes.data.length > 0) {
        const sched: Schedule = schedRes.data[0];
        const stops = sched.route.stops || [];
        const destStop = stops[stops.length - 1];

        const res = await api.post('/alarms', {
          scheduleId: sched.id,
          targetLatitude: destStop?.latitude || 13.0694,
          targetLongitude: destStop?.longitude || 80.1948,
          targetStopName: destStop?.stopName || 'Koyambedu Bus Terminus, Chennai',
        });

        if (res.success) {
          setMessage('Test Destination Alarm created successfully!');
          await fetchAlarms();
        }
      }
    } catch (err: any) {
      setMessage(err.message || 'Failed to create demo alarm');
    } finally {
      setCreatingDemo(false);
    }
  };

  const selectedAlarm = alarms.find((a) => a.id === selectedAlarmId) || alarms[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-lavender-100 text-lavender-800 text-xs font-bold mb-2">
          <BellRing className="w-3.5 h-3.5 text-lavender-600" />
          <span>Intelligent Geofence Engine</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900">Destination Alarm Center</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          SmartTravel tracks fleet vehicles against your destination coordinates and plays progressive audio-visual alerts at 2 km, 500 m, and 200 m before your stop.
        </p>
      </div>

      {message && (
        <div className="p-3.5 bg-lavender-50 border border-lavender-200 text-lavender-900 text-xs font-semibold rounded-2xl flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-xs font-bold text-lavender-600">✕</button>
        </div>
      )}

      {/* Development-Only Alarm Test Panel */}
      {selectedAlarm ? (
        <div className="space-y-3">
          {alarms.length > 1 && (
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-bold text-slate-700">Select Alarm to Test:</span>
              <select
                value={selectedAlarmId}
                onChange={(e) => setSelectedAlarmId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-lavender-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
              >
                {alarms.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.targetStopName} ({a.status})
                  </option>
                ))}
              </select>
            </div>
          )}
          <AlarmTestPanel
            alarm={selectedAlarm}
            onAlarmUpdated={fetchAlarms}
          />
        </div>
      ) : (
        <div className="bg-gradient-to-br from-lavender-950 via-slate-900 to-lavender-950 rounded-3xl p-8 text-white border-2 border-lavender-400/40 shadow-xl text-center space-y-4">
          <Wrench className="w-12 h-12 text-amber-400 mx-auto" />
          <h3 className="text-lg font-black text-white">Development Alarm Test Panel</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            You do not currently have an active destination alarm bound to your account. Click below to instantly spawn an isolated test alarm to simulate trip approach telemetry.
          </p>
          <button
            onClick={handleCreateDemoAlarm}
            disabled={creatingDemo}
            className="px-6 py-3 bg-lavender-600 hover:bg-lavender-500 text-white rounded-2xl font-bold text-xs shadow-lavender transition-all active:scale-95 disabled:bg-slate-700"
          >
            {creatingDemo ? 'Spawning Alarm...' : '⚡ Initialize Development Test Alarm'}
          </button>
        </div>
      )}

      {/* Threshold Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-lavender-200 shadow-sm space-y-1">
          <div className="flex items-center space-x-2 text-lavender-700 font-bold text-xs uppercase">
            <span className="w-2.5 h-2.5 rounded-full bg-lavender-500"></span>
            <span>Stage 1: 2 km Geofence</span>
          </div>
          <div className="font-extrabold text-slate-900 text-sm">Wake-Up Preparation</div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Gentle two-tone chime wakes you up so you have time to collect belongings and put on your shoes.
          </p>
          <button
            onClick={() => playAlarmSound('2km')}
            className="mt-2 flex items-center space-x-1 text-[11px] font-bold text-lavender-600 hover:text-lavender-800"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Preview 2 km Chime</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-sm space-y-1">
          <div className="flex items-center space-x-2 text-amber-700 font-bold text-xs uppercase">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Stage 2: 500 m Geofence</span>
          </div>
          <div className="font-extrabold text-slate-900 text-sm">Get to the Door</div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Double warning beep warns you the bus is decelerating and turning into your bus terminal.
          </p>
          <button
            onClick={() => playAlarmSound('500m')}
            className="mt-2 flex items-center space-x-1 text-[11px] font-bold text-amber-600 hover:text-amber-800"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Preview 500 m Chime</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-sm space-y-1">
          <div className="flex items-center space-x-2 text-rose-700 font-bold text-xs uppercase">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>Stage 3: 200 m Geofence</span>
          </div>
          <div className="font-extrabold text-slate-900 text-sm">Disembark Immediately</div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Rapid arrival pulse sounds as the bus pulls up to your boarding platform.
          </p>
          <button
            onClick={() => playAlarmSound('200m')}
            className="mt-2 flex items-center space-x-1 text-[11px] font-bold text-rose-600 hover:text-rose-800"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Preview 200 m Chime</span>
          </button>
        </div>
      </div>

      {/* Alarms Database Inventory List */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Your Active Geofence Alarms</h3>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading alarms...</div>
        ) : alarms.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-lavender-100 shadow-sm">
            <BellRing className="w-12 h-12 text-lavender-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-800 text-sm">No Active Alarms in Database</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Destination alarms can be activated when booking any bus trip, or initialized via the development test panel above.
            </p>
          </div>
        ) : (
          alarms.map((alarm) => {
            const isActive = alarm.status === 'ACTIVE';

            return (
              <div
                key={alarm.id}
                className="bg-white rounded-3xl p-6 border border-lavender-100 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-base text-slate-900">
                        📍 {alarm.targetStopName}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {alarm.status}
                      </span>
                    </div>
                    {alarm.schedule && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        Route: <strong className="text-slate-800">{alarm.schedule.route.routeName}</strong> • Bus: {alarm.schedule.bus.busNumber}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {isActive ? (
                      <button
                        onClick={() => handleDismiss(alarm.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                      >
                        Dismiss
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReset(alarm.id)}
                        className="px-3 py-1.5 rounded-xl bg-lavender-100 hover:bg-lavender-200 text-lavender-800 font-bold text-xs flex items-center space-x-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Re-arm Alarm</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Threshold Tracker Status */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div
                    className={`p-3 rounded-2xl border ${
                      alarm.threshold2kmTriggered
                        ? 'bg-lavender-50 border-lavender-300 text-lavender-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-slate-400">Stage 1</div>
                    <div>2 km Threshold</div>
                    <div className="text-[10px] mt-1 font-semibold">
                      {alarm.threshold2kmTriggered ? '✅ Alerted (1x)' : '⏳ Pending'}
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-2xl border ${
                      alarm.threshold500mTriggered
                        ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-slate-400">Stage 2</div>
                    <div>500 m Threshold</div>
                    <div className="text-[10px] mt-1 font-semibold">
                      {alarm.threshold500mTriggered ? '✅ Alerted (1x)' : '⏳ Pending'}
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-2xl border ${
                      alarm.threshold200mTriggered
                        ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-slate-400">Stage 3</div>
                    <div>200 m Arrival</div>
                    <div className="text-[10px] mt-1 font-semibold">
                      {alarm.threshold200mTriggered ? '🚨 Triggered (1x)' : '⏳ Pending'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
