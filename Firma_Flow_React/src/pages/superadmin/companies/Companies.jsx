import { useState, useEffect } from 'react';
import SuperAdminLayout from '../components/SuperAdminLayout';
import { 
  Building2, 
  Search,
  Eye,
  Play,
  Pause,
  Trash2,
  Users as UsersIcon,
  CreditCard,
  Gift,
  CheckCircle,
  X
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

export default function Companies() {
  const { theme } = useTheme();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, [currentPage, statusFilter, planFilter]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 15,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : '',
        plan: planFilter !== 'all' ? planFilter : ''
      });

      const response = await fetch(`http://localhost/FirmaFlow/superadmin/api/companies.php?${params}`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.success) {
        setCompanies(data.companies || []);
        setTotalPages(data.pagination?.total_pages || 1);
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCompanyStatus = async (companyId, currentStatus) => {
    const action = currentStatus === 'active' ? 'deactivate' : 'activate';
    
    if (!confirm(`Are you sure you want to ${action} this company?`)) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('action', action);
      formData.append('id', companyId);

      const response = await fetch('http://localhost/FirmaFlow/superadmin/api/companies.php', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        fetchCompanies();
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const viewCompany = async (companyId) => {
    try {
      const response = await fetch(`http://localhost/FirmaFlow/superadmin/api/companies.php?action=details&id=${companyId}`, {
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.success) {
        setSelectedCompany(data.company);
        setCompanyDetails({
          users: data.users || [],
          payments: data.payments || [],
          complaints: data.complaints || [],
          statistics: data.statistics || {}
        });
        setShowModal(true);
      } else {
        alert(data.message || 'Failed to load company details');
      }
    } catch (error) {
      console.error('Failed to load company:', error);
      alert('Error loading company details');
    }
  };

  const deleteCompany = async (companyId, companyName) => {
    if (!confirm(`Are you sure you want to DELETE "${companyName}"? This will remove all associated data and cannot be undone!`)) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('action', 'delete');
      formData.append('id', companyId);

      const response = await fetch('http://localhost/FirmaFlow/superadmin/api/companies.php', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        fetchCompanies();
      }
    } catch (error) {
      console.error('Failed to delete company:', error);
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
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return badges[status] || badges.inactive;
  };

  const stats = {
    total: companies.length,
    active: companies.filter(c => c.subscription_status === 'active').length,
    paid: companies.filter(c => c.subscription_plan !== 'free').length,
    free: companies.filter(c => c.subscription_plan === 'free').length
  };

  const filteredCompanies = companies.filter(company =>
    company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && companies.length === 0) {
    return (
      <SuperAdminLayout title="Companies Management" subtitle="Monitor and manage all companies">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className={theme.textSecondary}>Loading companies...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout title="Companies Management" subtitle="Monitor and manage all companies">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${theme.bgCard} rounded-xl p-4 ${theme.shadow} border ${theme.borderPrimary}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${theme.textSecondary} text-sm mb-1`}>Total</p>
                <p className={`text-2xl font-bold ${theme.textPrimary}`}>{stats.total}</p>
              </div>
              <Building2 size={32} className="text-blue-500 opacity-50" />
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
                <p className={`${theme.textSecondary} text-sm mb-1`}>Paid Plans</p>
                <p className="text-2xl font-bold text-orange-600">{stats.paid}</p>
              </div>
              <CreditCard size={32} className="text-orange-500 opacity-50" />
            </div>
          </div>
          <div className={`${theme.bgCard} rounded-xl p-4 ${theme.shadow} border ${theme.borderPrimary}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${theme.textSecondary} text-sm mb-1`}>Free Plans</p>
                <p className="text-2xl font-bold text-gray-600">{stats.free}</p>
              </div>
              <Gift size={32} className="text-gray-500 opacity-50" />
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
                  placeholder="Search companies by name or email..."
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
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>

              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className={`px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
              >
                <option value="all">All Plans</option>
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </div>

        {/* Companies Table */}
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
                  <th className={`px-4 py-3 text-left text-xs font-medium ${theme.textSecondary} uppercase tracking-wider`}>
                    Status
                  </th>
                  <th className={`hidden lg:table-cell px-4 py-3 text-left text-xs font-medium ${theme.textSecondary} uppercase tracking-wider`}>
                    Users
                  </th>
                  <th className={`hidden sm:table-cell px-4 py-3 text-left text-xs font-medium ${theme.textSecondary} uppercase tracking-wider`}>
                    Created
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${theme.textSecondary} uppercase tracking-wider`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCompanies.length > 0 ? (
                  filteredCompanies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-4">
                        <div>
                          <p className={`font-medium ${theme.textPrimary}`}>{company.name}</p>
                          <p className={`text-sm ${theme.textSecondary} truncate`}>{company.email}</p>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-4 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPlanBadge(company.subscription_plan)}`}>
                          {company.subscription_plan}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(company.subscription_status)}`}>
                          {company.subscription_status}
                        </span>
                      </td>
                      <td className={`hidden lg:table-cell px-4 py-4 ${theme.textPrimary}`}>
                        <span className="flex items-center gap-1">
                          <UsersIcon size={16} />
                          {company.user_count || 0}
                        </span>
                      </td>
                      <td className={`hidden sm:table-cell px-4 py-4 text-sm ${theme.textSecondary}`}>
                        {new Date(company.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewCompany(company.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => toggleCompanyStatus(company.id, company.subscription_status)}
                            className={`p-2 rounded-lg transition-colors ${
                              company.subscription_status === 'active'
                                ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                            }`}
                            title={company.subscription_status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {company.subscription_status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                          </button>
                          <button
                            onClick={() => deleteCompany(company.id, company.name)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className={`px-4 py-8 text-center ${theme.textSecondary}`}>
                      <Building2 size={48} className="mx-auto mb-2 opacity-50" />
                      <p>No companies found</p>
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

      {/* Company Detail Modal */}
      {showModal && selectedCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${theme.bgCard} rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto ${theme.shadow}`}>
            <div className={`sticky top-0 ${theme.bgCard} border-b ${theme.borderPrimary} p-6 flex justify-between items-start`}>
              <div>
                <h2 className={`text-2xl font-bold ${theme.textPrimary} mb-2`}>
                  {selectedCompany.name}
                </h2>
                <p className={theme.textSecondary}>{selectedCompany.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedCompany(null);
                  setCompanyDetails(null);
                }}
                className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors`}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Company Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-4 ${theme.bgAccent} rounded-lg`}>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Subscription Plan</p>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getPlanBadge(selectedCompany.subscription_plan)}`}>
                    {selectedCompany.subscription_plan}
                  </span>
                </div>

                <div className={`p-4 ${theme.bgAccent} rounded-lg`}>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Status</p>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(selectedCompany.subscription_status)}`}>
                    {selectedCompany.subscription_status}
                  </span>
                </div>

                <div className={`p-4 ${theme.bgAccent} rounded-lg`}>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Total Users</p>
                  <p className={`text-2xl font-bold ${theme.textPrimary}`}>{companyDetails?.statistics?.user_count || 0}</p>
                </div>

                <div className={`p-4 ${theme.bgAccent} rounded-lg`}>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Total Revenue</p>
                  <p className={`text-xl font-bold text-green-600`}>
                    ₦{(companyDetails?.statistics?.total_revenue || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCompany.phone && (
                  <div className={`p-4 ${theme.bgAccent} rounded-lg`}>
                    <p className={`text-sm ${theme.textSecondary} mb-1`}>Phone</p>
                    <p className={`text-lg font-semibold ${theme.textPrimary}`}>{selectedCompany.phone}</p>
                  </div>
                )}

                <div className={`p-4 ${theme.bgAccent} rounded-lg`}>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Created</p>
                  <p className={`text-lg font-semibold ${theme.textPrimary}`}>
                    {new Date(selectedCompany.created_at).toLocaleDateString()}
                  </p>
                </div>

                {selectedCompany.subscription_end_date && (
                  <div className={`p-4 ${theme.bgAccent} rounded-lg`}>
                    <p className={`text-sm ${theme.textSecondary} mb-1`}>Subscription Ends</p>
                    <p className={`text-lg font-semibold ${theme.textPrimary}`}>
                      {new Date(selectedCompany.subscription_end_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className={`p-4 ${theme.bgAccent} rounded-lg`}>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Billing Cycle</p>
                  <p className={`text-lg font-semibold ${theme.textPrimary} capitalize`}>
                    {selectedCompany.billing_cycle || 'monthly'}
                  </p>
                </div>

                {selectedCompany.address && (
                  <div className={`p-4 ${theme.bgAccent} rounded-lg md:col-span-2`}>
                    <p className={`text-sm ${theme.textSecondary} mb-1`}>Address</p>
                    <p className={`${theme.textPrimary}`}>{selectedCompany.address}</p>
                  </div>
                )}
              </div>

              {/* Users List */}
              {companyDetails?.users && companyDetails.users.length > 0 && (
                <div>
                  <h3 className={`text-lg font-bold ${theme.textPrimary} mb-3`}>
                    Users ({companyDetails.users.length})
                  </h3>
                  <div className="space-y-2">
                    {companyDetails.users.map((user) => (
                      <div key={user.id} className={`p-3 ${theme.bgAccent} rounded-lg flex items-center justify-between`}>
                        <div>
                          <p className={`${theme.textPrimary} font-medium`}>
                            {user.first_name} {user.last_name}
                          </p>
                          <p className={`${theme.textSecondary} text-sm`}>{user.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                            user.role === 'manager' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {user.role}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Payments */}
              {companyDetails?.payments && companyDetails.payments.length > 0 && (
                <div>
                  <h3 className={`text-lg font-bold ${theme.textPrimary} mb-3`}>
                    Recent Payments
                  </h3>
                  <div className="space-y-2">
                    {companyDetails.payments.map((payment) => (
                      <div key={payment.id} className={`p-3 ${theme.bgAccent} rounded-lg flex items-center justify-between`}>
                        <div>
                          <p className={`${theme.textPrimary} font-medium`}>
                            ₦{payment.amount.toLocaleString()}
                          </p>
                          <p className={`${theme.textSecondary} text-sm`}>
                            {new Date(payment.created_at).toLocaleString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          payment.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowModal(false);
                    toggleCompanyStatus(selectedCompany.id, selectedCompany.subscription_status);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCompany.subscription_status === 'active'
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {selectedCompany.subscription_status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    deleteCompany(selectedCompany.id, selectedCompany.name);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Company
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
