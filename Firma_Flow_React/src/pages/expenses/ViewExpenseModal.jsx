import {
  X,
  Calendar,
  DollarSign,
  FileText,
  CreditCard,
  User,
  Tag,
  StickyNote,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";

const ViewExpenseModal = ({ isOpen, onClose, expense }) => {
  const { theme } = useTheme();
  const { formatCurrency, formatDate } = useSettings();

  if (!isOpen || !expense) return null;

  const categoryLabels = {
    salary_wages: "Salary & Wages",
    utilities: "Utilities",
    rent_lease: "Rent & Lease",
    office_supplies: "Office Supplies",
    professional_fees: "Professional Fees",
    marketing_advertising: "Marketing & Advertising",
    travel_transport: "Travel and Transport",
    insurance: "Insurance",
    equipment_machinery: "Equipment & Machinery",
    maintenance_repairs: "Maintenance & Repairs",
    others: "Others",
  };

  const paymentMethodLabels = {
    cash: "Cash",
    bank_transfer: "Bank Transfer",
    cheque: "Cheque",
    card: "Credit Card",
    mobile_money: "Mobile Money",
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-700 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "approved":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`${theme.bgCard} rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto ${theme.shadow}`}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Expense Details</h2>
              <p className="text-slate-200 text-sm mt-1">
                {expense.reference_number}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex justify-end">
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize border ${getStatusColor(
                expense.status
              )}`}
            >
              {expense.status || "Paid"}
            </span>
          </div>

          {/* Expense Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reference Number */}
            <div
              className={`${theme.bgAccent} rounded-lg p-4 border ${theme.borderSecondary}`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg">
                  <FileText size={20} className="text-white" />
                </div>
                <div>
                  <p className={`text-xs ${theme.textTertiary} mb-1`}>
                    Reference Number
                  </p>
                  <p className={`text-sm font-semibold ${theme.textPrimary}`}>
                    {expense.reference_number}
                  </p>
                </div>
              </div>
            </div>

            {/* Expense Date */}
            <div
              className={`${theme.bgAccent} rounded-lg p-4 border ${theme.borderSecondary}`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg">
                  <Calendar size={20} className="text-white" />
                </div>
                <div>
                  <p className={`text-xs ${theme.textTertiary} mb-1`}>
                    Expense Date
                  </p>
                  <p className={`text-sm font-semibold ${theme.textPrimary}`}>
                    {formatDate(expense.expense_date)}
                  </p>
                </div>
              </div>
            </div>

            {/* Payee Name */}
            <div
              className={`${theme.bgAccent} rounded-lg p-4 border ${theme.borderSecondary}`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg">
                  <User size={20} className="text-white" />
                </div>
                <div>
                  <p className={`text-xs ${theme.textTertiary} mb-1`}>
                    Payee Name
                  </p>
                  <p className={`text-sm font-semibold ${theme.textPrimary}`}>
                    {expense.payee_name || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Category */}
            <div
              className={`${theme.bgAccent} rounded-lg p-4 border ${theme.borderSecondary}`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg">
                  <Tag size={20} className="text-white" />
                </div>
                <div>
                  <p className={`text-xs ${theme.textTertiary} mb-1`}>
                    Category
                  </p>
                  <p className={`text-sm font-semibold ${theme.textPrimary}`}>
                    {categoryLabels[expense.category] ||
                      expense.category ||
                      "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div
              className={`${theme.bgAccent} rounded-lg p-4 border ${theme.borderSecondary}`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg">
                  <DollarSign size={20} className="text-white" />
                </div>
                <div>
                  <p className={`text-xs ${theme.textTertiary} mb-1`}>Amount</p>
                  <p className={`text-lg font-bold ${theme.textPrimary}`}>
                    {formatCurrency(expense.amount || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div
              className={`${theme.bgAccent} rounded-lg p-4 border ${theme.borderSecondary}`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg">
                  <CreditCard size={20} className="text-white" />
                </div>
                <div>
                  <p className={`text-xs ${theme.textTertiary} mb-1`}>
                    Payment Method
                  </p>
                  <p className={`text-sm font-semibold ${theme.textPrimary}`}>
                    {paymentMethodLabels[expense.payment_method] ||
                      expense.payment_method ||
                      "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {expense.description && (
            <div
              className={`${theme.bgAccent} rounded-lg p-4 border ${theme.borderSecondary}`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg">
                  <FileText size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${theme.textPrimary} mb-2`}
                  >
                    Description
                  </p>
                  <p
                    className={`text-sm ${theme.textSecondary} leading-relaxed`}
                  >
                    {expense.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Additional Notes */}
          {expense.additional_notes && (
            <div
              className={`${theme.bgAccent} rounded-lg p-4 border ${theme.borderSecondary}`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg">
                  <StickyNote size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${theme.textPrimary} mb-2`}
                  >
                    Additional Notes
                  </p>
                  <p
                    className={`text-sm ${theme.textSecondary} leading-relaxed`}
                  >
                    {expense.additional_notes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div
            className={`text-xs ${theme.textTertiary} flex justify-between pt-4 border-t ${theme.borderSecondary}`}
          >
            {expense.created_at && (
              <span>
                Created: {new Date(expense.created_at).toLocaleString()}
              </span>
            )}
            {expense.updated_at && (
              <span>
                Updated: {new Date(expense.updated_at).toLocaleString()}
              </span>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg hover:opacity-90 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewExpenseModal;
