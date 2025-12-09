const MinimalInvoice = ({
  color = "#667eea",
  companyInfo,
  invoiceData,
  showPaymentInfo = true,
}) => {
  // Use formatCurrency from invoiceData if available, otherwise fallback to hardcoded NGN
  const formatCurrency =
    invoiceData?.formatCurrency ||
    ((amount) => {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
      }).format(amount);
    });

  return (
    <div
      className="bg-white p-4 sm:p-6 md:p-8 print:p-8 max-w-4xl mx-auto"
      style={{
        fontFamily: "Helvetica, sans-serif",
        minHeight: "297mm",
        maxHeight: "297mm",
        boxSizing: "border-box",
        pageBreakAfter: "always",
        overflow: "hidden",
      }}
    >
      {/* Minimal Header */}
      <div
        className="flex flex-col sm:flex-row print:flex-row justify-between items-start mb-6 sm:mb-8 md:mb-12 print:mb-12 pb-4 sm:pb-6 print:pb-6 border-b-2"
        style={{ borderColor: color }}
      >
        <div className="mb-4 sm:mb-0 print:mb-0">
          {companyInfo?.logo && (
            <img
              src={companyInfo.logo}
              alt="Logo"
              className="h-10 sm:h-12 md:h-14 print:h-12 mb-2 sm:mb-3 print:mb-3"
            />
          )}
          <h2 className="text-lg sm:text-xl md:text-2xl print:text-xl font-bold text-gray-800">
            {companyInfo?.name || "Company Name"}
          </h2>
        </div>

        <div className="text-left sm:text-right print:text-right">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl print:text-5xl font-light"
            style={{ color }}
          >
            Invoice
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm print:text-sm mt-1 sm:mt-2 print:mt-2">
            {invoiceData?.invoiceNumber}
          </p>
        </div>
      </div>

      {/* Clean Info Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-4 sm:gap-6 md:gap-8 print:gap-8 mb-6 sm:mb-8 md:mb-12 print:mb-12 text-xs sm:text-sm print:text-sm">
        <div>
          <p className="text-gray-500 uppercase text-xs mb-1 sm:mb-2 print:mb-2">
            From
          </p>
          <p className="text-gray-800 text-xs sm:text-sm print:text-sm">
            {companyInfo?.address}
          </p>
          <p className="text-gray-800 text-xs sm:text-sm print:text-sm">
            {companyInfo?.city}
          </p>
          <p className="text-gray-800 text-xs sm:text-sm print:text-sm">
            {companyInfo?.phone}
          </p>
        </div>

        <div>
          <p className="text-gray-500 uppercase text-xs mb-1 sm:mb-2 print:mb-2">
            Bill To
          </p>
          <p className="font-semibold text-gray-800 text-xs sm:text-sm print:text-sm">
            {invoiceData?.customer?.name}
          </p>
          <p className="text-gray-800 text-xs sm:text-sm print:text-sm">
            {invoiceData?.customer?.address}
          </p>
          <p className="text-gray-800 text-xs sm:text-sm print:text-sm">
            {invoiceData?.customer?.city}
          </p>
        </div>

        <div className="text-left sm:text-right print:text-right">
          <div className="mb-2 sm:mb-4 print:mb-4">
            <p className="text-gray-500 uppercase text-xs">Date</p>
            <p className="text-gray-800 font-semibold text-xs sm:text-sm print:text-sm">
              {invoiceData?.date}
            </p>
          </div>
          <div>
            <p className="text-gray-500 uppercase text-xs">Due</p>
            <p className="text-gray-800 font-semibold text-xs sm:text-sm print:text-sm">
              {invoiceData?.dueDate}
            </p>
          </div>
        </div>
      </div>

      {/* Minimalist Table */}
      <div className="overflow-x-auto mb-6 sm:mb-8 print:mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: color }}>
              <th className="text-left py-2 sm:py-3 print:py-3 text-gray-600 font-normal text-xs sm:text-sm print:text-sm uppercase">
                Item
              </th>
              <th className="text-center py-2 sm:py-3 print:py-3 text-gray-600 font-normal text-xs sm:text-sm print:text-sm uppercase">
                Qty
              </th>
              <th className="text-right py-2 sm:py-3 print:py-3 text-gray-600 font-normal text-xs sm:text-sm print:text-sm uppercase">
                Rate
              </th>
              <th className="text-right py-2 sm:py-3 print:py-3 text-gray-600 font-normal text-xs sm:text-sm print:text-sm uppercase">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoiceData?.items?.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-2 sm:py-3 md:py-4 print:py-4 text-gray-800 text-xs sm:text-sm print:text-sm">
                  {item.description}
                </td>
                <td className="py-2 sm:py-3 md:py-4 print:py-4 text-center text-gray-800 text-xs sm:text-sm print:text-sm">
                  {item.quantity}
                </td>
                <td className="py-2 sm:py-3 md:py-4 print:py-4 text-right text-gray-600 text-xs sm:text-sm print:text-sm">
                  {formatCurrency(item.rate)}
                </td>
                <td className="py-2 sm:py-3 md:py-4 print:py-4 text-right text-gray-800 font-semibold text-xs sm:text-sm print:text-sm">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Clean Totals */}
      <div className="flex justify-end">
        <div className="w-full sm:w-80 print:w-80 space-y-2 sm:space-y-3 print:space-y-3">
          <div className="flex justify-between text-gray-600 text-xs sm:text-sm print:text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(invoiceData?.subtotal)}</span>
          </div>
          {invoiceData?.discount > 0 && (
            <div className="flex justify-between text-gray-600 text-xs sm:text-sm print:text-sm">
              <span>Discount</span>
              <span className="text-red-600">
                -{formatCurrency(invoiceData?.discount)}
              </span>
            </div>
          )}
          {invoiceData?.tax > 0 && (
            <div className="flex justify-between text-gray-600 text-xs sm:text-sm print:text-sm">
              <span>Tax</span>
              <span>{formatCurrency(invoiceData?.tax)}</span>
            </div>
          )}
          <div
            className="flex justify-between pt-3 sm:pt-4 print:pt-4 border-t-2"
            style={{ borderColor: color }}
          >
            <span
              className="text-lg sm:text-xl print:text-xl font-light"
              style={{ color }}
            >
              Total
            </span>
            <span
              className="text-xl sm:text-2xl print:text-2xl font-bold"
              style={{ color }}
            >
              {formatCurrency(invoiceData?.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      {showPaymentInfo && companyInfo?.bank_account && (
        <div className="mt-6 sm:mt-8 md:mt-12 print:mt-12 pt-4 sm:pt-6 md:pt-8 print:pt-8 border-t border-gray-200">
          <p className="text-gray-500 uppercase text-xs mb-2 sm:mb-3 print:mb-3">
            Payment Details
          </p>
          <div className="flex flex-col sm:flex-row print:flex-row gap-3 sm:gap-6 md:gap-8 print:gap-8 text-xs sm:text-sm print:text-sm">
            <div>
              <span className="text-gray-600">Bank:</span>
              <span className="text-gray-800 ml-2 font-semibold">
                {companyInfo.bank_name}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Account:</span>
              <span className="text-gray-800 ml-2 font-semibold">
                {companyInfo.bank_account}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Account Name:</span>
              <span className="text-gray-800 ml-2 font-semibold">
                {companyInfo.account_name}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      <div className="text-center mt-6 sm:mt-8 md:mt-12 print:mt-12 pt-4 sm:pt-6 print:pt-6 border-t border-gray-200">
        <p className="text-gray-400 text-xs">Thank you</p>
      </div>
    </div>
  );
};

export default MinimalInvoice;
