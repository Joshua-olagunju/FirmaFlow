import { useState, useEffect } from "react";
import { Download, Calendar, CreditCard, FileText } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { buildApiUrl } from "../../config/api.config";

const BillingHistory = ({ formatCurrency }) => {
  const { theme } = useTheme();
  const [billingHistory, setBillingHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBillingHistory();
  }, []);

  const fetchBillingHistory = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        buildApiUrl("api/subscription.php?action=history"),
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setBillingHistory(data.data || []);
      } else {
        setError(data.error || "Failed to fetch billing history");
      }
    } catch (err) {
      console.error("Error fetching billing history:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "successful":
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className={`${theme.cardBg} rounded-lg shadow p-6`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#667eea]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${theme.cardBg} rounded-lg shadow p-6`}>
        <div className="text-center py-8">
          <FileText className="mx-auto mb-4 text-red-500" size={48} />
          <p className={`${theme.text}`}>{error}</p>
        </div>
      </div>
    );
  }

  if (billingHistory.length === 0) {
    return (
      <div className={`${theme.cardBg} rounded-xl shadow-lg p-6 md:p-8`}>
        <div className="text-center py-8 md:py-12">
          <FileText
            className={`mx-auto mb-4 ${theme.textSecondary}`}
            size={56}
          />
          <h3 className={`text-lg md:text-xl font-semibold mb-2 ${theme.text}`}>
            No Billing History
          </h3>
          <p className={`text-sm md:text-base ${theme.textSecondary}`}>
            You don't have any billing transactions yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${theme.cardBg} rounded-xl shadow-lg overflow-hidden`}>
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className={`bg-gray-50 dark:bg-gray-800`}>
            <tr>
              <th className="px-4 xl:px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                <div className={theme.text}>Date</div>
              </th>
              <th className="px-4 xl:px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                <div className={theme.text}>Plan & Billing</div>
              </th>
              <th className="px-4 xl:px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                <div className={theme.text}>Amount</div>
              </th>
              <th className="px-4 xl:px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                <div className={theme.text}>Status</div>
              </th>
              <th className="px-4 xl:px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                <div className={theme.text}>Actions</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {billingHistory.map((transaction) => (
              <tr
                key={transaction.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
              >
                <td className={`px-4 xl:px-6 py-4 whitespace-nowrap`}>
                  <div className="flex items-center gap-2">
                    <Calendar className={theme.textSecondary} size={16} />
                    <span className={`text-sm font-medium ${theme.text}`}>
                      {formatDate(transaction.created_at)}
                    </span>
                  </div>
                </td>
                <td className={`px-4 xl:px-6 py-4`}>
                  <div>
                    <div className={`text-sm font-semibold ${theme.text} capitalize`}>
                      {transaction.plan_type || 'Unknown'}
                    </div>
                    <div className={`text-xs ${theme.textSecondary} mt-0.5 capitalize`}>
                      {transaction.billing_type?.replace('_', ' ') || 'monthly'}
                    </div>
                  </div>
                </td>
                <td className={`px-4 xl:px-6 py-4 whitespace-nowrap`}>
                  <span className={`text-base font-bold ${theme.text}`}>
                    {formatCurrency(transaction.amount)}
                  </span>
                </td>
                <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      transaction.status
                    )}`}
                  >
                    {transaction.status}
                  </span>
                </td>
                <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                  <button className="text-[#667eea] hover:text-[#5568d3] font-medium text-sm transition flex items-center gap-1">
                    <Download size={14} />
                    <span className="hidden xl:inline">Receipt</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tablet View - Simplified Table */}
      <div className="hidden md:block lg:hidden overflow-x-auto">
        <table className="w-full">
          <thead className={`bg-gray-50 dark:bg-gray-800`}>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                <div className={theme.text}>Date</div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                <div className={theme.text}>Plan</div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                <div className={theme.text}>Amount</div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                <div className={theme.text}>Status</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {billingHistory.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className={`px-4 py-3 text-sm ${theme.text}`}>
                  {formatDate(transaction.created_at)}
                </td>
                <td className={`px-4 py-3`}>
                  <div className={`text-sm font-medium ${theme.text} capitalize`}>
                    {transaction.plan_type}
                  </div>
                </td>
                <td className={`px-4 py-3 text-sm font-bold ${theme.text}`}>
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      transaction.status
                    )}`}
                  >
                    {transaction.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
        {billingHistory.map((transaction) => (
          <div key={transaction.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0">
                <p className={`text-base font-bold ${theme.text} capitalize truncate`}>
                  {transaction.plan_type || 'Unknown'}
                </p>
                <p className={`text-xs ${theme.textSecondary} mt-1 capitalize`}>
                  {transaction.billing_type?.replace('_', ' ') || 'monthly'}
                </p>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ml-2 flex-shrink-0 ${getStatusColor(
                  transaction.status
                )}`}
              >
                {transaction.status}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
              <div>
                <p className={`text-xs ${theme.textSecondary} mb-1 flex items-center gap-1`}>
                  <Calendar size={12} />
                  {formatDate(transaction.created_at)}
                </p>
                <p className={`text-xl font-extrabold ${theme.text}`}>
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
              <button className="text-[#667eea] hover:text-[#5568d3] text-sm font-semibold flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-[#667eea]/10 transition">
                <Download size={14} />
                <span>Receipt</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BillingHistory;
