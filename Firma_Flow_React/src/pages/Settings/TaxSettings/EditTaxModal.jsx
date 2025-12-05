import { useState, useEffect } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import { X, Receipt } from "lucide-react";

const EditTaxModal = ({ isOpen, onClose, onSave, tax }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    rate: "",
    description: "",
    is_active: true,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (tax) {
      setFormData({
        name: tax.name || "",
        rate: tax.rate || "",
        description: tax.description || "",
        is_active: tax.is_active || false,
      });
    }
  }, [tax]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tax name is required";
    }

    if (
      !formData.rate ||
      parseFloat(formData.rate) < 0 ||
      parseFloat(formData.rate) > 100
    ) {
      newErrors.rate = "Tax rate must be between 0 and 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    const success = await onSave({
      ...formData,
      rate: parseFloat(formData.rate),
    });
    setIsSubmitting(false);

    if (success) {
      setFormData({ name: "", rate: "", description: "", is_active: true });
      setErrors({});
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({ name: "", rate: "", description: "", is_active: true });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${theme.bgCard} rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${theme.borderPrimary}`}
        >
          <h2
            className={`text-2xl font-bold ${theme.textPrimary} flex items-center gap-2`}
          >
            <Receipt size={24} />
            Edit Tax Rate
          </h2>
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg ${
              theme.mode === "light"
                ? "hover:bg-slate-100"
                : "hover:bg-slate-700"
            } transition`}
          >
            <X size={20} className={theme.textSecondary} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            {/* Tax Name */}
            <div>
              <label
                className={`block text-sm font-semibold ${theme.textPrimary} mb-2`}
              >
                Tax Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., VAT, GST, Sales Tax"
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  errors.name ? "border-red-500" : theme.borderSecondary
                } ${theme.bgAccent} ${
                  theme.textPrimary
                } focus:outline-none focus:ring-2 focus:ring-[#667eea] transition`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
              <p className={`${theme.textSecondary} text-xs mt-1`}>
                This name will appear in dropdown selections
              </p>
            </div>

            {/* Tax Rate */}
            <div>
              <label
                className={`block text-sm font-semibold ${theme.textPrimary} mb-2`}
              >
                Tax Rate (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="rate"
                value={formData.rate}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                max="100"
                step="0.01"
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  errors.rate ? "border-red-500" : theme.borderSecondary
                } ${theme.bgAccent} ${
                  theme.textPrimary
                } focus:outline-none focus:ring-2 focus:ring-[#667eea] transition`}
              />
              {errors.rate && (
                <p className="text-red-500 text-sm mt-1">{errors.rate}</p>
              )}
              <p className={`${theme.textSecondary} text-xs mt-1`}>
                Enter percentage (0-100)
              </p>
            </div>

            {/* Description */}
            <div>
              <label
                className={`block text-sm font-semibold ${theme.textPrimary} mb-2`}
              >
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Optional description for this tax rate"
                rows={4}
                className={`w-full px-4 py-2.5 rounded-lg border ${theme.borderSecondary} ${theme.bgAccent} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-[#667eea] transition resize-none`}
              />
            </div>

            {/* Active Toggle */}
            <div
              className={`flex items-center justify-between p-4 ${theme.bgAccent} rounded-lg border ${theme.borderSecondary}`}
            >
              <div>
                <p className={`text-sm font-semibold ${theme.textPrimary}`}>
                  Active Tax Rate
                </p>
                <p className={`${theme.textSecondary} text-xs mt-1`}>
                  Enable this tax rate for immediate use
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    is_active: !prev.is_active,
                  }))
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.is_active ? "bg-green-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.is_active ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className={`flex-1 px-4 py-2.5 rounded-lg border ${
                theme.borderSecondary
              } ${theme.textPrimary} ${
                theme.mode === "light"
                  ? "hover:bg-slate-100"
                  : "hover:bg-slate-700"
              } transition`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2.5 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg shadow-lg hover:opacity-90 transition ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaxModal;
