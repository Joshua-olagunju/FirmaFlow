import { useState, useEffect } from "react";
import { X, Users, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useUser } from "../../contexts/UserContext";
import { buildApiUrl } from "../../config/api.config";

const SwitchAccountModal = ({ isOpen, onClose, onSuccess }) => {
  const { theme } = useTheme();
  const { user, updateUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [companyUsers, setCompanyUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch company users when modal opens
  useEffect(() => {
    if (isOpen && user?.role === 'admin') {
      fetchCompanyUsers();
    }
  }, [isOpen, user]);

  const fetchCompanyUsers = async () => {
    try {
      setLoadingUsers(true);
      setError("");

      const response = await fetch(buildApiUrl("api/users.php?action=get_admin_users"), {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Filter out the current admin user
        const filteredUsers = data.users.filter(u => u.id !== user.id && u.role !== 'admin');
        setCompanyUsers(filteredUsers);
      } else {
        throw new Error(data.message || "Failed to load company users");
      }
    } catch (err) {
      console.error("Error fetching company users:", err);
      setError(err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSwitchAccount = async () => {
    if (!selectedUser || !password) {
      setError("Please select a user and enter your password");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(buildApiUrl("api/auth.php"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "switch_user_account",
          user_id: selectedUser.id,
          company_id: selectedUser.company_id,
          password: password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update user context with new user data
        updateUser(data.user);
        
        // Call success callback
        if (onSuccess) {
          onSuccess(data.user);
        }
        
        // Close modal
        onClose();
        
        // Reset form
        setPassword("");
        setSelectedUser(null);
        
        // Show success message and reload page
        alert(`Successfully switched to ${selectedUser.first_name} ${selectedUser.last_name}'s account`);
        window.location.reload();
      } else {
        throw new Error(data.message || "Failed to switch account");
      }
    } catch (err) {
      console.error("Switch account error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword("");
    setSelectedUser(null);
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className={`${theme.bgCard} rounded-xl ${theme.shadow} max-w-md w-full animate-fadeIn`}>
          <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Users className="text-white" size={24} />
              </div>
              <h2 className="text-xl font-bold text-white">Access Denied</h2>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-lg transition">
              <X size={20} className="text-white" />
            </button>
          </div>
          <div className="p-6">
            <p className={`${theme.textPrimary} text-center`}>
              Only administrators can switch between user accounts.
            </p>
          </div>
          <div className={`${theme.bgAccent} p-6 rounded-b-xl flex justify-end`}>
            <button
              onClick={handleClose}
              className={`px-6 py-2 ${theme.bgCard} border ${theme.borderSecondary} ${theme.textPrimary} rounded-lg ${theme.bgHover} transition font-medium`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${theme.bgCard} rounded-xl ${theme.shadow} max-w-md w-full animate-fadeIn`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Users className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Switch Account</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
            disabled={loading}
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* User Selection */}
          <div>
            <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
              Select User Account
            </label>
            
            {loadingUsers ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#667eea]"></div>
                <span className={`ml-2 ${theme.textSecondary}`}>Loading users...</span>
              </div>
            ) : companyUsers.length === 0 ? (
              <div className={`${theme.bgAccent} border ${theme.borderSecondary} rounded-lg p-4 text-center`}>
                <p className={`${theme.textSecondary} text-sm`}>
                  No user accounts available to switch to.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {companyUsers.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`p-3 border rounded-lg cursor-pointer transition ${
                      selectedUser?.id === u.id
                        ? "border-[#667eea] bg-gradient-to-r from-[#667eea]/10 to-[#764ba2]/10"
                        : `border-gray-200 ${theme.bgCard} hover:border-[#667eea]/50`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-medium ${theme.textPrimary}`}>
                          {u.first_name} {u.last_name}
                        </p>
                        <p className={`text-sm ${theme.textSecondary}`}>
                          {u.email} • {u.role}
                        </p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedUser?.id === u.id
                          ? "border-[#667eea] bg-[#667eea]"
                          : "border-gray-300"
                      }`}>
                        {selectedUser?.id === u.id && (
                          <div className="w-full h-full rounded-full bg-white/20"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Password Confirmation */}
          {selectedUser && (
            <div>
              <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                Confirm Your Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password to confirm"
                  className={`w-full p-3 pr-12 border ${theme.borderSecondary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${theme.bgCard} ${theme.textPrimary}`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${theme.textSecondary} hover:${theme.textPrimary} transition`}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className={`text-xs ${theme.textTertiary} mt-1`}>
                Your admin password is required to switch to another user's account.
              </p>
            </div>
          )}

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> You will be logged in as the selected user. 
              To return to your admin account, you'll need to log out and log back in.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`${theme.bgAccent} p-6 rounded-b-xl flex gap-3 justify-end`}>
          <button
            onClick={handleClose}
            disabled={loading}
            className={`px-6 py-2 ${theme.bgCard} border ${theme.borderSecondary} ${theme.textPrimary} rounded-lg ${theme.bgHover} transition font-medium disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            onClick={handleSwitchAccount}
            disabled={loading || !selectedUser || !password || companyUsers.length === 0}
            className="px-6 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg hover:shadow-lg transition font-medium disabled:opacity-50 flex items-center gap-2"
          >
            <Users size={18} />
            {loading ? "Switching..." : "Switch Account"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SwitchAccountModal;