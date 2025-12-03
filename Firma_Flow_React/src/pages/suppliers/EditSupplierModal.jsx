import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const EditSupplierModal = ({ isOpen, onClose, onSave, supplier }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    taxNumber: "",
    paymentTerms: "Net 30 days",
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (supplier) {
      setFormData({
        companyName: supplier.companyName || "",
        contactPerson: supplier.contactPerson || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
        taxNumber: supplier.taxNumber || "",
        paymentTerms: supplier.paymentTerms || "Net 30 days",
        isActive: supplier.status === "Active",
      });
    }
  }, [supplier]);

  if (!isOpen || !supplier) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.companyName.trim())
      newErrors.companyName = "Company name is required";
    if (!formData.contactPerson.trim())
      newErrors.contactPerson = "Contact person is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.address.trim()) newErrors.address = "Address is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      const success = await onSave({
        ...supplier,
        ...formData,
        status: formData.isActive ? "Active" : "Inactive",
      });
      if (success) {
        handleClose();
      }
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${theme.bgCard} rounded-xl ${theme.shadow} max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 flex justify-between items-center rounded-t-xl sticky top-0">
          <h2 className="text-2xl font-bold text-white">Edit Supplier</h2>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Row 1: Company Name & Contact Person */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${
                  theme.bgInput
                } ${theme.textPrimary} ${
                  errors.companyName ? "border-red-500" : theme.borderSecondary
                }`}
                placeholder="Enter company name"
              />
              {errors.companyName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.companyName}
                </p>
              )}
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Contact Person <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${
                  theme.bgInput
                } ${theme.textPrimary} ${
                  errors.contactPerson
                    ? "border-red-500"
                    : theme.borderSecondary
                }`}
                placeholder="Enter contact person name"
              />
              {errors.contactPerson && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.contactPerson}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Phone & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${
                  theme.bgInput
                } ${theme.textPrimary} ${
                  errors.phone ? "border-red-500" : theme.borderSecondary
                }`}
                placeholder="Enter phone number"
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Email Address <span className="text-red-500">*</span>
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
                placeholder="supplier@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Row 3: Address */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
            >
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${
                theme.bgInput
              } ${theme.textPrimary} ${
                errors.address ? "border-red-500" : theme.borderSecondary
              }`}
              placeholder="Enter complete address"
            ></textarea>
            {errors.address && (
              <p className="text-red-500 text-xs mt-1">{errors.address}</p>
            )}
          </div>

          {/* Row 4: Tax Number & Payment Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Tax Number
              </label>
              <input
                type="text"
                name="taxNumber"
                value={formData.taxNumber}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${theme.borderSecondary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${theme.bgInput} ${theme.textPrimary}`}
                placeholder="Enter tax number"
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Payment Terms
              </label>
              <select
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${theme.borderSecondary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${theme.bgInput} ${theme.textPrimary}`}
              >
                <option value="Net 15 days">Net 15 days</option>
                <option value="Net 30 days">Net 30 days</option>
                <option value="Net 45 days">Net 45 days</option>
                <option value="Net 60 days">Net 60 days</option>
                <option value="Cash on Delivery">Cash on Delivery</option>
              </select>
            </div>
          </div>

          {/* Row 5: Active Supplier Toggle */}
          <div
            className={`flex items-center gap-3 p-4 ${theme.bgAccent} rounded-lg`}
          >
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#667eea]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#667eea] peer-checked:to-[#764ba2]"></div>
              <span className={`ml-3 text-sm font-medium ${theme.textPrimary}`}>
                Active Supplier
              </span>
            </label>
          </div>

          {/* Footer Buttons */}
          <div
            className={`flex justify-end gap-3 pt-4 border-t ${theme.borderPrimary}`}
          >
            <button
              type="button"
              onClick={handleClose}
              className={`px-6 py-2 border ${theme.borderSecondary} ${theme.textPrimary} rounded-lg ${theme.bgHover} transition`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg hover:opacity-90 transition shadow-lg"
            >
              Update Supplier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSupplierModal;
