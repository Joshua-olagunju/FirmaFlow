import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Edit, FileText, Trash2 } from "lucide-react";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import { useTheme } from "../../contexts/ThemeContext";

const SupplierActions = ({ supplier, onEdit, onDelete, onViewReport }) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

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

  const handleEdit = () => {
    setIsOpen(false);
    onEdit(supplier);
  };

  const handleDelete = () => {
    setIsOpen(false);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    onDelete(supplier.id);
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
            onClick={handleEdit}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${theme.textPrimary} ${theme.bgHover} transition`}
          >
            <Edit size={16} className="text-blue-600" />
            Edit Supplier
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              onViewReport(supplier);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${theme.textPrimary} ${theme.bgHover} transition`}
          >
            <FileText size={16} className="text-green-600" />
            Supplier Report
          </button>

          <div className={`border-t ${theme.borderPrimary} my-1`}></div>

          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
          >
            <Trash2 size={16} />
            Delete Supplier
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Supplier"
        message="Are you sure you want to delete this supplier? This will permanently remove all supplier data and transaction history."
        itemName={supplier.companyName}
      />
    </div>
  );
};

export default SupplierActions;
