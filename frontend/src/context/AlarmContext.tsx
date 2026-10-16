import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSocket } from '../services/socket';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

export interface AlarmAlert {
  alarmId: string;
  bookingId?: string | null;
  busId: string;
  busNumber: string;
  threshold: '2km' | '500m' | '200m';
  distanceMeters: number;
  targetStopName: string;
  timestamp: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  isSimulated?: boolean;
}

export interface AlarmEventLog {
  id: string;
  timestamp: string;
  distanceMeters: number;
  threshold?: '2km' | '500m' | '200m';
  triggered: boolean;
  duplicatePrevented: boolean;
  soundPlayed?: string;
  message: string;
  source: 'SOCKET' | 'TEST_PANEL';
}

interface AlarmContextType {
  activeAlert: AlarmAlert | null;
  eventLogs: AlarmEventLog[];
  dismissAlert: () => void;
  playAlarmSound: (threshold: '2km' | '500m' | '200m') => void;
  triggerManualTestAlert: (threshold: '2km' | '500m' | '200m', stopName?: string) => void;
  simulateDistance: (alarmId: string, distanceMeters: number) => Promise<any>;
  clearEventLogs: () => void;
}

const AlarmContext = createContext<AlarmContextType | undefined>(undefined);

export const AlarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeAlert, setActiveAlert] = useState<AlarmAlert | null>(null);
  const [eventLogs, setEventLogs] = useState<AlarmEventLog[]>([]);

  // Play synthesized audio tone using Web Audio API (cross-browser, no asset loading needed)
  const playAlarmSound = useCallback((threshold: '2km' | '500m' | '200m') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (threshold === '2km') {
        // Gentle informational chime (523Hz -> 659Hz)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
      } else if (threshold === '500m') {
        // Warning double beep (784Hz)
        [0, 0.2].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(783.99, ctx.currentTime + offset);
          gain.gain.setValueAtTime(0.4, ctx.currentTime + offset);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + offset + 0.15);
          osc.start(ctx.currentTime + offset);
          osc.stop(ctx.currentTime + offset + 0.15);
        });
      } else {
        // 200m Arrival siren pulse (880Hz)
        [0, 0.15, 0.3, 0.45].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880, ctx.currentTime + offset);
          gain.gain.setValueAtTime(0.5, ctx.currentTime + offset);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + offset + 0.12);
          osc.start(ctx.currentTime + offset);
          osc.stop(ctx.currentTime + offset + 0.12);
        });
      }
    } catch (e) {
      console.warn('Audio playback not supported or blocked by user gesture:', e);
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();

    if (user?.id) {
      socket.emit('join_user', user.id);
    }

    const handleAlarm = (alert: AlarmAlert) => {
      console.log('🚨 Destination Alarm received via Socket:', alert);
      setActiveAlert(alert);
      playAlarmSound(alert.threshold);

      // Append to event logs
      setEventLogs((prev) => [
        {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date().toLocaleTimeString(),
          distanceMeters: alert.distanceMeters,
          threshold: alert.threshold,
          triggered: true,
          duplicatePrevented: false,
          soundPlayed:
            alert.threshold === '2km'
              ? 'Informational Chime (523Hz ➔ 659Hz)'
              : alert.threshold === '500m'
              ? 'Warning Beep (784Hz)'
              : 'Arrival Siren Pulse (880Hz)',
          message: alert.message,
          source: 'SOCKET',
        },
        ...prev.slice(0, 49),
      ]);
    };

    socket.on('destination_alarm', handleAlarm);

    return () => {
      socket.off('destination_alarm', handleAlarm);
    };
  }, [user, playAlarmSound]);

  const dismissAlert = () => {
    setActiveAlert(null);
  };

  const clearEventLogs = () => {
    setEventLogs([]);
  };

  const simulateDistance = async (alarmId: string, distanceMeters: number) => {
    try {
      const res = await api.post(`/alarms/${alarmId}/simulate-distance`, { distanceMeters });
      const data = res.data;

      const sound = data.triggered
        ? data.threshold === '2km'
          ? 'Informational Chime (523Hz ➔ 659Hz)'
          : data.threshold === '500m'
          ? 'Warning Beep (784Hz)'
          : 'Arrival Siren Pulse (880Hz)'
        : undefined;

      if (data.triggered && data.threshold) {
        playAlarmSound(data.threshold);
      }

      setEventLogs((prev) => [
        {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date().toLocaleTimeString(),
          distanceMeters,
          threshold: data.threshold,
          triggered: data.triggered,
          duplicatePrevented: data.duplicatePrevented,
          soundPlayed: sound,
          message: data.message,
          source: 'TEST_PANEL',
        },
        ...prev.slice(0, 49),
      ]);

      return data;
    } catch (err: any) {
      setEventLogs((prev) => [
        {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date().toLocaleTimeString(),
          distanceMeters,
          triggered: false,
          duplicatePrevented: false,
          message: `Error: ${err.message || 'Simulation failed'}`,
          source: 'TEST_PANEL',
        },
        ...prev.slice(0, 49),
      ]);
      throw err;
    }
  };

  const triggerManualTestAlert = (threshold: '2km' | '500m' | '200m', stopName: string = 'Koyambedu Bus Terminus, Chennai') => {
    const mockAlert: AlarmAlert = {
      alarmId: 'test-alarm-id',
      busId: 'test-bus',
      busNumber: 'ST-101 (Simulation)',
      threshold,
      distanceMeters: threshold === '200m' ? 190 : threshold === '500m' ? 490 : 1950,
      targetStopName: stopName,
      timestamp: new Date().toISOString(),
      message:
        threshold === '200m'
          ? `🚨 Arrived! You are within 200 meters of ${stopName}. Please prepare to disembark!`
          : threshold === '500m'
          ? `⚠️ Destination close! Only 500 meters remaining to ${stopName}. Gather your belongings.`
          : `🔔 Wake Up Alarm: Bus is 2 km from your stop (${stopName}). Prepare to get ready!`,
      severity: threshold === '200m' ? 'critical' : threshold === '500m' ? 'warning' : 'info',
      isSimulated: true,
    };

    setActiveAlert(mockAlert);
    playAlarmSound(threshold);
  };

  return (
    <AlarmContext.Provider
      value={{
        activeAlert,
        eventLogs,
        dismissAlert,
        playAlarmSound,
        triggerManualTestAlert,
        simulateDistance,
        clearEventLogs,
      }}
    >
      {children}
    </AlarmContext.Provider>
  );
};

export const useAlarm = () => {
  const context = useContext(AlarmContext);
  if (!context) {
    throw new Error('useAlarm must be used within an AlarmProvider');
  }
  return context;
};
