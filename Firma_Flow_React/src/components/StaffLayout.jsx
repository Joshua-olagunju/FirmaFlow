import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useStaff } from '../contexts/StaffContext';
import { useTheme } from '../contexts/ThemeContext';
import AppFooter from './AppFooter';
import AnnouncementBanner from './AnnouncementBanner';
import {
  Home,
  MessageSquare,
  AlertCircle,
  Users,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  UserCircle,
  Bell,
} from 'lucide-react';

const MENU_ITEMS = [
  { name: 'Dashboard',   path: '/staff',             icon: Home          },
  { name: 'Live Chat',   path: '/staff/chat',         icon: MessageSquare },
  { name: 'Complaints',  path: '/staff/complaints',   icon: AlertCircle   },
  { name: 'Users',       path: '/staff/users',        icon: Users         },
  { name: 'Profile',     path: '/staff/profile',      icon: UserCircle    },
];

const StaffLayout = ({ children }) => {
  const navigate               = useNavigate();
  const location               = useLocation();
  const { staff, logout }      = useStaff();
  const { theme, toggleTheme } = useTheme();
  const dk = theme === 'dark';

  /* ── Sidebar open state ──────────────────────────────────────────────
     Default: open on desktop (≥ 1024px), closed on mobile.
     Auto-adjust on resize so the layout stays correct.             */
  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isMobile = () =>
    typeof window !== 'undefined' && window.innerWidth < 1024;

  /* Close sidebar when a link is clicked — only on mobile */
  const handleNavClick = () => {
    if (isMobile()) setSidebarOpen(false);
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const isActive = (path) => location.pathname === path;

  const firstName = (
    staff?.full_name || staff?.username || 'Staff'
  ).split(' ')[0];

  /* ── bg / border tokens */
  const sidebarBg  = dk ? 'bg-slate-900 border-slate-800'  : 'bg-white border-slate-200';
  const headerBg   = dk ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200';
  const mainBg     = dk ? 'bg-slate-950 text-slate-100'    : 'bg-slate-50 text-slate-900';
  const hoverBtn   = dk ? 'hover:bg-slate-800'             : 'hover:bg-slate-100';
  const hoverPill  = dk ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700';
  const subText    = dk ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`flex h-screen overflow-hidden ${mainBg}`}>
      <AnnouncementBanner />

      {/* ── Mobile backdrop ──────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 h-dvh w-72 flex flex-col z-50
          border-r transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${sidebarBg}
        `}
      >
        {/* Sidebar top — avatar + close button on mobile */}
        <div
          className={`px-5 py-5 border-b flex items-center justify-between gap-3 ${
            dk ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-semibold flex items-center justify-center select-none">
              {staff?.full_name?.charAt(0) || staff?.username?.charAt(0) || 'S'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {staff?.full_name || staff?.username || 'Staff'}
              </p>
              <p className={`text-xs capitalize truncate ${subText}`}>
                {staff?.role || 'support'}
              </p>
            </div>
          </div>

          {/* ✕ only visible on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className={`lg:hidden p-1.5 rounded-lg shrink-0 transition ${hoverBtn}`}
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {MENU_ITEMS.map(({ name, path, icon: Icon }) => {
            const active = isActive(path);
            return (
              <Link
                key={path}
                to={path}
                onClick={handleNavClick}
                className={`
                  flex items-center justify-between rounded-xl px-4 py-3 transition
                  ${active
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow'
                    : dk
                    ? 'text-slate-300 hover:bg-slate-800'
                    : 'text-slate-700 hover:bg-slate-100'
                  }
                `}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="font-medium">{name}</span>
                </span>
                {active && (
                  <span className="h-2 w-2 rounded-full bg-white/90 shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div
          className={`p-4 space-y-1 border-t ${
            dk ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              dk ? `${hoverBtn} text-slate-300` : `${hoverBtn} text-slate-700`
            }`}
          >
            {dk ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
            <span className="font-medium">
              {dk ? 'Light mode' : 'Dark mode'}
            </span>
          </button>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
              dk
                ? 'text-rose-300 hover:bg-slate-800'
                : 'text-rose-600 hover:bg-rose-50'
            }`}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────────────
          On mobile: full-width (sidebar overlays, no margin).
          On desktop: shift right when sidebar is open.              */}
      <div
        className={`
          flex-1 flex flex-col min-w-0 min-h-0
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'lg:ml-72' : ''}
        `}
      >
        {/* ── Topbar ─────────────────────────────────────────────────── */}
        <header
          className={`
            shrink-0 sticky top-0 z-30
            border-b backdrop-blur-md
            px-4 sm:px-6 py-3 md:py-4
            flex items-center justify-between
            ${headerBg}
          `}
        >
          <div className="flex items-center gap-3">
            {/* Hamburger — always visible */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg transition ${hoverBtn}`}
              aria-label="Toggle navigation"
            >
              {sidebarOpen && !isMobile() ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            <div>
              <p className="text-sm font-semibold leading-tight">
                Welcome back, {firstName}
              </p>
              <p className={`text-xs hidden sm:block ${subText}`}>
                {staff?.department || 'Support'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <span
              className={`hidden md:flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${hoverPill}`}
            >
              <Bell className="w-3.5 h-3.5" />
              Staff Workspace
            </span>
            <div
              className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center ${
                dk ? 'bg-slate-800' : 'bg-slate-100'
              }`}
            >
              <UserCircle className="w-5 h-5" />
            </div>
          </div>
        </header>

        {/* ── Page content ───────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            {children}
          </div>
          <AppFooter />
        </main>
      </div>

      {/* ── Logout confirmation ──────────────────────────────────────── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] px-4">
          <div
            className={`border rounded-2xl p-6 max-w-sm w-full shadow-xl ${
              dk ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <h3 className="text-lg font-semibold mb-2">Confirm Logout</h3>
            <p className={`mb-6 text-sm ${subText}`}>
              Are you sure you want to log out?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className={`flex-1 px-4 py-2 rounded-xl ${
                  dk
                    ? 'bg-slate-800 hover:bg-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffLayout;
