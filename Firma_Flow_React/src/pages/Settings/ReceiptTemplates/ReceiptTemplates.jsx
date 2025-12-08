import { useState, useEffect } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  Receipt,
  Eye,
  Check,
  ChevronDown,
  Palette,
  Wand2,
  Layout,
  Maximize2,
  Edit,
  Trash2,
} from "lucide-react";
import { buildApiUrl } from "../../../config/api.config";
import ThermalReceipt from "./templates/ThermalReceipt";
import ModernReceipt from "./templates/ModernReceipt";
import ClassicReceipt from "./templates/ClassicReceipt";
import CompactReceipt from "./templates/CompactReceipt";
import DetailedReceipt from "./templates/DetailedReceipt";
import ReceiptPreviewModal from "./ReceiptPreviewModal";
import CustomReceiptBuilder from "./CustomReceiptBuilder";
import FreeformReceiptBuilder from "./FreeformReceiptBuilder";

const ReceiptTemplates = () => {
  const { theme } = useTheme();
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedColor, setSelectedColor] = useState("#667eea");
  const [showPreview, setShowPreview] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [_templates, setTemplates] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCustomColor, setShowCustomColor] = useState(false);
  const [customColor, setCustomColor] = useState("#667eea");
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [showFreeformBuilder, setShowFreeformBuilder] = useState(false);
  const [showBuilderChoice, setShowBuilderChoice] = useState(false);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [deleteSuccessModal, setDeleteSuccessModal] = useState(false);

  const builtInTemplates = [
    { id: "thermal", name: "Thermal (POS Style)", component: ThermalReceipt },
    { id: "modern", name: "Modern Receipt", component: ModernReceipt },
    { id: "classic", name: "Classic Receipt", component: ClassicReceipt },
    { id: "compact", name: "Compact Receipt", component: CompactReceipt },
    { id: "detailed", name: "Detailed Receipt", component: DetailedReceipt },
  ];

  // Merge built-in and custom templates
  const availableTemplates = [
    ...builtInTemplates,
    ...customTemplates.map((ct) => ({
      id: ct.template_name,
      name: ct.template_name,
      component: null,
      isCustom: true,
      data: ct.template_data,
      fullTemplate: ct, // Store full template object for editing/deleting
    })),
  ];

  const colorOptions = [
    { name: "Purple", value: "#667eea" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Green", value: "#10b981" },
    { name: "Red", value: "#ef4444" },
    { name: "Orange", value: "#f59e0b" },
    { name: "Pink", value: "#ec4899" },
    { name: "Indigo", value: "#6366f1" },
    { name: "Teal", value: "#14b8a6" },
    { name: "Custom", value: "custom" },
  ];

  const handleColorSelect = (colorValue) => {
    if (colorValue === "custom") {
      setShowCustomColor(true);
      setSelectedColor(customColor);
    } else {
      setShowCustomColor(false);
      setSelectedColor(colorValue);
    }
  };

  const handleCustomColorChange = (e) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    setSelectedColor(newColor);
  };

  useEffect(() => {
    fetchCompanyInfo();
    fetchTemplates();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      const response = await fetch(
        buildApiUrl("api/settings.php?type=company"),
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await response.json();
      if (response.ok && data.success) {
        // Map API fields to template-expected fields
        const company = data.data;
        const mappedCompanyInfo = {
          ...company,
          logo: company.logo_path ? buildApiUrl(company.logo_path) : null,
          address: company.billing_address || "",
          bank_account: company.account_number || "",
        };
        setCompanyInfo(mappedCompanyInfo);
      }
    } catch (error) {
      console.error("Error fetching company info:", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch(
        buildApiUrl("api/settings.php?type=templates"),
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await response.json();
      if (response.ok && data.success) {
        const receiptTemplates = data.data.filter(
          (t) => t.template_type === "receipt"
        );
        setTemplates(receiptTemplates);

        // Filter custom templates (those with type="custom" or "custom-freeform" in their data)
        const customReceiptTemplates = receiptTemplates.filter(
          (t) =>
            t.template_data?.type === "custom" ||
            t.template_data?.type === "custom-freeform"
        );
        setCustomTemplates(customReceiptTemplates);

        const defaultTemplate = receiptTemplates.find((t) => t.is_default);
        if (defaultTemplate) {
          setSelectedTemplate(defaultTemplate.template_name);
          setSelectedColor(defaultTemplate.template_data?.color || "#667eea");
        }
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const response = await fetch(buildApiUrl("api/settings.php"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "save_template",
          type: "receipt",
          name: selectedTemplate,
          data: {
            color: selectedColor,
            templateId: builtInTemplates.find(
              (t) => t.name === selectedTemplate
            )?.id,
          },
          is_default: true,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMessage("Receipt template saved successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
        fetchTemplates();
      }
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };

  const handlePreview = () => {
    if (selectedTemplate) {
      setShowPreview(true);
    }
  };

  const handleEditTemplate = (template) => {
    // Pass the template data in the format the builder expects
    const templateData = {
      name: template.name,
      ...template.data, // This contains sections, color, documentBorder, etc.
    };
    setEditingTemplate(templateData);
    setShowCustomBuilder(true);
    setIsDropdownOpen(false);
  };

  const handleDeleteTemplate = async (template) => {
    setTemplateToDelete(template);
    setDeleteConfirmModal(true);
    setIsDropdownOpen(false);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;

    try {
      const response = await fetch(buildApiUrl("api/settings.php"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "delete_template",
          template_id: templateToDelete.fullTemplate?.id,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setDeleteConfirmModal(false);
        setDeleteSuccessModal(true);

        // If deleted template was selected, clear selection
        if (selectedTemplate === templateToDelete.name) {
          setSelectedTemplate("");
        }

        fetchTemplates();
        setTemplateToDelete(null);
      } else {
        setDeleteConfirmModal(false);
        setSuccessMessage(data.message || "Failed to delete template");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      setDeleteConfirmModal(false);
      setSuccessMessage("Failed to delete template");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const sampleReceiptData = {
    receiptNumber: "REC-2025-001",
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
    items: [
      { name: "Product 1", quantity: 2, price: 5000, total: 10000 },
      { name: "Product 2", quantity: 1, price: 15000, total: 15000 },
      { name: "Service Fee", quantity: 1, price: 7500, total: 7500 },
    ],
    subtotal: 32500,
    tax: 2437.5,
    discount: 1000,
    total: 33937.5,
    paymentMethod: "Cash",
    amountPaid: 35000,
    change: 1062.5,
  };

  return (
    <div
      className={`${theme.bgCard} ${theme.shadow} rounded-xl p-4 md:p-6 max-w-full`}
    >
      {/* Header */}
      <div className="mb-6">
        <h2
          className={`text-2xl font-bold ${theme.textPrimary} flex items-center gap-2`}
        >
          <Receipt size={24} />
          Receipt Templates
        </h2>
        <p className={`${theme.textSecondary} mt-1`}>
          Choose and customize your receipt template
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Info Box */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> The selected template will be used when
          generating payment receipts. Company information and transaction
          details will be populated automatically.
        </p>
      </div>

      {/* Template Selection */}
      <div
        className={`mb-6 p-6 ${theme.bgAccent} rounded-lg border ${theme.borderSecondary}`}
      >
        <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
          Select Template
        </h3>

        {/* Custom Dropdown */}
        <div className="relative mb-4">
          <label className={`block font-semibold ${theme.textPrimary} mb-2`}>
            Receipt Style
          </label>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-full px-4 py-3 rounded-lg border ${theme.borderSecondary} ${theme.bgInput} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-[#667eea] flex items-center justify-between`}
          >
            <span>{selectedTemplate || "Select a template..."}</span>
            <ChevronDown
              size={20}
              className={`transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div
              className={`absolute z-10 w-full mt-2 ${theme.bgCard} border ${theme.borderSecondary} rounded-lg shadow-lg max-h-60 overflow-auto`}
            >
              {availableTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`flex items-center justify-between px-4 py-3 ${theme.textPrimary} hover:bg-gradient-to-r from-[#667eea]/10 to-[#764ba2]/10 transition`}
                >
                  <button
                    onClick={() => {
                      setSelectedTemplate(template.name);
                      setIsDropdownOpen(false);
                    }}
                    className="flex-1 text-left flex items-center gap-2"
                  >
                    <span>{template.name}</span>
                    {selectedTemplate === template.name && (
                      <Check size={18} className="text-green-600" />
                    )}
                  </button>
                  {template.isCustom && (
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTemplate(template);
                        }}
                        className="p-1 hover:bg-blue-100 rounded transition"
                        title="Edit template"
                      >
                        <Edit size={16} className="text-blue-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template);
                        }}
                        className="p-1 hover:bg-red-100 rounded transition"
                        title="Delete template"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Color Selection */}
        <div>
          <label className={`block font-semibold ${theme.textPrimary} mb-2`}>
            Theme Color
          </label>
          <div className="grid grid-cols-4 md:grid-cols-9 gap-3">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                onClick={() => handleColorSelect(color.value)}
                className={`relative w-12 h-12 rounded-lg border-2 transition-all ${
                  (color.value === "custom" && showCustomColor) ||
                  (color.value !== "custom" && selectedColor === color.value)
                    ? "border-gray-800 scale-110"
                    : "border-gray-300 hover:scale-105"
                }`}
                style={{
                  backgroundColor:
                    color.value === "custom" ? customColor : color.value,
                }}
                title={color.name}
              >
                {color.value === "custom" ? (
                  <Palette
                    size={20}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-lg"
                  />
                ) : (
                  ((color.value === "custom" && showCustomColor) ||
                    (color.value !== "custom" &&
                      selectedColor === color.value)) && (
                    <Check
                      size={20}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-lg"
                    />
                  )
                )}
              </button>
            ))}
          </div>

          {/* Custom Color Picker */}
          {showCustomColor && (
            <div
              className={`mt-4 p-4 rounded-lg border ${theme.bgAccent} ${theme.borderSecondary}`}
            >
              <label
                className={`block font-semibold ${theme.textPrimary} mb-2`}
              >
                Custom Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customColor}
                  onChange={handleCustomColorChange}
                  className="w-16 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={handleCustomColorChange}
                  className={`flex-1 px-3 py-2 border rounded-lg ${theme.bgInput} ${theme.textPrimary} ${theme.borderSecondary}`}
                  placeholder="#667eea"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setShowBuilderChoice(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white rounded-lg shadow-lg hover:opacity-90 transition"
        >
          <Wand2 size={18} />
          Create Custom Template
        </button>

        <button
          onClick={handlePreview}
          disabled={!selectedTemplate}
          className="flex items-center gap-2 px-6 py-3 border-2 border-[#667eea] text-[#667eea] rounded-lg font-semibold hover:bg-[#667eea]/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Eye size={18} />
          Preview Template
        </button>

        <button
          onClick={handleSaveTemplate}
          disabled={!selectedTemplate}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg shadow-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check size={18} />
          Save as Default
        </button>
      </div>

      {/* Custom Template Builder */}
      {showCustomBuilder && (
        <CustomReceiptBuilder
          existingTemplate={editingTemplate}
          onClose={() => {
            setShowCustomBuilder(false);
            setEditingTemplate(null);
          }}
          onSave={(template) => {
            setShowCustomBuilder(false);
            setEditingTemplate(null);
            // Set the newly created/edited template as selected
            setSelectedTemplate(template.name);
            setSelectedColor(template.color || "#667eea");
            setSuccessMessage(
              `Custom template "${template.name}" ${
                editingTemplate ? "updated" : "saved"
              } successfully!`
            );
            setTimeout(() => setSuccessMessage(""), 3000);
            fetchTemplates();
          }}
        />
      )}

      {/* Freeform Template Builder */}
      {showFreeformBuilder && (
        <FreeformReceiptBuilder
          onClose={() => setShowFreeformBuilder(false)}
          onSave={(template) => {
            setShowFreeformBuilder(false);
            // Set the newly created template as selected
            setSelectedTemplate(template.name);
            setSelectedColor(template.color || "#667eea");
            setSuccessMessage(
              `Custom template "${template.name}" saved successfully!`
            );
            setTimeout(() => setSuccessMessage(""), 3000);
            fetchTemplates();
          }}
        />
      )}

      {/* Builder Choice Modal */}
      {showBuilderChoice && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowBuilderChoice(false)}
        >
          <div
            className={`${theme.bgCard} rounded-xl shadow-2xl p-6 max-w-2xl mx-4`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>
              Choose Builder Type
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setShowBuilderChoice(false);
                  setShowCustomBuilder(true);
                }}
                className={`p-6 border-2 ${theme.borderSecondary} rounded-lg hover:border-[#667eea] transition`}
              >
                <div className="flex flex-col items-center text-center">
                  <Layout className="w-12 h-12 mb-3 text-[#667eea]" />
                  <h4 className={`font-bold text-lg mb-2 ${theme.textPrimary}`}>
                    Structured Builder
                  </h4>
                  <p className={`text-sm ${theme.textSecondary}`}>
                    Drag & drop sections in a vertical layout. Perfect for
                    organized, professional receipts.
                  </p>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowBuilderChoice(false);
                  setShowFreeformBuilder(true);
                }}
                className={`p-6 border-2 ${theme.borderSecondary} rounded-lg hover:border-[#f59e0b] transition`}
              >
                <div className="flex flex-col items-center text-center">
                  <Maximize2 className="w-12 h-12 mb-3 text-[#f59e0b]" />
                  <h4 className={`font-bold text-lg mb-2 ${theme.textPrimary}`}>
                    Freeform Builder
                  </h4>
                  <p className={`text-sm ${theme.textSecondary}`}>
                    Position elements anywhere on the page. Complete creative
                    freedom for unique designs.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <ReceiptPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        template={availableTemplates.find((t) => t.name === selectedTemplate)}
        color={selectedColor}
        companyInfo={companyInfo}
        receiptData={sampleReceiptData}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${theme.bgCard} rounded-lg p-6 max-w-md w-full`}>
            <h3 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>
              Delete Template
            </h3>
            <p className={`${theme.textSecondary} mb-6`}>
              Are you sure you want to delete "{templateToDelete?.name}"? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteConfirmModal(false);
                  setTemplateToDelete(null);
                }}
                className={`px-4 py-2 border ${theme.borderSecondary} ${theme.textPrimary} rounded-lg ${theme.bgHover} transition`}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Success Modal */}
      {deleteSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${theme.bgCard} rounded-lg p-6 max-w-md w-full`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-600" />
              </div>
              <h3 className={`text-xl font-bold ${theme.textPrimary} mb-2`}>
                Template Deleted!
              </h3>
              <p className={`${theme.textSecondary} mb-6`}>
                "{templateToDelete?.name}" has been deleted successfully.
              </p>
              <button
                onClick={() => {
                  setDeleteSuccessModal(false);
                  setTemplateToDelete(null);
                }}
                className="px-6 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg hover:opacity-90 transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptTemplates;
