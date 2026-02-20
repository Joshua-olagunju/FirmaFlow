import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { buildApiUrl } from '../../../config/api.config';
import SuperAdminLayout from '../../../components/SuperAdminLayout';
import {
  Users, Building2, CreditCard, Ticket, MessageSquare,
  TrendingUp, AlertCircle, CheckCircle, Clock, RefreshCw,
  ArrowUpRight, Activity,
} from 'lucide-react';

const fmt = (n) => n != null ? Number(n).toLocaleString() : '0';
const fmtMoney = (n) => '' + (n != null ? Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : '0.00');

export default function SuperAdminDashboard() {
  const { theme } = useTheme();
  const dk = theme === 'dark';
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users:         { total: 0, active: 0, newToday: 0 },
    companies:     { total: 0, active: 0, newToday: 0 },
    subscriptions: { active: 0, revenue: 0, newToday: 0 },
    tickets:       { total: 0, pending: 0, resolved: 0, critical: 0 },
    chat:          { active: 0, waiting: 0, totalToday: 0 },
  });
  const [lastUpdated, setLastUpdated] = useState(null);

  const card    = dk ? 'bg-slate-800 border-slate-700'    : 'bg-white border-slate-200';
  const sub     = dk ? 'text-slate-400'                   : 'text-slate-500';
  const textMain= dk ? 'text-white'                       : 'text-slate-900';
  const rowHov  = dk ? 'hover:bg-slate-700/40'            : 'hover:bg-slate-50';

  const load = async () => {
    try {
      setLoading(true);
      const r = await fetch(buildApiUrl('superadmin/api/dashboard-stats.php'), { credentials: 'include' });
      if (r.ok) {
        const d = await r.json();
        if (d.success) { setStats(d.data || stats); setLastUpdated(new Date()); }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  const STAT_CARDS = [
    {
      label: 'Total Users', value: fmt(stats.users?.total), sub: `${fmt(stats.users?.active)} active`,
      Icon: Users, color: 'text-indigo-600', bg: dk ? 'bg-indigo-500/15' : 'bg-indigo-50',
      link: '/superadmin/users', trend: stats.users?.newToday,
    },
    {
      label: 'Companies', value: fmt(stats.companies?.total), sub: `${fmt(stats.companies?.active)} active`,
      Icon: Building2, color: 'text-emerald-600', bg: dk ? 'bg-emerald-500/15' : 'bg-emerald-50',
      link: '/superadmin/companies', trend: stats.companies?.newToday,
    },
    {
      label: 'Active Subscriptions', value: fmt(stats.subscriptions?.active), sub: fmtMoney(stats.subscriptions?.revenue) + ' revenue',
      Icon: CreditCard, color: 'text-violet-600', bg: dk ? 'bg-violet-500/15' : 'bg-violet-50',
      link: '/superadmin/subscriptions', trend: stats.subscriptions?.newToday,
    },
    {
      label: 'Open Tickets', value: fmt(stats.tickets?.pending), sub: `${fmt(stats.tickets?.critical)} critical`,
      Icon: Ticket, color: 'text-rose-600', bg: dk ? 'bg-rose-500/15' : 'bg-rose-50',
      link: '/superadmin/tickets', trend: null,
    },
    {
      label: 'Live Chats', value: fmt(stats.chat?.active), sub: `${fmt(stats.chat?.waiting)} waiting`,
      Icon: MessageSquare, color: 'text-amber-600', bg: dk ? 'bg-amber-500/15' : 'bg-amber-50',
      link: '/superadmin/live-chat', trend: null,
    },
    {
      label: 'Resolved Today', value: fmt(stats.tickets?.resolved), sub: 'tickets closed',
      Icon: CheckCircle, color: 'text-teal-600', bg: dk ? 'bg-teal-500/15' : 'bg-teal-50',
      link: '/superadmin/tickets', trend: null,
    },
  ];

  const QUICK_LINKS = [
    { label: 'Manage Companies', sub: 'View all companies',      Icon: Building2,    link: '/superadmin/companies',     color: 'text-emerald-600' },
    { label: 'User Accounts',    sub: 'Manage system users',     Icon: Users,         link: '/superadmin/users',         color: 'text-indigo-600'  },
    { label: 'Subscriptions',    sub: 'Billing & plans',         Icon: CreditCard,    link: '/superadmin/subscriptions', color: 'text-violet-600'  },
    { label: 'Support Tickets',  sub: 'Handle support requests', Icon: Ticket,        link: '/superadmin/tickets',       color: 'text-rose-600'    },
    { label: 'Live Chat',        sub: 'Real-time support',       Icon: MessageSquare, link: '/superadmin/live-chat',     color: 'text-amber-600'   },
    { label: 'Settings',         sub: 'System configuration',    Icon: Activity,      link: '/superadmin/settings',      color: 'text-teal-600'    },
  ];

  return (
    <SuperAdminLayout title="Dashboard" subtitle="System overview and analytics">
      <div className="space-y-6">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${textMain}`}>Overview</h1>
            {lastUpdated && <p className={`text-xs ${sub} mt-0.5`}>Updated {lastUpdated.toLocaleTimeString()}</p>}
          </div>
          <button onClick={load} disabled={loading}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
              dk ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
            } disabled:opacity-50`}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading' : 'Refresh'}
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {STAT_CARDS.map(({ label, value, sub: subText, Icon, color, bg, link, trend }) => (
            <Link key={label} to={link}
              className={`relative flex flex-col gap-3 p-5 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-lg ${card}`}>
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <ArrowUpRight className={`w-4 h-4 ${sub}`} />
              </div>
              <div>
                <p className={`text-xs ${sub}`}>{label}</p>
                <p className={`text-2xl font-bold mt-0.5 ${textMain}`}>
                  {loading ? <span className="block w-16 h-7 bg-current opacity-10 rounded animate-pulse" /> : value}
                </p>
                <p className={`text-xs mt-0.5 ${sub}`}>{subText}</p>
                {trend != null && trend > 0 && (
                  <p className="text-xs mt-1 text-emerald-600 flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> +{trend} today
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* System status + Quick links */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* System status */}
          <div className={`rounded-2xl border p-5 ${card}`}>
            <div className="flex items-center gap-2 mb-4">
              <Activity className={`w-4 h-4 ${sub}`} />
              <h3 className={`font-semibold text-sm ${textMain}`}>System Status</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'API Server',       status: 'Operational',  color: 'text-emerald-600', dot: 'bg-emerald-500' },
                { label: 'Database',         status: 'Operational',  color: 'text-emerald-600', dot: 'bg-emerald-500' },
                { label: 'Email Service',    status: 'Operational',  color: 'text-emerald-600', dot: 'bg-emerald-500' },
                { label: 'File Storage',     status: 'Operational',  color: 'text-emerald-600', dot: 'bg-emerald-500' },
                { label: 'Subscriptions',    status: stats.subscriptions?.active > 0 ? 'Active' : 'No active plans', color: stats.subscriptions?.active > 0 ? 'text-emerald-600' : 'text-amber-600',  dot: stats.subscriptions?.active > 0 ? 'bg-emerald-500' : 'bg-amber-500' },
              ].map(({ label, status, color, dot }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <p className={`text-sm ${textMain}`}>{label}</p>
                  </div>
                  <p className={`text-xs font-medium ${color}`}>{status}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className={`rounded-2xl border p-5 ${card}`}>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className={`w-4 h-4 ${sub}`} />
              <h3 className={`font-semibold text-sm ${textMain}`}>Quick Access</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_LINKS.map(({ label, sub: subText, Icon, link, color }) => (
                <Link key={label} to={link}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${rowHov}`}>
                  <Icon className={`w-5 h-5 shrink-0 ${color}`} />
                  <div className="min-w-0">
                    <p className={`text-xs font-medium truncate ${textMain}`}>{label}</p>
                    <p className={`text-xs truncate ${sub}`}>{subText}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Tickets summary row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Tickets', value: stats.tickets?.total,    color: 'text-slate-600' },
            { label: 'Pending',       value: stats.tickets?.pending,  color: 'text-amber-600' },
            { label: 'Resolved',      value: stats.tickets?.resolved, color: 'text-emerald-600' },
            { label: 'Critical',      value: stats.tickets?.critical, color: 'text-rose-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`p-4 rounded-2xl border text-center ${card}`}>
              <p className={`text-2xl font-bold ${color}`}>{loading ? '' : fmt(value)}</p>
              <p className={`text-xs mt-1 ${sub}`}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </SuperAdminLayout>
  );
}
