import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  CreditCard, 
  MessageSquare, 
  Settings,
  LogOut,
  ChevronLeft,
  Shield
} from 'lucide-react';
import { useSuperAdmin } from '../../../contexts/SuperAdminContext';
import { useTheme } from '../../../contexts/ThemeContext';

export default function SuperAdminSidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { superAdmin, logout } = useSuperAdmin();
  const { theme } = useTheme();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/superadmin/dashboard' },
    { icon: Building2, label: 'Companies', path: '/superadmin/companies' },
    { icon: Users, label: 'Users', path: '/superadmin/users' },
    { icon: CreditCard, label: 'Subscriptions', path: '/superadmin/subscriptions' },
    { icon: MessageSquare, label: 'Support Tickets', path: '/superadmin/tickets' },
    { icon: Settings, label: 'Settings', path: '/superadmin/settings' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleNavigate = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 ${theme.bgSecondary} border-r ${theme.borderPrimary} z-50
        transform transition-transform duration-300 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo & Close Button */}
          <div className={`p-6 border-b ${theme.borderPrimary} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className={`${theme.textPrimary} font-bold text-lg`}>SuperAdmin</h2>
                <p className={`${theme.textSecondary} text-xs`}>Control Panel</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ChevronLeft className={theme.textSecondary} size={20} />
            </button>
          </div>

          {/* User Info */}
          <div className={`p-4 border-b ${theme.borderPrimary}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-semibold">
                {superAdmin?.full_name?.charAt(0) || 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`${theme.textPrimary} text-sm font-medium truncate`}>
                  {superAdmin?.full_name || 'Super Admin'}
                </p>
                <p className={`${theme.textSecondary} text-xs capitalize truncate`}>
                  {superAdmin?.role || 'superadmin'}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleNavigate(item.path)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${isActive(item.path)
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                    : `${theme.textPrimary} hover:bg-gray-100 dark:hover:bg-gray-700`
                  }
                `}
              >
                <item.icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Logout Button */}
          <div className={`p-4 border-t ${theme.borderPrimary}`}>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${theme.textPrimary} hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all`}
            >
              <LogOut size={20} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
