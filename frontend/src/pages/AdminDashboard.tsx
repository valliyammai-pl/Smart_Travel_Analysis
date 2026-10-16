import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Bus, Route, Schedule, BusType, BusStatus } from '../types';
import {
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Ticket,
  Bus as BusIcon,
  Radio,
  MapPin,
  Calendar,
  Plus,
  RefreshCw,
  Trash2,
  Play,
  Pause,
  AlertCircle,
  Users,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'FLEET' | 'ROUTES' | 'SCHEDULES' | 'BOOKINGS'>('ANALYTICS');
  const [analytics, setAnalytics] = useState<any>(null);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');

  // Form states for creating bus
  const [showAddBusModal, setShowAddBusModal] = useState(false);
  const [newBusNumber, setNewBusNumber] = useState('');
  const [newBusOperator, setNewBusOperator] = useState('');
  const [newBusType, setNewBusType] = useState<BusType>('AC_SEATER');
  const [newBusSeats, setNewBusSeats] = useState(36);

  // Form states for creating schedule
  const [showAddSchedModal, setShowAddSchedModal] = useState(false);
  const [schedBusId, setSchedBusId] = useState('');
  const [schedRouteId, setSchedRouteId] = useState('');
  const [schedDepTime, setSchedDepTime] = useState('');
  const [schedArrTime, setSchedArrTime] = useState('');
  const [schedFare, setSchedFare] = useState(750);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, busesRes, routesRes, schedRes, bookingsRes] = await Promise.all([
        api.get('/analytics'),
        api.get('/buses'),
        api.get('/routes'),
        api.get('/schedules'),
        api.get('/bookings'),
      ]);

      if (analyticsRes.success) setAnalytics(analyticsRes.data);
      if (busesRes.success) setBuses(busesRes.data || []);
      if (routesRes.success) setRoutes(routesRes.data || []);
      if (schedRes.success) setSchedules(schedRes.data || []);
      if (bookingsRes.success) setAllBookings(bookingsRes.data || []);
    } catch (err: any) {
      console.error(err);
      setStatusMsg(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAllData();
    }
  }, [isAdmin]);

  const handleToggleSimulation = async (busId: string) => {
    try {
      const res = await api.post(`/buses/${busId}/toggle-simulation`);
      if (res.success) {
        setStatusMsg('Bus simulation status updated');
        loadAllData();
      }
    } catch (err: any) {
      setStatusMsg(err.message || 'Action failed');
    }
  };

  const handleDeleteBus = async (busId: string) => {
    if (!window.confirm('Delete this bus and all related schedules?')) return;
    try {
      const res = await api.delete(`/buses/${busId}`);
      if (res.success) {
        setStatusMsg('Bus deleted successfully');
        loadAllData();
      }
    } catch (err: any) {
      setStatusMsg(err.message || 'Delete failed');
    }
  };

  const handleCreateBus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/buses', {
        busNumber: newBusNumber,
        operator: newBusOperator,
        type: newBusType,
        totalSeats: Number(newBusSeats),
        isSimulating: true,
      });
      if (res.success) {
        setShowAddBusModal(false);
        setNewBusNumber('');
        setNewBusOperator('');
        setStatusMsg('Bus created and registered to fleet!');
        loadAllData();
      }
    } catch (err: any) {
      setStatusMsg(err.message || 'Bus creation failed');
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/schedules', {
        busId: schedBusId,
        routeId: schedRouteId,
        departureTime: new Date(schedDepTime).toISOString(),
        arrivalTime: new Date(schedArrTime).toISOString(),
        fare: Number(schedFare),
      });
      if (res.success) {
        setShowAddSchedModal(false);
        setStatusMsg('New schedule created with auto-generated seat inventory!');
        loadAllData();
      }
    } catch (err: any) {
      setStatusMsg(err.message || 'Schedule creation failed');
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-rose-200 text-center">
        <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Restricted Admin Area</h2>
        <p className="text-xs text-slate-500 mt-1">
          You must be logged in as an administrator (e.g., admin@smarttravel.com) to access fleet telemetry controls.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Title Bar */}
      <div className="bg-white rounded-3xl p-6 border border-lavender-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-lavender-100 text-lavender-800 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-lavender-600" />
            <span>Master Operations Console</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">SmartTravel Fleet & Revenue Admin</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time management for PostgreSQL persistence, GPS simulators, and destination alarms
          </p>
        </div>

        <button
          onClick={loadAllData}
          className="px-4 py-2.5 rounded-xl bg-lavender-50 hover:bg-lavender-100 text-lavender-700 font-bold text-xs flex items-center space-x-1.5 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3.5 bg-lavender-50 border border-lavender-200 text-lavender-900 text-xs font-semibold rounded-2xl flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg('')} className="text-xs font-bold text-lavender-600">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-lavender-200 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { key: 'ANALYTICS', label: 'Analytics & Revenue' },
          { key: 'FLEET', label: `Fleet Management (${buses.length})` },
          { key: 'ROUTES', label: `Routes & Stops (${routes.length})` },
          { key: 'SCHEDULES', label: `Schedules (${schedules.length})` },
          { key: 'BOOKINGS', label: `Passenger Bookings (${allBookings.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-lavender-600 text-white shadow-lavender-sm shadow-md'
                : 'text-slate-600 hover:text-lavender-700 hover:bg-lavender-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Analytics */}
      {activeTab === 'ANALYTICS' && analytics && (
        <div className="space-y-8">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-lavender-100 shadow-sm">
              <div className="text-xs text-slate-400 font-semibold mb-1">Total Revenue</div>
              <div className="text-2xl font-black text-lavender-700">₹{analytics.overview.totalRevenue}</div>
              <div className="text-[11px] text-emerald-600 font-bold mt-1">Confirmed transactions</div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-lavender-100 shadow-sm">
              <div className="text-xs text-slate-400 font-semibold mb-1">Total Bookings</div>
              <div className="text-2xl font-black text-slate-900">{analytics.overview.totalBookings}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                {analytics.overview.confirmedBookings} Active • {analytics.overview.cancelledBookings} Cancelled
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-lavender-100 shadow-sm">
              <div className="text-xs text-slate-400 font-semibold mb-1">Active Fleet / Simulating</div>
              <div className="text-2xl font-black text-slate-900">
                {analytics.overview.activeBuses} / {analytics.overview.simulatingBuses}
              </div>
              <div className="text-[11px] text-lavender-600 font-bold mt-1">GPS Telemetry Online</div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-lavender-100 shadow-sm">
              <div className="text-xs text-slate-400 font-semibold mb-1">Fleet Occupancy Rate</div>
              <div className="text-2xl font-black text-slate-900">{analytics.overview.occupancyRate}%</div>
              <div className="text-[11px] text-slate-500 mt-1">{analytics.overview.activeAlarmsCount} Active Alarms</div>
            </div>
          </div>

          {/* Route Performance & Recent Bookings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Route Stats */}
            <div className="bg-white rounded-3xl p-6 border border-lavender-100 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-slate-900">Route Performance & Demand</h3>
              <div className="divide-y divide-slate-100">
                {analytics.routeStats.map((r: any) => (
                  <div key={r.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{r.routeName}</div>
                      <div className="text-slate-400">{r.distanceKm} km route</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-lavender-700 text-sm">{r.totalBookings} Bookings</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Bookings Feed */}
            <div className="bg-white rounded-3xl p-6 border border-lavender-100 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-slate-900">Recent Passenger Bookings</h3>
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
                {analytics.recentBookings.map((b: any) => (
                  <div key={b.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-lavender-700">{b.bookingReference}</span>
                      <div className="font-semibold text-slate-800">{b.passengerName}</div>
                      <div className="text-[10px] text-slate-400">Seats: {b.seatNumbers.join(', ')}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">₹{b.totalAmount}</div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Fleet Management */}
      {activeTab === 'FLEET' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">Bus Fleet Registry</h3>
            <button
              onClick={() => setShowAddBusModal(true)}
              className="px-4 py-2 bg-lavender-600 hover:bg-lavender-700 text-white rounded-xl text-xs font-bold shadow-lavender-sm flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Bus</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-lavender-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Bus Number</th>
                    <th className="p-4">Operator</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Total Seats</th>
                    <th className="p-4">Speed / Telemetry</th>
                    <th className="p-4">Simulation</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {buses.map((bus) => (
                    <tr key={bus.id} className="hover:bg-slate-50/70">
                      <td className="p-4 font-mono font-bold text-lavender-700">{bus.busNumber}</td>
                      <td className="p-4 font-semibold text-slate-900">{bus.operator}</td>
                      <td className="p-4">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold">
                          {bus.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-4 font-medium">{bus.totalSeats} seats</td>
                      <td className="p-4 font-mono text-slate-600">
                        {bus.speed ? `${bus.speed} km/h` : '0 km/h'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          bus.isSimulating ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {bus.isSimulating ? 'SIMULATING' : 'STOPPED'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleSimulation(bus.id)}
                          className={`p-1.5 rounded-lg border text-xs font-semibold ${
                            bus.isSimulating
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                          title="Toggle Simulation"
                        >
                          {bus.isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDeleteBus(bus.id)}
                          className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                          title="Delete Bus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Routes & Stops */}
      {activeTab === 'ROUTES' && (
        <div className="space-y-4">
          <h3 className="font-bold text-base text-slate-900">Configured Travel Corridors</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routes.map((route) => (
              <div key={route.id} className="bg-white rounded-3xl p-6 border border-lavender-100 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-base text-slate-900">{route.routeName}</h4>
                  <span className="text-xs font-bold text-lavender-700 bg-lavender-100 px-2 py-0.5 rounded-md">
                    {route.totalDistanceKm} km
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {route.source} ➔ {route.destination} ({Math.round(route.estimatedMinutes / 60)} hours)
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-700 mb-2">Stops Sequence:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {route.stops.map((stop, sIdx) => (
                      <span key={stop.id} className="text-[11px] bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700">
                        {sIdx + 1}. {stop.stopName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Schedules */}
      {activeTab === 'SCHEDULES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">Active Schedules & Trips</h3>
            <button
              onClick={() => {
                if (buses.length > 0) setSchedBusId(buses[0].id);
                if (routes.length > 0) setSchedRouteId(routes[0].id);
                setShowAddSchedModal(true);
              }}
              className="px-4 py-2 bg-lavender-600 hover:bg-lavender-700 text-white rounded-xl text-xs font-bold shadow-lavender-sm flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Create Schedule</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="bg-white rounded-3xl p-6 border border-lavender-100 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900">{schedule.bus.operator}</span>
                  <span className="font-black text-lavender-700 text-base">₹{schedule.fare}</span>
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  {schedule.route.routeName}
                </div>
                <div className="text-xs text-slate-500">
                  Departure: {new Date(schedule.departureTime).toLocaleString()}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span>Seats: <strong>{schedule.availableSeats}</strong> of {schedule.totalSeats} available</span>
                  <span className="text-[10px] font-bold bg-lavender-100 text-lavender-700 px-2 py-0.5 rounded">
                    {schedule.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Bookings */}
      {activeTab === 'BOOKINGS' && (
        <div className="space-y-4">
          <h3 className="font-bold text-base text-slate-900">All Passenger Bookings</h3>
          <div className="bg-white rounded-3xl border border-lavender-100 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Reference</th>
                  <th className="p-4">Passenger</th>
                  <th className="p-4">Seats</th>
                  <th className="p-4">Route</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70">
                    <td className="p-4 font-mono font-bold text-lavender-700">{b.bookingReference}</td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-900">{b.passengerName}</div>
                      <div className="text-slate-400 text-[10px]">{b.passengerEmail}</div>
                    </td>
                    <td className="p-4 font-mono font-bold">{b.seatNumbers.join(', ')}</td>
                    <td className="p-4 text-slate-700">{b.schedule?.route?.routeName || 'Direct Route'}</td>
                    <td className="p-4 font-bold text-slate-900">₹{b.totalAmount}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Bus Modal */}
      {showAddBusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-lavender-100 space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">Register New Fleet Bus</h3>
            <form onSubmit={handleCreateBus} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Bus Number Plate</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ST-505"
                  value={newBusNumber}
                  onChange={(e) => setNewBusNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Fleet Operator</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Lavender Express"
                  value={newBusOperator}
                  onChange={(e) => setNewBusOperator(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Coach Type</label>
                <select
                  value={newBusType}
                  onChange={(e) => setNewBusType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                >
                  <option value="AC_SLEEPER">AC Sleeper</option>
                  <option value="AC_SEATER">AC Seater</option>
                  <option value="DELUXE_EXPRESS">Deluxe Express</option>
                  <option value="NON_AC_SEATER">Non-AC Seater</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Total Capacity</label>
                <input
                  type="number"
                  min={10}
                  max={60}
                  value={newBusSeats}
                  onChange={(e) => setNewBusSeats(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddBusModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-lavender-600 text-white font-bold"
                >
                  Save Bus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Schedule Modal */}
      {showAddSchedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-lavender-100 space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">Create Trip Schedule</h3>
            <form onSubmit={handleCreateSchedule} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Bus</label>
                <select
                  value={schedBusId}
                  onChange={(e) => setSchedBusId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                  required
                >
                  {buses.map((b) => (
                    <option key={b.id} value={b.id}>{b.busNumber} ({b.operator})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Route</label>
                <select
                  value={schedRouteId}
                  onChange={(e) => setSchedRouteId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                  required
                >
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>{r.routeName} ({r.totalDistanceKm} km)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Departure Time</label>
                <input
                  type="datetime-local"
                  required
                  value={schedDepTime}
                  onChange={(e) => setSchedDepTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Arrival Time</label>
                <input
                  type="datetime-local"
                  required
                  value={schedArrTime}
                  onChange={(e) => setSchedArrTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Standard Fare (₹)</label>
                <input
                  type="number"
                  min={100}
                  required
                  value={schedFare}
                  onChange={(e) => setSchedFare(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddSchedModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-lavender-600 text-white font-bold"
                >
                  Create & Generate Seats
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
