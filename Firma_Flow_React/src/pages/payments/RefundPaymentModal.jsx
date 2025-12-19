import { useState, useEffect } from "react";
import { X, RotateCcw, Info } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";
import { buildApiUrl } from "../../config/api.config";

const RefundPaymentModal = ({ isOpen, onClose, onSuccess, invoice }) => {
  const { theme } = useTheme();
  const { formatCurrency } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [refundAmount, setRefundAmount] = useState("");
  const [reason, setReason] = useState("");

  // Calculate paid amount
  const invoiceTotal = parseFloat(invoice?.total || 0);
  const amountPaid = parseFloat(invoice?.amount_paid || 0);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setRefundAmount(amountPaid.toFixed(2));
      setReason("");
      setError("");
    }
  }, [isOpen, amountPaid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const amount = parseFloat(refundAmount);
    if (!amount || amount <= 0) {
      setError("Please enter a valid refund amount");
      return;
    }

    if (amount > amountPaid) {
      setError(
        `Refund amount cannot exceed the paid amount of ${formatCurrency(
          amountPaid
        )}`
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        buildApiUrl("api/payments.php?action=refund"),
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            invoice_id: invoice.id,
            amount: amount,
            reason: reason,
            is_full_refund: amount >= amountPaid,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && (data.success || data.id)) {
        onSuccess?.();
        onClose();
      } else {
        setError(data.error || data.message || "Failed to process refund");
      }
    } catch (err) {
      console.error("Error processing refund:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${theme.bgCard} rounded-xl ${theme.shadow} max-w-md w-full max-h-[85vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 flex justify-between items-center rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <RotateCcw className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Refund Payment</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Invoice Reference Banner */}
          <div
            className={`${
              theme.mode === "light"
                ? "bg-gradient-to-r from-orange-50 to-red-50"
                : "bg-slate-700/50"
            } border ${theme.borderPrimary} rounded-lg p-4`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Info size={16} className="text-orange-600" />
              <span className={`text-sm font-medium ${theme.textSecondary}`}>
                Payment Details
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className={`text-xs ${theme.textSecondary}`}>Invoice #</p>
                <p className={`text-sm font-bold ${theme.textPrimary}`}>
                  {invoice?.invoice_number || invoice?.invoice_no || "N/A"}
                </p>
              </div>
              <div>
                <p className={`text-xs ${theme.textSecondary}`}>Customer</p>
                <p className={`text-sm font-bold ${theme.textPrimary}`}>
                  {invoice?.customer_name || "N/A"}
                </p>
              </div>
              <div>
                <p className={`text-xs ${theme.textSecondary}`}>
                  Invoice Total
                </p>
                <p className={`text-sm font-semibold ${theme.textPrimary}`}>
                  {formatCurrency(invoiceTotal)}
                </p>
              </div>
              <div>
                <p className={`text-xs ${theme.textSecondary}`}>Amount Paid</p>
                <p className={`text-sm font-bold text-green-600`}>
                  {formatCurrency(amountPaid)}
                </p>
              </div>
            </div>
          </div>

          {/* Refund Amount */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
            >
              Refund Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={amountPaid}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder="Enter refund amount"
              required
              className={`w-full px-4 py-2.5 border ${theme.borderPrimary} rounded-lg ${theme.bgInput} ${theme.textPrimary} focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
            />
            <p className={`text-xs ${theme.textSecondary} mt-1`}>
              Max refundable: {formatCurrency(amountPaid)}
            </p>
          </div>

          {/* Reason */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
            >
              Reason for Refund
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Enter reason for refund..."
              className={`w-full px-4 py-2.5 border ${theme.borderPrimary} rounded-lg ${theme.bgInput} ${theme.textPrimary} focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none`}
            />
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> This will reverse the payment and update
              the invoice status accordingly.
              {parseFloat(refundAmount) >= amountPaid
                ? " This is a full refund."
                : " This is a partial refund."}
            </p>
          </div>

          {/* Action Buttons */}
          <div className={`flex gap-3 pt-4 border-t ${theme.borderSecondary}`}>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-6 py-3 ${theme.bgCard} border ${theme.borderPrimary} rounded-lg ${theme.textPrimary} hover:bg-slate-100 transition font-medium`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:opacity-90 transition font-medium shadow-lg ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Processing..." : "Process Refund"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RefundPaymentModal;
