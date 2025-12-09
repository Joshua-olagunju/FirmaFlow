import { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";

const InvoiceTotals = ({ items, setDiscount, taxRate }) => {
  const { theme } = useTheme();
  const { formatCurrency } = useSettings();
  const [discountType, setDiscountType] = useState("percentage"); // "percentage" or "amount"
  const [discountValue, setDiscountValue] = useState(0);

  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);

  // Calculate discount amount
  const discountAmount =
    discountType === "percentage"
      ? (subtotal * discountValue) / 100
      : discountValue;

  // Calculate tax (after discount)
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = (afterDiscount * taxRate) / 100;

  // Calculate final total
  const total = afterDiscount + taxAmount;

  // Update parent component when discount changes
  useEffect(() => {
    setDiscount(discountAmount);
  }, [discountAmount, setDiscount]);

  return (
    <div
      className={`${
        theme.mode === "light" ? "bg-slate-50" : "bg-slate-700/30"
      } rounded-lg p-4 space-y-3 border ${theme.borderPrimary}`}
    >
      {/* Subtotal */}
      <div className="flex justify-between items-center">
        <span className={`text-sm font-medium ${theme.textSecondary}`}>
          Subtotal
        </span>
        <span className={`text-sm font-semibold ${theme.textPrimary}`}>
          {formatCurrency(subtotal)}
        </span>
      </div>

      {/* Discount Input */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label
            className={`text-sm font-medium ${theme.textSecondary} flex-1`}
          >
            Discount
          </label>
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value)}
            className={`px-2 py-1 border ${theme.borderPrimary} rounded ${theme.bgInput} ${theme.textPrimary} text-xs focus:ring-2 focus:ring-blue-500`}
          >
            <option value="percentage">%</option>
            <option value="amount">Amount</option>
          </select>
        </div>
        <input
          type="number"
          min="0"
          step={discountType === "percentage" ? "0.1" : "0.01"}
          max={discountType === "percentage" ? "100" : subtotal}
          value={discountValue}
          onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
          placeholder={discountType === "percentage" ? "0%" : "0.00"}
          className={`w-full px-3 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgInput} ${theme.textPrimary} focus:ring-2 focus:ring-blue-500 text-sm`}
        />
      </div>

      {/* Discount Amount Display */}
      {discountAmount > 0 && (
        <div className="flex justify-between items-center text-red-600">
          <span className="text-sm font-medium">Discount Applied</span>
          <span className="text-sm font-semibold">
            -{formatCurrency(discountAmount)}
          </span>
        </div>
      )}

      {/* After Discount */}
      {discountAmount > 0 && (
        <div className="flex justify-between items-center border-t pt-2">
          <span className={`text-sm font-medium ${theme.textSecondary}`}>
            After Discount
          </span>
          <span className={`text-sm font-semibold ${theme.textPrimary}`}>
            {formatCurrency(afterDiscount)}
          </span>
        </div>
      )}

      {/* Tax */}
      <div className="flex justify-between items-center">
        <span className={`text-sm font-medium ${theme.textSecondary}`}>
          Tax ({taxRate}%)
        </span>
        <span className={`text-sm font-semibold ${theme.textPrimary}`}>
          {formatCurrency(taxAmount)}
        </span>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center pt-3 border-t-2 border-blue-500">
        <span className={`text-lg font-bold ${theme.textPrimary}`}>Total</span>
        <span className="text-lg font-bold text-blue-600">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
};

export default InvoiceTotals;
