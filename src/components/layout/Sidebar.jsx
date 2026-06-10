import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, Users, LogOut,
  ChevronRight, Building2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useOrg } from '../../hooks/useOrg';
import { Badge } from '../ui/Badge';
import { ShareOrgKey } from '../shared/ShareOrgKey';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const { currentOrg, userRole } = useOrg();
  const navigate = useNavigate();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', icon: FolderOpen, label: 'Projects' },
    { to: '/members', icon: Users, label: 'Members', managerOnly: true },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
          <Building2 size={18} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm leading-tight">EasyTrack</p>
          <p className="text-xs text-gray-400 truncate max-w-[120px]">{currentOrg?.name || '—'}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label, managerOnly }) => {
          if (managerOnly && userRole === 'employee') return null;
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${isActive ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* Org key share */}
      {currentOrg && (
        <div className="px-3 pb-3">
          <ShareOrgKey orgKey={currentOrg.uniqueKey} orgName={currentOrg.name} compact />
        </div>
      )}

      {/* User */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-sm font-bold">
            {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.displayName || 'User'}</p>
            <Badge type={userRole} className="mt-0.5" />
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors w-full"
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
