import { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import {
  Shield,
  Lock,
  Key,
  Info,
  LogOut,
  Clock,
  Calendar,
  Eye,
  EyeOff,
} from "lucide-react";
import { buildApiUrl } from "../../config/api.config";
import LogoutModal from "../../components/modals/LogoutModal";

const SecuritySettings = () => {
  const { theme } = useTheme();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [securityOptions, setSecurityOptions] = useState({
    forcePasswordChange: false,
    enableSessionTimeout: true,
    emailAlertsForLogins: true,
  });

  const [sessionInfo, setSessionInfo] = useState({
    lastLogin: null,
    sessionExpires: null,
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    fetchSecuritySettings();
    fetchSessionInfo();
  }, []);

  const fetchSecuritySettings = async () => {
    try {
      const response = await fetch(
        buildApiUrl("api/settings.php?type=settings"),
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        setSecurityOptions({
          forcePasswordChange:
            data.data.force_password_change === "1" ||
            data.data.force_password_change === true,
          enableSessionTimeout:
            data.data.enable_session_timeout === "1" ||
            data.data.enable_session_timeout === true ||
            data.data.enable_session_timeout === undefined,
          emailAlertsForLogins:
            data.data.email_alerts_for_logins === "1" ||
            data.data.email_alerts_for_logins === true ||
            data.data.email_alerts_for_logins === undefined,
        });
      }
    } catch (error) {
      console.error("Error fetching security settings:", error);
    }
  };

  const fetchSessionInfo = async () => {
    try {
      const response = await fetch(
        buildApiUrl("api/auth.php?action=session_info"),
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        setSessionInfo({
          lastLogin: data.data.last_login,
          sessionExpires: data.data.session_expires,
        });
      } else {
        // Set defaults on error
        setSessionInfo({
          lastLogin: new Date().toISOString(),
          sessionExpires: new Date(Date.now() + 3600000).toISOString(),
        });
      }
    } catch (error) {
      console.error("Error fetching session info:", error);
      // Set default values on error
      setSessionInfo({
        lastLogin: new Date().toISOString(),
        sessionExpires: new Date(Date.now() + 3600000).toISOString(),
      });
    }
  };

  const handlePasswordChange = async () => {
    setIsChangingPassword(true);
    setSuccessMessage("");
    setErrorMessage("");

    // Validation
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setErrorMessage("All password fields are required");
      setIsChangingPassword(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage("New passwords do not match");
      setIsChangingPassword(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long");
      setIsChangingPassword(false);
      return;
    }

    try {
      const response = await fetch(buildApiUrl("api/auth.php"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "change_password",
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMessage("Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(data.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSecurityOptionToggle = async (option, value) => {
    try {
      // Map camelCase to snake_case for database
      const keyMap = {
        forcePasswordChange: "force_password_change",
        enableSessionTimeout: "enable_session_timeout",
        emailAlertsForLogins: "email_alerts_for_logins",
      };

      const response = await fetch(buildApiUrl("api/settings.php"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "save_setting",
          key: keyMap[option],
          value: value ? "1" : "0",
          type: "boolean",
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSecurityOptions((prev) => ({
          ...prev,
          [option]: value,
        }));
        setSuccessMessage("Security setting saved successfully!");
        setTimeout(() => setSuccessMessage(""), 2000);
      } else {
        setErrorMessage("Failed to save security setting");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error updating security option:", error);
      setErrorMessage("Network error. Please try again.");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleLogoutAllDevices = async () => {
    setIsLoggingOut(true);
    try {
      // Use the existing logout action
      const response = await fetch(buildApiUrl("api/auth.php"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "logout",
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // Clear session storage and redirect to login
        sessionStorage.clear();
        localStorage.removeItem("user");
        window.location.href = "/login";
      } else {
        setErrorMessage(data.error || "Failed to logout");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error logging out:", error);
      // Force logout on error
      sessionStorage.clear();
      localStorage.removeItem("user");
      window.location.href = "/login";
    } finally {
      setIsLoggingOut(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div
      className={`${theme.bgCard} ${theme.shadow} rounded-xl p-4 md:p-6 max-w-full`}
    >
      {/* Header */}
      <div className="mb-6">
        <h2
          className={`text-2xl font-bold ${theme.textPrimary} flex items-center gap-2`}
        >
          <Shield size={24} />
          Security Settings
        </h2>
        <p className={`${theme.textSecondary} mt-1`}>
          Manage your account security and password
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* Change Password Section */}
      <div
        className={`mb-8 p-6 ${theme.bgAccent} rounded-lg border ${theme.borderSecondary}`}
      >
        <h3
          className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center gap-2`}
        >
          <Lock size={20} />
          Change Password
        </h3>

        <div className="space-y-4">
          {/* Current Password */}
          <div>
            <label className={`block font-semibold ${theme.textPrimary} mb-2`}>
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPassword.current ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
                placeholder="Enter your current password"
                className={`w-full px-4 py-2.5 pr-12 rounded-lg border ${theme.borderSecondary} ${theme.bgInput} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-[#667eea]`}
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => ({
                    ...prev,
                    current: !prev.current,
                  }))
                }
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.textSecondary} hover:${theme.textPrimary} transition`}
              >
                {showPassword.current ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className={`block font-semibold ${theme.textPrimary} mb-2`}>
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword.new ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                placeholder="Enter your new password"
                className={`w-full px-4 py-2.5 pr-12 rounded-lg border ${theme.borderSecondary} ${theme.bgInput} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-[#667eea]`}
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => ({ ...prev, new: !prev.new }))
                }
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.textSecondary} hover:${theme.textPrimary} transition`}
              >
                {showPassword.new ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className={`block font-semibold ${theme.textPrimary} mb-2`}>
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPassword.confirm ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                placeholder="Confirm your new password"
                className={`w-full px-4 py-2.5 pr-12 rounded-lg border ${theme.borderSecondary} ${theme.bgInput} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-[#667eea]`}
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => ({
                    ...prev,
                    confirm: !prev.confirm,
                  }))
                }
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.textSecondary} hover:${theme.textPrimary} transition`}
              >
                {showPassword.confirm ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {/* Change Password Button */}
          <button
            onClick={handlePasswordChange}
            disabled={isChangingPassword}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg shadow-lg hover:opacity-90 transition disabled:opacity-50"
          >
            <Key size={18} />
            {isChangingPassword ? "Changing Password..." : "Change Password"}
          </button>
        </div>
      </div>

      {/* Security Options Section */}
      <div
        className={`mb-8 p-6 ${theme.bgAccent} rounded-lg border ${theme.borderSecondary}`}
      >
        <h3
          className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center gap-2`}
        >
          <Shield size={20} />
          Security Options
        </h3>

        <div className="space-y-4">
          {/* Force Password Change */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <label
                className={`block font-semibold ${theme.textPrimary} mb-1`}
              >
                Force password change on next login
              </label>
            </div>
            <button
              onClick={() =>
                handleSecurityOptionToggle(
                  "forcePasswordChange",
                  !securityOptions.forcePasswordChange
                )
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                securityOptions.forcePasswordChange
                  ? "bg-green-600"
                  : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  securityOptions.forcePasswordChange
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Enable Session Timeout */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <label
                className={`block font-semibold ${theme.textPrimary} mb-1`}
              >
                Enable automatic session timeout
              </label>
            </div>
            <button
              onClick={() =>
                handleSecurityOptionToggle(
                  "enableSessionTimeout",
                  !securityOptions.enableSessionTimeout
                )
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                securityOptions.enableSessionTimeout
                  ? "bg-green-600"
                  : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  securityOptions.enableSessionTimeout
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Email Alerts */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <label
                className={`block font-semibold ${theme.textPrimary} mb-1`}
              >
                Receive email alerts for new logins
              </label>
            </div>
            <button
              onClick={() =>
                handleSecurityOptionToggle(
                  "emailAlertsForLogins",
                  !securityOptions.emailAlertsForLogins
                )
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                securityOptions.emailAlertsForLogins
                  ? "bg-green-600"
                  : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  securityOptions.emailAlertsForLogins
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Current Session Section */}
      <div
        className={`p-6 ${theme.bgAccent} rounded-lg border ${theme.borderSecondary}`}
      >
        <h3
          className={`text-lg font-semibold ${theme.textPrimary} mb-4 flex items-center gap-2`}
        >
          <Info size={20} />
          Current Session
        </h3>

        <div className="space-y-3 mb-4">
          {/* Last Login */}
          <div className="flex items-center gap-3">
            <Calendar size={18} className={theme.textSecondary} />
            <span className={`font-semibold ${theme.textPrimary}`}>
              Last login:
            </span>
            <span className={theme.textSecondary}>
              {formatDateTime(sessionInfo.lastLogin)}
            </span>
          </div>

          {/* Session Expires */}
          <div className="flex items-center gap-3">
            <Clock size={18} className={theme.textSecondary} />
            <span className={`font-semibold ${theme.textPrimary}`}>
              Session expires:
            </span>
            <span className={theme.textSecondary}>
              {formatDateTime(sessionInfo.sessionExpires)}
            </span>
          </div>
        </div>

        {/* Logout All Devices Button */}
        <button
          onClick={() => setShowLogoutModal(true)}
          className={`flex items-center gap-2 px-6 py-3 border-2 border-red-500 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition`}
        >
          <LogOut size={18} />
          Log Out from All Devices
        </button>
      </div>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutAllDevices}
        isLoggingOut={isLoggingOut}
      />
    </div>
  );
};

export default SecuritySettings;
