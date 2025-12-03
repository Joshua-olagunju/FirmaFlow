import { useState, useEffect, useRef } from "react";
import Layout from "../../components/Layout";
import { Search, UserPlus, Users, TrendingUp, Menu } from "lucide-react";
import SupplierTable from "./SupplierTable";
import AddSupplierModal from "./AddSupplierModal";
import EditSupplierModal from "./EditSupplierModal";
import SupplierReportModal from "./SupplierReportModal";
import { buildApiUrl } from "../../config/api.config";
import { useTheme } from "../../contexts/ThemeContext";

const Suppliers = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const openSidebarRef = useRef(null);

  // Fetch suppliers from API on component mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      setIsLoading(true);
      setError("");
      try {
        const filter = activeTab === "all" ? "" : `&filter=${activeTab}`;
        const response = await fetch(
          buildApiUrl(`api/suppliers.php?search=${searchQuery}${filter}`),
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (response.ok) {
          // Map API fields to match frontend field names
          const mappedSuppliers = Array.isArray(data)
            ? data.map((supplier) => ({
                id: supplier.id,
                companyName: supplier.name || "",
                contactPerson: supplier.contact_person || "",
                phone: supplier.phone || "",
                email: supplier.email || "",
                address: supplier.address || "",
                taxNumber: supplier.tax_number || "",
                paymentTerms: supplier.payment_terms || "Net 30 days",
                balance: parseFloat(supplier.balance_due || 0),
                status: supplier.is_active == 1 ? "Active" : "Inactive",
                isActive: supplier.is_active == 1,
              }))
            : [];
          setSuppliers(mappedSuppliers);
        } else {
          setError(data.error || "Failed to fetch suppliers");
        }
      } catch (err) {
        console.error("Error fetching suppliers:", err);
        setError("Network error. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuppliers();
  }, [activeTab, searchQuery]);

  // Manual refresh function
  const refreshSuppliers = async () => {
    setIsLoading(true);
    setError("");
    try {
      const filter = activeTab === "all" ? "" : `&filter=${activeTab}`;
      const response = await fetch(
        buildApiUrl(`api/suppliers.php?search=${searchQuery}${filter}`),
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        const mappedSuppliers = Array.isArray(data)
          ? data.map((supplier) => ({
              id: supplier.id,
              companyName: supplier.name || "",
              contactPerson: supplier.contact_person || "",
              phone: supplier.phone || "",
              email: supplier.email || "",
              address: supplier.address || "",
              taxNumber: supplier.tax_number || "",
              paymentTerms: supplier.payment_terms || "Net 30 days",
              balance: parseFloat(supplier.balance_due || 0),
              status: supplier.is_active == 1 ? "Active" : "Inactive",
              isActive: supplier.is_active == 1,
            }))
          : [];
        setSuppliers(mappedSuppliers);
      } else {
        setError(data.error || "Failed to fetch suppliers");
      }
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSupplier = async (newSupplier) => {
    try {
      const response = await fetch(buildApiUrl("api/suppliers.php"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSupplier.companyName,
          contact_person: newSupplier.contactPerson,
          phone: newSupplier.phone,
          email: newSupplier.email,
          address: newSupplier.address,
          tax_number: newSupplier.taxNumber,
          payment_terms: newSupplier.paymentTerms,
          is_active: newSupplier.isActive ? 1 : 0,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh the supplier list
        await refreshSuppliers();
        return true;
      } else {
        alert(data.error || "Failed to add supplier");
        return false;
      }
    } catch (err) {
      console.error("Error adding supplier:", err);
      alert("Network error. Please try again.");
      return false;
    }
  };

  const handleEditSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setIsEditModalOpen(true);
  };

  const handleViewReport = (supplier) => {
    setSelectedSupplier(supplier);
    setIsReportModalOpen(true);
  };

  const handleUpdateSupplier = async (updatedSupplier) => {
    try {
      const response = await fetch(
        buildApiUrl(`api/suppliers.php?id=${updatedSupplier.id}`),
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: updatedSupplier.companyName,
            contact_person: updatedSupplier.contactPerson,
            phone: updatedSupplier.phone,
            email: updatedSupplier.email,
            address: updatedSupplier.address,
            tax_number: updatedSupplier.taxNumber,
            payment_terms: updatedSupplier.paymentTerms,
            is_active: updatedSupplier.isActive ? 1 : 0,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Refresh the supplier list
        await refreshSuppliers();
        return true;
      } else {
        alert(data.error || "Failed to update supplier");
        return false;
      }
    } catch (err) {
      console.error("Error updating supplier:", err);
      alert("Network error. Please try again.");
      return false;
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    try {
      const response = await fetch(
        buildApiUrl(`api/suppliers.php?id=${supplierId}`),
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh the supplier list
        await refreshSuppliers();
      } else {
        alert(data.error || "Failed to delete supplier");
      }
    } catch (err) {
      console.error("Error deleting supplier:", err);
      alert("Network error. Please try again.");
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.phone.includes(searchQuery) ||
      (supplier.contactPerson &&
        supplier.contactPerson
          .toLowerCase()
          .includes(searchQuery.toLowerCase()));

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && supplier.status === "Active") ||
      (activeTab === "balance" && parseFloat(supplier.balance) > 0);

    return matchesSearch && matchesTab;
  });

  return (
    <Layout onMenuClick={(fn) => (openSidebarRef.current = fn)}>
      <div className="w-full md:flex flex-col flex-1 items-center justify-center gap-8">
        {/* Page Header */}
        <div className="w-full flex justify-between items-start rounded-b-lg align-top p-4 bg-gradient-to-br from-[#667eea] to-[#764ba2] mt-0">
          {/* Left Side - Title */}
          <div className="flex-col items-center flex-1">
            <h1 className="text-white font-bold text-2xl md:text-3xl">
              Suppliers
            </h1>
            <p className="m-0 text-sm md:text-normal font-500 text-slate-200">
              Manage your supplier relationships and vendor information
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

        {/* Top Row: Currency + Counts + Add Supplier Button */}
        <div className="flex justify-between items-center flex-wrap gap-4 mb-6 mt-4 w-full">
          <div className="flex items-center gap-3">
            <span
              className={`text-sm ${theme.bgAccent} ${theme.textPrimary} px-4 py-2 rounded-lg font-medium border ${theme.borderSecondary}`}
            >
              Currency: NGN
            </span>

            <span className="flex items-center gap-2 text-sm bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium border border-green-200">
              <Users size={16} />
              {suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""}
            </span>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-10 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg shadow-lg hover:opacity-90 transition"
          >
            <UserPlus size={18} />
            Add Supplier
          </button>
        </div>

        {/* Tabs */}
        <div
          className={`flex w-full gap-4 border-b ${theme.borderSecondary} mb-6`}
        >
          <button
            onClick={() => setActiveTab("all")}
            className={`pb-3 px-4 font-medium transition-all ${
              activeTab === "all"
                ? "border-b-2 border-[#667eea] text-[#667eea]"
                : `${theme.textSecondary} hover:text-[#667eea]`
            }`}
          >
            All Suppliers
          </button>
          <button
            onClick={() => setActiveTab("active")}
            className={`pb-3 px-4 font-medium transition-all ${
              activeTab === "active"
                ? "border-b-2 border-[#667eea] text-[#667eea]"
                : `${theme.textSecondary} hover:text-[#667eea]`
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab("balance")}
            className={`pb-3 px-4 font-medium transition-all ${
              activeTab === "balance"
                ? "border-b-2 border-[#667eea] text-[#667eea]"
                : `${theme.textSecondary} hover:text-[#667eea]`
            }`}
          >
            With Balance
          </button>
        </div>

        {/* Supplier Directory Section */}
        <div
          className={`${theme.bgCard} ${theme.shadow} rounded-xl p-6 mr-2 w-full`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-semibold ${theme.textPrimary}`}>
              Supplier Directory
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
              placeholder="Search suppliers by name, contact person, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full ${theme.bgInput} ${theme.textPrimary} border ${theme.borderSecondary} rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent transition`}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#667eea]"></div>
              <p className={`mt-2 ${theme.textSecondary}`}>
                Loading suppliers...
              </p>
            </div>
          )}

          {/* Supplier Table or Empty State */}
          {!isLoading && filteredSuppliers.length > 0 ? (
            <SupplierTable
              suppliers={filteredSuppliers}
              onEdit={handleEditSupplier}
              onDelete={handleDeleteSupplier}
              onViewReport={handleViewReport}
            />
          ) : suppliers.length === 0 ? (
            /* Empty State */
            <div
              className={`text-center py-16 ${theme.bgAccent} rounded-lg border-1 ${theme.borderSecondary}`}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users size={40} className="text-white" />
              </div>

              <p className={`${theme.textPrimary} text-xl font-semibold mb-2`}>
                No suppliers yet
              </p>
              <p className={`${theme.textSecondary} mb-6 max-w-md mx-auto`}>
                Start building your supplier network by adding your first
                supplier. Manage vendor relationships and streamline your
                procurement process.
              </p>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg shadow-lg hover:opacity-90 transition"
              >
                <UserPlus size={18} />
                Add First Supplier
              </button>
            </div>
          ) : (
            /* No Search Results */
            <div className="text-center py-16">
              <p className={`${theme.textSecondary} text-lg`}>
                No suppliers match your search criteria
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddSupplierModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddSupplier}
      />

      <EditSupplierModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateSupplier}
        supplier={selectedSupplier}
      />

      {isReportModalOpen && (
        <SupplierReportModal
          supplier={selectedSupplier}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </Layout>
  );
};

export default Suppliers;
