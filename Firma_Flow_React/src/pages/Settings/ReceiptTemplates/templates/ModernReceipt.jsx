const ModernReceipt = ({ color = "#667eea", companyInfo, receiptData }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  return (
    <div
      className="bg-white p-3 sm:p-4 md:p-6 mx-auto shadow-lg print:p-6"
      style={{
        width: "100%",
        maxWidth: "400px",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
        pageBreakInside: "avoid",
      }}
    >
      {/* Modern Header */}
      <div
        className="text-center mb-3 sm:mb-4 md:mb-6 pb-3 sm:pb-4 print:mb-6 print:pb-4"
        style={{ borderBottom: `3px solid ${color}` }}
      >
        <h2
          className="text-base sm:text-lg md:text-xl font-bold print:text-xl"
          style={{ color }}
        >
          {companyInfo?.name || "Company Name"}
        </h2>
        <p className="text-gray-600 text-[10px] sm:text-xs mt-1 print:text-xs">
          {companyInfo?.address}
        </p>
        <p className="text-gray-600 text-[10px] sm:text-xs print:text-xs">
          {companyInfo?.city} • {companyInfo?.phone}
        </p>
      </div>

      {/* Receipt Title */}
      <div className="text-center mb-3 sm:mb-4 print:mb-4">
        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 print:text-lg">
          PAYMENT RECEIPT
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 mt-1 print:text-sm">
          #{receiptData?.receiptNumber}
        </p>
      </div>

      {/* Receipt Details */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm mb-3 sm:mb-4 bg-gray-50 p-2 sm:p-3 rounded print:gap-3 print:text-sm print:mb-4 print:p-3">
        <div>
          <p className="text-gray-500 text-[10px] sm:text-xs print:text-xs">
            Date
          </p>
          <p className="font-semibold text-gray-800 text-xs sm:text-sm print:text-sm">
            {receiptData?.date}
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-[10px] sm:text-xs print:text-xs">
            Time
          </p>
          <p className="font-semibold text-gray-800 text-xs sm:text-sm print:text-sm">
            {receiptData?.time}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="overflow-x-auto mb-3 sm:mb-4 print:mb-4">
        <table className="w-full min-w-full text-xs sm:text-sm print:text-sm">
          <thead>
            <tr style={{ backgroundColor: `${color}15` }}>
              <th
                className="text-left p-1.5 sm:p-2 text-[10px] sm:text-xs print:p-2 print:text-xs"
                style={{ color }}
              >
                Item
              </th>
              <th
                className="text-center p-1.5 sm:p-2 text-[10px] sm:text-xs print:p-2 print:text-xs"
                style={{ color }}
              >
                Qty
              </th>
              <th
                className="text-right p-1.5 sm:p-2 text-[10px] sm:text-xs print:p-2 print:text-xs"
                style={{ color }}
              >
                Price
              </th>
              <th
                className="text-right p-1.5 sm:p-2 text-[10px] sm:text-xs print:p-2 print:text-xs"
                style={{ color }}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {receiptData?.items?.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="p-1.5 sm:p-2 text-gray-800 text-xs sm:text-sm print:p-2 print:text-sm">
                  {item.name}
                </td>
                <td className="p-1.5 sm:p-2 text-center text-gray-800 text-xs sm:text-sm print:p-2 print:text-sm">
                  {item.quantity}
                </td>
                <td className="p-1.5 sm:p-2 text-right text-gray-600 text-xs sm:text-sm print:p-2 print:text-sm">
                  {formatCurrency(item.price)}
                </td>
                <td className="p-1.5 sm:p-2 text-right text-gray-800 font-semibold text-xs sm:text-sm print:p-2 print:text-sm">
                  {formatCurrency(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div
        className="border-t-2 pt-2 sm:pt-3 mb-3 sm:mb-4 print:pt-3 print:mb-4"
        style={{ borderColor: color }}
      >
        <div className="flex justify-between text-xs sm:text-sm mb-1 print:text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="text-gray-800">
            {formatCurrency(receiptData?.subtotal)}
          </span>
        </div>
        {receiptData?.discount > 0 && (
          <div className="flex justify-between text-xs sm:text-sm mb-1 print:text-sm">
            <span className="text-gray-600">Discount:</span>
            <span className="text-red-600">
              -{formatCurrency(receiptData?.discount)}
            </span>
          </div>
        )}
        {receiptData?.tax > 0 && (
          <div className="flex justify-between text-xs sm:text-sm mb-1 print:text-sm">
            <span className="text-gray-600">Tax (7.5%):</span>
            <span className="text-gray-800">
              {formatCurrency(receiptData?.tax)}
            </span>
          </div>
        )}
        <div
          className="flex justify-between text-base sm:text-lg font-bold mt-2 pt-2 border-t print:text-lg"
          style={{ borderColor: `${color}50` }}
        >
          <span style={{ color }}>TOTAL:</span>
          <span style={{ color }}>{formatCurrency(receiptData?.total)}</span>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-gray-50 p-2 sm:p-3 rounded mb-3 sm:mb-4 text-xs sm:text-sm print:p-3 print:mb-4 print:text-sm">
        <div className="flex justify-between mb-1">
          <span className="text-gray-600">Payment Method:</span>
          <span className="font-semibold text-gray-800">
            {receiptData?.paymentMethod}
          </span>
        </div>
        <div className="flex justify-between mb-1">
          <span className="text-gray-600">Amount Paid:</span>
          <span className="font-semibold text-gray-800">
            {formatCurrency(receiptData?.amountPaid)}
          </span>
        </div>
        {receiptData?.change > 0 && (
          <div className="flex justify-between font-bold">
            <span className="text-gray-800">Change:</span>
            <span className="text-green-600">
              {formatCurrency(receiptData?.change)}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] sm:text-xs text-gray-500 pt-2 sm:pt-3 border-t border-gray-200 print:text-xs print:pt-3">
        <p className="font-semibold">Thank you for your purchase!</p>
        <p className="mt-1">Visit us again soon</p>
      </div>
    </div>
  );
};

export default ModernReceipt;
