import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useStaff } from '../../contexts/StaffContext';
import { buildApiUrl } from '../../config/api.config';
import StaffLayout from '../../components/StaffLayout';
import {
  MessageSquare,
  AlertCircle,
  Users,
  Clock,
  CheckCircle,
  Activity,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const StaffDashboard = () => {
  const { theme } = useTheme();
  const { staff } = useStaff();
  const [stats, setStats] = useState({
    chats: { total_chats: 0, active_chats: 0, pending_chats: 0, closed_chats: 0 },
    complaints: { total_complaints: 0, open_complaints: 0, in_progress_complaints: 0, resolved_complaints: 0 },
    users: { total_users: 0, active_users: 0, inactive_users: 0 },
    today: { chats_today: 0, complaints_today: 0, resolved_chats_today: 0, resolved_complaints_today: 0 },
  });
  const [recentActivity, setRecentActivity] = useState({ chats: [], complaints: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [staff]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = buildApiUrl('superadmin/api/staff_dashboard.php');
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.stats) {
        setStats({
          chats: data.stats.chats || {},
          complaints: data.stats.complaints || {},
          users: data.stats.users || {},
          today: data.stats.today || {},
        });
        setRecentActivity({
          chats: data.stats.recent?.chats || [],
          complaints: data.stats.recent?.complaints || [],
        });
      } else {
        throw new Error(data.message || 'Failed to fetch dashboard data');
      }
    } catch (fetchError) {
      console.error('Dashboard fetch error:', fetchError);
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  const firstName = (staff?.full_name || staff?.username || 'Staff').split(' ')[0];

  const quickStats = [
    {
      title: 'My Chats',
      value: stats.chats.total_chats || 0,
      meta: `${stats.chats.active_chats || 0} active`,
      icon: MessageSquare,
      iconClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300',
      link: '/staff/chat',
    },
    {
      title: 'Waiting Chats',
      value: stats.chats.pending_chats || 0,
      meta: 'Queue',
      icon: Clock,
      iconClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
      link: '/staff/chat',
    },
    {
      title: 'Open Complaints',
      value: stats.complaints.open_complaints || 0,
      meta: `${stats.complaints.in_progress_complaints || 0} in progress`,
      icon: AlertCircle,
      iconClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-300',
      link: '/staff/complaints',
    },
    {
      title: 'Resolved',
      value: stats.complaints.resolved_complaints || 0,
      meta: 'Completed',
      icon: CheckCircle,
      iconClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
      link: '/staff/complaints',
    },
  ];

  const activityItems = [
    ...(recentActivity.chats || []).map((chat) => ({
      id: `chat-${chat.id || chat.updated_at}`,
      type: 'chat',
      title: chat.visitor_name || 'Anonymous visitor',
      subtitle: chat.visitor_email || 'No email',
      time: chat.updated_at,
      status: chat.status || 'active',
    })),
    ...(recentActivity.complaints || []).map((complaint) => ({
      id: `complaint-${complaint.id || complaint.created_at}`,
      type: 'complaint',
      title: complaint.subject || 'Complaint',
      subtitle: complaint.name || 'Customer',
      time: complaint.created_at,
      status: complaint.status || 'open',
    })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time));

  const statusBadgeClass = (status) => {
    if (status === 'active' || status === 'resolved') return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300';
    if (status === 'pending' || status === 'open') return 'bg-amber-500/15 text-amber-600 dark:text-amber-300';
    if (status === 'in_progress') return 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300';
    return 'bg-slate-500/15 text-slate-600 dark:text-slate-300';
  };

  return (
    <StaffLayout>
      <div className="space-y-6">
        <section
          className={`rounded-2xl border p-6 md:p-8 ${
            theme === 'dark'
              ? 'border-slate-800 bg-gradient-to-r from-slate-900 to-slate-900/70'
              : 'border-slate-200 bg-gradient-to-r from-white to-slate-50'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Staff dashboard overview
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
              <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Track chats, complaints and customer activity from one place.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-indigo-500/10 text-indigo-500 dark:text-indigo-300 text-sm">
              <Sparkles className="w-4 h-4" />
              Live updates every 30s
            </div>
          </div>
          {error && (
            <div className="mt-4 rounded-xl border border-rose-300/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
              {error}
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {quickStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.title}
                to={stat.link}
                className={`rounded-2xl border p-5 transition hover:shadow-md ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${stat.iconClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
                </div>
                <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{stat.title}</p>
                <p className="text-3xl font-semibold leading-none mb-1">{stat.value}</p>
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{stat.meta}</p>
              </Link>
            );
          })}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div
            className={`xl:col-span-2 rounded-2xl border ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className={`p-5 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                Recent Activity
              </h2>
            </div>
            <div className="p-5 space-y-3 max-h-[420px] overflow-y-auto">
              {loading ? (
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Loading activity...</p>
              ) : activityItems.length === 0 ? (
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>No recent activity.</p>
              ) : (
                activityItems.slice(0, 12).map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border px-4 py-3 ${
                      theme === 'dark' ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{item.subtitle}</p>
                        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                          {new Date(item.time).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs capitalize ${statusBadgeClass(item.status)}`}>
                        {String(item.status).replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={`rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className={`p-5 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
              <h2 className="text-lg font-semibold">Quick Access</h2>
            </div>
            <div className="p-5 space-y-3">
              <Link
                to="/staff/chat"
                className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                  theme === 'dark' ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-medium"><MessageSquare className="w-4 h-4" /> Live Chat</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/staff/complaints"
                className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                  theme === 'dark' ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-medium"><AlertCircle className="w-4 h-4" /> Complaints</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/staff/users"
                className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                  theme === 'dark' ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-medium"><Users className="w-4 h-4" /> Users</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className={`px-5 pb-5 text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Active chats: <span className="font-medium">{stats.chats.active_chats || 0}</span> • Open complaints: <span className="font-medium">{stats.complaints.open_complaints || 0}</span>
            </div>
          </div>
        </section>
      </div>
    </StaffLayout>
  );
};

export default StaffDashboard;
