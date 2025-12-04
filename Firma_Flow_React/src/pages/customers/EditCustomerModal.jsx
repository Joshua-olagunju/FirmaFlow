import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";

const EditCustomerModal = ({ isOpen, onClose, onSave, customer }) => {
  const { theme } = useTheme();
  const { currencySymbols, currency } = useSettings();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    customerType: "Individual",
    billingAddress: "",
    paymentTerms: "Cash on Delivery",
    creditLimit: "",
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        phone: customer.phone || "",
        email: customer.email || "",
        customerType: customer.customerType || "Individual",
        billingAddress: customer.address || customer.billingAddress || "",
        paymentTerms: customer.paymentTerms || "Cash on Delivery",
        creditLimit: customer.creditLimit || "",
        isActive: customer.status === "Active",
      });
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

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
    if (!formData.name.trim()) newErrors.name = "Customer name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.billingAddress.trim())
      newErrors.billingAddress = "Billing address is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      const success = await onSave({
        ...customer,
        ...formData,
        address: formData.billingAddress,
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
          <h2 className="text-2xl font-bold text-white">Edit Customer</h2>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Row 1: Name & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${
                  theme.bgInput
                } ${theme.textPrimary} ${
                  errors.name ? "border-red-500" : theme.borderSecondary
                }`}
                placeholder="Enter customer name"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

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
          </div>

          {/* Row 2: Email & Customer Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="customer@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Customer Type
              </label>
              <select
                name="customerType"
                value={formData.customerType}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${theme.borderSecondary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${theme.bgInput} ${theme.textPrimary}`}
              >
                <option value="Individual">Individual</option>
                <option value="Business">Business</option>
              </select>
            </div>
          </div>

          {/* Row 3: Billing Address */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
            >
              Billing Address <span className="text-red-500">*</span>
            </label>
            <textarea
              name="billingAddress"
              value={formData.billingAddress}
              onChange={handleChange}
              rows="3"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${
                theme.bgInput
              } ${theme.textPrimary} ${
                errors.billingAddress ? "border-red-500" : theme.borderSecondary
              }`}
              placeholder="Enter complete billing address"
            ></textarea>
            {errors.billingAddress && (
              <p className="text-red-500 text-xs mt-1">
                {errors.billingAddress}
              </p>
            )}
          </div>

          {/* Row 4: Payment Terms & Credit Limit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <option value="Cash on Delivery">Cash on Delivery</option>
                <option value="Net 7 days">Net 7 days</option>
                <option value="Net 15 days">Net 15 days</option>
                <option value="Net 30 days">Net 30 days</option>
                <option value="Net 60 days">Net 60 days</option>
              </select>
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Credit Limit ({currencySymbols[currency]})
              </label>
              <input
                type="number"
                name="creditLimit"
                value={formData.creditLimit}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${theme.borderSecondary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${theme.bgInput} ${theme.textPrimary}`}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Row 5: Active Customer Toggle */}
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
                Active Customer
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
              Update Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCustomerModal;
