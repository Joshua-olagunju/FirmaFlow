import DateFilter from "./DateFilter";

const PaymentHistory = ({ payments, selectedFilter, onFilterChange }) => {
  // Calculate total payments
  const totalPayments = payments.reduce(
    (sum, pmt) => sum + (pmt.amount || 0),
    0
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800">
          Payment History
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
                Method
              </th>
              <th className="text-left p-3 text-xs font-semibold text-slate-600">
                Reference
              </th>
              <th className="text-right p-3 text-xs font-semibold text-slate-600">
                Amount
              </th>
              <th className="text-center p-3 text-xs font-semibold text-slate-600">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.length > 0 ? (
              <>
                {payments.map((payment, index) => (
                  <tr
                    key={index}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="p-3 text-sm text-slate-600">
                      {payment.date}
                    </td>
                    <td className="p-3 text-sm text-slate-700 font-medium">
                      {payment.method}
                    </td>
                    <td className="p-3 text-sm text-slate-600">
                      {payment.reference}
                    </td>
                    <td className="p-3 text-sm text-slate-700 font-medium text-right">
                      ₦{payment.amount.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                          payment.status === "Paid"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Totals Row */}
                <tr className="bg-slate-100 border-t-2 border-slate-300 font-semibold">
                  <td colSpan="3" className="p-3 text-sm text-slate-800">
                    Total Payments Made
                  </td>
                  <td className="p-3 text-sm text-slate-800 text-right">
                    ₦{totalPayments.toLocaleString()}
                  </td>
                  <td className="p-3"></td>
                </tr>
              </>
            ) : (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-400">
                  No payments found for this supplier
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentHistory;
