import { useState } from "react";
import {
  X,
  FileText,
  Printer,
  TrendingUp,
  DollarSign,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import InvoiceHistory from "./InvoiceHistory";
import PaymentHistory from "./PaymentHistory";
import { exportToPDF, printPDF } from "./pdfUtils";

const CustomerReportModal = ({ customer, onClose }) => {
  const [invoiceFilter, setInvoiceFilter] = useState("30days");
  const [paymentFilter, setPaymentFilter] = useState("30days");

  if (!customer) return null;

  // Mock data - replace with actual API calls
  const stats = {
    totalSpending: customer.balance || 0,
    totalPayments: 0,
    balance: customer.balance || 0,
    creditLimit: customer.creditLimit || 0,
  };

  const invoices = [
    // Example data - replace with actual invoice data from API
    // { date: "2024-01-15", invoiceNumber: "INV-001", description: "Product A", amount: 5000, paid: 5000, status: "Paid" },
  ];

  const payments = [
    // Example data - replace with actual payment data from API
    // { date: "2024-01-15", method: "Bank Transfer", reference: "TXN-001", amount: 5000, status: "Paid" },
  ];

  const handleExportPDF = () => {
    exportToPDF(customer, invoices, payments, stats);
  };

  const handlePrint = () => {
    printPDF(customer, invoices, payments, stats);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white p-6 rounded-t-xl flex items-center justify-between z-[60]">
          <div>
            <h2 className="text-2xl font-bold">Customer Report</h2>
            <p className="text-white/80 text-sm mt-1">{customer.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Customer Info Row */}
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Email:</span>
              <p className="font-medium text-slate-700">
                {customer.email || "N/A"}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Phone:</span>
              <p className="font-medium text-slate-700">
                {customer.phone || "N/A"}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Status:</span>
              <p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    customer.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {customer.status}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Spending */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-purple-600" size={24} />
              <span className="text-xs text-purple-600 font-semibold">
                SPENDING
              </span>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              ₦{stats.totalSpending.toLocaleString()}
            </p>
            <p className="text-xs text-purple-600 mt-1">Total Spending</p>
          </div>

          {/* Total Payments */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="text-green-600" size={24} />
              <span className="text-xs text-green-600 font-semibold">
                PAYMENTS
              </span>
            </div>
            <p className="text-2xl font-bold text-green-900">
              ₦{stats.totalPayments.toLocaleString()}
            </p>
            <p className="text-xs text-green-600 mt-1">Total Payments</p>
          </div>

          {/* Current Balance */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <CreditCard className="text-blue-600" size={24} />
              <span className="text-xs text-blue-600 font-semibold">
                BALANCE
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              ₦{stats.balance.toLocaleString()}
            </p>
            <p className="text-xs text-blue-600 mt-1">Current Balance</p>
          </div>

          {/* Credit Limit */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="text-orange-600" size={24} />
              <span className="text-xs text-orange-600 font-semibold">
                LIMIT
              </span>
            </div>
            <p className="text-2xl font-bold text-orange-900">
              ₦{stats.creditLimit.toLocaleString()}
            </p>
            <p className="text-xs text-orange-600 mt-1">Credit Limit</p>
          </div>
        </div>

        {/* Customer Details Section */}
        <div className="p-6 border-t border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Customer Details
          </h3>

          {/* Force ALWAYS 2 per row */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
            <div>
              <p className="text-xs text-slate-500 mb-1">Customer Type</p>
              <p className="font-medium text-slate-700">
                {customer.customerType || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1">Payment Terms</p>
              <p className="font-medium text-slate-700">
                {customer.paymentTerms || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1">Current Balance</p>
              <p className="font-medium text-slate-700">
                ₦{(customer.balance || 0).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1">Billing Address</p>
              <p className="font-medium text-slate-700">
                {customer.billingAddress || customer.address || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Invoice History */}
        <div className="p-6 border-t border-slate-200">
          <InvoiceHistory
            invoices={invoices}
            selectedFilter={invoiceFilter}
            onFilterChange={setInvoiceFilter}
          />
        </div>

        {/* Payment History */}
        <div className="p-6 border-t border-slate-200">
          <PaymentHistory
            payments={payments}
            selectedFilter={paymentFilter}
            onFilterChange={setPaymentFilter}
          />
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-slate-50 p-6 rounded-b-xl border-t border-slate-200 flex gap-3 justify-end z-[60]">
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition flex items-center gap-2"
          >
            <Printer size={18} />
            Print
          </button>
          <button
            onClick={handleExportPDF}
            className="px-6 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg hover:shadow-lg transition flex items-center gap-2"
          >
            <FileText size={18} />
            Export PDF
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerReportModal;
