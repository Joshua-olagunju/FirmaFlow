import { motion } from "framer-motion";
import { useTheme } from "../../../contexts/ThemeContext";
import { useSettings } from "../../../contexts/SettingsContext";
import { PieChart, CheckCircle, AlertCircle } from "lucide-react";

const TrialBalanceReport = ({ data, endDate }) => {
  const { theme } = useTheme();
  const { formatCurrency, formatDate } = useSettings();

  // Extract data
  const accounts = data?.accounts || data?.trial_balance || [];
  const totalDebits = parseFloat(data?.total_debits || 0);
  const totalCredits = parseFloat(data?.total_credits || 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  // Group accounts by type
  const groupedAccounts = {
    asset: accounts.filter((a) => a.type === "asset"),
    liability: accounts.filter((a) => a.type === "liability"),
    equity: accounts.filter((a) => a.type === "equity"),
    income: accounts.filter((a) => a.type === "income"),
    expense: accounts.filter((a) => a.type === "expense"),
  };

  const typeLabels = {
    asset: "Assets",
    liability: "Liabilities",
    equity: "Equity",
    income: "Income",
    expense: "Expenses",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header Card */}
      <div
        className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow} border-l-4 border-purple-500`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`text-2xl font-bold ${theme.textPrimary}`}>
              Trial Balance
            </h2>
            <p className={`${theme.textSecondary} text-sm mt-1`}>
              As of {formatDate(endDate)}
            </p>
          </div>
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
            <PieChart size={32} className="text-white" />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Debits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${theme.textSecondary} mb-1`}>
                Total Debits
              </p>
              <h3 className={`text-2xl font-bold text-blue-600`}>
                {formatCurrency(totalDebits)}
              </h3>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <PieChart size={24} className="text-blue-600" />
            </div>
          </div>
        </motion.div>

        {/* Total Credits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${theme.textSecondary} mb-1`}>
                Total Credits
              </p>
              <h3 className={`text-2xl font-bold text-purple-600`}>
                {formatCurrency(totalCredits)}
              </h3>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <PieChart size={24} className="text-purple-600" />
            </div>
          </div>
        </motion.div>

        {/* Balance Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${theme.textSecondary} mb-1`}>Status</p>
              <h3
                className={`text-2xl font-bold ${
                  isBalanced ? "text-green-600" : "text-red-600"
                }`}
              >
                {isBalanced ? "Balanced" : "Unbalanced"}
              </h3>
            </div>
            <div
              className={`p-2 ${
                isBalanced ? "bg-green-100" : "bg-red-100"
              } rounded-lg`}
            >
              {isBalanced ? (
                <CheckCircle size={24} className="text-green-600" />
              ) : (
                <AlertCircle size={24} className="text-red-600" />
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Trial Balance Table by Type */}
      {Object.entries(groupedAccounts).map(
        ([type, typeAccounts], typeIndex) => {
          if (typeAccounts.length === 0) return null;

          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + typeIndex * 0.1 }}
              className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
            >
              <h3 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>
                {typeLabels[type]}
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      className={`${theme.bgAccent} border-b-2 ${theme.borderSecondary}`}
                    >
                      <th
                        className={`text-left p-3 ${theme.textSecondary} font-semibold text-sm`}
                      >
                        Account Code
                      </th>
                      <th
                        className={`text-left p-3 ${theme.textSecondary} font-semibold text-sm`}
                      >
                        Account Name
                      </th>
                      <th
                        className={`text-right p-3 ${theme.textSecondary} font-semibold text-sm`}
                      >
                        Debit
                      </th>
                      <th
                        className={`text-right p-3 ${theme.textSecondary} font-semibold text-sm`}
                      >
                        Credit
                      </th>
                      <th
                        className={`text-right p-3 ${theme.textSecondary} font-semibold text-sm`}
                      >
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {typeAccounts.map((account, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.5 + typeIndex * 0.1 + index * 0.03,
                        }}
                        className={`border-b ${theme.borderSecondary} hover:${theme.bgAccent} transition-colors`}
                      >
                        <td className={`p-3 ${theme.textTertiary} text-sm`}>
                          {account.code || account.account_code}
                        </td>
                        <td className={`p-3 ${theme.textPrimary} font-medium`}>
                          {account.name || account.account_name}
                        </td>
                        <td className="p-3 text-right text-blue-600 font-medium">
                          {formatCurrency(
                            account.total_debits || account.debit || 0
                          )}
                        </td>
                        <td className="p-3 text-right text-purple-600 font-medium">
                          {formatCurrency(
                            account.total_credits || account.credit || 0
                          )}
                        </td>
                        <td
                          className={`p-3 text-right font-bold ${
                            (account.balance || 0) >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(Math.abs(account.balance || 0))}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          );
        }
      )}

      {/* Totals Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className={`${theme.bgCard} rounded-xl p-8 ${theme.shadow} ${
          isBalanced
            ? "bg-gradient-to-br from-green-50 to-emerald-50"
            : "bg-gradient-to-br from-red-50 to-orange-50"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className={`text-sm ${theme.textSecondary} mb-2`}>
              Total Debits
            </p>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(totalDebits)}
            </p>
          </div>
          <div className="text-center">
            <p className={`text-sm ${theme.textSecondary} mb-2`}>
              Total Credits
            </p>
            <p className="text-3xl font-bold text-purple-600">
              {formatCurrency(totalCredits)}
            </p>
          </div>
          <div className="text-center">
            <p className={`text-sm ${theme.textSecondary} mb-2`}>Difference</p>
            <p
              className={`text-3xl font-bold ${
                isBalanced ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(Math.abs(totalDebits - totalCredits))}
            </p>
          </div>
        </div>
        <div className="text-center mt-6">
          <p
            className={`text-lg font-semibold ${
              isBalanced ? "text-green-600" : "text-red-600"
            }`}
          >
            {isBalanced
              ? "✓ Trial Balance is Balanced"
              : "⚠ Trial Balance is NOT Balanced"}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TrialBalanceReport;
