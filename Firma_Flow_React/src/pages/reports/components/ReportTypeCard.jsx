import { motion } from "framer-motion";
import { useTheme } from "../../../contexts/ThemeContext";

const ReportTypeCard = ({ report, isSelected, onSelect, index }) => {
  const { theme } = useTheme();
  const Icon = report.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(report.id)}
      className={`cursor-pointer rounded-xl p-6 border-2 transition-all duration-300 ${
        isSelected
          ? `border-${report.color}-500 bg-gradient-to-br ${report.gradient} shadow-2xl`
          : `${theme.borderSecondary} ${theme.bgCard} hover:border-${report.color}-300 ${theme.shadow}`
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Icon Section */}
        <div className="flex items-start justify-between mb-4">
          <motion.div
            animate={
              isSelected
                ? {
                    rotate: [0, 10, -10, 10, 0],
                    scale: [1, 1.1, 1],
                  }
                : {}
            }
            transition={{
              duration: 0.5,
            }}
            className={`p-3 rounded-lg ${
              isSelected
                ? "bg-white/20"
                : `bg-gradient-to-br ${report.gradient}`
            }`}
          >
            <Icon
              size={32}
              className={isSelected ? "text-white" : "text-white"}
            />
          </motion.div>

          {/* Selection Indicator */}
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-6 h-6 bg-white rounded-full flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
                className="w-3 h-3 bg-green-500 rounded-full"
              />
            </motion.div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1">
          <h3
            className={`text-xl font-bold mb-2 ${
              isSelected ? "text-white" : theme.textPrimary
            }`}
          >
            {report.title}
          </h3>
          <p
            className={`text-sm font-medium mb-3 ${
              isSelected ? "text-white/90" : theme.textSecondary
            }`}
          >
            {report.subtitle}
          </p>
          <p
            className={`text-xs ${
              isSelected ? "text-white/75" : theme.textTertiary
            }`}
          >
            {report.description}
          </p>
        </div>

        {/* Animated Bottom Border */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: isSelected ? "100%" : "0%" }}
          transition={{ duration: 0.3 }}
          className="h-1 bg-white rounded-full mt-4"
        />
      </div>
    </motion.div>
  );
};

export default ReportTypeCard;
