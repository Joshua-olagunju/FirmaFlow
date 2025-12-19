import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../../components/Layout";
import {
  TrendingUp,
  RefreshCw,
  Download,
  Scale,
  PieChart,
  TrendingDown,
  DollarSign,
  Package,
  Calendar,
  Sparkles,
  Menu,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";
import { buildApiUrl } from "../../config/api.config";
import ReportTypeCard from "./components/ReportTypeCard";
import ExportDropdown from "./components/ExportDropdown";
import ProfitLossReport from "./components/ProfitLossReport";
import BalanceSheetReport from "./components/BalanceSheetReport";
import TrialBalanceReport from "./components/TrialBalanceReport";
import CashFlowReport from "./components/CashFlowReport";
import SalesSummaryReport from "./components/SalesSummaryReport";
import InventorySummaryReport from "./components/InventorySummaryReport";
import AIInsights from "./components/AIInsights";

const FinancialReports = () => {
  const { theme } = useTheme();
  const { currency, formatDate } = useSettings();
  const openSidebarRef = useRef(null);
  const dateSelectionRef = useRef(null);

  // State Management
  const [selectedReportType, setSelectedReportType] = useState(null);
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Report Types Configuration
  const reportTypes = [
    {
      id: "profit_loss",
      title: "Profit & Loss",
      subtitle: "Profit vs Loss",
      description: "Revenue and expenses analysis",
      icon: TrendingUp,
      gradient: "from-green-500 to-emerald-600",
      color: "green",
    },
    {
      id: "balance_sheet",
      title: "Balance Sheet",
      subtitle: "Assets, Liabilities & Equity",
      description: "Financial position snapshot",
      icon: Scale,
      gradient: "from-blue-500 to-indigo-600",
      color: "blue",
    },
    {
      id: "trial_balance",
      title: "Trial Balance",
      subtitle: "All Balance Sheet",
      description: "Verify accounting accuracy",
      icon: PieChart,
      gradient: "from-purple-500 to-pink-600",
      color: "purple",
    },
    {
      id: "cash_flow",
      title: "Cash Flow",
      subtitle: "Cash In Vs Cash Out",
      description: "Track cash movements",
      icon: TrendingDown,
      gradient: "from-orange-500 to-red-600",
      color: "orange",
    },
    {
      id: "sales_summary",
      title: "Sales Summary",
      subtitle: "Sales Performance",
      description: "Revenue and sales metrics",
      icon: DollarSign,
      gradient: "from-cyan-500 to-teal-600",
      color: "cyan",
    },
    {
      id: "inventory_summary",
      title: "Inventory Summary",
      subtitle: "Stock Value & Valuation",
      description: "Inventory levels and worth",
      icon: Package,
      gradient: "from-amber-500 to-yellow-600",
      color: "amber",
    },
  ];

  // Fetch AI Insights (FREE Groq API) - Defined first to avoid hoisting issues
  const fetchAIInsights = useCallback(
    async (data) => {
      setLoadingInsights(true);
      setAiInsights(null);

      try {
        const url = buildApiUrl("api/ai_insights.php");

        const response = await fetch(url, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reportType: selectedReportType,
            reportData: data,
          }),
        });

        const result = await response.json();

        console.log("AI Insights Response:", {
          status: response.status,
          result,
        });

        if (response.ok && result.success) {
          setAiInsights(result.insights);
        } else {
          console.error(
            "Failed to fetch AI insights:",
            result.error,
            result.message
          );
        }
      } catch (err) {
        console.error("Error fetching AI insights:", err);
      } finally {
        setLoadingInsights(false);
      }
    },
    [selectedReportType]
  );

  // Fetch Report Data
  const fetchReportData = useCallback(async () => {
    if (!selectedReportType) {
      setError("Please select a report type");
      return;
    }

    setIsGenerating(true);
    setIsLoading(true);
    setError("");
    setReportData(null);

    try {
      const url = buildApiUrl(
        `api/reports.php?type=${selectedReportType}&start_date=${startDate}&end_date=${endDate}`
      );

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setReportData(data);
        // Fetch AI insights after report data is loaded
        fetchAIInsights(data);
      } else {
        setError(data.error || data.message || "Failed to generate report");
      }
    } catch (err) {
      console.error("Error fetching report:", err);
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsGenerating(false), 500);
    }
  }, [selectedReportType, startDate, endDate, fetchAIInsights]);

  // Handle Report Type Selection
  const handleReportTypeSelect = (reportId) => {
    setSelectedReportType(reportId);
    setReportData(null);
    setError("");
    setAiInsights(null);

    // Smooth scroll to date selection section after a short delay
    setTimeout(() => {
      dateSelectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 300);
  };

  // Handle Clear Selection
  const handleClear = () => {
    setSelectedReportType(null);
    setReportData(null);
    setError("");
    setStartDate(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0]
    );
    setEndDate(new Date().toISOString().split("T")[0]);
  };

  // Handle Refresh
  const handleRefresh = () => {
    if (selectedReportType) {
      fetchReportData();
    }
  };

  // Render Report Component Based on Type
  const renderReportComponent = () => {
    if (!reportData) return null;

    const commonProps = {
      data: reportData,
      startDate,
      endDate,
      currency,
      formatDate,
    };

    switch (selectedReportType) {
      case "profit_loss":
        return <ProfitLossReport {...commonProps} />;
      case "balance_sheet":
        return <BalanceSheetReport {...commonProps} />;
      case "trial_balance":
        return <TrialBalanceReport {...commonProps} />;
      case "cash_flow":
        return <CashFlowReport {...commonProps} />;
      case "sales_summary":
        return <SalesSummaryReport {...commonProps} />;
      case "inventory_summary":
        return <InventorySummaryReport {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <Layout onMenuClick={(fn) => (openSidebarRef.current = fn)}>
      <div className="w-full md:flex flex-col flex-1 items-center justify-center gap-8">
        {/* Page Header */}
        <div
          className={`w-full flex justify-between items-start rounded-b-lg align-top p-4 mt-0 ${theme.bgSecondary} border-b ${theme.border}`}
        >
          {/* Left Side - Title */}
          <div className="flex-col items-center flex-1">
            <h1 className="text-white font-bold text-2xl md:text-3xl">
              Financial Reports
            </h1>
            <p className="m-0 text-sm md:text-normal font-500 text-slate-200">
              Generate comprehensive financial reports and analytics
            </p>
          </div>

          {/* Right Side - Hamburger Menu (Mobile Only) */}
          <button
            onClick={() => openSidebarRef.current?.()}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition flex-shrink-0"
          >
            <Menu size={24} className="text-white" />
          </button>
        </div>

        {/* Top Row: Currency + Action Buttons */}
        <div className="flex justify-between items-center flex-wrap gap-4 mb-6 mt-4 w-full px-4">
          <div className="flex items-center gap-3">
            <span
              className={`text-sm ${theme.bgAccent} ${theme.textPrimary} px-4 py-2 rounded-lg font-medium border ${theme.borderSecondary}`}
            >
              Currency: {currency}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Refresh Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className={`flex items-center gap-2 px-4 py-2 ${theme.bgAccent} rounded-lg border ${theme.border} hover:${theme.bgHover} transition-all`}
              disabled={!selectedReportType || isLoading}
            >
              <RefreshCw
                size={18}
                className={isLoading ? "animate-spin" : ""}
              />
              <span className="text-sm font-medium">Refresh</span>
            </motion.button>

            {/* Export Dropdown */}
            <ExportDropdown
              reportData={reportData}
              reportType={selectedReportType}
              startDate={startDate}
              endDate={endDate}
              disabled={!reportData}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full px-4 space-y-6">
          {/* Report Type Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
          >
            {/* Section Header with Animation */}
            <div className="flex items-center gap-3 mb-6">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              >
                <Sparkles size={24} className="text-[#667eea]" />
              </motion.div>
              <h2 className={`text-2xl font-bold ${theme.textPrimary}`}>
                Select Report Type
              </h2>
            </div>

            {/* Report Type Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportTypes.map((report, index) => (
                <ReportTypeCard
                  key={report.id}
                  report={report}
                  isSelected={selectedReportType === report.id}
                  onSelect={handleReportTypeSelect}
                  index={index}
                />
              ))}
            </div>
          </motion.div>

          {/* Date Selection & Actions */}
          <AnimatePresence>
            {selectedReportType && (
              <motion.div
                ref={dateSelectionRef}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow}`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Start Date */}
                  <div>
                    <label
                      className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
                    >
                      <Calendar size={16} className="inline mr-2" />
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg border ${theme.borderSecondary} ${theme.bgInput} ${theme.textPrimary} focus:ring-2 focus:ring-[#667eea] transition-all`}
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label
                      className={`block text-sm font-medium ${theme.textSecondary} mb-2`}
                    >
                      <Calendar size={16} className="inline mr-2" />
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg border ${theme.borderSecondary} ${theme.bgInput} ${theme.textPrimary} focus:ring-2 focus:ring-[#667eea] transition-all`}
                    />
                  </div>

                  {/* Generate Button */}
                  <div className="flex items-end">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={fetchReportData}
                      disabled={isLoading}
                      className={`w-full px-6 py-2 ${theme.bgAccent} ${
                        theme.textPrimary
                      } rounded-lg font-medium border ${theme.border} hover:${
                        theme.bgHover
                      } transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        isGenerating ? "animate-pulse" : ""
                      }`}
                    >
                      {isLoading ? "Generating..." : "Generate Report"}
                    </motion.button>
                  </div>

                  {/* Clear Button */}
                  <div className="flex items-end">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleClear}
                      className={`w-full px-6 py-2 border-2 border-[#667eea] text-[#667eea] rounded-lg font-medium hover:bg-[#667eea] hover:text-white transition-all`}
                    >
                      Clear Selection
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <p className="text-red-700 text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading State */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`${theme.bgCard} rounded-xl p-12 ${theme.shadow}`}
              >
                <div className="flex flex-col items-center justify-center space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-16 h-16 border-4 border-[#667eea] border-t-transparent rounded-full"
                  />
                  <p className={`text-lg font-medium ${theme.textSecondary}`}>
                    Generating your report...
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Report Results */}
          <AnimatePresence>
            {!isLoading && reportData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4 }}
              >
                {renderReportComponent()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Insights Section */}
          <AnimatePresence>
            {!isLoading && reportData && (
              <AIInsights
                reportData={{ insights: aiInsights }}
                isLoading={loadingInsights}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
};

export default FinancialReports;
