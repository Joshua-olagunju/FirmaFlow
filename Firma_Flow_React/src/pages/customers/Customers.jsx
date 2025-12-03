import { useState, useEffect, useRef } from "react";
import Layout from "../../components/Layout";
import { Search, UserPlus, Users, TrendingUp, Menu } from "lucide-react";
import CustomerTable from "./CustomerTable";
import AddCustomerModal from "./AddCustomerModal";
import EditCustomerModal from "./EditCustomerModal";
import CustomerReportModal from "./CustomerReportModal";
import { buildApiUrl } from "../../config/api.config";
import { useTheme } from "../../contexts/ThemeContext";

const Customers = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const openSidebarRef = useRef(null);

  // Fetch customers from API on component mount
  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      setError("");
      try {
        const filter = activeTab === "all" ? "" : `&filter=${activeTab}`;
        const response = await fetch(
          buildApiUrl(`api/customers.php?search=${searchQuery}${filter}`),
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          // Map API fields to match frontend field names
          const mappedCustomers = data.data.map((customer) => ({
            id: customer.id,
            name: customer.name,
            phone: customer.phone || "",
            email: customer.email || "",
            billingAddress: customer.billing_address || "",
            address: customer.billing_address || "",
            customerType: customer.customer_type || "Individual",
            paymentTerms: customer.payment_terms || "Cash on Delivery",
            creditLimit: customer.credit_limit || 0,
            balance: customer.balance || 0,
            status: customer.is_active == 1 ? "Active" : "Inactive",
            isActive: customer.is_active == 1,
          }));
          setCustomers(mappedCustomers);
        } else {
          setError(data.error || "Failed to fetch customers");
        }
      } catch (err) {
        console.error("Error fetching customers:", err);
        setError("Network error. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, [activeTab, searchQuery]);

  // Manual refresh function
  const refreshCustomers = async () => {
    setIsLoading(true);
    setError("");
    try {
      const filter = activeTab === "all" ? "" : `&filter=${activeTab}`;
      const response = await fetch(
        buildApiUrl(`api/customers.php?search=${searchQuery}${filter}`),
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        const mappedCustomers = data.data.map((customer) => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone || "",
          email: customer.email || "",
          billingAddress: customer.billing_address || "",
          address: customer.billing_address || "",
          customerType: customer.customer_type || "Individual",
          paymentTerms: customer.payment_terms || "Cash on Delivery",
          creditLimit: customer.credit_limit || 0,
          balance: customer.balance || 0,
          status: customer.is_active == 1 ? "Active" : "Inactive",
          isActive: customer.is_active == 1,
        }));
        setCustomers(mappedCustomers);
      } else {
        setError(data.error || "Failed to fetch customers");
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomer = async (newCustomer) => {
    try {
      const response = await fetch(buildApiUrl("api/customers.php"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCustomer.name,
          phone: newCustomer.phone,
          email: newCustomer.email,
          billing_address: newCustomer.billingAddress,
          customer_type: newCustomer.customerType,
          payment_terms: newCustomer.paymentTerms,
          credit_limit: parseFloat(newCustomer.creditLimit) || 0,
          is_active: newCustomer.isActive ? 1 : 0,
          balance: 0,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh the customer list
        await refreshCustomers();
        return true;
      } else {
        alert(data.error || "Failed to add customer");
        return false;
      }
    } catch (err) {
      console.error("Error adding customer:", err);
      alert("Network error. Please try again.");
      return false;
    }
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleViewReport = (customer) => {
    setSelectedCustomer(customer);
    setIsReportModalOpen(true);
  };

  const handleUpdateCustomer = async (updatedCustomer) => {
    try {
      const response = await fetch(
        buildApiUrl(`api/customers.php?id=${updatedCustomer.id}`),
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: updatedCustomer.name,
            phone: updatedCustomer.phone,
            email: updatedCustomer.email,
            billing_address: updatedCustomer.billingAddress,
            customer_type: updatedCustomer.customerType,
            payment_terms: updatedCustomer.paymentTerms,
            credit_limit: parseFloat(updatedCustomer.creditLimit) || 0,
            is_active: updatedCustomer.isActive ? 1 : 0,
            balance: updatedCustomer.balance || 0,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh the customer list
        await refreshCustomers();
        return true;
      } else {
        alert(data.error || "Failed to update customer");
        return false;
      }
    } catch (err) {
      console.error("Error updating customer:", err);
      alert("Network error. Please try again.");
      return false;
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    try {
      const response = await fetch(
        buildApiUrl(`api/customers.php?id=${customerId}`),
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh the customer list
        await refreshCustomers();
      } else {
        alert(data.error || "Failed to delete customer");
      }
    } catch (err) {
      console.error("Error deleting customer:", err);
      alert("Network error. Please try again.");
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery);

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && customer.status === "Active") ||
      (activeTab === "balance" && parseFloat(customer.balance) > 0);

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
              Customers
            </h1>
            <p className="m-0 text-sm md:text-normal font-500 text-slate-200">
              Manage your customer database and relationships
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

        {/* Top Row: Currency + Counts + Add Customer Button */}
        <div className="flex justify-between items-center flex-wrap gap-4 mb-6 mt-4 w-full">
          <div className="flex items-center gap-3">
            <span
              className={`text-sm ${theme.bgAccent} ${theme.textPrimary} px-4 py-2 rounded-lg font-medium border ${theme.borderSecondary}`}
            >
              Currency: NGN
            </span>

            <span className="flex items-center gap-2 text-sm bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium border border-green-200">
              <Users size={16} />
              {customers.length} customer{customers.length !== 1 ? "s" : ""}
            </span>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-10 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg shadow-lg hover:opacity-90 transition"
          >
            <UserPlus size={18} />
            Add Customer
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
            All Customers
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

        {/* Customer Directory Section */}
        <div
          className={`${theme.bgCard} ${theme.shadow} rounded-xl p-6 mr-2 w-full`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-semibold ${theme.textPrimary}`}>
              Customer Directory
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
              placeholder="Search customers by name, email, or phone..."
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
                Loading customers...
              </p>
            </div>
          )}

          {/* Customer Table or Empty State */}
          {!isLoading && filteredCustomers.length > 0 ? (
            <CustomerTable
              customers={filteredCustomers}
              onEdit={handleEditCustomer}
              onDelete={handleDeleteCustomer}
              onViewReport={handleViewReport}
            />
          ) : customers.length === 0 ? (
            /* Empty State */
            <div
              className={`text-center py-16 ${theme.bgAccent} rounded-lg border-1 ${theme.borderSecondary}`}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users size={40} className="text-white" />
              </div>

              <p className={`${theme.textPrimary} text-xl font-semibold mb-2`}>
                No customers yet
              </p>
              <p className={`${theme.textSecondary} mb-6 max-w-md mx-auto`}>
                Start building your customer base by adding your first customer.
                Track their purchases, manage relationships, and grow your
                business.
              </p>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg shadow-lg hover:opacity-90 transition"
              >
                <UserPlus size={18} />
                Add First Customer
              </button>
            </div>
          ) : (
            /* No Search Results */
            <div className="text-center py-16">
              <p className={`${theme.textSecondary} text-lg`}>
                No customers match your search criteria
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddCustomer}
      />

      <EditCustomerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateCustomer}
        customer={selectedCustomer}
      />

      {isReportModalOpen && (
        <CustomerReportModal
          customer={selectedCustomer}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </Layout>
  );
};

export default Customers;
