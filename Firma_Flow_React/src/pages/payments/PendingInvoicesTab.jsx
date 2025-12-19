import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, CreditCard, RotateCcw, Eye } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";
import PayInvoiceModal from "./PayInvoiceModal";
import RefundPaymentModal from "./RefundPaymentModal";
import ViewInvoiceModal from "../sales/ViewInvoiceModal";

const PendingInvoicesTab = ({ invoices, onRefresh, searchQuery }) => {
  const { theme } = useTheme();
  const { formatCurrency, formatDate } = useSettings();
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const buttonRefs = useRef({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    const updatePosition = () => {
      if (openDropdown && buttonRefs.current[openDropdown]) {
        const rect = buttonRefs.current[openDropdown].getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + 8,
          left: rect.right - 192,
        });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [openDropdown]);

  // Filter invoices based on search query
  const filteredInvoices = invoices.filter((invoice) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      invoice.invoice_number?.toLowerCase().includes(query) ||
      invoice.invoice_no?.toLowerCase().includes(query) ||
      invoice.customer_name?.toLowerCase().includes(query) ||
      invoice.total?.toString().includes(query)
    );
  });

  if (!filteredInvoices || filteredInvoices.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className={`text-lg ${theme.textSecondary}`}>
          No pending invoices found. All invoices have been paid!
        </p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "unpaid":
        return "bg-red-100 text-red-700";
      case "partial":
        return "bg-yellow-100 text-yellow-700";
      case "overdue":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const calculateBalance = (invoice) => {
    const total = parseFloat(invoice.total || 0);
    const paid = parseFloat(invoice.amount_paid || 0);
    return total - paid;
  };

  const handlePay = (invoice) => {
    console.log("handlePay called with invoice:", invoice);
    setSelectedInvoice(invoice);
    setIsPayModalOpen(true);
    setOpenDropdown(null);
  };

  const handleRefund = (invoice) => {
    console.log("handleRefund called with invoice:", invoice);
    setSelectedInvoice(invoice);
    setIsRefundModalOpen(true);
    setOpenDropdown(null);
  };

  const handlePaymentSuccess = () => {
    setIsPayModalOpen(false);
    setSelectedInvoice(null);
    onRefresh?.();
  };

  const handleRefundSuccess = () => {
    setIsRefundModalOpen(false);
    setSelectedInvoice(null);
    onRefresh?.();
  };

  // Determine payment status
  const getPaymentStatus = (invoice) => {
    const total = parseFloat(invoice.total || 0);
    const paid = parseFloat(invoice.amount_paid || 0);

    if (paid <= 0) return "unpaid";
    if (paid >= total) return "paid";
    return "partial";
  };

  const handleToggleDropdown = (invoice) => {
    if (openDropdown === invoice.id) {
      setOpenDropdown(null);
    } else {
      if (buttonRefs.current[invoice.id]) {
        const rect = buttonRefs.current[invoice.id].getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + 8,
          left: rect.right - 192,
        });
      }
      setOpenDropdown(invoice.id);
    }
  };

  const handleView = (invoice) => {
    console.log("handleView called with invoice:", invoice);
    setSelectedInvoice(invoice);
    setIsViewModalOpen(true);
    setOpenDropdown(null);
  };

  // Render action - always show 3-dot dropdown menu (consistent with other tables)
  const renderAction = (invoice) => {
    const status = getPaymentStatus(invoice);
    const amountPaid = parseFloat(invoice.amount_paid || 0);
    const isDropdownOpen = openDropdown === invoice.id;

    return (
      <div className="relative">
        <button
          ref={(el) => (buttonRefs.current[invoice.id] = el)}
          onClick={() => handleToggleDropdown(invoice)}
          className={`p-2 ${theme.bgHover} rounded-lg transition`}
        >
          <MoreHorizontal size={18} className={theme.textSecondary} />
        </button>

        {isDropdownOpen && (
          <div
            ref={dropdownRef}
            className={`fixed w-48 ${theme.bgCard} rounded-lg ${theme.shadow} border ${theme.borderPrimary} py-1 z-[9999]`}
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
          >
            <button
              onClick={() => handleView(invoice)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${theme.textPrimary} hover:${theme.bgHover} transition text-left`}
            >
              <Eye size={16} />
              View Invoice
            </button>

            {/* Show Make Payment for unpaid or partial */}
            {status !== "paid" && (
              <button
                onClick={() => handlePay(invoice)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${theme.textPrimary} hover:${theme.bgHover} transition text-left`}
              >
                <CreditCard size={16} className="text-green-600" />
                Make Payment
              </button>
            )}

            {/* Show Refund for paid or partial (only if some amount has been paid) */}
            {amountPaid > 0 && (
              <>
                <div className={`border-t ${theme.borderPrimary} my-1`}></div>
                <button
                  onClick={() => handleRefund(invoice)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-orange-600 ${
                    theme.mode === "light"
                      ? "hover:bg-orange-50"
                      : "hover:bg-orange-900/20"
                  } transition text-left`}
                >
                  <RotateCcw size={16} />
                  Refund Payment
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr
              className={`bg-gradient-to-r ${
                theme.mode === "light"
                  ? "from-slate-50 to-slate-100"
                  : "from-slate-700 to-slate-600"
              } border-b-2 ${theme.borderSecondary}`}
            >
              <th
                className={`text-left p-4 font-semibold text-sm ${theme.textPrimary}`}
              >
                Invoice #
              </th>
              <th
                className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
              >
                Customer
              </th>
              <th
                className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
              >
                Issue Date
              </th>
              <th
                className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
              >
                Due Date
              </th>
              <th
                className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
              >
                Total
              </th>
              <th
                className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
              >
                Paid
              </th>
              <th
                className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
              >
                Balance
              </th>
              <th
                className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
              >
                Status
              </th>
              <th
                className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice, index) => (
              <tr
                key={invoice.id || index}
                className={`border-b ${theme.borderPrimary} ${
                  theme.mode === "light"
                    ? "hover:bg-slate-50"
                    : "hover:bg-slate-700"
                } transition text-sm`}
              >
                <td className={`p-4 ${theme.textPrimary} font-medium`}>
                  {invoice.invoice_number || invoice.invoice_no || "N/A"}
                </td>
                <td className={`p-4 ${theme.textSecondary}`}>
                  {invoice.customer_name || "N/A"}
                </td>
                <td className={`p-4 ${theme.textSecondary}`}>
                  {formatDate(invoice.invoice_date)}
                </td>
                <td className={`p-4 ${theme.textSecondary}`}>
                  {formatDate(invoice.due_date)}
                </td>
                <td className={`p-4 ${theme.textPrimary} font-semibold`}>
                  {formatCurrency(invoice.total || 0)}
                </td>
                <td className={`p-4 ${theme.textSecondary}`}>
                  {formatCurrency(invoice.amount_paid || 0)}
                </td>
                <td className={`p-4 ${theme.textPrimary} font-semibold`}>
                  {formatCurrency(calculateBalance(invoice))}
                </td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                      invoice.status
                    )}`}
                  >
                    {invoice.status || "Unpaid"}
                  </span>
                </td>
                <td className="p-4">{renderAction(invoice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pay Invoice Modal */}
      {isPayModalOpen && selectedInvoice && (
        <PayInvoiceModal
          isOpen={isPayModalOpen}
          onClose={() => {
            setIsPayModalOpen(false);
            setSelectedInvoice(null);
          }}
          onSuccess={handlePaymentSuccess}
          invoice={selectedInvoice}
        />
      )}

      {/* Refund Payment Modal */}
      {isRefundModalOpen && selectedInvoice && (
        <RefundPaymentModal
          isOpen={isRefundModalOpen}
          onClose={() => {
            setIsRefundModalOpen(false);
            setSelectedInvoice(null);
          }}
          onSuccess={handleRefundSuccess}
          invoice={selectedInvoice}
        />
      )}

      {/* View Invoice Modal */}
      {isViewModalOpen && selectedInvoice && (
        <ViewInvoiceModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
        />
      )}
    </>
  );
};

export default PendingInvoicesTab;
