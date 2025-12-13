import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";
import PurchaseActions from "./PurchaseActions";

const PurchasesTable = ({ purchases, onRefresh }) => {
  const { theme } = useTheme();
  const { formatCurrency, formatDate } = useSettings();

  if (!purchases || purchases.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className={`text-lg ${theme.textSecondary}`}>
          No purchases found. Record your first purchase to get started.
        </p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-700";
      case "received":
        return "bg-blue-100 text-blue-700";
      case "partial":
        return "bg-yellow-100 text-yellow-700";
      case "unpaid":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
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
              Reference #
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Supplier
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Date
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Amount
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
          {purchases.map((purchase, index) => (
            <tr
              key={purchase.id || index}
              className={`border-b ${theme.borderPrimary} ${
                theme.mode === "light"
                  ? "hover:bg-slate-50"
                  : "hover:bg-slate-700"
              } transition text-sm`}
            >
              <td className={`p-4 ${theme.textPrimary} font-medium`}>
                {purchase.reference || "N/A"}
              </td>
              <td className={`p-4 ${theme.textSecondary}`}>
                {purchase.supplier_name || "N/A"}
              </td>
              <td className={`p-4 ${theme.textSecondary}`}>
                {formatDate(purchase.bill_date)}
              </td>
              <td className={`p-4 ${theme.textPrimary} font-semibold`}>
                {formatCurrency(purchase.total || 0)}
              </td>
              <td className="p-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                    purchase.status
                  )}`}
                >
                  {purchase.status || "Received"}
                </span>
              </td>
              <td className="p-4">
                <PurchaseActions purchase={purchase} onRefresh={onRefresh} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PurchasesTable;
