import { Menu, Bell, Search } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSuperAdmin } from '../../../contexts/SuperAdminContext';

export default function SuperAdminHeader({ onMenuClick, title, subtitle }) {
  const { theme } = useTheme();
  const { superAdmin } = useSuperAdmin();

  return (
    <header className={`${theme.bgSecondary} border-b ${theme.borderPrimary} sticky top-0 z-30`}>
      <div className="px-4 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left Side - Menu & Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Menu className={theme.textPrimary} size={24} />
            </button>
            <div>
              <h1 className={`text-2xl font-bold ${theme.textPrimary}`}>{title}</h1>
              {subtitle && (
                <p className={`${theme.textSecondary} text-sm mt-1`}>{subtitle}</p>
              )}
            </div>
          </div>

          {/* Right Side - Search & Notifications */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <Search size={18} className={theme.textSecondary} />
              <span className={`${theme.textSecondary} text-sm`}>Search...</span>
            </button>

            {/* Notifications */}
            <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Bell size={20} className={theme.textPrimary} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Avatar */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-semibold">
                {superAdmin?.full_name?.charAt(0) || 'S'}
              </div>
              <div className="hidden md:block">
                <p className={`${theme.textPrimary} text-sm font-medium`}>
                  {superAdmin?.full_name || 'Super Admin'}
                </p>
                <p className={`${theme.textSecondary} text-xs capitalize`}>
                  {superAdmin?.role || 'superadmin'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
