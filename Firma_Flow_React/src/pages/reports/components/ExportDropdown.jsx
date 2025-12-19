import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";
import * as XLSX from "xlsx";

const ExportDropdown = ({
  reportData,
  reportType,
  startDate,
  endDate,
  disabled,
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Export to Excel
  const exportToExcel = () => {
    if (!reportData) return;

    try {
      const ws = XLSX.utils.json_to_sheet([reportData]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");

      const fileName = `${reportType}_${startDate}_${endDate}.xlsx`;
      XLSX.writeFile(wb, fileName);
      setIsOpen(false);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export to Excel");
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!reportData) return;

    try {
      const ws = XLSX.utils.json_to_sheet([reportData]);
      const csv = XLSX.utils.sheet_to_csv(ws);

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${reportType}_${startDate}_${endDate}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsOpen(false);
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      alert("Failed to export to CSV");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          disabled
            ? `${theme.bgAccent} ${theme.textTertiary} cursor-not-allowed opacity-50`
            : `bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:opacity-90`
        }`}
      >
        <Download size={18} />
        <span className="text-sm">Export</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute right-0 mt-2 w-48 ${theme.bgCard} rounded-lg ${theme.shadow} border ${theme.borderSecondary} overflow-hidden z-50`}
          >
            {/* Excel Option */}
            <motion.button
              whileHover={{ backgroundColor: "rgba(102, 126, 234, 0.1)" }}
              onClick={exportToExcel}
              className={`w-full flex items-center gap-3 px-4 py-3 ${theme.textPrimary} hover:${theme.bgAccent} transition-colors border-b ${theme.borderSecondary}`}
            >
              <FileSpreadsheet size={20} className="text-green-600" />
              <span className="text-sm font-medium">Export as Excel</span>
            </motion.button>

            {/* CSV Option */}
            <motion.button
              whileHover={{ backgroundColor: "rgba(102, 126, 234, 0.1)" }}
              onClick={exportToCSV}
              className={`w-full flex items-center gap-3 px-4 py-3 ${theme.textPrimary} hover:${theme.bgAccent} transition-colors`}
            >
              <FileText size={20} className="text-blue-600" />
              <span className="text-sm font-medium">Export as CSV</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExportDropdown;
