const ElegantInvoice = ({
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
      className="bg-white p-4 sm:p-6 md:p-8 print:p-8 max-w-4xl mx-auto"
      style={{ fontFamily: "'Times New Roman', serif" }}
    >
      {/* Elegant Header with Border */}
      <div
        className="border-2 sm:border-4 print:border-4 border-double mb-6 sm:mb-8 print:mb-8 p-4 sm:p-6 md:p-8 print:p-8"
        style={{ borderColor: color }}
      >
        <div className="text-center mb-4 sm:mb-6 print:mb-6">
          {companyInfo?.logo && (
            <img
              src={companyInfo.logo}
              alt="Logo"
              className="h-14 sm:h-16 md:h-20 print:h-20 mx-auto mb-3 sm:mb-4 print:mb-4"
            />
          )}
          <h1
            className="text-2xl sm:text-3xl md:text-4xl print:text-4xl font-serif mb-2"
            style={{ color, fontWeight: "300", letterSpacing: "2px" }}
          >
            {companyInfo?.name || "Company Name"}
          </h1>
          <div
            className="w-16 sm:w-20 md:w-24 print:w-24 h-0.5 mx-auto my-3 sm:my-4 print:my-4"
            style={{ backgroundColor: color }}
          />
          <p className="text-gray-600 text-xs sm:text-sm print:text-sm">
            {companyInfo?.address}
          </p>
          <p className="text-gray-600 text-xs sm:text-sm print:text-sm">
            {companyInfo?.city}, {companyInfo?.state}
          </p>
          <p className="text-gray-600 text-xs sm:text-sm print:text-sm mt-1 sm:mt-2 print:mt-2">
            {companyInfo?.phone} • {companyInfo?.email}
          </p>
        </div>
      </div>

      {/* Invoice Title */}
      <div className="text-center mb-6 sm:mb-8 print:mb-8">
        <h2
          className="text-2xl sm:text-3xl print:text-3xl font-serif"
          style={{ color, fontWeight: "300", letterSpacing: "4px" }}
        >
          INVOICE
        </h2>
        <p className="text-gray-600 text-xs sm:text-sm print:text-sm mt-1 sm:mt-2 print:mt-2 font-serif">
          {invoiceData?.invoiceNumber}
        </p>
      </div>

      {/* Elegant Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-6 sm:gap-8 md:gap-12 print:gap-12 mb-6 sm:mb-8 md:mb-10 print:mb-10">
        <div>
          <div
            className="mb-2"
            style={{
              color,
              borderBottom: `2px solid ${color}`,
              paddingBottom: "8px",
            }}
          >
            <h3 className="font-serif text-base sm:text-lg print:text-lg">
              Billed To
            </h3>
          </div>
          <div className="mt-3 sm:mt-4 print:mt-4">
            <p className="font-serif text-lg sm:text-xl print:text-xl text-gray-800 mb-1 sm:mb-2 print:mb-2">
              {invoiceData?.customer?.name}
            </p>
            <p className="text-gray-600 text-xs sm:text-sm print:text-sm">
              {invoiceData?.customer?.address}
            </p>
            <p className="text-gray-600 text-xs sm:text-sm print:text-sm">
              {invoiceData?.customer?.city}
            </p>
            <p className="text-gray-600 text-xs sm:text-sm print:text-sm mt-1 sm:mt-2 print:mt-2">
              {invoiceData?.customer?.phone}
            </p>
          </div>
        </div>

        <div>
          <div
            className="mb-2"
            style={{
              color,
              borderBottom: `2px solid ${color}`,
              paddingBottom: "8px",
            }}
          >
            <h3 className="font-serif text-base sm:text-lg print:text-lg">
              Invoice Details
            </h3>
          </div>
          <div className="mt-3 sm:mt-4 print:mt-4 space-y-2 sm:space-y-3 print:space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 font-serif text-xs sm:text-sm print:text-sm">
                Invoice Date:
              </span>
              <span className="text-gray-800 font-semibold text-xs sm:text-sm print:text-sm">
                {invoiceData?.date}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-serif text-xs sm:text-sm print:text-sm">
                Payment Due:
              </span>
              <span
                className="font-semibold text-xs sm:text-sm print:text-sm"
                style={{ color }}
              >
                {invoiceData?.dueDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Elegant Table */}
      <div className="overflow-x-auto mb-6 sm:mb-8 print:mb-8">
        <table className="w-full">
          <thead>
            <tr
              style={{
                backgroundColor: `${color}10`,
                borderTop: `2px solid ${color}`,
                borderBottom: `2px solid ${color}`,
              }}
            >
              <th
                className="text-left p-2 sm:p-3 md:p-4 print:p-4 font-serif text-xs sm:text-sm print:text-sm"
                style={{ color }}
              >
                Description
              </th>
              <th
                className="text-center p-2 sm:p-3 md:p-4 print:p-4 font-serif text-xs sm:text-sm print:text-sm"
                style={{ color }}
              >
                Quantity
              </th>
              <th
                className="text-right p-2 sm:p-3 md:p-4 print:p-4 font-serif text-xs sm:text-sm print:text-sm"
                style={{ color }}
              >
                Unit Price
              </th>
              <th
                className="text-right p-2 sm:p-3 md:p-4 print:p-4 font-serif text-xs sm:text-sm print:text-sm"
                style={{ color }}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {invoiceData?.items?.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="p-2 sm:p-3 md:p-4 print:p-4 text-gray-800 font-serif text-xs sm:text-sm print:text-sm">
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

      {/* Elegant Totals */}
      <div className="flex justify-end mb-6 sm:mb-8 md:mb-10 print:mb-10">
        <div className="w-full sm:w-96 print:w-96">
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-gray-700 font-serif">
              <span>Subtotal:</span>
              <span>{formatCurrency(invoiceData?.subtotal)}</span>
            </div>
            {invoiceData?.discount > 0 && (
              <div className="flex justify-between text-gray-700 font-serif">
                <span>Discount:</span>
                <span className="text-red-600">
                  -{formatCurrency(invoiceData?.discount)}
                </span>
              </div>
            )}
            {invoiceData?.tax > 0 && (
              <div className="flex justify-between text-gray-700 font-serif">
                <span>Tax (7.5%):</span>
                <span>{formatCurrency(invoiceData?.tax)}</span>
              </div>
            )}
          </div>
          <div
            className="border-t-2 border-b-2 py-4"
            style={{ borderColor: color }}
          >
            <div className="flex justify-between">
              <span
                className="text-2xl font-serif"
                style={{ color, fontWeight: "300" }}
              >
                Total:
              </span>
              <span className="text-3xl font-serif font-bold" style={{ color }}>
                {formatCurrency(invoiceData?.total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      {showPaymentInfo && companyInfo?.bank_account && (
        <div
          className="border-t border-b py-4 sm:py-6 print:py-6 mb-4 sm:mb-6 print:mb-6"
          style={{ borderColor: `${color}40` }}
        >
          <h3
            className="font-serif text-base sm:text-lg print:text-lg mb-3 sm:mb-4 print:mb-4"
            style={{ color }}
          >
            Payment Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-4 sm:gap-6 print:gap-6">
            <div>
              <p className="text-gray-600 font-serif text-xs sm:text-sm print:text-sm">
                Bank Name
              </p>
              <p className="text-gray-800 font-semibold text-base sm:text-lg print:text-lg">
                {companyInfo.bank_name}
              </p>
            </div>
            <div>
              <p className="text-gray-600 font-serif text-xs sm:text-sm print:text-sm">
                Account Number
              </p>
              <p className="text-gray-800 font-semibold text-base sm:text-lg print:text-lg">
                {companyInfo.bank_account}
              </p>
            </div>
            <div>
              <p className="text-gray-600 font-serif text-xs sm:text-sm print:text-sm">
                Account Name
              </p>
              <p className="text-gray-800 font-semibold text-base sm:text-lg print:text-lg">
                {companyInfo.account_name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Elegant Footer */}
      <div
        className="text-center pt-6 sm:pt-8 print:pt-8 border-t"
        style={{ borderColor: `${color}40` }}
      >
        <p className="text-gray-600 font-serif italic text-xs sm:text-sm print:text-sm">
          We appreciate your business and look forward to serving you again.
        </p>
        <div
          className="w-12 sm:w-16 print:w-16 h-0.5 mx-auto mt-3 sm:mt-4 print:mt-4"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
};

export default ElegantInvoice;
