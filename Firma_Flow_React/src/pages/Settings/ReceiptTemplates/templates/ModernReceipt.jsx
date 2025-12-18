// Modern Receipt - Fresh redesign with thermal POS width
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
      className="bg-white mx-auto"
      style={{
        width: "80mm",
        maxWidth: "80mm",
        fontFamily: "'Inter', -apple-system, sans-serif",
        fontSize: "10px",
        boxSizing: "border-box",
      }}
    >
      {/* Colored Header Bar */}
      <div
        className="p-4 text-white"
        style={{
          background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
        }}
      >
        <div className="text-center">
          <div className="text-sm opacity-90 mb-1">PAYMENT RECEIPT</div>
          <div className="text-xl font-bold mb-2">
            #{receiptData?.receiptNumber}
          </div>
          <div className="text-xs opacity-80">{receiptData?.date}</div>
        </div>
      </div>

      {/* Company Info Card */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="text-center">
          <div className="text-sm font-bold text-gray-800 mb-1">
            {companyInfo?.name || companyInfo?.company_name || "Company Name"}
          </div>
          <div className="text-xs text-gray-600">{companyInfo?.address}</div>
          <div className="text-xs text-gray-600">
            {[companyInfo?.city, companyInfo?.state].filter(Boolean).join(", ")}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {companyInfo?.phone} • {companyInfo?.email}
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="p-4 border-b border-gray-200">
        <div
          className="text-xs uppercase tracking-wide mb-2"
          style={{ color: color }}
        >
          Received From
        </div>
        <div className="text-sm font-bold text-gray-900 mb-1">
          {receiptData?.customer?.name || "Customer"}
        </div>
        {receiptData?.customer?.phone && (
          <div className="text-xs text-gray-600">
            {receiptData.customer.phone}
          </div>
        )}
        {receiptData?.customer?.email && (
          <div className="text-xs text-gray-600">
            {receiptData.customer.email}
          </div>
        )}
      </div>

      {/* Payment Method & Status */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs text-gray-600">Payment Method</div>
          <div className="text-xs font-bold text-gray-900">
            {formatMethod(receiptData?.paymentMethod)}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-600">Status</div>
          <div
            className="px-2 py-0.5 rounded text-xs font-bold text-white"
            style={{
              backgroundColor:
                receiptData?.status === "completed" ? "#10b981" : "#f59e0b",
            }}
          >
            {receiptData?.status?.toUpperCase() || "COMPLETED"}
          </div>
        </div>
      </div>

      {/* Items */}
      {receiptData?.items && receiptData.items.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <div
            className="text-xs uppercase tracking-wide mb-3"
            style={{ color: color }}
          >
            Items
          </div>
          {receiptData.items.map((item, index) => (
            <div key={index} className="flex justify-between mb-2 text-xs">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{item.name}</div>
                <div className="text-gray-500">
                  {item.quantity} x {formatCurrency(item.price)}
                </div>
              </div>
              <div className="font-bold text-gray-900">
                {formatCurrency(item.total)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Totals */}
      <div className="p-4">
        {receiptData?.subtotal && (
          <div className="flex justify-between mb-2 text-xs">
            <div className="text-gray-600">Subtotal</div>
            <div className="text-gray-900">
              {formatCurrency(receiptData.subtotal)}
            </div>
          </div>
        )}
        {receiptData?.discount > 0 && (
          <div className="flex justify-between mb-2 text-xs">
            <div className="text-gray-600">Discount</div>
            <div className="text-red-600">
              -{formatCurrency(receiptData.discount)}
            </div>
          </div>
        )}
        {receiptData?.tax > 0 && (
          <div className="flex justify-between mb-2 text-xs">
            <div className="text-gray-600">Tax</div>
            <div className="text-gray-900">
              {formatCurrency(receiptData.tax)}
            </div>
          </div>
        )}
        <div
          className="flex justify-between py-3 mt-3 border-t-2"
          style={{ borderColor: color }}
        >
          <div className="text-sm font-bold" style={{ color: color }}>
            TOTAL PAID
          </div>
          <div className="text-lg font-bold" style={{ color: color }}>
            {formatCurrency(receiptData?.amountPaid || receiptData?.total)}
          </div>
        </div>
      </div>

      {/* Invoice Reference */}
      {receiptData?.invoice && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div
            className="text-xs uppercase tracking-wide mb-2"
            style={{ color: color }}
          >
            Invoice Reference
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Invoice #:</span>
              <span className="font-bold text-gray-900">
                {receiptData.invoice.invoice_no || receiptData.invoice_number}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Invoice Total:</span>
              <span className="font-bold text-gray-900">
                {formatCurrency(
                  receiptData.invoice_total || receiptData.invoice?.total
                )}
              </span>
            </div>
            {receiptData.balance_after !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Balance:</span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(receiptData.balance_after)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {receiptData?.notes && (
        <div className="p-4 bg-yellow-50 border-t border-yellow-200">
          <div className="text-xs font-bold text-yellow-900 mb-1">Note</div>
          <div className="text-xs text-yellow-800">{receiptData.notes}</div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
        <div className="text-xs text-gray-600 mb-1">
          Thank you for your payment!
        </div>
        <div className="text-xs text-gray-500">Powered by FirmaFlow</div>
      </div>
    </div>
  );
};

export default ModernReceipt;
