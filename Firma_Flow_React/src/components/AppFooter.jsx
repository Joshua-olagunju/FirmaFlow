import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Shared footer — used in both StaffLayout and SuperAdminLayout.
 * Shows Sodatim Technologies branding, copyright, and quick-links.
 * Placed inside a flex-col container so it naturally sits at the bottom.
 */
const AppFooter = () => {
  const { theme } = useTheme();
  const dk = theme === 'dark';
  const year = new Date().getFullYear();

  return (
    <footer
      className={`mt-6 shrink-0 border-t px-4 sm:px-6 py-4 ${
        dk
          ? 'bg-slate-950 border-slate-800 text-slate-500'
          : 'bg-white border-slate-200 text-slate-400'
      }`}
    >
      <div className="max-w-screen-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 text-xs">
        {/* Branding — clickable link to Sodatim.com */}
        <a
          href="https://sodatim.com"
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition-opacity hover:opacity-80 ${
            dk
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
          }`}
        >
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          Powered by Sodatim Technologies
        </a>

        {/* Copyright */}
        <p className="order-last sm:order-none text-center">
          © {year} Sodatim Technologies. All rights reserved.
        </p>

        {/* Links */}
        <nav className="flex items-center gap-3 sm:gap-4">
          <a href="#" className={`hover:underline transition-colors ${dk ? 'hover:text-slate-300' : 'hover:text-slate-600'}`}>
            Privacy
          </a>
          <span className={dk ? 'text-slate-700' : 'text-slate-300'}>·</span>
          <a href="#" className={`hover:underline transition-colors ${dk ? 'hover:text-slate-300' : 'hover:text-slate-600'}`}>
            Terms
          </a>
          <span className={dk ? 'text-slate-700' : 'text-slate-300'}>·</span>
          <a href="https://sodatim.com" target="_blank" rel="noopener noreferrer" className={`hover:underline transition-colors ${dk ? 'hover:text-slate-300' : 'hover:text-slate-600'}`}>
            Support
          </a>
        </nav>
      </div>
    </footer>
  );
};

export default AppFooter;
