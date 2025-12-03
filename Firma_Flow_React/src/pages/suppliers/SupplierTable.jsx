import SupplierActions from "./SupplierActions";

const SupplierTable = ({ suppliers, onEdit, onDelete, onViewReport }) => {
  if (!suppliers || suppliers.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto relative">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
            <th className="text-left p-4 font-semibold text-sm text-slate-700">
              Supplier Name
            </th>
            <th className="text-left p-4 font-semibold text-slate-700 text-sm">
              Contact Person
            </th>
            <th className="text-left p-4 font-semibold text-slate-700 text-sm">
              Phone Number
            </th>
            <th className="text-left p-4 font-semibold text-slate-700 text-sm">
              Email Address
            </th>
            <th className="text-left p-4 font-semibold text-slate-700 text-sm">
              Balance Due
            </th>
            <th className="text-left p-4 font-semibold text-slate-700 text-sm">
              Status
            </th>
            <th className="text-left p-4 font-semibold text-slate-700 text-sm">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier, index) => (
            <tr
              key={supplier.id || index}
              className="border-b border-slate-100 hover:bg-slate-50 transition text-sm"
            >
              <td className="p-4 text-slate-800 font-medium">
                {supplier.companyName}
              </td>
              <td className="p-4 text-slate-600">
                {supplier.contactPerson || "N/A"}
              </td>
              <td className="p-4 text-slate-600">{supplier.phone}</td>
              <td className="p-4 text-slate-600">{supplier.email}</td>
              <td className="p-4 text-slate-800 font-semibold">
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
