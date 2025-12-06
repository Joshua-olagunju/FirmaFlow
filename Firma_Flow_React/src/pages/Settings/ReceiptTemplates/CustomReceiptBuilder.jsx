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
  Save,
  Plus,
  X,
  Settings,
  Type,
  Table,
  DollarSign,
  CreditCard,
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
        <span className={`font-semibold ${theme.textPrimary} flex-1 text-sm`}>
          {section.label}
        </span>
        <button
          onClick={() => onEdit(section)}
          className={`p-1 ${theme.textSecondary} hover:${theme.textPrimary}`}
        >
          <Settings size={14} />
        </button>
        <button
          onClick={() => onDelete(id)}
          className="p-1 text-red-500 hover:text-red-600"
        >
          <Trash2 size={14} />
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

// Available Elements Library for Receipts
const elementLibrary = [
  {
    type: "header",
    label: "Header",
    icon: Building,
    defaultProps: { alignment: "center" },
  },
  {
    type: "companyInfo",
    label: "Company Info",
    icon: Building,
    defaultProps: { alignment: "center" },
  },
  {
    type: "receiptDetails",
    label: "Receipt Details",
    icon: Type,
    defaultProps: { alignment: "left" },
  },
  {
    type: "itemsTable",
    label: "Items List",
    icon: Table,
    defaultProps: { compact: true },
  },
  {
    type: "totals",
    label: "Totals Section",
    icon: DollarSign,
    defaultProps: { alignment: "left" },
  },
  {
    type: "paymentMethod",
    label: "Payment Method",
    icon: CreditCard,
    defaultProps: { alignment: "left" },
  },
  {
    type: "customText",
    label: "Custom Text",
    icon: Type,
    defaultProps: { text: "Thank you!", alignment: "center" },
  },
];

