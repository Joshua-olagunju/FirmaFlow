import { useState, useEffect } from "react";
import { X, Package, Calendar, FileText, DollarSign } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";
import { buildApiUrl } from "../../config/api.config";

const ViewPurchaseModal = ({ isOpen, onClose, bill }) => {
  const { theme } = useTheme();
  const { formatCurrency, formatDate } = useSettings();
  const [purchaseDetails, setPurchaseDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && bill?.id) {
      fetchPurchaseDetails();
    }
  }, [isOpen, bill]);

  const fetchPurchaseDetails = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(
        buildApiUrl(`api/purchases.php?id=${bill.id}`),
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setPurchaseDetails(data);
      } else {
        setError(data.error || "Failed to fetch purchase details");
      }
    } catch (err) {
      console.error("Error fetching purchase details:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !bill) return null;

  const calculateBalance = () => {
    const total = parseFloat(bill.total || bill.grand_total || 0);
    const paid = parseFloat(bill.amount_paid || 0);
    return total - paid;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-700";
      case "partial":
      case "partially_paid":
        return "bg-yellow-100 text-yellow-700";
      case "unpaid":
      case "received":
        return "bg-red-100 text-red-700";
      case "overdue":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const total = parseFloat(bill.total || bill.grand_total || 0);
  const paid = parseFloat(bill.amount_paid || 0);
  const balance = calculateBalance();

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`${theme.bgCard} rounded-xl ${theme.shadow} max-w-3xl w-full max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 flex justify-between items-center rounded-t-xl sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Package className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Purchase Details</h2>
              <p className="text-sm text-white/80">
                {bill.bill_number || bill.purchase_number}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className={`text-lg ${theme.textSecondary}`}>
                Loading purchase details...
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-lg text-red-600">{error}</div>
            </div>
          ) : (
            <>
              {/* Summary Section */}
              <div
                className={`mb-6 p-4 rounded-lg border ${theme.borderSecondary} bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20`}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={16} className={theme.textSecondary} />
                      <span
                        className={`text-sm font-medium ${theme.textSecondary}`}
                      >
                        Bill Information
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className={`text-sm ${theme.textTertiary}`}>
                          Supplier:
                        </span>
                        <span
                          className={`text-sm font-semibold ${theme.textPrimary}`}
                        >
                          {bill.supplier_name || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${theme.textTertiary}`}>
                          Bill Date:
                        </span>
                        <span
                          className={`text-sm font-semibold ${theme.textPrimary}`}
                        >
                          {formatDate(bill.bill_date || bill.purchase_date)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${theme.textTertiary}`}>
                          Due Date:
                        </span>
                        <span
                          className={`text-sm font-semibold ${theme.textPrimary}`}
                        >
                          {formatDate(bill.due_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign size={16} className={theme.textSecondary} />
                      <span
                        className={`text-sm font-medium ${theme.textSecondary}`}
                      >
                        Payment Information
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className={`text-sm ${theme.textTertiary}`}>
                          Total:
                        </span>
                        <span
                          className={`text-sm font-semibold ${theme.textPrimary}`}
                        >
                          {formatCurrency(total)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${theme.textTertiary}`}>
                          Paid:
                        </span>
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(paid)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${theme.textTertiary}`}>
                          Balance:
                        </span>
                        <span className="text-sm font-bold text-red-600">
                          {formatCurrency(balance)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${theme.textTertiary}`}>
                          Status:
                        </span>
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(
                            bill.status
                          )}`}
                        >
                          {bill.status
                            ? bill.status.charAt(0).toUpperCase() +
                              bill.status.slice(1)
                            : "Unpaid"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div className="mb-6">
                <h4
                  className={`text-md font-semibold ${theme.textPrimary} mb-4`}
                >
                  Purchase Items
                </h4>
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
                          className={`text-left p-3 font-semibold text-sm ${theme.textPrimary}`}
                        >
                          Description
                        </th>
                        <th
                          className={`text-right p-3 font-semibold text-sm ${theme.textPrimary}`}
                        >
                          Quantity
                        </th>
                        <th
                          className={`text-right p-3 font-semibold text-sm ${theme.textPrimary}`}
                        >
                          Unit Cost
                        </th>
                        <th
                          className={`text-right p-3 font-semibold text-sm ${theme.textPrimary}`}
                        >
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseDetails?.lines?.length > 0 ? (
                        purchaseDetails.lines.map((line, index) => (
                          <tr
                            key={index}
                            className={`border-b ${theme.borderPrimary}`}
                          >
                            <td className={`p-3 ${theme.textPrimary}`}>
                              {line.description || line.product_name || "N/A"}
                            </td>
                            <td
                              className={`p-3 text-right ${theme.textSecondary}`}
                            >
                              {line.quantity}
                            </td>
                            <td
                              className={`p-3 text-right ${theme.textSecondary}`}
                            >
                              {formatCurrency(line.unit_cost || 0)}
                            </td>
                            <td
                              className={`p-3 text-right font-semibold ${theme.textPrimary}`}
                            >
                              {formatCurrency(line.line_total || 0)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
                            className={`p-4 text-center ${theme.textSecondary}`}
                          >
                            No items found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes Section */}
              {bill.notes && (
                <div className="mb-6">
                  <h4
                    className={`text-md font-semibold ${theme.textPrimary} mb-2`}
                  >
                    Notes
                  </h4>
                  <p
                    className={`text-sm ${theme.textSecondary} p-3 rounded-lg border ${theme.borderSecondary}`}
                  >
                    {bill.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={onClose}
                  className={`px-6 py-2 border ${theme.borderSecondary} ${theme.textPrimary} rounded-lg ${theme.bgHover} transition`}
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewPurchaseModal;
