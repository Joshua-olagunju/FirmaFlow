import DateFilter from "./DateFilter";

const InvoiceHistory = ({ invoices, selectedFilter, onFilterChange }) => {
  // Calculate totals
  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paid || 0), 0);

  // Determine combined status
  const getCombinedStatus = () => {
    if (invoices.length === 0) return null;
    if (totalAmount === totalPaid)
      return { label: "All Paid", color: "bg-green-100 text-green-700" };
    if (totalPaid > 0)
      return { label: "Partial", color: "bg-blue-100 text-blue-700" };
    return { label: "Unpaid", color: "bg-red-100 text-red-700" };
  };

  const combinedStatus = getCombinedStatus();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800">
          Invoice History
        </h3>
        <DateFilter
          selectedFilter={selectedFilter}
          onFilterChange={onFilterChange}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left p-3 text-xs font-semibold text-slate-600">
                Date
              </th>
              <th className="text-left p-3 text-xs font-semibold text-slate-600">
                Invoice #
              </th>
              <th className="text-left p-3 text-xs font-semibold text-slate-600">
                Description
              </th>
              <th className="text-right p-3 text-xs font-semibold text-slate-600">
                Amount
              </th>
              <th className="text-right p-3 text-xs font-semibold text-slate-600">
                Paid
              </th>
              <th className="text-center p-3 text-xs font-semibold text-slate-600">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {invoices.length > 0 ? (
              <>
                {invoices.map((invoice, index) => (
                  <tr
                    key={index}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="p-3 text-sm text-slate-600">
                      {invoice.date}
                    </td>
                    <td className="p-3 text-sm text-slate-700 font-medium">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="p-3 text-sm text-slate-600">
                      {invoice.description}
                    </td>
                    <td className="p-3 text-sm text-slate-700 font-medium text-right">
                      ₦{invoice.amount.toLocaleString()}
                    </td>
                    <td className="p-3 text-sm text-slate-700 font-medium text-right">
                      ₦{invoice.paid.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                          invoice.status === "Paid"
                            ? "bg-green-100 text-green-700"
                            : invoice.status === "Partial"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Totals Row */}
                <tr className="bg-slate-100 border-t-2 border-slate-300 font-semibold">
                  <td colSpan="3" className="p-3 text-sm text-slate-800">
                    Invoice Totals
                  </td>
                  <td className="p-3 text-sm text-slate-800 text-right">
                    ₦{totalAmount.toLocaleString()}
                  </td>
                  <td className="p-3 text-sm text-slate-800 text-right">
                    ₦{totalPaid.toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    {combinedStatus && (
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${combinedStatus.color}`}
                      >
                        {combinedStatus.label}
                      </span>
                    )}
                  </td>
                </tr>
              </>
            ) : (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">
                  No invoices found for this customer
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceHistory;
