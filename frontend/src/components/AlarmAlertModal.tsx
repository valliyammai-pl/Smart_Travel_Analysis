import React from 'react';
import { useAlarm } from '../context/AlarmContext';
import { BellRing, AlertTriangle, CheckCircle2, Volume2, X } from 'lucide-react';

export const AlarmAlertModal: React.FC = () => {
  const { activeAlert, dismissAlert, playAlarmSound } = useAlarm();

  if (!activeAlert) return null;

  const is200m = activeAlert.threshold === '200m';
  const is500m = activeAlert.threshold === '500m';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`relative w-full max-w-lg rounded-2xl p-6 shadow-2xl border transition-all duration-300 transform scale-100 ${
          is200m
            ? 'bg-rose-950/95 border-rose-500 text-white shadow-rose-900/50'
            : is500m
            ? 'bg-amber-950/95 border-amber-500 text-white shadow-amber-900/50'
            : 'bg-lavender-950/95 border-lavender-500 text-white shadow-lavender-900/50'
        }`}
      >
        {/* Dismiss Icon */}
        <button
          onClick={dismissAlert}
          className="absolute top-4 right-4 p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          title="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with animated icon */}
        <div className="flex items-center space-x-4 mb-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 animate-bounce ${
              is200m
                ? 'bg-rose-500 text-white'
                : is500m
                ? 'bg-amber-500 text-slate-900'
                : 'bg-lavender-500 text-white'
            }`}
          >
            {is200m ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : is500m ? (
              <AlertTriangle className="w-8 h-8" />
            ) : (
              <BellRing className="w-8 h-8" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span
                className={`text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full ${
                  is200m
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                    : is500m
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                    : 'bg-lavender-500/30 text-lavender-200 border border-lavender-500/50'
                }`}
              >
                Destination Alarm • {activeAlert.threshold} Threshold
              </span>
            </div>
            <h3 className="text-xl font-bold mt-1">
              {is200m
                ? 'Immediate Arrival Alert!'
                : is500m
                ? 'Approaching Stop: 500 Meters'
                : 'Wake-Up Notice: 2 Kilometers Away'}
            </h3>
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-black/30 rounded-xl p-4 mb-5 border border-white/10">
          <div className="text-sm text-slate-300 mb-1">Your Destination Stop:</div>
          <div className="text-lg font-semibold text-white mb-2 flex items-center">
            📍 {activeAlert.targetStopName}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-300 border-t border-white/10 pt-2">
            <span>Bus: <strong className="text-white">{activeAlert.busNumber}</strong></span>
            <span>Distance: <strong className="text-white font-mono text-sm">{activeAlert.distanceMeters} m</strong></span>
          </div>
        </div>

        <p className="text-sm text-slate-200 mb-6 leading-relaxed">
          {activeAlert.message}
        </p>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => playAlarmSound(activeAlert.threshold)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors"
          >
            <Volume2 className="w-4 h-4" />
            <span>Replay Chime</span>
          </button>
          <button
            onClick={dismissAlert}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-transform active:scale-95 ${
              is200m
                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                : is500m
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                : 'bg-lavender-500 hover:bg-lavender-600 text-white'
            }`}
          >
            I'm Ready / Dismiss Alarm
          </button>
        </div>
      </div>
    </div>
  );
};
