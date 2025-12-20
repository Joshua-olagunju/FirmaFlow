import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Lightbulb,
  TrendingUp,
  AlertCircle,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";
import FinancialChatModal from "./FinancialChatModal";

const AIInsights = ({ reportData, isLoading, reportType }) => {
  const { theme } = useTheme();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);

  // Initialize chat with welcome message when reportType changes (new report generated)
  useEffect(() => {
    const getReportName = (type) => {
      const names = {
        profit_loss: "Profit & Loss",
        balance_sheet: "Balance Sheet",
        trial_balance: "Trial Balance",
        cash_flow: "Cash Flow",
        sales_summary: "Sales Summary",
        inventory_summary: "Inventory Summary",
      };
      return names[type] || "Financial Report";
    };

    const welcomeMessage = {
      role: "assistant",
      content: `Hello! 👋 I'm your AI Financial Assistant powered by Groq + Llama 3.3.

I can help you understand the ${getReportName(
        reportType
      )} report you just generated and provide insights about your financial data.

**What I can help with:**
• Explaining specific numbers or trends in your report
• Answering questions about your financial metrics
• Providing general financial advice and recommendations
• Clarifying accounting concepts and best practices

**Important Disclaimer:** 
⚠️ I am an AI assistant and NOT a certified financial advisor. My responses are for informational purposes only and should not be considered as professional financial advice. Always consult with a qualified financial professional for important financial decisions.

**Ask me anything about your report!** 💡`,
    };

    // Reset chat messages when a new report is generated
    setChatMessages([welcomeMessage]);
  }, [reportType, reportData?.title]);

  if (!reportData || isLoading) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`${theme.bgCard} rounded-xl p-6 ${theme.shadow} border ${theme.border}`}
    >
      {/* Header with Gradient Background */}
      <div className="mb-6 -mx-6 -mt-6 p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-t-xl border-b-2 border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
              className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-lg"
            >
              <Sparkles size={24} className="text-white" />
            </motion.div>
            <div>
              <h3 className={`text-xl font-bold ${theme.textPrimary}`}>
                AI-Powered Insights
              </h3>
              <p className={`text-sm ${theme.textSecondary}`}>
                Powered by Groq + Llama 3.3 (Free AI)
              </p>
            </div>
          </div>

          {/* Ask AI Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-sm"
          >
            <MessageCircle size={18} />
            Ask AI
          </motion.button>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {reportData.insights && reportData.insights.length > 0 ? (
          reportData.insights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className={`flex items-start gap-3 p-4 rounded-xl ${theme.bgCard} border ${theme.border} ${theme.shadow} hover:shadow-lg transition-all duration-200`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {index === 0 ? (
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <Lightbulb
                      size={18}
                      className="text-yellow-600 dark:text-yellow-400"
                    />
                  </div>
                ) : index === reportData.insights.length - 1 ? (
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <TrendingUp
                      size={18}
                      className="text-green-600 dark:text-green-400"
                    />
                  </div>
                ) : (
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <AlertCircle
                      size={18}
                      className="text-blue-600 dark:text-blue-400"
                    />
                  </div>
                )}
              </div>
              <p
                className={`text-sm leading-relaxed ${theme.textPrimary} flex-1`}
              >
                {insight}
              </p>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8">
            <Loader2
              className="animate-spin mx-auto mb-3 text-purple-600"
              size={32}
            />
            <p className={`text-sm ${theme.textSecondary}`}>
              Generating AI insights...
            </p>
          </div>
        )}
      </div>

      {/* Footer Badge */}
      <div className="mt-6 flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
        <Sparkles size={16} className="text-purple-600 dark:text-purple-400" />
        <span className={`text-xs font-medium ${theme.textSecondary}`}>
          100% Free AI • No API Costs • Privacy Friendly
        </span>
      </div>

      {/* Financial Chat Modal */}
      <FinancialChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        reportData={reportData}
        reportType={reportType}
        messages={chatMessages}
        setMessages={setChatMessages}
      />
    </motion.div>
  );
};

export default AIInsights;
