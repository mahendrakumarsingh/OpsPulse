import React, { useState } from 'react';
import { Activity, ShieldAlert, Lock, Mail, User, Key } from 'lucide-react';
import { api } from '../utils/api';

export default function Login({ onAuthSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all credentials.');
      setLoading(false);
      return;
    }

    try {
      if (isRegistering) {
        if (!name.trim()) {
          setError('Please provide your name.');
          setLoading(false);
          return;
        }
        const data = await api.auth.register(name, email, password, 'Viewer');
        onAuthSuccess(data.token, data.user);
      } else {
        const data = await api.auth.login(email, password);
        onAuthSuccess(data.token, data.user);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to quickly login/register preset sandbox roles
  const handleSandboxLogin = async (role) => {
    setError('');
    setLoading(true);
    const mockEmail = `${role.toLowerCase()}@opspulse.io`;
    const mockPassword = 'password123';
    const mockName = `Demo ${role}`;

    try {
      // 1. Try to log in
      const data = await api.auth.login(mockEmail, mockPassword);
      onAuthSuccess(data.token, data.user);
    } catch (err) {
      // 2. If user not found, auto-register
      if (err.message.includes('credentials') || err.message.includes('not found') || err.message.includes('failed')) {
        try {
          const data = await api.auth.register(mockName, mockEmail, mockPassword, role);
          onAuthSuccess(data.token, data.user);
        } catch (regErr) {
          setError(`Sandbox seeding failed: ${regErr.message}`);
        }
      } else {
        setError(`Connection error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] bg-indigo-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] bg-emerald-500/5 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-slate-200/80 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-100 p-3.5 rounded-2xl border border-indigo-200 pulse-glow mb-4">
            <Activity className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="font-extrabold text-2xl text-slate-900 tracking-tight">OpsPulse</h1>
          <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">Incident Command Center</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs px-4 py-3 rounded-xl flex items-center gap-2 mb-6 font-semibold">
            <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4.5 space-y-4">
          {isRegistering && (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-750 focus:outline-none focus:border-indigo-500/50 focus:bg-white transition-all font-semibold"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                placeholder="e.g. admin@opspulse.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-750 focus:outline-none focus:border-indigo-500/50 focus:bg-white transition-all font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-750 focus:outline-none focus:border-indigo-500/50 focus:bg-white transition-all font-semibold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3.5 rounded-xl shadow-md shadow-indigo-650/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
          >
            <Key className="h-4 w-4" />
            {loading ? 'Authenticating...' : isRegistering ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Toggle Login/Register */}
        <div className="text-center mt-5">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-bold transition-all"
          >
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

        {/* Sandbox Presets divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Or Quick Connect (Sandbox)</span>
          </div>
        </div>

        {/* Sandbox Quick Logins */}
        <div className="grid grid-cols-3 gap-2">
          {['Admin', 'Responder', 'Viewer'].map((role) => (
            <button
              key={role}
              onClick={() => handleSandboxLogin(role)}
              disabled={loading}
              className="py-2.5 px-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200 hover:border-indigo-200 text-[10px] font-bold rounded-xl transition-all shadow-sm"
            >
              {role} Mode
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
