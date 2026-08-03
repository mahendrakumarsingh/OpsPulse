import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock
} from 'lucide-react';

export default function IncidentsFeed({ incidents, services, currentRole, onAcknowledge, onResolve }) {
  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-rose-500/10 text-rose-600 border-rose-500/25';
      case 'High': return 'bg-orange-500/10 text-orange-600 border-orange-500/25';
      case 'Medium': return 'bg-amber-500/10 text-amber-600 border-amber-500/25';
      case 'Low': return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/25';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Triggered': return 'bg-rose-600/20 text-rose-600 border-rose-500/30 animate-pulse';
      case 'Acknowledged': return 'bg-amber-600/20 text-amber-600 border-amber-500/30';
      case 'Resolved': return 'bg-emerald-600/20 text-emerald-600 border-emerald-500/30';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const getServiceMap = (serviceId) => {
    const service = services.find(s => s._id === serviceId);
    return service ? service.name : 'Unknown Service';
  };

  const isAtLeastResponder = currentRole === 'Admin' || currentRole === 'Responder';

  const sortedIncidents = [...incidents].sort((a, b) => {
    if (a.status !== 'Resolved' && b.status === 'Resolved') return -1;
    if (a.status === 'Resolved' && b.status !== 'Resolved') return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            Incidents Response Log
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Real-time alert tracking, on-call assignments, and lifecycle updates.</p>
        </div>
        <div className="text-xs text-slate-500 font-bold">
          Total Incidents: <strong className="text-slate-700">{incidents.length}</strong>
        </div>
      </div>

      <div className="space-y-4">
        {sortedIncidents.length === 0 ? (
          <div className="text-center py-10">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="text-sm font-bold text-slate-800">All Systems Nominal</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">No triggered incidents active in the pipeline.</p>
          </div>
        ) : (
          sortedIncidents.map((incident) => (
            <div 
              key={incident._id} 
              className={`p-5 rounded-xl border transition-all duration-300 ${
                incident.status === 'Resolved' 
                  ? 'bg-slate-50/60 border-slate-200/60 opacity-60' 
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              {/* Row 1: Badges & Severity */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider border rounded-full uppercase ${getSeverityBadge(incident.severity)}`}>
                    {incident.severity}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold border rounded-full ${getStatusBadge(incident.status)}`}>
                    {incident.status}
                  </span>
                  <span className="text-xs text-indigo-650 font-bold">
                    {getServiceMap(incident.service)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                  <Clock className="h-3 w-3" />
                  {new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>

              {/* Row 2: Content */}
              <div>
                <h4 className="text-sm font-bold text-slate-900">{incident.title}</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">{incident.description}</p>
              </div>

              {/* Row 3: Timestamps, Responders, Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-3 border-t border-slate-100">
                <div className="flex gap-4 text-[10px] text-slate-400 font-semibold">
                  {incident.acknowledgedAt && (
                    <div>
                      ACKED: <span className="text-slate-650 font-bold">{new Date(incident.acknowledgedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                  {incident.resolvedAt && (
                    <div>
                      RESOLVED: <span className="text-emerald-600 font-bold">{new Date(incident.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {incident.status === 'Resolved' ? (
                    <span className="text-xs text-emerald-600 flex items-center gap-1 font-bold">
                      <CheckCircle className="h-4 w-4" /> Resolved
                    </span>
                  ) : (
                    <>
                      {incident.status === 'Triggered' && (
                        <button
                          disabled={!isAtLeastResponder}
                          onClick={() => onAcknowledge(incident._id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isAtLeastResponder
                              ? 'bg-amber-500/10 border border-amber-500/30 text-amber-600 hover:bg-amber-500/20'
                              : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          Acknowledge
                        </button>
                      )}
                      
                      {incident.status === 'Acknowledged' && (
                        <button
                          disabled={!isAtLeastResponder}
                          onClick={() => onResolve(incident._id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isAtLeastResponder
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/20'
                              : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          Resolve
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
