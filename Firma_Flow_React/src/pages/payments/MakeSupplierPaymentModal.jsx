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
      const paymentAmount = parseFloat(formData.amount);

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

      // Create payment record
      const paymentData = {
        reference_type: "supplier",
        reference_id: bill.supplier_id,
        type: "made",
        amount: paymentAmount,
        method: formData.method,
        reference: formData.reference,
        notes: formData.notes,
        payment_date: formData.payment_date,
        invoice_id: bill.id,
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

      // Update bill payment status
      const updateResponse = await fetch(
        buildApiUrl(`api/purchases.php?id=${bill.id}`),
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount_paid: (
              parseFloat(bill.amount_paid || 0) + paymentAmount
            ).toString(),
            status: balance - paymentAmount === 0 ? "paid" : "partial",
          }),
        }
      );

      if (!updateResponse.ok) {
        console.error("Failed to update bill status");
      }

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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-black bg-opacity-50"
          onClick={onClose}
        />

        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg">
                <DollarSign size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Make Payment
                </h3>
                <p className="text-sm text-gray-500">
                  Pay to {bill.supplier_name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Bill Summary */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Bill Number:</span>
              <span className="font-semibold text-gray-900">
                {bill.bill_number || bill.purchase_number}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Total Amount:</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(total)}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Paid:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(paid)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-sm font-semibold text-gray-900">
                Balance Due:
              </span>
              <span className="text-lg font-bold text-red-600">
                {formatCurrency(balance)}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Payment Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount *
              </label>
              <div className="relative">
                <DollarSign
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0.01"
                  max={balance}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Maximum: {formatCurrency(balance)}
              </p>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Reference
              </label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Payment reference or transaction ID"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Additional notes..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
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
    </div>
  );
};

export default MakeSupplierPaymentModal;
