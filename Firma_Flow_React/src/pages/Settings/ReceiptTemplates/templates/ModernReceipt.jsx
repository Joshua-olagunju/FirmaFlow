// Modern Receipt - Updated to match PDF version exactly
const ModernReceipt = ({ color = "#667eea", companyInfo, receiptData }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const formatMethod = (method) => {
    if (!method) return "N/A";
    return method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div
      className="bg-white p-10 mx-auto print:p-10"
      style={{
        width: "100%",
        maxWidth: "210mm",
        minHeight: "297mm",
        fontFamily: "Helvetica, Arial, sans-serif",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* Diagonal Design Overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "150px",
          height: "150px",
          opacity: 0.1,
          background: `linear-gradient(135deg, transparent 50%, ${color} 50%)`,
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div
        className="flex justify-between mb-8"
        style={{ zIndex: 1, position: "relative" }}
      >
        <div className="flex-1">
          {companyInfo?.logo && (
            <img
              src={companyInfo.logo}
              alt="Logo"
              className="mb-2"
              style={{
                width: "60px",
                height: "48px",
                objectFit: "contain",
              }}
            />
          )}
          <h2
            className="text-3xl font-bold mb-1"
            style={{ color: color, fontSize: "28px", marginBottom: "5px" }}
          >
            PAYMENT RECEIPT
          </h2>
          <p className="text-sm text-gray-600">#{receiptData?.receiptNumber}</p>
        </div>
        <div className="flex-1 text-right">
          <h3 className="text-lg font-bold text-gray-800 mb-1">
            {companyInfo?.name || companyInfo?.company_name || "Company Name"}
          </h3>
          <p className="text-sm text-gray-600">{companyInfo?.address}</p>
          <p className="text-sm text-gray-600">
            {[companyInfo?.city, companyInfo?.state].filter(Boolean).join(", ")}
          </p>
          <p className="text-sm text-gray-600">{companyInfo?.phone}</p>
          <p className="text-sm text-gray-600">{companyInfo?.email}</p>
        </div>
      </div>

      {/* Receipt Details */}
      <div className="flex justify-between mb-6">
        <div className="flex-1">
          <h4 className="text-xs font-bold mb-2" style={{ color: color }}>
            RECEIVED FROM:
          </h4>
          <p className="text-base font-bold text-gray-800 mb-1">
            {receiptData?.customer?.name || "Customer"}
          </p>
          {receiptData?.customer?.address && (
            <p className="text-sm text-gray-600">
              {receiptData.customer.address}
            </p>
          )}
          {receiptData?.customer?.phone && (
            <p className="text-sm text-gray-600">
              {receiptData.customer.phone}
            </p>
          )}
          {receiptData?.customer?.email && (
            <p className="text-sm text-gray-600">
              {receiptData.customer.email}
            </p>
          )}
        </div>
        <div className="flex-1 text-right">
          <p className="text-sm text-gray-600 mb-0.5">Payment Date:</p>
          <p className="text-base font-bold text-gray-800 mb-2">
            {receiptData?.date}
          </p>
          <p className="text-sm text-gray-600 mb-0.5">Payment Method:</p>
          <p className="text-base font-bold text-gray-800 mb-2">
            {formatMethod(receiptData?.paymentMethod)}
          </p>
          {/* Status Badge */}
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white mt-1"
            style={{
              backgroundColor:
                receiptData?.status === "completed" ? "#10b981" : "#f59e0b",
            }}
          >
            {receiptData?.status?.toUpperCase() || "COMPLETED"}
          </span>
        </div>
      </div>

      {/* Payment Amount Box */}
      <div
        className="p-5 mb-6 rounded"
        style={{
          backgroundColor: `${color}08`,
        }}
      >
        <div className="space-y-2">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Payment Reference:</span>
            <span className="text-sm font-bold text-gray-800">
              {receiptData?.receiptNumber}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Payment Type:</span>
            <span className="text-sm font-bold text-gray-800">
              {receiptData?.type === "received"
                ? "Payment Received"
                : "Payment Made"}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Payment Method:</span>
            <span className="text-sm font-bold text-gray-800">
              {formatMethod(receiptData?.paymentMethod)}
            </span>
          </div>
          <div
            className="flex justify-between py-3 px-2 mt-2 rounded"
            style={{
              backgroundColor: `${color}15`,
            }}
          >
            <span className="text-base font-bold" style={{ color: color }}>
              AMOUNT PAID:
            </span>
            <span className="text-lg font-bold" style={{ color: color }}>
              {formatCurrency(receiptData?.amountPaid || receiptData?.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Invoice Reference (if applicable) */}
      {receiptData?.invoice && (
        <div className="bg-gray-50 p-4 mb-5 rounded">
          <h4 className="text-sm font-bold text-gray-800 mb-2">
            Invoice Reference
          </h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Invoice Number:</span>
              <span className="text-sm font-bold text-gray-800">
                {receiptData.invoice.invoice_no || receiptData.invoice_number}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Invoice Total:</span>
              <span className="text-sm font-bold text-gray-800">
                {formatCurrency(
                  receiptData.invoice_total || receiptData.invoice?.total
                )}
              </span>
            </div>
            {receiptData.balance_before !== undefined && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Balance Before:</span>
                <span className="text-sm font-bold text-gray-800">
                  {formatCurrency(receiptData.balance_before)}
                </span>
              </div>
            )}
            {receiptData.balance_after !== undefined && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Balance After:</span>
                <span className="text-sm font-bold text-gray-800">
                  {formatCurrency(receiptData.balance_after)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {receiptData?.notes && (
        <div className="bg-gray-50 p-4 mb-5 rounded">
          <h4 className="text-sm font-bold text-gray-800 mb-1">Notes:</h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {receiptData.notes}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-200 pt-4 mt-auto text-center">
        <p className="text-sm text-gray-600">Thank you for your payment!</p>
        <p className="text-sm text-gray-600 mt-1">
          This is a computer-generated receipt.
        </p>
      </div>
    </div>
  );
};

export default ModernReceipt;
