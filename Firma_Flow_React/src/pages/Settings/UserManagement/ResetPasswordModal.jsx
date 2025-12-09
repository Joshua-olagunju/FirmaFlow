import { useState } from "react";
import { X, Key, Info } from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";

const ResetPasswordModal = ({ isOpen, onClose, onReset, user }) => {
  const { theme } = useTheme();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  if (!isOpen || !user) return null;

  const handleChange = (field, value) => {
    if (field === "newPassword") {
      setNewPassword(value);
    } else {
      setConfirmPassword(value);
    }

    // Clear errors when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (apiError) {
      setApiError("");
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!newPassword) {
      newErrors.newPassword = "Password is required";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm the password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    const result = await onReset(user.id, newPassword);
    setIsSubmitting(false);

    if (result.success) {
      handleClose();
    } else {
      setApiError(
        result.error || "Failed to reset password. Please try again."
      );
    }
  };

  const handleClose = () => {
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setApiError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${theme.bgCard} rounded-xl ${theme.shadow} max-w-md w-full`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-700 p-6 flex justify-between items-center rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Key size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Reset Password</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* User Info */}
        <div className={`p-6 border-b ${theme.borderPrimary}`}>
          <p className={`text-sm ${theme.textSecondary}`}>
            Resetting password for:
          </p>
          <p className={`text-lg font-semibold ${theme.textPrimary} mt-1`}>
            {user.name}
          </p>
          <p className={`text-sm ${theme.textSecondary}`}>{user.email}</p>
        </div>

        {/* API Error Message */}
        {apiError && (
          <div className="mx-6 mt-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{apiError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* New Password */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
            >
              New Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => handleChange("newPassword", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                theme.bgInput
              } ${theme.textPrimary} ${
                errors.newPassword ? "border-red-500" : theme.borderSecondary
              }`}
              placeholder="Enter new password"
            />
            {errors.newPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
            )}
            <div
              className={`flex items-center gap-2 mt-1 ${theme.textSecondary} text-xs`}
            >
              <Info size={12} />
              <span>Minimum 8 characters</span>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
            >
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                theme.bgInput
              } ${theme.textPrimary} ${
                errors.confirmPassword
                  ? "border-red-500"
                  : theme.borderSecondary
              }`}
              placeholder="Confirm new password"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Security Note */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className={`text-sm font-semibold ${theme.textPrimary}`}>
                  Security Note
                </p>
                <p className={`text-xs ${theme.textSecondary} mt-1`}>
                  The user will need to use this new password on their next
                  login. Make sure to communicate the new password securely.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold border ${theme.borderSecondary} ${theme.textPrimary} hover:bg-gray-100 dark:hover:bg-slate-700 transition-all`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-purple-700 hover:shadow-xl"
              }`}
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordModal;
