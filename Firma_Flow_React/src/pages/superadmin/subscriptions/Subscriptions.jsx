import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '../../../components/SuperAdminLayout';
import { 
  CreditCard, 
  Search,
  CheckCircle,
  X,
  DollarSign,
  TrendingUp,
  Calendar,
  Building2,
  Eye
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSettings } from '../../../contexts/SettingsContext';

export default function Subscriptions() {
  const { theme } = useTheme();
  const { formatCurrency } = useSettings();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSub, setSelectedSub] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, [currentPage, statusFilter, planFilter]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 15,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : '',
        plan: planFilter !== 'all' ? planFilter : ''
      });

      const response = await fetch(`http://localhost/FirmaFlow/superadmin/api/subscriptions.php?action=list&${params}`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.success) {
        setSubscriptions(data.subscriptions || []);
        setTotalPages(data.pagination?.total_pages || 1);
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (subscriptionId) => {
    if (!confirm('Are you sure you want to confirm this subscription payment?')) {
      return;
    }

    try {
      const response = await fetch('http://localhost/FirmaFlow/superadmin/api/subscriptions.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'confirm_payment',
          subscription_id: subscriptionId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        fetchSubscriptions();
        alert('Payment confirmed successfully!');
      }
    } catch (error) {
      console.error('Failed to confirm payment:', error);
    }
  };

  const viewSubscription = async (subscriptionId) => {
    try {
      const response = await fetch(`http://localhost/FirmaFlow/superadmin/api/subscriptions.php?action=get_subscription&id=${subscriptionId}`, {
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.success) {
        setSelectedSub(data.subscription);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  };

  const getPlanBadge = (plan) => {
    const badges = {
      free: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      starter: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      professional: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      enterprise: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    };
    return badges[plan] || badges.free;
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return badges[status] || badges.pending;
  };

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    pending: subscriptions.filter(s => s.status === 'pending').length,
    revenue: subscriptions.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0)
  };

  const filteredSubscriptions = subscriptions.filter(sub =>
    sub.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.transaction_reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && subscriptions.length === 0) {
    return (
      <SuperAdminLayout title="Subscriptions" subtitle="Manage all subscription payments">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className={theme.textSecondary}>Loading subscriptions...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout title="Subscriptions" subtitle="Manage all subscription payments">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${theme.bgCard} rounded-xl p-4 ${theme.shadow} border ${theme.borderPrimary}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${theme.textSecondary} text-sm mb-1`}>Total</p>
                <p className={`text-2xl font-bold ${theme.textPrimary}`}>{stats.total}</p>
              </div>
              <CreditCard size={32} className="text-blue-500 opacity-50" />
            </div>
          </div>
          <div className={`${theme.bgCard} rounded-xl p-4 ${theme.shadow} border ${theme.borderPrimary}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${theme.textSecondary} text-sm mb-1`}>Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle size={32} className="text-green-500 opacity-50" />
            </div>
          </div>
          <div className={`${theme.bgCard} rounded-xl p-4 ${theme.shadow} border ${theme.borderPrimary}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${theme.textSecondary} text-sm mb-1`}>Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Calendar size={32} className="text-yellow-500 opacity-50" />
            </div>
          </div>
          <div className={`${theme.bgCard} rounded-xl p-4 ${theme.shadow} border ${theme.borderPrimary}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${theme.textSecondary} text-sm mb-1`}>Revenue</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.revenue)}</p>
              </div>
              <DollarSign size={32} className="text-purple-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`${theme.bgCard} rounded-xl p-4 lg:p-6 ${theme.shadow} border ${theme.borderPrimary}`}>
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by company or transaction reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                />
              </div>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className={`px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
              >
                <option value="all">All Plans</option>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className={`${theme.bgCard} rounded-xl ${theme.shadow} border ${theme.borderPrimary} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${theme.bgAccent} border-b ${theme.borderPrimary}`}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${theme.textSecondary} uppercase tracking-wider`}>
                    Company
                  </th>
                  <th className={`hidden md:table-cell px-4 py-3 text-left text-xs font-medium ${theme.textSecondary} uppercase tracking-wider`}>
                    Plan
                  </th>
                  <th className={`hidden lg:table-cell px-4 py-3 text-left text-xs font-medium ${theme.textSecondary} uppercase tracking-wider`}>
                    Amount
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${theme.textSecondary} uppercase tracking-wider`}>
                    Status
                  </th>
                  <th className={`hidden sm:table-cell px-4 py-3 text-left text-xs font-medium ${theme.textSecondary} uppercase tracking-wider`}>
                    Expires
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${theme.textSecondary} uppercase tracking-wider`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSubscriptions.length > 0 ? (
                  filteredSubscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-4">
                        <div>
                          <p className={`font-medium ${theme.textPrimary}`}>{sub.company_name}</p>
                          <p className={`text-xs ${theme.textSecondary} truncate`}>
                            Ref: {sub.transaction_reference}
                          </p>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-4 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPlanBadge(sub.subscription_plan)}`}>
                          {sub.subscription_plan}
                        </span>
                      </td>
                      <td className={`hidden lg:table-cell px-4 py-4 font-semibold ${theme.textPrimary}`}>
                        {formatCurrency(sub.amount)}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(sub.status)}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className={`hidden sm:table-cell px-4 py-4 text-sm ${theme.textSecondary}`}>
                        {sub.ends_at ? new Date(sub.ends_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewSubscription(sub.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          {sub.status === 'pending' && (
                            <button
                              onClick={() => confirmPayment(sub.id)}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="Confirm Payment"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className={`px-4 py-8 text-center ${theme.textSecondary}`}>
                      <CreditCard size={48} className="mx-auto mb-2 opacity-50" />
                      <p>No subscriptions found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`px-4 py-3 border-t ${theme.borderPrimary} flex items-center justify-between`}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                Previous
              </button>
              <span className={theme.textSecondary}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Subscription Detail Modal */}
      {showModal && selectedSub && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${theme.bgCard} rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto ${theme.shadow}`}>
            <div className={`sticky top-0 ${theme.bgCard} border-b ${theme.borderPrimary} p-6 flex justify-between items-start`}>
              <div>
                <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-2`}>
                  Subscription Details
                </h2>
                <p className={theme.textSecondary}>{selectedSub.company_name}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors`}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Subscription Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 ${theme.bgAccent} rounded-lg`}>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Plan</p>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getPlanBadge(selectedSub.subscription_plan)}`}>
                    {selectedSub.subscription_plan}
                  </span>
                </div>

                <div className={`p-4 ${theme.bgAccent} rounded-lg`}>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Status</p>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(selectedSub.status)}`}>
                    {selectedSub.status}
                  </span>
                </div>

                <div className={`p-4 ${theme.bgAccent} rounded-lg`}>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Amount</p>
                  <p className={`text-xl font-bold ${theme.textPrimary}`}>{formatCurrency(selectedSub.amount)}</p>
                </div>

                <div className={`p-4 ${theme.bgAccent} rounded-lg`}>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Billing Cycle</p>
                  <p className={`text-lg font-semibold ${theme.textPrimary}`}>{selectedSub.billing_cycle || 'Monthly'}</p>
                </div>

                <div className={`p-4 ${theme.bgAccent} rounded-lg`}>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Started</p>
                  <p className={`text-lg font-semibold ${theme.textPrimary}`}>
                    {new Date(selectedSub.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className={`p-4 ${theme.bgAccent} rounded-lg`}>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Expires</p>
                  <p className={`text-lg font-semibold ${theme.textPrimary}`}>
                    {selectedSub.ends_at ? new Date(selectedSub.ends_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div className={`p-4 ${theme.bgAccent} rounded-lg md:col-span-2`}>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Transaction Reference</p>
                  <p className={`font-mono text-sm ${theme.textPrimary}`}>{selectedSub.transaction_reference}</p>
                </div>

                {selectedSub.payment_method && (
                  <div className={`p-4 ${theme.bgAccent} rounded-lg`}>
                    <p className={`text-sm ${theme.textSecondary} mb-1`}>Payment Method</p>
                    <p className={`text-lg font-semibold ${theme.textPrimary}`}>{selectedSub.payment_method}</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {selectedSub.status === 'pending' && (
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      confirmPayment(selectedSub.id);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Confirm Payment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
