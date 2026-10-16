import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Bus, Route } from '../types';
import {
  Search,
  MapPin,
  Calendar,
  ArrowRightLeft,
  BellRing,
  Compass,
  ShieldCheck,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [source, setSource] = useState('Bangalore');
  const [destination, setDestination] = useState('Chennai');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [busRes, routeRes] = await Promise.all([
          api.get('/buses'),
          api.get('/routes'),
        ]);
        if (busRes.success) setBuses(busRes.data || []);
        if (routeRes.success) setRoutes(routeRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(date)}`);
  };

  const handleSwap = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 bg-gradient-to-b from-lavender-100/60 via-lavender-50/40 to-transparent rounded-b-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-lavender-100 border border-lavender-200 text-lavender-800 text-xs font-bold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-lavender-600" />
            <span>Next-Gen Smart Intercity Mobility</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Travel Smarter with Live GPS &{' '}
            <span className="bg-gradient-to-r from-lavender-700 to-lavender-500 bg-clip-text text-transparent">
              Destination Alarms
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Never miss your drop-off stop again. SmartTravel alerts you precisely at 2 km, 500 m, and 200 m before your destination while tracking your bus in real time.
          </p>

          {/* Quick Search Widget */}
          <div className="mt-10 max-w-4xl mx-auto bg-white rounded-3xl p-4 sm:p-6 shadow-2xl border border-lavender-100">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
              {/* Origin */}
              <div className="md:col-span-2 text-left bg-slate-50 hover:bg-lavender-50/50 p-3 rounded-2xl border border-slate-200 focus-within:border-lavender-500 transition-colors">
                <label className="block text-[11px] font-bold uppercase text-slate-400">Departure From</label>
                <div className="flex items-center mt-1">
                  <MapPin className="w-4 h-4 text-lavender-600 shrink-0 mr-2" />
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="e.g. Bangalore"
                    className="w-full bg-transparent font-semibold text-slate-900 focus:outline-none text-sm"
                    required
                  />
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center -my-2 md:my-0">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="w-10 h-10 rounded-full bg-lavender-100 hover:bg-lavender-200 text-lavender-700 flex items-center justify-center transition-transform active:rotate-180"
                  title="Swap Origin and Destination"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Destination */}
              <div className="md:col-span-2 text-left bg-slate-50 hover:bg-lavender-50/50 p-3 rounded-2xl border border-slate-200 focus-within:border-lavender-500 transition-colors">
                <label className="block text-[11px] font-bold uppercase text-slate-400">Going To</label>
                <div className="flex items-center mt-1">
                  <MapPin className="w-4 h-4 text-lavender-600 shrink-0 mr-2" />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Chennai"
                    className="w-full bg-transparent font-semibold text-slate-900 focus:outline-none text-sm"
                    required
                  />
                </div>
              </div>

              {/* Date */}
              <div className="md:col-span-1 text-left bg-slate-50 hover:bg-lavender-50/50 p-3 rounded-2xl border border-slate-200 focus-within:border-lavender-500 transition-colors">
                <label className="block text-[11px] font-bold uppercase text-slate-400">Date</label>
                <div className="flex items-center mt-1">
                  <Calendar className="w-4 h-4 text-lavender-600 shrink-0 mr-1" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-transparent font-semibold text-slate-900 focus:outline-none text-xs"
                    required
                  />
                </div>
              </div>

              {/* Search Submit */}
              <div className="md:col-span-1">
                <button
                  type="submit"
                  className="w-full h-full py-3.5 px-4 bg-lavender-600 hover:bg-lavender-700 text-white rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lavender shadow-md transition-all active:scale-95"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Real-time Fleet Ticker */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-5 border border-lavender-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="text-base font-bold text-slate-900">Live Active Fleet Radar</h3>
              <span className="text-xs bg-lavender-100 text-lavender-700 px-2 py-0.5 rounded-full font-bold">
                Simulated Telemetry
              </span>
            </div>
            <button
              onClick={() => navigate('/tracking')}
              className="text-xs font-bold text-lavender-600 hover:text-lavender-800 flex items-center space-x-1 mt-2 sm:mt-0"
            >
              <span>View Full Interactive Map</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {buses.map((bus) => (
              <div
                key={bus.id}
                onClick={() => navigate(`/tracking?busId=${bus.id}`)}
                className="cursor-pointer group p-3.5 rounded-xl bg-slate-50 hover:bg-lavender-50/60 border border-slate-200 hover:border-lavender-300 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-extrabold text-slate-800 group-hover:text-lavender-700">
                    {bus.busNumber}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {bus.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-medium truncate mb-2">
                  {bus.operator}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
                  <span>Speed: <strong className="text-slate-900">{bus.speed || 60} km/h</strong></span>
                  <span className="text-lavender-600 font-semibold flex items-center">
                    Track <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Engineered for Modern Travelers
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Why commuters choose SmartTravel over traditional booking portals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-3xl p-6 border border-lavender-100 shadow-sm hover:shadow-lavender-sm transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-lavender-100 text-lavender-600 flex items-center justify-center mb-4">
              <BellRing className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Triple-Stage Destination Alarm</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sleep comfortably on overnight trips. Our smart geofencing triggers distinct notifications and chime alerts at 2 km, 500 m, and 200 m before your stop.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-3xl p-6 border border-lavender-100 shadow-sm hover:shadow-lavender-sm transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-lavender-100 text-lavender-600 flex items-center justify-center mb-4">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Socket.IO Live Bus Radar</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Real-time kinematic position broadcasts with interpolated road coordinates, dynamic ETA analysis, and speed monitoring directly on OpenStreetMap.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-3xl p-6 border border-lavender-100 shadow-sm hover:shadow-lavender-sm transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-lavender-100 text-lavender-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Atomic Seat Reservations</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              PostgreSQL transactional integrity guarantees zero double-bookings. Instant cancellations automatically restore seats to the inventory in milliseconds.
            </p>
          </div>
        </div>
      </section>

      {/* Popular Routes Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Popular Bus Routes</h2>
            <p className="text-xs text-slate-500 mt-1">Frequently traveled routes across South & West India</p>
          </div>
          <button
            onClick={() => navigate('/search')}
            className="text-xs font-bold text-lavender-700 hover:text-lavender-900 flex items-center space-x-1"
          >
            <span>View All Schedules</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {routes.map((route) => (
            <div
              key={route.id}
              className="bg-white rounded-3xl p-5 border border-lavender-100 shadow-sm hover:border-lavender-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-bold text-lavender-600 uppercase tracking-wider mb-2">
                  Direct Highway Route
                </div>
                <h4 className="text-base font-extrabold text-slate-900 mb-1">{route.routeName}</h4>
                <div className="flex items-center space-x-3 text-xs text-slate-500 mb-4">
                  <span>{route.totalDistanceKm} km</span>
                  <span>•</span>
                  <span>{Math.floor(route.estimatedMinutes / 60)} hrs {route.estimatedMinutes % 60} mins</span>
                  <span>•</span>
                  <span>{route.stops.length} Stops</span>
                </div>
              </div>

              <button
                onClick={() => navigate(`/search?source=${encodeURIComponent(route.source)}&destination=${encodeURIComponent(route.destination)}`)}
                className="w-full py-2.5 rounded-xl bg-lavender-50 hover:bg-lavender-600 text-lavender-700 hover:text-white font-bold text-xs transition-colors"
              >
                Book This Route
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
