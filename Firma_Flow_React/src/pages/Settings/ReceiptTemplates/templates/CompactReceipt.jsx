const CompactReceipt = ({ color = "#667eea", companyInfo, receiptData }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  return (
    <div
      className="bg-white p-3 sm:p-4 print:p-4 mx-auto"
      style={{
        width: "100%",
        maxWidth: "320px",
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
      }}
    >
      {/* Compact Header */}
      <div className="text-center mb-2 sm:mb-3 print:mb-3">
        <h3
          className="text-xs sm:text-sm print:text-sm font-bold"
          style={{ color }}
        >
          {companyInfo?.name || "Company Name"}
        </h3>
        <p className="text-gray-600 text-[10px] sm:text-xs print:text-xs">
          {companyInfo?.address}
        </p>
        <p className="text-gray-600 text-[10px] sm:text-xs print:text-xs">
          {companyInfo?.phone}
        </p>
      </div>

      {/* Receipt Info */}
      <div className="border-t border-b border-gray-300 py-1 sm:py-2 print:py-2 mb-2">
        <div className="flex justify-between text-[10px] sm:text-xs print:text-xs">
          <span className="font-semibold">
            Receipt: {receiptData?.receiptNumber}
          </span>
          <span className="text-gray-600">
            {receiptData?.date} {receiptData?.time}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="mb-2">
        {receiptData?.items?.map((item, index) => (
          <div
            key={index}
            className="flex justify-between py-1 text-[10px] sm:text-xs print:text-xs border-b border-gray-200"
          >
            <div className="flex-1">
              <span className="font-semibold text-gray-800">{item.name}</span>
              <span className="text-gray-500 ml-2">x{item.quantity}</span>
            </div>
            <span className="font-semibold text-gray-800">
              {formatCurrency(item.total)}
            </span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t-2 pt-2 mb-2" style={{ borderColor: color }}>
        <div className="flex justify-between text-[10px] sm:text-xs print:text-xs mb-0.5">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-800">
            {formatCurrency(receiptData?.subtotal)}
          </span>
        </div>
        {receiptData?.discount > 0 && (
          <div className="flex justify-between text-[10px] sm:text-xs print:text-xs mb-0.5">
            <span className="text-gray-600">Discount</span>
            <span className="text-red-600">
              -{formatCurrency(receiptData?.discount)}
            </span>
          </div>
        )}
        {receiptData?.tax > 0 && (
          <div className="flex justify-between text-[10px] sm:text-xs print:text-xs mb-0.5">
            <span className="text-gray-600">Tax</span>
            <span className="text-gray-800">
              {formatCurrency(receiptData?.tax)}
            </span>
          </div>
        )}
        <div
          className="flex justify-between font-bold text-xs sm:text-sm print:text-sm mt-1 pt-1 border-t"
          style={{ borderColor: `${color}50`, color }}
        >
          <span>TOTAL</span>
          <span>{formatCurrency(receiptData?.total)}</span>
        </div>
      </div>

      {/* Payment */}
      <div className="bg-gray-50 p-2 mb-2 text-[10px] sm:text-xs print:text-xs">
        <div className="flex justify-between mb-0.5">
          <span className="text-gray-600">
            Paid ({receiptData?.paymentMethod})
          </span>
          <span className="font-semibold">
            {formatCurrency(receiptData?.amountPaid)}
          </span>
        </div>
        {receiptData?.change > 0 && (
          <div className="flex justify-between font-bold">
            <span className="text-gray-800">Change</span>
            <span className="text-green-600">
              {formatCurrency(receiptData?.change)}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] sm:text-xs print:text-xs text-gray-500 pt-2 border-t border-gray-200">
        <p className="font-semibold">Thank You!</p>
      </div>
    </div>
  );
};

export default CompactReceipt;
