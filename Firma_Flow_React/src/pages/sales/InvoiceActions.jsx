import { useState, useRef, useEffect } from "react";
import {
  MoreHorizontal,
  Eye,
  Share2,
  DollarSign,
  Edit,
  Trash2,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import DeleteConfirmationModal from "../../components/modals/DeleteConfirmationModal";
import ViewInvoiceModal from "./ViewInvoiceModal";
import { useTheme } from "../../contexts/ThemeContext";

const InvoiceActions = ({ invoice, onRefresh, onEdit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showShareSubmenu, setShowShareSubmenu] = useState(false);
  const [shareSubmenuPosition, setShareSubmenuPosition] = useState("right");
  const [shareAction, setShareAction] = useState(null); // "pdf" or "image"
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const shareButtonRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowShareSubmenu(false);
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

    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };

    checkScreenSize();
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("resize", checkScreenSize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("resize", checkScreenSize);
    };
  }, [isOpen]);

  const handleView = () => {
    setIsOpen(false);
    setShareAction(null);
    setIsViewModalOpen(true);
  };

  const handleSharePDF = () => {
    setIsOpen(false);
    setShowShareSubmenu(false);
    setIsShareModalOpen(false);
    // Open ViewInvoiceModal with share PDF action
    setShareAction("pdf");
    setIsViewModalOpen(true);
  };

  const handleShareImage = () => {
    setIsOpen(false);
    setShowShareSubmenu(false);
    setIsShareModalOpen(false);
    // Open ViewInvoiceModal with share Image action
    setShareAction("image");
    setIsViewModalOpen(true);
  };

  const handleShare = () => {
    if (isSmallScreen) {
      setIsOpen(false);
      setIsShareModalOpen(true);
    } else {
      // For larger screens, show submenu on hover (handled in JSX)
    }
  };

  const handleShareMouseEnter = () => {
    if (!isSmallScreen && shareButtonRef.current) {
      // Check position to determine submenu placement
      const rect = shareButtonRef.current.getBoundingClientRect();
      const spaceOnRight = window.innerWidth - rect.right;
      setShareSubmenuPosition(spaceOnRight < 200 ? "left" : "right");
      setShowShareSubmenu(true);
    }
  };

  const handleShareMouseLeave = () => {
    if (!isSmallScreen) {
      // Delay hiding to allow moving mouse to submenu
      setTimeout(() => {
        setShowShareSubmenu(false);
      }, 300);
    }
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
            ref={shareButtonRef}
            onClick={handleShare}
            onMouseEnter={handleShareMouseEnter}
            onMouseLeave={handleShareMouseLeave}
            className={`relative w-full flex items-center gap-3 px-4 py-2 text-sm ${theme.textPrimary} ${theme.bgHover} transition`}
          >
            <Share2 size={16} />
            Share Invoice
            {/* Submenu for larger screens */}
            {showShareSubmenu && !isSmallScreen && (
              <div
                className={`absolute ${
                  shareSubmenuPosition === "right" ? "left-full" : "right-full"
                } top-0 ml-1 w-44 ${theme.bgCard} rounded-lg ${
                  theme.shadow
                } border ${theme.borderPrimary} py-1 z-[10000]`}
                onMouseEnter={() => setShowShareSubmenu(true)}
                onMouseLeave={() => setShowShareSubmenu(false)}
              >
                <button
                  onClick={handleSharePDF}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${theme.textPrimary} ${theme.bgHover} transition`}
                >
                  <FileText size={16} />
                  Share as PDF
                </button>
                <button
                  onClick={handleShareImage}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${theme.textPrimary} ${theme.bgHover} transition`}
                >
                  <ImageIcon size={16} />
                  Share as Image
                </button>
              </div>
            )}
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
          onClose={() => {
            setIsViewModalOpen(false);
            setShareAction(null);
          }}
          invoice={invoice}
          initialAction={shareAction}
        />
      )}

      {/* Share Modal for Small Screens */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setIsShareModalOpen(false)}
          />

          {/* Modal Content */}
          <div
            className={`relative ${theme.bgCard} rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md mx-4 sm:mx-0 p-6 ${theme.shadow}`}
          >
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
              Share Invoice
            </h3>
            <p className={`text-sm ${theme.textSecondary} mb-6`}>
              Choose how you want to share this invoice:
            </p>

            <div className="space-y-3">
              <button
                onClick={handleSharePDF}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border ${theme.borderPrimary} ${theme.bgHover} transition`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#667eea20" }}
                >
                  <FileText size={20} style={{ color: "#667eea" }} />
                </div>
                <div className="text-left">
                  <p className={`font-medium ${theme.textPrimary}`}>
                    Share as PDF
                  </p>
                  <p className={`text-xs ${theme.textSecondary}`}>
                    Professional document format
                  </p>
                </div>
              </button>

              <button
                onClick={handleShareImage}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border ${theme.borderPrimary} ${theme.bgHover} transition`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#10b98120" }}
                >
                  <ImageIcon size={20} style={{ color: "#10b981" }} />
                </div>
                <div className="text-left">
                  <p className={`font-medium ${theme.textPrimary}`}>
                    Share as Image
                  </p>
                  <p className={`text-xs ${theme.textSecondary}`}>
                    Easy to view and share
                  </p>
                </div>
              </button>
            </div>

            <button
              onClick={() => setIsShareModalOpen(false)}
              className={`w-full mt-4 py-3 rounded-lg border ${theme.borderPrimary} ${theme.bgHover} transition ${theme.textPrimary}`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceActions;
