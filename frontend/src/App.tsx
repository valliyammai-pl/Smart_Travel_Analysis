import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AlarmProvider } from './context/AlarmContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AlarmAlertModal } from './components/AlarmAlertModal';

// Pages
import { Home } from './pages/Home';
import { SearchSchedules } from './pages/SearchSchedules';
import { SeatSelection } from './pages/SeatSelection';
import { LiveTracking } from './pages/LiveTracking';
import { MyBookings } from './pages/MyBookings';
import { DestinationAlarms } from './pages/DestinationAlarms';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/AdminDashboard';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AlarmProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-800">
            <Navbar />
            <AlarmAlertModal />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<SearchSchedules />} />
                <Route path="/booking/:id" element={<SeatSelection />} />
                <Route path="/tracking" element={<LiveTracking />} />
                <Route path="/my-bookings" element={<MyBookings />} />
                <Route path="/alarms" element={<DestinationAlarms />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin" element={<AdminDashboard />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AlarmProvider>
    </AuthProvider>
  );
};

export default App;
