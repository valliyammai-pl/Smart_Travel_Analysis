import React, { useState } from 'react';
import { useAlarm } from '../context/AlarmContext';
import { api } from '../services/api';
import { DestinationAlarm } from '../types';
import {
  Wrench,
  Radio,
  Play,
  RotateCcw,
  Volume2,
  ShieldCheck,
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Trash2,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface AlarmTestPanelProps {
  alarm: DestinationAlarm;
  onAlarmUpdated?: () => void;
}

export const AlarmTestPanel: React.FC<AlarmTestPanelProps> = ({ alarm, onAlarmUpdated }) => {
  const { simulateDistance, playAlarmSound, eventLogs, clearEventLogs } = useAlarm();

  const [currentDistance, setCurrentDistance] = useState<number>(2500);
  const [isRunningSequence, setIsRunningSequence] = useState<boolean>(false);
  const [sequenceStep, setSequenceStep] = useState<number>(0);
  const [customDistance, setCustomDistance] = useState<string>('1500');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [duplicateBlockCount, setDuplicateBlockCount] = useState<number>(0);

  // Send distance simulation to backend
  const handleSimulateDistance = async (distance: number) => {
    setIsSimulating(true);
    setCurrentDistance(distance);
    try {
      const result = await simulateDistance(alarm.id, distance);
      setLastResult(result);
      if (result.duplicatePrevented) {
        setDuplicateBlockCount((prev) => prev + 1);
      }
      if (onAlarmUpdated) {
        onAlarmUpdated();
      }
    } catch (err: any) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Run full end-to-end trip approach sequence: 2500m -> 1500m -> 400m -> 150m
  const handleRunSequence = async () => {
    if (isRunningSequence) return;
    setIsRunningSequence(true);

    const steps = [
      { distance: 2500, label: '2500m (Corridor Approach, >2km)' },
      { distance: 1500, label: '1500m (Crosses 2km Threshold)' },
      { distance: 400, label: '400m (Crosses 500m Threshold)' },
      { distance: 150, label: '150m (Crosses 200m Arrival Threshold)' },
    ];

    for (let i = 0; i < steps.length; i++) {
      setSequenceStep(i + 1);
      await handleSimulateDistance(steps[i].distance);
      // Wait 1.8 seconds between steps to allow visual feedback and audio chime
      if (i < steps.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1800));
      }
    }

    setIsRunningSequence(false);
    setSequenceStep(0);
  };

  // Reset alarm thresholds on backend and re-arm
  const handleResetAlarm = async () => {
    try {
      await api.patch(`/alarms/${alarm.id}/reset`);
      setCurrentDistance(2500);
      setLastResult(null);
      setDuplicateBlockCount(0);
      if (onAlarmUpdated) {
        onAlarmUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStageBadge = (stage: '2km' | '500m' | '200m', isTriggered: boolean) => {
    if (isTriggered) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Triggered (1x)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
        <span>⏳ Pending</span>
      </span>
    );
  };

  return (
    <div className="bg-gradient-to-br from-lavender-950 via-slate-900 to-lavender-950 rounded-3xl p-6 sm:p-8 text-white border-2 border-lavender-400/40 shadow-2xl space-y-6">
      {/* Dev-Only Label & Security Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-mono">
                DEVELOPMENT-ONLY
              </span>
              <span className="text-xs text-lavender-300 font-bold">
                Trip Geofence Test Panel
              </span>
            </div>
            <h3 className="text-lg font-black text-white mt-0.5">
              Simulated Destination Approach Telemetry
            </h3>
          </div>
        </div>

        {/* Security & Isolation Pill */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Zero Booking Mutation • Strict Auth Guarded</span>
        </div>
      </div>

      {/* Target Destination & Current Telemetry Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Selected Destination */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Target Stop</div>
          <div className="text-base font-extrabold text-white mt-1 truncate">
            📍 {alarm.targetStopName}
          </div>
          <div className="text-[11px] text-lavender-300 mt-1">
            Status: <strong className="text-white uppercase font-mono">{alarm.status}</strong>
          </div>
        </div>

        {/* Current Simulated Distance */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Simulated Distance</div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
            {currentDistance} <span className="text-xs font-normal text-slate-400">meters</span>
          </div>
          <div className="text-[11px] text-slate-300 mt-1">
            {currentDistance > 2000
              ? 'Outside geofences (>2km)'
              : currentDistance > 500
              ? 'Stage 1 (2 km zone)'
              : currentDistance > 200
              ? 'Stage 2 (500 m zone)'
              : 'Stage 3 (200 m arrival zone)'}
          </div>
        </div>

        {/* Current Active Threshold */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Active Stage Alert</div>
          <div className="text-lg font-black text-white mt-1">
            {currentDistance <= 200
              ? '🚨 Stage 3 (200 m)'
              : currentDistance <= 500
              ? '⚠️ Stage 2 (500 m)'
              : currentDistance <= 2000
              ? '🔔 Stage 1 (2 km)'
              : 'None (Approach)'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {lastResult?.duplicatePrevented
              ? 'Duplicate prevented'
              : lastResult?.triggered
              ? 'New trigger fired'
              : 'Idle'}
          </div>
        </div>

        {/* Duplicate Prevention Shield */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Duplicate Prevention</div>
          <div className="text-lg font-black text-emerald-400 font-mono mt-1">
            {duplicateBlockCount} <span className="text-xs font-normal text-slate-400">suppressed</span>
          </div>
          <div className="text-[11px] text-slate-300 mt-1">
            Exact 1x trigger per stage
          </div>
        </div>
      </div>

      {/* Threshold Status Verification Cards */}
      <div className="bg-black/30 rounded-2xl p-5 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-lavender-400" />
            <span>Threshold Stage Verification Matrix (Database State)</span>
          </h4>
          <button
            onClick={handleResetAlarm}
            className="flex items-center space-x-1 text-xs font-bold text-lavender-400 hover:text-lavender-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset & Re-arm Alarm</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Stage 1 */}
          <div className={`p-4 rounded-xl border transition-all ${
            alarm.threshold2kmTriggered
              ? 'bg-lavender-900/50 border-lavender-400/60 text-white'
              : 'bg-white/5 border-white/10 text-slate-400'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-lavender-300 uppercase">Stage 1: 2 km Threshold</span>
              {getStageBadge('2km', alarm.threshold2kmTriggered)}
            </div>
            <div className="text-xs text-slate-300">Target Range: <strong>&le; 2000 m and &gt; 500 m</strong></div>
            <div className="text-[11px] text-slate-400 mt-1">Sound: Gentle Informational Chime (523Hz ➔ 659Hz)</div>
          </div>

          {/* Stage 2 */}
          <div className={`p-4 rounded-xl border transition-all ${
            alarm.threshold500mTriggered
              ? 'bg-amber-950/50 border-amber-400/60 text-white'
              : 'bg-white/5 border-white/10 text-slate-400'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-300 uppercase">Stage 2: 500 m Threshold</span>
              {getStageBadge('500m', alarm.threshold500mTriggered)}
            </div>
            <div className="text-xs text-slate-300">Target Range: <strong>&le; 500 m and &gt; 200 m</strong></div>
            <div className="text-[11px] text-slate-400 mt-1">Sound: Warning Double-Beep (784Hz)</div>
          </div>

          {/* Stage 3 */}
          <div className={`p-4 rounded-xl border transition-all ${
            alarm.threshold200mTriggered
              ? 'bg-rose-950/50 border-rose-400/60 text-white'
              : 'bg-white/5 border-white/10 text-slate-400'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-300 uppercase">Stage 3: 200 m Threshold</span>
              {getStageBadge('200m', alarm.threshold200mTriggered)}
            </div>
            <div className="text-xs text-slate-300">Target Range: <strong>&le; 200 m (Arrival)</strong></div>
            <div className="text-[11px] text-slate-400 mt-1">Sound: Urgent Siren Pulse (880Hz)</div>
          </div>
        </div>
      </div>

      {/* Simulation Controls: 2500m, 1500m, 400m, 150m */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
            Trip Approach Distance Presets:
          </label>
          <span className="text-[11px] text-slate-400 font-mono">
            Click to simulate instant vehicle coordinate update
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Preset 1: 2500m */}
          <button
            type="button"
            disabled={isSimulating || isRunningSequence}
            onClick={() => handleSimulateDistance(2500)}
            className={`p-3.5 rounded-2xl text-left border transition-all active:scale-95 ${
              currentDistance === 2500
                ? 'bg-slate-700/80 border-slate-400 text-white shadow-lg'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-black font-mono">2,500 m</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                &gt; 2 km
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Approach Corridor</div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">No Trigger Expected</div>
          </button>

          {/* Preset 2: 1500m */}
          <button
            type="button"
            disabled={isSimulating || isRunningSequence}
            onClick={() => handleSimulateDistance(1500)}
            className={`p-3.5 rounded-2xl text-left border transition-all active:scale-95 ${
              currentDistance === 1500
                ? 'bg-lavender-700/80 border-lavender-400 text-white shadow-lg'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-black font-mono text-lavender-300">1,500 m</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-lavender-900 text-lavender-200">
                &le; 2 km
              </span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">Crosses 2 km Threshold</div>
            <div className="text-[10px] text-lavender-400 font-semibold mt-0.5">Triggers Stage 1 Chime</div>
          </button>

          {/* Preset 3: 400m */}
          <button
            type="button"
            disabled={isSimulating || isRunningSequence}
            onClick={() => handleSimulateDistance(400)}
            className={`p-3.5 rounded-2xl text-left border transition-all active:scale-95 ${
              currentDistance === 400
                ? 'bg-amber-600/80 border-amber-300 text-white shadow-lg'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-black font-mono text-amber-300">400 m</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300">
                &le; 500 m
              </span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">Crosses 500 m Threshold</div>
            <div className="text-[10px] text-amber-400 font-semibold mt-0.5">Triggers Stage 2 Warning</div>
          </button>

          {/* Preset 4: 150m */}
          <button
            type="button"
            disabled={isSimulating || isRunningSequence}
            onClick={() => handleSimulateDistance(150)}
            className={`p-3.5 rounded-2xl text-left border transition-all active:scale-95 ${
              currentDistance === 150
                ? 'bg-rose-600/80 border-rose-300 text-white shadow-lg'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-black font-mono text-rose-300">150 m</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300">
                &le; 200 m
              </span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">Crosses 200 m Threshold</div>
            <div className="text-[10px] text-rose-400 font-semibold mt-0.5">Triggers Stage 3 Arrival</div>
          </button>
        </div>

        {/* Action Row: Full Automated Sequence + Duplicate Test + Custom Distance */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Full Sequence Run */}
          <button
            type="button"
            disabled={isRunningSequence || isSimulating}
            onClick={handleRunSequence}
            className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md ${
              isRunningSequence
                ? 'bg-lavender-700 text-white animate-pulse'
                : 'bg-lavender-600 hover:bg-lavender-500 text-white active:scale-95'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>
              {isRunningSequence
                ? `Running Step ${sequenceStep}/4...`
                : 'Run Step-by-Step Approach (2500m ➔ 150m)'}
            </span>
          </button>

          {/* Test Duplicate Prevention */}
          <button
            type="button"
            disabled={isRunningSequence || isSimulating}
            onClick={() => handleSimulateDistance(currentDistance)}
            className="py-3 px-4 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/10 flex items-center justify-center space-x-2 transition-colors active:scale-95"
            title="Sends the current distance again to verify the duplicate is suppressed"
          >
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span>Re-send {currentDistance}m (Verify Duplicate Block)</span>
          </button>

          {/* Custom Distance Input */}
          <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
            <span className="text-xs text-slate-400 font-semibold shrink-0">Custom:</span>
            <input
              type="number"
              min={0}
              max={10000}
              value={customDistance}
              onChange={(e) => setCustomDistance(e.target.value)}
              placeholder="Meters"
              className="bg-transparent text-xs text-white font-mono font-bold w-full focus:outline-none"
            />
            <button
              type="button"
              disabled={isSimulating}
              onClick={() => handleSimulateDistance(Number(customDistance))}
              className="px-2.5 py-1 bg-lavender-500 hover:bg-lavender-400 text-white text-[11px] font-bold rounded-lg shrink-0 transition-colors"
            >
              Test
            </button>
          </div>
        </div>
      </div>

      {/* Live Event Logs */}
      <div className="bg-black/40 rounded-2xl p-5 border border-white/10 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Live Alarm Event Logs ({eventLogs.length})
            </h4>
          </div>
          <button
            onClick={clearEventLogs}
            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center space-x-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear Logs</span>
          </button>
        </div>

        <div className="max-h-56 overflow-y-auto space-y-2 font-mono text-xs pr-1">
          {eventLogs.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              No simulation events logged yet. Click any distance preset above to trigger telemetry.
            </div>
          ) : (
            eventLogs.map((log) => (
              <div
                key={log.id}
                className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] ${
                  log.duplicatePrevented
                    ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                    : log.triggered
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                    : 'bg-white/5 border-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 text-[10px]">{log.timestamp}</span>
                  <span className="font-bold px-1.5 py-0.5 rounded bg-black/40">
                    {log.distanceMeters} m
                  </span>
                  {log.threshold && (
                    <span className="font-bold px-1.5 py-0.5 rounded bg-lavender-500/30 text-lavender-200 uppercase text-[10px]">
                      {log.threshold}
                    </span>
                  )}
                  <span>{log.message}</span>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {log.duplicatePrevented && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      DUPLICATE BLOCKED
                    </span>
                  )}
                  {log.triggered && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      STAGE TRIGGERED
                    </span>
                  )}
                  {log.soundPlayed && (
                    <button
                      onClick={() => log.threshold && playAlarmSound(log.threshold)}
                      className="text-slate-400 hover:text-white"
                      title="Replay Sound"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
