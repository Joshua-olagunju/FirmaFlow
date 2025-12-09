import { useState, useEffect } from "react";
import { X, Info } from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";

const AddEditUserModal = ({
  isOpen,
  onClose,
  onSave,
  mode = "add",
  user = null,
}) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "user",
    isActive: true,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  // Populate form when editing
  useEffect(() => {
    if (mode === "edit" && user) {
      setFormData({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || "",
        password: "", // Don't populate password for edit
        role: user.role,
        isActive: user.isActive,
      });
    } else if (mode === "add") {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        role: "user",
        isActive: true,
      });
    }
    setErrors({});
    setApiError("");
  }, [mode, user, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (apiError) {
      setApiError("");
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    // Password validation only for new users or when password is provided
    if (mode === "add") {
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }
    } else if (
      mode === "edit" &&
      formData.password &&
      formData.password.length < 8
    ) {
      newErrors.password = "Password must be at least 8 characters";
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
    const result = await onSave(formData);
    setIsSubmitting(false);

    if (result.success) {
      handleClose();
    } else {
      setApiError(result.error || "An error occurred. Please try again.");
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      role: "user",
      isActive: true,
    });
    setErrors({});
    setApiError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${theme.bgCard} rounded-xl ${theme.shadow} max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 flex justify-between items-center rounded-t-xl sticky top-0">
          <h2 className="text-2xl font-bold text-white">
            {mode === "add" ? "Add New User" : "Edit User"}
          </h2>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition"
          >
            <X size={24} />
          </button>
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
          {/* Row 1: First Name & Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${
                  theme.bgInput
                } ${theme.textPrimary} ${
                  errors.firstName ? "border-red-500" : theme.borderSecondary
                }`}
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${
                  theme.bgInput
                } ${theme.textPrimary} ${
                  errors.lastName ? "border-red-500" : theme.borderSecondary
                }`}
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Row 2: Email & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${
                  theme.bgInput
                } ${theme.textPrimary} ${
                  errors.email ? "border-red-500" : theme.borderSecondary
                }`}
                placeholder="user@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${theme.bgInput} ${theme.textPrimary} ${theme.borderSecondary}`}
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>

          {/* Row 3: Password & Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Password{" "}
                {mode === "add" && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${
                  theme.bgInput
                } ${theme.textPrimary} ${
                  errors.password ? "border-red-500" : theme.borderSecondary
                }`}
                placeholder={
                  mode === "edit"
                    ? "Leave blank to keep current"
                    : "Enter password"
                }
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
              <div
                className={`flex items-center gap-2 mt-1 ${theme.textSecondary} text-xs`}
              >
                <Info size={12} />
                <span>Minimum 8 characters</span>
              </div>
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Role <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${theme.bgInput} ${theme.textPrimary} ${theme.borderSecondary}`}
              >
                <option value="user">User - Basic access</option>
                <option value="manager">Manager - Limited admin access</option>
              </select>
              <div
                className={`flex items-center gap-2 mt-1 ${theme.textSecondary} text-xs`}
              >
                <Info size={12} />
                <span>Select appropriate access level</span>
              </div>
            </div>
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <div>
              <label className={`text-sm font-medium ${theme.textPrimary}`}>
                Active User
              </label>
              <p className={`text-xs ${theme.textSecondary} mt-1`}>
                User can login and access the system
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#667eea]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#667eea]"></div>
            </label>
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
                  : "bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:shadow-xl"
              }`}
            >
              {isSubmitting
                ? "Saving..."
                : mode === "add"
                ? "Save User"
                : "Update User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditUserModal;
