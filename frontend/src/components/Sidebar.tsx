import { NavLink } from 'react-router-dom';
import {
  FolderKanban,
  BarChart3,
  Bot,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useState } from 'react';

export const Sidebar = () => {
  const { logout, user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { to: '/dashboard', icon: FolderKanban, label: 'Projects' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/team', icon: Users, label: 'Team' },
    { to: '/ai', icon: Bot, label: 'AI Assistant' },
  ];

  return (
    <div
      className={`${collapsed ? 'w-[72px]' : 'w-64'} bg-surface-1 flex flex-col h-full border-r border-glass-border transition-all duration-300 relative z-30 flex-shrink-0`}
    >
      {/* Collapse Toggle */}
      <button
        id="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-7 z-50 w-6 h-6 rounded-full bg-surface-2 border border-glass-border flex items-center justify-center text-slate-400 hover:text-white hover:bg-brand-primary transition-all shadow-lg"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Logo */}
      <div className={`h-16 flex items-center ${collapsed ? 'justify-center px-4' : 'px-5'} border-b border-glass-border flex-shrink-0`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0 glow-brand">
            <Zap className="w-4.5 h-4.5 text-white" />
          </div>
          {!collapsed && (
            <h1 className="text-lg font-bold gradient-text tracking-tight">
              AIFlow
            </h1>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${collapsed ? 'px-3' : 'px-3'} py-4 space-y-1`}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center ${collapsed ? 'justify-center' : ''} gap-3 ${collapsed ? 'px-0 py-2.5' : 'px-3 py-2.5'} rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-brand-primary/15 text-brand-primary font-semibold'
                  : 'text-slate-400 hover:bg-glass-white hover:text-white'
              }`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
            {!collapsed && <span className="text-sm">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className={`${collapsed ? 'px-3' : 'px-3'} py-3 border-t border-glass-border`}>
        {!collapsed ? (
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-glass-white transition-all cursor-default">
            <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center font-bold text-white text-xs uppercase flex-shrink-0">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
            <button
              id="sidebar-logout"
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            id="sidebar-logout"
            onClick={logout}
            className="w-full flex items-center justify-center py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
            title="Logout"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        )}
      </div>
    </div>
  );
};
