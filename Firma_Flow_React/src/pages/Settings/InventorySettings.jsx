import { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import { Package, Info, Save, ShoppingCart, FileText } from "lucide-react";
import { buildApiUrl } from "../../config/api.config";

const InventorySettings = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [settings, setSettings] = useState({
    enableInventoryTracking: true,
    useGlobalThreshold: false,
    globalLowStockThreshold: 10,
    stockCostingMethod: "FIFO",
    allowNegativeStock: false,
    sendLowStockNotifications: true,
    defaultProductUnit: "Pieces",
  });

  useEffect(() => {
    fetchInventorySettings();
  }, []);

  const fetchInventorySettings = async () => {
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
        setSettings({
          enableInventoryTracking:
            data.data.enable_inventory_tracking !== undefined
              ? data.data.enable_inventory_tracking
              : true,
          useGlobalThreshold:
            data.data.use_global_threshold !== undefined
              ? data.data.use_global_threshold
              : false,
          globalLowStockThreshold: data.data.global_low_stock_threshold || 10,
          stockCostingMethod: data.data.stock_costing_method || "FIFO",
          allowNegativeStock:
            data.data.allow_negative_stock !== undefined
              ? data.data.allow_negative_stock
              : false,
          sendLowStockNotifications:
            data.data.send_low_stock_notifications !== undefined
              ? data.data.send_low_stock_notifications
              : true,
          defaultProductUnit: data.data.default_product_unit || "Pieces",
        });
      }
    } catch (error) {
      console.error("Error fetching inventory settings:", error);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSuccessMessage("");

    try {
      // Save each setting individually
      const settingsToSave = [
        {
          key: "enable_inventory_tracking",
          value: settings.enableInventoryTracking,
          type: "boolean",
        },
        {
          key: "use_global_threshold",
          value: settings.useGlobalThreshold,
          type: "boolean",
        },
        {
          key: "global_low_stock_threshold",
          value: settings.globalLowStockThreshold,
          type: "number",
        },
        {
          key: "stock_costing_method",
          value: settings.stockCostingMethod,
          type: "string",
        },
        {
          key: "allow_negative_stock",
          value: settings.allowNegativeStock,
          type: "boolean",
        },
        {
          key: "send_low_stock_notifications",
          value: settings.sendLowStockNotifications,
          type: "boolean",
        },
        {
          key: "default_product_unit",
          value: settings.defaultProductUnit,
          type: "string",
        },
      ];

      // Save all settings
      const savePromises = settingsToSave.map((setting) =>
        fetch(buildApiUrl("api/settings.php"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            action: "save_setting",
            key: setting.key,
            value: setting.value,
            type: setting.type,
          }),
        })
      );

      const responses = await Promise.all(savePromises);
      const allSuccessful = responses.every((response) => response.ok);

      if (allSuccessful) {
        setSuccessMessage("Inventory settings saved successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        alert("Failed to save some settings");
      }
    } catch (error) {
      console.error("Error saving inventory settings:", error);
      alert("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const costingMethods = [
    { value: "FIFO", label: "FIFO (First In, First Out)" },
    { value: "LIFO", label: "LIFO (Last In, First Out)" },
    { value: "Weighted Average", label: "Weighted Average" },
  ];

  const productUnits = ["Pieces", "Kilogram", "Liter", "Box", "Pack", "Meter"];

  return (
    <div
      className={`${theme.bgCard} ${theme.shadow} rounded-xl p-4 md:p-6 max-w-full`}
    >
      {/* Header */}
      <div className="mb-6">
        <h2
          className={`text-2xl font-bold ${theme.textPrimary} flex items-center gap-2`}
        >
          <Package size={24} />
          Inventory Settings
        </h2>
        <p className={`${theme.textSecondary} mt-1`}>
          Configure inventory tracking and stock management
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Inventory Status */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>
            Inventory Status
          </h3>
        </div>
        <div>
          <span
            className={`px-4 py-2 rounded-lg font-semibold ${
              settings.enableInventoryTracking
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-gray-100 text-gray-700 border border-gray-200"
            }`}
          >
            {settings.enableInventoryTracking ? "Active" : "Disabled"}
          </span>
        </div>
      </div>

      {/* Info Box */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-blue-800 text-sm leading-relaxed">
            Configure global low-stock behavior used by the Dashboard and
            alerts. You can still set per-product reorder levels on each
            product.
          </p>
        </div>
      </div>

      {/* Settings Form */}
      <div className="space-y-6">
        {/* Enable Inventory Tracking Toggle */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <label className={`block font-semibold ${theme.textPrimary} mb-1`}>
              Enable inventory tracking by default
            </label>
          </div>
          <button
            onClick={() =>
              setSettings((prev) => ({
                ...prev,
                enableInventoryTracking: !prev.enableInventoryTracking,
              }))
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.enableInventoryTracking ? "bg-green-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.enableInventoryTracking
                  ? "translate-x-6"
                  : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Use Global Threshold Toggle */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <label
                className={`block font-semibold ${theme.textPrimary} mb-1`}
              >
                Use global low-stock threshold across the app
              </label>
            </div>
            <button
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  useGlobalThreshold: !prev.useGlobalThreshold,
                }))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.useGlobalThreshold ? "bg-green-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.useGlobalThreshold
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <p className={`${theme.textSecondary} text-sm`}>
            When enabled, an item is considered low if its stock ≤
            max(per‑product reorder level, global threshold).
          </p>
        </div>

        {/* Global Low-Stock Threshold & Stock Costing Method */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Global Low-Stock Threshold */}
          <div>
            <label className={`block font-semibold ${theme.textPrimary} mb-2`}>
              Global Low-Stock Threshold
            </label>
            <input
              type="number"
              min="0"
              value={settings.globalLowStockThreshold}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  globalLowStockThreshold: parseInt(e.target.value) || 0,
                }))
              }
              className={`w-full px-4 py-2.5 rounded-lg border ${theme.borderSecondary} ${theme.bgInput} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-[#667eea]`}
            />
          </div>

          {/* Stock Costing Method */}
          <div>
            <label className={`block font-semibold ${theme.textPrimary} mb-2`}>
              Stock Costing Method
            </label>
            <select
              value={settings.stockCostingMethod}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  stockCostingMethod: e.target.value,
                }))
              }
              className={`w-full px-4 py-2.5 rounded-lg border ${theme.borderSecondary} ${theme.bgInput} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-[#667eea]`}
            >
              {costingMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Allow Negative Stock Toggle */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <label className={`block font-semibold ${theme.textPrimary} mb-1`}>
              Allow negative stock (overselling)
            </label>
            <p className={`${theme.textSecondary} text-sm`}>
              Uncheck to prevent sales when stock is zero
            </p>
          </div>
          <button
            onClick={() =>
              setSettings((prev) => ({
                ...prev,
                allowNegativeStock: !prev.allowNegativeStock,
              }))
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.allowNegativeStock ? "bg-green-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.allowNegativeStock ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Send Low Stock Notifications Toggle */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <label className={`block font-semibold ${theme.textPrimary} mb-1`}>
              Send low stock notifications
            </label>
          </div>
          <button
            onClick={() =>
              setSettings((prev) => ({
                ...prev,
                sendLowStockNotifications: !prev.sendLowStockNotifications,
              }))
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.sendLowStockNotifications
                ? "bg-green-600"
                : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.sendLowStockNotifications
                  ? "translate-x-6"
                  : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Default Product Unit */}
        <div>
          <label className={`block font-semibold ${theme.textPrimary} mb-2`}>
            Default Product Unit
          </label>
          <select
            value={settings.defaultProductUnit}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                defaultProductUnit: e.target.value,
              }))
            }
            className={`w-full px-4 py-2.5 rounded-lg border ${theme.borderSecondary} ${theme.bgInput} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-[#667eea]`}
          >
            {productUnits.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>

        {/* Save Button */}
        <div>
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg shadow-lg hover:opacity-90 transition disabled:opacity-50"
          >
            <Save size={18} />
            {isSaving ? "Saving..." : "Save Inventory Settings"}
          </button>
        </div>
      </div>

      {/* Related Pages Section */}
      <div
        className={`mt-8 p-6 border ${theme.borderSecondary} rounded-lg ${theme.bgAccent}`}
      >
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-2`}>
          Related Pages
        </h3>
        <p className={`${theme.textSecondary} text-sm mb-4`}>
          Manage your inventory across the system:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate("/inventory")}
            className={`flex items-center gap-3 px-6 py-4 ${theme.bgCard} ${theme.textPrimary} rounded-lg border ${theme.borderSecondary} ${theme.bgHover} transition font-medium`}
          >
            <Package size={20} className="text-[#667eea]" />
            <span>Inventory</span>
          </button>

          <button
            onClick={() => navigate("/purchases")}
            className={`flex items-center gap-3 px-6 py-4 ${theme.bgCard} ${theme.textPrimary} rounded-lg border ${theme.borderSecondary} ${theme.bgHover} transition font-medium`}
          >
            <ShoppingCart size={20} className="text-[#667eea]" />
            <span>Purchases</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventorySettings;
