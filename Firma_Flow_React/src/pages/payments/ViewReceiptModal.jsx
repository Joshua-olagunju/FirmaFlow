import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Printer,
  Download,
  Share2,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import * as htmlToImage from "html-to-image";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";
import { buildApiUrl } from "../../config/api.config";
import ModernReceipt from "../Settings/ReceiptTemplates/templates/ModernReceipt";
import ClassicReceipt from "../Settings/ReceiptTemplates/templates/ClassicReceipt";
import ThermalReceipt from "../Settings/ReceiptTemplates/templates/ThermalReceipt";
import CompactReceipt from "../Settings/ReceiptTemplates/templates/CompactReceipt";
import DetailedReceipt from "../Settings/ReceiptTemplates/templates/DetailedReceipt";
import ReceiptPDFFactory from "./PDFTemplates/ReceiptPDFFactory";

const ViewReceiptModal = ({
  isOpen,
  onClose,
  payment,
  initialAction = null,
}) => {
  const { theme } = useTheme();
  const { formatCurrency, currency, currencySymbols, formatDate } =
    useSettings();
  const [receiptData, setReceiptData] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [templateSettings, setTemplateSettings] = useState(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [pendingAction, setPendingAction] = useState(initialAction);
  const [invoiceData, setInvoiceData] = useState(null);
  const contentRef = useRef(null);

  const templateComponents = {
    modern: ModernReceipt,
    classic: ClassicReceipt,
    thermal: ThermalReceipt,
    compact: CompactReceipt,
    detailed: DetailedReceipt,
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
            base64?.length
          );
          return base64;
        } catch (e) {
          console.error("Canvas error with DOM image:", e);
        }
      }

      // Method 3: Load a fresh image element
      console.log("Loading fresh image element...");
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            const base64 = canvas.toDataURL("image/png");
            console.log(
              "Logo converted to base64 from fresh load, length:",
              base64?.length
            );
            resolve(base64);
          } catch (e) {
            console.error("Canvas error:", e);
            resolve(null);
          }
        };

        img.onerror = (e) => {
          console.error("Image load error:", e);
          resolve(null);
        };
        const separator = imageUrl.includes("?") ? "&" : "?";
        img.src = `${imageUrl}${separator}t=${Date.now()}`;
      });
    } catch (error) {
      console.error("Error converting image to base64:", error);
      return null;
    }
  };

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
        const company = data.data;
        const logoUrl = company.logo_path
          ? buildApiUrl(
              `api/serve_image.php?path=${encodeURIComponent(
                company.logo_path
              )}`
            )
          : null;

        setCompanyInfo({
          name: company.name || "",
          company_name: company.name || "",
          logo: logoUrl,
          logo_path: logoUrl,
          address: company.billing_address || company.address || "",
          city: company.city || "",
          state: company.state || "",
          phone: company.phone || "",
          email: company.email || "",
        });
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
        // Find default receipt template
        const defaultTemplate = data.data.find(
          (t) => t.template_type === "receipt" && t.is_default === 1
        );

        if (defaultTemplate) {
          const templateData = defaultTemplate.template_data || {};
          setTemplateSettings({
            template:
              templateData.templateId ||
              defaultTemplate.template_name?.toLowerCase() ||
              "modern",
            color: templateData.color || "#667eea",
          });
        } else {
          setTemplateSettings({
            template: "modern",
            color: "#667eea",
          });
        }
      } else {
        setTemplateSettings({
          template: "modern",
          color: "#667eea",
        });
      }
    } catch (err) {
      console.error("Error fetching template settings:", err);
      setTemplateSettings({
        template: "modern",
        color: "#667eea",
      });
    }
  }, []);

  // Fetch invoice data if payment has an invoice_id
  const fetchInvoiceData = useCallback(async () => {
    if (!payment?.invoice_id) {
      setInvoiceData(null);
      return;
    }

    try {
      const response = await fetch(
        buildApiUrl(`api/sales.php?id=${payment.invoice_id}`),
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
      console.error("Error fetching invoice data:", err);
    }
  }, [payment?.invoice_id]);

  // Build receipt data from payment
  const buildReceiptData = useCallback(() => {
    if (!payment) return;

    const paymentDate = payment.payment_date
      ? new Date(payment.payment_date)
      : new Date();

    const receiptInfo = {
      id: payment.id,
      reference: payment.reference || `PAY-${payment.id}`,
      date: formatDate
        ? formatDate(paymentDate)
        : paymentDate.toLocaleDateString(),
      time: paymentDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: payment.type || "received",
      amount: parseFloat(payment.amount) || 0,
      method: payment.method || "cash",
      status: payment.status || "completed",
      notes: payment.notes || "",
      entity_name: payment.entity_name || "Customer",
      customer: {
        name: payment.entity_name || "Customer",
        address: payment.entity_address || "",
        phone: payment.entity_phone || "",
        email: payment.entity_email || "",
      },
      currency: currency,
      invoice: invoiceData
        ? {
            invoice_no: invoiceData.invoice_no || invoiceData.invoice_number,
            total: invoiceData.total,
          }
        : payment.invoice_number
        ? { invoice_no: payment.invoice_number }
        : null,
      invoice_number: payment.invoice_number || invoiceData?.invoice_no,
      invoice_total: payment.invoice_total || invoiceData?.total,
      balance_before: payment.balance_before,
      balance_after: payment.balance_after,
    };

    setReceiptData(receiptInfo);
  }, [payment, invoiceData, currency, formatDate]);

  useEffect(() => {
    if (isOpen && payment) {
      fetchCompanyInfo();
      fetchTemplateSettings();
      fetchInvoiceData();
    }
  }, [
    isOpen,
    payment,
    fetchCompanyInfo,
    fetchTemplateSettings,
    fetchInvoiceData,
  ]);

  useEffect(() => {
    if (payment) {
      buildReceiptData();
    }
  }, [payment, invoiceData, buildReceiptData]);

  // Handle pending share action
  useEffect(() => {
    if (pendingAction && receiptData && companyInfo && templateSettings) {
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
  }, [pendingAction, receiptData, companyInfo, templateSettings]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setShowDownloadMenu(false);
    try {
      const logoBase64 = companyInfo?.logo
        ? await getImageAsBase64(companyInfo.logo)
        : null;

      const simpleCurrencyFormat = (amount) => {
        const currencySymbol = currencySymbols[currency] || currency + " ";
        const formatted = parseFloat(amount || 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        return `${currencySymbol}${formatted}`;
      };

      // Build complete receipt data with items array for PDF
      const pdfReceiptData = {
        ...receiptData,
        items: [
          {
            name:
              receiptData.type === "received"
                ? "Payment Received"
                : "Payment Made",
            quantity: 1,
            price: receiptData.amount,
            total: receiptData.amount,
          },
        ],
        subtotal: receiptData.amount,
        discount: 0,
        tax: 0,
        total: receiptData.amount,
        paymentMethod: receiptData.method
          ?.replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        amountPaid: receiptData.amount,
        change: 0,
        formatCurrency: simpleCurrencyFormat,
      };

      const pdfCompanyInfo = {
        ...companyInfo,
        logo: logoBase64,
      };

      const blob = await pdf(
        <ReceiptPDFFactory
          templateType={templateSettings?.template}
          companyInfo={pdfCompanyInfo}
          receiptData={pdfReceiptData}
          color={templateSettings?.color || "#667eea"}
        />
      ).toBlob();

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Receipt-${receiptData.reference}.pdf`;
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
      // Target the receipt paper container directly using a specific ID
      const receiptElement = document.getElementById("receipt-paper-container");

      if (!receiptElement) {
        throw new Error("Receipt element not found");
      }

      // Find ALL elements with overflow-x-auto or overflow-auto and temporarily fix them
      const overflowElements = receiptElement.querySelectorAll(
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
      const tables = receiptElement.querySelectorAll("table");
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
        overflow: receiptElement.style.overflow,
        boxShadow: receiptElement.style.boxShadow,
        margin: receiptElement.style.margin,
        width: receiptElement.style.width,
        minHeight: receiptElement.style.minHeight,
      };

      // Temporarily modify main container styles for clean capture
      receiptElement.style.overflow = "visible";
      receiptElement.style.boxShadow = "none";
      receiptElement.style.margin = "0";

      // Wait a moment for styles to apply
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Configuration for high-quality image generation
      const config = {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
        width: receiptElement.scrollWidth,
        height: receiptElement.scrollHeight,
      };

      let dataUrl;
      let filename = `Receipt-${receiptData?.reference || "REC"}`;

      if (format === "jpeg" || format === "jpg") {
        dataUrl = await htmlToImage.toJpeg(receiptElement, {
          ...config,
          quality: 0.95,
        });
        filename += ".jpg";
      } else {
        dataUrl = await htmlToImage.toPng(receiptElement, config);
        filename += ".png";
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
      receiptElement.style.overflow = originalStyles.overflow;
      receiptElement.style.boxShadow = originalStyles.boxShadow;
      receiptElement.style.margin = originalStyles.margin;

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = filename;
      link.click();
    } catch (err) {
      console.error("Error generating image:", err);
      alert("Error generating image. Please try again.");
    }
  };

  const handleDownloadJPEG = () => handleDownloadImage("jpeg");

  const handleSharePDF = async () => {
    setShowShareMenu(false);
    try {
      const logoBase64 = companyInfo?.logo
        ? await getImageAsBase64(companyInfo.logo)
        : null;

      const simpleCurrencyFormat = (amount) => {
        const currencySymbol = currencySymbols[currency] || currency + " ";
        const formatted = parseFloat(amount || 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        return `${currencySymbol}${formatted}`;
      };

      // Build complete receipt data with items array for PDF
      const pdfReceiptData = {
        ...receiptData,
        items: [
          {
            name:
              receiptData.type === "received"
                ? "Payment Received"
                : "Payment Made",
            quantity: 1,
            price: receiptData.amount,
            total: receiptData.amount,
          },
        ],
        subtotal: receiptData.amount,
        discount: 0,
        tax: 0,
        total: receiptData.amount,
        paymentMethod: receiptData.method
          ?.replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        amountPaid: receiptData.amount,
        change: 0,
        formatCurrency: simpleCurrencyFormat,
      };

      const pdfCompanyInfo = {
        ...companyInfo,
        logo: logoBase64,
      };

      const blob = await pdf(
        <ReceiptPDFFactory
          templateType={templateSettings?.template}
          companyInfo={pdfCompanyInfo}
          receiptData={pdfReceiptData}
          color={templateSettings?.color || "#667eea"}
        />
      ).toBlob();

      const file = new File([blob], `Receipt-${receiptData.reference}.pdf`, {
        type: "application/pdf",
      });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Receipt ${receiptData.reference}`,
          text: `Payment receipt for ${receiptData.entity_name}`,
        });
      } else {
        // Fallback: download
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Receipt-${receiptData.reference}.pdf`;
        link.click();
        URL.revokeObjectURL(link.href);
      }
    } catch (err) {
      console.error("Error sharing PDF:", err);
      if (err.name !== "AbortError") {
        alert("Error sharing receipt. Please try downloading instead.");
      }
    }
  };

  const handleShareImage = async () => {
    setShowShareMenu(false);
    try {
      const receiptElement = document.getElementById("receipt-paper-container");

      if (!receiptElement) {
        throw new Error("Receipt element not found");
      }

      // Find ALL elements with overflow-x-auto or overflow-auto and temporarily fix them
      const overflowElements = receiptElement.querySelectorAll(
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
      const tables = receiptElement.querySelectorAll("table");
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
        overflow: receiptElement.style.overflow,
        boxShadow: receiptElement.style.boxShadow,
        margin: receiptElement.style.margin,
      };

      // Temporarily modify main container styles for clean capture
      receiptElement.style.overflow = "visible";
      receiptElement.style.boxShadow = "none";
      receiptElement.style.margin = "0";

      // Wait a moment for styles to apply
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Generate high-quality image blob
      const blob = await htmlToImage.toBlob(receiptElement, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
        width: receiptElement.scrollWidth,
        height: receiptElement.scrollHeight,
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
      receiptElement.style.overflow = originalStyles.overflow;
      receiptElement.style.boxShadow = originalStyles.boxShadow;
      receiptElement.style.margin = originalStyles.margin;

      const receiptRef = receiptData?.reference || "REC";
      const file = new File([blob], `Receipt-${receiptRef}.png`, {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Receipt ${receiptRef}`,
          text: `Receipt ${receiptRef}`,
        });
      } else {
        alert(
          "Sharing is not supported on this device. Please use Download instead."
        );
      }
    } catch (err) {
      console.error("Error sharing:", err);
      if (err.name !== "AbortError") {
        alert("Error sharing receipt. Please try download instead.");
      }
    }
  };

  if (!isOpen || !receiptData || !companyInfo || !templateSettings) return null;

  // Get the template component
  const templateType = templateSettings?.template || "modern";
  const TemplateComponent = templateComponents[templateType] || ModernReceipt;

  // Prepare receipt data for template preview
  const templateReceiptData = receiptData
    ? {
        receiptNumber: receiptData.reference,
        date: receiptData.date,
        time: receiptData.time,
        items: [
          {
            name:
              receiptData.type === "received"
                ? "Payment Received"
                : "Payment Made",
            quantity: 1,
            price: receiptData.amount,
            total: receiptData.amount,
          },
        ],
        subtotal: receiptData.amount,
        discount: 0,
        tax: 0,
        total: receiptData.amount,
        paymentMethod: receiptData.method
          ?.replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        amountPaid: receiptData.amount,
        change: 0,
        // Additional data for detailed templates
        customer: receiptData.customer,
        notes: receiptData.notes,
        invoice: receiptData.invoice,
        invoice_number: receiptData.invoice_number,
        invoice_total: receiptData.invoice_total,
        balance_before: receiptData.balance_before,
        balance_after: receiptData.balance_after,
        status: receiptData.status,
        type: receiptData.type,
      }
    : null;

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-print-area,
          #receipt-print-area * {
            visibility: visible;
          }
          #receipt-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 0 !important;
          }
          #receipt-print-area > div {
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
                Payment Receipt {receiptData.reference}
              </h2>
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

          {/* Receipt Content */}
          <div
            className="p-8 overflow-y-auto flex-1 relative bg-gray-100"
            ref={contentRef}
            id="receipt-print-area"
            style={{ zIndex: 1 }}
          >
            {/* A4 Paper Container - NO fixed height, grows with content */}
            <div
              id="receipt-paper-container"
              className="bg-white shadow-lg mx-auto"
              style={{
                width: templateType === "thermal" ? "80mm" : "210mm",
                boxSizing: "border-box",
              }}
            >
              {templateReceiptData && companyInfo && (
                <TemplateComponent
                  receiptData={templateReceiptData}
                  companyInfo={companyInfo}
                  formatCurrency={formatCurrency}
                  color={templateSettings?.color}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewReceiptModal;
