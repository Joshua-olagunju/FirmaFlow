import ModernReceiptPDF from "./ModernReceiptPDF";
import ClassicReceiptPDF from "./ClassicReceiptPDF";
import ThermalReceiptPDF from "./ThermalReceiptPDF";
import CompactReceiptPDF from "./CompactReceiptPDF";
import DetailedReceiptPDF from "./DetailedReceiptPDF";

// Map template types to PDF components
const templateMap = {
  modern: ModernReceiptPDF,
  classic: ClassicReceiptPDF,
  thermal: ThermalReceiptPDF,
  compact: CompactReceiptPDF,
  detailed: DetailedReceiptPDF,
};

// Default colors for each template
const defaultColors = {
  modern: "#667eea",
  classic: "#1e3a5f",
  thermal: "#000000",
  compact: "#4f46e5",
  detailed: "#059669",
};

/**
 * Factory component that returns the appropriate receipt PDF template
 * @param {Object} props - Component props
 * @param {string} props.templateType - The type of template to use (modern, classic, thermal, etc.)
 * @param {Object} props.companyInfo - Company information for the receipt
 * @param {Object} props.receiptData - Payment/receipt data
 * @param {string} props.color - Optional custom color for the template
 * @param {boolean} props.isCustom - Whether this is a custom template
 * @param {Object} props.customData - Custom template data if isCustom is true
 */
const ReceiptPDFFactory = ({
  templateType = "modern",
  companyInfo,
  receiptData,
  color,
  isCustom = false,
  customData = null,
}) => {
  // Debug logging
  console.log("=== ReceiptPDFFactory Debug ===");
  console.log("Template Type:", templateType);
  console.log("Company Info:", companyInfo);
  console.log("Receipt Data:", receiptData);
  console.log("Items:", receiptData?.items);
  console.log("Color:", color);
  console.log("===============================");

  // Normalize template type to lowercase
  const normalizedType = templateType?.toLowerCase() || "modern";

  // Get the PDF component for the template type
  const PDFComponent = templateMap[normalizedType] || ModernReceiptPDF;

  // Get color - use custom color, template default, or modern default
  const templateColor =
    color || defaultColors[normalizedType] || defaultColors.modern;

  // If it's a custom template, use modern template with custom color
  if (isCustom && customData) {
    const customColor =
      customData.primaryColor || customData.color || templateColor;
    return (
      <ModernReceiptPDF
        companyInfo={companyInfo}
        receiptData={receiptData}
        color={customColor}
      />
    );
  }

  return (
    <PDFComponent
      companyInfo={companyInfo}
      receiptData={receiptData}
      color={templateColor}
    />
  );
};

// Export the factory and individual components for flexibility
export {
  ReceiptPDFFactory,
  ModernReceiptPDF,
  ClassicReceiptPDF,
  ThermalReceiptPDF,
  CompactReceiptPDF,
  DetailedReceiptPDF,
};

export default ReceiptPDFFactory;
