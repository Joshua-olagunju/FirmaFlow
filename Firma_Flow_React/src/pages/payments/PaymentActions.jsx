import { useState, useRef, useEffect } from "react";
import {
  MoreHorizontal,
  Eye,
  Share2,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import ViewReceiptModal from "./ViewReceiptModal";

const PaymentActions = ({ payment, onRefresh }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showShareSubmenu, setShowShareSubmenu] = useState(false);
  const [shareSubmenuPosition, setShareSubmenuPosition] = useState("right");
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [shareAction, setShareAction] = useState(null);
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
    setShowReceiptModal(true);
  };

  const handleSharePDF = () => {
    setIsOpen(false);
    setShowShareSubmenu(false);
    setShareAction("pdf");
    setShowReceiptModal(true);
  };

  const handleShareImage = () => {
    setIsOpen(false);
    setShowShareSubmenu(false);
    setShareAction("image");
    setShowReceiptModal(true);
  };

  const handleCloseModal = () => {
    setShowReceiptModal(false);
    setShareAction(null);
  };

  const handleShare = () => {
    if (isSmallScreen) {
      setIsOpen(false);
      // For mobile, show share options
    }
  };

  const handleShareMouseEnter = () => {
    if (!isSmallScreen && shareButtonRef.current) {
      const rect = shareButtonRef.current.getBoundingClientRect();
      const spaceOnRight = window.innerWidth - rect.right;
      setShareSubmenuPosition(spaceOnRight < 200 ? "left" : "right");
      setShowShareSubmenu(true);
    }
  };

  const handleShareMouseLeave = () => {
    if (!isSmallScreen) {
      setTimeout(() => {
        setShowShareSubmenu(false);
      }, 300);
    }
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
            onClick={handleView}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${theme.textPrimary} ${theme.bgHover} transition`}
          >
            <Eye size={16} />
            View Receipt
          </button>
          <div
            ref={shareButtonRef}
            className="relative"
            onMouseEnter={handleShareMouseEnter}
            onMouseLeave={handleShareMouseLeave}
          >
            <button
              onClick={handleShare}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${theme.textPrimary} ${theme.bgHover} transition`}
            >
              <Share2 size={16} />
              Share Receipt
            </button>

            {/* Share Submenu */}
            {showShareSubmenu && (
              <div
                className={`absolute top-0 ${
                  shareSubmenuPosition === "right"
                    ? "left-full ml-1"
                    : "right-full mr-1"
                } w-40 ${theme.bgCard} rounded-lg ${theme.shadow} border ${
                  theme.borderPrimary
                } py-1 z-[10000]`}
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
          </div>
        </div>
      )}

      {/* View Receipt Modal */}
      <ViewReceiptModal
        isOpen={showReceiptModal}
        onClose={handleCloseModal}
        payment={payment}
        initialAction={shareAction}
      />
    </div>
  );
};

export default PaymentActions;
