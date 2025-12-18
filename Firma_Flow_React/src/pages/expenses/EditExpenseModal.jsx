import { useState, useEffect } from "react";
import { X, Target, Lightbulb } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";
import { buildApiUrl } from "../../config/api.config";

const EditExpenseModal = ({ isOpen, onClose, onSuccess, expense }) => {
  const { theme } = useTheme();
  const { currency } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [referenceNumber, setReferenceNumber] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Expense categories
  const expenseCategories = [
    { value: "salary_wages", label: "Salary & Wages" },
    { value: "utilities", label: "Utilities" },
    { value: "rent_lease", label: "Rent & Lease" },
    { value: "office_supplies", label: "Office Supplies" },
    { value: "professional_fees", label: "Professional Fees" },
    { value: "marketing_advertising", label: "Marketing & Advertising" },
    { value: "travel_transport", label: "Travel and Transport" },
    { value: "insurance", label: "Insurance" },
    { value: "equipment_machinery", label: "Equipment & Machinery" },
    { value: "maintenance_repairs", label: "Maintenance & Repairs" },
    { value: "others", label: "Others" },
  ];

  // Payment methods
  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "cheque", label: "Cheque" },
    { value: "card", label: "Credit Card" },
    { value: "mobile_money", label: "Mobile Money" },
  ];

  // Load expense data when modal opens
  useEffect(() => {
    if (isOpen && expense) {
      setReferenceNumber(expense.reference_number || "");
      setExpenseDate(expense.expense_date || "");
      setPayeeName(expense.payee_name || "");
      setCategory(expense.category || "");
      setDescription(expense.description || "");
      // Round amount to fix any precision errors from database
      setAmount(expense.amount ? parseFloat(expense.amount).toFixed(2) : "");
      setPaymentMethod(expense.payment_method || "cash");
      setAdditionalNotes(expense.additional_notes || "");
      setError("");
    }
  }, [isOpen, expense]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (
      !referenceNumber ||
      !expenseDate ||
      !payeeName ||
      !category ||
      !amount
    ) {
      setError("Please fill in all required fields");
      return;
    }

    if (parseFloat(amount) <= 0) {
      setError("Amount must be greater than zero");
      return;
    }

    setIsLoading(true);

    try {
      const url = buildApiUrl("api/expenses.php");

      const expenseData = {
        id: expense.id,
        reference_number: referenceNumber,
        expense_date: expenseDate,
        payee_name: payeeName,
        category: category,
        description: description,
        amount: parseFloat(parseFloat(amount).toFixed(2)),
        payment_method: paymentMethod,
        additional_notes: additionalNotes,
      };

      const response = await fetch(url, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expenseData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Failed to update expense");
      }
    } catch (err) {
      console.error("Error updating expense:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !expense) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`${theme.bgCard} rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto ${theme.shadow}`}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Edit Expense</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
              disabled={isLoading}
            >
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Row 1: Reference Number + Expense Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${theme.textPrimary}`}
              >
                Reference Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className={`w-full ${theme.bgInput} ${theme.textPrimary} border ${theme.borderSecondary} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent transition`}
                required
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-2 ${theme.textPrimary}`}
              >
                Expense Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className={`w-full ${theme.bgInput} ${theme.textPrimary} border ${theme.borderSecondary} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent transition`}
                required
              />
            </div>
          </div>

          {/* Row 2: Payee Name + Expense Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${theme.textPrimary}`}
              >
                Payee Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                placeholder="Enter payee name"
                className={`w-full ${theme.bgInput} ${theme.textPrimary} border ${theme.borderSecondary} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent transition`}
                required
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-2 ${theme.textPrimary}`}
              >
                Expense Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full ${theme.bgInput} ${theme.textPrimary} border ${theme.borderSecondary} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent transition`}
                required
              >
                <option value="">Select category</option>
                {expenseCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Smart Defaults Info Box */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Target className="text-green-600 flex-shrink-0 mt-1" size={20} />
              <div>
                <h3 className="text-green-900 font-semibold mb-2">
                  🎯 Smart Defaults: Automatic Account Management
                </h3>
                <p className="text-green-800 text-sm leading-relaxed">
                  Accounts are resolved automatically based on your expense
                  category and payment method:
                </p>
                <ul className="text-green-800 text-sm mt-2 space-y-1 list-disc list-inside">
                  <li>
                    <strong>Expense Account:</strong> Determined by expense
                    category (Office Supplies, Travel, etc.)
                  </li>
                  <li>
                    <strong>Payment Account:</strong> Determined by payment
                    method (Cash, Bank, Card)
                  </li>
                </ul>
                <p className="text-green-800 text-sm mt-2 font-medium">
                  No account selection required - balanced journal entries
                  created automatically!
                </p>
              </div>
            </div>
          </div>

          {/* Row 3: Description */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${theme.textPrimary}`}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter expense description"
              rows={3}
              className={`w-full ${theme.bgInput} ${theme.textPrimary} border ${theme.borderSecondary} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent transition resize-none`}
            />
          </div>

          {/* Row 4: Amount + Payment Method */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${theme.textPrimary}`}
              >
                Amount ({currency}) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty, numbers, and decimal point
                  if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
                    setAmount(value);
                  }
                }}
                placeholder="0.00"
                className={`w-full ${theme.bgInput} ${theme.textPrimary} border ${theme.borderSecondary} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent transition`}
                required
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-2 ${theme.textPrimary}`}
              >
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={`w-full ${theme.bgInput} ${theme.textPrimary} border ${theme.borderSecondary} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent transition`}
                required
              >
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 5: Additional Notes */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${theme.textPrimary}`}
            >
              Additional Notes
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Any additional notes or comments"
              rows={3}
              className={`w-full ${theme.bgInput} ${theme.textPrimary} border ${theme.borderSecondary} rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent transition resize-none`}
            />
          </div>

          {/* Accounting Flow Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lightbulb
                className="text-blue-600 flex-shrink-0 mt-1"
                size={20}
              />
              <div>
                <h3 className="text-blue-900 font-semibold mb-2">
                  Accounting Flow
                </h3>
                <p className="text-blue-800 text-sm leading-relaxed mb-2">
                  When you update this expense, journal entries will be adjusted
                  accordingly:
                </p>
                <ul className="text-blue-800 text-sm space-y-1 list-disc list-inside">
                  <li>
                    <strong>Debit:</strong> Selected Expense Account (increases
                    expense)
                  </li>
                  <li>
                    <strong>Credit:</strong> Selected Payment Account (decreases
                    cash/bank)
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-2 ${theme.bgSecondary} ${theme.textPrimary} rounded-lg hover:opacity-80 transition`}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Updating..." : "Update Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExpenseModal;
