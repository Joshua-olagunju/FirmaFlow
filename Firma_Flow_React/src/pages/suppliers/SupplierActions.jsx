import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Edit, FileText, Trash2 } from "lucide-react";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";

const SupplierActions = ({ supplier, onEdit, onDelete, onViewReport }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-slate-100 rounded-lg transition"
      >
        <MoreHorizontal size={18} className="text-slate-600" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-[9999]">
          <button
            onClick={handleEdit}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
          >
            <Edit size={16} className="text-blue-600" />
            Edit Supplier
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              onViewReport(supplier);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
          >
            <FileText size={16} className="text-green-600" />
            Supplier Report
          </button>

          <div className="border-t border-slate-100 my-1"></div>

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
