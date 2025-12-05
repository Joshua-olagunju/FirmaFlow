import { useTheme } from "../../../contexts/ThemeContext";
import { MoreVertical, Edit2, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const TaxRateTable = ({
  taxRates,
  onEdit,
  onDelete,
  onToggle,
  onSetDefault,
}) => {
  const { theme } = useTheme();
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const buttonRefs = useRef({});

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    const updatePosition = () => {
      if (openMenuId && buttonRefs.current[openMenuId]) {
        const rect = buttonRefs.current[openMenuId].getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + 8,
          left: rect.right - 192,
        });
      }
    };

    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [openMenuId]);

  return (
    <div className="overflow-x-auto mb-8">
      <table className="w-full border-collapse">
        <thead>
          <tr
            className={`bg-gradient-to-r ${
              theme.mode === "light"
                ? "from-slate-50 to-slate-100"
                : "from-slate-700 to-slate-600"
            } border-b-2 ${theme.borderSecondary}`}
          >
            <th
              className={`text-left p-4 font-semibold text-sm ${theme.textPrimary}`}
            >
              Tax Name
            </th>
            <th
              className={`text-left p-4 font-semibold text-sm ${theme.textPrimary}`}
            >
              Rate
            </th>
            <th
              className={`text-left p-4 font-semibold text-sm ${theme.textPrimary}`}
            >
              Description
            </th>
            <th
              className={`text-left p-4 font-semibold text-sm ${theme.textPrimary}`}
            >
              Status
            </th>
            <th
              className={`text-left p-4 font-semibold text-sm ${theme.textPrimary}`}
            >
              Default
            </th>
            <th
              className={`text-left p-4 font-semibold text-sm ${theme.textPrimary}`}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {taxRates.map((tax) => (
            <tr
              key={tax.id}
              className={`border-b ${theme.borderPrimary} ${
                theme.mode === "light"
                  ? "hover:bg-slate-50"
                  : "hover:bg-slate-700"
              } transition`}
            >
              {/* Tax Name */}
              <td className={`p-4 ${theme.textPrimary}`}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{tax.name}</span>
                  {tax.is_default == 1 && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      Default
                    </span>
                  )}
                </div>
              </td>

              {/* Rate */}
              <td className={`p-4 ${theme.textPrimary} font-semibold`}>
                {tax.rate}%
              </td>

              {/* Description */}
              <td className={`p-4 ${theme.textSecondary} text-sm`}>
                {tax.description || "No description"}
              </td>

              {/* Status */}
              <td className="p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggle(tax)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        tax.is_active ? "bg-green-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          tax.is_active ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span
                      className={`text-sm font-medium ${theme.textPrimary}`}
                    >
                      {tax.is_active ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <span className={`text-xs ${theme.textSecondary}`}>
                    Individual tax control
                  </span>
                </div>
              </td>

              {/* Default */}
              <td className="p-4">
                {tax.is_default ? (
                  <span className="px-4 py-2 border-2 border-green-500 text-green-700 rounded-lg text-sm font-medium bg-green-50">
                    Default
                  </span>
                ) : (
                  <button
                    onClick={() => onSetDefault(tax)}
                    className={`px-4 py-2 border-2 ${theme.borderSecondary} ${
                      theme.textSecondary
                    } rounded-lg text-sm font-medium ${
                      theme.mode === "light"
                        ? "hover:bg-slate-50"
                        : "hover:bg-slate-700"
                    } transition`}
                  >
                    Set Default
                  </button>
                )}
              </td>

              {/* Actions */}
              <td className="p-4">
                <div
                  className="relative"
                  ref={openMenuId === tax.id ? menuRef : null}
                >
                  <button
                    ref={(el) => (buttonRefs.current[tax.id] = el)}
                    onClick={() => {
                      if (openMenuId !== tax.id && buttonRefs.current[tax.id]) {
                        const rect =
                          buttonRefs.current[tax.id].getBoundingClientRect();
                        setMenuPosition({
                          top: rect.bottom + 8,
                          left: rect.right - 192,
                        });
                      }
                      setOpenMenuId(openMenuId === tax.id ? null : tax.id);
                    }}
                    className={`p-2 rounded-lg ${
                      theme.mode === "light"
                        ? "hover:bg-slate-100"
                        : "hover:bg-slate-700"
                    } transition`}
                  >
                    <MoreVertical size={18} className={theme.textSecondary} />
                  </button>

                  {openMenuId === tax.id && (
                    <div
                      className={`fixed w-48 ${theme.bgCard} ${theme.shadow} rounded-lg border ${theme.borderSecondary} z-[9999] overflow-hidden`}
                      style={{
                        top: `${menuPosition.top}px`,
                        left: `${menuPosition.left}px`,
                      }}
                    >
                      <button
                        onClick={() => {
                          onEdit(tax);
                          setOpenMenuId(null);
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
                          onDelete(tax);
                          setOpenMenuId(null);
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TaxRateTable;
