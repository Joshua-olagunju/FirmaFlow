import { useState, useEffect, useRef } from "react";
import { X, Upload, Info, CreditCard } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";
import { buildApiUrl } from "../../config/api.config";

const PayInvoiceModal = ({ isOpen, onClose, onSuccess, invoice }) => {
  const { theme } = useTheme();
  const { formatCurrency, formatDate } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // Form state
  const [paymentReference, setPaymentReference] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [description, setDescription] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptFileName, setReceiptFileName] = useState("");

  // Calculate balance
  const invoiceTotal = parseFloat(invoice?.total || 0);
  const amountPaid = parseFloat(invoice?.amount_paid || 0);
  const balance = invoiceTotal - amountPaid;

  // Payment methods
  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "cheque", label: "Cheque" },
    { value: "card", label: "Card Payment" },
    { value: "mobile_money", label: "Mobile Money" },
  ];

  // Generate payment reference when modal opens
  useEffect(() => {
    if (isOpen) {
      generatePaymentReference();
      // Set default amount to remaining balance
      setAmount(balance.toFixed(2));
    }
  }, [isOpen, balance]);

  const generatePaymentReference = async () => {
    try {
      // Fetch existing payments to generate next reference
      const response = await fetch(buildApiUrl("api/payments.php"), {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        // Find the highest PAY number
        let maxNum = 0;
        data.forEach((payment) => {
          if (payment.reference && payment.reference.startsWith("PAY")) {
            const num = parseInt(payment.reference.replace("PAY", ""), 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        });
        const nextNum = maxNum + 1;
        setPaymentReference(`PAY-${String(nextNum).padStart(3, "0")}`);
      } else {
        setPaymentReference("PAY-001");
      }
    } catch {
      // Fallback
      setPaymentReference(
        `PAY-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`
      );
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        setError(
          "Invalid file type. Only JPG, PNG, and PDF files are allowed."
        );
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size too large. Maximum size is 5MB.");
        return;
      }

      setReceiptFile(file);
      setReceiptFileName(file.name);
      setError("");
    }
  };

  const handleRemoveFile = () => {
    setReceiptFile(null);
    setReceiptFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      setError("Please enter a valid payment amount");
      return;
    }

    if (paymentAmount > balance) {
      setError(
        `Payment amount cannot exceed the balance of ${formatCurrency(balance)}`
      );
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("reference_type", "customer");
      formData.append("reference_id", invoice.customer_id);
      formData.append("amount", paymentAmount);
      formData.append("payment_method", paymentMethod);
      formData.append("payment_date", new Date().toISOString().split("T")[0]);
      formData.append("notes", description);
      formData.append("invoice_id", invoice.id);
      formData.append("reference", paymentReference.replace("-", ""));

      if (receiptFile) {
        formData.append("receipt", receiptFile);
      }

      const response = await fetch(buildApiUrl("api/payments.php"), {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && (data.success || data.id)) {
        onSuccess?.();
        onClose();
      } else {
        setError(data.error || data.message || "Failed to record payment");
      }
    } catch (err) {
      console.error("Error recording payment:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${theme.bgCard} rounded-xl ${theme.shadow} max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 flex justify-between items-center rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <CreditCard className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Pay Invoice</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 overflow-y-auto flex-1"
        >
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
                ? "bg-gradient-to-r from-blue-50 to-indigo-50"
                : "bg-slate-700/50"
            } border ${theme.borderPrimary} rounded-lg p-4`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Info size={16} className="text-blue-600" />
              <span className={`text-sm font-medium ${theme.textSecondary}`}>
                Invoice Details
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
                <p className={`text-xs ${theme.textSecondary}`}>Total Amount</p>
                <p className={`text-sm font-bold ${theme.textPrimary}`}>
                  {formatCurrency(invoiceTotal)}
                </p>
              </div>
              <div>
                <p className={`text-xs ${theme.textSecondary}`}>Amount Paid</p>
                <p className={`text-sm font-semibold text-green-600`}>
                  {formatCurrency(amountPaid)}
                </p>
              </div>
              <div>
                <p className={`text-xs ${theme.textSecondary}`}>Balance Due</p>
                <p className={`text-sm font-bold text-red-600`}>
                  {formatCurrency(balance)}
                </p>
              </div>
            </div>
          </div>

          {/* Read-only Fields Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Payment Type */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Payment Type
              </label>
              <div
                className={`px-4 py-2.5 border ${theme.borderPrimary} rounded-lg ${theme.bgAccent} ${theme.textSecondary}`}
              >
                Customer Payment
              </div>
            </div>

            {/* Date */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Date
              </label>
              <div
                className={`px-4 py-2.5 border ${theme.borderPrimary} rounded-lg ${theme.bgAccent} ${theme.textSecondary}`}
              >
                {formatDate(new Date())}
              </div>
            </div>
          </div>

          {/* Customer Name & Reference Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Customer Name */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Customer Name
              </label>
              <div
                className={`px-4 py-2.5 border ${theme.borderPrimary} rounded-lg ${theme.bgAccent} ${theme.textSecondary}`}
              >
                {invoice?.customer_name || "N/A"}
              </div>
            </div>

            {/* Reference Number */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Reference Number
              </label>
              <div
                className={`px-4 py-2.5 border ${theme.borderPrimary} rounded-lg ${theme.bgAccent} ${theme.textSecondary} font-mono`}
              >
                {paymentReference || "Generating..."}
              </div>
            </div>
          </div>

          {/* Amount & Payment Method Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
                    setAmount(value);
                  }
                }}
                placeholder="Enter amount"
                required
                className={`w-full px-4 py-2.5 border ${theme.borderPrimary} rounded-lg ${theme.bgInput} ${theme.textPrimary} focus:ring-2 focus:ring-[#667eea] focus:border-transparent`}
              />
              <p className={`text-xs ${theme.textSecondary} mt-1`}>
                Max: {formatCurrency(balance)}
              </p>
            </div>

            {/* Payment Method */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                required
                className={`w-full px-4 py-2.5 border ${theme.borderPrimary} rounded-lg ${theme.bgInput} ${theme.textPrimary} focus:ring-2 focus:ring-[#667eea] focus:border-transparent`}
              >
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add any notes about this payment..."
              className={`w-full px-4 py-2.5 border ${theme.borderPrimary} rounded-lg ${theme.bgInput} ${theme.textPrimary} focus:ring-2 focus:ring-[#667eea] focus:border-transparent resize-none`}
            />
          </div>

          {/* Upload Receipt */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
            >
              Upload Receipt (Optional)
            </label>
            <div
              className={`border-2 border-dashed ${theme.borderPrimary} rounded-lg p-4 text-center ${theme.bgAccent} hover:border-[#667eea] transition cursor-pointer`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              {receiptFileName ? (
                <div className="flex items-center justify-center gap-2">
                  <span className={`text-sm ${theme.textPrimary}`}>
                    {receiptFileName}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <Upload
                    size={24}
                    className={`mx-auto mb-2 ${theme.textTertiary}`}
                  />
                  <p className={`text-sm ${theme.textSecondary}`}>
                    Click to choose file
                  </p>
                </>
              )}
            </div>
            <p className={`text-xs ${theme.textTertiary} mt-1`}>
              Supported formats: JPG, PNG, PDF (Max 5MB)
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
              className={`flex-1 px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg hover:opacity-90 transition font-medium shadow-lg ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Processing..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayInvoiceModal;
