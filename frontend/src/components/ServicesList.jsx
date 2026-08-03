import React from 'react';
import { 
  Trash2, 
  ExternalLink,
  Zap
} from 'lucide-react';

export default function ServicesList({ services, currentRole, onDeleteService, onTriggerFailure, onTriggerRecovery }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Operational': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25';
      case 'Degraded': return 'bg-amber-500/10 text-amber-600 border-amber-500/25';
      case 'Major Outage': return 'bg-rose-500/10 text-rose-600 border-rose-500/25';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case 'Operational': return 'bg-emerald-500';
      case 'Degraded': return 'bg-amber-500';
      case 'Major Outage': return 'bg-rose-500';
      default: return 'bg-slate-400';
    }
  };

  const isAtLeastResponder = currentRole === 'Admin' || currentRole === 'Responder';
  const isAdmin = currentRole === 'Admin';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Infrastructure Endpoints</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Live status of active backend microservices and databases.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {services.map((service) => (
          <div key={service._id} className="glass-panel p-6 rounded-2xl border border-slate-200/80 hover:border-indigo-500/20 transition-all duration-300 shadow-sm">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-slate-900">{service.name}</h3>
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold border rounded-full flex items-center gap-1 ${getStatusColor(service.status)}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${getStatusDot(service.status)} ${service.status !== 'Operational' ? 'animate-pulse' : ''}`}></span>
                    {service.status}
                  </span>
                </div>
                <a 
                  href={service.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs text-slate-500 hover:text-indigo-650 flex items-center gap-1 mt-1 transition-colors font-medium"
                >
                  {service.url} <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Management Actions */}
              <div className="flex gap-1.5">
                {isAtLeastResponder && (
                  <button 
                    onClick={() => {
                      if (service.status === 'Operational') {
                        onTriggerFailure(service._id);
                      } else {
                        onTriggerRecovery(service._id);
                      }
                    }}
                    title={service.status === 'Operational' ? 'Simulate Outage' : 'Resolve Outage'}
                    className={`p-2 rounded-lg border text-xs font-bold transition-all ${
                      service.status === 'Operational'
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 hover:bg-rose-500/20'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20'
                    }`}
                  >
                    {service.status === 'Operational' ? 'Simulate Failure' : 'Heal Service'}
                  </button>
                )}

                {isAdmin && (
                  <button
                    onClick={() => onDeleteService(service._id)}
                    title="Delete Monitor"
                    className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all shadow-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 shadow-inner">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Uptime</span>
                <span className="text-sm font-bold text-slate-700 mt-1 block">
                  {service.uptimePercent}%
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Latency</span>
                <span className="text-sm font-bold text-slate-700 mt-1 flex items-center gap-1 mt-1">
                  <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500/10" />
                  {service.latency || 45} ms
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Interval</span>
                <span className="text-sm font-bold text-slate-700 mt-1 block">
                  {service.checkInterval}s
                </span>
              </div>
            </div>

            {/* Uptime Spark Blocks */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Uptime History (Last 30 Checks)</span>
                <span className="text-[10px] text-emerald-600 font-extrabold">99.9% Reliable</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 30 }).map((_, idx) => {
                  const isFailed = service.status === 'Major Outage' && idx >= 27;
                  const isDegradedHistory = service.status === 'Degraded' && idx === 14;
                  return (
                    <div 
                      key={idx} 
                      className={`h-4 flex-1 rounded-sm transition-all duration-200 ${
                        isFailed 
                          ? 'bg-rose-500 shadow-sm shadow-rose-500/25' 
                          : isDegradedHistory 
                            ? 'bg-amber-500' 
                            : 'bg-emerald-500/80 hover:bg-emerald-500'
                      }`}
                      title={isFailed ? 'Outage recorded' : isDegradedHistory ? 'Degraded latency' : 'Operational'}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
