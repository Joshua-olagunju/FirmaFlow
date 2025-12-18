/**
 * PDF Font Registration for @react-pdf/renderer
 *
 * This file registers Noto Sans fonts which have full Unicode support
 * for currency symbols including:
 * - ₦ (Nigerian Naira)
 * - € (Euro)
 * - £ (British Pound)
 * - ¥ (Japanese Yen / Chinese Yuan)
 * - ₹ (Indian Rupee)
 * - ₵ (Ghana Cedi)
 *
 * IMPORTANT: Import this file at the top of any PDF component that needs
 * currency symbol support BEFORE defining styles or components.
 */

import { Font } from "@react-pdf/renderer";

// Register Noto Sans fonts - LOCAL files with FULL Unicode support
// Supports ALL currency symbols: ₦ (Naira), ₵ (Cedi), ₹ (Rupee), € (Euro), £ (Pound), ¥ (Yen)
Font.register({
  family: "NotoSans",
  fonts: [
    {
      src: "/fonts/NotoSans-Regular.ttf",
      fontWeight: 400,
      fontStyle: "normal",
    },
    {
      src: "/fonts/NotoSans-Bold.ttf",
      fontWeight: 700,
      fontStyle: "normal",
    },
  ],
});

// Currency symbols mapping with actual Unicode symbols
// These will render correctly when using NotoSans font family
export const currencySymbols = {
  NGN: "₦", // Nigerian Naira
  USD: "$", // US Dollar
  EUR: "€", // Euro
  GBP: "£", // British Pound
  JPY: "¥", // Japanese Yen
  CNY: "¥", // Chinese Yuan
  INR: "₹", // Indian Rupee
  ZAR: "R", // South African Rand
  KES: "KSh", // Kenyan Shilling
  GHS: "₵", // Ghanaian Cedi
};

// Helper function to format currency with proper symbols
export const formatCurrencyWithSymbol = (amount, currency = "NGN") => {
  const symbol = currencySymbols[currency] || currency;
  const formatted = parseFloat(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
};

// Export font family name for easy reference
export const PDF_FONT_FAMILY = "NotoSans";
export const PDF_FONT_BOLD = "NotoSans";

export default {
  currencySymbols,
  formatCurrencyWithSymbol,
  PDF_FONT_FAMILY,
  PDF_FONT_BOLD,
};
