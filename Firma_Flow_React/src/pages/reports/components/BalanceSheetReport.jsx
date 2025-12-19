import { motion } from "framer-motion";
import { useTheme } from "../../../contexts/ThemeContext";
import { useSettings } from "../../../contexts/SettingsContext";
import { Scale, TrendingUp, Shield, Briefcase } from "lucide-react";

const BalanceSheetReport = ({ data, endDate }) => {
  const { theme } = useTheme();
  const { formatCurrency, formatDate } = useSettings();

  // Extract data
  const totalAssets = parseFloat(data?.total_assets || 0);
  const totalLiabilities = parseFloat(data?.total_liabilities || 0);
  const totalEquity = parseFloat(data?.total_equity || 0);
  const netWorth = totalAssets - totalLiabilities;

  const assets = data?.assets || [];
  const liabilities = data?.liabilities || [];
  const equity = data?.equity || [];

  // Group assets by type
  const currentAssets = assets.filter((a) => a.is_current || a.current);
  const nonCurrentAssets = assets.filter((a) => !a.is_current && !a.current);

  // Group liabilities by type
  const currentLiabilities = liabilities.filter(
    (l) => l.is_current || l.current
  );
  const nonCurrentLiabilities = liabilities.filter(
    (l) => !l.is_current && !l.current
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header Card */}
      <div
        className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow} border-l-4 border-blue-500`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`text-2xl font-bold ${theme.textPrimary}`}>
              Balance Sheet
            </h2>
            <p className={`${theme.textSecondary} text-sm mt-1`}>
              As of {formatDate(endDate)}
            </p>
          </div>
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
            <Scale size={32} className="text-white" />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${theme.textSecondary} mb-1`}>
                Total Assets
              </p>
              <h3 className={`text-2xl font-bold text-green-600`}>
                {formatCurrency(totalAssets)}
              </h3>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp size={24} className="text-green-600" />
            </div>
          </div>
        </motion.div>

        {/* Total Liabilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${theme.textSecondary} mb-1`}>
                Total Liabilities
              </p>
              <h3 className={`text-2xl font-bold text-red-600`}>
                {formatCurrency(totalLiabilities)}
              </h3>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield size={24} className="text-red-600" />
            </div>
          </div>
        </motion.div>

        {/* Total Equity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${theme.textSecondary} mb-1`}>
                Total Equity
              </p>
              <h3 className={`text-2xl font-bold text-blue-600`}>
                {formatCurrency(totalEquity)}
              </h3>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase size={24} className="text-blue-600" />
            </div>
          </div>
        </motion.div>

        {/* Net Worth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${theme.textSecondary} mb-1`}>Net Worth</p>
              <h3
                className={`text-2xl font-bold ${
                  netWorth >= 0 ? "text-purple-600" : "text-orange-600"
                }`}
              >
                {formatCurrency(Math.abs(netWorth))}
              </h3>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Scale size={24} className="text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
        >
          <h3 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>
            Assets
          </h3>

          {/* Current Assets */}
          {currentAssets.length > 0 && (
            <div className="mb-6">
              <h4
                className={`text-sm font-semibold ${theme.textSecondary} mb-3`}
              >
                Current Assets
              </h4>
              <div className="space-y-2">
                {currentAssets.map((asset, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    className={`flex justify-between items-center p-3 ${theme.bgAccent} rounded-lg`}
                  >
                    <div>
                      <p className={`font-medium ${theme.textPrimary}`}>
                        {asset.name || asset.account_name}
                      </p>
                      <p className={`text-xs ${theme.textTertiary}`}>
                        {asset.code || asset.account_code}
                      </p>
                    </div>
                    <span className="text-green-600 font-bold">
                      {formatCurrency(asset.balance || asset.amount || 0)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Non-Current Assets */}
          {nonCurrentAssets.length > 0 && (
            <div className="mb-4">
              <h4
                className={`text-sm font-semibold ${theme.textSecondary} mb-3`}
              >
                Non-Current Assets
              </h4>
              <div className="space-y-2">
                {nonCurrentAssets.map((asset, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.6 + (currentAssets.length + index) * 0.05,
                    }}
                    className={`flex justify-between items-center p-3 ${theme.bgAccent} rounded-lg`}
                  >
                    <div>
                      <p className={`font-medium ${theme.textPrimary}`}>
                        {asset.name || asset.account_name}
                      </p>
                      <p className={`text-xs ${theme.textTertiary}`}>
                        {asset.code || asset.account_code}
                      </p>
                    </div>
                    <span className="text-green-600 font-bold">
                      {formatCurrency(asset.balance || asset.amount || 0)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {assets.length === 0 && (
            <p className={`text-center ${theme.textTertiary} py-4`}>
              No assets recorded
            </p>
          )}

          <div
            className={`flex justify-between items-center pt-4 mt-4 border-t-2 ${theme.borderSecondary}`}
          >
            <span className={`font-bold ${theme.textPrimary}`}>
              Total Assets
            </span>
            <span className="text-xl font-bold text-green-600">
              {formatCurrency(totalAssets)}
            </span>
          </div>
        </motion.div>

        {/* Liabilities & Equity Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          {/* Liabilities */}
          <div className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}>
            <h3 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>
              Liabilities
            </h3>

            {/* Current Liabilities */}
            {currentLiabilities.length > 0 && (
              <div className="mb-6">
                <h4
                  className={`text-sm font-semibold ${theme.textSecondary} mb-3`}
                >
                  Current Liabilities
                </h4>
                <div className="space-y-2">
                  {currentLiabilities.map((liability, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.05 }}
                      className={`flex justify-between items-center p-3 ${theme.bgAccent} rounded-lg`}
                    >
                      <div>
                        <p className={`font-medium ${theme.textPrimary}`}>
                          {liability.name || liability.account_name}
                        </p>
                        <p className={`text-xs ${theme.textTertiary}`}>
                          {liability.code || liability.account_code}
                        </p>
                      </div>
                      <span className="text-red-600 font-bold">
                        {formatCurrency(
                          liability.balance || liability.amount || 0
                        )}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Non-Current Liabilities */}
            {nonCurrentLiabilities.length > 0 && (
              <div className="mb-4">
                <h4
                  className={`text-sm font-semibold ${theme.textSecondary} mb-3`}
                >
                  Non-Current Liabilities
                </h4>
                <div className="space-y-2">
                  {nonCurrentLiabilities.map((liability, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.6 + (currentLiabilities.length + index) * 0.05,
                      }}
                      className={`flex justify-between items-center p-3 ${theme.bgAccent} rounded-lg`}
                    >
                      <div>
                        <p className={`font-medium ${theme.textPrimary}`}>
                          {liability.name || liability.account_name}
                        </p>
                        <p className={`text-xs ${theme.textTertiary}`}>
                          {liability.code || liability.account_code}
                        </p>
                      </div>
                      <span className="text-red-600 font-bold">
                        {formatCurrency(
                          liability.balance || liability.amount || 0
                        )}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {liabilities.length === 0 && (
              <p className={`text-center ${theme.textTertiary} py-4`}>
                No liabilities recorded
              </p>
            )}

            <div
              className={`flex justify-between items-center pt-4 mt-4 border-t-2 ${theme.borderSecondary}`}
            >
              <span className={`font-bold ${theme.textPrimary}`}>
                Total Liabilities
              </span>
              <span className="text-xl font-bold text-red-600">
                {formatCurrency(totalLiabilities)}
              </span>
            </div>
          </div>

          {/* Equity */}
          <div className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}>
            <h3 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>
              Equity
            </h3>
            <div className="space-y-2">
              {equity.length > 0 ? (
                equity.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    className={`flex justify-between items-center p-3 ${theme.bgAccent} rounded-lg`}
                  >
                    <div>
                      <p className={`font-medium ${theme.textPrimary}`}>
                        {item.name || item.account_name}
                      </p>
                      <p className={`text-xs ${theme.textTertiary}`}>
                        {item.code || item.account_code}
                      </p>
                    </div>
                    <span className="text-blue-600 font-bold">
                      {formatCurrency(item.balance || item.amount || 0)}
                    </span>
                  </motion.div>
                ))
              ) : (
                <p className={`text-center ${theme.textTertiary} py-4`}>
                  No equity recorded
                </p>
              )}
              <div
                className={`flex justify-between items-center pt-4 mt-4 border-t-2 ${theme.borderSecondary}`}
              >
                <span className={`font-bold ${theme.textPrimary}`}>
                  Total Equity
                </span>
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(totalEquity)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Balance Verification */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className={`${theme.bgCard} rounded-xl p-8 ${theme.shadow} bg-gradient-to-br from-blue-50 to-indigo-50`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-lg ${theme.textSecondary} mb-2`}>
              Balance Equation
            </p>
            <div className={`text-sm ${theme.textTertiary} space-y-1`}>
              <p>Assets = Liabilities + Equity</p>
              <p className="font-semibold">
                {formatCurrency(totalAssets)} ={" "}
                {formatCurrency(totalLiabilities + totalEquity)}
              </p>
            </div>
          </div>
          <div className="p-6 rounded-full bg-blue-100">
            <Scale size={48} className="text-blue-600" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BalanceSheetReport;
