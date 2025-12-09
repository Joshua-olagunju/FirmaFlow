import { useState, useEffect } from "react";
import { UserPlus, Users } from "lucide-react";
import UserTable from "./UserTable";
import AddEditUserModal from "./AddEditUserModal";
import ResetPasswordModal from "./ResetPasswordModal";
import StatusConfirmationModal from "./StatusConfirmationModal";
import DeleteConfirmationModal from "../../../components/modals/DeleteConfirmationModal";
import { buildApiUrl } from "../../../config/api.config";
import { useTheme } from "../../../contexts/ThemeContext";

const UserManagement = () => {
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] =
    useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isActivating, setIsActivating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [subscriptionInfo, setSubscriptionInfo] = useState({
    plan: "FREE",
    currentUsers: 0,
    maxUsers: 1,
  });
  const [currentUserId, setCurrentUserId] = useState(null);

  // Fetch current user info to identify the owner
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(
          buildApiUrl("api/users.php?action=validate_current_user"),
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          setCurrentUserId(data.user?.id);
        }
      } catch (err) {
        console.error("Error fetching current user:", err);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(
        buildApiUrl("api/users.php?action=get_admin_users"),
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        const mappedUsers = data.users.map((user) => ({
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          phone: user.phone || "",
          role: user.role,
          status: user.is_active == 1 ? "Active" : "Inactive",
          isActive: user.is_active == 1,
          lastLogin: user.last_login
            ? new Date(user.last_login).toLocaleDateString("en-US")
            : "Never",
          createdAt: user.created_at,
        }));
        setUsers(mappedUsers);

        // Calculate subscription info based on users
        const nonAdminUsers = mappedUsers.filter((u) => u.role !== "admin");
        setSubscriptionInfo({
          plan: "FREE", // This should come from subscription API
          currentUsers: nonAdminUsers.length,
          maxUsers: 1,
        });
      } else {
        setError(data.error || "Failed to fetch users");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (newUser) => {
    try {
      const response = await fetch(buildApiUrl("api/users.php"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: newUser.firstName,
          last_name: newUser.lastName,
          email: newUser.email,
          phone: newUser.phone,
          password: newUser.password,
          role: newUser.role,
          is_active: newUser.isActive ? 1 : 0,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchUsers();
        return { success: true };
      } else {
        return { success: false, error: data.error || "Failed to add user" };
      }
    } catch (err) {
      console.error("Error adding user:", err);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (updatedUser) => {
    try {
      const response = await fetch(buildApiUrl("api/users.php"), {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: updatedUser.id,
          first_name: updatedUser.firstName,
          last_name: updatedUser.lastName,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: updatedUser.role,
          is_active: updatedUser.isActive ? 1 : 0,
          ...(updatedUser.password && { password: updatedUser.password }),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchUsers();
        return { success: true };
      } else {
        return { success: false, error: data.error || "Failed to update user" };
      }
    } catch (err) {
      console.error("Error updating user:", err);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setIsResetPasswordModalOpen(true);
  };

  const handleResetPasswordSubmit = async (userId, newPassword) => {
    try {
      const response = await fetch(buildApiUrl("api/users.php"), {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          password: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: data.error || "Failed to reset password",
        };
      }
    } catch (err) {
      console.error("Error resetting password:", err);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const handleToggleStatus = (user) => {
    setSelectedUser(user);
    setIsActivating(!user.isActive);
    setIsStatusModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!selectedUser) return;

    const newStatus = selectedUser.isActive ? 0 : 1;
    try {
      const response = await fetch(buildApiUrl("api/users.php"), {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedUser.id,
          is_active: newStatus,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchUsers();
      } else {
        alert(data.error || "Failed to update user status");
      }
    } catch (err) {
      console.error("Error updating user status:", err);
      alert("Network error. Please try again.");
    }
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(
        buildApiUrl(`api/users.php?id=${selectedUser.id}`),
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchUsers();
      } else {
        alert(data.error || "Failed to delete user");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Network error. Please try again.");
    }
  };

  const userLimitReached =
    subscriptionInfo.currentUsers >= subscriptionInfo.maxUsers;

  return (
    <div className={`${theme.bgCard} ${theme.shadow} rounded-xl p-4 md:p-6`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2
            className={`text-2xl font-bold ${theme.textPrimary} flex items-center gap-2`}
          >
            <Users size={24} />
            User Management
          </h2>
          <p className={`${theme.textSecondary} mt-1 text-sm`}>
            {subscriptionInfo.currentUsers} of {subscriptionInfo.maxUsers} users
            used •{" "}
            <span className="font-semibold">
              {subscriptionInfo.plan.toUpperCase()} Plan
            </span>
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          disabled={userLimitReached}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold shadow-lg transition whitespace-nowrap ${
            userLimitReached
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:opacity-90"
          }`}
        >
          <UserPlus size={18} />
          <span className="hidden sm:inline">Add New User</span>
          <span className="sm:inline md:hidden">Add User</span>
        </button>
      </div>

      {/* User Limit Warning */}
      {userLimitReached && (
        <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 rounded-lg mb-6">
          <p className="font-semibold">User limit reached!</p>
          <p className="text-sm">
            You have reached the maximum number of users for your{" "}
            {subscriptionInfo.plan.toUpperCase()} plan. Please upgrade to add
            more users.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Users Table */}
      <div
        className={`border ${theme.borderSecondary} rounded-lg overflow-hidden`}
      >
        <UserTable
          users={users}
          isLoading={isLoading}
          onEdit={handleEditUser}
          onResetPassword={handleResetPassword}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteUser}
          currentUserId={currentUserId}
        />
      </div>

      {/* Modals */}
      <AddEditUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddUser}
        mode="add"
      />

      <AddEditUserModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        onSave={handleUpdateUser}
        mode="edit"
        user={selectedUser}
      />

      <ResetPasswordModal
        isOpen={isResetPasswordModalOpen}
        onClose={() => {
          setIsResetPasswordModalOpen(false);
          setSelectedUser(null);
        }}
        onReset={handleResetPasswordSubmit}
        user={selectedUser}
      />

      <StatusConfirmationModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={confirmToggleStatus}
        user={selectedUser}
        isActivating={isActivating}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message="Are you sure you want to delete this user? This will permanently remove their access."
        itemName={selectedUser?.name}
      />
    </div>
  );
};

export default UserManagement;
