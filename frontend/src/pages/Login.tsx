import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bus, Mail, Lock, ArrowRight, ShieldCheck, User } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoUser = () => {
    setEmail('user@smarttravel.com');
    setPassword('User@1234');
  };

  const fillDemoAdmin = () => {
    setEmail('admin@smarttravel.com');
    setPassword('Admin@1234');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-lavender-100 shadow-xl space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-lavender-700 to-lavender-500 flex items-center justify-center text-white mx-auto shadow-lavender shadow-md mb-3">
            <Bus className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Welcome to SmartTravel</h2>
          <p className="text-xs text-slate-500 mt-1">
            Sign in to track buses, manage bookings, and receive destination alarms
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl">
            {error}
          </div>
        )}

        {/* Development-Only Credentials Quick Fill Bar */}
        {import.meta.env.DEV && (
          <div className="bg-lavender-50/80 p-3.5 rounded-2xl border border-lavender-200 text-xs space-y-2">
            <div className="text-[11px] font-bold text-lavender-900 uppercase tracking-wider">
              ⚡ Development Quick Logins:
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={fillDemoUser}
                className="flex-1 py-1.5 px-2 bg-white hover:bg-lavender-100 text-lavender-800 rounded-xl font-bold border border-lavender-200 transition-colors flex items-center justify-center space-x-1"
              >
                <User className="w-3.5 h-3.5" />
                <span>Passenger</span>
              </button>
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="flex-1 py-1.5 px-2 bg-white hover:bg-lavender-100 text-lavender-800 rounded-xl font-bold border border-lavender-200 transition-colors flex items-center justify-center space-x-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin (Dev)</span>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-lavender-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-lavender-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-lavender-600 hover:bg-lavender-700 text-white rounded-xl font-bold text-xs shadow-lavender flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:bg-slate-300"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-lavender-600 hover:text-lavender-800">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};
