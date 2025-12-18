import { useState, useRef, useEffect, useCallback } from "react";
import Layout from "../../components/Layout";
import { Search, CreditCard, Menu, TrendingUp } from "lucide-react";
import PaymentHistoryTab from "./PaymentHistoryTab";
import PendingInvoicesTab from "./PendingInvoicesTab";
import PendingSupplierBillsTab from "./PendingSupplierBillsTab";
import { buildApiUrl } from "../../config/api.config";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";

const Payments = () => {
  const { theme } = useTheme();
  const { currency } = useSettings();
  const [activeTab, setActiveTab] = useState("history");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [payments, setPayments] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [pendingBills, setPendingBills] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [successMessage, setSuccessMessage] = useState("");
  const openSidebarRef = useRef(null);

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const referenceTypeFilter =
        paymentFilter === "all"
          ? ""
          : `&reference_type=${
              paymentFilter === "received" ? "customer" : "supplier"
            }`;
      const url = buildApiUrl(
        `api/payments.php?search=${searchQuery}${referenceTypeFilter}`
      );

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setPayments(Array.isArray(data) ? data : []);
      } else {
        setError(data.error || "Failed to fetch payments");
      }
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [paymentFilter, searchQuery]);

  // Fetch pending invoices
  const fetchPendingInvoices = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const url = buildApiUrl(`api/sales.php?status=unpaid,partial`);

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPendingInvoices(data.data || []);
      } else {
        setError(data.error || "Failed to fetch pending invoices");
      }
    } catch (err) {
      console.error("Error fetching pending invoices:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch pending supplier bills
  const fetchPendingBills = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const url = buildApiUrl(`api/purchases.php?action=pending`);

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        const bills = Array.isArray(data) ? data : data.data || [];
        setPendingBills(bills);
      } else {
        setError(data.error || "Failed to fetch pending bills");
      }
    } catch (err) {
      console.error("Error fetching pending bills:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh data based on active tab
  const refreshData = useCallback(() => {
    switch (activeTab) {
      case "history":
        fetchPayments();
        break;
      case "invoices":
        fetchPendingInvoices();
        break;
      case "bills":
        fetchPendingBills();
        break;
      default:
        fetchPayments();
    }
  }, [activeTab, fetchPayments, fetchPendingInvoices, fetchPendingBills]);

  // Load data on component mount and when tab changes
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Refetch payments when filter changes (only for history tab)
  useEffect(() => {
    if (activeTab === "history") {
      fetchPayments();
    }
  }, [paymentFilter, searchQuery, activeTab, fetchPayments]);

  // Get payment count for display
  const getPaymentCount = () => {
    switch (activeTab) {
      case "history":
        return payments.length;
      case "invoices":
        return pendingInvoices.length;
      case "bills":
        return pendingBills.length;
      default:
        return payments.length;
    }
  };

  const tabs = [
    { id: "history", label: "Payment History" },
    { id: "invoices", label: "Pending Invoices" },
    { id: "bills", label: "Pending Supplier Bills" },
  ];

  return (
    <Layout onMenuClick={(fn) => (openSidebarRef.current = fn)}>
      <div className="w-full md:flex flex-col flex-1 items-center justify-center gap-8">
        {/* Page Header */}
        <div className="w-full flex justify-between items-start rounded-b-lg align-top p-4 bg-gradient-to-br from-[#667eea] to-[#764ba2] mt-0">
          {/* Left Side - Title */}
          <div className="flex-col items-center flex-1">
            <h1 className="text-white font-bold text-2xl md:text-3xl">
              Payments
            </h1>
            <p className="m-0 text-sm md:text-normal font-500 text-slate-200">
              Track and manage customer payments and supplier payments
            </p>
          </div>

          {/* Right Side - Hamburger Menu (Mobile Only) */}
          <button
            onClick={() => openSidebarRef.current?.()}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition flex-shrink-0"
          >
            <Menu size={24} className="text-white" />
          </button>
        </div>

        {/* Top Row: Currency + Counts */}
        <div className="flex justify-between items-center flex-wrap gap-4 mb-6 mt-4 w-full">
          <div className="flex items-center gap-3">
            <span
              className={`text-sm ${theme.bgAccent} ${theme.textPrimary} px-4 py-2 rounded-lg font-medium border ${theme.borderSecondary}`}
            >
              Currency: {currency}
            </span>

            <span className="flex items-center gap-2 text-sm bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium border border-green-200">
              <CreditCard size={16} />
              {getPaymentCount()}{" "}
              {activeTab === "history"
                ? "payment"
                : activeTab === "invoices"
                ? "invoice"
                : "bill"}
              {getPaymentCount() !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-center gap-2 animate-fade-in w-full">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Main Tabs - with gradient when active */}
        <div className="w-full overflow-x-auto mb-6">
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg"
                    : `${theme.bgCard} ${theme.textSecondary} hover:text-[#667eea] border ${theme.borderSecondary}`
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Type Filter - Only show for Payment History tab */}
        {activeTab === "history" && (
          <div className="w-full overflow-x-auto mb-6">
            <div
              className={`flex gap-4 border-b ${theme.borderSecondary} min-w-max`}
            >
              <button
                onClick={() => setPaymentFilter("all")}
                className={`pb-3 px-4 font-medium transition-all whitespace-nowrap ${
                  paymentFilter === "all"
                    ? "border-b-2 border-[#667eea] text-[#667eea]"
                    : `${theme.textSecondary} hover:text-[#667eea]`
                }`}
              >
                All Payments
              </button>
              <button
                onClick={() => setPaymentFilter("received")}
                className={`pb-3 px-4 font-medium transition-all whitespace-nowrap ${
                  paymentFilter === "received"
                    ? "border-b-2 border-[#667eea] text-[#667eea]"
                    : `${theme.textSecondary} hover:text-[#667eea]`
                }`}
              >
                Received
              </button>
              <button
                onClick={() => setPaymentFilter("sent")}
                className={`pb-3 px-4 font-medium transition-all whitespace-nowrap ${
                  paymentFilter === "sent"
                    ? "border-b-2 border-[#667eea] text-[#667eea]"
                    : `${theme.textSecondary} hover:text-[#667eea]`
                }`}
              >
                Sent
              </button>
            </div>
          </div>
        )}

        {/* Content Section */}
        <div
          className={`${theme.bgCard} ${theme.shadow} rounded-xl p-6 mr-2 w-full`}
        >
          {/* Dynamic Header based on active tab */}
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-semibold ${theme.textPrimary}`}>
              {activeTab === "history" && "Recent Payments"}
              {activeTab === "invoices" && "Pending Customer Invoices"}
              {activeTab === "bills" && "Pending Supplier Bills"}
            </h2>
            <div
              className={`flex items-center gap-2 text-sm ${theme.textTertiary}`}
            >
              <TrendingUp size={16} />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${theme.textTertiary}`}
              size={20}
            />
            <input
              type="text"
              placeholder={
                activeTab === "history"
                  ? "Search payments by reference, party, or amount..."
                  : activeTab === "invoices"
                  ? "Search invoices by number, customer, or amount..."
                  : "Search bills by number, supplier, or amount..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full ${theme.bgInput} ${theme.textPrimary} border ${theme.borderSecondary} rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent transition`}
            />
          </div>

          {/* Tab Content */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className={`text-lg ${theme.textSecondary}`}>Loading...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-lg text-red-600">{error}</div>
            </div>
          ) : (
            <>
              {activeTab === "history" && (
                <PaymentHistoryTab
                  payments={payments}
                  onRefresh={refreshData}
                  searchQuery={searchQuery}
                />
              )}
              {activeTab === "invoices" && (
                <PendingInvoicesTab
                  invoices={pendingInvoices}
                  onRefresh={refreshData}
                  searchQuery={searchQuery}
                />
              )}
              {activeTab === "bills" && (
                <PendingSupplierBillsTab
                  bills={pendingBills}
                  onRefresh={refreshData}
                  searchQuery={searchQuery}
                />
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Payments;
