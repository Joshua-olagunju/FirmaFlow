import { useState, useRef, useEffect, useCallback } from "react";
import Layout from "../../components/Layout";
import { Search, ShoppingBag, Plus, Menu, TrendingUp } from "lucide-react";
import PurchasesTable from "./PurchasesTable";
import RecordPurchaseModal from "./RecordPurchaseModal";
import { buildApiUrl } from "../../config/api.config";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";

const Purchases = () => {
  const { theme } = useTheme();
  const { currency } = useSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [purchases, setPurchases] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const openSidebarRef = useRef(null);

  const refreshPurchases = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const url = buildApiUrl(`api/purchases.php?search=${searchQuery}`);

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setPurchases(Array.isArray(data) ? data : []);
      } else {
        setError(data.error || "Failed to fetch purchases");
      }
    } catch (err) {
      console.error("Error fetching purchases:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  const handlePurchaseCreated = () => {
    setSuccessMessage("Purchase recorded successfully!");
    refreshPurchases();
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  // Load purchases on component mount and when search changes
  useEffect(() => {
    refreshPurchases();
  }, [refreshPurchases]);

  return (
    <Layout onMenuClick={(fn) => (openSidebarRef.current = fn)}>
      <div className="w-full md:flex flex-col flex-1 items-center justify-center gap-8">
        {/* Page Header */}
        <div className="w-full flex justify-between items-start rounded-b-lg align-top p-4 bg-gradient-to-br from-[#667eea] to-[#764ba2] mt-0">
          {/* Left Side - Title */}
          <div className="flex-col items-center flex-1">
            <h1 className="text-white font-bold text-2xl md:text-3xl">
              Purchases
            </h1>
            <p className="m-0 text-sm md:text-normal font-500 text-slate-200">
              Record and manage your purchase bills and supplier invoices
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

        {/* Top Row: Currency + Counts + Record Purchase Button */}
        <div className="flex justify-between items-center flex-wrap gap-4 mb-6 mt-4 w-full">
          <div className="flex items-center gap-3">
            <span
              className={`text-sm ${theme.bgAccent} ${theme.textPrimary} px-4 py-2 rounded-lg font-medium border ${theme.borderSecondary}`}
            >
              Currency: {currency}
            </span>

            <span className="flex items-center gap-2 text-sm bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium border border-green-200">
              <ShoppingBag size={16} />
              {purchases.length} purchase{purchases.length !== 1 ? "s" : ""}
            </span>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-10 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg shadow-lg hover:opacity-90 transition"
          >
            <Plus size={18} />
            Record Purchase
          </button>
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

        {/* Purchases Directory Section */}
        <div
          className={`${theme.bgCard} ${theme.shadow} rounded-xl p-6 mr-2 w-full`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-semibold ${theme.textPrimary}`}>
              Recent Purchases
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
              placeholder="Search purchases by reference, supplier, or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full ${theme.bgInput} ${theme.textPrimary} border ${theme.borderSecondary} rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent transition`}
            />
          </div>

          {/* Purchases Table */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className={`text-lg ${theme.textSecondary}`}>
                Loading purchases...
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-lg text-red-600">{error}</div>
            </div>
          ) : (
            <PurchasesTable
              purchases={purchases}
              onRefresh={refreshPurchases}
            />
          )}
        </div>
      </div>

      {/* Record Purchase Modal */}
      {isCreateModalOpen && (
        <RecordPurchaseModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handlePurchaseCreated}
        />
      )}
    </Layout>
  );
};

export default Purchases;
