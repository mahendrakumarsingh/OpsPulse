import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardStats from './components/DashboardStats';
import ServicesList from './components/ServicesList';
import IncidentsFeed from './components/IncidentsFeed';
import AddServiceModal from './components/AddServiceModal';
import Login from './components/Login';
import { api } from './utils/api';
import { io } from 'socket.io-client';
import { 
  Plus, 
  RefreshCw, 
  AlertOctagon, 
  Activity,
  Terminal
} from 'lucide-react';

const SOCKET_URL = 'http://localhost:5000';

export default function App() {
  // Authentication State
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

  // App Core State
  const [services, setServices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [currentRole, setCurrentRole] = useState(user?.role || 'Viewer');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recentAlert, setRecentAlert] = useState(null);
  
  // DevOps Terminal Logs State
  const [logs, setLogs] = useState([
    '[08:34:01] INF: Starting monitor check...',
    '[08:34:01] DBG: Connection to MongoDB ok (ping 8ms)'
  ]);

  // Socket Connection Instance
  const [socket, setSocket] = useState(null);

  // Initialize WebSockets
  useEffect(() => {
    if (!token) return;

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      addLog(`[WebSocket] Linked to server node: ${newSocket.id}`);
    });

    newSocket.on('service:metrics', (data) => {
      setServices(prev => prev.map(s => {
        if (s._id === data.serviceId) {
          return { 
            ...s, 
            status: data.status, 
            latency: data.latency, 
            uptimePercent: data.uptimePercent 
          };
        }
        return s;
      }));
    });

    newSocket.on('incident:triggered', (data) => {
      setIncidents(prev => [data.incident, ...prev]);
      setServices(prev => prev.map(s => {
        if (s._id === data.service._id) {
          return { ...s, status: data.service.status, latency: 0 };
        }
        return s;
      }));
      setRecentAlert(data.incident);
      addLog(`[Outage Alert] ${data.incident.title} (Severity: ${data.incident.severity})`);
      
      setTimeout(() => {
        setRecentAlert(null);
      }, 6000);
    });

    newSocket.on('incident:acknowledged', (updatedIncident) => {
      setIncidents(prev => prev.map(inc => inc._id === updatedIncident._id ? updatedIncident : inc));
      addLog(`[Incident Ack] Alert ${updatedIncident._id} acknowledged`);
    });

    newSocket.on('incident:resolved', (data) => {
      setIncidents(prev => prev.map(inc => inc._id === data.incident._id ? data.incident : inc));
      if (data.service) {
        setServices(prev => prev.map(s => {
          if (s._id === data.service._id) {
            return { ...s, status: data.service.status, latency: data.service.latency };
          }
          return s;
        }));
      }
      addLog(`[Service Recovery] Incident resolved, system healthy.`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  // Fetch Initial Data on Token Presence
  useEffect(() => {
    if (!token) return;

    const fetchInitialData = async () => {
      try {
        const servicesRes = await api.services.getAll();
        setServices(servicesRes.data);
        addLog(`[API] Loaded ${servicesRes.data.length} microservices configurations`);

        const incidentsRes = await api.incidents.getAll();
        setIncidents(incidentsRes.data);
        addLog(`[API] Loaded ${incidentsRes.data.length} historical incident reports`);
      } catch (err) {
        addLog(`[API Error] Data fetch failed: ${err.message}`);
        if (err.message.includes('401') || err.message.includes('token') || err.message.includes('expired')) {
          handleLogout();
        }
      }
    };

    fetchInitialData();
  }, [token]);

  // Helper to push line logs to console
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev.slice(-15), `[${timestamp}] ${message}`]);
  };

  const handleAuthSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    setCurrentRole(newUser.role);
    addLog(`[Auth] Logged in successfully as ${newUser.name} (${newUser.role})`);
  };

  const handleLogout = () => {
    api.auth.logout();
    setToken('');
    setUser(null);
    setServices([]);
    setIncidents([]);
    addLog('[Auth] Signed out. Session cleared.');
  };

  // Add Service
  const handleAddService = async (newService) => {
    try {
      const res = await api.services.create(newService);
      setServices(prev => [...prev, res.data]);
      addLog(`[API] Monitored target registered: ${res.data.name}`);
    } catch (err) {
      addLog(`[API Error] Failed to create monitor: ${err.message}`);
    }
  };

  // Delete Service
  const handleDeleteService = async (serviceId) => {
    try {
      await api.services.delete(serviceId);
      setServices(prev => prev.filter(s => s._id !== serviceId));
      setIncidents(prev => prev.filter(inc => inc.service !== serviceId));
      addLog(`[API] Service monitor ID ${serviceId} deleted`);
    } catch (err) {
      addLog(`[API Error] Delete operation failed: ${err.message}`);
    }
  };

  // Trigger Outage Manually (via REST API)
  const handleTriggerFailure = async (serviceId) => {
    const target = services.find(s => s._id === serviceId);
    if (!target) return;

    try {
      await api.incidents.trigger({
        title: `Manual Outage: ${target.name} Failed`,
        description: `Responder manual check failure triggered. Latency spikes above SLA limit.`,
        severity: 'High',
        serviceId: serviceId
      });
      addLog(`[API] Posted manual check failure for ${target.name}`);
    } catch (err) {
      addLog(`[API Error] Failed to post failure event: ${err.message}`);
    }
  };

  // Recover Service Manually (via REST API)
  const handleTriggerRecovery = async (serviceId) => {
    // Find any active incident associated with this service and resolve it
    const activeInc = incidents.find(i => i.service?._id === serviceId && i.status !== 'Resolved');
    if (activeInc) {
      handleResolve(activeInc._id);
    } else {
      // Fallback update
      addLog(`[API] Manual recovery check ping sent for ${serviceId}`);
    }
  };

  // Acknowledge Incident
  const handleAcknowledge = async (incidentId) => {
    try {
      await api.incidents.acknowledge(incidentId);
    } catch (err) {
      addLog(`[API Error] Failed to ack incident: ${err.message}`);
    }
  };

  // Resolve Incident
  const handleResolve = async (incidentId) => {
    try {
      await api.incidents.resolve(incidentId);
    } catch (err) {
      addLog(`[API Error] Failed to resolve incident: ${err.message}`);
    }
  };

  // Force Synthetic Outage on Billing API
  const handleForceSynthetic = async () => {
    const target = services.find(s => s.name.includes('Billing') || s.name.includes('Authentication'));
    if (!target) return addLog('[Alert] No candidate microservice found for synthetic outage.');
    handleTriggerFailure(target._id);
  };

  // Render Login overlay if token is absent
  if (!token) {
    return <Login onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar Navigation */}
      <Sidebar 
        currentRole={currentRole} 
        setCurrentRole={setCurrentRole} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userName={user?.name}
        onLogout={handleLogout}
      />

      {/* Main Panel */}
      <main className="flex-1 ml-64 p-8 min-h-screen">
        {/* Dynamic Notification Toast */}
        {recentAlert && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm glass-panel p-4 rounded-xl border-rose-300 bg-rose-50 text-rose-900 shadow-2xl flex items-start gap-3 animate-bounce">
            <AlertOctagon className="h-5 w-5 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h5 className="font-bold text-xs text-rose-950 uppercase tracking-wider">Alert Broadcasted</h5>
              <p className="text-xs mt-1 font-bold">{recentAlert.title}</p>
              <p className="text-[10px] text-rose-700/80 mt-0.5 font-semibold">Real-time update via Socket.io broadcast.</p>
            </div>
          </div>
        )}

        {/* Global Page Header */}
        <header className="flex items-center justify-between pb-6 border-b border-slate-200 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight capitalize">
              {activeTab} Overview
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Active User: <strong className="text-indigo-650 text-indigo-600">{user?.name}</strong> • Mode: <span className="text-emerald-600 font-bold">Live Production Sync</span>
            </p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleForceSynthetic}
              className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold rounded-xl text-slate-650 hover:text-slate-800 flex items-center gap-1.5 hover:bg-slate-50 transition-all shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" /> Force Synthetic Outage
            </button>

            {(currentRole === 'Admin' || currentRole === 'Responder') && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-3.5 py-2 bg-indigo-650 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/10 transition-all"
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
              {/* Latency History */}
              <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-850 text-slate-800 flex items-center gap-2">
                      <Activity className="h-4.5 w-4.5 text-indigo-600" />
                      Synthetic Latency Analytics (p95 latency trend)
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Custom SVG real-time visual area telemetry plotter.</p>
                  </div>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">
                    SLA Limit: 200ms
                  </span>
                </div>

                {/* Custom SVG Graph */}
                <div className="h-48 relative w-full mt-4">
                  <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Grid Lines */}
                    <line x1="0" y1="20" x2="500" y2="20" stroke="#e2e8f0" strokeWidth="0.75" strokeDasharray="3" />
                    <line x1="0" y1="50" x2="500" y2="50" stroke="#e2e8f0" strokeWidth="0.75" strokeDasharray="3" />
                    <line x1="0" y1="80" x2="500" y2="80" stroke="#e2e8f0" strokeWidth="0.75" strokeDasharray="3" />
                    
                    {/* Area Graph */}
                    <path
                      d="M 0 100 L 0 70 Q 50 40 100 85 T 200 45 T 300 80 T 400 35 L 500 65 L 500 100 Z"
                      fill="url(#glow)"
                    />
                    {/* Line Graph */}
                    <path
                      d="M 0 70 Q 50 40 100 85 T 200 45 T 300 80 T 400 35 L 500 65"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="2.5"
                    />
                    
                    {/* Highlighting anomaly alert */}
                    {incidents.some(i => i.status !== 'Resolved') && (
                      <circle cx="400" cy="35" r="4.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" className="animate-ping" />
                    )}
                  </svg>
                  
                  {/* Axis indicators */}
                  <div className="absolute top-1 right-2 text-[9px] font-bold text-slate-400">200ms</div>
                  <div className="absolute top-[44%] right-2 text-[9px] font-bold text-slate-400">100ms</div>
                  <div className="absolute bottom-1 right-2 text-[9px] font-bold text-slate-400">0ms</div>
                </div>
              </div>

              {/* Shell Logger Terminal */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-850 text-slate-800 flex items-center gap-2">
                    <Terminal className="h-4.5 w-4.5 text-indigo-600" />
                    DevOps Shell Monitor
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Shell diagnostic output for active background tasks.</p>
                </div>
                <div className="mt-4 flex-1 bg-slate-950 border border-slate-900 rounded-xl p-3 font-mono text-[9px] text-indigo-300 space-y-1.5 overflow-y-auto max-h-[140px] shadow-inner">
                  {logs.map((log, idx) => (
                    <div key={idx} className={log.includes('ERR') || log.includes('Alert') ? 'text-rose-450 text-rose-400 animate-pulse' : 'text-indigo-305 text-indigo-300'}>
                      {log}
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
