import CustomerActions from "./CustomerActions";

const CustomerTable = ({ customers, onEdit, onDelete, onViewReport }) => {
  if (!customers || customers.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto relative">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
            <th className="text-left p-4 font-semibold text-sm text-slate-700">
              Name
            </th>
            <th className="text-left p-4 font-semibold text-slate-700  text-sm">
              Phone
            </th>
            <th className="text-left p-4 font-semibold text-slate-700 text-sm">
              Email
            </th>
            <th className="text-left p-4 font-semibold text-slate-700 text-sm">
              Address
            </th>
            <th className="text-left p-4 font-semibold text-slate-700 text-sm">
              Balance
            </th>
            <th className="text-left p-4 font-semibold text-slate-700 text-sm">
              Status
            </th>
            <th className="text-left p-4 font-semibold text-slate-700 text-sm">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer, index) => (
            <tr
              key={customer.id || index}
              className="border-b border-slate-100 hover:bg-slate-50 transition text-sm"
            >
              <td className="p-4 text-slate-800 font-medium">
                {customer.name}
              </td>
              <td className="p-4 text-slate-600">{customer.phone}</td>
              <td className="p-4 text-slate-600">{customer.email}</td>
              <td className="p-4 text-slate-600">
                {customer.billingAddress || customer.address || "N/A"}
              </td>
              <td className="p-4 text-slate-800 font-semibold">
                ₦
                {parseFloat(customer.balance || 0).toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
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
