import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";

// eslint-disable-next-line no-unused-vars
const PendingSupplierBillsTab = ({ bills, onRefresh, searchQuery }) => {
  const { theme } = useTheme();
  const { formatCurrency, formatDate } = useSettings();

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
    // TODO: Implement payment modal for supplier bills
    console.log("Pay bill:", bill);
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
              <td className={`p-4 ${theme.textPrimary} font-semibold`}>
                {formatCurrency(calculateBalance(bill))}
              </td>
              <td className="p-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                    bill.status
                  )}`}
                >
                  {bill.status || "Unpaid"}
                </span>
              </td>
              <td className="p-4">
                <button
                  onClick={() => handlePay(bill)}
                  className="px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white text-sm font-medium rounded-lg hover:opacity-90 transition shadow-sm"
                >
                  Pay
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PendingSupplierBillsTab;
