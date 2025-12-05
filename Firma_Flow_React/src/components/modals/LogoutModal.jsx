import { X, LogOut } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const LogoutModal = ({ isOpen, onClose, onConfirm, isLoggingOut = false }) => {
  const { theme } = useTheme();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${theme.bgCard} rounded-xl ${theme.shadow} max-w-md w-full animate-fadeIn`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <LogOut className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Confirm Logout</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
            disabled={isLoggingOut}
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className={`${theme.textPrimary} text-base mb-4`}>
            Are you sure you want to log out? You will need to sign in again to
            access your account.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Your session will be terminated and you
              will be redirected to the login page.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`${theme.bgAccent} p-6 rounded-b-xl flex gap-3 justify-end`}
        >
          <button
            onClick={onClose}
            disabled={isLoggingOut}
            className={`px-6 py-2 ${theme.bgCard} border ${theme.borderSecondary} ${theme.textPrimary} rounded-lg ${theme.bgHover} transition font-medium disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={isLoggingOut}
            className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg transition font-medium disabled:opacity-50 flex items-center gap-2"
          >
            <LogOut size={18} />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
