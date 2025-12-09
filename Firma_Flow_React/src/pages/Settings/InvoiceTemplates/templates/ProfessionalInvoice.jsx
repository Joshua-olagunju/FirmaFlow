const ProfessionalInvoice = ({
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
      className="bg-white max-w-4xl mx-auto"
      style={{
        fontFamily: "Arial, sans-serif",
        minHeight: "297mm",
        maxHeight: "297mm",
        boxSizing: "border-box",
        pageBreakAfter: "always",
        overflow: "hidden",
      }}
    >
      {/* Professional Header */}
      <div
        className="p-4 sm:p-6 md:p-8 print:p-8"
        style={{ backgroundColor: color }}
      >
        <div className="flex justify-between items-center text-white">
          <div>
            {companyInfo?.logo && (
              <div className="bg-white p-2 rounded mb-2 sm:mb-3 print:mb-3 inline-block">
                <img
                  src={companyInfo.logo}
                  alt="Logo"
                  className="h-10 sm:h-12 md:h-14 print:h-12"
                />
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl print:text-3xl font-bold">
              {companyInfo?.name || "Company Name"}
            </h1>
            <p className="text-white/80 mt-1 text-xs sm:text-sm print:text-sm">
              {companyInfo?.email}
            </p>
          </div>
          <div className="text-left sm:text-right print:text-right">
            <h2 className="text-3xl sm:text-4xl print:text-4xl font-bold mb-1 sm:mb-2 print:mb-2">
              INVOICE
            </h2>
            <p className="text-white/90 text-xs sm:text-sm print:text-sm">
              #{invoiceData?.invoiceNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 md:p-8 print:p-8">
        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 sm:gap-6 md:gap-8 print:gap-8 mb-6 sm:mb-8 print:mb-8">
          <div>
            <div className="mb-4 sm:mb-6 print:mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Company Address
              </h3>
              <p className="text-gray-800 text-xs sm:text-sm print:text-sm">
                {companyInfo?.address}
              </p>
              <p className="text-gray-800 text-xs sm:text-sm print:text-sm">
                {companyInfo?.city}, {companyInfo?.state}
              </p>
              <p className="text-gray-800 text-xs sm:text-sm print:text-sm">
                {companyInfo?.phone}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Bill To
              </h3>
              <p className="font-bold text-gray-800 text-base sm:text-lg print:text-lg">
                {invoiceData?.customer?.name}
              </p>
              <p className="text-gray-700 text-xs sm:text-sm print:text-sm">
                {invoiceData?.customer?.address}
              </p>
              <p className="text-gray-700 text-xs sm:text-sm print:text-sm">
                {invoiceData?.customer?.city}
              </p>
              <p className="text-gray-700 text-xs sm:text-sm print:text-sm">
                {invoiceData?.customer?.phone}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right print:text-right">
            <div className="bg-gray-50 p-3 sm:p-4 print:p-4 rounded-lg inline-block">
              <div className="mb-3 sm:mb-4 print:mb-4">
                <p className="text-gray-600 text-xs sm:text-sm print:text-sm">
                  Invoice Date
                </p>
                <p className="font-bold text-gray-800 text-base sm:text-lg print:text-lg">
                  {invoiceData?.date}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-xs sm:text-sm print:text-sm">
                  Due Date
                </p>
                <p
                  className="font-bold text-base sm:text-lg print:text-lg"
                  style={{ color }}
                >
                  {invoiceData?.dueDate}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Table */}
        <div className="overflow-x-auto mb-6 sm:mb-8 print:mb-8">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: `${color}20` }}>
                <th className="text-left p-2 sm:p-3 md:p-4 print:p-4 font-semibold text-gray-800 text-xs sm:text-sm print:text-sm">
                  Description
                </th>
                <th className="text-center p-2 sm:p-3 md:p-4 print:p-4 font-semibold text-gray-800 text-xs sm:text-sm print:text-sm">
                  Qty
                </th>
                <th className="text-right p-2 sm:p-3 md:p-4 print:p-4 font-semibold text-gray-800 text-xs sm:text-sm print:text-sm">
                  Unit Price
                </th>
                <th className="text-right p-2 sm:p-3 md:p-4 print:p-4 font-semibold text-gray-800 text-xs sm:text-sm print:text-sm">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoiceData?.items?.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="p-2 sm:p-3 md:p-4 print:p-4 text-gray-800 text-xs sm:text-sm print:text-sm">
                    {item.description}
                  </td>
                  <td className="p-2 sm:p-3 md:p-4 print:p-4 text-center text-gray-800 text-xs sm:text-sm print:text-sm">
                    {item.quantity}
                  </td>
                  <td className="p-2 sm:p-3 md:p-4 print:p-4 text-right text-gray-700 text-xs sm:text-sm print:text-sm">
                    {formatCurrency(item.rate)}
                  </td>
                  <td className="p-2 sm:p-3 md:p-4 print:p-4 text-right text-gray-800 font-semibold text-xs sm:text-sm print:text-sm">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Professional Totals */}
        <div className="flex justify-end mb-6 sm:mb-8 print:mb-8">
          <div className="w-full sm:w-96 print:w-96">
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex justify-between py-2 text-gray-700">
                <span>Subtotal:</span>
                <span className="font-semibold">
                  {formatCurrency(invoiceData?.subtotal)}
                </span>
              </div>
              {invoiceData?.discount > 0 && (
                <div className="flex justify-between py-2 text-gray-700">
                  <span>Discount:</span>
                  <span className="font-semibold text-red-600">
                    -{formatCurrency(invoiceData?.discount)}
                  </span>
                </div>
              )}
              {invoiceData?.tax > 0 && (
                <div className="flex justify-between py-2 text-gray-700">
                  <span>Tax (7.5%):</span>
                  <span className="font-semibold">
                    {formatCurrency(invoiceData?.tax)}
                  </span>
                </div>
              )}
              <div
                className="border-t-2 mt-4 pt-4 flex justify-between"
                style={{ borderColor: color }}
              >
                <span className="text-xl font-bold text-gray-800">
                  Total Due:
                </span>
                <span className="text-2xl font-bold" style={{ color }}>
                  {formatCurrency(invoiceData?.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        {showPaymentInfo && companyInfo?.bank_account && (
          <div
            className="bg-blue-50 border-l-4 p-4 sm:p-6 print:p-6 rounded"
            style={{ borderColor: color }}
          >
            <h3 className="font-bold text-gray-800 mb-3 sm:mb-4 print:mb-4 flex items-center gap-2 text-sm sm:text-base print:text-base">
              <span style={{ color }}>●</span>
              Payment Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-4 sm:gap-6 print:gap-6 text-xs sm:text-sm print:text-sm">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm print:text-sm">
                  Bank Name
                </p>
                <p className="font-semibold text-gray-800 text-base sm:text-lg print:text-lg">
                  {companyInfo.bank_name}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-xs sm:text-sm print:text-sm">
                  Account Number
                </p>
                <p className="font-semibold text-gray-800 text-base sm:text-lg print:text-lg">
                  {companyInfo.bank_account}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-xs sm:text-sm print:text-sm">
                  Account Name
                </p>
                <p className="font-semibold text-gray-800 text-base sm:text-lg print:text-lg">
                  {companyInfo.account_name}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-6 md:px-8 print:px-8 py-4 sm:py-6 print:py-6 bg-gray-100 text-center">
        <p className="text-gray-600 text-xs sm:text-sm print:text-sm">
          Thank you for your business!
        </p>
        <p className="text-gray-500 text-xs mt-1">
          Please make payment by the due date
        </p>
      </div>
    </div>
  );
};

export default ProfessionalInvoice;
