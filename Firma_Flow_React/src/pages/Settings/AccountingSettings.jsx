import { useTheme } from "../../contexts/ThemeContext";
import { DollarSign, Lock, Check, AlertCircle } from "lucide-react";

const AccountingSettings = () => {
  const { theme } = useTheme();

  const defaultAccounts = [
    {
      type: "Cash & Bank",
      code: "1000",
      name: "Cash & Bank",
      accountType: "asset",
      status: "Active",
    },
    {
      type: "Accounts Receivable",
      code: "1200",
      name: "Accounts Receivable",
      accountType: "asset",
      status: "Active",
    },
    {
      type: "Inventory",
      code: "1300",
      name: "Inventory",
      accountType: "asset",
      status: "Active",
    },
    {
      type: "Accounts Payable",
      code: "2000",
      name: "Accounts Payable",
      accountType: "liability",
      status: "Active",
    },
    {
      type: "Retained Earnings",
      code: "3000",
      name: "Retained Earnings",
      accountType: "equity",
      status: "Active",
    },
    {
      type: "Sales Revenue",
      code: "4000",
      name: "Sales Revenue",
      accountType: "revenue",
      status: "Active",
    },
    {
      type: "Cost of Goods Sold",
      code: "5000",
      name: "Cost of Goods Sold",
      accountType: "expense",
      status: "Active",
    },
  ];

  const journalPatterns = [
    {
      transaction: "Sales Payment",
      debit: "Cash & Bank",
      credit: "Accounts Receivable",
    },
    {
      transaction: "Purchase Payment",
      debit: "Accounts Payable",
      credit: "Cash & Bank",
    },
    {
      transaction: "Sales Invoice",
      debit: "Accounts Receivable",
      credit: "Sales Revenue",
    },
    {
      transaction: "Inventory Opening",
      debit: "Inventory",
      credit: "Retained Earnings",
    },
  ];

  const benefits = [
    {
      title: "Always Balanced",
      description: "Every journal entry follows proven double-entry patterns",
    },
    {
      title: "Zero Configuration",
      description: "Works immediately for new companies",
    },
    {
      title: "Consistent",
      description: "All companies use the same reliable structure",
    },
    {
      title: "Error-Proof",
      description: "Impossible to misconfigure accounting",
    },
    {
      title: "Payment-Triggered",
      description: "Journal entries only created when money moves",
    },
  ];

  return (
    <div
      className={`${theme.bgCard} ${theme.shadow} rounded-xl p-4 md:p-6 max-w-full`}
    >
      {/* Header */}
      <div className="mb-6">
        <h2
          className={`text-2xl font-bold ${theme.textPrimary} flex items-center gap-2`}
        >
          <DollarSign size={24} />
          Accounting Settings
        </h2>
      </div>

      {/* Smart Defaults Enabled Badge - Full Width */}
      <div className="mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Lock size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-green-800 font-semibold flex items-center gap-2 mb-2">
                Smart Defaults Enabled
              </h3>
              <p className="text-green-700 text-sm">
                Your account structure is automatically managed to ensure
                balanced books. All transactions use the optimal chart of
                accounts with guaranteed double-entry balance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Default Account Structure - Full Width */}
      <div className="mb-6">
        <div
          className={`${theme.bgAccent} rounded-lg p-6 border ${theme.borderSecondary}`}
        >
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
            Default Account Structure
          </h3>

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
                    Account Type
                  </th>
                  <th
                    className={`text-left p-3 font-semibold text-sm ${theme.textPrimary}`}
                  >
                    Code
                  </th>
                  <th
                    className={`text-left p-3 font-semibold text-sm ${theme.textPrimary}`}
                  >
                    Name
                  </th>
                  <th
                    className={`text-left p-3 font-semibold text-sm ${theme.textPrimary}`}
                  >
                    Type
                  </th>
                  <th
                    className={`text-left p-3 font-semibold text-sm ${theme.textPrimary}`}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {defaultAccounts.map((account, index) => (
                  <tr
                    key={index}
                    className={`border-b ${theme.borderPrimary} ${
                      theme.mode === "light"
                        ? "hover:bg-slate-50"
                        : "hover:bg-slate-700"
                    } transition`}
                  >
                    <td
                      className={`p-3 ${theme.textPrimary} font-medium text-sm`}
                    >
                      {account.type}
                    </td>
                    <td className={`p-3 ${theme.textSecondary} text-sm`}>
                      {account.code}
                    </td>
                    <td className={`p-3 ${theme.textPrimary} text-sm`}>
                      {account.name}
                    </td>
                    <td
                      className={`p-3 ${theme.textSecondary} text-sm capitalize`}
                    >
                      {account.accountType}
                    </td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                        <Check size={16} />
                        {account.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Guaranteed Journal Patterns and Smart Defaults Benefits - Same Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Guaranteed Journal Patterns */}
        <div
          className={`${theme.bgAccent} rounded-lg p-6 border ${theme.borderSecondary} min-w-0`}
        >
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
            Guaranteed Journal Patterns
          </h3>

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
                    Transaction
                  </th>
                  <th
                    className={`text-left p-3 font-semibold text-sm ${theme.textPrimary}`}
                  >
                    Debit
                  </th>
                  <th
                    className={`text-left p-3 font-semibold text-sm ${theme.textPrimary}`}
                  >
                    Credit
                  </th>
                </tr>
              </thead>
              <tbody>
                {journalPatterns.map((pattern, index) => (
                  <tr key={index} className={`border-b ${theme.borderPrimary}`}>
                    <td
                      className={`p-3 ${theme.textPrimary} font-medium text-sm`}
                    >
                      {pattern.transaction}
                    </td>
                    <td className={`p-3 ${theme.textSecondary} text-sm`}>
                      {pattern.debit}
                    </td>
                    <td className={`p-3 ${theme.textSecondary} text-sm`}>
                      {pattern.credit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Smart Defaults Benefits */}
        <div
          className={`${theme.bgAccent} rounded-lg p-6 border ${theme.borderSecondary} min-w-0`}
        >
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
            Smart Defaults Benefits
          </h3>

          <div className="space-y-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <Check size={18} className="text-green-600" />
                </div>
                <div>
                  <p className={`${theme.textPrimary} font-medium text-sm`}>
                    {benefit.title}:
                  </p>
                  <p className={`${theme.textSecondary} text-sm`}>
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Configuration - Full Width */}
      <div
        className={`${theme.bgAccent} rounded-lg p-6 border ${theme.borderSecondary}`}
      >
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-3`}>
          Advanced Configuration
        </h3>
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className={theme.textSecondary} />
          <p className={`${theme.textSecondary} text-sm`}>
            Need custom account mapping?{" "}
            <span className="font-medium">
              Advanced settings will be available in future updates.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountingSettings;
