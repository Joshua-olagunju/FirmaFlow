import { motion } from "framer-motion";
import { useTheme } from "../../../contexts/ThemeContext";
import { useSettings } from "../../../contexts/SettingsContext";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Award,
} from "lucide-react";

const ProfitLossReport = ({ data, startDate, endDate }) => {
  const { theme } = useTheme();
  const { formatCurrency, formatDate } = useSettings();

  // Extract data
  const totalIncome = parseFloat(data?.total_income || 0);
  const totalExpenses = parseFloat(data?.total_expenses || 0);
  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  const incomeAccounts = data?.income_accounts || [];
  const expenseAccounts = data?.expense_accounts || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header Card */}
      <div
        className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow} border-l-4 border-green-500`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`text-2xl font-bold ${theme.textPrimary}`}>
              Profit & Loss Statement
            </h2>
            <p className={`${theme.textSecondary} text-sm mt-1`}>
              {formatDate(startDate)} - {formatDate(endDate)}
            </p>
          </div>
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
            <TrendingUp size={32} className="text-white" />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${theme.textSecondary} mb-1`}>
                Total Income
              </p>
              <h3 className={`text-2xl font-bold text-green-600`}>
                {formatCurrency(totalIncome)}
              </h3>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp size={24} className="text-green-600" />
            </div>
          </div>
        </motion.div>

        {/* Total Expenses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${theme.textSecondary} mb-1`}>
                Total Expenses
              </p>
              <h3 className={`text-2xl font-bold text-red-600`}>
                {formatCurrency(totalExpenses)}
              </h3>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown size={24} className="text-red-600" />
            </div>
          </div>
        </motion.div>

        {/* Net Profit/Loss */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${theme.textSecondary} mb-1`}>
                Net {netProfit >= 0 ? "Profit" : "Loss"}
              </p>
              <h3
                className={`text-2xl font-bold ${
                  netProfit >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(Math.abs(netProfit))}
              </h3>
            </div>
            <div
              className={`p-2 ${
                netProfit >= 0 ? "bg-green-100" : "bg-red-100"
              } rounded-lg`}
            >
              {netProfit >= 0 ? (
                <Award size={24} className="text-green-600" />
              ) : (
                <Activity size={24} className="text-red-600" />
              )}
            </div>
          </div>
        </motion.div>

        {/* Profit Margin */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${theme.textSecondary} mb-1`}>
                Profit Margin
              </p>
              <h3
                className={`text-2xl font-bold ${
                  profitMargin >= 0 ? "text-blue-600" : "text-orange-600"
                }`}
              >
                {profitMargin.toFixed(2)}%
              </h3>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign size={24} className="text-blue-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <h3 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>
            Income Breakdown
          </h3>
          <div className="space-y-3">
            {incomeAccounts.length > 0 ? (
              incomeAccounts.map((account, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className={`flex justify-between items-center p-3 ${theme.bgAccent} rounded-lg`}
                >
                  <div>
                    <p className={`font-medium ${theme.textPrimary}`}>
                      {account.name || account.account_name}
                    </p>
                    <p className={`text-xs ${theme.textTertiary}`}>
                      {account.code || account.account_code}
                    </p>
                  </div>
                  <span className="text-green-600 font-bold">
                    {formatCurrency(account.amount || account.total || 0)}
                  </span>
                </motion.div>
              ))
            ) : (
              <p className={`text-center ${theme.textTertiary} py-4`}>
                No income recorded
              </p>
            )}
            <div
              className={`flex justify-between items-center pt-3 border-t-2 ${theme.borderSecondary}`}
            >
              <span className={`font-bold ${theme.textPrimary}`}>Total</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(totalIncome)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Expense Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <h3 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>
            Expense Breakdown
          </h3>
          <div className="space-y-3">
            {expenseAccounts.length > 0 ? (
              expenseAccounts.map((account, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className={`flex justify-between items-center p-3 ${theme.bgAccent} rounded-lg`}
                >
                  <div>
                    <p className={`font-medium ${theme.textPrimary}`}>
                      {account.name || account.account_name}
                    </p>
                    <p className={`text-xs ${theme.textTertiary}`}>
                      {account.code || account.account_code}
                    </p>
                  </div>
                  <span className="text-red-600 font-bold">
                    {formatCurrency(account.amount || account.total || 0)}
                  </span>
                </motion.div>
              ))
            ) : (
              <p className={`text-center ${theme.textTertiary} py-4`}>
                No expenses recorded
              </p>
            )}
            <div
              className={`flex justify-between items-center pt-3 border-t-2 ${theme.borderSecondary}`}
            >
              <span className={`font-bold ${theme.textPrimary}`}>Total</span>
              <span className="text-lg font-bold text-red-600">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Net Result Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className={`${theme.bgCard} rounded-xl p-8 ${
          theme.shadow
        } bg-gradient-to-br ${
          netProfit >= 0
            ? "from-green-50 to-emerald-50"
            : "from-red-50 to-orange-50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-lg ${theme.textSecondary} mb-2`}>
              Net {netProfit >= 0 ? "Profit" : "Loss"} for Period
            </p>
            <h2
              className={`text-4xl font-bold ${
                netProfit >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(Math.abs(netProfit))}
            </h2>
            <p className={`text-sm ${theme.textTertiary} mt-2`}>
              Profit Margin: {profitMargin.toFixed(2)}%
            </p>
          </div>
          <div
            className={`p-6 rounded-full ${
              netProfit >= 0 ? "bg-green-100" : "bg-red-100"
            }`}
          >
            {netProfit >= 0 ? (
              <TrendingUp size={48} className="text-green-600" />
            ) : (
              <TrendingDown size={48} className="text-red-600" />
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProfitLossReport;
