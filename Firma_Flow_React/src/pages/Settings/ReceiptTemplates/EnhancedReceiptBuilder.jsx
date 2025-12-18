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
  Eye,
  Image as ImageIcon,
  FileText,
  Users,
  Table as TableIcon,
  DollarSign,
  CreditCard,
  Type,
  Minus,
  Layout,
} from "lucide-react";
import { buildApiUrl } from "../../../config/api.config";

// Template Presets for Thermal Receipts - Matching actual template designs EXACTLY
const templatePresets = {
  thermal: {
    name: "Thermal POS Style",
    description:
      "Classic POS thermal receipt with monospace font and dashed borders",
    fontFamily: "monospace",
    sections: [
      {
        id: "1",
        type: "header",
        label: "Company Header",
        props: {
          alignment: "center",
          fontSize: "sm",
          fontWeight: "bold",
          backgroundColor: "transparent",
          padding: "3",
          fontFamily: "monospace",
        },
      },
      {
        id: "2",
        type: "companyInfo",
        label: "Company Address & Phone",
        props: {
          alignment: "center",
          fontSize: "xs",
          fontWeight: "normal",
          backgroundColor: "transparent",
          padding: "0",
          showEmail: false,
          showPhone: true,
          showAddress: true,
          fontFamily: "monospace",
        },
      },
      {
        id: "3",
        type: "divider",
        label: "Dashed Border",
        props: {
          thickness: "2",
          style: "dashed",
          color: "#9ca3af",
          marginTop: "3",
          marginBottom: "3",
        },
      },
      {
        id: "4",
        type: "receiptDetails",
        label: "Receipt #, Date & Time",
        props: {
          alignment: "left",
          fontSize: "xs",
          backgroundColor: "transparent",
          padding: "0",
          showReceiptNumber: true,
          showDate: true,
          showTime: true,
          layout: "stacked",
          fontFamily: "monospace",
        },
      },
      {
        id: "5",
        type: "divider",
        label: "Items Top Border",
        props: {
          thickness: "1",
          style: "dashed",
          color: "#9ca3af",
          marginTop: "3",
          marginBottom: "2",
        },
      },
      {
        id: "6",
        type: "itemsTable",
        label: "Items List",
        props: {
          showBorders: false,
          fontSize: "xs",
          zebraStripes: false,
          headerBgColor: "transparent",
          showUnitPrice: true,
          fontFamily: "monospace",
        },
      },
      {
        id: "7",
        type: "divider",
        label: "Items Bottom Border",
        props: {
          thickness: "1",
          style: "dashed",
          color: "#9ca3af",
          marginTop: "2",
          marginBottom: "2",
        },
      },
      {
        id: "8",
        type: "totals",
        label: "Totals Section",
        props: {
          alignment: "left",
          fontSize: "xs",
          fontWeight: "normal",
          backgroundColor: "transparent",
          padding: "0",
          showSubtotal: true,
          showTax: true,
          showDiscount: true,
          totalStyle: "simple",
          fontFamily: "monospace",
        },
      },
      {
        id: "9",
        type: "divider",
        label: "Payment Border",
        props: {
          thickness: "1",
          style: "dashed",
          color: "#9ca3af",
          marginTop: "3",
          marginBottom: "2",
        },
      },
      {
        id: "10",
        type: "paymentInfo",
        label: "Payment Details",
        props: {
          alignment: "left",
          fontSize: "xs",
          backgroundColor: "transparent",
          padding: "0",
          showMethod: true,
          showAmountPaid: true,
          showChange: true,
          fontFamily: "monospace",
        },
      },
      {
        id: "11",
        type: "divider",
        label: "Footer Border",
        props: {
          thickness: "2",
          style: "dashed",
          color: "#9ca3af",
          marginTop: "3",
          marginBottom: "3",
        },
      },
      {
        id: "12",
        type: "customText",
        label: "Thank You Message",
        props: {
          text: "THANK YOU!",
          alignment: "center",
          fontSize: "xs",
          fontWeight: "bold",
          backgroundColor: "transparent",
          padding: "0",
          fontFamily: "monospace",
        },
      },
      {
        id: "13",
        type: "customText",
        label: "Come Again",
        props: {
          text: "Please come again",
          alignment: "center",
          fontSize: "xs",
          fontWeight: "normal",
          backgroundColor: "transparent",
          padding: "0",
          fontFamily: "monospace",
        },
      },
      {
        id: "14",
        type: "customText",
        label: "Customer Copy",
        props: {
          text: "*** CUSTOMER COPY ***",
          alignment: "center",
          fontSize: "xs",
          fontWeight: "normal",
          backgroundColor: "transparent",
          padding: "2",
          fontFamily: "monospace",
        },
      },
    ],
  },
  modern: {
    name: "Modern Fresh Style",
    description: "Contemporary design with gradient header and card sections",
    fontFamily: "Inter, sans-serif",
    sections: [
      {
        id: "1",
        type: "customText",
        label: "Header Label",
        props: {
          text: "PAYMENT RECEIPT",
          alignment: "center",
          fontSize: "sm",
          fontWeight: "normal",
          backgroundColor: "accent",
          textColor: "#ffffff",
          padding: "4",
          opacity: "0.9",
        },
      },
      {
        id: "2",
        type: "receiptDetails",
        label: "Receipt Number (Large)",
        props: {
          alignment: "center",
          fontSize: "xl",
          fontWeight: "bold",
          backgroundColor: "accent",
          textColor: "#ffffff",
          padding: "2",
          showReceiptNumber: true,
          showDate: true,
          showTime: false,
          layout: "centered",
        },
      },
      {
        id: "3",
        type: "companyInfo",
        label: "Company Info Card",
        props: {
          alignment: "center",
          fontSize: "xs",
          fontWeight: "normal",
          backgroundColor: "#f9fafb",
          padding: "4",
          showEmail: true,
          showPhone: true,
          showAddress: true,
          borderBottom: true,
        },
      },
      {
        id: "4",
        type: "customText",
        label: "Customer Label",
        props: {
          text: "Received From",
          alignment: "left",
          fontSize: "xs",
          fontWeight: "semibold",
          backgroundColor: "transparent",
          textColor: "accent",
          padding: "4",
          textTransform: "uppercase",
          letterSpacing: "wide",
        },
      },
      {
        id: "5",
        type: "customerInfo",
        label: "Customer Details",
        props: {
          alignment: "left",
          fontSize: "sm",
          fontWeight: "bold",
          backgroundColor: "transparent",
          padding: "4",
          showName: true,
          showPhone: true,
          showEmail: true,
        },
      },
      {
        id: "6",
        type: "paymentInfo",
        label: "Payment Method & Status",
        props: {
          alignment: "left",
          fontSize: "xs",
          backgroundColor: "#f9fafb",
          padding: "4",
          showMethod: true,
          showStatus: true,
          layout: "horizontal",
          borderBottom: true,
        },
      },
      {
        id: "7",
        type: "customText",
        label: "Items Label",
        props: {
          text: "Items",
          alignment: "left",
          fontSize: "xs",
          fontWeight: "semibold",
          backgroundColor: "transparent",
          textColor: "accent",
          padding: "4",
          textTransform: "uppercase",
          letterSpacing: "wide",
        },
      },
      {
        id: "8",
        type: "itemsTable",
        label: "Items List",
        props: {
          showBorders: false,
          fontSize: "xs",
          zebraStripes: false,
          headerBgColor: "transparent",
          showUnitPrice: true,
          compactStyle: true,
        },
      },
      {
        id: "9",
        type: "divider",
        label: "Border",
        props: {
          thickness: "1",
          style: "solid",
          color: "#e5e7eb",
          marginTop: "2",
          marginBottom: "2",
        },
      },
      {
        id: "10",
        type: "totals",
        label: "Totals",
        props: {
          alignment: "left",
          fontSize: "xs",
          fontWeight: "normal",
          backgroundColor: "transparent",
          padding: "4",
          showSubtotal: true,
          showTax: true,
          showDiscount: true,
          grandTotalStyle: "accented",
          grandTotalBorderColor: "accent",
        },
      },
      {
        id: "11",
        type: "customText",
        label: "Footer",
        props: {
          text: "Thank you for your payment!",
          alignment: "center",
          fontSize: "xs",
          fontWeight: "normal",
          backgroundColor: "#f9fafb",
          padding: "4",
          borderTop: true,
        },
      },
    ],
  },
  classic: {
    name: "Classic Elegant Style",
    description:
      "Traditional receipt with Georgia serif font and double borders",
    fontFamily: "Georgia, serif",
    sections: [
      {
        id: "1",
        type: "header",
        label: "Company Name",
        props: {
          alignment: "center",
          fontSize: "xl",
          fontWeight: "bold",
          backgroundColor: "transparent",
          textColor: "accent",
          padding: "3",
          fontFamily: "Georgia, serif",
        },
      },
      {
        id: "2",
        type: "companyInfo",
        label: "Company Address",
        props: {
          alignment: "center",
          fontSize: "xs",
          fontWeight: "normal",
          backgroundColor: "transparent",
          padding: "2",
          showEmail: false,
          showPhone: true,
          showAddress: true,
          fontFamily: "Georgia, serif",
        },
      },
      {
        id: "3",
        type: "divider",
        label: "Colored Border",
        props: {
          thickness: "2",
          style: "solid",
          color: "accent",
          marginTop: "3",
          marginBottom: "4",
        },
      },
      {
        id: "4",
        type: "customText",
        label: "Receipt Title",
        props: {
          text: "RECEIPT",
          alignment: "center",
          fontSize: "xl",
          fontWeight: "bold",
          backgroundColor: "transparent",
          textColor: "#1f2937",
          padding: "2",
        },
      },
      {
        id: "5",
        type: "divider",
        label: "Title Underline",
        props: {
          thickness: "2",
          style: "solid",
          color: "accent",
          marginTop: "2",
          marginBottom: "2",
          width: "64px",
          centered: true,
        },
      },
      {
        id: "6",
        type: "receiptDetails",
        label: "Receipt Number",
        props: {
          alignment: "center",
          fontSize: "sm",
          backgroundColor: "transparent",
          padding: "2",
          showReceiptNumber: true,
          showDate: false,
          showTime: false,
        },
      },
      {
        id: "7",
        type: "receiptDetails",
        label: "Date & Time Row",
        props: {
          alignment: "left",
          fontSize: "xs",
          backgroundColor: "transparent",
          padding: "2",
          showReceiptNumber: false,
          showDate: true,
          showTime: true,
          layout: "horizontal",
          borderBottom: "dashed",
          borderColor: "#9ca3af",
        },
      },
      {
        id: "8",
        type: "itemsTable",
        label: "Items Table",
        props: {
          showBorders: true,
          fontSize: "xs",
          zebraStripes: false,
          headerBgColor: "transparent",
          headerBorderColor: "accent",
          headerBorderWidth: "2",
          headerTextColor: "accent",
          fontFamily: "Georgia, serif",
        },
      },
      {
        id: "9",
        type: "divider",
        label: "Totals Border",
        props: {
          thickness: "2",
          style: "solid",
          color: "accent",
          marginTop: "3",
          marginBottom: "2",
        },
      },
      {
        id: "10",
        type: "totals",
        label: "Totals Section",
        props: {
          alignment: "left",
          fontSize: "sm",
          fontWeight: "normal",
          backgroundColor: "transparent",
          padding: "2",
          showSubtotal: true,
          showTax: true,
          showDiscount: true,
          grandTotalFontSize: "lg",
          grandTotalColor: "accent",
        },
      },
      {
        id: "11",
        type: "paymentInfo",
        label: "Payment Details Box",
        props: {
          alignment: "left",
          fontSize: "xs",
          backgroundColor: "transparent",
          padding: "3",
          borderStyle: "dashed",
          borderColor: "accentLight",
          borderWidth: "2",
          showMethod: true,
          showAmountPaid: true,
          showChange: true,
        },
      },
      {
        id: "12",
        type: "divider",
        label: "Footer Border",
        props: {
          thickness: "2",
          style: "solid",
          color: "accent",
          marginTop: "4",
          marginBottom: "3",
        },
      },
      {
        id: "13",
        type: "customText",
        label: "Thank You",
        props: {
          text: "Thank You For Your Business!",
          alignment: "center",
          fontSize: "sm",
          fontWeight: "semibold",
          backgroundColor: "transparent",
          textColor: "#1f2937",
          padding: "2",
        },
      },
      {
        id: "14",
        type: "customText",
        label: "Appreciation Note",
        props: {
          text: "We appreciate your patronage",
          alignment: "center",
          fontSize: "xs",
          fontWeight: "normal",
          fontStyle: "italic",
          backgroundColor: "transparent",
          textColor: "#6b7280",
          padding: "2",
        },
      },
    ],
  },
  compact: {
    name: "Compact Efficient Style",
    description: "Space-efficient design with Arial font and minimal styling",
    fontFamily: "Arial, sans-serif",
    sections: [
      {
        id: "1",
        type: "header",
        label: "Company Name",
        props: {
          alignment: "center",
          fontSize: "sm",
          fontWeight: "bold",
          backgroundColor: "transparent",
          textColor: "accent",
          padding: "3",
        },
      },
      {
        id: "2",
        type: "companyInfo",
        label: "Company Info",
        props: {
          alignment: "center",
          fontSize: "xs",
          fontWeight: "normal",
          backgroundColor: "transparent",
          padding: "0",
          showEmail: false,
          showPhone: true,
          showAddress: true,
        },
      },
      {
        id: "3",
        type: "divider",
        label: "Top Border",
        props: {
          thickness: "1",
          style: "solid",
          color: "#d1d5db",
          marginTop: "3",
          marginBottom: "2",
        },
      },
      {
        id: "4",
        type: "receiptDetails",
        label: "Receipt & DateTime",
        props: {
          alignment: "left",
          fontSize: "xs",
          fontWeight: "semibold",
          backgroundColor: "transparent",
          padding: "2",
          showReceiptNumber: true,
          showDate: true,
          showTime: true,
          layout: "inline",
          borderBottom: "solid",
          borderColor: "#d1d5db",
        },
      },
      {
        id: "5",
        type: "itemsTable",
        label: "Items Compact",
        props: {
          showBorders: false,
          fontSize: "xs",
          zebraStripes: false,
          compactStyle: true,
          showQuantityInline: true,
        },
      },
      {
        id: "6",
        type: "divider",
        label: "Colored Border",
        props: {
          thickness: "2",
          style: "solid",
          color: "accent",
          marginTop: "2",
          marginBottom: "2",
        },
      },
      {
        id: "7",
        type: "totals",
        label: "Totals",
        props: {
          alignment: "left",
          fontSize: "xs",
          fontWeight: "normal",
          backgroundColor: "transparent",
          padding: "2",
          showSubtotal: true,
          showTax: true,
          showDiscount: true,
          grandTotalColor: "accent",
          grandTotalFontSize: "sm",
          grandTotalBorderColor: "accentLight",
        },
      },
      {
        id: "8",
        type: "paymentInfo",
        label: "Payment Box",
        props: {
          alignment: "left",
          fontSize: "xs",
          backgroundColor: "#f9fafb",
          padding: "2",
          showMethod: true,
          showAmountPaid: true,
          showChange: true,
          compactStyle: true,
        },
      },
      {
        id: "9",
        type: "divider",
        label: "Footer Border",
        props: {
          thickness: "1",
          style: "solid",
          color: "#d1d5db",
          marginTop: "2",
          marginBottom: "2",
        },
      },
      {
        id: "10",
        type: "customText",
        label: "Footer",
        props: {
          text: "Thank You!",
          alignment: "center",
          fontSize: "xs",
          fontWeight: "semibold",
          backgroundColor: "transparent",
          textColor: "#6b7280",
          padding: "2",
        },
      },
    ],
  },
  detailed: {
    name: "Detailed Professional Style",
    description:
      "Full-featured receipt with sections, headers, and detailed info",
    fontFamily: "Arial, sans-serif",
    sections: [
      {
        id: "1",
        type: "header",
        label: "Company Name",
        props: {
          alignment: "left",
          fontSize: "xl",
          fontWeight: "bold",
          backgroundColor: "transparent",
          textColor: "accent",
          padding: "3",
        },
      },
      {
        id: "2",
        type: "customText",
        label: "Company Email",
        props: {
          text: "{companyEmail}",
          alignment: "left",
          fontSize: "xs",
          fontWeight: "normal",
          backgroundColor: "transparent",
          textColor: "#6b7280",
          padding: "1",
          dynamic: true,
        },
      },
      {
        id: "3",
        type: "companyInfo",
        label: "Company Address Box",
        props: {
          alignment: "left",
          fontSize: "xs",
          fontWeight: "normal",
          backgroundColor: "#f9fafb",
          padding: "3",
          showEmail: false,
          showPhone: true,
          showAddress: true,
          borderRadius: "4",
        },
      },
      {
        id: "4",
        type: "divider",
        label: "Section Border",
        props: {
          thickness: "2",
          style: "solid",
          color: "accent",
          marginTop: "4",
          marginBottom: "4",
        },
      },
      {
        id: "5",
        type: "receiptDetails",
        label: "Receipt Title & Number",
        props: {
          alignment: "left",
          fontSize: "lg",
          fontWeight: "bold",
          backgroundColor: "transparent",
          padding: "2",
          showReceiptNumber: true,
          showDate: false,
          showTime: false,
          titleText: "OFFICIAL RECEIPT",
          showTitle: true,
          numberBgColor: "accentLight",
          numberPadding: "4",
          numberBorderRadius: "4",
        },
      },
      {
        id: "6",
        type: "receiptDetails",
        label: "Transaction Date/Time",
        props: {
          alignment: "left",
          fontSize: "xs",
          backgroundColor: "#f9fafb",
          padding: "4",
          showReceiptNumber: false,
          showDate: true,
          showTime: true,
          layout: "grid",
          gridCols: "2",
          showLabels: true,
          labelStyle: "small",
        },
      },
      {
        id: "7",
        type: "customText",
        label: "Items Header",
        props: {
          text: "ITEMS PURCHASED",
          alignment: "left",
          fontSize: "sm",
          fontWeight: "bold",
          backgroundColor: "transparent",
          textColor: "accent",
          padding: "3",
        },
      },
      {
        id: "8",
        type: "divider",
        label: "Items Border",
        props: {
          thickness: "1",
          style: "solid",
          color: "accent",
          marginTop: "0",
          marginBottom: "2",
        },
      },
      {
        id: "9",
        type: "itemsTable",
        label: "Items Table (Full)",
        props: {
          showBorders: true,
          fontSize: "xs",
          zebraStripes: false,
          headerBgColor: "accentLight",
          headerTextColor: "accent",
          showUnitPrice: true,
          showQuantity: true,
          fullWidth: true,
        },
      },
      {
        id: "10",
        type: "totals",
        label: "Totals Box",
        props: {
          alignment: "left",
          fontSize: "sm",
          fontWeight: "semibold",
          backgroundColor: "#f9fafb",
          padding: "4",
          showSubtotal: true,
          showTax: true,
          showDiscount: true,
          taxLabel: "VAT (7.5%)",
          grandTotalFontSize: "xl",
          grandTotalColor: "accent",
          grandTotalBorderColor: "accent",
          grandTotalBorderWidth: "2",
        },
      },
      {
        id: "11",
        type: "customText",
        label: "Payment Header",
        props: {
          text: "PAYMENT DETAILS",
          alignment: "left",
          fontSize: "sm",
          fontWeight: "bold",
          backgroundColor: "accentLight",
          textColor: "accent",
          padding: "2",
        },
      },
      {
        id: "12",
        type: "paymentInfo",
        label: "Payment Info Box",
        props: {
          alignment: "left",
          fontSize: "xs",
          backgroundColor: "accentLight",
          padding: "4",
          showMethod: true,
          showAmountPaid: true,
          showChange: true,
        },
      },
      {
        id: "13",
        type: "divider",
        label: "Footer Border",
        props: {
          thickness: "1",
          style: "solid",
          color: "#d1d5db",
          marginTop: "4",
          marginBottom: "3",
        },
      },
      {
        id: "14",
        type: "customText",
        label: "Thank You",
        props: {
          text: "Thank You For Your Business!",
          alignment: "center",
          fontSize: "sm",
          fontWeight: "bold",
          backgroundColor: "transparent",
          textColor: "#1f2937",
          padding: "2",
        },
      },
      {
        id: "15",
        type: "customText",
        label: "Official Notice",
        props: {
          text: "This is an official receipt and serves as proof of payment",
          alignment: "center",
          fontSize: "xs",
          fontWeight: "normal",
          backgroundColor: "transparent",
          textColor: "#6b7280",
          padding: "1",
        },
      },
      {
        id: "16",
        type: "customText",
        label: "Retain Notice",
        props: {
          text: "Please retain this receipt for your records",
          alignment: "center",
          fontSize: "xs",
          fontWeight: "normal",
          backgroundColor: "transparent",
          textColor: "#6b7280",
          padding: "1",
        },
      },
    ],
  },
};

