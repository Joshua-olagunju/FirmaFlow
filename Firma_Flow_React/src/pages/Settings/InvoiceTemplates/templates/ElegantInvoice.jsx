const ElegantInvoice = ({
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
        fontFamily: "'Playfair Display', Georgia, serif",
        boxSizing: "border-box",
      }}
    >
      {/* Elegant Gold Accent Bar */}
      <div
        className="h-2"
        style={{
          background: `linear-gradient(90deg, ${color} 0%, ${color}80 50%, ${color} 100%)`,
        }}
      />

      {/* Header Section */}
      <div className="p-6 sm:p-8 md:p-10 print:p-10">
        <div className="flex flex-col sm:flex-row print:flex-row justify-between items-start sm:items-center print:items-center mb-8 sm:mb-10 print:mb-10">
          {/* Company Branding */}
          <div className="flex items-center gap-4 mb-4 sm:mb-0 print:mb-0">
            {companyInfo?.logo && (
              <div
                className="p-2 rounded-lg"
                style={{ border: `2px solid ${color}30` }}
              >
                <img
                  src={companyInfo.logo}
                  alt="Logo"
                  className="h-14 sm:h-16 md:h-18 print:h-16 w-auto"
                />
              </div>
            )}
            <div>
              <h1
                className="text-2xl sm:text-3xl print:text-3xl font-light tracking-wide"
                style={{ color: "#1a1a1a" }}
              >
                {companyInfo?.name || "Company Name"}
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm print:text-sm mt-1">
                {companyInfo?.email}
              </p>
            </div>
          </div>

          {/* Invoice Badge */}
          <div className="text-left sm:text-right print:text-right">
            <div
              className="inline-block px-6 py-3 rounded-lg"
              style={{
                backgroundColor: `${color}10`,
                border: `1px solid ${color}30`,
              }}
            >
              <p
                className="text-2xl sm:text-3xl print:text-3xl font-light tracking-widest"
                style={{ color }}
              >
                INVOICE
              </p>
              <p className="text-gray-600 text-sm mt-1">
                #{invoiceData?.invoiceNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Decorative Divider */}
        <div className="flex items-center gap-4 mb-8 sm:mb-10 print:mb-10">
          <div
            className="flex-1 h-px"
            style={{ backgroundColor: `${color}30` }}
          />
          <div
            className="w-3 h-3 rotate-45"
            style={{ backgroundColor: color }}
          />
          <div
            className="flex-1 h-px"
            style={{ backgroundColor: `${color}30` }}
          />
        </div>

        {/* Three Column Info Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-6 sm:gap-8 print:gap-8 mb-8 sm:mb-10 print:mb-10">
          {/* From Section */}
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: "#fafafa",
              borderLeft: `3px solid ${color}`,
            }}
          >
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color }}
            >
              From
            </h3>
            <p className="text-gray-800 font-medium text-sm mb-1">
              {companyInfo?.name}
            </p>
            <p className="text-gray-600 text-xs leading-relaxed">
              {companyInfo?.address}
              <br />
              {[companyInfo?.city, companyInfo?.state]
                .filter(Boolean)
                .join(", ")}
              <br />
              {companyInfo?.phone}
            </p>
          </div>

          {/* Bill To Section */}
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: "#fafafa",
              borderLeft: `3px solid ${color}`,
            }}
          >
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color }}
            >
              Bill To
            </h3>
            <p className="text-gray-800 font-medium text-sm mb-1">
              {invoiceData?.customer?.name}
            </p>
            <p className="text-gray-600 text-xs leading-relaxed">
              {invoiceData?.customer?.address}
              <br />
              {invoiceData?.customer?.city}
              <br />
              {invoiceData?.customer?.phone}
            </p>
          </div>

          {/* Invoice Details */}
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: "#fafafa",
              borderLeft: `3px solid ${color}`,
            }}
          >
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color }}
            >
              Details
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Issue Date:</span>
                <span className="text-gray-800 font-medium">
                  {invoiceData?.date}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Due Date:</span>
                <span className="font-medium" style={{ color }}>
                  {invoiceData?.dueDate}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Status:</span>
                <span
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {invoiceData?.status || "Pending"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8 sm:mb-10 print:mb-10">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: color }}>
                <th className="text-left p-3 sm:p-4 print:p-4 text-white font-medium text-xs sm:text-sm print:text-sm rounded-tl-lg">
                  Description
                </th>
                <th className="text-center p-3 sm:p-4 print:p-4 text-white font-medium text-xs sm:text-sm print:text-sm">
                  Qty
                </th>
                <th className="text-right p-3 sm:p-4 print:p-4 text-white font-medium text-xs sm:text-sm print:text-sm">
                  Rate
                </th>
                <th className="text-right p-3 sm:p-4 print:p-4 text-white font-medium text-xs sm:text-sm print:text-sm rounded-tr-lg">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoiceData?.items?.map((item, index) => (
                <tr
                  key={index}
                  className="border-b"
                  style={{
                    backgroundColor: index % 2 === 0 ? "#fafafa" : "#ffffff",
                    borderColor: "#e5e5e5",
                  }}
                >
                  <td className="p-3 sm:p-4 print:p-4 text-gray-800 text-xs sm:text-sm print:text-sm">
                    {item.description}
                  </td>
                  <td className="p-3 sm:p-4 print:p-4 text-center text-gray-700 text-xs sm:text-sm print:text-sm">
                    {item.quantity}
                  </td>
                  <td className="p-3 sm:p-4 print:p-4 text-right text-gray-700 text-xs sm:text-sm print:text-sm">
                    {formatCurrency(item.rate)}
                  </td>
                  <td className="p-3 sm:p-4 print:p-4 text-right text-gray-900 font-semibold text-xs sm:text-sm print:text-sm">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-8 sm:mb-10 print:mb-10">
          <div className="w-full sm:w-80 print:w-80">
            <div
              className="rounded-lg overflow-hidden"
              style={{ border: `1px solid ${color}30` }}
            >
              {/* Subtotals */}
              <div
                className="p-4 space-y-3"
                style={{ backgroundColor: "#fafafa" }}
              >
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-800 font-medium">
                    {formatCurrency(invoiceData?.subtotal)}
                  </span>
                </div>
                {invoiceData?.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-red-600 font-medium">
                      -{formatCurrency(invoiceData?.discount)}
                    </span>
                  </div>
                )}
                {invoiceData?.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (7.5%)</span>
                    <span className="text-gray-800 font-medium">
                      {formatCurrency(invoiceData?.tax)}
                    </span>
                  </div>
                )}
              </div>
              {/* Grand Total */}
              <div
                className="p-4 flex justify-between items-center"
                style={{ backgroundColor: color }}
              >
                <span className="text-white font-medium text-lg">
                  Total Due
                </span>
                <span className="text-white font-bold text-xl sm:text-2xl print:text-2xl">
                  {formatCurrency(invoiceData?.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        {showPaymentInfo && companyInfo?.bank_account && (
          <div
            className="p-5 rounded-lg mb-8"
            style={{
              backgroundColor: `${color}08`,
              border: `1px dashed ${color}40`,
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: color }}
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <h3 className="font-medium text-gray-800">Payment Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                  Bank Name
                </p>
                <p className="text-gray-800 font-semibold text-sm sm:text-base print:text-base">
                  {companyInfo.bank_name}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                  Account Number
                </p>
                <p className="text-gray-800 font-semibold text-sm sm:text-base print:text-base">
                  {companyInfo.bank_account}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                  Account Name
                </p>
                <p className="text-gray-800 font-semibold text-sm sm:text-base print:text-base">
                  {companyInfo.account_name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className="text-center pt-6 border-t"
          style={{ borderColor: `${color}30` }}
        >
          <p className="text-gray-500 text-sm italic">
            Thank you for your business!
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="w-8 h-px" style={{ backgroundColor: color }} />
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <div className="w-8 h-px" style={{ backgroundColor: color }} />
          </div>
        </div>
      </div>

      {/* Bottom Accent Bar */}
      <div
        className="h-2"
        style={{
          background: `linear-gradient(90deg, ${color} 0%, ${color}80 50%, ${color} 100%)`,
        }}
      />
    </div>
  );
};

export default ElegantInvoice;
