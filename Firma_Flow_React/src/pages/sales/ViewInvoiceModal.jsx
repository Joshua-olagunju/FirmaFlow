import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Printer,
  Download,
  ChevronLeft,
  ChevronRight,
  Share2,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import * as htmlToImage from "html-to-image";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";
import { buildApiUrl } from "../../config/api.config";
import ModernInvoice from "../Settings/InvoiceTemplates/templates/ModernInvoice";
import ClassicInvoice from "../Settings/InvoiceTemplates/templates/ClassicInvoice";
import MinimalInvoice from "../Settings/InvoiceTemplates/templates/MinimalInvoice";
import ProfessionalInvoice from "../Settings/InvoiceTemplates/templates/ProfessionalInvoice";
import ElegantInvoice from "../Settings/InvoiceTemplates/templates/ElegantInvoice";
import CustomInvoicePreview from "../Settings/InvoiceTemplates/CustomInvoicePreview";
import InvoicePDFFactory from "./PDFTemplates/InvoicePDFFactory";

const ViewInvoiceModal = ({
  isOpen,
  onClose,
  invoice,
  initialAction = null,
}) => {
  const { theme } = useTheme();
  const { formatCurrency, currency, currencySymbols } = useSettings();
  const [invoiceData, setInvoiceData] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [templateSettings, setTemplateSettings] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [pendingAction, setPendingAction] = useState(initialAction);
  const contentRef = useRef(null);

  const templateComponents = {
    modern: ModernInvoice,
    classic: ClassicInvoice,
    minimal: MinimalInvoice,
    professional: ProfessionalInvoice,
    elegant: ElegantInvoice,
  };

  // Helper function to convert image URL to base64
  const getImageAsBase64 = async (imageUrl) => {
    if (!imageUrl) return null;

    try {
      console.log("Converting logo to base64:", imageUrl);

      // Method 1: Try to fetch the image as blob and convert to base64
      try {
        const response = await fetch(imageUrl, {
          credentials: "include",
          mode: "cors",
        });

        if (response.ok) {
          const blob = await response.blob();
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              console.log(
                "Logo converted via fetch, length:",
                reader.result?.length
              );
              resolve(reader.result);
            };
            reader.onerror = () => {
              console.error("FileReader error");
              resolve(null);
            };
            reader.readAsDataURL(blob);
          });
        }
      } catch (fetchError) {
        console.log("Fetch method failed, trying canvas method:", fetchError);
      }

      // Method 2: Try to find the image element already loaded in the DOM
      const imgElement = document.querySelector(`img[src="${imageUrl}"]`);

      if (imgElement && imgElement.complete && imgElement.naturalWidth > 0) {
        console.log("Found loaded image in DOM, converting...");
        try {
          const canvas = document.createElement("canvas");
          canvas.width = imgElement.naturalWidth || imgElement.width;
          canvas.height = imgElement.naturalHeight || imgElement.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(imgElement, 0, 0);
          const base64 = canvas.toDataURL("image/png");
          console.log(
            "Logo converted to base64 from DOM, length:",
            base64.length
          );
          return base64;
        } catch (canvasError) {
          console.log("Canvas conversion failed (CORS):", canvasError);
        }
      }

      // Method 3: Load image fresh with crossOrigin
      console.log("Trying to load image fresh with crossOrigin...");
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
          try {
            console.log("Image loaded, converting to base64...");
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            const base64 = canvas.toDataURL("image/png");
            console.log("Logo converted to base64, length:", base64.length);
            resolve(base64);
          } catch (e) {
            console.error("Canvas error:", e);
            resolve(null);
          }
        };

        img.onerror = (error) => {
          console.error("Image load error:", error);
          resolve(null);
        };

        // Add cache busting to avoid CORS cached responses
        const separator = imageUrl.includes("?") ? "&" : "?";
        img.src = `${imageUrl}${separator}t=${Date.now()}`;
      });
    } catch (error) {
      console.error("Error converting image to base64:", error);
      return null;
    }
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
        console.log("Company data from API:", company);

        // Build logo URL using the serve_image.php endpoint for CORS support
        const logoUrl = company.logo_path
          ? buildApiUrl(
              `api/serve_image.php?path=${encodeURIComponent(
                company.logo_path
              )}`
            )
          : null;

        const mappedCompanyInfo = {
          name: company.name || "",
          company_name: company.name || "",
          logo: logoUrl,
          logo_path: logoUrl,
          address: company.billing_address || company.address || "",
          billing_address: company.billing_address || company.address || "",
          city: company.city || "",
          state: company.state || "",
          phone: company.phone || "",
          email: company.email || "",
          bank_account: company.account_number || "",
          account_number: company.account_number || "",
          bank_name: company.bank_name || "",
          account_name: company.account_name || company.name || "",
        };
        console.log("Mapped company info:", mappedCompanyInfo);
        console.log("Logo URL:", logoUrl);
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

  // Handle pending share action from InvoiceActions
  useEffect(() => {
    if (pendingAction && invoiceData && companyInfo && templateSettings) {
      // Small delay to ensure content is rendered
      const timer = setTimeout(() => {
        if (pendingAction === "pdf") {
          handleSharePDF();
        } else if (pendingAction === "image") {
          handleShareImage();
        }
        setPendingAction(null);
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAction, invoiceData, companyInfo, templateSettings]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setShowDownloadMenu(false);
    try {
      console.log("=== PDF Download Debug Start ===");
      console.log("Currency from settings:", currency);
      console.log("Company logo URL:", companyInfo?.logo);

      // Convert logo to base64 for PDF
      const logoBase64 = companyInfo?.logo
        ? await getImageAsBase64(companyInfo.logo)
        : null;

      console.log("Logo Base64 conversion result:");
      console.log("- Is null?", logoBase64 === null);
      console.log("- Starts with data:?", logoBase64?.startsWith("data:"));
      console.log("- Length:", logoBase64?.length);
      console.log("- First 100 chars:", logoBase64?.substring(0, 100));

      // Simple currency formatter for PDF (Intl.NumberFormat doesn't work well in PDFs)
      const simpleCurrencyFormat = (amount) => {
        const currencySymbol = currencySymbols[currency] || currency + " ";
        const formatted = parseFloat(amount || 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        return `${currencySymbol}${formatted}`;
      };

      // Build invoice data for PDF
      const pdfInvoiceData = {
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
        items: (invoiceData.lines || []).map((line) => ({
          description: line.description || line.product_name || "",
          quantity: parseFloat(line.quantity) || 0,
          rate: parseFloat(line.unit_price) || 0,
          amount:
            parseFloat(line.quantity || 0) * parseFloat(line.unit_price || 0),
        })),
        subtotal: parseFloat(invoiceData.subtotal) || 0,
        tax:
          parseFloat(invoiceData.tax_amount) ||
          parseFloat(invoiceData.tax) ||
          0,
        discount: parseFloat(invoiceData.discount_amount) || 0,
        total: parseFloat(invoiceData.total) || 0,
        notes: invoiceData.notes || "",
        currency: currency,
        formatCurrency: simpleCurrencyFormat,
      };

      console.log("Invoice Data for PDF:");
      console.log("- Items count:", pdfInvoiceData.items?.length);
      console.log("- First item:", pdfInvoiceData.items?.[0]);
      console.log("- Subtotal:", pdfInvoiceData.subtotal);
      console.log("- Tax:", pdfInvoiceData.tax);
      console.log("- Total:", pdfInvoiceData.total);
      console.log("- Currency:", pdfInvoiceData.currency);
      console.log(
        "- formatCurrency type:",
        typeof pdfInvoiceData.formatCurrency
      );
      console.log(
        "- formatCurrency test (1000):",
        pdfInvoiceData.formatCurrency(1000)
      );
      console.log("=== PDF Download Debug End ===");

      // Use company info with base64 logo
      const pdfCompanyInfo = {
        ...companyInfo,
        logo: logoBase64,
      };

      // Generate PDF using @react-pdf/renderer with the appropriate template
      const blob = await pdf(
        <InvoicePDFFactory
          templateType={templateSettings?.template}
          isCustom={templateSettings?.isCustom}
          customData={templateSettings?.customData}
          companyInfo={pdfCompanyInfo}
          invoiceData={pdfInvoiceData}
          color={templateSettings?.color || "#667eea"}
          showPaymentInfo={templateSettings?.showPaymentInfo !== false}
        />
      ).toBlob();

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Invoice-${
        invoiceData.invoice_number || invoiceData.invoice_no
      }.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Error generating PDF. Please try again.");
    }
  };

  const handleDownloadImage = async (format = "png") => {
    setShowDownloadMenu(false);
    try {
      // Target the A4 paper container directly using a specific ID
      const invoiceElement = document.getElementById("invoice-paper-container");

      if (!invoiceElement) {
        throw new Error("Invoice element not found");
      }

      // Find ALL elements with overflow-x-auto or overflow-auto and temporarily fix them
      const overflowElements = invoiceElement.querySelectorAll(
        '[class*="overflow"]'
      );
      const originalOverflows = [];

      overflowElements.forEach((el, index) => {
        originalOverflows[index] = {
          overflow: el.style.overflow,
          overflowX: el.style.overflowX,
          overflowY: el.style.overflowY,
        };
        el.style.overflow = "visible";
        el.style.overflowX = "visible";
        el.style.overflowY = "visible";
      });

      // Also fix any tables that might have min-width issues
      const tables = invoiceElement.querySelectorAll("table");
      const originalTableStyles = [];
      tables.forEach((table, index) => {
        originalTableStyles[index] = {
          minWidth: table.style.minWidth,
          width: table.style.width,
        };
        table.style.minWidth = "unset";
        table.style.width = "100%";
      });

      // Store original styles of the main container
      const originalStyles = {
        overflow: invoiceElement.style.overflow,
        boxShadow: invoiceElement.style.boxShadow,
        margin: invoiceElement.style.margin,
        width: invoiceElement.style.width,
        minHeight: invoiceElement.style.minHeight,
      };

      // Temporarily modify main container styles for clean capture
      invoiceElement.style.overflow = "visible";
      invoiceElement.style.boxShadow = "none";
      invoiceElement.style.margin = "0";

      // Wait a moment for styles to apply
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Configuration for high-quality image generation
      const config = {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
        width: invoiceElement.scrollWidth,
        height: invoiceElement.scrollHeight,
        style: {
          overflow: "visible",
          margin: "0",
        },
      };

      let dataUrl;
      let filename;
      const invoiceNumber =
        invoiceData?.invoice_number || invoiceData?.invoice_no || "INV";

      if (format === "jpeg" || format === "jpg") {
        dataUrl = await htmlToImage.toJpeg(invoiceElement, {
          ...config,
          quality: 0.95,
        });
        filename = `Invoice-${invoiceNumber}.jpg`;
      } else if (format === "svg") {
        dataUrl = await htmlToImage.toSvg(invoiceElement, config);
        filename = `Invoice-${invoiceNumber}.svg`;
      } else {
        // Default to PNG for best quality
        dataUrl = await htmlToImage.toPng(invoiceElement, config);
        filename = `Invoice-${invoiceNumber}.png`;
      }

      // Restore original styles for overflow elements
      overflowElements.forEach((el, index) => {
        el.style.overflow = originalOverflows[index].overflow;
        el.style.overflowX = originalOverflows[index].overflowX;
        el.style.overflowY = originalOverflows[index].overflowY;
      });

      // Restore table styles
      tables.forEach((table, index) => {
        table.style.minWidth = originalTableStyles[index].minWidth;
        table.style.width = originalTableStyles[index].width;
      });

      // Restore main container styles
      invoiceElement.style.overflow = originalStyles.overflow;
      invoiceElement.style.boxShadow = originalStyles.boxShadow;
      invoiceElement.style.margin = originalStyles.margin;

      // Create download link
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating image:", err);
      alert("Error generating image. Please try again.");
    }
  };

  // Download as high-quality JPEG (smaller file size)
  const handleDownloadJPEG = () => handleDownloadImage("jpeg");

  const handleSharePDF = async () => {
    setShowShareMenu(false);
    try {
      // Convert logo to base64 for PDF
      const logoBase64 = companyInfo?.logo
        ? await getImageAsBase64(companyInfo.logo)
        : null;

      // Simple currency formatter for PDF
      const simpleCurrencyFormat = (amount) => {
        const currencySymbol = currencySymbols[currency] || currency + " ";
        const formatted = parseFloat(amount || 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        return `${currencySymbol}${formatted}`;
      };

      // Build invoice data for PDF
      const pdfInvoiceData = {
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
        items: (invoiceData.lines || []).map((line) => ({
          description: line.description || line.product_name || "",
          quantity: parseFloat(line.quantity) || 0,
          rate: parseFloat(line.unit_price) || 0,
          amount:
            parseFloat(line.quantity || 0) * parseFloat(line.unit_price || 0),
        })),
        subtotal: parseFloat(invoiceData.subtotal) || 0,
        tax:
          parseFloat(invoiceData.tax_amount) ||
          parseFloat(invoiceData.tax) ||
          0,
        discount: parseFloat(invoiceData.discount_amount) || 0,
        total: parseFloat(invoiceData.total) || 0,
        notes: invoiceData.notes || "",
        currency: currency,
        formatCurrency: simpleCurrencyFormat,
      };

      // Use company info with base64 logo
      const pdfCompanyInfo = {
        ...companyInfo,
        logo: logoBase64,
      };

      // Generate PDF using @react-pdf/renderer with the appropriate template
      const blob = await pdf(
        <InvoicePDFFactory
          templateType={templateSettings?.template}
          isCustom={templateSettings?.isCustom}
          customData={templateSettings?.customData}
          companyInfo={pdfCompanyInfo}
          invoiceData={pdfInvoiceData}
          color={templateSettings?.color || "#667eea"}
          showPaymentInfo={templateSettings?.showPaymentInfo !== false}
        />
      ).toBlob();

      const file = new File(
        [blob],
        `Invoice-${invoiceData.invoice_number || invoiceData.invoice_no}.pdf`,
        {
          type: "application/pdf",
        }
      );

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice ${
            invoiceData.invoice_number || invoiceData.invoice_no
          }`,
          text: `Invoice ${
            invoiceData.invoice_number || invoiceData.invoice_no
          }`,
        });
      } else {
        alert(
          "Sharing is not supported on this device. Please use Download instead."
        );
      }
    } catch (err) {
      console.error("Error sharing:", err);
      if (err.name !== "AbortError") {
        alert("Error sharing invoice. Please try download instead.");
      }
    }
  };

  const handleShareImage = async () => {
    setShowShareMenu(false);
    try {
      // Target the A4 paper container directly
      const invoiceElement = document.getElementById("invoice-paper-container");

      if (!invoiceElement) {
        throw new Error("Invoice element not found");
      }

      // Find ALL elements with overflow-x-auto or overflow-auto and temporarily fix them
      const overflowElements = invoiceElement.querySelectorAll(
        '[class*="overflow"]'
      );
      const originalOverflows = [];

      overflowElements.forEach((el, index) => {
        originalOverflows[index] = {
          overflow: el.style.overflow,
          overflowX: el.style.overflowX,
          overflowY: el.style.overflowY,
        };
        el.style.overflow = "visible";
        el.style.overflowX = "visible";
        el.style.overflowY = "visible";
      });

      // Also fix any tables that might have min-width issues
      const tables = invoiceElement.querySelectorAll("table");
      const originalTableStyles = [];
      tables.forEach((table, index) => {
        originalTableStyles[index] = {
          minWidth: table.style.minWidth,
          width: table.style.width,
        };
        table.style.minWidth = "unset";
        table.style.width = "100%";
      });

      // Store original styles of the main container
      const originalStyles = {
        overflow: invoiceElement.style.overflow,
        boxShadow: invoiceElement.style.boxShadow,
        margin: invoiceElement.style.margin,
      };

      // Temporarily modify main container styles for clean capture
      invoiceElement.style.overflow = "visible";
      invoiceElement.style.boxShadow = "none";
      invoiceElement.style.margin = "0";

      // Wait a moment for styles to apply
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Generate high-quality image blob
      const blob = await htmlToImage.toBlob(invoiceElement, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
        width: invoiceElement.scrollWidth,
        height: invoiceElement.scrollHeight,
        style: {
          overflow: "visible",
          margin: "0",
        },
      });

      // Restore original styles for overflow elements
      overflowElements.forEach((el, index) => {
        el.style.overflow = originalOverflows[index].overflow;
        el.style.overflowX = originalOverflows[index].overflowX;
        el.style.overflowY = originalOverflows[index].overflowY;
      });

      // Restore table styles
      tables.forEach((table, index) => {
        table.style.minWidth = originalTableStyles[index].minWidth;
        table.style.width = originalTableStyles[index].width;
      });

      // Restore main container styles
      invoiceElement.style.overflow = originalStyles.overflow;
      invoiceElement.style.boxShadow = originalStyles.boxShadow;
      invoiceElement.style.margin = originalStyles.margin;

      const invoiceNumber =
        invoiceData?.invoice_number || invoiceData?.invoice_no || "INV";
      const file = new File([blob], `Invoice-${invoiceNumber}.png`, {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice ${invoiceNumber}`,
          text: `Invoice ${invoiceNumber}`,
        });
      } else {
        alert(
          "Sharing is not supported on this device. Please use Download instead."
        );
      }
    } catch (err) {
      console.error("Error sharing:", err);
      if (err.name !== "AbortError") {
        alert("Error sharing invoice. Please try download instead.");
      }
    }
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
            background: white !important;
            padding: 0 !important;
          }
          #invoice-print-area > div {
            box-shadow: none !important;
            margin: 0 !important;
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
          className={`${theme.bgCard} rounded-xl ${theme.shadow} max-w-6xl w-full max-h-[95vh] flex flex-col overflow-hidden`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 flex justify-between items-center rounded-t-xl z-50 no-print flex-shrink-0">
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

              {/* Share Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowShareMenu(!showShareMenu);
                    setShowDownloadMenu(false);
                  }}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white"
                  title="Share"
                >
                  <Share2 size={20} />
                </button>
                {showShareMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50 overflow-hidden">
                    <button
                      onClick={handleShareImage}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 transition text-gray-700 font-medium"
                    >
                      Share as Image
                    </button>
                    <button
                      onClick={handleSharePDF}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 transition text-gray-700 font-medium border-t border-gray-200"
                    >
                      Share as PDF
                    </button>
                  </div>
                )}
              </div>

              {/* Download Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowDownloadMenu(!showDownloadMenu);
                    setShowShareMenu(false);
                  }}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white"
                  title="Download"
                >
                  <Download size={20} />
                </button>
                {showDownloadMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-50 overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Image Formats
                      </span>
                    </div>
                    <button
                      onClick={() => handleDownloadImage("png")}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 transition text-gray-700 font-medium flex items-center gap-3"
                    >
                      <ImageIcon size={18} className="text-blue-500" />
                      <div>
                        <div>PNG Image</div>
                        <div className="text-xs text-gray-400">
                          Best quality, transparent
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={handleDownloadJPEG}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 transition text-gray-700 font-medium flex items-center gap-3 border-t border-gray-100"
                    >
                      <ImageIcon size={18} className="text-green-500" />
                      <div>
                        <div>JPEG Image</div>
                        <div className="text-xs text-gray-400">
                          Smaller file size
                        </div>
                      </div>
                    </button>
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Document Format
                      </span>
                    </div>
                    <button
                      onClick={handleDownloadPDF}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 transition text-gray-700 font-medium flex items-center gap-3"
                    >
                      <FileText size={18} className="text-red-500" />
                      <div>
                        <div>PDF Document</div>
                        <div className="text-xs text-gray-400">
                          Print-ready format
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Invoice Content */}
          <div
            className="p-8 overflow-y-auto flex-1 relative bg-gray-100"
            ref={contentRef}
            id="invoice-print-area"
            style={{ zIndex: 1 }}
          >
            {/* A4 Paper Container - NO fixed height, grows with content */}
            <div
              id="invoice-paper-container"
              className="bg-white shadow-lg mx-auto"
              style={{
                width: "210mm",
                boxSizing: "border-box",
              }}
            >
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
