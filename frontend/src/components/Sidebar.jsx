import React from 'react';
import { 
  Activity, 
  LayoutDashboard, 
  Server, 
  AlertTriangle, 
  Shield,
  UserCheck,
  LogOut
} from 'lucide-react';

export default function Sidebar({ currentRole, setCurrentRole, activeTab, setActiveTab, userName, onLogout }) {
  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'services', name: 'Services', icon: Server },
    { id: 'incidents', name: 'Incidents', icon: AlertTriangle },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-200 flex flex-col justify-between h-screen fixed left-0 top-0 z-30 shadow-sm">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-200 flex items-center gap-3">
          <div className="bg-indigo-100 p-2.5 rounded-xl border border-indigo-200 pulse-glow">
            <Activity className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg bg-gradient-to-r from-slate-900 to-indigo-950 bg-clip-text text-transparent">
              OpsPulse
            </h1>
            <span className="text-[10px] text-indigo-600 font-bold tracking-widest uppercase">
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Role Manager & Profile */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-3.5 w-3.5 text-indigo-600" />
            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
              RBAC Simulator
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
            {['Admin', 'Responder', 'Viewer'].map((role) => (
              <button
                key={role}
                onClick={() => setCurrentRole(role)}
                className={`py-1 text-[10px] font-bold rounded-md transition-all ${
                  currentRole === role
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 truncate">
            <div className="h-9 w-9 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0">
              <UserCheck className="h-4.5 w-4.5 text-indigo-600" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-800 truncate">{userName || 'Dev Mentor'}</p>
              <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {currentRole} Mode
              </p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            title="Sign Out"
            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
