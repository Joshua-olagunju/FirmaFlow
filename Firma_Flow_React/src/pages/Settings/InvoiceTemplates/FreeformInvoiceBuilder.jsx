import { useState, useRef } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  X,
  Save,
  Type,
  Image as ImageIcon,
  Table,
  DollarSign,
  CreditCard,
  User,
  Building,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
} from "lucide-react";
import { buildApiUrl } from "../../../config/api.config";
import Draggable from "react-draggable";

const FreeformInvoiceBuilder = ({ onClose, onSave }) => {
  const { theme } = useTheme();
  const [templateName, setTemplateName] = useState("");
  const [customColor, setCustomColor] = useState("#667eea");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const elementTypes = [
    { type: "header", label: "Header", icon: Type, defaultText: "INVOICE" },
    { type: "companyInfo", label: "Company Info", icon: Building },
    { type: "customerInfo", label: "Customer Info", icon: User },
    { type: "invoiceDetails", label: "Invoice #, Date", icon: Type },
    { type: "itemsTable", label: "Items Table", icon: Table },
    { type: "totals", label: "Totals", icon: DollarSign },
    { type: "paymentInfo", label: "Payment Info", icon: CreditCard },
    { type: "logo", label: "Logo", icon: ImageIcon },
    { type: "text", label: "Custom Text", icon: Type },
  ];

  // Initialize with all elements pre-populated
  const [elements, setElements] = useState(() => {
    const initialElements = [
      {
        type: "header",
        position: { x: 250, y: 20 },
        size: { width: 300, height: 60 },
        fontSize: 24,
        alignment: "left",
        bold: true,
      },
      {
        type: "logo",
        position: { x: 20, y: 20 },
        size: { width: 120, height: 80 },
        fontSize: 14,
        alignment: "left",
      },
      {
        type: "companyInfo",
        position: { x: 20, y: 120 },
        size: { width: 250, height: 120 },
        fontSize: 12,
        alignment: "left",
      },
      {
        type: "customerInfo",
        position: { x: 400, y: 120 },
        size: { width: 250, height: 100 },
        fontSize: 12,
        alignment: "left",
      },
      {
        type: "invoiceDetails",
        position: { x: 400, y: 240 },
        size: { width: 250, height: 80 },
        fontSize: 12,
        alignment: "left",
      },
      {
        type: "itemsTable",
        position: { x: 20, y: 340 },
        size: { width: 630, height: 200 },
        fontSize: 12,
        alignment: "left",
      },
      {
        type: "totals",
        position: { x: 430, y: 560 },
        size: { width: 220, height: 100 },
        fontSize: 12,
        alignment: "right",
      },
      {
        type: "paymentInfo",
        position: { x: 20, y: 660 },
        size: { width: 300, height: 100 },
        fontSize: 11,
        alignment: "left",
      },
    ];
    return initialElements.map((el, index) => ({
      ...el,
      id: `element-${Date.now()}-${index}`,
      text: el.type === "text" ? "Custom Text" : "",
    }));
  });

  const [selectedElement, setSelectedElement] = useState(null);
  const nodeRefs = useRef({});

  const addElement = (type) => {
    const newElement = {
      id: Date.now().toString(),
      type,
      position: { x: 50, y: 50 },
      size:
        type === "itemsTable"
          ? { width: 500, height: 200 }
          : { width: 250, height: 100 },
      fontSize: type === "header" ? 24 : 14,
      alignment: "left",
      text: type === "text" ? "Custom Text" : "",
      bold: type === "header",
    };
    setElements([...elements, newElement]);
  };

  const deleteElement = (id) => {
    setElements(elements.filter((el) => el.id !== id));
    if (selectedElement?.id === id) setSelectedElement(null);
  };

  const updateElement = (id, updates) => {
    setElements(
      elements.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
    if (selectedElement?.id === id) {
      setSelectedElement({ ...selectedElement, ...updates });
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
      elements,
      color: customColor,
      type: "custom-freeform",
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

  const renderElement = (element) => {
    const style = {
      fontSize: `${element.fontSize}px`,
      textAlign: element.alignment,
      fontWeight: element.bold ? "bold" : "normal",
    };

    switch (element.type) {
      case "header":
        return (
          <div style={style}>
            <h1 style={{ color: customColor, margin: 0 }}>INVOICE</h1>
          </div>
        );
      case "companyInfo":
        return (
          <div style={style} className="text-sm">
            <p className="font-bold">Your Company Name</p>
            <p>123 Business Street</p>
            <p>City, State 12345</p>
            <p>Phone: (123) 456-7890</p>
          </div>
        );
      case "customerInfo":
        return (
          <div style={style} className="text-sm">
            <p className="font-semibold" style={{ color: customColor }}>
              BILL TO:
            </p>
            <p className="font-bold">Customer Name</p>
            <p>Customer Address</p>
          </div>
        );
      case "invoiceDetails":
        return (
          <div style={style} className="text-sm space-y-1">
            <p>
              <span className="font-semibold">Invoice #:</span> INV-001
            </p>
            <p>
              <span className="font-semibold">Date:</span>{" "}
              {new Date().toLocaleDateString()}
            </p>
            <p>
              <span className="font-semibold">Due Date:</span>{" "}
              {new Date().toLocaleDateString()}
            </p>
          </div>
        );
      case "itemsTable":
        return (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ backgroundColor: `${customColor}15` }}>
                <th className="border p-2 text-left">Description</th>
                <th className="border p-2 text-center">Qty</th>
                <th className="border p-2 text-right">Rate</th>
                <th className="border p-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">Sample Item</td>
                <td className="border p-2 text-center">1</td>
                <td className="border p-2 text-right">₦100,000</td>
                <td className="border p-2 text-right">₦100,000</td>
              </tr>
            </tbody>
          </table>
        );
      case "totals":
        return (
          <div style={style} className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₦100,000</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (7.5%):</span>
              <span>₦7,500</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-1">
              <span style={{ color: customColor }}>TOTAL:</span>
              <span style={{ color: customColor }}>₦107,500</span>
            </div>
          </div>
        );
      case "paymentInfo":
        return (
          <div style={style} className="text-xs">
            <p className="font-semibold mb-1" style={{ color: customColor }}>
              Payment Information
            </p>
            <p>
              <span className="font-semibold">Bank:</span> First Bank
            </p>
            <p>
              <span className="font-semibold">Account:</span> 1234567890
            </p>
            <p>
              <span className="font-semibold">Name:</span> Your Company Ltd
            </p>
          </div>
        );
      case "logo":
        return (
          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
            <ImageIcon size={32} className="text-gray-400" />
          </div>
        );
      case "text":
        return <div style={style}>{element.text || "Custom Text"}</div>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${theme.bgCard} rounded-xl ${theme.shadow} w-full max-w-[95vw] h-[95vh] flex flex-col`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#f59e0b] to-[#d97706] p-6 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Freeform Invoice Builder
            </h2>
            <p className="text-white/80 text-sm mt-1">
              Drag and position elements anywhere on the canvas
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Toolbar */}
          <div
            className={`w-64 ${theme.bgAccent} border-r ${theme.borderSecondary} p-4 overflow-y-auto`}
          >
            <div className="mb-4">
              <label
                className={`block text-sm font-semibold ${theme.textPrimary} mb-2`}
              >
                Template Name
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="My Custom Invoice"
                className={`w-full px-3 py-2 rounded-lg border ${theme.borderSecondary} ${theme.bgInput} ${theme.textPrimary}`}
              />
            </div>

            <div className="mb-4">
              <label
                className={`block text-sm font-semibold ${theme.textPrimary} mb-2`}
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

            <div className="mb-4">
              <label
                className={`block text-sm font-semibold ${theme.textPrimary} mb-2`}
              >
                Add Elements
              </label>
              <div className="space-y-2">
                {elementTypes.map((type) => (
                  <button
                    key={type.type}
                    onClick={() => addElement(type.type)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${theme.bgHover} border ${theme.borderSecondary} hover:border-[#f59e0b] transition`}
                  >
                    <type.icon size={16} className={theme.textPrimary} />
                    <span className={`text-sm ${theme.textPrimary}`}>
                      {type.label}
                    </span>
                    <Plus
                      size={14}
                      className={`ml-auto ${theme.textSecondary}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {selectedElement && (
              <div
                className={`mt-4 p-3 rounded-lg border ${theme.borderSecondary}`}
              >
                <h3
                  className={`text-sm font-semibold ${theme.textPrimary} mb-3`}
                >
                  Element Settings
                </h3>

                <div className="space-y-3">
                  <div>
                    <label
                      className={`block text-xs ${theme.textSecondary} mb-1`}
                    >
                      Font Size
                    </label>
                    <input
                      type="number"
                      value={selectedElement.fontSize}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          fontSize: parseInt(e.target.value),
                        })
                      }
                      className={`w-full px-2 py-1 text-sm rounded border ${theme.borderSecondary} ${theme.bgInput}`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-xs ${theme.textSecondary} mb-1`}
                    >
                      Alignment
                    </label>
                    <div className="flex gap-1">
                      {["left", "center", "right"].map((align) => (
                        <button
                          key={align}
                          onClick={() =>
                            updateElement(selectedElement.id, {
                              alignment: align,
                            })
                          }
                          className={`flex-1 p-2 rounded ${
                            selectedElement.alignment === align
                              ? "bg-[#f59e0b] text-white"
                              : `${theme.bgHover} ${theme.textPrimary}`
                          }`}
                        >
                          {align === "left" && (
                            <AlignLeft size={14} className="mx-auto" />
                          )}
                          {align === "center" && (
                            <AlignCenter size={14} className="mx-auto" />
                          )}
                          {align === "right" && (
                            <AlignRight size={14} className="mx-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedElement.type === "text" && (
                    <div>
                      <label
                        className={`block text-xs ${theme.textSecondary} mb-1`}
                      >
                        Text Content
                      </label>
                      <textarea
                        value={selectedElement.text}
                        onChange={(e) =>
                          updateElement(selectedElement.id, {
                            text: e.target.value,
                          })
                        }
                        className={`w-full px-2 py-1 text-sm rounded border ${theme.borderSecondary} ${theme.bgInput}`}
                        rows={3}
                      />
                    </div>
                  )}

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedElement.bold}
                        onChange={(e) =>
                          updateElement(selectedElement.id, {
                            bold: e.target.checked,
                          })
                        }
                        className="rounded"
                      />
                      <span className={`text-xs ${theme.textPrimary}`}>
                        Bold
                      </span>
                    </label>
                  </div>

                  <button
                    onClick={() => deleteElement(selectedElement.id)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    <Trash2 size={14} />
                    <span className="text-sm">Delete Element</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Canvas */}
          <div className={`flex-1 overflow-auto ${theme.bgAccent} p-8`}>
            <div
              className="relative bg-white shadow-lg mx-auto"
              style={{ width: "210mm", minHeight: "297mm", padding: "20mm" }}
            >
              {elements.map((element) => {
                if (!nodeRefs.current[element.id]) {
                  nodeRefs.current[element.id] = { current: null };
                }
                return (
                  <Draggable
                    key={element.id}
                    nodeRef={nodeRefs.current[element.id]}
                    position={element.position}
                    onStop={(e, data) =>
                      updateElement(element.id, {
                        position: { x: data.x, y: data.y },
                      })
                    }
                  >
                    <div
                      ref={nodeRefs.current[element.id]}
                      onClick={() => setSelectedElement(element)}
                      className={`absolute cursor-move p-2 border-2 ${
                        selectedElement?.id === element.id
                          ? "border-[#f59e0b]"
                          : "border-transparent hover:border-gray-300"
                      }`}
                      style={{
                        width: element.size.width,
                        minHeight: element.size.height,
                      }}
                    >
                      {selectedElement?.id === element.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteElement(element.id);
                          }}
                          className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg z-10 transition"
                          title="Delete element"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      {renderElement(element)}
                    </div>
                  </Draggable>
                );
              })}
              {elements.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Type size={48} className="mx-auto mb-2 opacity-50" />
                    <p>All elements removed. Add elements from the toolbar.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`${theme.bgAccent} p-4 border-t ${theme.borderSecondary} flex justify-between items-center`}
        >
          <p className={`text-sm ${theme.textSecondary}`}>
            {elements.length} element{elements.length !== 1 ? "s" : ""} added
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`px-6 py-2 border ${theme.borderSecondary} rounded-lg ${theme.textPrimary} ${theme.bgHover} transition`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !templateName.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              <Save size={18} />
              {isSaving ? "Saving..." : "Save Template"}
            </button>
          </div>
        </div>
      </div>

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
              Your freeform template has been saved.
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

export default FreeformInvoiceBuilder;
