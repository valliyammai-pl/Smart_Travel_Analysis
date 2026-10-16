import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Schedule, Seat } from '../types';
import {
  Bus,
  CheckCircle2,
  Armchair,
  BellRing,
  Shield,
  ArrowRight,
  Info,
  Calendar,
  Clock,
  MapPin,
} from 'lucide-react';

export const SeatSelection: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  // Passenger form
  const [passengerName, setPassengerName] = useState('');
  const [passengerEmail, setPassengerEmail] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [pickupStop, setPickupStop] = useState('');
  const [dropoffStop, setDropoffStop] = useState('');
  const [enableAlarm, setEnableAlarm] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadSchedule() {
      try {
        const res = await api.get(`/schedules/${id}`);
        if (res.success && res.data) {
          setSchedule(res.data);
          const stops = res.data.route.stops || [];
          if (stops.length > 0) {
            setPickupStop(stops[0].stopName);
            setDropoffStop(stops[stops.length - 1].stopName);
          }
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to load schedule');
      } finally {
        setLoading(false);
      }
    }
    loadSchedule();
  }, [id]);

  useEffect(() => {
    if (user) {
      setPassengerName(user.name || '');
      setPassengerEmail(user.email || '');
      setPassengerPhone(user.phone || '');
    }
  }, [user]);

  const toggleSeat = (seatNumber: string, isBooked: boolean) => {
    if (isBooked) return;
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNumber));
    } else {
      setSelectedSeats([...selectedSeats, seatNumber]);
    }
  };

  const calculateTotal = () => {
    if (!schedule || !schedule.seats) return 0;
    return selectedSeats.reduce((sum, seatNum) => {
      const s = schedule.seats?.find((seat) => seat.seatNumber === seatNum);
      return sum + (s?.price || schedule.fare);
    }, 0);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (selectedSeats.length === 0) {
      setErrorMessage('Please select at least one seat from the layout.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      // Find coordinates of dropoff stop
      const dropoffStopObj = schedule?.route.stops?.find(
        (s) => s.stopName.toLowerCase() === dropoffStop.toLowerCase()
      );

      const payload = {
        scheduleId: schedule?.id,
        seatNumbers: selectedSeats,
        passengerName,
        passengerEmail,
        passengerPhone,
        pickupStop,
        dropoffStop,
        enableAlarm,
        targetLatitude: dropoffStopObj?.latitude,
        targetLongitude: dropoffStopObj?.longitude,
      };

      const res = await api.post('/bookings', payload);
      if (res.success) {
        navigate('/my-bookings');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-lavender-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm font-semibold text-slate-600">Loading seat layout and pricing...</p>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Schedule not found</h2>
        <button
          onClick={() => navigate('/search')}
          className="mt-4 px-4 py-2 bg-lavender-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Search
        </button>
      </div>
    );
  }

  const seats = schedule.seats || [];
  const stops = schedule.route.stops || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Route Header Info */}
      <div className="bg-white rounded-3xl p-6 border border-lavender-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-lavender-700 bg-lavender-100 px-2.5 py-0.5 rounded-full">
              {schedule.bus.busNumber} • {schedule.bus.type.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-slate-400 font-medium">| {schedule.bus.operator}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">{schedule.route.routeName}</h1>
          <div className="flex items-center space-x-4 text-xs text-slate-500 mt-2">
            <span className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-lavender-600" />
              {new Date(schedule.departureTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-lavender-600" />
              {new Date(schedule.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(schedule.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span>•</span>
            <span>{schedule.route.totalDistanceKm} km</span>
          </div>
        </div>

        <button
          onClick={() => navigate(`/tracking?busId=${schedule.busId}`)}
          className="px-4 py-2.5 rounded-xl bg-lavender-50 hover:bg-lavender-100 text-lavender-700 font-bold text-xs border border-lavender-200 transition-colors flex items-center space-x-1.5"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Track This Bus Live</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
          {errorMessage}
        </div>
      )}

      {/* Main Grid: Seat Matrix on Left, Booking Form on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Seat Selection Visual Matrix (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-lavender-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900">Select Your Seats</h3>
              <p className="text-xs text-slate-500 mt-0.5">Click to select or unselect seats</p>
            </div>
            {/* Seat legend */}
            <div className="flex items-center space-x-3 text-[11px] font-semibold text-slate-600">
              <div className="flex items-center space-x-1">
                <span className="w-3.5 h-3.5 rounded bg-white border border-slate-300"></span>
                <span>Available</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-3.5 h-3.5 rounded bg-lavender-600"></span>
                <span>Selected</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-3.5 h-3.5 rounded bg-slate-300"></span>
                <span>Booked</span>
              </div>
            </div>
          </div>

          {/* Coach Layout Visual */}
          <div className="max-w-md mx-auto bg-slate-50 rounded-3xl p-6 border-2 border-dashed border-slate-200">
            {/* Front of bus: Driver Cabin */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Front of Bus</span>
              <div className="flex items-center space-x-1 bg-slate-200 px-2.5 py-1 rounded-lg text-[10px] text-slate-700">
                <Armchair className="w-3.5 h-3.5" />
                <span>Driver</span>
              </div>
            </div>

            {/* Grid of Seats (2x2 layout with aisle) */}
            <div className="grid grid-cols-5 gap-3 items-center">
              {Array.from({ length: Math.ceil(seats.length / 4) }).map((_, rowIndex) => {
                const rowNum = rowIndex + 1;
                const seatA = seats.find((s) => s.seatNumber === `${rowNum}A`);
                const seatB = seats.find((s) => s.seatNumber === `${rowNum}B`);
                const seatC = seats.find((s) => s.seatNumber === `${rowNum}C`);
                const seatD = seats.find((s) => s.seatNumber === `${rowNum}D`);

                const renderSeatBtn = (seat?: Seat) => {
                  if (!seat) return <div className="w-10 h-10"></div>;
                  const isSelected = selectedSeats.includes(seat.seatNumber);
                  const isBooked = seat.isBooked;

                  return (
                    <button
                      type="button"
                      disabled={isBooked}
                      onClick={() => toggleSeat(seat.seatNumber, isBooked)}
                      className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all ${
                        isBooked
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed line-through'
                          : isSelected
                          ? 'bg-lavender-600 text-white shadow-lavender-sm shadow-md scale-105'
                          : 'bg-white text-slate-700 border border-slate-300 hover:border-lavender-500 hover:text-lavender-700 hover:bg-lavender-50/50'
                      }`}
                    >
                      <span>{seat.seatNumber}</span>
                      <span className="text-[9px] font-normal opacity-80">₹{seat.price}</span>
                    </button>
                  );
                };

                return (
                  <React.Fragment key={rowIndex}>
                    {/* Left Window & Aisle */}
                    {renderSeatBtn(seatA)}
                    {renderSeatBtn(seatB)}
                    {/* Center Gangway / Aisle */}
                    <div className="text-center text-[10px] text-slate-300 font-mono">
                      |
                    </div>
                    {/* Right Aisle & Window */}
                    {renderSeatBtn(seatC)}
                    {renderSeatBtn(seatD)}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Back of Bus */}
            <div className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-6 mt-6 border-t border-slate-200">
              Rear of Bus
            </div>
          </div>
        </div>

        {/* Right: Booking Summary & Passenger Details (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleBookingSubmit} className="bg-white rounded-3xl p-6 border border-lavender-100 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-900 pb-3 border-b border-slate-100">
              Passenger & Journey Details
            </h3>

            {/* Selected Seats summary */}
            <div className="bg-lavender-50/80 rounded-2xl p-4 border border-lavender-100">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500">Selected Seats:</span>
                <span className="font-extrabold text-lavender-800">
                  {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None selected'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t border-lavender-200/50 font-bold">
                <span className="text-slate-700">Total Payable:</span>
                <span className="text-lg text-lavender-700">₹{calculateTotal()}</span>
              </div>
            </div>

            {/* Passenger Fields */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary Passenger Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. priya@example.com"
                  value={passengerEmail}
                  onChange={(e) => setPassengerEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={passengerPhone}
                  onChange={(e) => setPassengerPhone(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500"
                />
              </div>

              {/* Boarding & Drop-off stops */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Boarding Point</label>
                  <select
                    value={pickupStop}
                    onChange={(e) => setPickupStop(e.target.value)}
                    className="w-full px-2.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-lavender-500"
                  >
                    {stops.map((stop) => (
                      <option key={stop.id} value={stop.stopName}>
                        {stop.stopName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Drop-off Point</label>
                  <select
                    value={dropoffStop}
                    onChange={(e) => setDropoffStop(e.target.value)}
                    className="w-full px-2.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-lavender-500"
                  >
                    {stops.map((stop) => (
                      <option key={stop.id} value={stop.stopName}>
                        {stop.stopName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Smart Destination Alarm Opt-In Banner */}
            <div className="bg-lavender-50 rounded-2xl p-4 border border-lavender-200 space-y-2">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableAlarm}
                  onChange={(e) => setEnableAlarm(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-lavender-600 rounded focus:ring-lavender-500"
                />
                <div>
                  <div className="font-bold text-xs text-lavender-900 flex items-center space-x-1">
                    <BellRing className="w-3.5 h-3.5 text-lavender-600" />
                    <span>Enable Smart Destination Alarm</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Automatically triggers audio and visual wake-up alerts on your device at <strong>2 km</strong>, <strong>500 m</strong>, and <strong>200 m</strong> before your stop.
                  </p>
                </div>
              </label>
            </div>

            {/* Booking Submit Button */}
            <button
              type="submit"
              disabled={submitting || selectedSeats.length === 0}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm text-white shadow-lavender shadow-md flex items-center justify-center space-x-2 transition-all ${
                submitting || selectedSeats.length === 0
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-lavender-600 hover:bg-lavender-700 active:scale-95'
              }`}
            >
              {submitting ? (
                <span>Confirming Seat Reservation...</span>
              ) : (
                <>
                  <span>Confirm Booking (₹{calculateTotal()})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {!isAuthenticated && (
              <p className="text-[11px] text-center text-slate-400">
                You will be prompted to sign in or create an account to finalize your booking.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
