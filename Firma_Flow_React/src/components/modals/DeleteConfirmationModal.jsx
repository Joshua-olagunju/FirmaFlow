import { X, AlertTriangle } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
}) => {
  const { theme } = useTheme();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${theme.bgCard} rounded-xl ${theme.shadow} max-w-md w-full animate-fadeIn`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <AlertTriangle className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">
              {title || "Confirm Deletion"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className={`${theme.textPrimary} text-base mb-4`}>
            {message || "Are you sure you want to delete this item?"}
          </p>

          {itemName && (
            <div
              className={`${theme.bgAccent} border ${theme.borderSecondary} rounded-lg p-4 mb-4`}
            >
              <p className={`text-sm ${theme.textSecondary} mb-1`}>
                Item to be deleted:
              </p>
              <p className={`font-semibold ${theme.textPrimary}`}>{itemName}</p>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Warning:</strong> This action cannot be undone. All
              associated data will be permanently removed.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`${theme.bgAccent} p-6 rounded-b-xl flex gap-3 justify-end`}
        >
          <button
            onClick={onClose}
            className={`px-6 py-2 ${theme.bgCard} border ${theme.borderSecondary} ${theme.textPrimary} rounded-lg ${theme.bgHover} transition font-medium`}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg transition font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
