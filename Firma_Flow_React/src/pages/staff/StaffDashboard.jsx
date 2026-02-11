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
  TrendingUp,
  Activity 
} from 'lucide-react';

const StaffDashboard = () => {
  const { theme } = useTheme();
  const { staff } = useStaff();
  const [stats, setStats] = useState({
    chats: { total_chats: 0, active_chats: 0, pending_chats: 0, closed_chats: 0 },
    complaints: { total_complaints: 0, open_complaints: 0, in_progress_complaints: 0, resolved_complaints: 0 },
    users: { total_users: 0, active_users: 0, inactive_users: 0 },
    today: { chats_today: 0, complaints_today: 0, resolved_chats_today: 0, resolved_complaints_today: 0 }
  });
  const [recentActivity, setRecentActivity] = useState({ chats: [], complaints: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
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
        headers: { 'Content-Type': 'application/json' }
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
          today: data.stats.today || {}
        });
        setRecentActivity({
          chats: data.stats.recent?.chats || [],
          complaints: data.stats.recent?.complaints || []
        });
      } else {
        throw new Error(data.message || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const quickStats = [
    {
      title: 'My Chats',
      value: stats.chats.total_chats || 0,
      change: `${stats.chats.active_chats || 0} active`,
      icon: MessageSquare,
      color: 'blue',
      link: '/staff/chat'
    },
    {
      title: 'Pending Chats',
      value: stats.chats.pending_chats || 0,
      change: 'Awaiting response',
      icon: Clock,
      color: 'yellow',
      link: '/staff/chat'
    },
    {
      title: 'All Complaints',
      value: stats.complaints.total_complaints || 0,
      change: `${stats.complaints.open_complaints || 0} open`,
      icon: AlertCircle,
      color: 'red',
      link: '/staff/complaints'
    },
    {
      title: 'Resolved',
      value: stats.complaints.resolved_complaints || 0,
      change: 'Complaints closed',
      icon: CheckCircle,
      color: 'green',
      link: '/staff/complaints'
    }
  ];

  const getColorClass = (color) => {
    const colors = {
      blue: 'text-blue-500 bg-blue-100',
      yellow: 'text-yellow-500 bg-yellow-100',
      red: 'text-red-500 bg-red-100',
      green: 'text-green-500 bg-green-100'
    };
    return colors[color] || colors.blue;
  };

  return (
    <StaffLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {staff?.full_name || 'Staff'}! 👋
          </h1>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            Here's what's happening with your support queue today.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Link
                key={index}
                to={stat.link}
                className={`${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'} 
                  rounded-lg shadow p-6 transition-all hover:shadow-lg`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${getColorClass(stat.color)}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <TrendingUp className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-300'}`} />
                </div>
                <h3 className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {stat.title}
                </h3>
                <p className="text-3xl font-bold mb-1">{stat.value}</p>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  {stat.change}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className={`lg:col-span-2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow`}>
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Recent Activity
                </h2>
              </div>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading activity...</div>
              ) : (recentActivity.chats?.length === 0 && recentActivity.complaints?.length === 0) ? (
                <div className="text-center py-8 text-gray-500">No recent activity</div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.chats?.map((chat, index) => (
                    <div
                      key={`chat-${index}`}
                      className={`flex items-start p-4 rounded-lg ${
                        theme === 'dark' ? 'bg-gray-750 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                      } transition-colors`}
                    >
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-500 mr-4">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{chat.visitor_name || 'Anonymous'} - {chat.visitor_email}</p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(chat.updated_at).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        chat.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : chat.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {chat.status}
                      </span>
                    </div>
                  ))}
                  {recentActivity.complaints?.map((complaint, index) => (
                    <div
                      key={`complaint-${index}`}
                      className={`flex items-start p-4 rounded-lg ${
                        theme === 'dark' ? 'bg-gray-750 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                      } transition-colors`}
                    >
                      <div className="p-2 rounded-lg bg-red-100 text-red-500 mr-4">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{complaint.subject}</p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {complaint.name} - {new Date(complaint.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        complaint.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : complaint.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : complaint.status === 'resolved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {complaint.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow`}>
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-3">
              <Link
                to="/staff/chat"
                className="flex items-center p-4 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <MessageSquare className="w-5 h-5 mr-3" />
                <span className="font-medium">View Chats</span>
              </Link>
              
              <Link
                to="/staff/complaints"
                className="flex items-center p-4 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <AlertCircle className="w-5 h-5 mr-3" />
                <span className="font-medium">View Complaints</span>
              </Link>
              
              <Link
                to="/staff/users"
                className="flex items-center p-4 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
              >
                <Users className="w-5 h-5 mr-3" />
                <span className="font-medium">View Users</span>
              </Link>
            </div>

            {/* System Info */}
            <div className={`p-6 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className="font-semibold mb-3">Your Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Role:</span>
                  <span className="font-medium capitalize">{staff?.role || 'Support'}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Department:</span>
                  <span className="font-medium">{staff?.department || 'Support'}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Active Chats:</span>
                  <span className="font-medium">{stats.chats.active_chats || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Pending Tasks:</span>
                  <span className="font-medium">{stats.complaints.open_complaints || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
};

export default StaffDashboard;
