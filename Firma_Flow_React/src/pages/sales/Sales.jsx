import { useState, useRef, useEffect, useCallback } from "react";
import Layout from "../../components/Layout";
import { Search, FileText, Plus, TrendingUp, Menu } from "lucide-react";
import InvoiceTable from "./InvoiceTable";
import CreateInvoiceModal from "./CreateInvoiceModal";
import EditInvoiceModal from "./EditInvoiceModal";
import { buildApiUrl } from "../../config/api.config";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";

const Sales = () => {
  const { theme } = useTheme();
  const { currency } = useSettings();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const openSidebarRef = useRef(null);

  const refreshInvoices = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const filter = activeTab === "all" ? "" : `&status=${activeTab}`;
      const url = buildApiUrl(`api/sales.php?search=${searchQuery}${filter}`);
      console.log("Fetching invoices from:", url);

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok && data.success) {
        console.log("Setting invoices:", data.data);
        setInvoices(data.data || []);
      } else {
        console.error("Failed to fetch invoices:", data);
        setError(data.error || "Failed to fetch invoices");
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery]);

  const filteredInvoices =
    activeTab === "all"
      ? invoices
      : invoices.filter((inv) => inv.status === activeTab);

  const handleInvoiceCreated = () => {
    setSuccessMessage("Invoice created successfully!");
    refreshInvoices();
    setTimeout(() => setSuccessMessage(""), 5000); // Clear after 5 seconds
  };

  const handleEditInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setIsEditModalOpen(true);
  };

  const handleInvoiceUpdated = () => {
    setSuccessMessage("Invoice updated successfully!");
    refreshInvoices();
    setTimeout(() => setSuccessMessage(""), 5000); // Clear after 5 seconds
  };

  // Load invoices on component mount and when filters change
  useEffect(() => {
    refreshInvoices();
  }, [refreshInvoices]);

  return (
    <Layout onMenuClick={(fn) => (openSidebarRef.current = fn)}>
      <div className="w-full md:flex flex-col flex-1 items-center justify-center gap-8">
        {/* Page Header */}
        <div className="w-full flex justify-between items-start rounded-b-lg align-top p-4 bg-gradient-to-br from-[#667eea] to-[#764ba2] mt-0">
          {/* Left Side - Title */}
          <div className="flex-col items-center flex-1">
            <h1 className="text-white font-bold text-2xl md:text-3xl">Sales</h1>
            <p className="m-0 text-sm md:text-normal font-500 text-slate-200">
              Track and manage your sales transactions and revenue
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

        {/* Top Row: Currency + Counts + Create Invoice Button */}
        <div className="flex justify-between items-center flex-wrap gap-4 mb-6 mt-4 w-full">
          <div className="flex items-center gap-3">
            <span
              className={`text-sm ${theme.bgAccent} ${theme.textPrimary} px-4 py-2 rounded-lg font-medium border ${theme.borderSecondary}`}
            >
              Currency: {currency}
            </span>

            <span className="flex items-center gap-2 text-sm bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium border border-green-200">
              <FileText size={16} />
              {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
            </span>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-10 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg shadow-lg hover:opacity-90 transition"
          >
            <Plus size={18} />
            Create Invoice
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-center gap-2 animate-fade-in">
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

        {/* Tabs */}
        <div className="w-full overflow-x-auto mb-6">
          <div
            className={`flex gap-4 border-b ${theme.borderSecondary} min-w-max`}
          >
            <button
              onClick={() => setActiveTab("all")}
              className={`pb-3 px-4 font-medium transition-all whitespace-nowrap ${
                activeTab === "all"
                  ? "border-b-2 border-[#667eea] text-[#667eea]"
                  : `${theme.textSecondary} hover:text-[#667eea]`
              }`}
            >
              All Invoices
            </button>
            <button
              onClick={() => setActiveTab("draft")}
              className={`pb-3 px-4 font-medium transition-all whitespace-nowrap ${
                activeTab === "draft"
                  ? "border-b-2 border-[#667eea] text-[#667eea]"
                  : `${theme.textSecondary} hover:text-[#667eea]`
              }`}
            >
              Drafts
            </button>
            <button
              onClick={() => setActiveTab("sent")}
              className={`pb-3 px-4 font-medium transition-all whitespace-nowrap ${
                activeTab === "sent"
                  ? "border-b-2 border-[#667eea] text-[#667eea]"
                  : `${theme.textSecondary} hover:text-[#667eea]`
              }`}
            >
              Sent
            </button>
            <button
              onClick={() => setActiveTab("paid")}
              className={`pb-3 px-4 font-medium transition-all whitespace-nowrap ${
                activeTab === "paid"
                  ? "border-b-2 border-[#667eea] text-[#667eea]"
                  : `${theme.textSecondary} hover:text-[#667eea]`
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => setActiveTab("overdue")}
              className={`pb-3 px-4 font-medium transition-all whitespace-nowrap ${
                activeTab === "overdue"
                  ? "border-b-2 border-[#667eea] text-[#667eea]"
                  : `${theme.textSecondary} hover:text-[#667eea]`
              }`}
            >
              Overdue
            </button>
          </div>
        </div>

        {/* Invoice Directory Section */}
        <div
          className={`${theme.bgCard} ${theme.shadow} rounded-xl p-6 mr-2 w-full`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-semibold ${theme.textPrimary}`}>
              Invoice Directory
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
              placeholder="Search invoices by number, customer, or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full ${theme.bgInput} ${theme.textPrimary} border ${theme.borderSecondary} rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent transition`}
            />
          </div>

          {/* Invoice Table */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className={`text-lg ${theme.textSecondary}`}>
                Loading invoices...
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-lg text-red-600">{error}</div>
            </div>
          ) : (
            <InvoiceTable
              invoices={filteredInvoices}
              onRefresh={refreshInvoices}
              onEdit={handleEditInvoice}
            />
          )}
        </div>
      </div>

      {/* Create Invoice Modal */}
      {isCreateModalOpen && (
        <CreateInvoiceModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleInvoiceCreated}
        />
      )}

      {/* Edit Invoice Modal */}
      {isEditModalOpen && (
        <EditInvoiceModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleInvoiceUpdated}
          invoice={selectedInvoice}
        />
      )}
    </Layout>
  );
};

export default Sales;
