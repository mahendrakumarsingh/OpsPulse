import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardStats from './components/DashboardStats';
import ServicesList from './components/ServicesList';
import IncidentsFeed from './components/IncidentsFeed';
import AddServiceModal from './components/AddServiceModal';
import { 
  Plus, 
  RefreshCw, 
  AlertOctagon, 
  HelpCircle,
  Activity,
  Terminal
} from 'lucide-react';

const INITIAL_SERVICES = [
  { _id: 's1', name: 'User Authentication Portal', url: 'https://auth.opspulse.local/health', status: 'Operational', checkInterval: 30, uptimePercent: 99.98, latency: 42 },
  { _id: 's2', name: 'Billing & Subscriptions API', url: 'https://billing.opspulse.local/health', status: 'Operational', checkInterval: 60, uptimePercent: 99.85, latency: 125 },
  { _id: 's3', name: 'Asset Delivery CDN', url: 'https://cdn.opspulse.local/status', status: 'Operational', checkInterval: 10, uptimePercent: 100.00, latency: 12 },
  { _id: 's4', name: 'Primary Mongo Database Cluster', url: 'mongodb://db-primary.opspulse.local:27017', status: 'Operational', checkInterval: 30, uptimePercent: 99.99, latency: 8 },
];

const INITIAL_INCIDENTS = [
  { _id: 'i1', title: 'Billing API Latency Spike', description: 'Avg latency exceeded threshold of 200ms. Root cause: high database connection contention.', severity: 'High', status: 'Resolved', service: 's2', assignedTo: null, acknowledgedAt: new Date(Date.now() - 3600000), resolvedAt: new Date(Date.now() - 1800000), createdAt: new Date(Date.now() - 7200000) },
];

