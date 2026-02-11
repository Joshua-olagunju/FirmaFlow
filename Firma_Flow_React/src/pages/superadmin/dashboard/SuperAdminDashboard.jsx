import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { buildApiUrl } from '../../../config/api.config';
import SuperAdminLayout from '../../../components/SuperAdminLayout';

const SuperAdminDashboard = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: { total: 0, active: 0, newToday: 0 },
    companies: { total: 0, active: 0, newToday: 0 },
    subscriptions: { active: 0, revenue: 0, newToday: 0 },
    tickets: { total: 0, pending: 0, resolved: 0, critical: 0 },
    chat: { active: 0, waiting: 0, totalToday: 0 }
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard stats from API
      const response = await fetch(buildApiUrl('superadmin/api/dashboard-stats.php'), {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data || stats);
        }
      }
      
      // Load recent activity (mock data for now)
      setRecentActivity([
        { 
          id: 1, 
          type: 'user', 
          message: 'New user registered: john@example.com',
          time: '2 minutes ago',
          icon: '👤'
        },
        { 
          id: 2, 
          type: 'company', 
          message: 'New company created: Tech Solutions Ltd',
          time: '5 minutes ago',
          icon: '🏢'
        },
        { 
          id: 3, 
          type: 'subscription', 
          message: 'Premium subscription activated',
          time: '15 minutes ago',
          icon: '💳'
        },
        { 
          id: 4, 
          type: 'ticket', 
          message: 'Support ticket resolved: #1234',
          time: '22 minutes ago',
          icon: '✅'
        }
      ]);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color, trend }) => (
    <div className={`p-6 rounded-xl border transition-all duration-200 hover:shadow-lg ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
        : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {title}
          </p>
          <p className={`text-3xl font-bold mt-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {loading ? '...' : value.toLocaleString()}
          </p>
          {subtitle && (
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              <span className="mr-1">{trend.positive ? '↗' : '↘'}</span>
              {trend.value}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  const QuickAction = ({ title, description, icon, onClick, color }) => (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border text-left transition-all duration-200 hover:shadow-md transform hover:-translate-y-1 ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <span className="text-lg">{icon}</span>
        </div>
        <div className="flex-1">
          <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h3>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {description}
          </p>
        </div>
      </div>
    </button>
  );

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading dashboard...
            </p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              SuperAdmin Dashboard
            </h1>
            <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Welcome back! Here's what's happening with your system.
            </p>
          </div>
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats.users.total}
            subtitle={`${stats.users.active} active users`}
            icon="👥"
            color="bg-blue-100 text-blue-600"
            trend={{ positive: true, value: `+${stats.users.newToday} today` }}
          />
          <StatCard
            title="Companies"
            value={stats.companies.total}
            subtitle={`${stats.companies.active} active companies`}
            icon="🏢"
            color="bg-green-100 text-green-600"
            trend={{ positive: true, value: `+${stats.companies.newToday} today` }}
          />
          <StatCard
            title="Active Subscriptions"
            value={stats.subscriptions.active}
            subtitle={`$${stats.subscriptions.revenue.toLocaleString()} monthly revenue`}
            icon="💳"
            color="bg-purple-100 text-purple-600"
            trend={{ positive: true, value: `+${stats.subscriptions.newToday} today` }}
          />
          <StatCard
            title="Support Tickets"
            value={stats.tickets.total}
            subtitle={`${stats.tickets.pending} pending, ${stats.tickets.critical} critical`}
            icon="🎫"
            color="bg-orange-100 text-orange-600"
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickAction
              title="Manage Users"
              description="View and manage system users"
              icon="👥"
              color="bg-blue-100 text-blue-600"
              onClick={() => window.location.href = '/superadmin/users'}
            />
            <QuickAction
              title="View Companies"
              description="Manage company accounts"
              icon="🏢"
              color="bg-green-100 text-green-600"
              onClick={() => window.location.href = '/superadmin/companies'}
            />
            <QuickAction
              title="Support Tickets"
              description="Handle customer support"
              icon="🎫"
              color="bg-orange-100 text-orange-600"
              onClick={() => window.location.href = '/superadmin/tickets'}
            />
            <QuickAction
              title="Live Chat"
              description="Manage live chat sessions"
              icon="💬"
              color="bg-purple-100 text-purple-600"
              onClick={() => window.location.href = '/superadmin/live-chat'}
            />
            <QuickAction
              title="Subscriptions"
              description="Manage user subscriptions"
              icon="💳"
              color="bg-indigo-100 text-indigo-600"
              onClick={() => window.location.href = '/superadmin/subscriptions'}
            />
            <QuickAction
              title="System Settings"
              description="Configure platform settings"
              icon="⚙️"
              color="bg-gray-100 text-gray-600"
              onClick={() => alert('Settings coming soon!')}
            />
          </div>
        </div>

        {/* Recent Activity & System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Recent Activity
            </h2>
            <div className={`rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <span className="text-lg">{activity.icon}</span>
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {activity.message}
                        </p>
                        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div>
            <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              System Status
            </h2>
            <div className={`rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Database
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm text-green-600">Online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      API Services
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm text-green-600">Operational</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Live Chat System
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm text-green-600">Active</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Payment System
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm text-green-600">Connected</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email Service
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span className="text-sm text-yellow-600">Monitoring</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