// Draggable Section Component with Click-to-Edit
const DraggableSection = ({
  id,
  section,
  onDelete,
  onEdit,
  onSelect,
  isSelected,
  children,
}) => {
  // eslint-disable-next-line no-unused-vars
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
      onClick={() => onSelect(section)}
      className={`${
        isSelected ? "ring-2 ring-[#667eea] bg-blue-50" : "bg-gray-50"
      } border ${
        isSelected ? "border-[#667eea]" : "border-gray-200"
      } rounded-lg p-3 mb-3 cursor-pointer transition-all hover:shadow-md`}
    >
      <div className="flex items-center gap-2 mb-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-gray-500 hover:text-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={20} />
        </button>
        <span className="font-semibold text-gray-900 flex-1">
          {section.label}
        </span>
        {isSelected && (
          <span className="text-xs bg-[#667eea] text-white px-2 py-1 rounded">
            Selected
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(section);
          }}
          className="p-1 text-gray-500 hover:text-gray-700"
        >
          <Settings size={16} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          className="p-1 text-red-500 hover:text-red-600"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="bg-white p-3 rounded border border-gray-200">
        {children}
      </div>
    </div>
  );
};

const EnhancedReceiptBuilder = ({
  onClose,
  onSave,
  existingTemplate = null,
}) => {
  const { theme } = useTheme();
  const [templateName, setTemplateName] = useState(
    existingTemplate?.name || ""
  );
  const [sections, setSections] = useState(existingTemplate?.sections || []);
  const [selectedSection, setSelectedSection] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [customColor, setCustomColor] = useState(
    existingTemplate?.color || "#667eea"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showPresetSelector, setShowPresetSelector] = useState(false);
  const [deletedSections, setDeletedSections] = useState([]);
  const [showPresetConfirm, setShowPresetConfirm] = useState(false);
  const [pendingPreset, setPendingPreset] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const hasChanges = () => {
    if (existingTemplate) return true;
    return templateName.trim() || sections.length > 0;
  };

  const handleClose = () => {
    if (hasChanges()) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  // Initialize with modern template by default if empty
  useEffect(() => {
    if (sections.length === 0 && !existingTemplate) {
      setSections(templatePresets.modern.sections);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPreset = (presetKey) => {
    if (hasChanges() && sections.length > 0) {
      setPendingPreset(presetKey);
      setShowPresetConfirm(true);
      setShowPresetSelector(false);
    } else {
      applyPreset(presetKey);
    }
  };

  const applyPreset = (presetKey) => {
    const preset = templatePresets[presetKey];
    if (preset) {
      setSections(preset.sections);
      setDeletedSections([]);
      setShowPresetSelector(false);
      setSelectedSection(null);
      setShowPresetConfirm(false);
      setPendingPreset(null);
    }
  };

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

  const deleteSection = (id) => {
    const sectionToDelete = sections.find((s) => s.id === id);
    if (sectionToDelete) {
      setDeletedSections([...deletedSections, sectionToDelete]);
    }
    setSections(sections.filter((s) => s.id !== id));
    if (selectedSection?.id === id) {
      setSelectedSection(null);
    }
  };

  const restoreSection = (section) => {
    const newSection = {
      ...section,
      id: Date.now().toString(), // New ID to avoid conflicts
    };
    setSections([...sections, newSection]);
    setDeletedSections(deletedSections.filter((s) => s.id !== section.id));
  };

  const updateSection = (id, newProps) => {
    setSections(
      sections.map((s) =>
        s.id === id ? { ...s, props: { ...s.props, ...newProps } } : s
      )
    );
    setEditingSection(null);
    // Update selectedSection if it's the one being edited
    if (selectedSection?.id === id) {
      setSelectedSection({
        ...selectedSection,
        props: { ...selectedSection.props, ...newProps },
      });
    }
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
          setIsSaving(false);
          onSave(templateData);
        }, 1500);
      } else {
        alert(data.error || "Failed to save template");
        setIsSaving(false);
      }
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Failed to save template");
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
      companyEmail: "info@yourcompany.com",
      receiptNumber: "RCP-001",
      date: "Dec 8, 2025",
      time: "14:30",
      items: [
        { name: "Product 1", quantity: 2, price: 5000, total: 10000 },
        { name: "Product 2", quantity: 1, price: 15000, total: 15000 },
      ],
      subtotal: 25000,
      tax: 1875,
      discount: 1000,
      total: 25875,
      paymentMethod: "Cash",
      amountPaid: 30000,
      change: 4125,
    };

    const props = section.props || {};
    const alignment = props.alignment || "left";
    const fontSize = props.fontSize || "sm";
    const fontWeight = props.fontWeight || "normal";
    const bgColor = props.backgroundColor || "transparent";
    const padding = props.padding || "4";

    const alignmentClass = {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    }[alignment];

    const fontSizeClass = {
      xs: "text-xs",
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
      "4xl": "text-4xl",
    }[fontSize];

    const fontWeightClass = {
      light: "font-light",
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    }[fontWeight];

    const paddingClass = `p-${padding}`;

    switch (section.type) {
      case "header": {
        // Resolve textColor - handle "accent" keyword
        const resolvedTextColor =
          props.textColor === "accent"
            ? customColor
            : props.textColor || undefined;

        return (
          <div
            className={`${alignmentClass} ${fontSizeClass} ${fontWeightClass} ${paddingClass}`}
            style={{ backgroundColor: bgColor, color: resolvedTextColor }}
          >
            {props.showLogo && (
              <div className="mb-2">
                <ImageIcon
                  className={`inline-block ${
                    props.logoSize === "sm"
                      ? "w-12 h-12"
                      : props.logoSize === "md"
                      ? "w-16 h-16"
                      : props.logoSize === "lg"
                      ? "w-20 h-20"
                      : "w-24 h-24"
                  }`}
                  style={{ color: customColor }}
                />
              </div>
            )}
            <h1
              style={{ color: resolvedTextColor || customColor }}
              className="text-gray-900"
            >
              RECEIPT
            </h1>
          </div>
        );
      }

      case "companyInfo": {
        // Resolve textColor - handle "accent" keyword
        const resolvedCompanyTextColor =
          props.textColor === "accent"
            ? customColor
            : props.textColor || undefined;

        return (
          <div
            className={`${alignmentClass} ${fontSizeClass} ${fontWeightClass} ${paddingClass}`}
            style={{
              backgroundColor: bgColor,
              color: resolvedCompanyTextColor,
            }}
          >
            {props.showName !== false && (
              <p
                className="font-bold"
                style={{ color: resolvedCompanyTextColor || "#111827" }}
              >
                {sampleData.companyName}
              </p>
            )}
            {props.showAddress && (
              <p style={{ color: resolvedCompanyTextColor || "#374151" }}>
                {sampleData.companyAddress}
              </p>
            )}
            {props.showPhone && (
              <p style={{ color: resolvedCompanyTextColor || "#374151" }}>
                {sampleData.companyPhone}
              </p>
            )}
            {props.showEmail && (
              <p style={{ color: resolvedCompanyTextColor || "#374151" }}>
                {sampleData.companyEmail}
              </p>
            )}
          </div>
        );
      }

      case "receiptDetails": {
        // Resolve textColor - handle "accent" keyword
        const resolvedReceiptTextColor =
          props.textColor === "accent"
            ? customColor
            : props.textColor || undefined;

        return (
          <div
            className={`${alignmentClass} ${fontSizeClass} ${fontWeightClass} ${paddingClass}`}
            style={{
              backgroundColor: bgColor,
              color: resolvedReceiptTextColor,
            }}
          >
            {props.showReceiptNumber && (
              <p style={{ color: resolvedReceiptTextColor || "#1f2937" }}>
                <span className="font-semibold">Receipt #:</span>{" "}
                {sampleData.receiptNumber}
              </p>
            )}
            {props.showDate && (
              <p style={{ color: resolvedReceiptTextColor || "#1f2937" }}>
                <span className="font-semibold">Date:</span> {sampleData.date}
              </p>
            )}
            {props.showTime && (
              <p style={{ color: resolvedReceiptTextColor || "#1f2937" }}>
                <span className="font-semibold">Time:</span> {sampleData.time}
              </p>
            )}
          </div>
        );
      }

      case "invoiceDetails":
        // Keep for backwards compatibility but redirect to receiptDetails
        return null;

      case "customerInfo":
        // Render customer details preview
        return (
          <div
            className={`${alignmentClass} ${fontSizeClass} ${fontWeightClass} ${paddingClass}`}
            style={{
              backgroundColor: bgColor,
              color: props.textColor === "accent" ? customColor : undefined,
            }}
          >
            {props.showName !== false && (
              <p
                className={`font-medium ${
                  props.textColor === "accent" ? "" : "text-gray-900"
                }`}
              >
                John Doe
              </p>
            )}
            {props.showPhone !== false && (
              <p className="text-gray-600 text-xs">+234 123 456 7890</p>
            )}
            {props.showEmail !== false && (
              <p className="text-gray-600 text-xs">john@example.com</p>
            )}
          </div>
        );

      case "itemsTable": {
        // Resolve header colors - handle "transparent" and "accent" keywords
        const resolvedHeaderBgColor =
          props.headerBgColor === "transparent"
            ? "transparent"
            : props.headerBgColor === "accent"
            ? customColor
            : props.headerBgColor || customColor;
        const resolvedHeaderTextColor =
          props.headerTextColor === "accent"
            ? customColor
            : props.headerBgColor === "transparent"
            ? "#000000"
            : props.headerTextColor || "#ffffff";

        return (
          <div className={`${paddingClass} overflow-x-auto`}>
            <table
              className={`w-full ${fontSizeClass} ${
                props.showBorders ? "border border-gray-300" : ""
              }`}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: resolvedHeaderBgColor,
                    color: resolvedHeaderTextColor,
                  }}
                >
                  <th className="p-2 text-left">Item</th>
                  <th className="p-2 text-right">Qty</th>
                  <th className="p-2 text-right">Price</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {sampleData.items.map((item, idx) => (
                  <tr
                    key={idx}
                    className={`text-gray-900 ${
                      props.zebraStripes && idx % 2 === 1 ? "bg-gray-50" : ""
                    }`}
                  >
                    <td
                      className={`p-2 ${
                        props.showBorders ? "border border-gray-300" : ""
                      }`}
                    >
                      {item.name}
                    </td>
                    <td
                      className={`p-2 text-right ${
                        props.showBorders ? "border" : ""
                      }`}
                    >
                      {item.quantity}
                    </td>
                    <td
                      className={`p-2 text-right ${
                        props.showBorders ? "border" : ""
                      }`}
                    >
                      {formatCurrency(item.price)}
                    </td>
                    <td
                      className={`p-2 text-right ${
                        props.showBorders ? "border" : ""
                      }`}
                    >
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case "totals": {
        // Resolve grandTotalColor and grandTotalBorderColor
        const resolvedGrandTotalColor =
          props.grandTotalColor === "accent"
            ? customColor
            : props.grandTotalColor || customColor;
        const resolvedGrandTotalBorderColor =
          props.grandTotalBorderColor === "accent"
            ? customColor
            : props.grandTotalBorderColor || "#d1d5db";

        return (
          <div
            className={`${alignmentClass} ${fontSizeClass} ${fontWeightClass} ${paddingClass}`}
            style={{ backgroundColor: bgColor }}
          >
            {props.showSubtotal && (
              <div className="flex justify-between mb-1 text-gray-800">
                <span>Subtotal:</span>
                <span>{formatCurrency(sampleData.subtotal)}</span>
              </div>
            )}
            {props.showTax && (
              <div className="flex justify-between mb-1 text-gray-800">
                <span>Tax (7.5%):</span>
                <span>{formatCurrency(sampleData.tax)}</span>
              </div>
            )}
            {props.showDiscount && (
              <div className="flex justify-between mb-1 text-gray-800">
                <span>Discount:</span>
                <span>-{formatCurrency(sampleData.discount)}</span>
              </div>
            )}
            <div
              className="flex justify-between pt-2 font-bold text-gray-900"
              style={{
                fontSize: "larger",
                borderTop: `1px solid ${resolvedGrandTotalBorderColor}`,
              }}
            >
              <span>TOTAL:</span>
              <span style={{ color: resolvedGrandTotalColor }}>
                {formatCurrency(sampleData.total)}
              </span>
            </div>
            {sampleData.change > 0 && (
              <div className="flex justify-between mt-2 pt-2 border-t border-gray-300">
                <span>Change:</span>
                <span>{formatCurrency(sampleData.change)}</span>
              </div>
            )}
          </div>
        );
      }

      case "paymentInfo": {
        // Resolve textColor - handle "accent" keyword
        const resolvedPaymentTextColor =
          props.textColor === "accent"
            ? customColor
            : props.textColor || undefined;

        return (
          <div
            className={`${alignmentClass} ${fontSizeClass} ${fontWeightClass} ${paddingClass}`}
            style={{
              backgroundColor: bgColor,
              color: resolvedPaymentTextColor,
            }}
          >
            <p
              className="font-semibold mb-1"
              style={{ color: resolvedPaymentTextColor || "#111827" }}
            >
              Payment Information:
            </p>
            <p style={{ color: resolvedPaymentTextColor || "#1f2937" }}>
              <span
                className="font-medium"
                style={{ color: resolvedPaymentTextColor || "#111827" }}
              >
                Payment Method:
              </span>{" "}
              {sampleData.paymentMethod}
            </p>
            <p style={{ color: resolvedPaymentTextColor || "#1f2937" }}>
              <span
                className="font-medium"
                style={{ color: resolvedPaymentTextColor || "#111827" }}
              >
                Amount Paid:
              </span>{" "}
              {formatCurrency(sampleData.amountPaid)}
            </p>
            {sampleData.change > 0 && (
              <p style={{ color: resolvedPaymentTextColor || "#1f2937" }}>
                <span
                  className="font-medium"
                  style={{ color: resolvedPaymentTextColor || "#111827" }}
                >
                  Change:
                </span>{" "}
                {formatCurrency(sampleData.change)}
              </p>
            )}
          </div>
        );
      }

      case "customText": {
        // Resolve textColor - handle "accent" keyword
        const resolvedCustomTextColor =
          props.textColor === "accent"
            ? customColor
            : props.textColor || undefined;
        // Handle backgroundColor: "accent" with white text
        const customTextBgIsAccent = props.backgroundColor === "accent";

        return (
          <div
            className={`${alignmentClass} ${fontSizeClass} ${fontWeightClass} ${paddingClass}`}
            style={{
              backgroundColor: customTextBgIsAccent ? customColor : bgColor,
              color: customTextBgIsAccent ? "#ffffff" : resolvedCustomTextColor,
            }}
          >
            {props.text || "Custom text here"}
          </div>
        );
      }

      case "divider": {
        // Resolve "accent" and "accentLight" color keywords
        const resolvedDividerColor =
          props.color === "accent"
            ? customColor
            : props.color === "accentLight"
            ? `${customColor}30`
            : props.color || "#e5e7eb";

        return (
          <div
            className={`my-${props.marginTop || 4}`}
            style={{ marginBottom: `${props.marginBottom || 4}px` }}
          >
            <hr
              style={{
                borderTop: `${props.thickness || 1}px ${
                  props.style || "solid"
                } ${resolvedDividerColor}`,
              }}
            />
          </div>
        );
      }

      default:
        return <p className="text-gray-500">Unknown section type</p>;
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
              Enhanced Receipt Builder
            </h2>
            <p className="text-white/80 text-sm mt-1">
              Click any section to customize it individually
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white/10 p-2 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto lg:overflow-hidden p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:h-full">
            {/* Left Sidebar - Controls */}
            <div className="order-1 lg:order-1 lg:overflow-y-auto lg:max-h-[calc(95vh-180px)] pb-8">
              <div className={`${theme.bgAccent} rounded-lg p-4`}>
                <h3 className={`font-semibold ${theme.textPrimary} mb-4`}>
                  Template Settings
                </h3>

                {/* Template Name */}
                <div className="mb-4">
                  <label
                    className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
                  >
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="My Custom Invoice"
                    className={`w-full px-3 py-2 rounded-lg border ${theme.borderSecondary} ${theme.bgInput} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-[#667eea]`}
                  />
                </div>

                {/* Theme Color */}
                <div className="mb-4">
                  <label
                    className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
                  >
                    Theme Color
                  </label>
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className={`w-full h-10 rounded-lg border ${theme.borderSecondary} cursor-pointer`}
                  />
                </div>

                {/* Load Template Button */}
                <button
                  onClick={() => setShowPresetSelector(true)}
                  className="w-full mb-4 px-3 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg text-sm hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  <Layout size={16} />
                  Load Template Preset
                </button>

                {/* Selected Section Info */}
                {selectedSection && (
                  <div
                    className={`mb-4 p-3 rounded-lg border-2 border-[#667eea] ${theme.bgCard}`}
                  >
                    <p className="text-sm font-semibold text-[#667eea] mb-1">
                      Selected Section:
                    </p>
                    <p className={`text-sm ${theme.textPrimary} mb-2`}>
                      {selectedSection.label}
                    </p>
                    <button
                      onClick={() => setEditingSection(selectedSection)}
                      className="text-xs px-3 py-1.5 bg-[#667eea] text-white rounded hover:opacity-90 transition w-full"
                    >
                      Edit Properties
                    </button>
                  </div>
                )}

                {/* Deleted Sections - Add Back */}
                {deletedSections.length > 0 && (
                  <div
                    className={`mb-4 p-3 rounded-lg border ${theme.borderSecondary} ${theme.bgCard}`}
                  >
                    <p
                      className={`text-sm font-semibold ${theme.textPrimary} mb-2`}
                    >
                      Deleted Elements
                    </p>
                    <p className={`text-xs ${theme.textSecondary} mb-2`}>
                      Click to add back:
                    </p>
                    <div className="space-y-1">
                      {deletedSections.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => restoreSection(section)}
                          className={`w-full text-left px-2 py-1.5 rounded text-xs ${theme.bgAccent} ${theme.textPrimary} hover:bg-green-100 dark:hover:bg-green-900/20 transition flex items-center justify-between`}
                        >
                          <span>{section.label}</span>
                          <Plus size={14} className="text-green-600" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className={`text-sm ${theme.textSecondary} space-y-1`}>
                  <p>
                    💡 <strong>Click</strong> a section to select it
                  </p>
                  <p>
                    🎯 <strong>Drag</strong> to reorder sections
                  </p>
                  <p>
                    ⚙️ <strong>Settings</strong> icon to edit properties
                  </p>
                  <p>
                    🗑️ <strong>Delete</strong> icon to remove section
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side - Preview */}
            <div className="lg:col-span-3 order-2 lg:order-2 lg:overflow-y-auto lg:max-h-[calc(95vh-180px)] pb-8">
              <div className={`${theme.bgAccent} rounded-lg p-4 mb-4`}>
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className={`font-semibold ${theme.textPrimary} flex items-center gap-2`}
                  >
                    <Eye size={18} />
                    Live Preview
                  </h3>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-lg max-w-[302px] mx-auto">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={sections.map((s) => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {sections.map((section) => (
                        <DraggableSection
                          key={section.id}
                          id={section.id}
                          section={section}
                          onDelete={deleteSection}
                          onEdit={setEditingSection}
                          onSelect={setSelectedSection}
                          isSelected={selectedSection?.id === section.id}
                        >
                          {renderSectionContent(section)}
                        </DraggableSection>
                      ))}
                    </SortableContext>
                  </DndContext>

                  {sections.length === 0 && (
                    <div className={`text-center py-12 ${theme.textSecondary}`}>
                      <FileText size={48} className="mx-auto mb-4 opacity-50" />
                      <p>Load a template preset to get started</p>
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
            onClick={handleClose}
            className={`px-6 py-3 rounded-lg border ${theme.borderSecondary} ${theme.textSecondary} hover:bg-gray-100 dark:hover:bg-gray-800 transition font-medium`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !templateName.trim()}
            className="px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg hover:opacity-90 transition font-medium disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={18} />
            {isSaving ? "Saving..." : "Save Template"}
          </button>
        </div>
      </div>

      {/* Template Preset Selector Modal */}
      {showPresetSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div
            className={`${theme.bgCard} rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto`}
          >
            <h3 className={`text-2xl font-bold ${theme.textPrimary} mb-4`}>
              Choose a Starting Template
            </h3>
            <p className={`${theme.textSecondary} mb-6`}>
              Select a preset template style to customize. Each template matches
              our built-in receipt designs. You can modify all elements after
              loading.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {Object.entries(templatePresets).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => loadPreset(key)}
                  className={`p-4 border-2 ${theme.borderSecondary} rounded-lg hover:border-[#667eea] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-left group`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4
                      className={`font-bold text-lg ${theme.textPrimary} capitalize group-hover:text-[#667eea]`}
                    >
                      {preset.name}
                    </h4>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                      {preset.sections.length} sections
                    </span>
                  </div>
                  {preset.description && (
                    <p className={`text-sm ${theme.textSecondary} mb-3`}>
                      {preset.description}
                    </p>
                  )}
                  {preset.fontFamily && (
                    <p className={`text-xs ${theme.textSecondary} italic`}>
                      Font: {preset.fontFamily}
                    </p>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowPresetSelector(false)}
              className={`w-full px-4 py-2 border ${theme.borderSecondary} rounded-lg ${theme.textPrimary} hover:bg-gray-100 dark:hover:bg-gray-800 transition`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Section Edit Modal - Reusing existing editor logic would go here */}
      {editingSection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 overflow-y-auto">
          <div
            className={`${theme.bgCard} rounded-lg p-6 max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto`}
          >
            <h3 className={`font-bold ${theme.textPrimary} mb-4 text-lg`}>
              Edit {editingSection.label}
            </h3>

            {/* Common Properties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Alignment */}
              <div>
                <label
                  className={`block text-sm font-medium ${theme.textPrimary} mb-1`}
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

              {/* Font Size */}
              {editingSection.type !== "divider" && (
                <div>
                  <label
                    className={`block text-sm font-medium ${theme.textPrimary} mb-1`}
                  >
                    Font Size
                  </label>
                  <select
                    value={editingSection.props?.fontSize || "sm"}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        props: {
                          ...editingSection.props,
                          fontSize: e.target.value,
                        },
                      })
                    }
                    className={`w-full px-3 py-2 rounded border ${theme.borderSecondary} ${theme.bgInput} ${theme.textPrimary}`}
                  >
                    <option value="xs">Extra Small</option>
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                    <option value="xl">Extra Large</option>
                    <option value="2xl">2X Large</option>
                    <option value="3xl">3X Large</option>
                    <option value="4xl">4X Large</option>
                  </select>
                </div>
              )}

              {/* Font Weight */}
              {editingSection.type !== "divider" && (
                <div>
                  <label
                    className={`block text-sm font-medium ${theme.textPrimary} mb-1`}
                  >
                    Font Weight
                  </label>
                  <select
                    value={editingSection.props?.fontWeight || "normal"}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        props: {
                          ...editingSection.props,
                          fontWeight: e.target.value,
                        },
                      })
                    }
                    className={`w-full px-3 py-2 rounded border ${theme.borderSecondary} ${theme.bgInput} ${theme.textPrimary}`}
                  >
                    <option value="light">Light</option>
                    <option value="normal">Normal</option>
                    <option value="medium">Medium</option>
                    <option value="semibold">Semibold</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>
              )}

              {/* Background Color */}
              {editingSection.type !== "divider" && (
                <div>
                  <label
                    className={`block text-sm font-medium ${theme.textPrimary} mb-1`}
                  >
                    Background Color
                  </label>
                  <input
                    type="color"
                    value={editingSection.props?.backgroundColor || "#ffffff"}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        props: {
                          ...editingSection.props,
                          backgroundColor: e.target.value,
                        },
                      })
                    }
                    className="w-full h-10 rounded border ${theme.borderSecondary} cursor-pointer"
                  />
                </div>
              )}

              {/* Padding */}
              {editingSection.type !== "divider" && (
                <div>
                  <label
                    className={`block text-sm font-medium ${theme.textPrimary} mb-1`}
                  >
                    Padding
                  </label>
                  <select
                    value={editingSection.props?.padding || "4"}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        props: {
                          ...editingSection.props,
                          padding: e.target.value,
                        },
                      })
                    }
                    className={`w-full px-3 py-2 rounded border ${theme.borderSecondary} ${theme.bgInput} ${theme.textPrimary}`}
                  >
                    <option value="1">Extra Small</option>
                    <option value="2">Small</option>
                    <option value="3">Small-Medium</option>
                    <option value="4">Medium</option>
                    <option value="5">Medium-Large</option>
                    <option value="6">Large</option>
                    <option value="8">Extra Large</option>
                  </select>
                </div>
              )}
            </div>

            {/* Type-specific properties */}
            {editingSection.type === "header" && (
              <div className="space-y-3 mb-4">
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
                    className="w-4 h-4"
                  />
                  <span className={`text-sm ${theme.textPrimary}`}>
                    Show Logo
                  </span>
                </label>
                {editingSection.props?.showLogo && (
                  <div>
                    <label
                      className={`block text-sm font-medium ${theme.textPrimary} mb-1`}
                    >
                      Logo Size
                    </label>
                    <select
                      value={editingSection.props?.logoSize || "md"}
                      onChange={(e) =>
                        setEditingSection({
                          ...editingSection,
                          props: {
                            ...editingSection.props,
                            logoSize: e.target.value,
                          },
                        })
                      }
                      className={`w-full px-3 py-2 rounded border ${theme.borderSecondary} ${theme.bgInput} ${theme.textPrimary}`}
                    >
                      <option value="sm">Small</option>
                      <option value="md">Medium</option>
                      <option value="lg">Large</option>
                      <option value="xl">Extra Large</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {editingSection.type === "customText" && (
              <div className="mb-4">
                <label
                  className={`block text-sm font-medium ${theme.textPrimary} mb-1`}
                >
                  Custom Text
                </label>
                <textarea
                  value={editingSection.props?.text || ""}
                  onChange={(e) =>
                    setEditingSection({
                      ...editingSection,
                      props: { ...editingSection.props, text: e.target.value },
                    })
                  }
                  rows={3}
                  className={`w-full px-3 py-2 rounded border ${theme.borderSecondary} ${theme.bgInput} ${theme.textPrimary}`}
                />
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingSection(null)}
                className={`px-4 py-2 border ${theme.borderSecondary} rounded ${theme.textPrimary} hover:bg-gray-100 dark:hover:bg-gray-800 transition`}
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  updateSection(editingSection.id, editingSection.props)
                }
                className="px-4 py-2 bg-[#667eea] text-white rounded hover:opacity-90 transition"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div
            className={`${theme.bgCard} rounded-lg p-8 text-center max-w-md`}
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

      {/* Load Preset Confirmation Modal */}
      {showPresetConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div
            className={`${theme.bgCard} rounded-xl shadow-2xl p-6 max-w-md mx-4`}
          >
            <h3 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>
              Load New Template?
            </h3>
            <p className={`${theme.textSecondary} mb-6`}>
              Loading a new template will replace your current work. All unsaved
              changes will be lost. Do you want to continue?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowPresetConfirm(false);
                  setPendingPreset(null);
                }}
                className={`px-4 py-2 rounded-lg border ${theme.borderSecondary} ${theme.textSecondary} hover:bg-gray-100 dark:hover:bg-gray-800 transition`}
              >
                Cancel
              </button>
              <button
                onClick={() => applyPreset(pendingPreset)}
                className="px-4 py-2 rounded-lg bg-[#667eea] text-white hover:opacity-90 transition"
              >
                Load Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discard Confirmation Modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div
            className={`${theme.bgCard} rounded-xl shadow-2xl p-6 max-w-md mx-4`}
          >
            <h3 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>
              Discard Changes?
            </h3>
            <p className={`${theme.textSecondary} mb-6`}>
              Are you sure you want to discard this template? All unsaved
              changes will be lost.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className={`px-4 py-2 rounded-lg border ${theme.borderSecondary} ${theme.textSecondary} hover:bg-gray-100 dark:hover:bg-gray-800 transition`}
              >
                Keep Editing
              </button>
              <button
                onClick={() => {
                  setShowDiscardConfirm(false);
                  onClose();
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedReceiptBuilder;
