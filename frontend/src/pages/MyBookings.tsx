import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Booking, BookingStatus } from '../types';
import {
  Ticket,
  MapPin,
  Calendar,
  Clock,
  BellRing,
  AlertOctagon,
  CheckCircle,
  XCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const MyBookings: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/my-bookings');
      if (res.success && res.data) {
        setBookings(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking? Your seats will be immediately released to other passengers.')) {
      return;
    }

    setCancellingId(bookingId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.post(`/bookings/${bookingId}/cancel`);
      if (res.success) {
        setSuccessMsg('Booking cancelled successfully and seats have been restored.');
        fetchBookings();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-lavender-100 shadow-sm text-center">
        <Ticket className="w-12 h-12 text-lavender-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Sign in to view your bookings</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Access your confirmed tickets, live bus telemetry, and destination alarms.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="w-full py-2.5 bg-lavender-600 hover:bg-lavender-700 text-white font-bold text-xs rounded-xl"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Travel Bookings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your booked trips, track fleet buses in real time, and monitor destination alarms.
          </p>
        </div>

        <button
          onClick={() => navigate('/search')}
          className="px-4 py-2.5 bg-lavender-600 hover:bg-lavender-700 text-white rounded-xl text-xs font-bold shadow-lavender-sm flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <span>Book Another Trip</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-2xl flex items-center space-x-2">
          <AlertOctagon className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 animate-pulse h-48"></div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-lavender-100 shadow-sm">
          <Ticket className="w-12 h-12 text-lavender-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">You have no active bookings</h3>
          <p className="text-xs text-slate-500 mt-1">
            Find an upcoming schedule from Bangalore, Chennai, Mumbai, or Pune to get started.
          </p>
          <button
            onClick={() => navigate('/search')}
            className="mt-4 px-5 py-2.5 bg-lavender-600 text-white rounded-xl text-xs font-bold shadow-lavender-sm"
          >
            Explore Routes
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isCancelled = booking.status === 'CANCELLED';
            const hasAlarm = booking.alarms && booking.alarms.length > 0;
            const depDate = new Date(booking.schedule.departureTime);

            return (
              <div
                key={booking.id}
                className={`bg-white rounded-3xl p-6 border transition-all ${
                  isCancelled
                    ? 'border-slate-200 opacity-75'
                    : 'border-lavender-100 shadow-sm hover:border-lavender-300'
                }`}
              >
                {/* Header row: Reference & Status */}
                <div className="flex flex-wrap items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-sm text-lavender-800 bg-lavender-50 px-2.5 py-1 rounded-lg border border-lavender-200">
                      {booking.bookingReference}
                    </span>
                    <span className="text-xs text-slate-400">
                      Booked on {new Date(booking.bookingDate).toLocaleDateString()}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                      isCancelled
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>

                {/* Body Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Journey info */}
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-base text-slate-900">
                      {booking.schedule.route.routeName}
                    </h4>
                    <div className="text-xs text-slate-500">
                      Operator: <strong className="text-slate-800">{booking.schedule.bus.operator}</strong> ({booking.schedule.bus.busNumber})
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-600 pt-1">
                      <Calendar className="w-3.5 h-3.5 text-lavender-600" />
                      <span>{depDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <Clock className="w-3.5 h-3.5 text-lavender-600 ml-2" />
                      <span>{depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Passenger & Stops */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div>
                      Passenger: <strong className="text-slate-900">{booking.passengerName}</strong>
                    </div>
                    <div>
                      Seats: <strong className="text-lavender-700 bg-lavender-50 px-2 py-0.5 rounded font-mono font-bold">{booking.seatNumbers.join(', ')}</strong>
                    </div>
                    <div>
                      Boarding: <strong className="text-slate-800">{booking.pickupStop || booking.schedule.route.source}</strong>
                    </div>
                    <div>
                      Drop-off: <strong className="text-slate-800">{booking.dropoffStop || booking.schedule.route.destination}</strong>
                    </div>
                  </div>

                  {/* Actions & Price */}
                  <div className="flex flex-col justify-between items-start md:items-end">
                    <div className="text-left md:text-right">
                      <div className="text-xs text-slate-400">Total Paid</div>
                      <div className="text-2xl font-black text-slate-900">₹{booking.totalAmount}</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
                      {!isCancelled && (
                        <>
                          <button
                            onClick={() =>
                              navigate(
                                `/tracking?busId=${booking.schedule.busId}&targetStop=${encodeURIComponent(
                                  booking.dropoffStop || ''
                                )}`
                              )
                            }
                            className="px-3.5 py-2 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white font-bold text-xs shadow-lavender-sm flex items-center space-x-1"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Track Bus Live</span>
                          </button>

                          <button
                            disabled={cancellingId === booking.id}
                            onClick={() => handleCancelBooking(booking.id)}
                            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors"
                          >
                            {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Alarm Status Badge */}
                {hasAlarm && !isCancelled && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-lavender-800 bg-lavender-50/60 px-3 py-2 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <BellRing className="w-4 h-4 text-lavender-600" />
                      <span>
                        Destination Alarm is <strong>Active</strong> for{' '}
                        <strong>{booking.dropoffStop}</strong> (Alerts at 2 km, 500 m, 200 m).
                      </span>
                    </div>
                    <button
                      onClick={() => navigate('/alarms')}
                      className="font-bold text-lavender-700 hover:underline"
                    >
                      Manage Alarm
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