export default function App() {
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [currentRole, setCurrentRole] = useState('Admin');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recentAlert, setRecentAlert] = useState(null);

  // Background Simulation: Randomize service latency and simulate outages
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Randomize latencies for operational services
      setServices(prev => prev.map(s => {
        if (s.status === 'Operational') {
          const delta = Math.floor(Math.random() * 20) - 10;
          const newLatency = Math.max(5, s.latency + delta);
          return { ...s, latency: newLatency };
        }
        return s;
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Simulate an automated incident after 25 seconds of run-time to demonstrate WebSockets mock
  useEffect(() => {
    const alertTimeout = setTimeout(() => {
      triggerAutomaticIncident();
    }, 25000);
    return () => clearTimeout(alertTimeout);
  }, []);

  const triggerAutomaticIncident = () => {
    // Pick the billing service
    const targetServiceId = 's2';
    setServices(prev => prev.map(s => {
      if (s._id === targetServiceId) {
        return { ...s, status: 'Degraded', latency: 450 };
      }
      return s;
    }));

    const newIncident = {
      _id: 'i_auto_' + Date.now(),
      title: 'Automated System Alert: High Latency',
      description: 'Billing & Subscriptions API returned latency above SLA threshold (450ms). Triggered via automated synthetic testing.',
      severity: 'Medium',
      status: 'Triggered',
      service: targetServiceId,
      createdAt: new Date()
    };

    setIncidents(prev => [newIncident, ...prev]);
    setRecentAlert(newIncident);

    // Auto-clear notification after 6 seconds
    setTimeout(() => {
      setRecentAlert(null);
    }, 6000);
  };

  // Trigger Outage Manually
  const handleTriggerFailure = (serviceId) => {
    const target = services.find(s => s._id === serviceId);
    if (!target) return;

    setServices(prev => prev.map(s => {
      if (s._id === serviceId) {
        return { ...s, status: 'Major Outage', latency: 0 };
      }
      return s;
    }));

    const newIncident = {
      _id: 'i_manual_' + Date.now(),
      title: `Critical Alert: ${target.name} Down`,
      description: `Service responded with 502 Bad Gateway. Scheduled health checks failed to reach health endpoint.`,
      severity: 'Critical',
      status: 'Triggered',
      service: serviceId,
      createdAt: new Date()
    };

    setIncidents(prev => [newIncident, ...prev]);
    setRecentAlert(newIncident);

    setTimeout(() => {
      setRecentAlert(null);
    }, 6000);
  };

  // Recover Service Manually
  const handleTriggerRecovery = (serviceId) => {
    setServices(prev => prev.map(s => {
      if (s._id === serviceId) {
        return { ...s, status: 'Operational', latency: Math.floor(Math.random() * 40) + 15 };
      }
      return s;
    }));

    // Find and resolve the incident
    setIncidents(prev => prev.map(inc => {
      if (inc.service === serviceId && inc.status !== 'Resolved') {
        return {
          ...inc,
          status: 'Resolved',
          resolvedAt: new Date()
        };
      }
      return inc;
    }));
  };

  // Delete Service
  const handleDeleteService = (serviceId) => {
    setServices(prev => prev.filter(s => s._id !== serviceId));
    // Clear outstanding incidents related to it
    setIncidents(prev => prev.filter(inc => inc.service !== serviceId));
  };

  // Add Service
  const handleAddService = (newService) => {
    setServices(prev => [...prev, { ...newService, _id: 's_new_' + Date.now() }]);
  };

  // Acknowledge Incident
  const handleAcknowledge = (incidentId) => {
    setIncidents(prev => prev.map(inc => {
      if (inc._id === incidentId) {
        return {
          ...inc,
          status: 'Acknowledged',
          acknowledgedAt: new Date()
        };
      }
      return inc;
    }));
  };

  // Resolve Incident
  const handleResolve = (incidentId) => {
    const incident = incidents.find(i => i._id === incidentId);
    if (!incident) return;

    setIncidents(prev => prev.map(inc => {
      if (inc._id === incidentId) {
        return {
          ...inc,
          status: 'Resolved',
          resolvedAt: new Date()
        };
      }
      return inc;
    }));

    // Re-heal the service
    handleTriggerRecovery(incident.service);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar 
        currentRole={currentRole} 
        setCurrentRole={setCurrentRole} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      {/* Main Panel */}
      <main className="flex-1 ml-64 p-8 min-h-screen">
        {/* Dynamic Notification Toast */}
        {recentAlert && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm glass-panel p-4 rounded-xl border-rose-500/40 bg-rose-950/20 text-rose-200 shadow-2xl flex items-start gap-3 animate-bounce">
            <AlertOctagon className="h-5 w-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h5 className="font-bold text-xs text-rose-100 uppercase tracking-wider">Alert Broadcasted</h5>
              <p className="text-xs mt-1 font-semibold">{recentAlert.title}</p>
              <p className="text-[10px] text-rose-300/80 mt-0.5">Real-time update via mock-Websocket feed.</p>
            </div>
          </div>
        )}

        {/* Global Page Header */}
        <header className="flex items-center justify-between pb-6 border-b border-slate-900 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight capitalize">
              {activeTab} Overview
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Active Role: <strong className="text-indigo-400 font-semibold">{currentRole}</strong> • Mode: <span className="text-emerald-400 font-semibold">Live Sandbox</span>
            </p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={triggerAutomaticIncident}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-xs font-semibold rounded-xl text-slate-400 hover:text-slate-200 flex items-center gap-1.5 hover:bg-slate-850 transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Force Synthetic Outage
            </button>

            {(currentRole === 'Admin' || currentRole === 'Responder') && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 transition-all"
              >
                <Plus className="h-4 w-4" /> Add Service
              </button>
            )}
          </div>
        </header>

        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Stats Counter Grid */}
            <DashboardStats services={services} incidents={incidents} />

            {/* Middle Section: Metrics SVG Graph & Live Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Latency History (Recharts/Chart.js replacement) */}
              <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800/80">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
                      <Activity className="h-4.5 w-4.5 text-indigo-400" />
                      Synthetic Latency Analytics (p95 latency trend)
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Custom SVG real-time visual area telemetry plotter.</p>
                  </div>
                  <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                    SLA Limit: 200ms
                  </span>
                </div>

                {/* Custom SVG Graph */}
                <div className="h-48 relative w-full mt-4">
                  <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Grid Lines */}
                    <line x1="0" y1="20" x2="500" y2="20" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />
                    <line x1="0" y1="50" x2="500" y2="50" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />
                    <line x1="0" y1="80" x2="500" y2="80" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />
                    
                    {/* Area Graph */}
                    <path
                      d="M 0 100 L 0 70 Q 50 20 100 80 T 200 40 T 300 85 T 400 30 L 500 65 L 500 100 Z"
                      fill="url(#glow)"
                    />
                    {/* Line Graph */}
                    <path
                      d="M 0 70 Q 50 20 100 80 T 200 40 T 300 85 T 400 30 L 500 65"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="2.5"
                    />
                    
                    {/* Highlighting anomaly alert */}
                    <circle cx="400" cy="30" r="4.5" fill="#f43f5e" stroke="#18181b" strokeWidth="1.5" className="animate-ping" />
                  </svg>
                  
                  {/* Axis indicators */}
                  <div className="absolute top-1 right-2 text-[9px] font-bold text-slate-500">200ms</div>
                  <div className="absolute top-[44%] right-2 text-[9px] font-bold text-slate-500">100ms</div>
                  <div className="absolute bottom-1 right-2 text-[9px] font-bold text-slate-500">0ms</div>
                </div>
              </div>

              {/* Shell Logger Terminal / Event logs */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
                    <Terminal className="h-4.5 w-4.5 text-indigo-400" />
                    DevOps Shell Monitor
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Shell diagnostic output for active background tasks.</p>
                </div>
                <div className="mt-4 flex-1 bg-slate-950 border border-slate-900 rounded-xl p-3 font-mono text-[9px] text-indigo-300 space-y-1.5 overflow-y-auto max-h-[140px]">
                  <div>[08:34:01] INF: Starting monitor check...</div>
                  <div>[08:34:01] DBG: Connection to MongoDB ok (ping 8ms)</div>
                  <div>[08:34:02] INF: Service Billing API latency 125ms</div>
                  <div>[08:34:02] WRN: SLA response target for CDN near limits</div>
                  {incidents.filter(i => i.status !== 'Resolved').map((inc) => (
                    <div key={inc._id} className="text-rose-400 animate-pulse font-bold">
                      [08:34:25] ERR: {inc.title} - Severity {inc.severity}!
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Split Screen Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3">
                <ServicesList 
                  services={services} 
                  currentRole={currentRole}
                  onDeleteService={handleDeleteService}
                  onTriggerFailure={handleTriggerFailure}
                  onTriggerRecovery={handleTriggerRecovery}
                />
              </div>
              <div className="lg:col-span-2">
                <IncidentsFeed 
                  incidents={incidents}
                  services={services}
                  currentRole={currentRole}
                  onAcknowledge={handleAcknowledge}
                  onResolve={handleResolve}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Services Full View */}
        {activeTab === 'services' && (
          <ServicesList 
            services={services} 
            currentRole={currentRole}
            onDeleteService={handleDeleteService}
            onTriggerFailure={handleTriggerFailure}
            onTriggerRecovery={handleTriggerRecovery}
          />
        )}

        {/* Tab 3: Incidents Full View */}
        {activeTab === 'incidents' && (
          <IncidentsFeed 
            incidents={incidents}
            services={services}
            currentRole={currentRole}
            onAcknowledge={handleAcknowledge}
            onResolve={handleResolve}
          />
        )}
      </main>

      {/* Add Service Modal */}
      <AddServiceModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddService={handleAddService}
        currentRole={currentRole}
      />
    </div>
  );
}
