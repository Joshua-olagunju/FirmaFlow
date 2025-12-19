import { motion } from "framer-motion";
import { useTheme } from "../../../contexts/ThemeContext";
import { useSettings } from "../../../contexts/SettingsContext";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Archive,
  BarChart,
} from "lucide-react";

const InventorySummaryReport = ({ data }) => {
  const { theme } = useTheme();
  const { formatCurrency } = useSettings();

  console.log("Inventory Data:", data);

  // Extract data
  const totalValue = parseFloat(data?.total_inventory_value || 0);
  const totalItems = parseInt(data?.total_items || data?.item_count || 0);
  const lowStockCount = parseInt(data?.low_stock_count || 0);
  const outOfStockCount = parseInt(data?.out_of_stock_count || 0);

  const inventoryItems =
    data?.inventory || data?.inventory_items || data?.items || [];

  // Filter for low stock items (quantity > 0 AND below reorder level)
  const lowStockItems = inventoryItems.filter((item) => {
    const qty = parseInt(item.stock_quantity || item.quantity || 0);
    const reorder = parseInt(item.reorder_level || item.min_stock || 5);
    const status = item.status?.toLowerCase();
    return qty > 0 && (qty <= reorder || status === "low stock");
  });

  // Filter for out of stock items (quantity = 0)
  const outOfStockItems = inventoryItems.filter((item) => {
    const qty = parseInt(item.stock_quantity || item.quantity || 0);
    const status = item.status?.toLowerCase();
    return qty === 0 || status === "out of stock";
  });
  const highValueItems = [...inventoryItems]
    .sort((a, b) => {
      const valueA =
        parseFloat(a.total_value || a.value || 0) ||
        parseFloat(a.quantity || 0) * parseFloat(a.price || a.unit_price || 0);
      const valueB =
        parseFloat(b.total_value || b.value || 0) ||
        parseFloat(b.quantity || 0) * parseFloat(b.price || b.unit_price || 0);
      return valueB - valueA;
    })
    .slice(0, 10);

  // Calculate average item value
  const averageItemValue = totalItems > 0 ? totalValue / totalItems : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header Card */}
      <div
        className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow} border-l-4 border-amber-500`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`text-2xl font-bold ${theme.textPrimary}`}>
              Inventory Summary Report
            </h2>
            <p className={`${theme.textSecondary} text-sm mt-1`}>
              Current inventory status and valuation
            </p>
          </div>
          <div className="p-3 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl">
            <Package size={32} className="text-white" />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Value */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${theme.textSecondary} mb-1`}>
                Total Value
              </p>
              <h3 className={`text-2xl font-bold text-green-600`}>
                {formatCurrency(totalValue)}
              </h3>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp size={24} className="text-green-600" />
            </div>
          </div>
        </motion.div>

        {/* Total Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${theme.textSecondary} mb-1`}>
                Total Items
              </p>
              <h3 className={`text-2xl font-bold text-blue-600`}>
                {totalItems}
              </h3>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package size={24} className="text-blue-600" />
            </div>
          </div>
        </motion.div>

        {/* Low Stock */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${theme.textSecondary} mb-1`}>Low Stock</p>
              <h3 className={`text-2xl font-bold text-orange-600`}>
                {lowStockCount || lowStockItems.length}
              </h3>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle size={24} className="text-orange-600" />
            </div>
          </div>
        </motion.div>

        {/* Out of Stock */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${theme.textSecondary} mb-1`}>
                Out of Stock
              </p>
              <h3 className={`text-2xl font-bold text-red-600`}>
                {outOfStockItems.length || outOfStockCount}
              </h3>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <Archive size={24} className="text-red-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* High Value Items & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Value Items */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
              <BarChart size={24} className="text-white" />
            </div>
            <h3 className={`text-xl font-bold ${theme.textPrimary}`}>
              High Value Items
            </h3>
          </div>
          <div className="space-y-3">
            {highValueItems.length > 0 ? (
              highValueItems.map((item, index) => {
                const itemValue =
                  parseFloat(
                    item.inventory_value || item.total_value || item.value || 0
                  ) ||
                  parseFloat(item.stock_quantity || item.quantity || 0) *
                    parseFloat(
                      item.cost_price || item.price || item.unit_price || 0
                    );
                const quantity = parseInt(
                  item.stock_quantity || item.quantity || 0
                );

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    className={`p-4 ${theme.bgAccent} rounded-lg`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className={`font-semibold ${theme.textPrimary}`}>
                          {item.name || item.product_name || item.item_name}
                        </p>
                        <p className={`text-xs ${theme.textTertiary}`}>
                          {quantity} units in stock
                        </p>
                      </div>
                      <span className="text-green-600 font-bold">
                        {formatCurrency(itemValue)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(
                            (itemValue / totalValue) * 100,
                            100
                          )}%`,
                        }}
                        transition={{
                          delay: 0.7 + index * 0.05,
                          duration: 0.5,
                        }}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full"
                      />
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <p className={`text-center ${theme.textTertiary} py-8`}>
                No inventory data available
              </p>
            )}
          </div>
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
              <AlertTriangle size={24} className="text-white" />
            </div>
            <h3 className={`text-xl font-bold ${theme.textPrimary}`}>
              Low Stock Alerts
            </h3>
          </div>
          <div className="space-y-3">
            {lowStockItems.length > 0 ? (
              lowStockItems.slice(0, 10).map((item, index) => {
                const quantity = parseInt(
                  item.stock_quantity || item.quantity || 0
                );
                const reorderLevel = parseInt(
                  item.reorder_level || item.min_stock || 5
                );
                const status =
                  quantity === 0
                    ? "Out of Stock"
                    : quantity <= reorderLevel / 2
                    ? "Critical"
                    : "Low";

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    className={`p-4 ${theme.bgAccent} rounded-lg border-l-4 ${
                      quantity === 0
                        ? "border-red-500"
                        : quantity <= reorderLevel / 2
                        ? "border-orange-500"
                        : "border-yellow-500"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className={`font-semibold ${theme.textPrimary}`}>
                          {item.name || item.product_name || item.item_name}
                        </p>
                        <p className={`text-xs ${theme.textTertiary} mt-1`}>
                          Current: {quantity} | Reorder: {reorderLevel}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          quantity === 0
                            ? "bg-red-100 text-red-700"
                            : quantity <= reorderLevel / 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <p className={`text-center ${theme.textTertiary} py-8`}>
                No low stock items
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Summary Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className={`${theme.bgCard} rounded-xl p-8 ${theme.shadow} border ${theme.border}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <p className={`text-sm ${theme.textSecondary} mb-2`}>
              Total Inventory Value
            </p>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(totalValue)}
            </p>
          </div>
          <div>
            <p className={`text-sm ${theme.textSecondary} mb-2`}>
              Average Item Value
            </p>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(averageItemValue)}
            </p>
          </div>
          <div>
            <p className={`text-sm ${theme.textSecondary} mb-2`}>
              Items Needing Attention
            </p>
            <p className="text-3xl font-bold text-orange-600">
              {lowStockItems.length + outOfStockItems.length}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default InventorySummaryReport;
