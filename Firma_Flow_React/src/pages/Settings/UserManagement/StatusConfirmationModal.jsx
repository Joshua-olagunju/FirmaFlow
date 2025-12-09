import { X, UserX, UserCheck } from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";

const StatusConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  user,
  isActivating,
}) => {
  const { theme } = useTheme();
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${theme.bgCard} rounded-xl ${theme.shadow} max-w-md w-full animate-fadeIn`}
      >
        {/* Header */}
        <div
          className={`bg-gradient-to-r ${
            isActivating
              ? "from-green-500 to-green-600"
              : "from-orange-500 to-orange-600"
          } p-6 rounded-t-xl flex items-center justify-between`}
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              {isActivating ? (
                <UserCheck className="text-white" size={24} />
              ) : (
                <UserX className="text-white" size={24} />
              )}
            </div>
            <h2 className="text-xl font-bold text-white">
              {isActivating ? "Activate User" : "Deactivate User"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className={`${theme.textPrimary} text-base mb-4`}>
            {isActivating
              ? "Are you sure you want to activate this user? They will be able to access the system."
              : "Are you sure you want to deactivate this user? They will no longer be able to access the system."}
          </p>

          <div
            className={`${theme.bgAccent} border ${theme.borderSecondary} rounded-lg p-4 mb-4`}
          >
            <p className={`text-sm ${theme.textSecondary} mb-1`}>User:</p>
            <p className={`font-semibold ${theme.textPrimary}`}>{user.name}</p>
            <p className={`text-sm ${theme.textSecondary} mt-1`}>
              {user.email}
            </p>
          </div>

          <div
            className={`${
              isActivating
                ? "bg-green-50 border-green-200"
                : "bg-amber-50 border-amber-200"
            } border rounded-lg p-4`}
          >
            <p
              className={`text-sm ${
                isActivating ? "text-green-800" : "text-amber-800"
              }`}
            >
              {isActivating ? (
                <>
                  <strong>Note:</strong> The user will regain access to their
                  account and be able to log in immediately.
                </>
              ) : (
                <>
                  <strong>Note:</strong> The user will be logged out and unable
                  to access the system. You can reactivate them later.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`${theme.bgAccent} p-6 rounded-b-xl flex gap-3 justify-end`}
        >
          <button
            onClick={onClose}
            className={`px-6 py-2 ${theme.bgCard} border ${theme.borderSecondary} ${theme.textPrimary} rounded-lg ${theme.bgHover} transition font-medium`}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-6 py-2 ${
              isActivating
                ? "bg-gradient-to-r from-green-500 to-green-600"
                : "bg-gradient-to-r from-orange-500 to-orange-600"
            } text-white rounded-lg hover:shadow-lg transition font-medium`}
          >
            {isActivating ? "Activate" : "Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusConfirmationModal;
