import React from 'react';
import { 
  Activity, 
  LayoutDashboard, 
  Server, 
  AlertTriangle, 
  Users, 
  Settings, 
  Shield,
  UserCheck
} from 'lucide-react';

export default function Sidebar({ currentRole, setCurrentRole, activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'services', name: 'Services', icon: Server },
    { id: 'incidents', name: 'Incidents', icon: AlertTriangle },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col justify-between h-screen fixed left-0 top-0 z-30">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="bg-indigo-500/20 p-2.5 rounded-xl border border-indigo-500/40 pulse-glow">
            <Activity className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-100 bg-clip-text text-transparent">
              OpsPulse
            </h1>
            <span className="text-[10px] text-indigo-400 font-semibold tracking-widest uppercase">
              Command Center
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600/25 text-indigo-200 border border-indigo-500/30'
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Role Manager & Profile */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              RBAC Simulator
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
            {['Admin', 'Responder', 'Viewer'].map((role) => (
              <button
                key={role}
                onClick={() => setCurrentRole(role)}
                className={`py-1 text-[10px] font-semibold rounded-md transition-all ${
                  currentRole === role
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/50 border border-slate-800/60">
          <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
            <UserCheck className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-200 truncate">Dev Mentor</p>
            <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {currentRole} Mode
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
