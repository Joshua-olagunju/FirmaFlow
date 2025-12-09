import { AlertTriangle, X } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const InventoryWarningModal = ({
  isOpen,
  onClose,
  onConfirm,
  productName,
  availableQty,
  requestedQty,
}) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  const shortage = requestedQty - availableQty;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${theme.bgCard} rounded-xl ${theme.shadow} max-w-md w-full`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 flex justify-between items-center rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Insufficient Stock</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div
            className={`${
              theme.mode === "light"
                ? "bg-yellow-50 border-yellow-200"
                : "bg-yellow-900/20 border-yellow-700"
            } border rounded-lg p-4`}
          >
            <p
              className={`text-sm ${
                theme.mode === "light" ? "text-yellow-800" : "text-yellow-200"
              } leading-relaxed`}
            >
              You are trying to select{" "}
              <span className="font-bold">{requestedQty} units</span> of{" "}
              <span className="font-semibold">{productName}</span>, but you only
              have <span className="font-bold">{availableQty} units</span> in
              stock.
            </p>
            <p
              className={`text-sm ${
                theme.mode === "light" ? "text-yellow-800" : "text-yellow-200"
              } mt-2`}
            >
              You will be short by{" "}
              <span
                className={`font-bold ${
                  theme.mode === "light" ? "text-red-600" : "text-red-400"
                }`}
              >
                {shortage} units
              </span>
              .
            </p>
          </div>

          <p className={`text-sm ${theme.textSecondary}`}>
            Would you like to proceed with this quantity? This may result in
            backorder or stock issues.
          </p>
        </div>

        {/* Actions */}
        <div className={`flex gap-3 p-6 border-t ${theme.borderPrimary}`}>
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2.5 border ${
              theme.borderPrimary
            } rounded-lg ${theme.textPrimary} ${
              theme.mode === "light"
                ? "hover:bg-gray-100"
                : "hover:bg-slate-700"
            } transition font-medium`}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition font-medium shadow-lg"
          >
            Proceed Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryWarningModal;
