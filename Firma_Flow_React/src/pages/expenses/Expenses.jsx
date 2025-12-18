import { useState, useRef, useEffect, useCallback } from "react";
import Layout from "../../components/Layout";
import { Search, Receipt, Plus, Menu, TrendingDown } from "lucide-react";
import ExpensesTable from "./ExpensesTable";
import RecordExpenseModal from "./RecordExpenseModal";
import ViewExpenseModal from "./ViewExpenseModal";
import EditExpenseModal from "./EditExpenseModal";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import { buildApiUrl } from "../../config/api.config";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";

const Expenses = () => {
  const { theme } = useTheme();
  const { currency } = useSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const openSidebarRef = useRef(null);

  const refreshExpenses = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const url = buildApiUrl(`api/expenses.php?search=${searchQuery}`);

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setExpenses(Array.isArray(data) ? data : []);
      } else {
        setError(data.error || "Failed to fetch expenses");
      }
    } catch (err) {
      console.error("Error fetching expenses:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  const handleExpenseCreated = () => {
    setSuccessMessage("Expense recorded successfully!");
    refreshExpenses();
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  const handleExpenseUpdated = () => {
    setSuccessMessage("Expense updated successfully!");
    refreshExpenses();
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  const handleView = (expense) => {
    setSelectedExpense(expense);
    setIsViewModalOpen(true);
  };

  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (expense) => {
    setSelectedExpense(expense);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedExpense) return;

    try {
      const url = buildApiUrl(`api/expenses.php`);
      const response = await fetch(url, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: selectedExpense.id }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage("Expense deleted successfully!");
        setIsDeleteModalOpen(false);
        setSelectedExpense(null);
        refreshExpenses();
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        setError(data.error || "Failed to delete expense");
      }
    } catch (err) {
      console.error("Error deleting expense:", err);
      setError("Network error. Please try again.");
    }
  };

  // Load expenses on component mount and when search changes
  useEffect(() => {
    refreshExpenses();
  }, [refreshExpenses]);

  return (
    <Layout onMenuClick={(fn) => (openSidebarRef.current = fn)}>
      <div className="w-full md:flex flex-col flex-1 items-center justify-center gap-8">
        {/* Page Header */}
        <div className="w-full flex justify-between items-start rounded-b-lg align-top p-4 bg-gradient-to-br from-[#667eea] to-[#764ba2] mt-0">
          {/* Left Side - Title */}
          <div className="flex-col items-center flex-1">
            <h1 className="text-white font-bold text-2xl md:text-3xl">
              Expenses
            </h1>
            <p className="m-0 text-sm md:text-normal font-500 text-slate-200">
              Record and manage your business expenses like salaries, utilities,
              and other costs
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

        {/* Top Row: Currency + Counts + Record Expense Button */}
        <div className="flex justify-between items-center flex-wrap gap-4 mb-6 mt-4 w-full">
          <div className="flex items-center gap-3">
            <span
              className={`text-sm ${theme.bgAccent} ${theme.textPrimary} px-4 py-2 rounded-lg font-medium border ${theme.borderSecondary}`}
            >
              Currency: {currency}
            </span>

            <span className="flex items-center gap-2 text-sm bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium border border-green-200">
              <Receipt size={16} />
              Expenses
            </span>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-10 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg shadow-lg hover:opacity-90 transition"
          >
            <Plus size={18} />
            Record Expense
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

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center gap-2 animate-fade-in w-full">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Recent Expenses Section */}
        <div
          className={`${theme.bgCard} ${theme.shadow} rounded-xl p-6 mr-2 w-full`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-semibold ${theme.textPrimary}`}>
              Recent Expenses
            </h2>
            <div
              className={`flex items-center gap-2 text-sm ${theme.textTertiary}`}
            >
              <TrendingDown size={16} />
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
              placeholder="Search expenses by reference, category, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full ${theme.bgInput} ${theme.textPrimary} border ${theme.borderSecondary} rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent transition`}
            />
          </div>

          {/* Expenses Table */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#667eea]"></div>
              <p className={`mt-4 ${theme.textSecondary}`}>
                Loading expenses...
              </p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <Receipt
                size={48}
                className={`mx-auto mb-4 ${theme.textTertiary}`}
              />
              <p className={`text-lg ${theme.textPrimary}`}>
                No expenses found
              </p>
              <p className={`mt-2 ${theme.textSecondary}`}>
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Start by recording your first expense"}
              </p>
            </div>
          ) : (
            <ExpensesTable
              expenses={expenses}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <RecordExpenseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleExpenseCreated}
      />

      <ViewExpenseModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedExpense(null);
        }}
        expense={selectedExpense}
      />

      <EditExpenseModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedExpense(null);
        }}
        onSuccess={handleExpenseUpdated}
        expense={selectedExpense}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedExpense(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Expense"
        message={`Are you sure you want to delete expense ${selectedExpense?.reference_number}? This action cannot be undone.`}
      />
    </Layout>
  );
};

export default Expenses;
