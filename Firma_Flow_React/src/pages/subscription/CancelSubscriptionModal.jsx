import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { buildApiUrl } from "../../config/api.config";

const CancelSubscriptionModal = ({ subscription, onClose, onSuccess }) => {
  const { theme } = useTheme();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleCancel = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for cancellation");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        buildApiUrl("api/subscription.php?action=cancel"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            subscription_id: subscription.id,
            reason,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        onSuccess();
      } else {
        setError(data.error || "Failed to cancel subscription");
      }
    } catch (err) {
      console.error("Error cancelling subscription:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className={`${theme.bgCard} rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle
                className="text-red-600 dark:text-red-400"
                size={24}
              />
            </div>
            <h2 className={`text-xl font-semibold ${theme.textPrimary}`}>
              Cancel Subscription
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${theme.textSecondary} hover:bg-gray-100 dark:hover:bg-gray-800 transition`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          {/* Warning Message */}
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className={`text-sm ${theme.textPrimary}`}>
              Are you sure you want to cancel your subscription? You will lose
              access to:
            </p>
            <ul className="mt-2 ml-4 text-sm text-red-600 dark:text-red-400 space-y-1">
              <li>• All premium features</li>
              <li>• Unlimited invoice creation</li>
              <li>• Advanced reporting tools</li>
              <li>• Priority support</li>
            </ul>
          </div>

          {/* Reason Input */}
          <div className="mb-4">
            <label
              className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
            >
              Reason for Cancellation <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please let us know why you're cancelling..."
              rows={4}
              className={`w-full px-3 py-2 border ${theme.borderPrimary} rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent ${theme.textPrimary} ${theme.bgCard}`}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 border ${theme.borderPrimary} ${theme.textPrimary} rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-medium`}
            >
              Keep Subscription
            </button>
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium ${
                isSubmitting ? "opacity-50 cursor-wait" : ""
              }`}
            >
              {isSubmitting ? "Cancelling..." : "Cancel Subscription"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelSubscriptionModal;
