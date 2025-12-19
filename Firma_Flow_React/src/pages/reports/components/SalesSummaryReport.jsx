import { motion } from "framer-motion";
import { useTheme } from "../../../contexts/ThemeContext";
import { useSettings } from "../../../contexts/SettingsContext";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Users,
  BarChart3,
} from "lucide-react";

const SalesSummaryReport = ({ data, startDate, endDate }) => {
  const { theme } = useTheme();
  const { formatCurrency, formatDate } = useSettings();

  console.log("Sales Summary Data:", data);

  // Extract data from summary object
  const summary = data?.summary || {};
  const totalSales = parseFloat(
    summary?.total_sales_amount || data?.total_sales || 0
  );
  const totalTransactions = parseInt(
    summary?.total_invoices ||
      data?.total_transactions ||
      data?.transaction_count ||
      0
  );
  const averageTransactionValue =
    parseFloat(summary?.average_sale_value || 0) ||
    (totalTransactions > 0 ? totalSales / totalTransactions : 0);
  const totalCustomers = parseInt(
    summary?.total_customers_in_system ||
      summary?.customers_who_bought_in_period ||
      data?.total_customers ||
      data?.unique_customers ||
      0
  );

  const salesByProduct =
    data?.products_sold ||
    data?.sales_by_product ||
    data?.products ||
    data?.top_products ||
    [];
  const salesByCustomer =
    data?.sales_by_customer || data?.customers || data?.top_customers || [];
  const salesTrend =
    data?.sales_trend || data?.daily_sales || data?.trend || [];
  const topProducts = Array.isArray(salesByProduct)
    ? salesByProduct.slice(0, 5)
    : [];
  const topCustomers = Array.isArray(salesByCustomer)
    ? salesByCustomer.slice(0, 5)
    : [];

  // Calculate max values for meaningful progress bars
  const maxProductSales =
    topProducts.length > 0
      ? Math.max(
          ...topProducts.map((p) => parseFloat(p.total_sales || p.revenue || 0))
        )
      : 1;
  const maxCustomerSales =
    topCustomers.length > 0
      ? Math.max(
          ...topCustomers.map((c) =>
            parseFloat(c.total_spent || c.total_sales || c.revenue || 0)
          )
        )
      : 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header Card */}
      <div
        className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow} border-l-4 border-cyan-500`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`text-2xl font-bold ${theme.textPrimary}`}>
              Sales Summary Report
            </h2>
            <p className={`${theme.textSecondary} text-sm mt-1`}>
              {formatDate(startDate)} - {formatDate(endDate)}
            </p>
          </div>
          <div className="p-3 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl">
            <DollarSign size={32} className="text-white" />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${theme.textSecondary} mb-1`}>
                Total Sales
              </p>
              <h3 className={`text-2xl font-bold text-green-600`}>
                {formatCurrency(totalSales)}
              </h3>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign size={24} className="text-green-600" />
            </div>
          </div>
        </motion.div>

        {/* Total Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${theme.textSecondary} mb-1`}>
                Transactions
              </p>
              <h3 className={`text-2xl font-bold text-blue-600`}>
                {totalTransactions}
              </h3>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart size={24} className="text-blue-600" />
            </div>
          </div>
        </motion.div>

        {/* Average Transaction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${theme.textSecondary} mb-1`}>
                Avg. Value
              </p>
              <h3 className={`text-2xl font-bold text-purple-600`}>
                {formatCurrency(averageTransactionValue)}
              </h3>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp size={24} className="text-purple-600" />
            </div>
          </div>
        </motion.div>

        {/* Total Customers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${theme.textSecondary} mb-1`}>Customers</p>
              <h3 className={`text-2xl font-bold text-cyan-600`}>
                {totalCustomers}
              </h3>
            </div>
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Users size={24} className="text-cyan-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top Products & Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg">
              <BarChart3 size={24} className="text-white" />
            </div>
            <h3 className={`text-xl font-bold ${theme.textPrimary}`}>
              Top Products
            </h3>
          </div>
          <div className="space-y-3">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
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
                        {product.product_name || product.name}
                      </p>
                      <p className={`text-xs ${theme.textTertiary}`}>
                        {product.total_quantity ||
                          product.quantity ||
                          product.units_sold ||
                          0}{" "}
                        units sold
                      </p>
                    </div>
                    <span className="text-green-600 font-bold">
                      {formatCurrency(
                        product.total_sales || product.revenue || 0
                      )}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(
                          ((product.total_sales || product.revenue || 0) /
                            maxProductSales) *
                            100,
                          100
                        )}%`,
                      }}
                      transition={{ delay: 0.7 + index * 0.05, duration: 0.5 }}
                      className="bg-gradient-to-r from-cyan-500 to-teal-600 h-2 rounded-full"
                    />
                  </div>
                </motion.div>
              ))
            ) : (
              <p className={`text-center ${theme.textTertiary} py-8`}>
                No product sales data available
              </p>
            )}
          </div>
        </motion.div>

        {/* Top Customers */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
              <Users size={24} className="text-white" />
            </div>
            <h3 className={`text-xl font-bold ${theme.textPrimary}`}>
              Top Customers
            </h3>
          </div>
          <div className="space-y-3">
            {topCustomers.length > 0 ? (
              topCustomers.map((customer, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className={`p-4 ${theme.bgAccent} rounded-lg`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className={`font-semibold ${theme.textPrimary}`}>
                        {customer.customer_name || customer.name}
                      </p>
                      <p className={`text-xs ${theme.textTertiary}`}>
                        {customer.transaction_count || customer.orders || 0}{" "}
                        transactions
                      </p>
                    </div>
                    <span className="text-purple-600 font-bold">
                      {formatCurrency(
                        customer.total_spent ||
                          customer.total_sales ||
                          customer.revenue ||
                          0
                      )}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(
                          ((customer.total_spent ||
                            customer.total_sales ||
                            customer.revenue ||
                            0) /
                            maxCustomerSales) *
                            100,
                          100
                        )}%`,
                      }}
                      transition={{ delay: 0.7 + index * 0.05, duration: 0.5 }}
                      className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full"
                    />
                  </div>
                </motion.div>
              ))
            ) : (
              <p className={`text-center ${theme.textTertiary} py-8`}>
                No customer sales data available
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Sales Trend */}
      {salesTrend.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <h3 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>
            Sales Trend
          </h3>
          <div className="space-y-2">
            {salesTrend.slice(0, 10).map((day, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.03 }}
                className={`flex justify-between items-center p-3 ${theme.bgAccent} rounded-lg`}
              >
                <span className={`font-medium ${theme.textPrimary}`}>
                  {formatDate(day.date || day.day)}
                </span>
                <div className="flex items-center gap-4">
                  <span className={`text-sm ${theme.textTertiary}`}>
                    {day.transaction_count || day.count || 0} transactions
                  </span>
                  <span className="text-green-600 font-bold">
                    {formatCurrency(day.total_sales || day.amount || 0)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Performance Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className={`${theme.bgCard} rounded-xl p-8 ${theme.shadow} bg-gradient-to-br from-cyan-50 to-teal-50`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <p className={`text-sm ${theme.textSecondary} mb-2`}>
              Total Revenue
            </p>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(totalSales)}
            </p>
          </div>
          <div>
            <p className={`text-sm ${theme.textSecondary} mb-2`}>
              Average Order Value
            </p>
            <p className="text-3xl font-bold text-purple-600">
              {formatCurrency(averageTransactionValue)}
            </p>
          </div>
          <div>
            <p className={`text-sm ${theme.textSecondary} mb-2`}>
              Revenue per Customer
            </p>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(
                totalCustomers > 0 ? totalSales / totalCustomers : 0
              )}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SalesSummaryReport;
