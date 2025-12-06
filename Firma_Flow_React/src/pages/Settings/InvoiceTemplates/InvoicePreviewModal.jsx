import { X } from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";
import CustomInvoicePreview from "./CustomInvoicePreview";

const InvoicePreviewModal = ({
  isOpen,
  onClose,
  template,
  color,
  companyInfo,
  invoiceData,
  showPaymentInfo = true,
}) => {
  const { theme } = useTheme();

  if (!isOpen || !template) return null;

  const TemplateComponent = template.component;
  const isCustomTemplate = template.isCustom;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div
        className={`${theme.bgCard} rounded-xl ${theme.shadow} w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white">Invoice Preview</h2>
            <p className="text-white/80 text-sm mt-1">
              {template.name} Template {isCustomTemplate && "(Custom)"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="bg-white rounded-lg shadow-lg">
            {isCustomTemplate ? (
              <CustomInvoicePreview
                templateData={template.data}
                companyInfo={companyInfo}
                invoiceData={invoiceData}
              />
            ) : (
              <TemplateComponent
                color={color}
                companyInfo={companyInfo}
                invoiceData={invoiceData}
                showPaymentInfo={showPaymentInfo}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className={`${theme.bgAccent} p-4 border-t ${theme.borderSecondary} flex justify-end gap-3 flex-shrink-0`}
        >
          <button
            onClick={onClose}
            className={`px-6 py-2 ${theme.bgCard} border ${theme.borderSecondary} ${theme.textPrimary} rounded-lg ${theme.bgHover} transition font-medium`}
          >
            Close
          </button>
          <button
            onClick={() => {
              window.print();
            }}
            className="px-6 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg hover:opacity-90 transition font-medium"
          >
            Print Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;
