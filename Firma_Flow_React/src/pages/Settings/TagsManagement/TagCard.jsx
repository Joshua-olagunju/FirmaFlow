import { useTheme } from "../../../contexts/ThemeContext";
import { MoreVertical, Edit2, Power, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const TagCard = ({ tag, onEdit, onToggle, onDelete }) => {
  const { theme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const truncateText = (text, maxLength = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div
      className={`${theme.bgAccent} rounded-lg p-5 border ${theme.borderSecondary} ${theme.shadow} hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex-shrink-0 shadow-sm"
            style={{ backgroundColor: tag.color }}
          />
          <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>
            {tag.name}
          </h3>
        </div>

        {/* Three Dots Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-1.5 rounded-lg ${
              theme.mode === "light"
                ? "hover:bg-slate-100"
                : "hover:bg-slate-700"
            } transition`}
          >
            <MoreVertical size={18} className={theme.textSecondary} />
          </button>

          {isMenuOpen && (
            <div
              className={`absolute right-0 mt-2 w-48 ${theme.bgCard} ${theme.shadow} rounded-lg border ${theme.borderSecondary} z-10 overflow-hidden`}
            >
              <button
                onClick={() => {
                  onEdit(tag);
                  setIsMenuOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left flex items-center gap-3 ${
                  theme.textPrimary
                } ${
                  theme.mode === "light"
                    ? "hover:bg-slate-100"
                    : "hover:bg-slate-700"
                } transition`}
              >
                <Edit2 size={16} />
                Edit
              </button>
              <button
                onClick={() => {
                  onToggle(tag);
                  setIsMenuOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left flex items-center gap-3 ${
                  theme.textPrimary
                } ${
                  theme.mode === "light"
                    ? "hover:bg-slate-100"
                    : "hover:bg-slate-700"
                } transition`}
              >
                <Power size={16} />
                {tag.is_active ? "Deactivate" : "Activate"}
              </button>
              <button
                onClick={() => {
                  onDelete(tag);
                  setIsMenuOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left flex items-center gap-3 text-red-600 ${
                  theme.mode === "light"
                    ? "hover:bg-red-50"
                    : "hover:bg-red-900/20"
                } transition`}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className={`${theme.textSecondary} text-sm mb-4 leading-relaxed`}>
        {truncateText(tag.description || "No description provided")}
      </p>

      {/* Status */}
      <div
        className={`flex items-center justify-between pt-3 border-t ${theme.borderPrimary}`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              tag.is_active
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {tag.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TagCard;
