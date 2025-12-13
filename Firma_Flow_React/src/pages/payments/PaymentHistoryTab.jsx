import PaymentActions from "./PaymentActions";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";

const PaymentHistoryTab = ({ payments, onRefresh, searchQuery }) => {
  const { theme } = useTheme();
  const { formatCurrency, formatDate } = useSettings();

  // Filter payments based on search query
  const filteredPayments = payments.filter((payment) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      payment.reference?.toLowerCase().includes(query) ||
      payment.entity_name?.toLowerCase().includes(query) ||
      payment.amount?.toString().includes(query) ||
      payment.method?.toLowerCase().includes(query)
    );
  });

  if (!filteredPayments || filteredPayments.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className={`text-lg ${theme.textSecondary}`}>
          No payments found. Payments will appear here when recorded.
        </p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "partial":
        return "bg-orange-100 text-orange-700";
      case "failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case "received":
        return "bg-green-100 text-green-700";
      case "sent":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getMethodColor = (method) => {
    switch (method?.toLowerCase()) {
      case "cash":
        return "bg-emerald-100 text-emerald-700";
      case "transfer":
      case "bank_transfer":
        return "bg-blue-100 text-blue-700";
      case "card":
        return "bg-purple-100 text-purple-700";
      case "cheque":
      case "check":
        return "bg-amber-100 text-amber-700";
      case "mobile":
      case "mobile_money":
        return "bg-pink-100 text-pink-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const formatMethod = (method) => {
    if (!method) return "N/A";
    return method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
              Date
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Reference
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Party
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Type
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Amount
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Method
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Status
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Receipt
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredPayments.map((payment, index) => (
            <tr
              key={payment.id || index}
              className={`border-b ${theme.borderPrimary} ${
                theme.mode === "light"
                  ? "hover:bg-slate-50"
                  : "hover:bg-slate-700"
              } transition text-sm`}
            >
              <td className={`p-4 ${theme.textSecondary}`}>
                {formatDate(payment.payment_date)}
              </td>
              <td className={`p-4 ${theme.textPrimary} font-medium`}>
                {payment.reference || "N/A"}
              </td>
              <td className={`p-4 ${theme.textSecondary}`}>
                {payment.entity_name || "N/A"}
              </td>
              <td className="p-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getTypeColor(
                    payment.type
                  )}`}
                >
                  {payment.type || "N/A"}
                </span>
              </td>
              <td className={`p-4 ${theme.textPrimary} font-semibold`}>
                {formatCurrency(payment.amount || 0)}
              </td>
              <td className="p-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getMethodColor(
                    payment.method
                  )}`}
                >
                  {formatMethod(payment.method)}
                </span>
              </td>
              <td className="p-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                    payment.status
                  )}`}
                >
                  {payment.status || "Pending"}
                </span>
              </td>
              <td className={`p-4 ${theme.textSecondary}`}>
                {payment.receipt_path ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="p-4">
                <PaymentActions payment={payment} onRefresh={onRefresh} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentHistoryTab;
