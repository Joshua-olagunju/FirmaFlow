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

const SupplierReportModal = ({ supplier, onClose }) => {
  const [invoiceFilter, setInvoiceFilter] = useState("30days");
  const [paymentFilter, setPaymentFilter] = useState("30days");

  if (!supplier) return null;

  // Mock data - replace with actual API calls
  const stats = {
    totalSpending: supplier.balance || 0,
    totalPayments: 0,
    balance: supplier.balance || 0,
    creditLimit: 0,
  };

  const invoices = [
    // Example data - replace with actual invoice data from API
    // { date: "2024-01-15", invoiceNumber: "PO-001", description: "Product A", amount: 5000, paid: 5000, status: "Paid" },
  ];

  const payments = [
    // Example data - replace with actual payment data from API
    // { date: "2024-01-15", method: "Bank Transfer", reference: "TXN-001", amount: 5000, status: "Paid" },
  ];

  const handleExportPDF = () => {
    exportToPDF(supplier, invoices, payments, stats);
  };

  const handlePrint = () => {
    printPDF(supplier, invoices, payments, stats);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white p-6 rounded-t-xl flex items-center justify-between z-[60]">
          <div>
            <h2 className="text-2xl font-bold">Supplier Report</h2>
            <p className="text-white/80 text-sm mt-1">{supplier.companyName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Supplier Info Row */}
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Contact Person:</span>
              <p className="font-medium text-slate-700">
                {supplier.contactPerson || "N/A"}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Email:</span>
              <p className="font-medium text-slate-700">
                {supplier.email || "N/A"}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Phone:</span>
              <p className="font-medium text-slate-700">
                {supplier.phone || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Purchases */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-purple-600" size={24} />
              <span className="text-xs text-purple-600 font-semibold">
                PURCHASES
              </span>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              ₦{stats.totalSpending.toLocaleString()}
            </p>
            <p className="text-xs text-purple-600 mt-1">Total Purchases</p>
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
            <p className="text-xs text-blue-600 mt-1">Amount Due</p>
          </div>

          {/* Status */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="text-orange-600" size={24} />
              <span className="text-xs text-orange-600 font-semibold">
                STATUS
              </span>
            </div>
            <p className="text-2xl font-bold text-orange-900">
              {supplier.status}
            </p>
            <p className="text-xs text-orange-600 mt-1">Supplier Status</p>
          </div>
        </div>

        {/* Supplier Details Section */}
        <div className="p-6 border-t border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Supplier Details
          </h3>

          {/* Force ALWAYS 2 per row */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
            <div>
              <p className="text-xs text-slate-500 mb-1">Company Name</p>
              <p className="font-medium text-slate-700">
                {supplier.companyName || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1">Contact Person</p>
              <p className="font-medium text-slate-700">
                {supplier.contactPerson || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1">Payment Terms</p>
              <p className="font-medium text-slate-700">
                {supplier.paymentTerms || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1">Tax Number</p>
              <p className="font-medium text-slate-700">
                {supplier.taxNumber || "N/A"}
              </p>
            </div>

            <div className="col-span-2">
              <p className="text-xs text-slate-500 mb-1">Address</p>
              <p className="font-medium text-slate-700">
                {supplier.address || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Purchase History */}
        <div className="p-6 border-t border-slate-200">
          <InvoiceHistory
            invoices={invoices}
            selectedFilter={invoiceFilter}
            onFilterChange={setInvoiceFilter}
            title="Purchase History"
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

export default SupplierReportModal;
