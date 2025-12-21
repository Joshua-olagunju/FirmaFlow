import { useState, useEffect } from 'react';
import SuperAdminLayout from '../components/SuperAdminLayout';
import { 
  Users as UsersIcon, 
  Search,
  Eye,
  Lock,
  ToggleLeft,
  ToggleRight,
  X,
  Mail,
  Building2,
  Calendar,
  Shield
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

export default function Users() {
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [companies, setCompanies] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, [currentPage, roleFilter, statusFilter, companyFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 15,
        search: searchTerm,
        role: roleFilter !== 'all' ? roleFilter : '',
        status: statusFilter !== 'all' ? statusFilter : '',
        company_id: companyFilter !== 'all' ? companyFilter : ''
      });

      const response = await fetch(`http://localhost/FirmaFlow/superadmin/api/users.php?${params}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users || []);
        setTotalPages(data.pagination?.total_pages || 1);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch('http://localhost/FirmaFlow/superadmin/api/users.php?action=get_companies', {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.success) {
        setCompanies(data.companies || []);
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await fetch('http://localhost/FirmaFlow/superadmin/api/users.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggle_status',
          user_id: userId,
          is_active: currentStatus ? 0 : 1
        })
      });

      const data = await response.json();
      
      if (data.success) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  const resetPassword = async (userId, username) => {
    if (!confirm(`Are you sure you want to reset the password for ${username}? An email will be sent to the user with their new credentials.`)) {
      return;
    }

    try {
      const response = await fetch('http://localhost/FirmaFlow/superadmin/api/users.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reset_password',
          user_id: userId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const emailStatus = data.email_sent ? '✅ Email sent successfully' : '⚠️ Password reset but email failed';
        alert(`Password reset successfully for ${username}!\n\nNew Password: ${data.new_password}\n\n${emailStatus}\n\nPlease save this password or share it with the user if email failed.`);
        setShowModal(false);
      } else {
        alert('Failed to reset password: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to reset password:', error);
      alert('Failed to reset password. Please try again.');
    }
  };

  const viewUser = async (userId) => {
    try {
      const response = await fetch(`http://localhost/FirmaFlow/superadmin/api/users.php?action=get_user&id=${userId}`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.success) {
        setSelectedUser(data.user);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      manager: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      user: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    };
    return badges[role] || badges.user;
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active == 1).length,
    admins: users.filter(u => u.role === 'admin').length,
    inactive: users.filter(u => u.is_active == 0).length
  };

  if (loading && users.length === 0) {
    return (
      <SuperAdminLayout title="Users Management" subtitle="Manage all system users">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className={theme.textSecondary}>Loading users...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout title="Users Management" subtitle="Manage all system users">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${theme.bgCard} rounded-xl p-4 ${theme.shadow} border ${theme.borderPrimary}`}>
            <p className={`${theme.textSecondary} text-sm mb-2`}>Total Users</p>
            <p className={`text-2xl font-bold ${theme.textPrimary}`}>{stats.total}</p>
          </div>
          <div className={`${theme.bgCard} rounded-xl p-4 ${theme.shadow} border ${theme.borderPrimary}`}>
            <p className={`${theme.textSecondary} text-sm mb-2`}>Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className={`${theme.bgCard} rounded-xl p-4 ${theme.shadow} border ${theme.borderPrimary}`}>
            <p className={`${theme.textSecondary} text-sm mb-2`}>Admins</p>
            <p className="text-2xl font-bold text-red-600">{stats.admins}</p>
          </div>
          <div className={`${theme.bgCard} rounded-xl p-4 ${theme.shadow} border ${theme.borderPrimary}`}>
            <p className={`${theme.textSecondary} text-sm mb-2`}>Inactive</p>
            <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
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
                  placeholder="Search users by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                />
              </div>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={`px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="user">User</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
              >
                <option value="all">All Status</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>

              {/* Company Filter */}
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className={`px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgPrimary} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
              >
                <option value="all">All Companies</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className={`${theme.bgCard} rounded-xl ${theme.shadow} border ${theme.borderPrimary} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${theme.bgAccent} border-b ${theme.borderPrimary}`}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${theme.textSecondary} uppercase tracking-wider`}>
                    User
                  </th>
                  <th className={`hidden lg:table-cell px-4 py-3 text-left text-xs font-medium ${theme.textSecondary} uppercase tracking-wider`}>
                    Company
                  </th>
                  <th className={`hidden md:table-cell px-4 py-3 text-left text-xs font-medium ${theme.textSecondary} uppercase tracking-wider`}>
                    Role
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${theme.textSecondary} uppercase tracking-wider`}>
                    Status
                  </th>
                  <th className={`hidden sm:table-cell px-4 py-3 text-left text-xs font-medium ${theme.textSecondary} uppercase tracking-wider`}>
                    Last Login
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${theme.textSecondary} uppercase tracking-wider`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </div>
                          <div className="min-w-0">
                            <p className={`font-medium ${theme.textPrimary} truncate`}>
                              {user.first_name} {user.last_name}
                            </p>
                            <p className={`text-sm ${theme.textSecondary} truncate`}>
                              {user.email}
                            </p>
                            <p className={`text-sm ${theme.textSecondary} truncate lg:hidden`}>
                              {user.company_name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={`hidden lg:table-cell px-4 py-4 ${theme.textPrimary}`}>
                        {user.company_name || 'N/A'}
                      </td>
                      <td className="hidden md:table-cell px-4 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadge(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => toggleUserStatus(user.id, user.is_active)}
                          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                            user.is_active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          {user.is_active ? (
                            <>
                              <ToggleRight size={14} />
                              <span className="hidden sm:inline">Active</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft size={14} />
                              <span className="hidden sm:inline">Inactive</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className={`hidden sm:table-cell px-4 py-4 text-sm ${theme.textSecondary}`}>
                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => viewUser(user.id)}
                          className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className={`px-4 py-8 text-center ${theme.textSecondary}`}>
                      <UsersIcon size={48} className="mx-auto mb-2 opacity-50" />
                      <p>No users found</p>
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

      {/* User Detail Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${theme.bgCard} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${theme.shadow}`}>
            <div className={`sticky top-0 ${theme.bgCard} border-b ${theme.borderPrimary} p-6 flex justify-between items-start`}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {selectedUser.first_name?.[0]}{selectedUser.last_name?.[0]}
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${theme.textPrimary}`}>
                    {selectedUser.first_name} {selectedUser.last_name}
                  </h2>
                  <p className={theme.textSecondary}>{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors`}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-4 ${theme.bgAccent} rounded-lg`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Mail size={18} className="text-purple-600" />
                    <p className={`text-sm ${theme.textSecondary}`}>Email</p>
                  </div>
                  <p className={`font-medium ${theme.textPrimary}`}>{selectedUser.email}</p>
                </div>

                <div className={`p-4 ${theme.bgAccent} rounded-lg`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 size={18} className="text-blue-600" />
                    <p className={`text-sm ${theme.textSecondary}`}>Company</p>
                  </div>
                  <p className={`font-medium ${theme.textPrimary}`}>{selectedUser.company_name || 'N/A'}</p>
                </div>

                <div className={`p-4 ${theme.bgAccent} rounded-lg`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={18} className="text-red-600" />
                    <p className={`text-sm ${theme.textSecondary}`}>Role</p>
                  </div>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getRoleBadge(selectedUser.role)}`}>
                    {selectedUser.role}
                  </span>
                </div>

                <div className={`p-4 ${theme.bgAccent} rounded-lg`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={18} className="text-green-600" />
                    <p className={`text-sm ${theme.textSecondary}`}>Member Since</p>
                  </div>
                  <p className={`font-medium ${theme.textPrimary}`}>
                    {new Date(selectedUser.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className={`p-4 ${theme.bgAccent} rounded-lg`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={18} className="text-orange-600" />
                    <p className={`text-sm ${theme.textSecondary}`}>Last Login</p>
                  </div>
                  <p className={`font-medium ${theme.textPrimary}`}>
                    {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : 'Never'}
                  </p>
                </div>

                <div className={`p-4 ${theme.bgAccent} rounded-lg`}>
                  <div className="flex items-center gap-2 mb-2">
                    <ToggleRight size={18} className={selectedUser.is_active ? 'text-green-600' : 'text-gray-600'} />
                    <p className={`text-sm ${theme.textSecondary}`}>Status</p>
                  </div>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                    selectedUser.is_active 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {selectedUser.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => toggleUserStatus(selectedUser.id, selectedUser.is_active)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedUser.is_active
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {selectedUser.is_active ? 'Deactivate User' : 'Activate User'}
                </button>
                <button
                  onClick={() => resetPassword(selectedUser.id, selectedUser.username)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <Lock size={18} />
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
