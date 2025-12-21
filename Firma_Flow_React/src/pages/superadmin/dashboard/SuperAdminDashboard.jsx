import { useState, useEffect } from 'react';
import SuperAdminLayout from '../components/SuperAdminLayout';
import { 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Download
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSettings } from '../../../contexts/SettingsContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function SuperAdminDashboard() {
  const { theme } = useTheme();
  const { formatCurrency } = useSettings();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [chartType, setChartType] = useState('revenue');

  useEffect(() => {
    fetchAnalytics();
  }, [period, chartType]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost/FirmaFlow/superadmin/api/analytics.php?period=${period}&type=${chartType}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    window.location.href = `http://localhost/FirmaFlow/superadmin/api/analytics.php?action=export&period=${period}`;
  };

  const kpis = analytics?.kpis || {};
  const trends = analytics?.trends || {};
  const topCompanies = analytics?.top_companies || [];
  const recentActivity = analytics?.recent_activity || [];
  const distributions = analytics?.distributions || {};

  // Chart data
  const trendChartData = {
    labels: trends.labels || [],
    datasets: [
      {
        label: chartType === 'revenue' ? 'Revenue (₦)' : chartType === 'users' ? 'Users' : 'Companies',
        data: trends.data || [],
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const subscriptionChartData = {
    labels: ['Free', 'Starter', 'Professional', 'Enterprise'],
    datasets: [
      {
        data: [
          distributions.subscriptions?.free || 0,
          distributions.subscriptions?.starter || 0,
          distributions.subscriptions?.professional || 0,
          distributions.subscriptions?.enterprise || 0,
        ],
        backgroundColor: [
          'rgba(156, 163, 175, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(249, 115, 22, 0.8)',
        ],
      },
    ],
  };

  const rolesChartData = {
    labels: ['Admin', 'Manager', 'User'],
    datasets: [
      {
        data: [
          distributions.roles?.admin || 0,
          distributions.roles?.manager || 0,
          distributions.roles?.user || 0,
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return (
      <SuperAdminLayout title="Dashboard" subtitle="Analytics and system overview">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className={theme.textSecondary}>Loading analytics...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout title="Analytics Dashboard" subtitle="Real-time insights and metrics">
      <div className="space-y-6">
        {/* Filters & Export */}
        <div className={`${theme.bgCard} rounded-xl p-4 ${theme.shadow} border ${theme.borderPrimary}`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className={`px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>

              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className={`px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
              >
                <option value="revenue">Revenue Trend</option>
                <option value="users">Users Trend</option>
                <option value="companies">Companies Trend</option>
              </select>
            </div>

            <button
              onClick={exportReport}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Download size={18} />
              Export Report
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow} border ${theme.borderPrimary}`}>
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="text-purple-500" size={24} />
              <div className={`flex items-center gap-1 ${kpis.revenue_change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {kpis.revenue_change >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                <span className="text-sm font-medium">{Math.abs(kpis.revenue_change || 0)}%</span>
              </div>
            </div>
            <p className={`${theme.textSecondary} text-sm mb-1`}>Total Revenue</p>
            <p className={`text-2xl font-bold ${theme.textPrimary}`}>{formatCurrency(kpis.total_revenue || 0)}</p>
          </div>

          <div className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow} border ${theme.borderPrimary}`}>
            <div className="flex items-center justify-between mb-2">
              <Users className="text-blue-500" size={24} />
              <div className={`flex items-center gap-1 ${kpis.users_change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {kpis.users_change >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                <span className="text-sm font-medium">{Math.abs(kpis.users_change || 0)}%</span>
              </div>
            </div>
            <p className={`${theme.textSecondary} text-sm mb-1`}>Active Users</p>
            <p className={`text-2xl font-bold ${theme.textPrimary}`}>{kpis.active_users || 0}</p>
          </div>

          <div className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow} border ${theme.borderPrimary}`}>
            <div className="flex items-center justify-between mb-2">
              <Building2 className="text-green-500" size={24} />
              <div className={`flex items-center gap-1 ${kpis.companies_change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {kpis.companies_change >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                <span className="text-sm font-medium">{Math.abs(kpis.companies_change || 0)}%</span>
              </div>
            </div>
            <p className={`${theme.textSecondary} text-sm mb-1`}>Total Companies</p>
            <p className={`text-2xl font-bold ${theme.textPrimary}`}>{kpis.total_companies || 0}</p>
          </div>

          <div className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow} border ${theme.borderPrimary}`}>
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-orange-500" size={24} />
              <div className={`flex items-center gap-1 ${kpis.conversion_change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {kpis.conversion_change >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                <span className="text-sm font-medium">{Math.abs(kpis.conversion_change || 0)}%</span>
              </div>
            </div>
            <p className={`${theme.textSecondary} text-sm mb-1`}>Conversion Rate</p>
            <p className={`text-2xl font-bold ${theme.textPrimary}`}>{kpis.conversion_rate || 0}%</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trend Chart */}
          <div className={`lg:col-span-2 ${theme.bgCard} rounded-xl p-6 ${theme.shadow} border ${theme.borderPrimary}`}>
            <h3 className={`text-lg font-bold ${theme.textPrimary} mb-4`}>
              {chartType === 'revenue' ? 'Revenue Trend' : chartType === 'users' ? 'Users Growth' : 'Companies Growth'}
            </h3>
            <div style={{ height: '300px' }}>
              <Line data={trendChartData} options={chartOptions} />
            </div>
          </div>

          {/* Subscription Distribution */}
          <div className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow} border ${theme.borderPrimary}`}>
            <h3 className={`text-lg font-bold ${theme.textPrimary} mb-4`}>Subscription Plans</h3>
            <div style={{ height: '300px' }}>
              <Doughnut data={subscriptionChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>

        {/* Top Companies & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Companies */}
          <div className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow} border ${theme.borderPrimary}`}>
            <h3 className={`text-lg font-bold ${theme.textPrimary} mb-4`}>Top Performing Companies</h3>
            <div className="space-y-3">
              {topCompanies.slice(0, 5).map((company, index) => (
                <div key={index} className={`p-4 ${theme.bgAccent} rounded-lg flex items-center justify-between`}>
                  <div>
                    <p className={`${theme.textPrimary} font-medium`}>{company.name}</p>
                    <p className={`${theme.textSecondary} text-sm`}>{company.user_count} users</p>
                  </div>
                  <div className="text-right">
                    <p className={`${theme.textPrimary} font-bold`}>{formatCurrency(company.revenue)}</p>
                    <p className={`text-sm ${company.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {company.growth >= 0 ? '+' : ''}{company.growth}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow} border ${theme.borderPrimary}`}>
            <h3 className={`text-lg font-bold ${theme.textPrimary} mb-4`}>Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className={`p-3 ${theme.bgAccent} rounded-lg`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`${theme.textPrimary} font-medium text-sm`}>{activity.title}</p>
                      <p className={`${theme.textSecondary} text-xs mt-1`}>{activity.description}</p>
                    </div>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                      activity.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                      activity.type === 'danger' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                    }`}>
                      {activity.type}
                    </span>
                  </div>
                  <p className={`${theme.textSecondary} text-xs mt-2`}>
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Roles Distribution */}
        <div className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow} border ${theme.borderPrimary}`}>
          <h3 className={`text-lg font-bold ${theme.textPrimary} mb-4`}>User Roles Distribution</h3>
          <div style={{ height: '250px' }}>
            <Bar data={rolesChartData} options={{ ...chartOptions, indexAxis: 'y' }} />
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
