import { useState, useEffect } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Trash2,
  Eye,
  Save,
  Plus,
  X,
  Settings,
  Type,
  Image as ImageIcon,
  Table,
  DollarSign,
  CreditCard,
  User,
  Building,
} from "lucide-react";
import { buildApiUrl } from "../../../config/api.config";

// Draggable Section Component
const DraggableSection = ({ id, section, onDelete, onEdit, children }) => {
  const { theme } = useTheme();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${theme.bgAccent} border ${theme.borderSecondary} rounded-lg p-3 mb-3`}
    >
      <div className="flex items-center gap-2 mb-2">
        <button
          {...attributes}
          {...listeners}
          className={`cursor-grab active:cursor-grabbing p-1 ${theme.textSecondary} hover:${theme.textPrimary}`}
        >
          <GripVertical size={20} />
        </button>
        <span className={`font-semibold ${theme.textPrimary} flex-1`}>
          {section.label}
        </span>
        <button
          onClick={() => onEdit(section)}
          className={`p-1 ${theme.textSecondary} hover:${theme.textPrimary}`}
        >
          <Settings size={16} />
        </button>
        <button
          onClick={() => onDelete(id)}
          className="p-1 text-red-500 hover:text-red-600"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div
        className={`${theme.bgCard} p-2 rounded border ${theme.borderSecondary}`}
      >
        {children}
      </div>
    </div>
  );
};

// Available Elements Library
const elementLibrary = [
  {
    type: "header",
    label: "Header/Logo",
    icon: ImageIcon,
    defaultProps: { showLogo: true, alignment: "left" },
  },
  {
    type: "companyInfo",
    label: "Company Info",
    icon: Building,
    defaultProps: { alignment: "left" },
  },
  {
    type: "customerInfo",
    label: "Customer Info",
    icon: User,
    defaultProps: { alignment: "left" },
  },
  {
    type: "invoiceDetails",
    label: "Invoice Details",
    icon: Type,
    defaultProps: { alignment: "right" },
  },
  {
    type: "itemsTable",
    label: "Items Table",
    icon: Table,
    defaultProps: { showBorders: true },
  },
  {
    type: "totals",
    label: "Totals Section",
    icon: DollarSign,
    defaultProps: { alignment: "right" },
  },
  {
    type: "paymentInfo",
    label: "Payment Info",
    icon: CreditCard,
    defaultProps: { alignment: "left" },
  },
  {
    type: "customText",
    label: "Custom Text",
    icon: Type,
    defaultProps: { text: "Custom text here", alignment: "center" },
  },
];

const CustomInvoiceBuilder = ({ onClose, onSave, existingTemplate = null }) => {
  const { theme } = useTheme();
  const [templateName, setTemplateName] = useState(
    existingTemplate?.name || ""
  );
  const [sections, setSections] = useState(existingTemplate?.sections || []);
  const [editingSection, setEditingSection] = useState(null);
  const [customColor, setCustomColor] = useState(
    existingTemplate?.color || "#667eea"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize with default sections if empty
  useEffect(() => {
    if (sections.length === 0 && !existingTemplate) {
      setSections([
        {
          id: "1",
          type: "header",
          label: "Header/Logo",
          props: { showLogo: true, alignment: "left" },
        },
        {
          id: "2",
          type: "companyInfo",
          label: "Company Info",
          props: { alignment: "right" },
        },
        {
          id: "3",
          type: "invoiceDetails",
          label: "Invoice Details",
          props: { alignment: "right" },
        },
        {
          id: "4",
          type: "customerInfo",
          label: "Customer Info",
          props: { alignment: "left" },
        },
        {
          id: "5",
          type: "itemsTable",
          label: "Items Table",
          props: { showBorders: true },
        },
        {
          id: "6",
          type: "totals",
          label: "Totals Section",
          props: { alignment: "right" },
        },
        {
          id: "7",
          type: "paymentInfo",
          label: "Payment Info",
          props: { alignment: "left" },
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addSection = (elementType) => {
    const element = elementLibrary.find((el) => el.type === elementType);
    const newSection = {
      id: Date.now().toString(),
      type: elementType,
      label: element.label,
      props: { ...element.defaultProps },
    };
    setSections([...sections, newSection]);
  };

  const deleteSection = (id) => {
    setSections(sections.filter((s) => s.id !== id));
  };

  const updateSection = (id, newProps) => {
    setSections(
      sections.map((s) =>
        s.id === id ? { ...s, props: { ...s.props, ...newProps } } : s
      )
    );
    setEditingSection(null);
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      alert("Please enter a template name");
      return;
    }

    setIsSaving(true);
    const templateData = {
      name: templateName,
      sections,
      color: customColor,
      type: "custom",
    };

    try {
      const response = await fetch(buildApiUrl("api/settings.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "save_template",
          type: "invoice",
          name: templateName,
          data: templateData,
          is_default: 0,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          onSave(templateData);
        }, 2000);
      } else {
        alert(data.error || "Failed to save template");
      }
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const renderSectionContent = (section) => {
    const formatCurrency = (amount) =>
      new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
      }).format(amount);

    const sampleData = {
      companyName: "Your Company",
      companyAddress: "123 Business Street, Lagos",
      companyPhone: "+234 123 456 7890",
      companyEmail: "info@company.com",
      customerName: "John Doe",
      customerAddress: "456 Customer Ave",
      invoiceNumber: "INV-001",
      date: "Dec 6, 2025",
      dueDate: "Jan 6, 2026",
      subtotal: 100000,
      tax: 7500,
      total: 107500,
      bankName: "First Bank",
      accountNumber: "1234567890",
      accountName: "Your Company Ltd",
    };

    const alignmentClass =
      section.props?.alignment === "center"
        ? "text-center"
        : section.props?.alignment === "right"
        ? "text-right"
        : "text-left";

    switch (section.type) {
      case "header":
        return (
          <div className={alignmentClass}>
            {section.props?.showLogo && (
              <div
                className={`h-12 w-12 ${theme.bgSecondary} rounded mb-2 inline-block`}
              />
            )}
            <h1 className="text-2xl font-bold" style={{ color: customColor }}>
              INVOICE
            </h1>
          </div>
        );

      case "companyInfo":
        return (
          <div className={alignmentClass}>
            <h2 className={`font-bold text-lg ${theme.textPrimary}`}>
              {sampleData.companyName}
            </h2>
            <p className={`text-sm ${theme.textSecondary}`}>
              {sampleData.companyAddress}
            </p>
            <p className={`text-sm ${theme.textSecondary}`}>
              {sampleData.companyPhone}
            </p>
            <p className={`text-sm ${theme.textSecondary}`}>
              {sampleData.companyEmail}
            </p>
          </div>
        );

      case "customerInfo":
        return (
          <div className={alignmentClass}>
            <p className="font-semibold text-sm" style={{ color: customColor }}>
              BILL TO:
            </p>
            <p className={`font-semibold ${theme.textPrimary}`}>
              {sampleData.customerName}
            </p>
            <p className={`text-sm ${theme.textSecondary}`}>
              {sampleData.customerAddress}
            </p>
          </div>
        );

      case "invoiceDetails":
        return (
          <div className={alignmentClass}>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className={theme.textSecondary}>Invoice #:</span>
                <span className={`font-semibold ${theme.textPrimary}`}>
                  {sampleData.invoiceNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={theme.textSecondary}>Date:</span>
                <span className={theme.textPrimary}>{sampleData.date}</span>
              </div>
              <div className="flex justify-between">
                <span className={theme.textSecondary}>Due Date:</span>
                <span className={theme.textPrimary}>{sampleData.dueDate}</span>
              </div>
            </div>
          </div>
        );

      case "itemsTable":
        return (
          <table
            className={`w-full text-sm ${
              section.props?.showBorders
                ? `border ${theme.borderSecondary}`
                : ""
            }`}
          >
            <thead>
              <tr style={{ backgroundColor: `${customColor}15` }}>
                <th className={`text-left p-2 ${theme.textPrimary}`}>
                  Description
                </th>
                <th className={`text-center p-2 ${theme.textPrimary}`}>Qty</th>
                <th className={`text-right p-2 ${theme.textPrimary}`}>Rate</th>
                <th className={`text-right p-2 ${theme.textPrimary}`}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className={`border-b ${theme.borderSecondary}`}>
                <td className={`p-2 ${theme.textPrimary}`}>Sample Item</td>
                <td className={`text-center p-2 ${theme.textPrimary}`}>1</td>
                <td className={`text-right p-2 ${theme.textPrimary}`}>
                  {formatCurrency(100000)}
                </td>
                <td className={`text-right p-2 ${theme.textPrimary}`}>
                  {formatCurrency(100000)}
                </td>
              </tr>
            </tbody>
          </table>
        );

      case "totals":
        return (
          <div className={`${alignmentClass} space-y-1 text-sm`}>
            <div className="flex justify-between">
              <span className={theme.textSecondary}>Subtotal:</span>
              <span className={theme.textPrimary}>
                {formatCurrency(sampleData.subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={theme.textSecondary}>Tax (7.5%):</span>
              <span className={theme.textPrimary}>
                {formatCurrency(sampleData.tax)}
              </span>
            </div>
            <div
              className={`flex justify-between font-bold text-base pt-1 border-t ${theme.borderSecondary}`}
            >
              <span style={{ color: customColor }}>TOTAL:</span>
              <span style={{ color: customColor }}>
                {formatCurrency(sampleData.total)}
              </span>
            </div>
          </div>
        );

      case "paymentInfo":
        return (
          <div className={alignmentClass}>
            <p
              className="font-semibold mb-2 text-sm"
              style={{ color: customColor }}
            >
              Payment Information
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className={theme.textSecondary}>Bank:</span>
                <p className={`font-semibold ${theme.textPrimary}`}>
                  {sampleData.bankName}
                </p>
              </div>
              <div>
                <span className={theme.textSecondary}>Account:</span>
                <p className={`font-semibold ${theme.textPrimary}`}>
                  {sampleData.accountNumber}
                </p>
              </div>
              <div>
                <span className={theme.textSecondary}>Name:</span>
                <p className={`font-semibold ${theme.textPrimary}`}>
                  {sampleData.accountName}
                </p>
              </div>
            </div>
          </div>
        );

      case "customText":
        return (
          <div className={alignmentClass}>
            <p className={`text-sm ${theme.textSecondary}`}>
              {section.props?.text || "Custom text"}
            </p>
          </div>
        );

      default:
        return (
          <p className={`text-sm ${theme.textSecondary}`}>
            Unknown section type
          </p>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div
        className={`${theme.bgCard} rounded-xl ${theme.shadow} w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Custom Invoice Builder
            </h2>
            <p className="text-white/80 text-sm mt-1">
              Drag and drop to arrange your custom template
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Elements Library */}
            <div
              className={`${theme.bgAccent} rounded-lg p-4 border ${theme.borderSecondary}`}
            >
              <h3
                className={`font-semibold ${theme.textPrimary} mb-4 flex items-center gap-2`}
              >
                <Plus size={18} />
                Add Elements
              </h3>
              <div className="space-y-2">
                {elementLibrary.map((element) => (
                  <button
                    key={element.type}
                    onClick={() => addSection(element.type)}
                    className={`w-full p-3 ${theme.bgCard} border ${theme.borderSecondary} rounded-lg ${theme.bgHover} transition flex items-center gap-3`}
                  >
                    <element.icon size={18} className={theme.textSecondary} />
                    <span
                      className={`${theme.textPrimary} text-sm font-medium`}
                    >
                      {element.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Color Picker */}
              <div className="mt-6">
                <label
                  className={`block font-semibold ${theme.textPrimary} mb-2 text-sm`}
                >
                  Theme Color
                </label>
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Builder Area */}
            <div className="lg:col-span-2">
              <div className="mb-4">
                <label
                  className={`block font-semibold ${theme.textPrimary} mb-2`}
                >
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="My Custom Invoice"
                  className={`w-full px-4 py-2 rounded-lg border ${theme.borderSecondary} ${theme.bgInput} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-[#667eea]`}
                />
              </div>

              <div
                className={`${theme.bgCard} border-2 border-dashed ${theme.borderSecondary} rounded-lg p-6 min-h-[500px]`}
              >
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={sections}
                    strategy={verticalListSortingStrategy}
                  >
                    {sections.map((section) => (
                      <DraggableSection
                        key={section.id}
                        id={section.id}
                        section={section}
                        onDelete={deleteSection}
                        onEdit={setEditingSection}
                      >
                        {renderSectionContent(section)}
                      </DraggableSection>
                    ))}
                  </SortableContext>
                </DndContext>

                {sections.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Type size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Add elements from the left to build your template</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className={`${theme.bgAccent} p-4 border-t ${theme.borderSecondary} flex justify-end gap-3 flex-shrink-0`}
        >
          <button
            onClick={onClose}
            className={`px-6 py-2 border ${theme.borderSecondary} ${theme.textPrimary} rounded-lg ${theme.bgHover} transition font-medium`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !templateName.trim()}
            className="px-6 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg hover:opacity-90 transition font-medium disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={18} />
            {isSaving ? "Saving..." : "Save Template"}
          </button>
        </div>
      </div>

      {/* Section Edit Modal */}
      {editingSection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div
            className={`${theme.bgCard} rounded-lg p-6 max-w-md w-full mx-4`}
          >
            <h3 className={`font-bold ${theme.textPrimary} mb-4`}>
              Edit {editingSection.label}
            </h3>

            {editingSection.type === "customText" && (
              <div className="mb-4">
                <label
                  className={`block font-semibold ${theme.textPrimary} mb-2 text-sm`}
                >
                  Text Content
                </label>
                <textarea
                  value={editingSection.props?.text || ""}
                  onChange={(e) =>
                    setEditingSection({
                      ...editingSection,
                      props: { ...editingSection.props, text: e.target.value },
                    })
                  }
                  className={`w-full px-3 py-2 rounded border ${theme.borderSecondary} ${theme.bgInput} ${theme.textPrimary}`}
                  rows="3"
                />
              </div>
            )}

            <div className="mb-4">
              <label
                className={`block font-semibold ${theme.textPrimary} mb-2 text-sm`}
              >
                Alignment
              </label>
              <select
                value={editingSection.props?.alignment || "left"}
                onChange={(e) =>
                  setEditingSection({
                    ...editingSection,
                    props: {
                      ...editingSection.props,
                      alignment: e.target.value,
                    },
                  })
                }
                className={`w-full px-3 py-2 rounded border ${theme.borderSecondary} ${theme.bgInput} ${theme.textPrimary}`}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>

            {editingSection.type === "header" && (
              <div className="mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingSection.props?.showLogo || false}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        props: {
                          ...editingSection.props,
                          showLogo: e.target.checked,
                        },
                      })
                    }
                    className="rounded"
                  />
                  <span className={`${theme.textPrimary} text-sm`}>
                    Show Logo
                  </span>
                </label>
              </div>
            )}

            {editingSection.type === "itemsTable" && (
              <div className="mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingSection.props?.showBorders || false}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        props: {
                          ...editingSection.props,
                          showBorders: e.target.checked,
                        },
                      })
                    }
                    className="rounded"
                  />
                  <span className={`${theme.textPrimary} text-sm`}>
                    Show Borders
                  </span>
                </label>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEditingSection(null)}
                className={`px-4 py-2 border ${theme.borderSecondary} rounded-lg ${theme.bgHover}`}
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  updateSection(editingSection.id, editingSection.props)
                }
                className="px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div
            className={`${theme.bgCard} rounded-xl shadow-2xl p-8 max-w-md mx-4 text-center`}
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className={`text-xl font-bold ${theme.textPrimary} mb-2`}>
              Template Saved Successfully!
            </h3>
            <p className={`${theme.textSecondary} mb-1`}>
              Your custom template has been saved.
            </p>
            <p className={`${theme.textPrimary} font-semibold`}>
              "{templateName}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomInvoiceBuilder;
