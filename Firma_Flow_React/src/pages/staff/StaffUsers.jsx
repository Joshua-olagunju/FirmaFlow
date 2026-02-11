import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { buildApiUrl } from '../../config/api.config';
import StaffLayout from '../../components/StaffLayout';
import { User, Mail, Building2, Calendar, Search } from 'lucide-react';

const StaffUsers = () => {
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const url = buildApiUrl('superadmin/api/users.php');
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    setLoadingDetails(true);
    try {
      const url = buildApiUrl(`superadmin/api/users.php?user_id=${userId}`);
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        setUserDetails(data);
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setModalOpen(true);
    fetchUserDetails(user.id);
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
  };

  return (
    <StaffLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Users Management</h1>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            View and manage system users
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Users</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <User className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <User className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Inactive</p>
                <p className="text-2xl font-bold">{stats.inactive}</p>
              </div>
              <User className="w-8 h-8 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-200 text-gray-900'
              } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
        </div>

        {/* Users List */}
        <div className={`flex-1 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden`}>
          {loading ? (
            <div className="p-8 text-center">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No users found</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full">
                <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={`${theme === 'dark' ? 'hover:bg-gray-750' : 'hover:bg-gray-50'} cursor-pointer`}
                      onClick={() => handleViewUser(user)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3
                            ${theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500'} text-white font-bold`}>
                            {user.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{user.name || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm">
                          <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                          {user.company_name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(user);
                            setModalOpen(true);
                          }}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Details Modal */}
        {modalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold">User Details</h2>
                  <button
                    onClick={() => {
                      setModalOpen(false);
                      setUserDetails(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {loadingDetails ? (
                  <div className="text-center py-8">Loading details...</div>
                ) : (
                  <div className="space-y-6">
                    {/* User Info */}
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center
                        ${theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500'} text-white text-2xl font-bold`}>
                        {selectedUser.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                        <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {selectedUser.email}
                        </p>
                      </div>
                    </div>

                    {/* Basic Info Grid */}
                    <div className={`grid grid-cols-2 gap-4 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'}`}>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Company</label>
                        <p className="font-medium">{userDetails?.user?.company_name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <p className="capitalize font-medium">{userDetails?.user?.status || 'active'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="font-medium">{userDetails?.user?.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Joined Date</label>
                        <p className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Subscription Info */}
                    {userDetails?.user?.subscription_name && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center">
                          <Building2 className="w-5 h-5 mr-2" />
                          Subscription Plan
                        </h4>
                        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-750' : 'bg-blue-50'}`}>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-gray-500">Plan</label>
                              <p className="font-semibold text-lg">{userDetails.user.subscription_name}</p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-500">Price</label>
                              <p className="font-semibold text-lg">
                                ${userDetails.user.subscription_price}/{userDetails.user.billing_cycle}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-500">Status</label>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                userDetails.user.subscription_status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {userDetails.user.subscription_status}
                              </span>
                            </div>
                            <div>
                              <label className="text-sm text-gray-500">Valid Until</label>
                              <p className="font-medium">
                                {new Date(userDetails.user.subscription_end).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Company Details */}
                    {userDetails?.user?.company_name && (
                      <div>
                        <h4 className="font-semibold mb-3">Company Information</h4>
                        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'}`}>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-gray-500">Industry</label>
                              <p>{userDetails.user.industry || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-500">Company Size</label>
                              <p>{userDetails.user.company_size || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-500">Tax ID</label>
                              <p>{userDetails.user.tax_id || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-500">Website</label>
                              <p>{userDetails.user.website || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Complaints History */}
                    {userDetails?.complaints && userDetails.complaints.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Recent Complaints</h4>
                        <div className="space-y-2">
                          {userDetails.complaints.map((complaint) => (
                            <div
                              key={complaint.id}
                              className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'}`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{complaint.subject}</p>
                                  <p className="text-sm text-gray-500">
                                    {new Date(complaint.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  complaint.status === 'resolved'
                                    ? 'bg-green-100 text-green-800'
                                    : complaint.status === 'in_progress'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {complaint.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {userDetails?.user?.address && (
                      <div>
                        <h4 className="font-semibold mb-2">Address</h4>
                        <p className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'}`}>
                          {userDetails.user.address}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => {
                      setModalOpen(false);
                      setUserDetails(null);
                    }}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  );
};

export default StaffUsers;
