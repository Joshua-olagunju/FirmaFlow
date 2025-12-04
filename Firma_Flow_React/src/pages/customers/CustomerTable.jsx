import CustomerActions from "./CustomerActions";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";

const CustomerTable = ({ customers, onEdit, onDelete, onViewReport }) => {
  const { theme } = useTheme();
  const { formatCurrency } = useSettings();
  if (!customers || customers.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto relative">
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
              Name
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Phone
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Email
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Address
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
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer, index) => (
            <tr
              key={customer.id || index}
              className={`border-b ${theme.borderPrimary} ${
                theme.mode === "light"
                  ? "hover:bg-slate-50"
                  : "hover:bg-slate-700"
              } transition text-sm`}
            >
              <td className={`p-4 ${theme.textPrimary} font-medium`}>
                {customer.name}
              </td>
              <td className={`p-4 ${theme.textSecondary}`}>{customer.phone}</td>
              <td className={`p-4 ${theme.textSecondary}`}>{customer.email}</td>
              <td className={`p-4 ${theme.textSecondary}`}>
                {customer.billingAddress || customer.address || "N/A"}
              </td>
              <td className={`p-4 ${theme.textPrimary} font-semibold`}>
                {formatCurrency(customer.balance || 0)}
              </td>
              <td className="p-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    customer.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {customer.status}
                </span>
              </td>
              <td className="p-4">
                <CustomerActions
                  customer={customer}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onViewReport={onViewReport}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerTable;
