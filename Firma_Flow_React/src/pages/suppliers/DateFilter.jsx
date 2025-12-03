import { useState, useRef } from "react";
import { Calendar, X } from "lucide-react";

const DateFilter = ({ selectedFilter, onFilterChange, onCustomDateChange }) => {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const customButtonRef = useRef(null);

  const filters = [
    { value: "today", label: "Today" },
    { value: "week", label: "Last Week" },
    { value: "30days", label: "Past 30 Days" },
    { value: "month", label: "1 Month" },
    { value: "year", label: "1 Year" },
    { value: "all", label: "All Time" },
    { value: "custom", label: "Custom" },
  ];

  const handleFilterClick = (value) => {
    if (value === "custom") {
      setShowCustomPicker(!showCustomPicker);
    } else {
      setShowCustomPicker(false);
      onFilterChange(value);
    }
  };

  const applyCustomDate = () => {
    if (startDate && endDate) {
      if (onCustomDateChange) {
        onCustomDateChange({ startDate, endDate });
      }
      onFilterChange("custom");
      setShowCustomPicker(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap relative">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Calendar size={16} />
        <span className="font-medium">Filter:</span>
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        {filters.map((filter) => (
          <button
            key={filter.value}
            ref={filter.value === "custom" ? customButtonRef : null}
            onClick={() => handleFilterClick(filter.value)}
            className={`px-3 py-1 text-xs rounded-lg transition ${
              selectedFilter === filter.value
                ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Custom Date Range Picker - Floating Popup */}
      {showCustomPicker && (
        <div className="absolute top-full mt-2 right-0 bg-white border border-slate-300 rounded-lg p-4 shadow-xl z-40 min-w-[320px]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-700">
              Select Date Range
            </h4>
            <button
              onClick={() => setShowCustomPicker(false)}
              className="p-1 hover:bg-slate-100 rounded transition"
            >
              <X size={16} className="text-slate-500" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                From Date:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#667eea]"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                To Date:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#667eea]"
              />
            </div>
            <button
              onClick={applyCustomDate}
              className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-2 rounded-lg text-sm hover:opacity-90 transition"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateFilter;
