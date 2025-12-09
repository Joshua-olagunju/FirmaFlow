import { useState, useRef, useEffect } from "react";
import {
  MoreHorizontal,
  Edit,
  Key,
  UserX,
  UserCheck,
  Trash2,
} from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";

const UserActions = ({
  user,
  onEdit,
  onResetPassword,
  onToggleStatus,
  onDelete,
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
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
    onEdit(user);
  };

  const handleResetPassword = () => {
    setIsOpen(false);
    onResetPassword(user);
  };

  const handleToggleStatus = () => {
    setIsOpen(false);
    onToggleStatus(user);
  };

  const handleDelete = () => {
    setIsOpen(false);
    onDelete(user);
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
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${theme.textPrimary} ${theme.bgHover} transition-colors text-left`}
          >
            <Edit size={16} className="text-blue-500" />
            Edit
          </button>

          <button
            onClick={handleResetPassword}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${theme.textPrimary} ${theme.bgHover} transition-colors text-left`}
          >
            <Key size={16} className="text-purple-500" />
            Reset Password
          </button>

          <button
            onClick={handleToggleStatus}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${theme.textPrimary} ${theme.bgHover} transition-colors text-left`}
          >
            {user.isActive ? (
              <>
                <UserX size={16} className="text-orange-500" />
                Deactivate
              </>
            ) : (
              <>
                <UserCheck size={16} className="text-green-500" />
                Activate
              </>
            )}
          </button>

          <div className={`border-t ${theme.borderPrimary} my-1`}></div>

          <button
            onClick={handleDelete}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 ${theme.bgHover} transition-colors text-left`}
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default UserActions;
