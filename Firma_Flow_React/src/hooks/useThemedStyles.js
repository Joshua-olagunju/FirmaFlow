import { useTheme } from "../contexts/ThemeContext";

// Custom hook to use theme with utility functions
export const useThemedStyles = () => {
  const { theme, isDarkMode, toggleTheme } = useTheme();

  return {
    theme,
    isDarkMode,
    toggleTheme,
    // Helper functions for common class combinations
    getCardClass: () => `${theme.bgCard} ${theme.shadow} rounded-xl`,
    getInputClass: () =>
      `${theme.bgInput} ${theme.textPrimary} border ${theme.borderSecondary} rounded-lg focus:outline-none ${theme.ring} focus:ring-2`,
    getButtonClass: () =>
      `${theme.bgButton} text-white rounded-lg hover:opacity-90 transition shadow-lg`,
    getTextClass: (variant = "primary") => {
      switch (variant) {
        case "primary":
          return theme.textPrimary;
        case "secondary":
          return theme.textSecondary;
        case "tertiary":
          return theme.textTertiary;
        default:
          return theme.textPrimary;
      }
    },
  };
};