const CustomReceiptBuilder = ({ onClose, onSave, existingTemplate = null }) => {
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
          label: "Header",
          props: { alignment: "center" },
        },
        {
          id: "2",
          type: "companyInfo",
          label: "Company Info",
          props: { alignment: "center" },
        },
        {
          id: "3",
          type: "receiptDetails",
          label: "Receipt Details",
          props: { alignment: "left" },
        },
        {
          id: "4",
          type: "itemsTable",
          label: "Items List",
          props: { compact: true },
        },
        {
          id: "5",
          type: "totals",
          label: "Totals Section",
          props: { alignment: "left" },
        },
        {
          id: "6",
          type: "paymentMethod",
          label: "Payment Method",
          props: { alignment: "left" },
        },
        {
          id: "7",
          type: "customText",
          label: "Custom Text",
          props: { text: "Thank you!", alignment: "center" },
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
          type: "receipt",
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
      receiptNumber: "RCP-001",
      date: "Dec 6, 2025",
      time: "14:30",
      subtotal: 50000,
      tax: 3750,
      total: 53750,
      paymentMethod: "Cash",
      amountPaid: 60000,
      change: 6250,
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
            <h2 className="text-lg font-bold" style={{ color: customColor }}>
              RECEIPT
            </h2>
          </div>
        );

      case "companyInfo":
        return (
          <div className={alignmentClass}>
            <h3 className={`font-bold text-sm ${theme.textPrimary}`}>
              {sampleData.companyName}
            </h3>
            <p className={`text-xs ${theme.textSecondary}`}>
              {sampleData.companyAddress}
            </p>
            <p className={`text-xs ${theme.textSecondary}`}>
              {sampleData.companyPhone}
            </p>
          </div>
        );

      case "receiptDetails":
        return (
          <div className={alignmentClass}>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className={theme.textSecondary}>Receipt #:</span>
                <span className={`font-semibold ${theme.textPrimary}`}>
                  {sampleData.receiptNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={theme.textSecondary}>Date:</span>
                <span className={theme.textPrimary}>{sampleData.date}</span>
              </div>
              <div className="flex justify-between">
                <span className={theme.textSecondary}>Time:</span>
                <span className={theme.textPrimary}>{sampleData.time}</span>
              </div>
            </div>
          </div>
        );

      case "itemsTable":
        return (
          <div className="text-xs">
            <div className={`border-b ${theme.borderSecondary} pb-1 mb-1`}>
              <div className="flex justify-between font-semibold">
                <span className={theme.textPrimary}>Item</span>
                <span className={theme.textPrimary}>Amount</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className={theme.textPrimary}>Sample Product (x2)</span>
                <span className={theme.textPrimary}>
                  {formatCurrency(50000)}
                </span>
              </div>
            </div>
          </div>
        );

      case "totals":
        return (
          <div className={`${alignmentClass} space-y-1 text-xs`}>
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
              className={`flex justify-between font-bold pt-1 border-t ${theme.borderSecondary}`}
            >
              <span style={{ color: customColor }}>TOTAL:</span>
              <span style={{ color: customColor }}>
                {formatCurrency(sampleData.total)}
              </span>
            </div>
          </div>
        );

      case "paymentMethod":
        return (
          <div className={`${alignmentClass} text-xs space-y-1`}>
            <div className="flex justify-between">
              <span className={theme.textSecondary}>Payment:</span>
              <span className={`font-semibold ${theme.textPrimary}`}>
                {sampleData.paymentMethod}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={theme.textSecondary}>Amount Paid:</span>
              <span className={theme.textPrimary}>
                {formatCurrency(sampleData.amountPaid)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={theme.textSecondary}>Change:</span>
              <span className={theme.textPrimary}>
                {formatCurrency(sampleData.change)}
              </span>
            </div>
          </div>
        );

      case "customText":
        return (
          <div className={alignmentClass}>
            <p className={`text-xs ${theme.textSecondary}`}>
              {section.props?.text || "Custom text"}
            </p>
          </div>
        );

      default:
        return (
          <p className={`text-xs ${theme.textSecondary}`}>
            Unknown section type
          </p>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div
        className={`${theme.bgCard} rounded-xl ${theme.shadow} w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Custom Receipt Builder
            </h2>
            <p className="text-white/80 text-sm mt-1">
              Drag and drop to arrange your custom receipt template
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Elements Library */}
            <div
              className={`${theme.bgAccent} rounded-lg p-4 border ${theme.borderSecondary}`}
            >
              <h3
                className={`font-semibold ${theme.textPrimary} mb-4 flex items-center gap-2 text-sm`}
              >
                <Plus size={16} />
                Add Elements
              </h3>
              <div className="space-y-2">
                {elementLibrary.map((element) => (
                  <button
                    key={element.type}
                    onClick={() => addSection(element.type)}
                    className={`w-full p-2.5 ${theme.bgCard} border ${theme.borderSecondary} rounded-lg ${theme.bgHover} transition flex items-center gap-2`}
                  >
                    <element.icon size={14} className={theme.textSecondary} />
                    <span
                      className={`${theme.textPrimary} text-xs font-medium`}
                    >
                      {element.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Color Picker */}
              <div className="mt-6">
                <label
                  className={`block font-semibold ${theme.textPrimary} mb-2 text-xs`}
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
            <div className="lg:col-span-3">
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
                  placeholder="My Custom Receipt"
                  className={`w-full px-4 py-2 rounded-lg border ${theme.borderSecondary} ${theme.bgInput} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-[#667eea]`}
                />
              </div>

              {/* Receipt Preview Container */}
              <div className="flex justify-center">
                <div
                  className={`${theme.bgCard} border-2 border-dashed ${theme.borderSecondary} rounded-lg p-4 min-h-[500px]`}
                  style={{ width: "100%", maxWidth: "400px" }}
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
                      <Type size={36} className="mx-auto mb-3 opacity-50" />
                      <p className="text-sm">
                        Add elements to build your receipt
                      </p>
                    </div>
                  )}
                </div>
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

            {editingSection.type === "itemsTable" && (
              <div className="mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingSection.props?.compact || false}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        props: {
                          ...editingSection.props,
                          compact: e.target.checked,
                        },
                      })
                    }
                    className="rounded"
                  />
                  <span className={`${theme.textPrimary} text-sm`}>
                    Compact View
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

export default CustomReceiptBuilder;
