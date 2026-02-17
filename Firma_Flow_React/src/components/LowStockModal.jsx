import { X, AlertTriangle } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useSettings } from "../contexts/SettingsContext";

const LowStockModal = ({ isOpen, onClose, lowStockItems }) => {
  const { theme } = useTheme();
  const { formatCurrency } = useSettings();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${theme.bgCard} rounded-xl ${theme.shadow} max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-bold text-white">Low Stock Items</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {lowStockItems && lowStockItems.length > 0 ? (
            <div className="space-y-4">
              <p className={`text-sm ${theme.textSecondary} mb-4`}>
                The following items are running low on stock and may need reordering:
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      className={`border-b-2 ${
                        theme.mode === "light"
                          ? "border-gray-200"
                          : "border-gray-700"
                      }`}
                    >
                      <th
                        className={`text-left py-3 px-4 text-sm font-semibold ${theme.textPrimary}`}
                      >
                        Product Name
                      </th>
                      <th
                        className={`text-left py-3 px-4 text-sm font-semibold ${theme.textPrimary}`}
                      >
                        SKU
                      </th>
                      <th
                        className={`text-center py-3 px-4 text-sm font-semibold ${theme.textPrimary}`}
                      >
                        Current Stock
                      </th>
                      <th
                        className={`text-center py-3 px-4 text-sm font-semibold ${theme.textPrimary}`}
                      >
                        Reorder Level
                      </th>
                      <th
                        className={`text-right py-3 px-4 text-sm font-semibold ${theme.textPrimary}`}
                      >
                        Unit Price
                      </th>
                      <th
                        className={`text-center py-3 px-4 text-sm font-semibold ${theme.textPrimary}`}
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map((item, index) => (
                      <tr
                        key={index}
                        className={`border-b ${
                          theme.mode === "light"
                            ? "border-gray-100 hover:bg-gray-50"
                            : "border-gray-800 hover:bg-gray-800"
                        } transition`}
                      >
                        <td
                          className={`py-3 px-4 ${theme.textPrimary} font-medium`}
                        >
                          {item.product_name || item.name}
                        </td>
                        <td className={`py-3 px-4 ${theme.textSecondary} text-sm`}>
                          {item.sku || "N/A"}
                        </td>
                        <td
                          className={`py-3 px-4 text-center ${
                            parseFloat(item.stock_quantity || 0) === 0
                              ? "text-red-600 font-bold"
                              : "text-orange-600 font-semibold"
                          }`}
                        >
                          {parseFloat(item.stock_quantity || 0).toFixed(2)}
                        </td>
                        <td
                          className={`py-3 px-4 text-center ${theme.textSecondary}`}
                        >
                          {parseFloat(item.reorder_level || 0).toFixed(2)}
                        </td>
                        <td
                          className={`py-3 px-4 text-right ${theme.textPrimary}`}
                        >
                          {formatCurrency(parseFloat(item.unit_price || item.selling_price || 0))}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {parseFloat(item.stock_quantity || 0) === 0 ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Out of Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Low Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="w-16 h-16 text-gray-300 mb-4" />
              <p className={`text-lg font-semibold ${theme.textPrimary} mb-2`}>
                No Low Stock Items
              </p>
              <p className={`text-sm ${theme.textSecondary} text-center`}>
                All products are adequately stocked
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`border-t ${theme.borderPrimary} p-4 flex justify-end gap-3`}>
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg ${theme.bgInput} ${theme.textPrimary} border ${theme.borderPrimary} hover:bg-gray-100 transition font-medium`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LowStockModal;
