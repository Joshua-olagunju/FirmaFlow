import { useState } from "react";
import { X, MessageSquare, Mail, Phone, AlertCircle, CheckCircle2, Send } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useUser } from "../../contexts/UserContext";
import { buildApiUrl } from "../../config/api.config";
import LiveChatComponent from "../chat/LiveChatComponent";

const ContactSupportModal = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("ticket"); // "ticket" or "chat"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  
  // Ticket form state
  const [ticketData, setTicketData] = useState({
    subject: "",
    priority: "medium",
    category: "general",
    message: "",
  });

  const priorities = [
    { value: "low", label: "Low", color: "text-green-600" },
    { value: "medium", label: "Medium", color: "text-yellow-600" },
    { value: "high", label: "High", color: "text-orange-600" },
    { value: "urgent", label: "Urgent", color: "text-red-600" },
  ];

  const categories = [
    { value: "general", label: "General Inquiry" },
    { value: "technical", label: "Technical Support" },
    { value: "billing", label: "Billing & Subscriptions" },
    { value: "feature", label: "Feature Request" },
    { value: "bug", label: "Bug Report" },
    { value: "account", label: "Account Issues" },
  ];

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    
    if (!ticketData.subject.trim() || !ticketData.message.trim()) {
      setError("Subject and message are required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Since there's no direct ticket API, we'll send an email or use the chat API
      // For now, let's simulate a ticket creation
      const response = await fetch(buildApiUrl("api/create_support_ticket.php"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: ticketData.subject,
          priority: ticketData.priority,
          category: ticketData.category,
          message: ticketData.message,
          user_info: {
            name: `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email,
            email: user?.email,
            company: user?.company_name,
            role: user?.role,
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTicketNumber(data.ticket_number || "");
        setTicketData({
          subject: "",
          priority: "medium",
          category: "general",
          message: "",
        });
      } else {
        throw new Error(data.message || "Failed to submit support ticket");
      }
    } catch (err) {
      console.error("Support ticket error:", err);
      setError("Failed to submit support ticket. Please try again or contact us directly.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTicketData({
      subject: "",
      priority: "medium", 
      category: "general",
      message: "",
    });
    setError("");
    setSuccess(false);
    setTicketNumber("");
    setActiveTab("ticket");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${theme.bgCard} rounded-xl ${theme.shadow} max-w-2xl w-full max-h-[95vh] overflow-y-auto animate-fadeIn`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <MessageSquare className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Contact Support</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
            disabled={loading}
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("ticket")}
            className={`flex-1 px-6 py-4 text-center font-medium transition ${
              activeTab === "ticket"
                ? "border-b-2 border-[#667eea] text-[#667eea] bg-blue-50"
                : `${theme.textSecondary} hover:${theme.textPrimary}`
            }`}
          >
            <Mail size={18} className="inline mr-2" />
            Submit Ticket
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 px-6 py-4 text-center font-medium transition ${
              activeTab === "chat"
                ? "border-b-2 border-[#667eea] text-[#667eea] bg-blue-50"
                : `${theme.textSecondary} hover:${theme.textPrimary}`
            }`}
          >
            <MessageSquare size={18} className="inline mr-2" />
            Live Chat
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
              <div>
                <p className="text-green-800 text-sm font-medium">Support ticket submitted successfully!</p>
                {ticketNumber && (
                  <p className="text-green-700 text-xs mt-1">
                    Ticket Number: <strong>{ticketNumber}</strong>
                  </p>
                )}
                <p className="text-green-700 text-xs mt-1">We'll get back to you within 24 hours.</p>
              </div>
            </div>
          )}

          {activeTab === "ticket" && (
            <form onSubmit={handleTicketSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Priority */}
                <div>
                  <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                    Priority
                  </label>
                  <select
                    value={ticketData.priority}
                    onChange={(e) => setTicketData(prev => ({ ...prev, priority: e.target.value }))}
                    className={`w-full p-3 border ${theme.borderSecondary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${theme.bgCard} ${theme.textPrimary}`}
                    disabled={loading}
                  >
                    {priorities.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                    Category
                  </label>
                  <select
                    value={ticketData.category}
                    onChange={(e) => setTicketData(prev => ({ ...prev, category: e.target.value }))}
                    className={`w-full p-3 border ${theme.borderSecondary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${theme.bgCard} ${theme.textPrimary}`}
                    disabled={loading}
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                  Subject *
                </label>
                <input
                  type="text"
                  value={ticketData.subject}
                  onChange={(e) => setTicketData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Brief description of your issue or question"
                  className={`w-full p-3 border ${theme.borderSecondary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${theme.bgCard} ${theme.textPrimary}`}
                  disabled={loading}
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                  Message *
                </label>
                <textarea
                  value={ticketData.message}
                  onChange={(e) => setTicketData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Please provide detailed information about your issue or question..."
                  rows={6}
                  className={`w-full p-3 border ${theme.borderSecondary} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${theme.bgCard} ${theme.textPrimary} resize-none`}
                  disabled={loading}
                  required
                />
              </div>

              {/* User Info Display */}
              <div className={`${theme.bgAccent} rounded-lg p-4`}>
                <h4 className={`font-medium ${theme.textPrimary} mb-2`}>Your Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className={theme.textTertiary}>Name: </span>
                    <span className={theme.textPrimary}>
                      {`${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email}
                    </span>
                  </div>
                  <div>
                    <span className={theme.textTertiary}>Email: </span>
                    <span className={theme.textPrimary}>{user?.email}</span>
                  </div>
                  <div>
                    <span className={theme.textTertiary}>Company: </span>
                    <span className={theme.textPrimary}>{user?.company_name || "N/A"}</span>
                  </div>
                  <div>
                    <span className={theme.textTertiary}>Role: </span>
                    <span className={theme.textPrimary}>{user?.role || "user"}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className={`px-6 py-2 ${theme.bgCard} border ${theme.borderSecondary} ${theme.textPrimary} rounded-lg ${theme.bgHover} transition font-medium disabled:opacity-50`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !ticketData.subject.trim() || !ticketData.message.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg hover:shadow-lg transition font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  <Send size={18} />
                  {loading ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "chat" && (
            <LiveChatComponent onClose={handleClose} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactSupportModal;