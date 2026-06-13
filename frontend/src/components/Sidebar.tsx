import { NavLink } from 'react-router-dom';
import {
  FolderKanban,
  BarChart3,
  Bot,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useState } from 'react';

export const Sidebar = () => {
  const { logout, user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { to: '/dashboard', icon: FolderKanban, label: 'Projects' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/ai', icon: Bot, label: 'AI Assistant' },
  ];

  return (
    <div
      className={`${collapsed ? 'w-20' : 'w-64'} bg-surface-1 text-white flex flex-col h-full border-r border-glass-border transition-all duration-300 relative`}
    >
      {/* Collapse Toggle */}
      <button
        id="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 z-50 w-6 h-6 rounded-full bg-surface-2 border border-glass-border flex items-center justify-center text-slate-400 hover:text-white hover:bg-brand-primary transition-all"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Logo */}
      <div className={`p-6 ${collapsed ? 'px-4' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0 glow-brand">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <h1 className="text-xl font-bold gradient-text tracking-tight">
              AIFlow
            </h1>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${collapsed ? 'px-3' : 'px-4'} space-y-1.5 mt-2`}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center ${collapsed ? 'justify-center' : ''} gap-3 ${collapsed ? 'px-0 py-3' : 'px-4 py-3'} rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'gradient-brand text-white shadow-lg shadow-brand-primary/20'
                  : 'text-slate-400 hover:bg-glass-white hover:text-white'
              }`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className={`p-4 border-t border-glass-border ${collapsed ? 'px-3' : ''}`}>
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-3 mb-3">
            <div className="w-9 h-9 gradient-accent rounded-xl flex items-center justify-center font-bold text-white text-xs uppercase flex-shrink-0">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <button
          id="sidebar-logout"
          onClick={logout}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 ${collapsed ? 'px-0 py-3' : 'px-4 py-2.5'} rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </div>
  );
};
