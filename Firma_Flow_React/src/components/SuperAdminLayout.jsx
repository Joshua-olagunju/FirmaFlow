import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useSuperAdmin } from '../contexts/SuperAdminContext';
import AppFooter from './AppFooter';
import AnnouncementBanner from './AnnouncementBanner';
import {
  LayoutDashboard, Users, Building2, Ticket, MessageSquare,
  CreditCard, Settings, LogOut, X, Menu, Sun, Moon, Shield,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/superadmin/dashboard',     Icon: LayoutDashboard, label: 'Dashboard',       sub: 'Overview & Analytics'      },
  { path: '/superadmin/users',         Icon: Users,           label: 'Users',            sub: 'System User Accounts'      },
  { path: '/superadmin/companies',     Icon: Building2,       label: 'Companies',        sub: 'Manage All Companies'      },
  { path: '/superadmin/tickets',       Icon: Ticket,          label: 'Support Tickets',  sub: 'Manage Support Requests'   },
  { path: '/superadmin/live-chat',     Icon: MessageSquare,   label: 'Live Chat',        sub: 'Real-time Support'         },
  { path: '/superadmin/subscriptions', Icon: CreditCard,      label: 'Subscriptions',    sub: 'Billing & Plans'           },
  { path: '/superadmin/settings',      Icon: Settings,        label: 'Settings',         sub: 'System Configuration'      },
];

const SuperAdminLayout = ({ children, title, subtitle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const { theme, toggleTheme } = useTheme();
  const { superAdmin, logout } = useSuperAdmin();
  const location  = useLocation();
  const navigate  = useNavigate();
  const dk        = theme === 'dark';

  /* Auto-close on resize */
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = async () => {
    try { await logout(); navigate('/superadmin/login'); }
    catch (e) { console.error('Logout failed:', e); }
  };

  const isActive = (path) =>
    path === '/superadmin/users'
      ? location.pathname.startsWith('/superadmin/users')
      : location.pathname === path;

  const handleNavClick = () => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  /* ─── colour tokens ────────────────────────────────────────────────── */
  const bg       = dk ? 'bg-slate-900'                     : 'bg-slate-50';
  const sidebarBg= dk ? 'bg-slate-800 border-slate-700/60' : 'bg-white border-slate-200';
  const topbarBg = dk ? 'bg-slate-800/95 border-slate-700' : 'bg-white/95 border-slate-200';
  const logoBg   = 'bg-gradient-to-br from-indigo-600 to-purple-600';
  const activeItem = dk
    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
    : 'bg-indigo-50 text-indigo-700 border border-indigo-200';
  const inactiveItem = dk
    ? 'text-slate-400 hover:bg-slate-700 hover:text-white'
    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900';
  const profileBg = dk ? 'bg-slate-700/60' : 'bg-slate-50';
  const textMain  = dk ? 'text-white'      : 'text-slate-900';
  const textSub   = dk ? 'text-slate-400'  : 'text-slate-500';

  return (
    <div className={`min-h-screen flex ${bg}`}>
      <AnnouncementBanner />

      {/* ── Mobile backdrop ──────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 flex flex-col border-r
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        ${sidebarBg}
      `}>

        {/* Logo */}
        <div className={`p-5 border-b ${dk ? 'border-slate-700/60' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 ${logoBg} rounded-xl flex items-center justify-center shadow-lg`}>
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className={`font-bold text-sm leading-none ${textMain}`}>SuperAdmin</p>
                <p className={`text-xs mt-0.5 ${textSub}`}>Control Panel</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)}
              className={`lg:hidden p-1.5 rounded-lg ${dk ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ path, Icon, label, sub }) => {
            const active = isActive(path);
            return (
              <Link key={path} to={path} onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${active ? activeItem : inactiveItem}`}>
                <Icon className="w-5 h-5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none">{label}</p>
                  <p className={`text-xs mt-0.5 truncate ${active ? (dk ? 'text-indigo-200' : 'text-indigo-500') : textSub}`}>{sub}</p>
                </div>
                {active && <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer: profile + logout */}
        <div className={`p-3 border-t ${dk ? 'border-slate-700/60' : 'border-slate-200'}`}>
          <div className={`flex items-center gap-3 p-3 rounded-xl mb-2 ${profileBg}`}>
            <div className={`w-8 h-8 ${logoBg} rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0`}>
              {superAdmin?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate leading-none ${textMain}`}>{superAdmin?.username || 'Administrator'}</p>
              <p className={`text-xs mt-0.5 ${textSub}`}>Super Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-500/10 transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* Top bar */}
        <header className={`sticky top-0 z-30 border-b ${topbarBg} backdrop-blur-sm`}>
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Hamburger */}
            <button onClick={() => setSidebarOpen((o) => !o)}
              className={`lg:hidden p-2 rounded-lg ${dk ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}>
              <Menu className="w-5 h-5" />
            </button>

            {/* Title (optional) */}
            {title && (
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm leading-none truncate ${textMain}`}>{title}</p>
                {subtitle && <p className={`text-xs mt-0.5 ${textSub}`}>{subtitle}</p>}
              </div>
            )}
            {!title && <div className="flex-1" />}

            {/* Theme toggle */}
            <button onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${dk ? 'hover:bg-slate-700 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
              {dk ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Avatar */}
            <div className={`w-7 h-7 ${logoBg} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
              {superAdmin?.username?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            {children}
          </div>
          <AppFooter />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;