import { useState, useRef, useEffect } from "react";
import {
  MoreHorizontal,
  Eye,
  Share2,
  DollarSign,
  Edit,
  Trash2,
} from "lucide-react";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import ViewInvoiceModal from "./ViewInvoiceModal";
import { useTheme } from "../../contexts/ThemeContext";

const InvoiceActions = ({ invoice, onRefresh, onEdit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const updatePosition = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + 8,
          left: rect.right - 192,
        });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  const handleView = () => {
    setIsOpen(false);
    setIsViewModalOpen(true);
  };

  const handleShare = () => {
    setIsOpen(false);
    // TODO: Implement share invoice functionality
    console.log("Share invoice:", invoice);
  };

  const handleMakePayment = () => {
    setIsOpen(false);
    // TODO: Implement make payment functionality
    console.log("Make payment:", invoice);
  };

  const handleEdit = () => {
    setIsOpen(false);
    if (onEdit) {
      onEdit(invoice);
    }
  };

  const handleDelete = () => {
    setIsOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.right - 192,
      });
    }
    setIsOpen(!isOpen);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(
        `http://localhost/FirmaFlow/api/sales.php?id=${invoice.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setIsDeleteModalOpen(false);
        if (onRefresh) onRefresh();
      } else {
        alert(data.error || "Failed to delete invoice");
      }
    } catch (err) {
      console.error("Error deleting invoice:", err);
      alert("Network error. Please try again.");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`p-2 ${theme.bgHover} rounded-lg transition`}
      >
        <MoreHorizontal size={18} className={theme.textSecondary} />
      </button>

      {isOpen && (
        <div
          className={`fixed w-48 ${theme.bgCard} rounded-lg ${theme.shadow} border ${theme.borderPrimary} py-1 z-[9999]`}
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
        >
          <button
            onClick={handleView}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${theme.textPrimary} ${theme.bgHover} transition`}
          >
            <Eye size={16} />
            View Invoice
          </button>
          <button
            onClick={handleShare}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${theme.textPrimary} ${theme.bgHover} transition`}
          >
            <Share2 size={16} />
            Share Invoice
          </button>
          <button
            onClick={handleMakePayment}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${theme.textPrimary} ${theme.bgHover} transition`}
          >
            <DollarSign size={16} />
            Make Payment
          </button>
          <button
            onClick={handleEdit}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${theme.textPrimary} ${theme.bgHover} transition`}
          >
            <Edit size={16} className="text-blue-600" />
            Edit Invoice
          </button>
          <div className={`border-t ${theme.borderPrimary} my-1`}></div>
          <button
            onClick={handleDelete}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 ${
              theme.mode === "light" ? "hover:bg-red-50" : "hover:bg-red-900"
            } transition`}
          >
            <Trash2 size={16} />
            Delete Invoice
          </button>
        </div>
      )}

      {isDeleteModalOpen && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          itemName={invoice.invoice_number || "this invoice"}
          itemType="invoice"
        />
      )}

      {isViewModalOpen && (
        <ViewInvoiceModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          invoice={invoice}
        />
      )}
    </div>
  );
};

export default InvoiceActions;
