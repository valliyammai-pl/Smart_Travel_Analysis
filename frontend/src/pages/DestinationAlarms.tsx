import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAlarm } from '../context/AlarmContext';
import { DestinationAlarm } from '../types';
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
} from 'lucide-react';

export const DestinationAlarms: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { playAlarmSound, triggerManualTestAlert } = useAlarm();
  const [alarms, setAlarms] = useState<DestinationAlarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchAlarms = async () => {
    try {
      const res = await api.get('/alarms');
      if (res.success && res.data) {
        setAlarms(res.data);
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

  const handleTestTrigger = async (alarmId: string, threshold: '2km' | '500m' | '200m', stopName: string) => {
    try {
      await api.post(`/alarms/${alarmId}/test-trigger`, { threshold });
      triggerManualTestAlert(threshold, stopName);
    } catch {
      triggerManualTestAlert(threshold, stopName);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-lavender-100 text-lavender-800 text-xs font-bold mb-2">
          <BellRing className="w-3.5 h-3.5 text-lavender-600" />
          <span>Intelligent Geofence Engine</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">Destination Alarm Control Center</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          SmartTravel automatically tracks your bus against your destination coordinates and plays progressive audio-visual alerts as you draw closer.
        </p>
      </div>

      {message && (
        <div className="p-3.5 bg-lavender-50 border border-lavender-200 text-lavender-900 text-xs font-semibold rounded-2xl">
          {message}
        </div>
      )}

      {/* Threshold Explanation Banner */}
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

      {/* Alarms List */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Your Active Geofence Alarms</h3>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading alarms...</div>
        ) : alarms.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-lavender-100 shadow-sm">
            <BellRing className="w-12 h-12 text-lavender-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-800 text-sm">No Active Alarms</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Destination alarms can be activated when booking any bus trip, or simulated below for demonstration.
            </p>
            <button
              onClick={() => triggerManualTestAlert('2km')}
              className="mt-4 px-4 py-2 bg-lavender-600 text-white rounded-xl text-xs font-bold shadow-lavender-sm"
            >
              Simulate Test Alarm Notification
            </button>
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
                      {alarm.threshold2kmTriggered ? '✅ Alerted' : '⏳ Pending'}
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
                      {alarm.threshold500mTriggered ? '✅ Alerted' : '⏳ Pending'}
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
                      {alarm.threshold200mTriggered ? '🚨 Triggered' : '⏳ Pending'}
                    </div>
                  </div>
                </div>

                {/* Test Trigger Simulator buttons for this alarm */}
                <div className="pt-2 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                  <span>Interactive simulation test:</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTestTrigger(alarm.id, '2km', alarm.targetStopName)}
                      className="px-2.5 py-1 rounded-lg bg-lavender-50 hover:bg-lavender-100 text-lavender-700 font-bold border border-lavender-200"
                    >
                      Fire 2km
                    </button>
                    <button
                      onClick={() => handleTestTrigger(alarm.id, '500m', alarm.targetStopName)}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold border border-amber-200"
                    >
                      Fire 500m
                    </button>
                    <button
                      onClick={() => handleTestTrigger(alarm.id, '200m', alarm.targetStopName)}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold border border-rose-200"
                    >
                      Fire 200m
                    </button>
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
