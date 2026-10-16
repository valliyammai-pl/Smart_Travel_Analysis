import React from 'react';
import { Bus, Shield, BellRing, Compass, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-lavender-100 mt-20 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-lavender-600 flex items-center justify-center text-white">
                <Bus className="w-5 h-5" />
              </div>
              <span className="text-lg font-extrabold text-slate-900">SmartTravel</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              India's first smart bus reservation network featuring GPS tracking and precision Destination Alarms at 2 km, 500 m, and 200 m.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Quick Navigation</h5>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><Link to="/search" className="hover:text-lavender-600">Book Bus Tickets</Link></li>
              <li><Link to="/tracking" className="hover:text-lavender-600">Live GPS Fleet Tracking</Link></li>
              <li><Link to="/alarms" className="hover:text-lavender-600">Smart Destination Alarms</Link></li>
              <li><Link to="/my-bookings" className="hover:text-lavender-600">My Trip History</Link></li>
            </ul>
          </div>

          {/* Smart Features */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Smart Features</h5>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center space-x-1.5">
                <BellRing className="w-3.5 h-3.5 text-lavender-500" />
                <span>2 km / 500 m / 200 m Alarms</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <Compass className="w-3.5 h-3.5 text-lavender-500" />
                <span>Socket.IO Real-Time GPS</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-lavender-500" />
                <span>PostgreSQL Atomic Bookings</span>
              </li>
            </ul>
          </div>

          {/* Demonstration Notice */}
          <div className="bg-lavender-50/80 rounded-2xl p-4 border border-lavender-100">
            <span className="text-[10px] uppercase font-bold tracking-wider text-lavender-700 bg-lavender-200/60 px-2 py-0.5 rounded-md">
              Telemetry Status
            </span>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Real-time fleet tracking incorporates live kinematic simulations and geofence alarms powered by PostgreSQL and Socket.IO.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} SmartTravel Technologies Inc. All rights reserved.</p>
          <p className="flex items-center mt-2 sm:mt-0">
            Built with lavender aesthetics & precision telemetry
          </p>
        </div>
      </div>
    </footer>
  );
};
