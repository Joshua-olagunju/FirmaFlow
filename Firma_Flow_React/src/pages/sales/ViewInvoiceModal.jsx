import { useState, useEffect, useRef, useCallback } from "react";
import { X, Printer, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";
import { buildApiUrl } from "../../config/api.config";
import ModernInvoice from "../Settings/InvoiceTemplates/templates/ModernInvoice";
import ClassicInvoice from "../Settings/InvoiceTemplates/templates/ClassicInvoice";
import MinimalInvoice from "../Settings/InvoiceTemplates/templates/MinimalInvoice";
import ProfessionalInvoice from "../Settings/InvoiceTemplates/templates/ProfessionalInvoice";
import ElegantInvoice from "../Settings/InvoiceTemplates/templates/ElegantInvoice";
import CustomInvoicePreview from "../Settings/InvoiceTemplates/CustomInvoicePreview";

const ViewInvoiceModal = ({ isOpen, onClose, invoice }) => {
  const { theme } = useTheme();
  const { formatCurrency, currency } = useSettings();
  const [invoiceData, setInvoiceData] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [templateSettings, setTemplateSettings] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const contentRef = useRef(null);

  const templateComponents = {
    modern: ModernInvoice,
    classic: ClassicInvoice,
    minimal: MinimalInvoice,
    professional: ProfessionalInvoice,
    elegant: ElegantInvoice,
  };

  const calculatePages = useCallback(() => {
    if (!contentRef.current || !invoiceData) return;

    // Smart pagination: find natural break points
    const items = invoiceData?.lines || [];
    const headerHeight = 300; // Approximate header height
    const footerHeight = 200; // Approximate footer height
    const pageHeight = 1056; // A4 height in pixels at 96 DPI (11 inches * 96)
    const itemHeight = 50; // Approximate height per line item

    const availableHeight = pageHeight - headerHeight - footerHeight;
    const itemsPerPage = Math.floor(availableHeight / itemHeight);

    const pages = Math.ceil(items.length / itemsPerPage);
    setTotalPages(Math.max(1, pages));
  }, [invoiceData]);

  const fetchInvoiceData = useCallback(async () => {
    try {
      const response = await fetch(
        buildApiUrl(`api/sales.php?id=${invoice.id}`),
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await response.json();
      if (data.success) {
        setInvoiceData(data.data);
      }
    } catch (err) {
      console.error("Error fetching invoice:", err);
    }
  }, [invoice]);

  const fetchCompanyInfo = useCallback(async () => {
    try {
      const response = await fetch(
        buildApiUrl("api/settings.php?type=company"),
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await response.json();
      if (data.success) {
        // Map API fields to template-expected fields
        const company = data.data;
        const mappedCompanyInfo = {
          name: company.company_name || "",
          company_name: company.company_name || "",
          logo: company.logo_path ? buildApiUrl(company.logo_path) : null,
          logo_path: company.logo_path ? buildApiUrl(company.logo_path) : null,
          address: company.billing_address || company.address || "",
          billing_address: company.billing_address || company.address || "",
          city: company.city || "",
          state: company.state || "",
          phone: company.phone || "",
          email: company.email || "",
          bank_account: company.account_number || "",
          account_number: company.account_number || "",
          bank_name: company.bank_name || "",
          account_name: company.account_name || company.company_name || "",
        };
        setCompanyInfo(mappedCompanyInfo);
      }
    } catch (err) {
      console.error("Error fetching company info:", err);
    }
  }, []);

  const fetchTemplateSettings = useCallback(async () => {
    try {
      const response = await fetch(
        buildApiUrl("api/settings.php?type=templates"),
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await response.json();
      if (data.success && data.data) {
        // Find default invoice template
        const defaultTemplate = data.data.find(
          (t) => t.template_type === "invoice" && t.is_default === 1
        );

        if (defaultTemplate) {
          const templateData = defaultTemplate.template_data || {};
          const isCustom =
            templateData.type === "custom" ||
            templateData.type === "custom-freeform";

          setTemplateSettings({
            template:
              templateData.templateId ||
              defaultTemplate.template_name?.toLowerCase() ||
              "modern",
            color: templateData.color || "#667eea",
            showPaymentInfo: templateData.showPaymentInfo !== false,
            isCustom: isCustom,
            customData: isCustom ? templateData : null,
          });
        } else {
          // Fallback to default
          setTemplateSettings({
            template: "modern",
            color: "#667eea",
            showPaymentInfo: true,
            isCustom: false,
          });
        }
      } else {
        setTemplateSettings({
          template: "modern",
          color: "#667eea",
          showPaymentInfo: true,
          isCustom: false,
        });
      }
    } catch (err) {
      console.error("Error fetching template settings:", err);
      setTemplateSettings({
        template: "modern",
        color: "#667eea",
        showPaymentInfo: true,
        isCustom: false,
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen && invoice) {
      fetchInvoiceData();
      fetchCompanyInfo();
      fetchTemplateSettings();
    }
  }, [
    isOpen,
    invoice,
    fetchInvoiceData,
    fetchCompanyInfo,
    fetchTemplateSettings,
  ]);

  useEffect(() => {
    if (contentRef.current && invoiceData) {
      calculatePages();
    }
  }, [invoiceData, calculatePages]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Implement PDF download functionality
    console.log("Download PDF");
  };

  if (!isOpen || !invoiceData || !companyInfo || !templateSettings) return null;

  const TemplateComponent =
    templateComponents[templateSettings.template] || ModernInvoice;

  const isCustomTemplate = templateSettings.isCustom;

  const getCurrentPageItems = () => {
    const items = invoiceData.lines || [];
    if (totalPages === 1) return items;

    const headerHeight = 300;
    const footerHeight = 200;
    const pageHeight = 1056;
    const itemHeight = 50;

    const availableHeight = pageHeight - headerHeight - footerHeight;
    const itemsPerPage = Math.floor(availableHeight / itemHeight);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return items.slice(startIndex, endIndex);
  };

  // Map API data to template format with proper currency formatting context
  const invoiceForDisplay = invoiceData
    ? {
        invoiceNumber:
          invoiceData.invoice_no || invoiceData.invoice_number || "",
        date:
          invoiceData.invoice_date ||
          invoiceData.sale_date ||
          new Date().toLocaleDateString(),
        dueDate: invoiceData.due_date || "",
        customer: {
          name: invoiceData.customer_name || "",
          address: invoiceData.customer_address || "",
          email: invoiceData.customer_email || "",
          phone: invoiceData.customer_phone || "",
          city: invoiceData.customer_city || "",
        },
        items: getCurrentPageItems().map((line) => ({
          description: line.description || line.product_name || "",
          quantity: parseFloat(line.quantity) || 0,
          rate: parseFloat(line.unit_price) || 0,
          amount:
            parseFloat(line.quantity || 0) * parseFloat(line.unit_price || 0),
        })),
        subtotal: parseFloat(invoiceData.subtotal) || 0,
        tax: parseFloat(invoiceData.tax_amount) || 0,
        discount: parseFloat(invoiceData.discount_amount) || 0,
        total: parseFloat(invoiceData.total) || 0,
        notes: invoiceData.notes || "",
        terms: invoiceData.terms || "",
        currency: currency,
        formatCurrency: formatCurrency,
        currentPage,
        totalPages,
      }
    : null;

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-print-area,
          #invoice-print-area * {
            visibility: visible;
          }
          #invoice-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }

        @page {
          size: A4;
          margin: 0;
        }

        .page-break {
          page-break-after: always;
          page-break-inside: avoid;
        }
      `}</style>

      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
        <div
          className={`${theme.bgCard} rounded-xl ${theme.shadow} max-w-4xl w-full max-h-[90vh] overflow-y-auto`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 flex justify-between items-center rounded-t-xl sticky top-0 z-10 no-print">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Invoice {invoiceData.invoice_number}
              </h2>
              {totalPages > 1 && (
                <p className="text-white/80 text-sm mt-1">
                  Page {currentPage} of {totalPages}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white"
                title="Print"
              >
                <Printer size={20} />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white"
                title="Download PDF"
              >
                <Download size={20} />
              </button>
              <button
                onClick={onClose}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Invoice Content */}
          <div className="p-6" ref={contentRef} id="invoice-print-area">
            {isCustomTemplate ? (
              <CustomInvoicePreview
                templateData={templateSettings.customData}
                companyInfo={companyInfo}
                invoiceData={invoiceForDisplay}
              />
            ) : (
              <TemplateComponent
                companyInfo={companyInfo}
                invoiceData={invoiceForDisplay}
                color={templateSettings.color || "#667eea"}
                showPaymentInfo={templateSettings.showPaymentInfo !== false}
              />
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 p-4 border-t border-gray-200 no-print">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  currentPage === 1
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-100"
                }`}
              >
                <ChevronLeft size={18} />
                Previous
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg transition ${
                        currentPage === page
                          ? "bg-[#667eea] text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  currentPage === totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-100"
                }`}
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ViewInvoiceModal;
