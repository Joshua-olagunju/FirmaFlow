import { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";
import { DollarSign, Calendar, Save } from "lucide-react";

const GeneralSettings = () => {
  const { theme } = useTheme();
  const { currency, setCurrency, dateFormat, setDateFormat } = useSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const currencies = [
    { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "ZAR", symbol: "R", name: "South African Rand" },
    { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
    { code: "GHS", symbol: "₵", name: "Ghanaian Cedi" },
  ];

  const dateFormats = [
    { value: "DD/MM/YYYY", label: "DD/MM/YYYY (31/12/2025)" },
    { value: "MM/DD/YYYY", label: "MM/DD/YYYY (12/31/2025)" },
    { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2025-12-31)" },
    { value: "DD-MM-YYYY", label: "DD-MM-YYYY (31-12-2025)" },
    { value: "MM-DD-YYYY", label: "MM-DD-YYYY (12-31-2025)" },
  ];

  const handleCurrencyChange = (e) => {
    setCurrency(e.target.value);
  };

  const handleDateFormatChange = (e) => {
    setDateFormat(e.target.value);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage("");

    try {
      // Settings are automatically saved via context
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      setSuccessMessage("Settings saved successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCurrency = currencies.find((c) => c.code === currency);

  return (
    <div className={`${theme.bgCard} ${theme.shadow} rounded-xl p-6`}>
      {/* Header */}
      <div className="mb-6">
        <h2
          className={`text-2xl font-bold ${theme.textPrimary} flex items-center gap-2`}
        >
          <DollarSign size={24} />
          General Settings
        </h2>
        <p className={`${theme.textSecondary} mt-1`}>
          Configure your preferred currency and date format
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      <div className="space-y-6">
        {/* Currency Settings */}
        <div
          className={`${theme.bgAccent} rounded-lg p-6 border ${theme.borderSecondary}`}
        >
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={20} className={theme.textPrimary} />
            <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>
              Currency Settings
            </h3>
          </div>
          <p className={`${theme.textSecondary} text-sm mb-4`}>
            Select your preferred currency symbol for display. This changes the
            currency symbol (₦, $, €, etc.) shown throughout the application.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Preferred Currency <span className="text-red-500">*</span>
              </label>
              <select
                name="currency"
                value={currency}
                onChange={handleCurrencyChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${theme.bgInput} ${theme.textPrimary} ${theme.borderSecondary}`}
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name} ({currency.code})
                  </option>
                ))}
              </select>
            </div>

            <div
              className={`flex items-center justify-center ${theme.bgInput} border ${theme.borderSecondary} rounded-lg p-4`}
            >
              <div className="text-center">
                <p className={`${theme.textSecondary} text-sm mb-1`}>
                  Selected Currency
                </p>
                <p className={`${theme.textPrimary} text-3xl font-bold`}>
                  {selectedCurrency?.symbol}
                </p>
                <p className={`${theme.textSecondary} text-sm mt-1`}>
                  {selectedCurrency?.code}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg`}
          >
            <p className="text-blue-800 text-sm font-semibold mb-2">
              ℹ️ Important: Symbol Display Only
            </p>
            <p className="text-blue-700 text-xs leading-relaxed">
              • All monetary values are stored in Nigerian Naira (NGN) in the
              database
              <br />• Changing currency only updates the{" "}
              <strong>symbol displayed</strong> (₦ → $ → € etc.)
              <br />
              • No currency conversion is performed - values remain the same
              <br />• This is a display preference for users familiar with
              different currency symbols
            </p>
          </div>
        </div>

        {/* Date Format Settings */}
        <div
          className={`${theme.bgAccent} rounded-lg p-6 border ${theme.borderSecondary}`}
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={20} className={theme.textPrimary} />
            <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>
              Date Format Settings
            </h3>
          </div>
          <p className={`${theme.textSecondary} text-sm mb-4`}>
            Choose how dates should be displayed across the application.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Date Format <span className="text-red-500">*</span>
              </label>
              <select
                name="dateFormat"
                value={dateFormat}
                onChange={handleDateFormatChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${theme.bgInput} ${theme.textPrimary} ${theme.borderSecondary}`}
              >
                {dateFormats.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
            </div>

            <div
              className={`flex items-center justify-center ${theme.bgInput} border ${theme.borderSecondary} rounded-lg p-4`}
            >
              <div className="text-center">
                <p className={`${theme.textSecondary} text-sm mb-1`}>Preview</p>
                <p className={`${theme.textPrimary} text-xl font-semibold`}>
                  {dateFormat}
                </p>
                <p className={`${theme.textSecondary} text-xs mt-1`}>
                  Current format
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg shadow-lg hover:opacity-90 transition ${
              isSaving ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Save size={18} />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
