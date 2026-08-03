import React from 'react';
import { 
  CheckCircle2, 
  AlertOctagon, 
  Clock, 
  Heart 
} from 'lucide-react';

export default function DashboardStats({ services, incidents }) {
  // Compute Stats
  const totalServices = services.length;
  const operationalServices = services.filter(s => s.status === 'Operational').length;
  const majorOutageServices = services.filter(s => s.status === 'Major Outage').length;
  
  const activeIncidents = incidents.filter(i => i.status !== 'Resolved');
  const criticalIncidents = activeIncidents.filter(i => i.severity === 'Critical' || i.severity === 'High').length;

  // Calculate Average Uptime
  const averageUptime = totalServices > 0 
    ? (services.reduce((acc, s) => acc + s.uptimePercent, 0) / totalServices).toFixed(3)
    : "100.00";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* System Health */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
        <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all duration-300"></div>
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Uptime</span>
            <h3 className="text-2xl font-black text-slate-100 mt-2 tracking-tight">{averageUptime}%</h3>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
            <Heart className="h-5 w-5 text-emerald-400 fill-emerald-500/10" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>All endpoints monitored</span>
        </div>
      </div>

      {/* Monitored Services */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
        <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all duration-300"></div>
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monitored Services</span>
            <h3 className="text-2xl font-black text-slate-100 mt-2 tracking-tight">
              {operationalServices}/{totalServices}
            </h3>
          </div>
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl">
            <CheckCircle2 className="h-5 w-5 text-indigo-400" />
          </div>
        </div>
        <div className="mt-4 text-xs text-slate-400">
          {majorOutageServices > 0 ? (
            <span className="text-rose-400 font-medium">{majorOutageServices} service reporting outages</span>
          ) : (
            <span>All systems nominal</span>
          )}
        </div>
      </div>

      {/* Active Incidents */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
        <div className="absolute top-0 right-0 h-24 w-24 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all duration-300"></div>
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Incidents</span>
            <h3 className="text-2xl font-black text-slate-100 mt-2 tracking-tight">
              {activeIncidents.length}
            </h3>
          </div>
          <div className={`border p-3 rounded-xl ${
            activeIncidents.length > 0
              ? 'bg-rose-500/10 border-rose-500/20'
              : 'bg-slate-800/40 border-slate-700'
          }`}>
            <AlertOctagon className={`h-5 w-5 ${
              activeIncidents.length > 0 ? 'text-rose-400' : 'text-slate-400'
            }`} />
          </div>
        </div>
        <div className="mt-4 text-xs">
          {criticalIncidents > 0 ? (
            <span className="text-rose-400 font-semibold">{criticalIncidents} Critical severity</span>
          ) : (
            <span className="text-slate-400">0 critical incidents active</span>
          )}
        </div>
      </div>

      {/* MTTR / Performance */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
        <div className="absolute top-0 right-0 h-24 w-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all duration-300"></div>
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg MTTR</span>
            <h3 className="text-2xl font-black text-slate-100 mt-2 tracking-tight">14.2 min</h3>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
        </div>
        <div className="mt-4 text-xs text-slate-400 flex items-center justify-between">
          <span>Avg MTTA: <strong>2.1 min</strong></span>
          <span className="text-emerald-400 font-semibold">-8.4% MoM</span>
        </div>
      </div>
    </div>
  );
}
