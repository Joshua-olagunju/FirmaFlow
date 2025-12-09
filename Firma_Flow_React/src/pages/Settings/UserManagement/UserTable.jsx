import { useTheme } from "../../../contexts/ThemeContext";
import UserActions from "./UserActions";

const UserTable = ({
  users,
  isLoading,
  onEdit,
  onResetPassword,
  onToggleStatus,
  onDelete,
  currentUserId,
}) => {
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#667eea] border-t-transparent rounded-full animate-spin"></div>
          <p className={`${theme.textSecondary} text-sm`}>Loading users...</p>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className={`p-6 rounded-full ${theme.bgAccent} mb-4`}>
          <svg
            className={theme.textSecondary}
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className={`text-xl font-semibold ${theme.textPrimary} mb-2`}>
          No Users Found
        </h3>
        <p className={`${theme.textSecondary} text-sm`}>
          Add your first user to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className={`${theme.bgAccent} border-b ${theme.borderPrimary}`}>
            <th
              className={`px-6 py-4 text-left text-xs font-semibold ${theme.textSecondary} uppercase tracking-wider`}
            >
              Name
            </th>
            <th
              className={`px-6 py-4 text-left text-xs font-semibold ${theme.textSecondary} uppercase tracking-wider`}
            >
              Email
            </th>
            <th
              className={`px-6 py-4 text-left text-xs font-semibold ${theme.textSecondary} uppercase tracking-wider`}
            >
              Phone
            </th>
            <th
              className={`px-6 py-4 text-left text-xs font-semibold ${theme.textSecondary} uppercase tracking-wider`}
            >
              Role
            </th>
            <th
              className={`px-6 py-4 text-left text-xs font-semibold ${theme.textSecondary} uppercase tracking-wider`}
            >
              Status
            </th>
            <th
              className={`px-6 py-4 text-left text-xs font-semibold ${theme.textSecondary} uppercase tracking-wider`}
            >
              Last Login
            </th>
            <th
              className={`px-6 py-4 text-center text-xs font-semibold ${theme.textSecondary} uppercase tracking-wider`}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {users.map((user) => {
            const isOwner = user.role === "admin";
            const isCurrentUser = user.id === currentUserId;

            return (
              <tr
                key={user.id}
                className={`${theme.bgCard} ${theme.bgHover} transition-colors`}
              >
                {/* Name */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${theme.textPrimary}`}>
                      {user.name}
                    </span>
                    {isOwner && (
                      <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-md">
                        Owner
                      </span>
                    )}
                  </div>
                </td>

                {/* Email */}
                <td
                  className={`px-6 py-4 whitespace-nowrap ${theme.textSecondary}`}
                >
                  {user.email}
                </td>

                {/* Phone */}
                <td
                  className={`px-6 py-4 whitespace-nowrap ${theme.textSecondary}`}
                >
                  {user.phone || "N/A"}
                </td>

                {/* Role */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      user.role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : user.role === "manager"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      user.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>

                {/* Last Login */}
                <td
                  className={`px-6 py-4 whitespace-nowrap ${theme.textSecondary} text-sm`}
                >
                  {user.lastLogin}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {isOwner && isCurrentUser ? (
                    <span
                      className={`text-sm font-medium ${theme.textSecondary} italic`}
                    >
                      Your Account
                    </span>
                  ) : isOwner ? (
                    <span
                      className={`text-sm font-medium ${theme.textSecondary} italic`}
                    >
                      Admin Account
                    </span>
                  ) : (
                    <UserActions
                      user={user}
                      onEdit={onEdit}
                      onResetPassword={onResetPassword}
                      onToggleStatus={onToggleStatus}
                      onDelete={onDelete}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
