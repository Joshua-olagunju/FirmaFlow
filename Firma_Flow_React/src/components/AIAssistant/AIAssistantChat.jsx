import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";
import { buildApiUrl } from "../../config/api.config";

const AIAssistantChat = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [capabilities, setCapabilities] = useState([]);
  const [pendingTask, setPendingTask] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadCapabilities();
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

      const data = await response.json();
      if (data.success) {
        setCapabilities(data.capabilities);
        setMessages([
          {
            type: "assistant",
            content:
              '👋 Hello! I\'m your AI Assistant. I can help you with various tasks in FirmaFlow.\n\n💬 Just tell me what you want to do in your own words! For example:\n• "Create a customer named John Doe with email john@example.com, phone 1234567890, and address 123 Main St"\n• "Add a product called Laptop, price 50000, quantity 10"\n• "What customers do I have?"\n• "Show me my recent invoices"\n\nI\'ll understand your request and help you complete it!',
            timestamp: new Date(),
          },
          {
            type: "capabilities",
            content: "💡 Quick actions (optional):",
            capabilities: data.capabilities,
            timestamp: new Date(),
            collapsed: true, // Make it collapsible/less prominent
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to load capabilities:", error);
      setMessages([
        {
          type: "assistant",
          content:
            "⚠️ Failed to initialize AI Assistant. Please try again later.",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");

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
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to process request");
      }

      const parsed = data.parsed;

      // Handle template/example requests
      if (parsed.task_type === "template_request") {
        const templateType =
          parsed.extracted_data?.template_type ||
          parsed.template_type ||
          "product";
        let templates = {
          product: `📝 **Example Product Creation Prompts:**

You can copy and modify any of these:

1️⃣ **Simple Product:**
Create product [Product Name], selling price [Amount], quantity [Number]

2️⃣ **With Cost Price:**
Add product [Name], cost price [Cost], selling price [Selling], quantity [Qty]

3️⃣ **Full Details:**
Add product [Name], cost [Cost], selling [Selling], [Number] [units like pieces/kg/liters], description: [details]

**Real Examples You Can Use:**

• Create product Laptop, selling price 50000, quantity 10

• Add product Rice, cost price 500, selling price 800, 100 bags

• Create product Cooking Oil, cost 1200, selling 1500, 50 liters, description: Premium vegetable oil

Just replace the [brackets] with your actual values and send!`,

          customer: `📝 **Example Customer Creation Prompts:**

1️⃣ **Basic:**
Create customer [Name], email [email], phone [phone]

2️⃣ **With Address:**
Add customer [Name], email [email], phone [phone], address [full address]

3️⃣ **Business Customer:**
Create customer [Company Name], business type, email [email], phone [phone], Net [30/60] terms

**Real Examples:**

• Create customer John Doe, email john@example.com, phone 08012345678

• Add customer ABC Corp, business type, email info@abc.com, phone 08099887766, Net 30 terms, credit limit 100000`,

          invoice: `📝 **Example Invoice Creation Prompts:**

• Create invoice for [customer name], items: [product] x [qty], due date [date]

**Coming soon!** This feature is being enhanced.`,

          payment: `📝 **Example Payment Prompts:**

• Approve payment for invoice [invoice number]

**Coming soon!** This feature is being enhanced.`,
        };

        setMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            content: templates[templateType] || templates.product,
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
        return;
      }

      // Handle conversational/off-topic queries
      if (parsed.task_type === "conversational") {
        const response =
          parsed.conversational_response ||
          "👋 I'm your FirmaFlow AI Assistant! I'm here to help you manage your business - create customers, add products, track invoices, and answer questions about your data. How can I assist you today?";

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
              '🤔 I\'m not quite sure what you want me to do. Could you please rephrase or provide more details?\n\nFor example:\n• "Create a customer named [name] with email [email]"\n• "Add product [name] with price [amount]"\n• "Show me information about [something]"',
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
        return;
      }

      // Check if all required fields are present
      if (!parsed.has_all_required) {
        setMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            content:
              parsed.clarification_message ||
              "I need more information to complete this task.",
            missing_fields: parsed.missing_fields,
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
        return;
      }

      // Handle informational queries directly (no confirmation needed)
      if (parsed.task_type === "query_information") {
        try {
          const queryResponse = await fetch(
            buildApiUrl("api/ai_assistant.php"),
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                action: "query_info",
                queryType: parsed.extracted_data.query_type,
                queryData: parsed.extracted_data,
              }),
            }
          );

          const queryData = await queryResponse.json();

          if (queryData.success) {
            setMessages((prev) => [
              ...prev,
              {
                type: "assistant",
                content: queryData.answer,
                timestamp: new Date(),
              },
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                type: "error",
                content: `❌ ${queryData.error || "Failed to get information"}`,
                timestamp: new Date(),
              },
            ]);
          }
        } catch (error) {
          setMessages((prev) => [
            ...prev,
            {
              type: "error",
              content: `❌ Error: ${error.message}`,
              timestamp: new Date(),
            },
          ]);
        }
        setIsLoading(false);
        return;
      }

      // All data present - show confirmation for action tasks
      setPendingTask({
        task_type: parsed.task_type,
        data: parsed.extracted_data,
      });

      setMessages((prev) => [
        ...prev,
        {
          type: "confirmation",
          content:
            "✅ I've extracted the following information. Please confirm:",
          task_type: parsed.task_type,
          data: parsed.extracted_data,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
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
      setIsLoading(false);
    }
  };

  const handleConfirmTask = async (confirmed) => {
    if (!confirmed || !pendingTask) {
      setMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content: "❌ Task cancelled. How else can I help you?",
          timestamp: new Date(),
        },
      ]);
      setPendingTask(null);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(buildApiUrl("api/ai_assistant.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "execute_task",
          taskType: pendingTask.task_type,
          taskData: pendingTask.data,
        }),
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const text = await response.text();
        console.error("Server error response:", text);
        throw new Error(
          `Server error: ${response.status} - ${text.substring(0, 100)}`
        );
      }

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            type: "success",
            content: `✅ ${data.message}`,
            result: data,
            timestamp: new Date(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            type: "error",
            content: `❌ ${data.error}`,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error executing task:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "error",
          content: `❌ Failed to execute task: ${error.message}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setPendingTask(null);
    }
  };

  const handleCapabilityClick = (capability) => {
    setInputValue(capability.example);
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
                    Automate your tasks
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setMessages([]);
                    setInputValue("");
                    setPendingTask(null);
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
                  onCapabilityClick={handleCapabilityClick}
                  onConfirmTask={handleConfirmTask}
                  pendingTask={pendingTask}
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
            <div className={`p-4 border-t ${theme.border}`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your request... (e.g., Create a customer)"
                  className={`flex-1 px-4 py-3 rounded-lg ${theme.bgPrimary} ${theme.textPrimary} ${theme.border} border focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
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
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const MessageBubble = ({
  message,
  theme,
  onCapabilityClick,
  onConfirmTask,
  pendingTask,
}) => {
  if (message.type === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-lg shadow">
          <p className="text-sm">{message.content}</p>
        </div>
      </div>
    );
  }

  if (message.type === "capabilities") {
    return (
      <div className={`max-w-[90%] ${theme.bgPrimary} p-4 rounded-lg shadow`}>
        <p className={`text-sm mb-3 ${theme.textPrimary}`}>{message.content}</p>
        <div className="space-y-2">
          {message.capabilities.map((cap) => (
            <button
              key={cap.id}
              onClick={() => onCapabilityClick(cap)}
              className={`w-full text-left p-3 rounded-lg ${theme.bgAccent} hover:bg-purple-100 dark:hover:bg-purple-900 transition-all border ${theme.border}`}
            >
              <div className={`font-semibold text-sm ${theme.textPrimary}`}>
                {cap.title}
              </div>
              <div className={`text-xs mt-1 ${theme.textSecondary}`}>
                {cap.description}
              </div>
              <div
                className={`text-xs mt-1 italic ${theme.textSecondary} opacity-70`}
              >
                Example: "{cap.example}"
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (message.type === "confirmation") {
    return (
      <div
        className={`max-w-[90%] ${theme.bgPrimary} p-4 rounded-lg shadow border-2 border-purple-500`}
      >
        <p className={`text-sm mb-3 ${theme.textPrimary} font-semibold`}>
          {message.content}
        </p>
        <div className={`${theme.bgAccent} p-3 rounded mb-3`}>
          {Object.entries(message.data).map(([key, value]) => (
            <div key={key} className="flex justify-between py-1">
              <span className={`text-sm ${theme.textSecondary} capitalize`}>
                {key.replace(/_/g, " ")}:
              </span>
              <span className={`text-sm ${theme.textPrimary} font-medium`}>
                {value || "N/A"}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onConfirmTask(true)}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-all"
          >
            ✓ Yes, Proceed
          </button>
          <button
            onClick={() => onConfirmTask(false)}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-all"
          >
            ✗ Cancel
          </button>
        </div>
      </div>
    );
  }

  if (message.type === "success") {
    return (
      <div
        className={`max-w-[90%] ${theme.bgPrimary} p-4 rounded-lg shadow border-2 border-green-500`}
      >
        <div className="flex items-start gap-2 mb-2">
          <svg
            className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className={`text-sm ${theme.textPrimary} font-semibold`}>
              {message.content}
            </p>
            {message.result && (
              <div
                className={`mt-3 text-sm ${theme.textSecondary} space-y-1 ${theme.bgAccent} p-3 rounded`}
              >
                {Object.entries(message.result)
                  .filter(
                    ([key]) => !["success", "message", "data"].includes(key)
                  )
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="capitalize font-medium">
                        {key.replace(/_/g, " ")}:
                      </span>{" "}
                      <span className={theme.textPrimary}>{value}</span>
                    </div>
                  ))}
              </div>
            )}
            <p className={`text-xs ${theme.textSecondary} mt-2 italic`}>
              ✨ You can now go to the respective page to see the changes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (message.type === "error") {
    return (
      <div
        className={`max-w-[90%] ${theme.bgPrimary} p-4 rounded-lg shadow border-2 border-red-500`}
      >
        <p className={`text-sm ${theme.textPrimary}`}>{message.content}</p>
      </div>
    );
  }

  // Default assistant message
  return (
    <div className={`max-w-[80%] ${theme.bgPrimary} p-4 rounded-lg shadow`}>
      <p className={`text-sm ${theme.textPrimary} whitespace-pre-line`}>
        {message.content}
      </p>
      {message.missing_fields && message.missing_fields.length > 0 && (
        <div className="mt-2">
          <p className={`text-xs ${theme.textSecondary}`}>
            Missing information:
          </p>
          <ul
            className={`text-xs ${theme.textSecondary} list-disc list-inside`}
          >
            {message.missing_fields.map((field) => (
              <li key={field} className="capitalize">
                {field.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AIAssistantChat;
