import { useState } from "react";
import { X, Info } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";

const AddProductModal = ({ isOpen, onClose, onSave }) => {
  const { theme } = useTheme();
  const { currencySymbols, currency } = useSettings();
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    unit: "Pieces",
    costPrice: "",
    sellingPrice: "",
    trackInventory: true,
    stockQuantity: "",
    reorderLevel: "",
    isActive: true,
  });

  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  // Auto-generate SKU in format: TOP-QOM (3 chars - 3 chars from name)
  const generateSKU = (name) => {
    if (!name) return "";

    // Remove special chars and split into words
    const words = name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .split(" ")
      .filter((w) => w.length > 0);

    if (words.length === 0) return "";

    // Get first 3 characters from first word
    const firstPart = words[0].substring(0, 3).padEnd(3, "X");

    // Get first 3 characters from second word (or use part of first word)
    let secondPart;
    if (words.length > 1) {
      secondPart = words[1].substring(0, 3).padEnd(3, "X");
    } else {
      // Use remaining chars from first word or repeat
      secondPart = words[0].substring(3, 6).padEnd(3, words[0].charAt(0));
    }

    return `${firstPart}-${secondPart}`;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      // Auto-generate SKU when name changes
      if (name === "name") {
        newData.sku = generateSKU(value);
      }

      return newData;
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Product name is required";
    // SKU is optional - backend will accept it if provided
    if (!formData.costPrice || parseFloat(formData.costPrice) <= 0)
      newErrors.costPrice = "Valid cost price is required";
    if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0)
      newErrors.sellingPrice = "Valid selling price is required";

    if (formData.trackInventory) {
      // Allow 0 stock - only check if it's a valid number
      if (formData.stockQuantity === "" || parseInt(formData.stockQuantity) < 0)
        newErrors.stockQuantity = "Stock quantity is required (0 or more)";
      if (formData.reorderLevel === "" || parseInt(formData.reorderLevel) < 0)
        newErrors.reorderLevel = "Reorder level is required (0 or more)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      const success = await onSave({
        ...formData,
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        stockQuantity: formData.trackInventory
          ? parseInt(formData.stockQuantity)
          : 0,
        reorderLevel: formData.trackInventory
          ? parseInt(formData.reorderLevel)
          : 0,
      });
      if (success) {
        handleClose();
      }
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      sku: "",
      description: "",
      unit: "Pieces",
      costPrice: "",
      sellingPrice: "",
      trackInventory: true,
      stockQuantity: "",
      reorderLevel: "",
      isActive: true,
    });
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
          <h2 className="text-2xl font-bold text-white">Add Product</h2>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Row 1: Product Name & SKU */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Product Name <span className="text-red-500">*</span>
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
                placeholder="Enter product name"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                SKU <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${
                  theme.bgInput
                } ${theme.textPrimary} ${
                  errors.sku ? "border-red-500" : theme.borderSecondary
                }`}
                placeholder="Enter SKU (optional)"
              />
              {errors.sku && (
                <p className="text-red-500 text-xs mt-1">{errors.sku}</p>
              )}
            </div>
          </div>

          {/* Row 2: Description */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
            >
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${theme.bgInput} ${theme.textPrimary} ${theme.borderSecondary}`}
              placeholder="Enter product description"
            ></textarea>
          </div>

          {/* Row 3: Unit, Cost Price & Selling Price */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Unit
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${theme.bgInput} ${theme.textPrimary} ${theme.borderSecondary}`}
              >
                <option value="Pieces">Pieces</option>
                <option value="Kilograms">Kilograms</option>
                <option value="Pounds">Pounds</option>
                <option value="Liters">Liters</option>
                <option value="Meters">Meters</option>
                <option value="Boxes">Boxes</option>
                <option value="Cartons">Cartons</option>
              </select>
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Cost Price ({currencySymbols[currency]}){" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="costPrice"
                value={formData.costPrice}
                onChange={handleChange}
                step="0.01"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${
                  theme.bgInput
                } ${theme.textPrimary} ${
                  errors.costPrice ? "border-red-500" : theme.borderSecondary
                }`}
                placeholder="0.00"
              />
              {errors.costPrice && (
                <p className="text-red-500 text-xs mt-1">{errors.costPrice}</p>
              )}
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Selling Price ({currencySymbols[currency]}){" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleChange}
                step="0.01"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${
                  theme.bgInput
                } ${theme.textPrimary} ${
                  errors.sellingPrice ? "border-red-500" : theme.borderSecondary
                }`}
                placeholder="0.00"
              />
              {errors.sellingPrice && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.sellingPrice}
                </p>
              )}
            </div>
          </div>

          {/* Row 4: Track Inventory, Stock Quantity & Reorder Level */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`flex items-center gap-3 p-4 ${theme.bgAccent} rounded-lg`}
            >
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="trackInventory"
                  checked={formData.trackInventory}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div
                  className={`relative w-11 h-6 ${
                    theme.mode === "light" ? "bg-slate-300" : "bg-slate-600"
                  } peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#667eea]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#667eea] peer-checked:to-[#764ba2]`}
                ></div>
                <span
                  className={`ml-3 text-sm font-medium ${theme.textPrimary}`}
                >
                  Track Inventory
                </span>
              </label>
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Stock Quantity{" "}
                {formData.trackInventory && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <input
                type="number"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleChange}
                disabled={!formData.trackInventory}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${
                  theme.bgInput
                } ${theme.textPrimary} ${
                  errors.stockQuantity
                    ? "border-red-500"
                    : theme.borderSecondary
                } ${
                  !formData.trackInventory
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                placeholder="0"
              />
              {errors.stockQuantity && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.stockQuantity}
                </p>
              )}
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Reorder Level{" "}
                {formData.trackInventory && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <input
                type="number"
                name="reorderLevel"
                value={formData.reorderLevel}
                onChange={handleChange}
                disabled={!formData.trackInventory}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${
                  theme.bgInput
                } ${theme.textPrimary} ${
                  errors.reorderLevel ? "border-red-500" : theme.borderSecondary
                } ${
                  !formData.trackInventory
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                placeholder="0"
              />
              {errors.reorderLevel && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.reorderLevel}
                </p>
              )}
            </div>
          </div>

          {/* Information Box */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Info size={20} className="text-green-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-green-800 mb-2">
                  🎯 Smart Defaults: Automatic Inventory Accounting
                </p>
                <p className="text-sm text-green-700 leading-relaxed">
                  When you create a product with initial stock quantity {">"} 0,
                  opening balance journal entries are created automatically:
                </p>
                <ul className="text-sm text-green-700 mt-2 space-y-1 ml-4">
                  <li>• Dr. Inventory Account = Stock Quantity × Cost Price</li>
                  <li>• Cr. Retained Earnings = Stock Quantity × Cost Price</li>
                </ul>
                <p className="text-sm text-green-700 mt-2">
                  No account selection required - accounts are resolved
                  automatically!
                </p>
              </div>
            </div>
          </div>

          {/* Row 5: Active Product Toggle */}
          <div
            className={`flex items-center gap-3 p-4 ${theme.bgAccent} rounded-lg`}
          >
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div
                className={`relative w-11 h-6 ${
                  theme.mode === "light" ? "bg-slate-300" : "bg-slate-600"
                } peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#667eea]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#667eea] peer-checked:to-[#764ba2]`}
              ></div>
              <span className={`ml-3 text-sm font-medium ${theme.textPrimary}`}>
                Active Product
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
              className="px-6 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg hover:shadow-lg transition"
            >
              Add Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
