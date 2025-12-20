import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";
import { buildApiUrl } from "../../../config/api.config";

const FinancialChatModal = ({
  isOpen,
  onClose,
  reportData,
  reportType,
  messages,
  setMessages,
}) => {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      role: "user",
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Prepare context from report data
      const reportContext = JSON.stringify({
        reportType: reportType,
        reportName: getReportName(reportType),
        data: reportData,
      });

      const response = await fetch(buildApiUrl("api/ai_insights.php"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "chat",
          message: inputValue.trim(),
          reportContext: reportContext,
          conversationHistory: messages.slice(-5), // Last 5 messages for context
        }),
      });

      const data = await response.json();

      if (data.success && data.response) {
        const assistantMessage = {
          role: "assistant",
          content: data.response,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.message || "Failed to get AI response");
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        role: "assistant",
        content:
          "Sorry, I encountered an error processing your question. Please try again or rephrase your question.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          className={`${theme.bgCard} rounded-2xl ${theme.shadow} w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden border ${theme.border}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-500 to-pink-600 border-b border-purple-700">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"
              >
                <Sparkles size={24} className="text-white" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Financial Assistant
                </h2>
                <p className="text-sm text-purple-100">
                  Ask questions about your {getReportName(reportType)}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} className="text-white" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex gap-3 ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-blue-500 to-blue-600"
                      : "bg-gradient-to-br from-purple-500 to-pink-600"
                  }`}
                >
                  {message.role === "user" ? (
                    <User size={20} className="text-white" />
                  ) : (
                    <Bot size={20} className="text-white" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`flex-1 max-w-[80%] ${
                    message.role === "user" ? "text-right" : ""
                  }`}
                >
                  <div
                    className={`inline-block p-4 rounded-2xl ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                        : `${theme.bgCard} border ${theme.border} ${theme.shadow}`
                    }`}
                  >
                    <p
                      className={`text-sm leading-relaxed whitespace-pre-wrap ${
                        message.role === "user"
                          ? "text-white"
                          : theme.textPrimary
                      }`}
                    >
                      {message.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-600">
                  <Bot size={20} className="text-white" />
                </div>
                <div
                  className={`p-4 rounded-2xl ${theme.bgCard} border ${theme.border} ${theme.shadow}`}
                >
                  <div className="flex items-center gap-2">
                    <Loader2
                      size={16}
                      className="animate-spin text-purple-600"
                    />
                    <span className={`text-sm ${theme.textSecondary}`}>
                      Thinking...
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className={`p-4 border-t ${theme.border} ${theme.bgCard}`}>
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your report or request financial advice..."
                disabled={isLoading}
                className={`flex-1 px-4 py-3 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 font-medium"
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
                Send
              </button>
            </div>

            {/* Helper Text */}
            <p className={`text-xs ${theme.textTertiary} mt-2 text-center`}>
              Press Enter to send • AI responses are informational only
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FinancialChatModal;
