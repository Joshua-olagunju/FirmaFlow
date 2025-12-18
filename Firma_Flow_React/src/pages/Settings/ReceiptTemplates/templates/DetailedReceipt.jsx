const DetailedReceipt = ({ color = "#667eea", companyInfo, receiptData }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  return (
    <div
      className="bg-white p-3 sm:p-4 md:p-6 lg:p-8 print:p-8 mx-auto shadow-xl"
      style={{
        width: "80mm",
        maxWidth: "80mm",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
        pageBreakInside: "avoid",
      }}
    >
      {/* Detailed Header */}
      <div
        className="mb-3 sm:mb-4 md:mb-6 print:mb-6 pb-3 sm:pb-4 md:pb-6 print:pb-6 border-b-2"
        style={{ borderColor: color }}
      >
        <div className="mb-3 sm:mb-4 print:mb-4">
          <h1
            className="text-lg sm:text-xl md:text-2xl print:text-2xl font-bold"
            style={{ color }}
          >
            {companyInfo?.name || "Company Name"}
          </h1>
          <p className="text-gray-600 text-[10px] sm:text-xs md:text-sm print:text-sm mt-1">
            {companyInfo?.email}
          </p>
        </div>
        <div className="bg-gray-50 p-2 sm:p-3 print:p-3 rounded text-[10px] sm:text-xs md:text-sm print:text-sm">
          <p className="text-gray-700">{companyInfo?.address}</p>
          <p className="text-gray-700">
            {[companyInfo?.city, companyInfo?.state].filter(Boolean).join(", ")}
          </p>
          <p className="text-gray-700">Phone: {companyInfo?.phone}</p>
        </div>
      </div>

      {/* Receipt Title Info */}
      <div className="mb-3 sm:mb-4 md:mb-6 print:mb-6">
        <div className="flex justify-between items-center mb-3 sm:mb-4 print:mb-4">
          <h2 className="text-base sm:text-lg md:text-xl print:text-xl font-bold text-gray-800">
            OFFICIAL RECEIPT
          </h2>
          <div
            className="px-2 sm:px-3 md:px-4 print:px-4 py-1 sm:py-2 print:py-2 rounded"
            style={{ backgroundColor: `${color}15`, color }}
          >
            <span className="font-bold text-sm sm:text-base md:text-lg print:text-lg">
              {receiptData?.receiptNumber}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 print:gap-4 text-[10px] sm:text-xs md:text-sm print:text-sm bg-gray-50 p-2 sm:p-3 md:p-4 print:p-4 rounded">
          <div>
            <p className="text-gray-500 text-[10px] sm:text-xs print:text-xs mb-1">
              Transaction Date
            </p>
            <p className="font-semibold text-gray-800">{receiptData?.date}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-[10px] sm:text-xs print:text-xs mb-1">
              Transaction Time
            </p>
            <p className="font-semibold text-gray-800">{receiptData?.time}</p>
          </div>
        </div>
      </div>

      {/* Detailed Items */}
      <div className="mb-3 sm:mb-4 md:mb-6 print:mb-6">
        <h3
          className="text-xs sm:text-sm print:text-sm font-bold mb-2 sm:mb-3 print:mb-3 pb-2 border-b"
          style={{ color }}
        >
          ITEMS PURCHASED
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                className="text-[10px] sm:text-xs print:text-xs"
                style={{ backgroundColor: `${color}10` }}
              >
                <th
                  className="text-left p-1 sm:p-2 print:p-2"
                  style={{ color }}
                >
                  Description
                </th>
                <th
                  className="text-center p-1 sm:p-2 print:p-2"
                  style={{ color }}
                >
                  Unit Price
                </th>
                <th
                  className="text-center p-1 sm:p-2 print:p-2"
                  style={{ color }}
                >
                  Qty
                </th>
                <th
                  className="text-right p-1 sm:p-2 print:p-2"
                  style={{ color }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="text-[10px] sm:text-xs md:text-sm print:text-sm">
              {receiptData?.items?.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="p-2 sm:p-3 print:p-3">
                    <span className="font-semibold text-gray-800">
                      {item.name}
                    </span>
                  </td>
                  <td className="p-2 sm:p-3 print:p-3 text-center text-gray-600">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="p-2 sm:p-3 print:p-3 text-center font-semibold text-gray-800">
                    {item.quantity}
                  </td>
                  <td className="p-2 sm:p-3 print:p-3 text-right font-semibold text-gray-800">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Totals */}
      <div className="mb-3 sm:mb-4 md:mb-6 print:mb-6">
        <div className="bg-gray-50 p-2 sm:p-3 md:p-4 print:p-4 rounded">
          <div className="space-y-1 sm:space-y-2 print:space-y-2 text-[10px] sm:text-xs md:text-sm print:text-sm mb-2 sm:mb-3 print:mb-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="text-gray-800 font-semibold">
                {formatCurrency(receiptData?.subtotal)}
              </span>
            </div>
            {receiptData?.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Discount Applied:</span>
                <span className="text-red-600 font-semibold">
                  -{formatCurrency(receiptData?.discount)}
                </span>
              </div>
            )}
            {receiptData?.tax > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">VAT (7.5%):</span>
                <span className="text-gray-800 font-semibold">
                  {formatCurrency(receiptData?.tax)}
                </span>
              </div>
            )}
          </div>
          <div
            className="flex justify-between font-bold text-base sm:text-lg md:text-xl print:text-xl pt-2 sm:pt-3 print:pt-3 border-t-2"
            style={{ borderColor: color }}
          >
            <span style={{ color }}>TOTAL AMOUNT:</span>
            <span style={{ color }}>{formatCurrency(receiptData?.total)}</span>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div
        className="mb-3 sm:mb-4 md:mb-6 print:mb-6 p-2 sm:p-3 md:p-4 print:p-4 rounded"
        style={{ backgroundColor: `${color}10` }}
      >
        <h3
          className="text-xs sm:text-sm print:text-sm font-bold mb-2 sm:mb-3 print:mb-3"
          style={{ color }}
        >
          PAYMENT DETAILS
        </h3>
        <div className="space-y-1 sm:space-y-2 print:space-y-2 text-[10px] sm:text-xs md:text-sm print:text-sm">
          <div className="flex justify-between">
            <span className="text-gray-700">Payment Method:</span>
            <span className="font-semibold text-gray-800">
              {receiptData?.paymentMethod}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Amount Paid:</span>
            <span className="font-semibold text-gray-800">
              {formatCurrency(receiptData?.amountPaid)}
            </span>
          </div>
          {receiptData?.change > 0 && (
            <div
              className="flex justify-between font-bold pt-2 border-t"
              style={{ borderColor: `${color}50` }}
            >
              <span className="text-gray-800">Change Given:</span>
              <span className="text-green-600">
                {formatCurrency(receiptData?.change)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-3 sm:pt-4 print:pt-4 border-t">
        <p className="font-bold text-gray-800 mb-1 sm:mb-2 print:mb-2 text-xs sm:text-sm print:text-sm">
          Thank You For Your Business!
        </p>
        <p className="text-[10px] sm:text-xs print:text-xs text-gray-500">
          This is an official receipt and serves as proof of payment
        </p>
        <p className="text-[10px] sm:text-xs print:text-xs text-gray-500 mt-1">
          Please retain this receipt for your records
        </p>
      </div>
    </div>
  );
};

export default DetailedReceipt;
