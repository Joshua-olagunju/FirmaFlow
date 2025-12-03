import SupplierActions from "./SupplierActions";
import { useTheme } from "../../contexts/ThemeContext";

const SupplierTable = ({ suppliers, onEdit, onDelete, onViewReport }) => {
  const { theme } = useTheme();
  if (!suppliers || suppliers.length === 0) {
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
              Supplier Name
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Contact Person
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Phone Number
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Email Address
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Balance Due
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
          {suppliers.map((supplier, index) => (
            <tr
              key={supplier.id || index}
              className={`border-b ${theme.borderPrimary} ${
                theme.mode === "light"
                  ? "hover:bg-slate-50"
                  : "hover:bg-slate-700"
              } transition text-sm`}
            >
              <td className={`p-4 ${theme.textPrimary} font-medium`}>
                {supplier.companyName}
              </td>
              <td className={`p-4 ${theme.textSecondary}`}>
                {supplier.contactPerson || "N/A"}
              </td>
              <td className={`p-4 ${theme.textSecondary}`}>{supplier.phone}</td>
              <td className={`p-4 ${theme.textSecondary}`}>{supplier.email}</td>
              <td className={`p-4 ${theme.textPrimary} font-semibold`}>
                ₦
                {parseFloat(supplier.balance || 0).toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </td>
              <td className="p-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    supplier.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {supplier.status}
                </span>
              </td>
              <td className="p-4">
                <SupplierActions
                  supplier={supplier}
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

export default SupplierTable;
