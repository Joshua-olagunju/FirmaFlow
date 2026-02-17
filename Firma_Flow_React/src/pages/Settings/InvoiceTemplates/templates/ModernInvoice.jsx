const ModernInvoice = ({
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
      className="bg-white p-4 sm:p-6 md:p-8 max-w-4xl mx-auto print:p-8"
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      {/* Header with diagonal design */}
      <div className="relative mb-4 sm:mb-6 md:mb-8 print:mb-8">
        <div
          className="absolute top-0 right-0 w-64 h-64 opacity-10"
          style={{
            background: `linear-gradient(135deg, ${color} 0%, ${color}aa 100%)`,
            clipPath: "polygon(100% 0, 0 0, 100% 100%)",
          }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start gap-4 print:flex-row">
          <div>
            {companyInfo?.logo && (
              <img
                src={companyInfo.logo}
                alt="Logo"
                className="h-12 sm:h-14 md:h-16 mb-2 sm:mb-4 print:h-16 print:mb-4"
              />
            )}
            <h1
              className="text-2xl sm:text-3xl md:text-4xl font-bold print:text-4xl"
              style={{ color }}
            >
              INVOICE
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-2 print:text-sm print:mt-2">
              #{invoiceData?.invoiceNumber}
            </p>
          </div>

          <div className="text-left sm:text-right print:text-right">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 print:text-2xl">
              {companyInfo?.name || "Company Name"}
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-2 print:text-sm print:mt-2">
              {companyInfo?.address}
            </p>
            <p className="text-gray-600 text-xs sm:text-sm print:text-sm">
              {[companyInfo?.city, companyInfo?.state]
                .filter(Boolean)
                .join(", ")}
            </p>
            <p className="text-gray-600 text-xs sm:text-sm print:text-sm">
              {companyInfo?.phone}
            </p>
            <p className="text-gray-600 text-xs sm:text-sm print:text-sm">
              {companyInfo?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-4 sm:mb-6 md:mb-8 print:grid-cols-2 print:gap-8 print:mb-8">
        <div>
          <h3
            className="font-bold text-gray-800 mb-2 text-sm sm:text-base print:text-base"
            style={{ color }}
          >
            BILL TO:
          </h3>
          <p className="font-semibold text-gray-800 text-sm sm:text-base print:text-base">
            {invoiceData?.customer?.name}
          </p>
          <p className="text-gray-600 text-xs sm:text-sm print:text-sm">
            {invoiceData?.customer?.address}
          </p>
          <p className="text-gray-600 text-xs sm:text-sm print:text-sm">
            {invoiceData?.customer?.city}
          </p>
          <p className="text-gray-600 text-xs sm:text-sm print:text-sm">
            {invoiceData?.customer?.phone}
          </p>
        </div>

        <div className="text-left sm:text-right print:text-right">
          <div className="mb-2 sm:mb-3 print:mb-3">
            <span className="text-gray-600 text-xs sm:text-sm print:text-sm">
              Invoice Date:
            </span>
            <p className="font-semibold text-gray-800 text-sm sm:text-base print:text-base">
              {invoiceData?.date}
            </p>
          </div>
          <div>
            <span className="text-gray-600 text-xs sm:text-sm print:text-sm">
              Due Date:
            </span>
            <p className="font-semibold text-gray-800 text-sm sm:text-base print:text-base">
              {invoiceData?.dueDate}
            </p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto mb-4 sm:mb-6 md:mb-8 print:mb-8">
        <table className="w-full min-w-full">
          <thead>
            <tr style={{ backgroundColor: `${color}15` }}>
              <th
                className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm print:p-3 print:text-sm"
                style={{ color }}
              >
                Description
              </th>
              <th
                className="text-center p-2 sm:p-3 font-semibold text-xs sm:text-sm print:p-3 print:text-sm"
                style={{ color }}
              >
                Qty
              </th>
              <th
                className="text-right p-2 sm:p-3 font-semibold text-xs sm:text-sm print:p-3 print:text-sm"
                style={{ color }}
              >
                Rate
              </th>
              <th
                className="text-right p-2 sm:p-3 font-semibold text-xs sm:text-sm print:p-3 print:text-sm"
                style={{ color }}
              >
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoiceData?.items?.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="p-2 sm:p-3 text-gray-800 text-xs sm:text-sm print:p-3 print:text-sm">
                  {item.description}
                </td>
                <td className="p-2 sm:p-3 text-center text-gray-800 text-xs sm:text-sm print:p-3 print:text-sm">
                  {item.quantity}
                </td>
                <td className="p-2 sm:p-3 text-right text-gray-800 text-xs sm:text-sm print:p-3 print:text-sm">
                  {formatCurrency(item.rate)}
                </td>
                <td className="p-2 sm:p-3 text-right text-gray-800 font-semibold text-xs sm:text-sm print:p-3 print:text-sm">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-4 sm:mb-6 md:mb-8 print:mb-8">
        <div className="w-full sm:w-64 print:w-64">
          <div className="flex justify-between py-1.5 sm:py-2 border-b border-gray-200 print:py-2">
            <span className="text-gray-600 text-xs sm:text-sm print:text-sm">
              Subtotal:
            </span>
            <span className="text-gray-800 font-semibold text-xs sm:text-sm print:text-sm">
              {formatCurrency(invoiceData?.subtotal)}
            </span>
          </div>
          {invoiceData?.discount > 0 && (
            <div className="flex justify-between py-1.5 sm:py-2 border-b border-gray-200 print:py-2">
              <span className="text-gray-600 text-xs sm:text-sm print:text-sm">
                Discount:
              </span>
              <span className="text-red-600 font-semibold text-xs sm:text-sm print:text-sm">
                -{formatCurrency(invoiceData?.discount)}
              </span>
            </div>
          )}
          {invoiceData?.shipping > 0 && (
            <div className="flex justify-between py-1.5 sm:py-2 border-b border-gray-200 print:py-2">
              <span className="text-gray-600 text-xs sm:text-sm print:text-sm">
                Shipping:
              </span>
              <span className="text-blue-600 font-semibold text-xs sm:text-sm print:text-sm">
                {formatCurrency(invoiceData?.shipping)}
              </span>
            </div>
          )}
          {invoiceData?.tax > 0 && (
            <div className="flex justify-between py-1.5 sm:py-2 border-b border-gray-200 print:py-2">
              <span className="text-gray-600 text-xs sm:text-sm print:text-sm">
                Tax (7.5%):
              </span>
              <span className="text-gray-800 font-semibold text-xs sm:text-sm print:text-sm">
                {formatCurrency(invoiceData?.tax)}
              </span>
            </div>
          )}
          <div
            className="flex justify-between py-2 sm:py-3 mt-2 print:py-3"
            style={{ backgroundColor: `${color}15` }}
          >
            <span
              className="font-bold text-base sm:text-lg print:text-lg"
              style={{ color }}
            >
              TOTAL:
            </span>
            <span
              className="font-bold text-base sm:text-lg print:text-lg"
              style={{ color }}
            >
              {formatCurrency(invoiceData?.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      {showPaymentInfo && companyInfo?.bank_account && (
        <div className="border-t border-gray-200 pt-4 sm:pt-6 print:pt-6">
          <h3 className="font-bold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base print:text-base print:mb-3">
            Payment Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm print:grid-cols-3 print:gap-4 print:text-sm">
            <div>
              <span className="text-gray-600">Bank Name:</span>
              <p className="text-gray-800 font-semibold">
                {companyInfo.bank_name}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Account Number:</span>
              <p className="text-gray-800 font-semibold">
                {companyInfo.bank_account}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Account Name:</span>
              <p className="text-gray-800 font-semibold">
                {companyInfo.account_name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-4 sm:mt-6 md:mt-8 pt-4 sm:pt-6 border-t border-gray-200 print:mt-8 print:pt-6">
        <p className="text-gray-600 text-xs sm:text-sm print:text-sm">
          Thank you for your business!
        </p>
      </div>
    </div>
  );
};

export default ModernInvoice;
