import ModernInvoicePDF from "./ModernInvoicePDF";
import ClassicInvoicePDF from "./ClassicInvoicePDF";
import MinimalInvoicePDF from "./MinimalInvoicePDF";
import ProfessionalInvoicePDF from "./ProfessionalInvoicePDF";
import ElegantInvoicePDF from "./ElegantInvoicePDF";
import CustomInvoicePDF from "./CustomInvoicePDF";

const InvoicePDFFactory = ({
  templateType,
  isCustom,
  customData,
  companyInfo,
  invoiceData,
  color,
  showPaymentInfo,
}) => {
  // Debug logging to trace data flow
  console.log("=== InvoicePDFFactory Debug ===");
  console.log("Template Type:", templateType);
  console.log("Is Custom:", isCustom);
  console.log("Custom Data:", customData);
  console.log("Custom Data Sections:", customData?.sections);
  console.log("Custom Data Color:", customData?.color);
  console.log("Company Info:", companyInfo);
  console.log("Logo (base64):", companyInfo?.logo?.substring(0, 50) + "...");
  console.log("Logo length:", companyInfo?.logo?.length);
  console.log("Invoice Data:", invoiceData);
  console.log("Items:", invoiceData?.items);
  console.log("Items length:", invoiceData?.items?.length);
  console.log("Format Currency type:", typeof invoiceData?.formatCurrency);
  console.log("Currency:", invoiceData?.currency);
  console.log("Color:", color);
  console.log("===============================");

  // For custom templates, use the dynamic custom PDF generator
  if (isCustom) {
    return (
      <CustomInvoicePDF
        templateData={customData}
        companyInfo={companyInfo}
        invoiceData={invoiceData}
        color={color}
      />
    );
  }

  // Map template type to the appropriate PDF component
  const templateMap = {
    modern: ModernInvoicePDF,
    classic: ClassicInvoicePDF,
    minimal: MinimalInvoicePDF,
    professional: ProfessionalInvoicePDF,
    elegant: ElegantInvoicePDF,
  };

  // Get the appropriate PDF template component
  const PDFTemplate =
    templateMap[templateType?.toLowerCase()] || ModernInvoicePDF;

  return (
    <PDFTemplate
      companyInfo={companyInfo}
      invoiceData={invoiceData}
      color={color}
      showPaymentInfo={showPaymentInfo}
    />
  );
};

export default InvoicePDFFactory;
