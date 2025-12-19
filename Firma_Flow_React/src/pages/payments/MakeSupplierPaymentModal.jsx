import { useState, useEffect } from "react";
import { X, DollarSign, Calendar, CreditCard } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";
import { buildApiUrl } from "../../config/api.config";

const MakeSupplierPaymentModal = ({ isOpen, onClose, bill, onSuccess }) => {
  const { theme } = useTheme();
  const { formatCurrency, currency } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    amount: "",
    method: "bank_transfer",
    reference: "",
    notes: "",
    payment_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (isOpen && bill) {
      const balance = calculateBalance(bill);
      setFormData({
        amount: balance.toString(),
        method: "bank_transfer",
        reference: `PAY-${bill.bill_number || bill.purchase_number || ""}`,
        notes: `Payment for ${bill.bill_number || bill.purchase_number || ""}`,
        payment_date: new Date().toISOString().split("T")[0],
      });
      setError("");
    }
  }, [isOpen, bill]);

  const calculateBalance = (bill) => {
    const total = parseFloat(bill.total || bill.grand_total || 0);
    const paid = parseFloat(bill.amount_paid || 0);
    return total - paid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const balance = calculateBalance(bill);
      const paymentAmount = parseFloat(parseFloat(formData.amount).toFixed(2));

      if (paymentAmount <= 0) {
        setError("Payment amount must be greater than zero");
        setIsSubmitting(false);
        return;
      }

      if (paymentAmount > balance) {
        setError(
          `Payment amount cannot exceed balance of ${formatCurrency(balance)}`
        );
        setIsSubmitting(false);
        return;
      }

      // Create payment record - backend will automatically update the purchase bill
      const paymentData = {
        reference_type: "supplier",
        reference_id: bill.supplier_id,
        type: "made",
        amount: paymentAmount,
        payment_method: formData.method, // Backend expects payment_method
        method: formData.method, // Keep for compatibility
        reference: formData.reference,
        notes: formData.notes,
        payment_date: formData.payment_date,
        bill_id: bill.id, // Link to purchase bill
        invoice_id: bill.id, // Some backend code uses invoice_id for bills
        invoice_number: bill.bill_number || bill.purchase_number,
        invoice_total: bill.total || bill.grand_total,
        balance_before: balance,
        balance_after: balance - paymentAmount,
        entity_name: bill.supplier_name,
        currency: currency,
      };

      const response = await fetch(buildApiUrl("api/payments.php"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to record payment");
      }

      // Backend automatically updates the purchase bill, so we don't need to do it here
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error making payment:", err);
      setError(err.message || "Failed to process payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !bill) return null;

  const balance = calculateBalance(bill);
  const total = parseFloat(bill.total || bill.grand_total || 0);
  const paid = parseFloat(bill.amount_paid || 0);

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`${theme.bgCard} rounded-xl ${theme.shadow} max-w-md w-full max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 flex justify-between items-center rounded-t-xl sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <DollarSign className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Make Payment</h2>
              <p className="text-sm text-white/80">
                Pay to {bill.supplier_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Bill Summary */}
          <div
            className={`p-4 rounded-lg border ${theme.borderSecondary} bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm ${theme.textTertiary}`}>
                Bill Number:
              </span>
              <span className={`font-semibold ${theme.textPrimary}`}>
                {bill.bill_number || bill.purchase_number}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm ${theme.textTertiary}`}>
                Total Amount:
              </span>
              <span className={`font-semibold ${theme.textPrimary}`}>
                {formatCurrency(total)}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm ${theme.textTertiary}`}>Paid:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(paid)}
              </span>
            </div>
            <div
              className={`flex justify-between items-center pt-2 border-t ${theme.borderSecondary}`}
            >
              <span className={`text-sm font-semibold ${theme.textPrimary}`}>
                Balance Due:
              </span>
              <span className="text-lg font-bold text-red-600">
                {formatCurrency(balance)}
              </span>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
            >
              Payment Amount *
            </label>
            <div className="relative">
              <DollarSign
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                inputMode="decimal"
                name="amount"
                value={formData.amount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
                    handleChange(e);
                  }
                }}
                required
                className={`w-full pl-10 pr-4 py-2 border ${theme.borderSecondary} ${theme.bgInput} ${theme.textPrimary} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                placeholder="0.00"
              />
            </div>
            <p className={`mt-1 text-xs ${theme.textTertiary}`}>
              Maximum: {formatCurrency(balance)}
            </p>
          </div>

          {/* Payment Date */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
            >
              Payment Date *
            </label>
            <div className="relative">
              <Calendar
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="date"
                name="payment_date"
                value={formData.payment_date}
                onChange={handleChange}
                required
                className={`w-full pl-10 pr-4 py-2 border ${theme.borderSecondary} ${theme.bgInput} ${theme.textPrimary} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
            >
              Payment Method *
            </label>
            <div className="relative">
              <CreditCard
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <select
                name="method"
                value={formData.method}
                onChange={handleChange}
                required
                className={`w-full pl-10 pr-4 py-2 border ${theme.borderSecondary} ${theme.bgInput} ${theme.textPrimary} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none`}
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="card">Card</option>
              </select>
            </div>
          </div>

          {/* Reference */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
            >
              Payment Reference
            </label>
            <input
              type="text"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${theme.borderSecondary} ${theme.bgInput} ${theme.textPrimary} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              placeholder="Payment reference or transaction ID"
            />
          </div>

          {/* Notes */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
            >
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className={`w-full px-4 py-2 border ${theme.borderSecondary} ${theme.bgInput} ${theme.textPrimary} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              placeholder="Additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 border ${theme.borderSecondary} ${theme.textPrimary} rounded-lg ${theme.bgHover} transition`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : "Make Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MakeSupplierPaymentModal;
