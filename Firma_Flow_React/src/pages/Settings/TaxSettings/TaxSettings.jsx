import { useState, useEffect } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import { Receipt, Plus, Package, Info, AlertCircle } from "lucide-react";
import TaxRateTable from "./TaxRateTable";
import AddTaxModal from "./AddTaxModal";
import EditTaxModal from "./EditTaxModal";
import DeleteConfirmationModal from "../../../components/modals/DeleteConfirmationModal";
import { buildApiUrl } from "../../../config/api.config";

const TaxSettings = () => {
  const { theme } = useTheme();
  const [taxRates, setTaxRates] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTax, setSelectedTax] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Global tax settings
  const [taxSystemEnabled, setTaxSystemEnabled] = useState(true);
  const [taxApplicationMethod, setTaxApplicationMethod] = useState("exclusive");
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(true);

  useEffect(() => {
    fetchTaxRates();
    fetchGlobalSettings();
  }, []);

  const fetchTaxRates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl("api/settings.php?type=taxes"), {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setTaxRates(data.data);
      }
    } catch (error) {
      console.error("Error fetching tax rates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGlobalSettings = async () => {
    try {
      const response = await fetch(
        buildApiUrl("api/settings.php?type=tax_global"),
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        setTaxSystemEnabled(data.data.tax_system_enabled || true);
        setTaxApplicationMethod(
          data.data.tax_application_method || "exclusive"
        );
        setShowTaxBreakdown(data.data.show_tax_breakdown || true);
      }
    } catch (error) {
      console.error("Error fetching global settings:", error);
    }
  };

  const handleCreateTax = async (taxData) => {
    try {
      const response = await fetch(buildApiUrl("api/settings.php"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "create_tax",
          name: taxData.name,
          rate: taxData.rate,
          description: taxData.description,
          is_active: taxData.is_active,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        await fetchTaxRates();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error creating tax:", error);
      return false;
    }
  };

  const handleUpdateTax = async (taxData) => {
    try {
      const response = await fetch(buildApiUrl("api/settings.php"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "update_tax",
          id: selectedTax.id,
          name: taxData.name,
          rate: taxData.rate,
          description: taxData.description,
          is_active: taxData.is_active,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        await fetchTaxRates();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating tax:", error);
      return false;
    }
  };

  const handleToggleTax = async (tax) => {
    try {
      const response = await fetch(buildApiUrl("api/settings.php"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "toggle_tax",
          id: tax.id,
          is_active: !tax.is_active,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        await fetchTaxRates();
      }
    } catch (error) {
      console.error("Error toggling tax:", error);
    }
  };

  const handleSetDefault = async (tax) => {
    try {
      const response = await fetch(buildApiUrl("api/settings.php"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "set_default_tax",
          id: tax.id,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        await fetchTaxRates();
      }
    } catch (error) {
      console.error("Error setting default tax:", error);
    }
  };

  const handleDeleteTax = async () => {
    try {
      const response = await fetch(buildApiUrl("api/settings.php"), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "delete_tax",
          id: selectedTax.id,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        await fetchTaxRates();
        setIsDeleteModalOpen(false);
        setSelectedTax(null);
      }
    } catch (error) {
      console.error("Error deleting tax:", error);
    }
  };

  const handleEdit = (tax) => {
    setSelectedTax(tax);
    setIsEditModalOpen(true);
  };

  const handleDelete = (tax) => {
    setSelectedTax(tax);
    setIsDeleteModalOpen(true);
  };

  const handleSaveGlobalSettings = async () => {
    try {
      const response = await fetch(buildApiUrl("api/settings.php"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "update_tax_global_settings",
          tax_system_enabled: taxSystemEnabled,
          tax_application_method: taxApplicationMethod,
          show_tax_breakdown: showTaxBreakdown,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // Success feedback could be added here
      }
    } catch (error) {
      console.error("Error saving global settings:", error);
    }
  };

  useEffect(() => {
    // Auto-save global settings when they change
    const timeoutId = setTimeout(() => {
      handleSaveGlobalSettings();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [taxSystemEnabled, taxApplicationMethod, showTaxBreakdown]);

  return (
    <div
      className={`${theme.bgCard} ${theme.shadow} rounded-xl p-4 md:p-6 max-w-full`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className={`text-2xl font-bold ${theme.textPrimary} flex items-center gap-2`}
          >
            <Receipt size={24} />
            Tax Rate Management
          </h2>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg shadow-lg hover:opacity-90 transition"
        >
          <Plus size={18} />
          Add Tax
        </button>
      </div>

      {/* Info Box */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-blue-800 text-sm leading-relaxed">
            <strong>Multiple Tax Rates:</strong> Create and manage different tax
            rates for various products and services. These tax rates will be
            available as dropdown options in Sales, Purchase, and Product pages.
          </p>
        </div>
      </div>

      {/* Tax Rates Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className={theme.textSecondary}>Loading tax rates...</p>
        </div>
      ) : taxRates.length === 0 ? (
        <div className="text-center py-12 mb-8">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${theme.bgAccent} mb-4`}
          >
            <Package size={32} className={theme.textSecondary} />
          </div>
          <h3 className={`text-xl font-semibold ${theme.textPrimary} mb-2`}>
            No Tax Rates Yet
          </h3>
          <p className={`${theme.textSecondary} mb-6`}>
            Create your first tax rate to start managing taxes
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg shadow-lg hover:opacity-90 transition"
          >
            <Plus size={18} />
            Add Tax
          </button>
        </div>
      ) : (
        <TaxRateTable
          taxRates={taxRates}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggle={handleToggleTax}
          onSetDefault={handleSetDefault}
        />
      )}

      {/* Global Tax Settings */}
      <div
        className={`mt-8 ${theme.bgAccent} rounded-lg p-4 md:p-6 border ${theme.borderSecondary} max-w-full`}
      >
        <h3 className={`text-xl font-bold ${theme.textPrimary} mb-6`}>
          Global Tax Settings
        </h3>

        {/* Enable Tax System */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => setTaxSystemEnabled(!taxSystemEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                taxSystemEnabled ? "bg-green-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  taxSystemEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`font-semibold ${theme.textPrimary}`}>
              Enable Tax System
            </span>
          </div>
          <p className={`${theme.textSecondary} text-sm ml-14`}>
            Turn this off to completely disable tax calculations across the
            entire system
          </p>
        </div>

        {/* Tax Application Method & Show Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              className={`block text-sm font-semibold ${theme.textPrimary} mb-2`}
            >
              Tax Application Method
            </label>
            <select
              value={taxApplicationMethod}
              onChange={(e) => setTaxApplicationMethod(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg border ${theme.borderSecondary} ${theme.bgInput} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-[#667eea]`}
            >
              <option value="exclusive">
                Tax Exclusive (tax added to price)
              </option>
              <option value="inclusive">
                Tax Inclusive (price includes tax)
              </option>
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showTaxBreakdown}
                onChange={(e) => setShowTaxBreakdown(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-[#667eea] focus:ring-[#667eea]"
              />
              <span className={`text-sm font-medium ${theme.textPrimary}`}>
                Show detailed tax breakdown on documents
              </span>
            </label>
          </div>
        </div>

        {/* Important Notice */}
        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className="text-orange-600 flex-shrink-0 mt-0.5"
            />
            <p className="text-orange-800 text-sm">
              <strong>Important:</strong> Consult with your accountant or tax
              advisor to ensure compliance with local tax regulations.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddTaxModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleCreateTax}
      />

      <EditTaxModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTax(null);
        }}
        onSave={handleUpdateTax}
        tax={selectedTax}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedTax(null);
        }}
        onConfirm={handleDeleteTax}
        title="Delete Tax Rate"
        message={`Are you sure you want to delete the tax rate "${selectedTax?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default TaxSettings;
