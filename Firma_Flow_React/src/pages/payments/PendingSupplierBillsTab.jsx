import { useState } from "react";
import { Eye, DollarSign } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";
import MakeSupplierPaymentModal from "./MakeSupplierPaymentModal";

// eslint-disable-next-line no-unused-vars
const PendingSupplierBillsTab = ({ bills, onRefresh, searchQuery }) => {
  const { theme } = useTheme();
  const { formatCurrency, formatDate } = useSettings();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  // Filter bills based on search query
  const filteredBills = bills.filter((bill) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      bill.bill_number?.toLowerCase().includes(query) ||
      bill.purchase_number?.toLowerCase().includes(query) ||
      bill.supplier_name?.toLowerCase().includes(query) ||
      bill.total?.toString().includes(query)
    );
  });

  if (!filteredBills || filteredBills.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className={`text-lg ${theme.textSecondary}`}>
          No pending supplier bills found. All bills have been paid!
        </p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "unpaid":
        return "bg-red-100 text-red-700";
      case "partial":
        return "bg-yellow-100 text-yellow-700";
      case "overdue":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const calculateBalance = (bill) => {
    const total = parseFloat(bill.total || bill.grand_total || 0);
    const paid = parseFloat(bill.amount_paid || 0);
    return total - paid;
  };

  const handlePay = (bill) => {
    setSelectedBill(bill);
    setShowPaymentModal(true);
  };

  const handleViewBill = (bill) => {
    // Navigate to purchase view or open modal
    window.open(`/purchases/${bill.id}`, "_blank");
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedBill(null);
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr
            className={`bg-gradient-to-r ${
              theme.mode === "light"
                ? "from-slate-50 to-slate-100"
                : "from-slate-700 to-slate-600"
            } border-b-2 ${theme.borderSecondary}`}
          >
            <th
              className={`text-left p-4 font-semibold text-sm ${theme.textPrimary}`}
            >
              Bill #
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Supplier
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Bill Date
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Due Date
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Total
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Paid
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Balance
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Status
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredBills.map((bill, index) => (
            <tr
              key={bill.id || index}
              className={`border-b ${theme.borderPrimary} ${
                theme.mode === "light"
                  ? "hover:bg-slate-50"
                  : "hover:bg-slate-700"
              } transition text-sm`}
            >
              <td className={`p-4 ${theme.textPrimary} font-medium`}>
                {bill.bill_number || bill.purchase_number || "N/A"}
              </td>
              <td className={`p-4 ${theme.textSecondary}`}>
                {bill.supplier_name || "N/A"}
              </td>
              <td className={`p-4 ${theme.textSecondary}`}>
                {formatDate(bill.bill_date || bill.purchase_date)}
              </td>
              <td className={`p-4 ${theme.textSecondary}`}>
                {formatDate(bill.due_date)}
              </td>
              <td className={`p-4 ${theme.textPrimary} font-semibold`}>
                {formatCurrency(bill.total || bill.grand_total || 0)}
              </td>
              <td className={`p-4 ${theme.textSecondary}`}>
                {formatCurrency(bill.amount_paid || 0)}
              </td>
              <td className={`p-4 ${theme.textPrimary}`}>
                {formatCurrency(calculateBalance(bill))}
              </td>
              <td className={`p-4`}>
                <span
                  className={`inline-block px-2 py-1 text-xs rounded ${getStatusColor(
                    bill.status
                  )}`}
                >
                  {bill.status
                    ? bill.status.charAt(0).toUpperCase() + bill.status.slice(1)
                    : "Unpaid"}
                </span>
              </td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewBill(bill)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                    title="View Bill"
                  >
                    <Eye size={18} className={theme.textSecondary} />
                  </button>
                  <button
                    onClick={() => handlePay(bill)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white text-sm font-medium rounded-lg hover:opacity-90 transition shadow-sm"
                  >
                    <DollarSign size={16} />
                    Pay
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Make Payment Modal */}
      <MakeSupplierPaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedBill(null);
        }}
        bill={selectedBill}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default PendingSupplierBillsTab;
