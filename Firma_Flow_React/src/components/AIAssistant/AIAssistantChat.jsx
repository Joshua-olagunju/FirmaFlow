import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";
import { buildApiUrl } from "../../config/api.config";

const AIAssistantChat = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  // Chat persistence key
  const STORAGE_KEY = 'firmaflow_ai_chat_history';
  
  // Load chat history from localStorage on mount
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(STORAGE_KEY);
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsed.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  }, []);
  
  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch (error) {
        console.error('Failed to save chat history:', error);
      }
    }
  }, [messages]);

  // Cancel ongoing request
  const handleCancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content: "⏹️ Request cancelled.",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      // Load capabilities only if no messages exist
      if (messages.length === 0) {
        loadCapabilities();
      }
      scrollToBottom();
    }
  }, [isOpen]);

  const loadCapabilities = async () => {
    try {
      const response = await fetch(buildApiUrl("api/ai_assistant.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "get_capabilities" }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        // capabilities loaded — welcome message shown
        setMessages([
          {
            type: "assistant",
            content:
              "👋 Hello! I'm your **FirmaFlow AI Assistant**, powered by **SODATIM TECHNOLOGIES**.\n\nI can answer real questions about your business data. Just ask naturally!\n\n💰 **Revenue & Profit**\n• \"What is my total revenue?\"\n• \"What is my net profit this month?\"\n• \"Sales today / this week\"\n\n💸 **Payments & Invoices**\n• \"Who owes me money?\"\n• \"How many unpaid invoices do I have?\"\n• \"Payments received this month?\"\n• \"Details of invoice INV-2025-XXXX\"\n• \"Who sold invoice INV-2025-XXXX?\"\n\n👥 **Customers & Suppliers**\n• \"How many customers do I have?\"\n• \"Who are my top customers?\"\n• \"What did [customer name] buy?\"\n\n📦 **Inventory & Products**\n• \"Which products are low in stock?\"\n• \"What was the last product I sold?\"\n• \"What was the last product I bought?\"\n• \"Top selling products\"\n\n📌 **Subscription**\n• \"When does my subscription expire?\"\n• \"What is my current plan?\"\n\n💬 You can also **chat freely** — I love discussing business plans and ideas!\n\nFor creating, editing or deleting records, use the sidebar pages.",
            chips: [
              "What is my total revenue?",
              "What is my net profit?",
              "Who owes me money?",
              "How many customers do I have?",
              "What was the last product I sold?",
              "What was the last product I bought?",
              "When does my subscription expire?",
              "Low stock products",
              "Top selling products",
              "Who built this software?",
            ],
            timestamp: new Date(),
          },
        ]);
      } else {
        throw new Error(data.error || "Failed to load capabilities");
      }
    } catch (error) {
      console.error("Failed to load capabilities:", error);
      setMessages([
        {
          type: "assistant",
          content:
            "⚠️ Failed to initialize AI Assistant. Please refresh and try again.",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleSendMessage = async (directMessage = null) => {
    // Guard against event objects being passed (happens when used as onClick handler)
    const messageToSend =
      typeof directMessage === "string" ? directMessage : inputValue.trim();
    if (!messageToSend || isLoading) return;

    const userMessage = messageToSend;
    if (typeof directMessage !== "string") {
      setInputValue("");
    }

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        content: userMessage,
        timestamp: new Date(),
      },
    ]);

    setIsLoading(true);

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      // Build conversation history for context
      const conversationHistory = messages
        .filter((msg) => msg.type === "user" || msg.type === "assistant")
        .map((msg) => ({
          role: msg.type === "user" ? "user" : "assistant",
          content: msg.content,
        }));

      // Parse user prompt with conversation history
      const response = await fetch(buildApiUrl("api/ai_assistant.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "parse_prompt",
          prompt: userMessage,
          conversationHistory: conversationHistory,
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to process request");
      }

      // Handle v3 direct responses (greeting, help, unknown, success, cancelled, error, task_complete)
      if (
        data.type &&
        [
          "greeting",
          "help",
          "unknown",
          "success",
          "task_complete", // Treat as success - don't show debug data
          "cancelled",
          "complete",
          "error",
          "assistant", // Add assistant type for conversational responses
          "data_report", // Business intelligence reports
          "insight", // Single stat insights
        ].includes(data.type)
      ) {
        setMessages((prev) => [
          ...prev,
          {
            type:
              data.type === "error"
                ? "error"
                : data.type === "task_complete" || data.type === "success"
                ? "success"
                : data.type === "data_report" || data.type === "insight"
                ? data.type
                : "assistant",
            content: data.message,
            summary: data.data?.summary || null,
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
        return;
      }

      // Handle selection response (clickable entity list)
      if (data.type === "selection" && data.options) {
        // Selection in task-flow context - redirect to pages
        setMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            content: data.message || "🔍 To manage specific records, please use the dedicated pages from the sidebar (Customers, Inventory, Sales, etc.).",
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
        return;
      }

      // Handle capability offer
      if (data.type === "capability_offer") {
        setMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            content: data.message || "I can help you with business questions and data. For creating or managing records, please use the pages in the sidebar.",
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
        return;
      }

      // Handle confirmation / form / clarification - redirect to dedicated pages
      if (data.type === "confirmation" || data.type === "form" || data.type === "clarification") {
        setMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            content: "📌 For creating or editing records, please use the dedicated pages from the sidebar (e.g. Customers, Sales, Inventory). I'm here to help with questions and information!",
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
        return;
      }

      const parsed = data.parsed || {};

      // Safety check for missing parsed data
      if (!parsed || typeof parsed !== "object") {
        setMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            content: data.message || "I received your request. How can I help?",
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
        return;
      }


      // Handle conversational/off-topic queries
      if (
        parsed.task_type === "conversational" ||
        parsed.task_type === "general_chat"
      ) {
        const response =
          parsed.conversational_response ||
          "👋 I'm your FirmaFlow AI Assistant! I can help you view business data, answer questions about your sales, customers, inventory, and more. How can I assist you today?";

        setMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            content: response,
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
        return;
      }

      // Handle unknown task
      if (parsed.task_type === "unknown" || parsed.confidence < 0.5) {
        setMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            content:
              "🤔 I'm not sure what you're asking. Try asking about your sales, customers, stock levels, or revenue. For creating or editing records, use the pages in the sidebar.",
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
        return;
      }

      // For any remaining parsed task types (action tasks), redirect to pages
      setMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content: "📌 To manage records, please use the dedicated pages from the sidebar. I'm best used for business questions and data insights!",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      // Don't show error message if request was cancelled by user
      if (error.name === "AbortError") {
        return;
      }
      console.error("Error processing prompt:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content: `❌ Error: ${error.message}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur - same as other modals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Chat Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed right-0 top-0 h-full w-full md:w-[500px] ${theme.bgAccent} shadow-2xl z-50 flex flex-col`}
          >
            {/* Header */}
            <div
              className={`${theme.bgGradient} p-6 flex items-center justify-between`}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">AI Assistant</h2>
                  <p className="text-sm text-white text-opacity-80">
                    Ask me about your business
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setMessages([]);
                    setInputValue("");
                    loadCapabilities();
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
                  title="Clear Chat"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
                <button
                  onClick={onClose}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
                  title="Close"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <MessageBubble
                  key={index}
                  message={message}
                  theme={theme}
                  onChipClick={handleSendMessage}
                />
              ))}

              {isLoading && (
                <div
                  className={`flex items-center gap-2 ${theme.textSecondary}`}
                >
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                  <span className="text-sm">AI is thinking...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={`p-4 border-t ${theme.borderPrimary}`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question about your business..."
                  className={`flex-1 px-4 py-3 rounded-lg ${theme.bgPrimary} ${theme.textPrimary} ${theme.border} border focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  disabled={isLoading}
                />
                {isLoading ? (
                  /* Stop Button - ChatGPT Style */
                  <button
                    onClick={handleCancelRequest}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all relative"
                    title="Stop generating"
                  >
                    <div className="relative">
                      {/* Spinning border */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                      {/* Stop square */}
                      <svg
                        className="w-5 h-5 relative z-10"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <rect x="6" y="6" width="12" height="12" rx="1" />
                      </svg>
                    </div>
                  </button>
                ) : (
                  /* Send Button */
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const MessageBubble = ({ message, theme, onChipClick }) => {
  // Shared markdown renderer — turns **bold** + newlines into HTML
  const renderMarkdown = (text) => {
    const safe = typeof text === "string" ? text : String(text || "");
    return {
      __html: safe
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br />"),
    };
  };

  if (message.type === "user") {
    const userContent =
      typeof message.content === "string"
        ? message.content
        : String(message.content || "");
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-lg shadow">
          <p className="text-sm">{userContent}</p>
        </div>
      </div>
    );
  }

  if (message.type === "success") {
    return (
      <div
        className={`max-w-[90%] ${theme.bgPrimary} p-4 rounded-lg shadow-md border-l-4 border-green-500`}
      >
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p
            className={`text-sm ${theme.textPrimary} leading-relaxed`}
            dangerouslySetInnerHTML={renderMarkdown(message.content)}
          />
        </div>
      </div>
    );
  }

  if (message.type === "data_report" || message.type === "insight") {
    return (
      <div className={`max-w-[90%] ${theme.bgPrimary} p-4 rounded-lg shadow-md border-l-4 border-blue-500`}>
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
            <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
          </svg>
          <div className="flex-1">
            <p
              className={`text-sm ${theme.textPrimary} leading-relaxed`}
              dangerouslySetInnerHTML={renderMarkdown(message.content)}
            />
            {message.summary && (
              <div className={`mt-3 pt-3 border-t ${theme.borderPrimary}`}>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(message.summary).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className={`${theme.textSecondary} capitalize`}>{key.replace(/_/g, " ")}:</span>
                      <span className={`${theme.textPrimary} font-medium`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (message.type === "error") {
    const errorContent = typeof message.content === "string" ? message.content : JSON.stringify(message.content);
    return (
      <div className={`max-w-[90%] ${theme.bgPrimary} p-4 rounded-lg shadow border-l-4 border-red-500`}>
        <p className={`text-sm ${theme.textPrimary}`}>{errorContent}</p>
      </div>
    );
  }

  // Default assistant message — with markdown bold + optional chips
  return (
    <div className={`max-w-[88%] ${theme.bgPrimary} p-4 rounded-lg shadow`}>
      <p
        className={`text-sm ${theme.textPrimary} leading-relaxed`}
        dangerouslySetInnerHTML={renderMarkdown(message.content)}
      />
      {message.chips && message.chips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {message.chips.map((chip, i) => (
            <button
              key={i}
              onClick={() => onChipClick && onChipClick(chip)}
              className={`text-xs px-3 py-1.5 rounded-full border ${theme.borderPrimary} ${theme.textSecondary} ${theme.bgAccent} hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all`}
            >
              {chip}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIAssistantChat;
