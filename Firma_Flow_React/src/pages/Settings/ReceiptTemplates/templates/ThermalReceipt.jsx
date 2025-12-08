// Thermal Receipt - POS Style (80mm paper width)
// Thermal receipts don't typically use color theming
const ThermalReceipt = ({ companyInfo, receiptData }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  return (
    <div
      className="bg-white p-3 sm:p-4 mx-auto print:p-4"
      style={{
        width: "100%",
        maxWidth: "302px",
        fontFamily: "monospace",
        fontSize: "11px",
        boxSizing: "border-box",
        pageBreakInside: "avoid",
      }}
    >
      {/* Header */}
      <div className="text-center border-b-2 border-dashed border-gray-400 pb-2 sm:pb-3 mb-2 sm:mb-3 print:pb-3 print:mb-3">
        <div className="font-bold text-xs sm:text-sm print:text-sm">
          {companyInfo?.name || "COMPANY NAME"}
        </div>
        <div className="text-[10px] sm:text-xs mt-1 print:text-xs">
          {companyInfo?.address}
        </div>
        <div className="text-[10px] sm:text-xs print:text-xs">
          {companyInfo?.city}, {companyInfo?.state}
        </div>
        <div className="text-[10px] sm:text-xs print:text-xs">
          Tel: {companyInfo?.phone}
        </div>
      </div>

      {/* Receipt Info */}
      <div className="text-[10px] sm:text-xs mb-2 sm:mb-3 print:text-xs print:mb-3">
        <div className="flex justify-between">
          <span>Receipt #:</span>
          <span className="font-bold">{receiptData?.receiptNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{receiptData?.date}</span>
        </div>
        <div className="flex justify-between">
          <span>Time:</span>
          <span>{receiptData?.time}</span>
        </div>
      </div>

      {/* Items */}
      <div className="border-t border-b border-dashed border-gray-400 py-2 mb-2">
        {receiptData?.items?.map((item, index) => (
          <div key={index} className="mb-2">
            <div className="flex justify-between font-bold text-[10px] sm:text-xs print:text-xs">
              <span>{item.name}</span>
              <span>{formatCurrency(item.total)}</span>
            </div>
            <div className="flex justify-between text-[9px] sm:text-[10px] text-gray-600 ml-2 print:text-[10px]">
              <span>
                {item.quantity} x {formatCurrency(item.price)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="text-[10px] sm:text-xs space-y-1 mb-2 sm:mb-3 print:text-xs print:mb-3">
        <div className="flex justify-between">
          <span>SUBTOTAL:</span>
          <span>{formatCurrency(receiptData?.subtotal)}</span>
        </div>
        {receiptData?.discount > 0 && (
          <div className="flex justify-between">
            <span>DISCOUNT:</span>
            <span>-{formatCurrency(receiptData?.discount)}</span>
          </div>
        )}
        {receiptData?.tax > 0 && (
          <div className="flex justify-between">
            <span>TAX (7.5%):</span>
            <span>{formatCurrency(receiptData?.tax)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-xs sm:text-sm border-t border-dashed border-gray-400 pt-1 mt-1 print:text-sm">
          <span>TOTAL:</span>
          <span>{formatCurrency(receiptData?.total)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div className="border-t border-dashed border-gray-400 pt-2 mb-2 sm:mb-3 text-[10px] sm:text-xs print:text-xs print:mb-3">
        <div className="flex justify-between">
          <span>Payment Method:</span>
          <span className="font-bold">{receiptData?.paymentMethod}</span>
        </div>
        <div className="flex justify-between">
          <span>Amount Paid:</span>
          <span>{formatCurrency(receiptData?.amountPaid)}</span>
        </div>
        {receiptData?.change > 0 && (
          <div className="flex justify-between font-bold">
            <span>CHANGE:</span>
            <span>{formatCurrency(receiptData?.change)}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] sm:text-xs border-t-2 border-dashed border-gray-400 pt-2 sm:pt-3 print:text-xs print:pt-3">
        <div className="font-bold mb-1">THANK YOU!</div>
        <div>Please come again</div>
        <div className="mt-2 text-[9px] sm:text-[10px] print:text-[10px]">
          *** CUSTOMER COPY ***
        </div>
      </div>
    </div>
  );
};

export default ThermalReceipt;
