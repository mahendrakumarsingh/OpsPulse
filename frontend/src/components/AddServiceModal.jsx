import React, { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';

export default function AddServiceModal({ isOpen, onClose, onAddService, currentRole }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [interval, setInterval] = useState(60);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Service name is required.');
    if (!url.trim()) return setError('Healthcheck URL is required.');

    try {
      new URL(url);
    } catch (_) {
      return setError('Please enter a valid URL (e.g. https://api.myserver.com/health).');
    }

    onAddService({
      name,
      url,
      checkInterval: parseInt(interval, 10),
      status: 'Operational',
      uptimePercent: 100,
      latency: Math.floor(Math.random() * 80) + 15
    });

    setName('');
    setUrl('');
    setInterval(60);
    onClose();
  };

  const isAuthorized = currentRole === 'Admin' || currentRole === 'Responder';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-md glass-panel p-6 rounded-2xl border border-slate-200 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Plus className="h-5 w-5 text-indigo-650 text-indigo-600" />
            Add Monitored Endpoint
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-100 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!isAuthorized ? (
          <div className="text-center py-6">
            <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="h-5 w-5 text-rose-500" />
            </div>
            <p className="text-sm font-bold text-slate-800">Access Denied</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[280px] mx-auto leading-relaxed font-semibold">
              Your simulator role ({currentRole}) does not have permission to add monitoring targets. Toggle to **Admin** or **Responder** in the sidebar.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs px-3 py-2.5 rounded-lg flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Service Name
              </label>
              <input
                type="text"
                placeholder="e.g. Authentication API"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500/50 focus:bg-white transition-all font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Healthcheck URL
              </label>
              <input
                type="text"
                placeholder="e.g. https://auth.opspulse.local/health"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500/50 focus:bg-white transition-all font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Monitoring Interval
              </label>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500/50 focus:bg-white transition-all font-semibold"
              >
                <option value={10}>Every 10 seconds (Testing)</option>
                <option value={30}>Every 30 seconds</option>
                <option value={60}>Every 60 seconds (Default)</option>
                <option value={300}>Every 5 minutes</option>
              </select>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-200 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-650 font-bold text-xs py-2.5 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-indigo-650 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-md shadow-indigo-600/10 transition-all"
              >
                Start Monitoring
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
