import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Schedule, BusType } from '../types';
import {
  Search,
  Filter,
  Clock,
  MapPin,
  Bus as BusIcon,
  Users,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export const SearchSchedules: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const sourceParam = searchParams.get('source') || '';
  const destParam = searchParams.get('destination') || '';
  const dateParam = searchParams.get('date') || '';

  const [source, setSource] = useState(sourceParam);
  const [destination, setDestination] = useState(destParam);
  const [date, setDate] = useState(dateParam);

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (source) query.set('source', source);
      if (destination) query.set('destination', destination);
      if (date) query.set('date', date);

      const res = await api.get(`/schedules?${query.toString()}`);
      if (res.success) {
        setSchedules(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({
      ...(source && { source }),
      ...(destination && { destination }),
      ...(date && { date }),
    });
  };

  const filteredSchedules = schedules.filter((s) => {
    if (selectedType === 'ALL') return true;
    return s.bus.type === selectedType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search Header Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-lavender-100">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          <div className="flex items-center px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
            <MapPin className="w-4 h-4 text-lavender-600 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Origin (e.g. Bangalore)"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-800 w-full focus:outline-none"
            />
          </div>

          <div className="flex items-center px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
            <MapPin className="w-4 h-4 text-lavender-600 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Destination (e.g. Chennai)"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-800 w-full focus:outline-none"
            />
          </div>

          <div className="flex items-center px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-800 w-full focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-lavender-600 hover:bg-lavender-700 text-white rounded-xl font-bold text-sm shadow-lavender-sm transition-all"
          >
            Update Search
          </button>
        </form>
      </div>

      {/* Main Content: Filters + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filters */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-lavender-100 shadow-sm">
            <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-100">
              <Filter className="w-4 h-4 text-lavender-600" />
              <h3 className="text-sm font-bold text-slate-900">Bus Category</h3>
            </div>

            <div className="space-y-2 text-xs">
              {['ALL', 'AC_SLEEPER', 'AC_SEATER', 'DELUXE_EXPRESS', 'NON_AC_SEATER'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`w-full text-left px-3 py-2 rounded-xl font-semibold transition-colors flex items-center justify-between ${
                    selectedType === type
                      ? 'bg-lavender-100 text-lavender-800'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{type === 'ALL' ? 'All Classes' : type.replace(/_/g, ' ')}</span>
                  {selectedType === type && <span className="w-2 h-2 rounded-full bg-lavender-600"></span>}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-lavender-50/70 rounded-3xl p-5 border border-lavender-100 text-xs text-slate-600 space-y-2">
            <div className="flex items-center space-x-2 font-bold text-lavender-800">
              <ShieldCheck className="w-4 h-4" />
              <span>Smart Booking Perks</span>
            </div>
            <p>• Guaranteed live GPS tracking on all fleet vehicles.</p>
            <p>• Automatic 2 km, 500 m, and 200 m drop-off wakeup alarms.</p>
            <p>• Instant cancellation with immediate seat release.</p>
          </div>
        </div>

        {/* Right Schedules List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Available Departures ({filteredSchedules.length})
            </h2>
            <span className="text-xs text-slate-500">Sorted by departure time</span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 animate-pulse h-40"></div>
              ))}
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-lavender-100 shadow-sm">
              <BusIcon className="w-12 h-12 text-lavender-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No schedules match your search</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try searching for Bangalore to Chennai, Mumbai to Pune, or clear origin/destination filters.
              </p>
              <button
                onClick={() => {
                  setSource('');
                  setDestination('');
                  setDate('');
                  setSearchParams({});
                }}
                className="mt-4 px-4 py-2 bg-lavender-600 text-white rounded-xl text-xs font-bold"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            filteredSchedules.map((schedule) => {
              const depDate = new Date(schedule.departureTime);
              const arrDate = new Date(schedule.arrivalTime);
              const durationHours = Math.round((arrDate.getTime() - depDate.getTime()) / (1000 * 60 * 60));

              return (
                <div
                  key={schedule.id}
                  className="bg-white rounded-3xl p-6 border border-lavender-100 shadow-sm hover:shadow-lavender-sm hover:border-lavender-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
                >
                  {/* Left: Operator & Times */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-base text-slate-900">{schedule.bus.operator}</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-lavender-100 text-lavender-700">
                        {schedule.bus.busNumber}
                      </span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {schedule.bus.type.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Timeline */}
                    <div className="flex items-center space-x-4 text-sm">
                      <div>
                        <div className="font-black text-lg text-slate-900">
                          {depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-[140px]">{schedule.route.source}</div>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-semibold text-slate-400">{durationHours}h travel</span>
                        <div className="w-20 h-0.5 bg-lavender-200 relative my-1">
                          <span className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-lavender-500"></span>
                        </div>
                        <span className="text-[10px] text-lavender-600 font-medium">
                          {schedule.route.stops?.length || 2} stops
                        </span>
                      </div>

                      <div>
                        <div className="font-black text-lg text-slate-900">
                          {arrDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-[140px]">{schedule.route.destination}</div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Seat Availability, Fare & Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 gap-3">
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-slate-400">Starting from</div>
                      <div className="text-2xl font-black text-lavender-700">₹{schedule.fare}</div>
                      <div className="text-[11px] font-bold text-emerald-600 mt-0.5">
                        {schedule.availableSeats} seats left
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/booking/${schedule.id}`)}
                      className="px-5 py-2.5 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white font-bold text-xs shadow-lavender-sm flex items-center space-x-1.5 transition-transform active:scale-95"
                    >
                      <span>Select Seats</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
