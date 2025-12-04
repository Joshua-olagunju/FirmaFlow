import { useState, useEffect } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import { X, Tag } from "lucide-react";
import { HexColorPicker } from "react-colorful";

const EditTagModal = ({ isOpen, onClose, onSave, tag }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    color: "#667eea",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (tag) {
      setFormData({
        name: tag.name || "",
        color: tag.color || "#667eea",
        description: tag.description || "",
      });
    }
  }, [tag]);

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

  const handleColorChange = (color) => {
    setFormData((prev) => ({
      ...prev,
      color,
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tag name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    const success = await onSave(formData);
    setIsSubmitting(false);

    if (success) {
      setFormData({ name: "", color: "#667eea", description: "" });
      setErrors({});
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({ name: "", color: "#667eea", description: "" });
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
            <Tag size={24} />
            Edit Tag
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
            {/* Tag Name */}
            <div>
              <label
                className={`block text-sm font-semibold ${theme.textPrimary} mb-2`}
              >
                Tag Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter tag name"
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  errors.name ? "border-red-500" : theme.borderSecondary
                } ${theme.bgAccent} ${
                  theme.textPrimary
                } focus:outline-none focus:ring-2 focus:ring-[#667eea] transition`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Tag Color */}
            <div>
              <label
                className={`block text-sm font-semibold ${theme.textPrimary} mb-2`}
              >
                Tag Color <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <HexColorPicker
                    color={formData.color}
                    onChange={handleColorChange}
                    style={{ width: "100%", height: "200px" }}
                  />
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="w-20 h-20 rounded-xl shadow-md border ${theme.borderSecondary}"
                    style={{ backgroundColor: formData.color }}
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className={`w-24 px-3 py-2 text-center rounded-lg border ${theme.borderSecondary} ${theme.bgAccent} ${theme.textPrimary} text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#667eea]`}
                  />
                </div>
              </div>
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
                placeholder="Enter tag description"
                rows={4}
                className={`w-full px-4 py-2.5 rounded-lg border ${theme.borderSecondary} ${theme.bgAccent} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-[#667eea] transition resize-none`}
              />
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

export default EditTagModal;
