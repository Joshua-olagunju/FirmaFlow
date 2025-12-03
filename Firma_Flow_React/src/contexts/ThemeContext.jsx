import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

// Light theme colors (your current colors)
const lightTheme = {
  mode: "light",
  // Backgrounds
  bgPrimary: "bg-slate-50",
  bgSecondary: "bg-white",
  bgCard: "bg-white",
  bgHeader: "bg-gradient-to-br from-[#667eea] to-[#764ba2]",
  bgHover: "hover:bg-slate-50",
  bgInput: "bg-white",
  bgButton: "bg-gradient-to-r from-[#667eea] to-[#764ba2]",
  bgAccent: "bg-slate-100",
  bgBadgeGreen: "bg-green-100",
  bgBadgeRed: "bg-red-100",
  bgBadgeBlue: "bg-blue-100",

  // Text colors
  textPrimary: "text-slate-800",
  textSecondary: "text-slate-600",
  textTertiary: "text-slate-500",
  textWhite: "text-white",
  textGreen: "text-green-700",
  textRed: "text-red-700",
  textBlue: "text-blue-700",
  textPurple: "text-[#667eea]",

  // Borders
  borderPrimary: "border-slate-200",
  borderSecondary: "border-slate-300",
  borderHover: "hover:border-[#667eea]",

  // Shadows
  shadow: "shadow-lg",
  shadowSm: "shadow-md",

  // Rings
  ring: "focus:ring-[#667eea]",

  // Gradients
  gradient: "from-[#667eea] to-[#764ba2]",
  gradientLight: "from-[#eceef8] to-[#f9f7fa]",
};

// Dark theme colors
const darkTheme = {
  mode: "dark",
  // Backgrounds
  bgPrimary: "bg-slate-900",
  bgSecondary: "bg-slate-800",
  bgCard: "bg-slate-800",
  bgHeader: "bg-gradient-to-br from-[#4c5fd5] to-[#5a3a82]",
  bgHover: "hover:bg-slate-700",
  bgInput: "bg-slate-700",
  bgButton: "bg-gradient-to-r from-[#667eea] to-[#764ba2]",
  bgAccent: "bg-slate-700",
  bgBadgeGreen: "bg-green-900",
  bgBadgeRed: "bg-red-900",
  bgBadgeBlue: "bg-blue-900",

  // Text colors
  textPrimary: "text-white",
  textSecondary: "text-white",
  textTertiary: "text-slate-300",
  textWhite: "text-white",
  textGreen: "text-green-400",
  textRed: "text-red-400",
  textBlue: "text-blue-400",
  textPurple: "text-[#8b9eff]",

  // Borders
  borderPrimary: "border-slate-700",
  borderSecondary: "border-slate-600",
  borderHover: "hover:border-[#667eea]",

  // Shadows
  shadow: "shadow-2xl shadow-black/50",
  shadowSm: "shadow-lg shadow-black/30",

  // Rings
  ring: "focus:ring-[#667eea]",

  // Gradients
  gradient: "from-[#667eea] to-[#764ba2]",
  gradientLight: "from-slate-800 to-slate-700",
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved theme preference
    const saved = localStorage.getItem("firmaflow-theme");
    return saved === "dark";
  });

  const theme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem("firmaflow-theme", isDarkMode ? "dark" : "light");

    // Update document class for global styles if needed
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const value = {
    theme,
    isDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// Custom hook to use theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
