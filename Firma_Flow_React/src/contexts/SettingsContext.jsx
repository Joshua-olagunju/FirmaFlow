import { createContext, useContext, useState, useEffect } from "react";

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem("userCurrency") || "NGN";
  });

  const [dateFormat, setDateFormat] = useState(() => {
    return localStorage.getItem("userDateFormat") || "DD/MM/YYYY";
  });

  useEffect(() => {
    localStorage.setItem("userCurrency", currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem("userDateFormat", dateFormat);
  }, [dateFormat]);

  // Currency symbols mapping
  const currencySymbols = {
    NGN: "₦",
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CNY: "¥",
    INR: "₹",
    ZAR: "R",
    KES: "KSh",
    GHS: "₵",
  };

  // Format currency value
  const formatCurrency = (amount, showSymbol = true) => {
    const numAmount = parseFloat(amount) || 0;
    const symbol = currencySymbols[currency] || currency;

    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);

    return showSymbol ? `${symbol}${formatted}` : formatted;
  };

  // Format date according to selected format
  const formatDate = (date) => {
    if (!date) return "";

    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    switch (dateFormat) {
      case "MM/DD/YYYY":
        return `${month}/${day}/${year}`;
      case "YYYY-MM-DD":
        return `${year}-${month}-${day}`;
      case "DD-MM-YYYY":
        return `${day}-${month}-${year}`;
      case "YYYY/MM/DD":
        return `${year}/${month}/${day}`;
      case "DD/MM/YYYY":
      default:
        return `${day}/${month}/${year}`;
    }
  };

  const value = {
    currency,
    setCurrency,
    dateFormat,
    setDateFormat,
    currencySymbols,
    formatCurrency,
    formatDate,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
