const ClassicInvoice = ({
  color = "#667eea",
  companyInfo,
  invoiceData,
  showPaymentInfo = true,
}) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  return (
    <div
      className="bg-white p-4 sm:p-6 md:p-8 max-w-4xl mx-auto print:p-8"
      style={{ fontFamily: "Georgia, serif" }}
    >
      {/* Header */}
      <div
        className="border-2 sm:border-4 border-double p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 print:border-4 print:p-6 print:mb-6"
        style={{ borderColor: color }}
      >
        <div className="text-center mb-4 sm:mb-6 print:mb-6">
          {companyInfo?.logo && (
            <img
              src={companyInfo.logo}
              alt="Logo"
              className="h-14 sm:h-16 md:h-20 mx-auto mb-2 sm:mb-4 print:h-20 print:mb-4"
            />
          )}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 print:text-3xl">
            {companyInfo?.name || "Company Name"}
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-2 print:text-sm print:mt-2">
            {companyInfo?.address}
          </p>
          <p className="text-gray-600 text-xs sm:text-sm print:text-sm">
            {companyInfo?.city}, {companyInfo?.state}
          </p>
          <p className="text-gray-600 text-xs sm:text-sm print:text-sm">
            {companyInfo?.phone} | {companyInfo?.email}
          </p>
        </div>

        <div className="text-center">
          <h2
            className="text-xl sm:text-2xl font-bold print:text-2xl"
            style={{ color }}
          >
            INVOICE
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 print:text-sm">
            #{invoiceData?.invoiceNumber}
          </p>
        </div>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-4 sm:mb-6 print:grid-cols-2 print:gap-8 print:mb-6">
        <div
          className="border p-3 sm:p-4 print:p-4"
          style={{ borderColor: `${color}50` }}
        >
          <h3
            className="font-bold text-gray-800 mb-2 sm:mb-3 pb-2 border-b text-sm sm:text-base print:text-base print:mb-3"
            style={{ borderColor: color, color }}
          >
            BILLED TO:
          </h3>
          <p className="font-semibold text-gray-800 text-sm sm:text-base print:text-base">
            {invoiceData?.customer?.name}
          </p>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 print:text-sm">
            {invoiceData?.customer?.address}
          </p>
          <p className="text-gray-600 text-xs sm:text-sm print:text-sm">
            {invoiceData?.customer?.city}
          </p>
          <p className="text-gray-600 text-xs sm:text-sm print:text-sm">
            {invoiceData?.customer?.phone}
          </p>
        </div>

        <div
          className="border p-3 sm:p-4 print:p-4"
          style={{ borderColor: `${color}50` }}
        >
          <h3
            className="font-bold text-gray-800 mb-2 sm:mb-3 pb-2 border-b text-sm sm:text-base print:text-base print:mb-3"
            style={{ borderColor: color, color }}
          >
            INVOICE DETAILS:
          </h3>
          <div className="space-y-1 sm:space-y-2 print:space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 text-xs sm:text-sm print:text-sm">
                Invoice Date:
              </span>
              <span className="font-semibold text-gray-800 text-xs sm:text-sm print:text-sm">
                {invoiceData?.date}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 text-xs sm:text-sm print:text-sm">
                Due Date:
              </span>
              <span className="font-semibold text-gray-800 text-xs sm:text-sm print:text-sm">
                {invoiceData?.dueDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto mb-4 sm:mb-6 print:mb-6">
        <table
          className="w-full min-w-full border"
          style={{ borderColor: color }}
        >
          <thead>
            <tr style={{ backgroundColor: color, color: "white" }}>
              <th className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm print:p-3 print:text-sm">
                Description
              </th>
              <th className="text-center p-2 sm:p-3 font-semibold text-xs sm:text-sm print:p-3 print:text-sm">
                Quantity
              </th>
              <th className="text-right p-2 sm:p-3 font-semibold text-xs sm:text-sm print:p-3 print:text-sm">
                Rate
              </th>
              <th className="text-right p-2 sm:p-3 font-semibold text-xs sm:text-sm print:p-3 print:text-sm">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoiceData?.items?.map((item, index) => (
              <tr
                key={index}
                className="border-b"
                style={{ borderColor: `${color}30` }}
              >
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
      <div className="flex justify-end mb-4 sm:mb-6 print:mb-6">
        <div
          className="w-full sm:w-72 border p-3 sm:p-4 print:w-72 print:p-4"
          style={{ borderColor: color }}
        >
          <div className="flex justify-between py-1.5 sm:py-2 print:py-2">
            <span className="text-gray-700 text-xs sm:text-sm print:text-sm">
              Subtotal:
            </span>
            <span className="text-gray-800 font-semibold text-xs sm:text-sm print:text-sm">
              {formatCurrency(invoiceData?.subtotal)}
            </span>
          </div>
          {invoiceData?.discount > 0 && (
            <div className="flex justify-between py-1.5 sm:py-2 print:py-2">
              <span className="text-gray-700 text-xs sm:text-sm print:text-sm">
                Discount:
              </span>
              <span className="text-red-600 font-semibold text-xs sm:text-sm print:text-sm">
                -{formatCurrency(invoiceData?.discount)}
              </span>
            </div>
          )}
          {invoiceData?.tax > 0 && (
            <div className="flex justify-between py-1.5 sm:py-2 print:py-2">
              <span className="text-gray-700 text-xs sm:text-sm print:text-sm">
                Tax (7.5%):
              </span>
              <span className="text-gray-800 font-semibold text-xs sm:text-sm print:text-sm">
                {formatCurrency(invoiceData?.tax)}
              </span>
            </div>
          )}
          <div
            className="border-t-2 mt-2 pt-2 sm:pt-3 print:pt-3"
            style={{ borderColor: color }}
          >
            <div className="flex justify-between">
              <span className="font-bold text-base sm:text-lg text-gray-800 print:text-lg">
                TOTAL DUE:
              </span>
              <span
                className="font-bold text-lg sm:text-xl print:text-xl"
                style={{ color }}
              >
                {formatCurrency(invoiceData?.total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      {showPaymentInfo && companyInfo?.bank_account && (
        <div
          className="border-2 border-dashed p-3 sm:p-4 mb-4 sm:mb-6 print:p-4 print:mb-6"
          style={{ borderColor: color }}
        >
          <h3
            className="font-bold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base print:text-base print:mb-3"
            style={{ color }}
          >
            Payment Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm print:grid-cols-3 print:gap-4 print:text-sm">
            <div>
              <span className="text-gray-600">Bank:</span>
              <p className="text-gray-800 font-semibold">
                {companyInfo.bank_name}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Account:</span>
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
      <div
        className="text-center pt-3 sm:pt-4 border-t-2 print:pt-4"
        style={{ borderColor: color }}
      >
        <p className="text-gray-600 text-xs sm:text-sm italic print:text-sm">
          Thank you for your business!
        </p>
      </div>
    </div>
  );
};

export default ClassicInvoice;
