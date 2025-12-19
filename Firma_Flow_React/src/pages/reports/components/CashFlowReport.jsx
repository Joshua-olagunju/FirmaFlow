import { motion } from "framer-motion";
import { useTheme } from "../../../contexts/ThemeContext";
import { useSettings } from "../../../contexts/SettingsContext";
import {
  TrendingDown,
  ArrowDownCircle,
  ArrowUpCircle,
  Activity,
} from "lucide-react";

const CashFlowReport = ({ data, startDate, endDate }) => {
  const { theme } = useTheme();
  const { formatCurrency, formatDate } = useSettings();

  console.log("Cash Flow Data:", data);

  // Extract data - API returns net values
  const operatingCashFlow = parseFloat(
    data?.net_operating_cash ||
      data?.operating_cash_flow ||
      data?.operating ||
      0
  );
  const investingCashFlow = parseFloat(
    data?.net_investing_cash || data?.investing_cash_flow || 0
  );
  const financingCashFlow = parseFloat(
    data?.net_financing_cash || data?.financing_cash_flow || 0
  );
  const netCashFlow = parseFloat(
    data?.net_change_in_cash ||
      operatingCashFlow + investingCashFlow + financingCashFlow
  );
  const beginningBalance = parseFloat(
    data?.opening_cash_balance || data?.beginning_balance || 0
  );
  const endingBalance = parseFloat(
    data?.closing_cash_balance || beginningBalance + netCashFlow
  );

  const operatingActivities =
    data?.operating_activities || data?.operating || [];
  const investingActivities =
    data?.investing_activities || data?.investing || [];
  const financingActivities =
    data?.financing_activities || data?.financing || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header Card */}
      <div
        className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow} border-l-4 border-orange-500`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`text-2xl font-bold ${theme.textPrimary}`}>
              Cash Flow Statement
            </h2>
            <p className={`${theme.textSecondary} text-sm mt-1`}>
              {formatDate(startDate)} - {formatDate(endDate)}
            </p>
          </div>
          <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
            <TrendingDown size={32} className="text-white" />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Operating Cash Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${theme.textSecondary} mb-1`}>Operating</p>
              <h3
                className={`text-2xl font-bold ${
                  operatingCashFlow >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(Math.abs(operatingCashFlow))}
              </h3>
            </div>
            <div
              className={`p-2 ${
                operatingCashFlow >= 0 ? "bg-green-100" : "bg-red-100"
              } rounded-lg`}
            >
              <Activity
                size={24}
                className={
                  operatingCashFlow >= 0 ? "text-green-600" : "text-red-600"
                }
              />
            </div>
          </div>
        </motion.div>

        {/* Investing Cash Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${theme.textSecondary} mb-1`}>Investing</p>
              <h3
                className={`text-2xl font-bold ${
                  investingCashFlow >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(Math.abs(investingCashFlow))}
              </h3>
            </div>
            <div
              className={`p-2 ${
                investingCashFlow >= 0 ? "bg-green-100" : "bg-red-100"
              } rounded-lg`}
            >
              <ArrowUpCircle
                size={24}
                className={
                  investingCashFlow >= 0 ? "text-green-600" : "text-red-600"
                }
              />
            </div>
          </div>
        </motion.div>

        {/* Financing Cash Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${theme.textSecondary} mb-1`}>Financing</p>
              <h3
                className={`text-2xl font-bold ${
                  financingCashFlow >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(Math.abs(financingCashFlow))}
              </h3>
            </div>
            <div
              className={`p-2 ${
                financingCashFlow >= 0 ? "bg-green-100" : "bg-red-100"
              } rounded-lg`}
            >
              <ArrowDownCircle
                size={24}
                className={
                  financingCashFlow >= 0 ? "text-green-600" : "text-red-600"
                }
              />
            </div>
          </div>
        </motion.div>

        {/* Net Cash Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${theme.textSecondary} mb-1`}>
                Net Change
              </p>
              <h3
                className={`text-2xl font-bold ${
                  netCashFlow >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(Math.abs(netCashFlow))}
              </h3>
            </div>
            <div
              className={`p-2 ${
                netCashFlow >= 0 ? "bg-green-100" : "bg-red-100"
              } rounded-lg`}
            >
              <TrendingDown
                size={24}
                className={netCashFlow >= 0 ? "text-green-600" : "text-red-600"}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Detailed Activities */}
      <div className="space-y-6">
        {/* Operating Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <h3 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>
            Operating Activities
          </h3>
          <div className="space-y-2">
            {operatingActivities.length > 0 ? (
              operatingActivities.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className={`flex justify-between items-center p-3 ${theme.bgAccent} rounded-lg`}
                >
                  <span className={`font-medium ${theme.textPrimary}`}>
                    {activity.description || activity.name}
                  </span>
                  <span
                    className={`font-bold ${
                      (activity.amount || 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(Math.abs(activity.amount || 0))}
                  </span>
                </motion.div>
              ))
            ) : (
              <p className={`text-center ${theme.textTertiary} py-4`}>
                No operating activities recorded
              </p>
            )}
            <div
              className={`flex justify-between items-center pt-3 border-t-2 ${theme.borderSecondary}`}
            >
              <span className={`font-bold ${theme.textPrimary}`}>
                Net Operating Cash Flow
              </span>
              <span
                className={`text-lg font-bold ${
                  operatingCashFlow >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(Math.abs(operatingCashFlow))}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Investing Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <h3 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>
            Investing Activities
          </h3>
          <div className="space-y-2">
            {investingActivities.length > 0 ? (
              investingActivities.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                  className={`flex justify-between items-center p-3 ${theme.bgAccent} rounded-lg`}
                >
                  <span className={`font-medium ${theme.textPrimary}`}>
                    {activity.description || activity.name}
                  </span>
                  <span
                    className={`font-bold ${
                      (activity.amount || 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(Math.abs(activity.amount || 0))}
                  </span>
                </motion.div>
              ))
            ) : (
              <p className={`text-center ${theme.textTertiary} py-4`}>
                No investing activities recorded
              </p>
            )}
            <div
              className={`flex justify-between items-center pt-3 border-t-2 ${theme.borderSecondary}`}
            >
              <span className={`font-bold ${theme.textPrimary}`}>
                Net Investing Cash Flow
              </span>
              <span
                className={`text-lg font-bold ${
                  investingCashFlow >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(Math.abs(investingCashFlow))}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Financing Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <h3 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>
            Financing Activities
          </h3>
          <div className="space-y-2">
            {financingActivities.length > 0 ? (
              financingActivities.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.05 }}
                  className={`flex justify-between items-center p-3 ${theme.bgAccent} rounded-lg`}
                >
                  <span className={`font-medium ${theme.textPrimary}`}>
                    {activity.description || activity.name}
                  </span>
                  <span
                    className={`font-bold ${
                      (activity.amount || 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(Math.abs(activity.amount || 0))}
                  </span>
                </motion.div>
              ))
            ) : (
              <p className={`text-center ${theme.textTertiary} py-4`}>
                No financing activities recorded
              </p>
            )}
            <div
              className={`flex justify-between items-center pt-3 border-t-2 ${theme.borderSecondary}`}
            >
              <span className={`font-bold ${theme.textPrimary}`}>
                Net Financing Cash Flow
              </span>
              <span
                className={`text-lg font-bold ${
                  financingCashFlow >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(Math.abs(financingCashFlow))}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Cash Position Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className={`${theme.bgCard} rounded-xl p-8 ${
          theme.shadow
        } bg-gradient-to-br ${
          netCashFlow >= 0
            ? "from-green-50 to-emerald-50"
            : "from-red-50 to-orange-50"
        }`}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className={`text-lg ${theme.textSecondary}`}>
              Beginning Cash Balance
            </span>
            <span className={`text-2xl font-bold ${theme.textPrimary}`}>
              {formatCurrency(beginningBalance)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-lg ${theme.textSecondary}`}>
              Net Cash Change
            </span>
            <span
              className={`text-2xl font-bold ${
                netCashFlow >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {netCashFlow >= 0 ? "+" : "-"}
              {formatCurrency(Math.abs(netCashFlow))}
            </span>
          </div>
          <div
            className={`flex justify-between items-center pt-4 border-t-2 ${theme.borderSecondary}`}
          >
            <span className={`text-xl font-bold ${theme.textPrimary}`}>
              Ending Cash Balance
            </span>
            <span
              className={`text-3xl font-bold ${
                endingBalance >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(Math.abs(endingBalance))}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CashFlowReport;
