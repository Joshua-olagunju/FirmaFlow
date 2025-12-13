const ClassicReceipt = ({ color = "#667eea", companyInfo, receiptData }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  return (
    <div
      className="bg-white p-3 sm:p-4 md:p-6 print:p-6 mx-auto border-4 border-double"
      style={{
        width: "100%",
        maxWidth: "400px",
        borderColor: color,
        fontFamily: "Georgia, serif",
        boxSizing: "border-box",
        pageBreakInside: "avoid",
      }}
    >
      {/* Classic Header */}
      <div
        className="text-center mb-3 sm:mb-4 md:mb-5 print:mb-5 pb-3 sm:pb-4 print:pb-4 border-b-2"
        style={{ borderColor: color }}
      >
        <h1
          className="text-lg sm:text-xl md:text-2xl print:text-2xl font-bold"
          style={{ color }}
        >
          {companyInfo?.name || "COMPANY NAME"}
        </h1>
        <p className="text-gray-700 text-[10px] sm:text-xs md:text-sm print:text-sm mt-2">
          {companyInfo?.address}
        </p>
        <p className="text-gray-700 text-[10px] sm:text-xs md:text-sm print:text-sm">
          {[companyInfo?.city, companyInfo?.state].filter(Boolean).join(", ")}
        </p>
        <p className="text-gray-700 text-[10px] sm:text-xs md:text-sm print:text-sm">
          Tel: {companyInfo?.phone}
        </p>
      </div>

      {/* Receipt Title */}
      <div className="text-center mb-3 sm:mb-4 print:mb-4">
        <h2 className="text-base sm:text-lg md:text-xl print:text-xl font-bold text-gray-800">
          RECEIPT
        </h2>
        <div
          className="w-16 h-0.5 mx-auto my-2"
          style={{ backgroundColor: color }}
        />
        <p className="text-gray-600 text-xs sm:text-sm print:text-sm">
          {receiptData?.receiptNumber}
        </p>
      </div>

      {/* Date & Time */}
      <div className="flex justify-between text-[10px] sm:text-xs md:text-sm print:text-sm mb-3 sm:mb-4 print:mb-4 pb-2 sm:pb-3 print:pb-3 border-b border-dashed border-gray-400">
        <div>
          <span className="text-gray-600">Date: </span>
          <span className="font-semibold text-gray-800">
            {receiptData?.date}
          </span>
        </div>
        <div>
          <span className="text-gray-600">Time: </span>
          <span className="font-semibold text-gray-800">
            {receiptData?.time}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="mb-3 sm:mb-4 print:mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] sm:text-xs md:text-sm print:text-sm">
            <thead>
              <tr className="border-b-2" style={{ borderColor: color }}>
                <th
                  className="text-left py-1 sm:py-2 print:py-2 font-serif"
                  style={{ color }}
                >
                  Description
                </th>
                <th
                  className="text-center py-1 sm:py-2 print:py-2 font-serif"
                  style={{ color }}
                >
                  Qty
                </th>
                <th
                  className="text-right py-1 sm:py-2 print:py-2 font-serif"
                  style={{ color }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {receiptData?.items?.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-1 sm:py-2 print:py-2 text-gray-800">
                    {item.name}
                  </td>
                  <td className="py-1 sm:py-2 print:py-2 text-center text-gray-800">
                    {item.quantity}
                  </td>
                  <td className="py-1 sm:py-2 print:py-2 text-right text-gray-800">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div
        className="border-t-2 pt-2 sm:pt-3 print:pt-3 mb-3 sm:mb-4 print:mb-4"
        style={{ borderColor: color }}
      >
        <div className="space-y-1 sm:space-y-2 print:space-y-2 text-[10px] sm:text-xs md:text-sm print:text-sm">
          <div className="flex justify-between">
            <span className="text-gray-700">Subtotal:</span>
            <span className="text-gray-800">
              {formatCurrency(receiptData?.subtotal)}
            </span>
          </div>
          {receiptData?.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-700">Discount:</span>
              <span className="text-red-600">
                -{formatCurrency(receiptData?.discount)}
              </span>
            </div>
          )}
          {receiptData?.tax > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-700">Tax:</span>
              <span className="text-gray-800">
                {formatCurrency(receiptData?.tax)}
              </span>
            </div>
          )}
          <div
            className="flex justify-between font-bold text-sm sm:text-base md:text-lg print:text-lg pt-2 border-t"
            style={{ borderColor: `${color}50` }}
          >
            <span className="text-gray-800">TOTAL:</span>
            <span style={{ color }}>{formatCurrency(receiptData?.total)}</span>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div
        className="border-2 border-dashed p-2 sm:p-3 print:p-3 mb-3 sm:mb-4 print:mb-4"
        style={{ borderColor: `${color}50` }}
      >
        <div className="text-[10px] sm:text-xs md:text-sm print:text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-700">Payment:</span>
            <span className="font-semibold text-gray-800">
              {receiptData?.paymentMethod}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Paid:</span>
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
      </div>

      {/* Footer */}
      <div
        className="text-center text-[10px] sm:text-xs md:text-sm print:text-sm border-t-2 pt-2 sm:pt-3 print:pt-3"
        style={{ borderColor: color }}
      >
        <p className="font-semibold text-gray-800">
          Thank You For Your Business!
        </p>
        <p className="text-gray-600 text-[10px] sm:text-xs print:text-xs mt-2 italic">
          We appreciate your patronage
        </p>
      </div>
    </div>
  );
};

export default ClassicReceipt;
