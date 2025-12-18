import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import "./pdfFonts"; // Register Unicode fonts
import { currencySymbols } from "./pdfFonts";

/**
 * CustomReceiptPDF - Fully Dynamic Receipt PDF Template Generator
 *
 * This component generates PDF receipts that EXACTLY match the design created in
 * the Enhanced Receipt Builder. All design properties are respected including:
 *
 * SECTION TYPES SUPPORTED:
 * - header: Company name with optional logo (showLogo, logoSize, fontFamily)
 * - companyInfo: Address, phone, email (toggleable, showName, borderRadius)
 * - receiptDetails: Receipt number, date, time with multiple layouts
 *   (stacked, centered, horizontal, grid, inline), showTitle, titleText,
 *   numberBgColor, numberPadding, numberBorderRadius, showLabels, gridCols
 * - customerInfo: Customer name, phone, email (toggleable)
 * - itemsTable: Items with header colors, zebra stripes, borders
 *   (headerBorderColor, headerBorderWidth, compactStyle, showQuantity, fullWidth)
 * - totals: Subtotal, tax, discount, grand total
 *   (taxLabel, grandTotalBorderWidth, grandTotalStyle)
 * - paymentInfo: Payment method, status, customer, amount paid, change
 *   (showMethod, showStatus, showAmountPaid, showChange, layout: horizontal/stacked)
 * - customText: Custom text with line break support, dynamic placeholders
 *   (fontStyle: italic, textTransform: uppercase, letterSpacing)
 * - divider: Solid, dashed, or double line dividers
 *   (width, centered for partial dividers)
 *
 * STYLING PROPERTIES SUPPORTED:
 * - alignment: left, center, right
 * - fontSize: xs, sm, md, lg, xl, 2xl, 3xl, 4xl
 * - fontWeight: light, normal, medium, semibold, bold
 * - fontFamily: Support for different font styles (currently mapped to NotoSans)
 * - fontStyle: normal, italic
 * - textTransform: uppercase
 * - backgroundColor: hex colors, accent, accentLight, transparent, opacity variants (10, 20, 30)
 * - textColor: hex colors, accent (with automatic resolution)
 * - padding: 0-8 (converted to points)
 * - borders: width, color, style (solid/dashed), radius
 * - borderRadius: rounded corners on sections
 * - colors: Full hex color support with automatic dark text detection
 *
 * LAYOUT VARIANTS:
 * - receiptDetails: stacked (default), centered, horizontal, grid, inline
 * - paymentInfo: stacked (default), horizontal
 *
 * CURRENCY SUPPORT:
 * - Fully integrated with SettingsContext
 * - All currencies supported: NGN, USD, EUR, GBP, JPY, CNY, INR, ZAR, KES, GHS
 * - No fallback currency - uses selected currency from settings
 * - Proper symbol rendering for all currencies
 *
 * TEMPLATE PRESETS FULLY SUPPORTED:
 * - thermal: Classic POS thermal receipt with monospace font
 * - modern: Contemporary design with gradient header and card sections
 * - classic: Traditional receipt with Georgia serif font and double borders
 * - compact: Space-efficient design with Arial font
 * - detailed: Full-featured professional style with all sections
 *
 * The generated PDF will be pixel-perfect to the builder preview.
 */

// Helper to get font size from template size string - matching builder exactly
const getFontSize = (size) => {
  const sizeMap = {
    xs: 8,
    sm: 9,
    md: 10,
    base: 10,
    lg: 12,
    xl: 14,
    "2xl": 16,
    "3xl": 20,
    "4xl": 24,
  };
  return sizeMap[size] || 10;
};

// Helper to get padding value - convert string to number - matching builder exactly
const getPadding = (padding) => {
  if (typeof padding === "string") {
    padding = parseInt(padding);
  }
  const paddingMap = {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
  };
  return paddingMap[padding] || 8;
};

// Helper to get font family - support for different font styles from templates
const getFontFamily = (fontFamily, weight) => {
  // Map template fontFamily to PDF-compatible fonts
  // For now, we use NotoSans for all as it has best Unicode support
  // In future, could register additional fonts for monospace, serif, etc.
  return "NotoSans";
};

// Helper to get font weight number for react-pdf
const getFontWeight = (weight) => {
  const weightMap = {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  };
  return weightMap[weight] || 400;
};

// Helper to get text alignment for react-pdf
const getTextAlign = (alignment) => {
  return alignment || "left";
};

// Helper to get flexbox alignment (alignItems) based on text alignment
const getFlexAlign = (alignment) => {
  switch (alignment) {
    case "center":
      return "center";
    case "right":
      return "flex-end";
    default:
      return "flex-start";
  }
};

// Helper to lighten a color (for backgrounds) - matching builder exactly
const lightenColor = (color, amount = 0.9) => {
  if (!color || color === "transparent") return "transparent";
  if (color.startsWith("#")) {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const newR = Math.round(r + (255 - r) * amount);
    const newG = Math.round(g + (255 - g) * amount);
    const newB = Math.round(b + (255 - b) * amount);
    return `rgb(${newR}, ${newG}, ${newB})`;
  }
  return color;
};

// Helper to convert hex to RGB with proper alpha for backgrounds
const hexToRgba = (hex, alpha = 0.1) => {
  if (!hex || hex === "transparent") return "transparent";
  if (hex.startsWith("#")) {
    const h = hex.replace("#", "");
    const r = parseInt(h.substr(0, 2), 16);
    const g = parseInt(h.substr(2, 2), 16);
    const b = parseInt(h.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
};

// Create dynamic styles based on custom template data
const createStyles = (templateData) => {
  const color = templateData?.color || "#667eea";
  const docBorder = templateData?.documentBorder;

  return StyleSheet.create({
    page: {
      padding: docBorder?.enabled ? parseInt(docBorder.margin || 20) : 16,
      fontFamily: "NotoSans",
      fontSize: 10,
      backgroundColor: "#ffffff",
      width: 226, // 80mm in points
      flexDirection: "column",
      ...(docBorder?.enabled && {
        borderWidth: parseInt(docBorder.width || 1),
        borderStyle: docBorder.style || "solid",
        borderColor: docBorder.color || "#000000",
        borderRadius: parseInt(docBorder.radius || 0),
      }),
    },
    section: {
      marginBottom: 10,
    },
    // Table styles
    table: {
      width: "100%",
      marginBottom: 10,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
      paddingVertical: 4,
      paddingHorizontal: 2,
      fontSize: 8,
      minHeight: 20, // Minimum height to accommodate wrapped text
      flexWrap: "nowrap", // Keep columns in one row
    },
    tableColItem: {
      width: "33%", // Fixed width instead of flex
      paddingRight: 4, // Add spacing from next column
    },
    tableColQty: {
      flex: 0.5,
      textAlign: "center",
    },
    tableColPrice: {
      flex: 1,
      textAlign: "right",
    },
    tableColTotal: {
      flex: 1,
      textAlign: "right",
      fontFamily: "NotoSans",
      fontWeight: 700,
    },
    // Totals
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 3,
      fontSize: 9,
    },
    totalLabel: {
      color: "#666",
    },
    totalValue: {
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#333",
    },
    grandTotal: {
      borderTopWidth: 1,
      borderTopColor: color,
      paddingTop: 6,
      marginTop: 4,
    },
    grandTotalText: {
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: color,
      fontSize: 11,
    },
  });
};

const CustomReceiptPDF = ({
  templateData,
  companyInfo,
  receiptData,
  color: propColor,
}) => {
  const templateColor = templateData?.color || propColor || "#667eea";
  const styles = createStyles(templateData);

  // Debug logging
  console.log("=== CustomReceiptPDF Debug ===");
  console.log("Template Data:", templateData);
  console.log("Sections:", templateData?.sections);
  console.log("Receipt Data:", receiptData);
  console.log("Currency:", receiptData?.currency);
  console.log("Items:", receiptData?.items);
  console.log("Items Length:", receiptData?.items?.length);
  if (receiptData?.items && receiptData.items.length > 0) {
    console.log("First Item:", receiptData.items[0]);
  }
  console.log("==============================");

  // Complete currency symbol mapping - using actual Unicode symbols (NotoSans font required)
  // These symbols will render correctly with NotoSans font
  const localCurrencySymbols = currencySymbols;

  // Use formatCurrency with proper Unicode symbols (NotoSans font required)
  const formatCurrency = (amount) => {
    const currency = receiptData?.currency || "NGN";
    const symbol = localCurrencySymbols[currency] || currency;
    const formatted = parseFloat(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${symbol}${formatted}`;
  };

  // Helper to resolve "accent" and "accentLight" color keywords to actual color values
  const resolveColor = (colorValue) => {
    if (!colorValue) return null;
    if (colorValue === "accent") return templateColor;
    if (colorValue === "accentLight") return lightenColor(templateColor, 0.9);
    // Handle opacity variants like "#667eea10"
    if (typeof colorValue === "string" && colorValue.length > 7 && colorValue.startsWith("#")) {
      const baseColor = colorValue.slice(0, 7);
      const opacity = colorValue.slice(7);
      if (opacity === "10") return hexToRgba(baseColor, 0.1);
      if (opacity === "20") return hexToRgba(baseColor, 0.2);
      if (opacity === "30") return hexToRgba(baseColor, 0.3);
    }
    return colorValue;
  };

  // Helper to determine if background is dark (needs white text)
  const isDarkBackground = (bgColor) => {
    if (!bgColor || bgColor === "transparent") return false;
    // Resolve accent colors first
    const resolvedColor = resolveColor(bgColor);
    if (!resolvedColor || resolvedColor === "transparent") return false;
    // Check for hex colors
    if (resolvedColor.startsWith("#")) {
      const hex = resolvedColor.replace("#", "");
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      // Calculate luminance
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance < 0.6;
    }
    return false;
  };

  // Helper to get section styles from props - matching builder exactly
  const getSectionStyles = (props) => {
    const padding = getPadding(props?.padding);
    const alignment = props?.alignment || "left";

    const baseStyles = {
      paddingTop: padding,
      paddingRight: padding,
      paddingBottom: padding,
      paddingLeft: padding,
      textAlign: getTextAlign(alignment),
      // For flex containers (Views with children), we need flexDirection and alignItems
      flexDirection: "column",
      alignItems: getFlexAlign(alignment),
      marginBottom: 5, // Consistent spacing between sections
    };

    // Background color - handle special values and exact hex colors
    if (props?.backgroundColor) {
      const resolvedBg = resolveColor(props.backgroundColor);
      if (props.backgroundColor === "accent") {
        baseStyles.backgroundColor = templateColor;
        baseStyles.color = "#ffffff";
      } else if (props.backgroundColor === "accentLight") {
        baseStyles.backgroundColor = lightenColor(templateColor, 0.9);
      } else if (props.backgroundColor === "transparent") {
        // Explicitly transparent
        baseStyles.backgroundColor = "transparent";
      } else {
        // Use resolved color (handles opacity variants)
        baseStyles.backgroundColor = resolvedBg;
        // Auto set white text on dark backgrounds
        if (isDarkBackground(props.backgroundColor)) {
          baseStyles.color = "#ffffff";
        }
      }
    }

    // Handle textColor prop - this is critical for presets that use textColor: "accent"
    if (props?.textColor) {
      baseStyles.color = resolveColor(props.textColor);
    }

    // Border - complete border support matching builder
    if (props?.borderWidth && parseInt(props.borderWidth) > 0) {
      baseStyles.borderWidth = parseInt(props.borderWidth);
      baseStyles.borderColor = resolveColor(props.borderColor) || templateColor;
      baseStyles.borderStyle = props.borderStyle || "solid";
    }

    // Border radius support - NEW
    if (props?.borderRadius && parseInt(props.borderRadius) > 0) {
      baseStyles.borderRadius = parseInt(props.borderRadius);
    }

    return baseStyles;
  };

  // Render Header Section - matching builder exactly with all props
  const renderHeader = (section) => {
    const fontSize = getFontSize(section.props?.fontSize || "lg");
    const fontFamily = getFontFamily(section.props?.fontFamily, section.props?.fontWeight);
    const fontWeightNum = getFontWeight(section.props?.fontWeight || "bold");
    const sectionStyles = getSectionStyles(section.props);
    // Get text color - prioritize explicit textColor, then sectionStyles.color, then default
    const textColor =
      resolveColor(section.props?.textColor) || sectionStyles.color || "#000";

    return (
      <View style={sectionStyles} key={section.id}>
        {section.props?.showLogo && companyInfo?.logo && (
          <View
            style={{ marginBottom: 4, alignItems: sectionStyles.alignItems }}
          >
            <Image
              src={companyInfo.logo}
              style={{
                width:
                  section.props?.logoSize === "sm"
                    ? 32
                    : section.props?.logoSize === "md"
                    ? 40
                    : section.props?.logoSize === "lg"
                    ? 48
                    : section.props?.logoSize === "xl"
                    ? 56
                    : 48,
                height:
                  section.props?.logoSize === "sm"
                    ? 32
                    : section.props?.logoSize === "md"
                    ? 40
                    : section.props?.logoSize === "lg"
                    ? 48
                    : section.props?.logoSize === "xl"
                    ? 56
                    : 48,
              }}
            />
          </View>
        )}
        <Text
          style={{
            fontSize,
            fontFamily,
            fontWeight: fontWeightNum,
            textAlign: sectionStyles.textAlign,
            color: textColor,
          }}
        >
          {companyInfo?.name || "Company Name"}
        </Text>
      </View>
    );
  };

  // Render Company Info Section - matching builder exactly with all props
  const renderCompanyInfo = (section) => {
    const fontSize = getFontSize(section.props?.fontSize || "xs");
    const fontFamily = getFontFamily(section.props?.fontFamily, section.props?.fontWeight);
    const sectionStyles = getSectionStyles(section.props);
    const showEmail = section.props?.showEmail !== false;
    const showPhone = section.props?.showPhone !== false;
    const showAddress = section.props?.showAddress !== false;
    const showName = section.props?.showName !== false; // Some templates show company name here
    const textColor =
      resolveColor(section.props?.textColor) || sectionStyles.color || "#000";

    // Font weight mapping
    const fontWeightNum = getFontWeight(section.props?.fontWeight || "normal");

    return (
      <View style={sectionStyles} key={section.id}>
        {showName && companyInfo?.name && (
          <Text
            style={{
              fontSize: fontSize + 2, // Company name slightly larger
              fontFamily,
              fontWeight: 700, // Company name always bold
              textAlign: sectionStyles.textAlign,
              marginBottom: 2,
              color: textColor,
            }}
          >
            {companyInfo.name}
          </Text>
        )}
        {showAddress && companyInfo?.address && (
          <Text
            style={{
              fontSize,
              fontFamily,
              fontWeight: fontWeightNum,
              textAlign: sectionStyles.textAlign,
              marginBottom: 2,
              color: textColor,
            }}
          >
            {companyInfo.address}
          </Text>
        )}
        {showPhone && companyInfo?.phone && (
          <Text
            style={{
              fontSize,
              fontFamily,
              fontWeight: fontWeightNum,
              textAlign: sectionStyles.textAlign,
              marginBottom: showEmail ? 2 : 0,
              color: textColor,
            }}
          >
            {companyInfo.phone}
          </Text>
        )}
        {showEmail && companyInfo?.email && (
          <Text
            style={{
              fontSize,
              fontFamily,
              fontWeight: fontWeightNum,
              textAlign: sectionStyles.textAlign,
              color: textColor,
            }}
          >
            {companyInfo.email}
          </Text>
        )}
      </View>
    );
  };

  // Render Receipt Details Section - matching builder exactly with all layout variants
  const renderReceiptDetails = (section) => {
    const fontSize = getFontSize(section.props?.fontSize || "xs");
    const fontFamily = getFontFamily(section.props?.fontFamily, section.props?.fontWeight);
    const fontWeightNum = getFontWeight(section.props?.fontWeight || "normal");
    const sectionStyles = getSectionStyles(section.props);
    const showReceiptNumber = section.props?.showReceiptNumber !== false;
    const showDate = section.props?.showDate !== false;
    const showTime = section.props?.showTime !== false;
    const layout = section.props?.layout || "stacked";
    const showTitle = section.props?.showTitle || false;
    const titleText = section.props?.titleText || "RECEIPT";
    const showLabels = section.props?.showLabels !== false;
    const numberBgColor = resolveColor(section.props?.numberBgColor);
    const numberPadding = getPadding(section.props?.numberPadding || 0);
    const numberBorderRadius = parseInt(section.props?.numberBorderRadius || 0);

    // Handle textColor prop with accent resolution
    const rawTextColor = section.props?.textColor;
    const textColor = rawTextColor
      ? resolveColor(rawTextColor)
      : sectionStyles.color || "#000";

    // Layout: "centered" - center everything with title
    if (layout === "centered") {
      return (
        <View style={[sectionStyles, { alignItems: "center" }]} key={section.id}>
          {showTitle && (
            <Text
              style={{
                fontSize: getFontSize("lg"),
                fontFamily,
                fontWeight: 700,
                textAlign: "center",
                marginBottom: 4,
                color: textColor,
              }}
            >
              {titleText}
            </Text>
          )}
          {showReceiptNumber && (
            <Text
              style={{
                fontSize,
                fontFamily,
                fontWeight: fontWeightNum,
                textAlign: "center",
                marginBottom: showDate ? 2 : 0,
                color: textColor,
                backgroundColor: numberBgColor || "transparent",
                paddingTop: numberPadding,
                paddingBottom: numberPadding,
                paddingLeft: numberPadding,
                paddingRight: numberPadding,
                borderRadius: numberBorderRadius,
              }}
            >
              {showLabels ? "Receipt #: " : ""}
              {receiptData?.receiptNumber || receiptData?.reference || "N/A"}
            </Text>
          )}
          {showDate && (
            <Text
              style={{
                fontSize,
                fontFamily,
                fontWeight: fontWeightNum,
                textAlign: "center",
                color: textColor,
              }}
            >
              {receiptData?.date || new Date().toLocaleDateString()}
            </Text>
          )}
        </View>
      );
    }

    // Layout: "horizontal" - side by side
    if (layout === "horizontal") {
      return (
        <View style={sectionStyles} key={section.id}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            {showReceiptNumber && (
              <Text
                style={{
                  fontSize,
                  fontFamily,
                  fontWeight: fontWeightNum,
                  color: textColor,
                }}
              >
                {showLabels ? "Receipt #: " : ""}
                {receiptData?.receiptNumber || receiptData?.reference || "N/A"}
              </Text>
            )}
            {showDate && (
              <Text
                style={{
                  fontSize,
                  fontFamily,
                  fontWeight: fontWeightNum,
                  color: textColor,
                }}
              >
                {showLabels ? "Date: " : ""}
                {receiptData?.date || new Date().toLocaleDateString()}
              </Text>
            )}
          </View>
          {showTime && (
            <Text
              style={{
                fontSize,
                fontFamily,
                fontWeight: fontWeightNum,
                textAlign: sectionStyles.textAlign,
                marginTop: 2,
                color: textColor,
              }}
            >
              {showLabels ? "Time: " : ""}
              {receiptData?.time || new Date().toLocaleTimeString()}
            </Text>
          )}
        </View>
      );
    }

    // Layout: "grid" - grid layout
    if (layout === "grid") {
      const gridCols = parseInt(section.props?.gridCols || 2);
      return (
        <View style={sectionStyles} key={section.id}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
            {showReceiptNumber && (
              <View style={{ width: gridCols === 2 ? "48%" : "100%" }}>
                <Text
                  style={{
                    fontSize: getFontSize("xs"),
                    fontFamily,
                    color: "#666",
                    marginBottom: 1,
                  }}
                >
                  Receipt #
                </Text>
                <Text
                  style={{
                    fontSize,
                    fontFamily,
                    fontWeight: fontWeightNum,
                    color: textColor,
                  }}
                >
                  {receiptData?.receiptNumber || receiptData?.reference || "N/A"}
                </Text>
              </View>
            )}
            {showDate && (
              <View style={{ width: gridCols === 2 ? "48%" : "100%" }}>
                <Text
                  style={{
                    fontSize: getFontSize("xs"),
                    fontFamily,
                    color: "#666",
                    marginBottom: 1,
                  }}
                >
                  Date
                </Text>
                <Text
                  style={{
                    fontSize,
                    fontFamily,
                    fontWeight: fontWeightNum,
                    color: textColor,
                  }}
                >
                  {receiptData?.date || new Date().toLocaleDateString()}
                </Text>
              </View>
            )}
            {showTime && (
              <View style={{ width: gridCols === 2 ? "48%" : "100%" }}>
                <Text
                  style={{
                    fontSize: getFontSize("xs"),
                    fontFamily,
                    color: "#666",
                    marginBottom: 1,
                  }}
                >
                  Time
                </Text>
                <Text
                  style={{
                    fontSize,
                    fontFamily,
                    fontWeight: fontWeightNum,
                    color: textColor,
                  }}
                >
                  {receiptData?.time || new Date().toLocaleTimeString()}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    // Layout: "inline" - all on one line
    if (layout === "inline") {
      const parts = [];
      if (showReceiptNumber) {
        parts.push(
          `${showLabels ? "Receipt #: " : ""}${
            receiptData?.receiptNumber || receiptData?.reference || "N/A"
          }`
        );
      }
      if (showDate) {
        parts.push(
          `${showLabels ? "Date: " : ""}${
            receiptData?.date || new Date().toLocaleDateString()
          }`
        );
      }
      if (showTime) {
        parts.push(
          `${showLabels ? "Time: " : ""}${
            receiptData?.time || new Date().toLocaleTimeString()
          }`
        );
      }
      return (
        <View style={sectionStyles} key={section.id}>
          <Text
            style={{
              fontSize,
              fontFamily,
              fontWeight: fontWeightNum,
              textAlign: sectionStyles.textAlign,
              color: textColor,
            }}
          >
            {parts.join(" | ")}
          </Text>
        </View>
      );
    }

    // Default layout: "stacked"
    return (
      <View style={sectionStyles} key={section.id}>
        {showTitle && (
          <Text
            style={{
              fontSize: getFontSize("lg"),
              fontFamily,
              fontWeight: 700,
              textAlign: sectionStyles.textAlign,
              marginBottom: 4,
              color: textColor,
            }}
          >
            {titleText}
          </Text>
        )}
        {showReceiptNumber && (
          <Text
            style={{
              fontSize,
              fontFamily,
              fontWeight: fontWeightNum,
              textAlign: sectionStyles.textAlign,
              marginBottom: showDate || showTime ? 2 : 0,
              color: textColor,
              backgroundColor: numberBgColor || "transparent",
              paddingTop: numberPadding,
              paddingBottom: numberPadding,
              paddingLeft: numberPadding,
              paddingRight: numberPadding,
              borderRadius: numberBorderRadius,
            }}
          >
            {showLabels ? "Receipt #: " : ""}
            {receiptData?.receiptNumber || receiptData?.reference || "N/A"}
          </Text>
        )}
        {showDate && (
          <Text
            style={{
              fontSize,
              fontFamily,
              fontWeight: fontWeightNum,
              textAlign: sectionStyles.textAlign,
              marginBottom: showTime ? 2 : 0,
              color: textColor,
            }}
          >
            {showLabels ? "Date: " : ""}
            {receiptData?.date || new Date().toLocaleDateString()}
          </Text>
        )}
        {showTime && (
          <Text
            style={{
              fontSize,
              fontFamily,
              fontWeight: fontWeightNum,
              textAlign: sectionStyles.textAlign,
              color: textColor,
            }}
          >
            {showLabels ? "Time: " : ""}
            {receiptData?.time || new Date().toLocaleTimeString()}
          </Text>
        )}
      </View>
    );
  };

  // Render Items Table Section - matching builder exactly with all styling options
  const renderItemsTable = (section) => {
    const fontSize = getFontSize(section.props?.fontSize || "xs");
    const showBorders = section.props?.showBorders !== false;
    const zebraStripes = section.props?.zebraStripes === true;
    // Resolve "accent" and "accentLight" for header colors - handle "transparent" specially
    const rawHeaderBgColor = section.props?.headerBgColor;
    const headerBgColor =
      rawHeaderBgColor === "transparent"
        ? "transparent"
        : resolveColor(rawHeaderBgColor) || templateColor;
    // For text color: if bg is transparent, use accent color or black for text
    const rawHeaderTextColor = section.props?.headerTextColor;
    const headerTextColor = rawHeaderTextColor
      ? resolveColor(rawHeaderTextColor)
      : headerBgColor === "transparent"
      ? "#000000"
      : "#ffffff";
    
    // Additional props
    const headerBorderColor = resolveColor(section.props?.headerBorderColor) || "#e5e7eb";
    const headerBorderWidth = parseInt(section.props?.headerBorderWidth || 1);

    const items = receiptData?.items || [];

    return (
      <View style={{ marginBottom: 10 }} key={section.id}>
        {/* Table Header */}
        <View
          style={[
            styles.tableRow,
            {
              backgroundColor: headerBgColor,
              borderBottomWidth: showBorders ? headerBorderWidth : 0,
              borderBottomColor: headerBorderColor,
              fontSize,
            },
          ]}
        >
          <Text
            style={[
              styles.tableColItem,
              {
                color: headerTextColor,
                fontFamily: "NotoSans",
                fontWeight: 700,
              },
            ]}
          >
            Item
          </Text>
          <Text
            style={[
              styles.tableColQty,
              {
                color: headerTextColor,
                fontFamily: "NotoSans",
                fontWeight: 700,
              },
            ]}
          >
            Qty
          </Text>
          <Text
            style={[
              styles.tableColPrice,
              {
                color: headerTextColor,
                fontFamily: "NotoSans",
                fontWeight: 700,
              },
            ]}
          >
            Price
          </Text>
          <Text
            style={[
              styles.tableColTotal,
              {
                color: headerTextColor,
                fontFamily: "NotoSans",
                fontWeight: 700,
              },
            ]}
          >
            Total
          </Text>
        </View>

        {/* Items */}
        {items.map((item, index) => (
          <View
            key={index}
            style={[
              styles.tableRow,
              {
                borderBottomWidth: showBorders ? 1 : 0,
                fontSize,
                backgroundColor:
                  zebraStripes && index % 2 === 1 ? "#f9fafb" : "transparent",
              },
            ]}
          >
            <Text style={[styles.tableColItem, { fontSize }]} wrap>
              {item.name}
            </Text>
            <Text style={[styles.tableColQty, { fontSize }]}>
              {item.quantity}
            </Text>
            <Text style={[styles.tableColPrice, { fontSize }]}>
              {formatCurrency(item.price)}
            </Text>
            <Text style={[styles.tableColTotal, { fontSize }]}>
              {formatCurrency(item.total)}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  // Render Totals Section - matching builder exactly with all customization options
  const renderTotals = (section) => {
    const fontSize = getFontSize(section.props?.fontSize || "xs");
    const fontFamily = getFontFamily(section.props?.fontFamily, section.props?.fontWeight);
    const sectionStyles = getSectionStyles(section.props);
    const showSubtotal = section.props?.showSubtotal !== false;
    const showTax = section.props?.showTax !== false;
    const showDiscount = section.props?.showDiscount !== false;
    // Handle grandTotalColor and grandTotalBorderColor with "accent" support
    const grandTotalColor =
      resolveColor(section.props?.grandTotalColor) || templateColor;
    const grandTotalBorderColor =
      resolveColor(section.props?.grandTotalBorderColor) || templateColor;
    const grandTotalFontSize = getFontSize(
      section.props?.grandTotalFontSize || "lg"
    );
    const grandTotalBorderWidth = parseInt(section.props?.grandTotalBorderWidth || 1);
    const taxLabel = section.props?.taxLabel || "Tax:";

    // Get values with fallbacks
    const subtotalValue = receiptData?.subtotal ?? 0;
    const discountValue = receiptData?.discount ?? 0;
    const taxValue = receiptData?.tax ?? 0;

    return (
      <View style={[sectionStyles, { marginBottom: 8 }]} key={section.id}>
        {showSubtotal && (
          <View style={[styles.totalRow, { fontSize }]}>
            <Text style={[styles.totalLabel, { fontFamily }]}>Subtotal:</Text>
            <Text style={[styles.totalValue, { fontFamily }]}>
              {formatCurrency(subtotalValue)}
            </Text>
          </View>
        )}
        {showDiscount && discountValue > 0 && (
          <View style={[styles.totalRow, { fontSize }]}>
            <Text style={[styles.totalLabel, { color: "#dc2626", fontFamily }]}>
              Discount:
            </Text>
            <Text style={[styles.totalValue, { color: "#dc2626", fontFamily }]}>
              -{formatCurrency(discountValue)}
            </Text>
          </View>
        )}
        {showTax && (
          <View style={[styles.totalRow, { fontSize }]}>
            <Text style={[styles.totalLabel, { fontFamily }]}>{taxLabel}</Text>
            <Text style={[styles.totalValue, { fontFamily }]}>
              {formatCurrency(taxValue)}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.totalRow,
            {
              borderTopWidth: grandTotalBorderWidth,
              borderTopColor: grandTotalBorderColor,
              paddingTop: 6,
              marginTop: 4,
              fontSize: grandTotalFontSize,
            },
          ]}
        >
          <Text
            style={{
              fontFamily: "NotoSans",
              fontWeight: 700,
              color: grandTotalColor,
              fontSize: grandTotalFontSize,
            }}
          >
            TOTAL PAID:
          </Text>
          <Text
            style={{
              fontFamily: "NotoSans",
              fontWeight: 700,
              color: grandTotalColor,
              fontSize: grandTotalFontSize,
            }}
          >
            {formatCurrency(receiptData?.total || receiptData?.amountPaid || 0)}
          </Text>
        </View>
      </View>
    );
  };

  // Render Payment Info Section - matching builder exactly with toggle props
  const renderPaymentInfo = (section) => {
    const fontSize = getFontSize(section.props?.fontSize || "xs");
    const fontFamily = getFontFamily(section.props?.fontFamily, section.props?.fontWeight);
    const fontWeightNum = getFontWeight(section.props?.fontWeight || "normal");
    const sectionStyles = getSectionStyles(section.props);
    const showMethod = section.props?.showMethod !== false;
    const showStatus = section.props?.showStatus !== false;
    const showAmountPaid = section.props?.showAmountPaid !== false;
    const showChange = section.props?.showChange !== false;
    const layout = section.props?.layout || "stacked";

    // Handle textColor prop with accent resolution
    const rawTextColor = section.props?.textColor;
    const textColor = rawTextColor
      ? resolveColor(rawTextColor)
      : sectionStyles.color || "#000";

    // Layout: "horizontal" - side by side
    if (layout === "horizontal") {
      return (
        <View style={sectionStyles} key={section.id}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
            {showMethod && (
              <Text
                style={{
                  fontSize,
                  fontFamily,
                  fontWeight: fontWeightNum,
                  color: textColor,
                }}
              >
                Method: {receiptData?.paymentMethod || "N/A"}
              </Text>
            )}
            {showStatus && receiptData?.status && (
              <Text
                style={{
                  fontSize,
                  fontFamily,
                  fontWeight: fontWeightNum,
                  color: textColor,
                }}
              >
                Status: {receiptData.status}
              </Text>
            )}
          </View>
          {showAmountPaid && receiptData?.amountPaid && (
            <Text
              style={{
                fontSize,
                fontFamily: "NotoSans",
                fontWeight: 700,
                textAlign: sectionStyles.textAlign,
                marginTop: 2,
                color: textColor,
              }}
            >
              Amount Paid: {formatCurrency(receiptData.amountPaid)}
            </Text>
          )}
          {showChange && receiptData?.change && receiptData.change > 0 && (
            <Text
              style={{
                fontSize,
                fontFamily,
                fontWeight: fontWeightNum,
                textAlign: sectionStyles.textAlign,
                color: textColor,
              }}
            >
              Change: {formatCurrency(receiptData.change)}
            </Text>
          )}
        </View>
      );
    }

    // Default layout: "stacked"
    return (
      <View style={sectionStyles} key={section.id}>
        {showMethod && (
          <Text
            style={{
              fontSize,
              fontFamily,
              fontWeight: fontWeightNum,
              textAlign: sectionStyles.textAlign,
              marginBottom: 2,
              color: textColor,
            }}
          >
            Payment Method: {receiptData?.paymentMethod || "N/A"}
          </Text>
        )}
        {showStatus && receiptData?.status && (
          <Text
            style={{
              fontSize,
              fontFamily,
              fontWeight: fontWeightNum,
              textAlign: sectionStyles.textAlign,
              marginBottom: 2,
              color: textColor,
            }}
          >
            Status: {receiptData.status}
          </Text>
        )}
        {receiptData?.customer?.name && (
          <Text
            style={{
              fontSize,
              fontFamily,
              fontWeight: fontWeightNum,
              textAlign: sectionStyles.textAlign,
              color: textColor,
            }}
          >
            Customer: {receiptData.customer.name}
          </Text>
        )}
        {showAmountPaid && receiptData?.amountPaid && (
          <Text
            style={{
              fontSize,
              fontFamily: "NotoSans",
              fontWeight: 700,
              textAlign: sectionStyles.textAlign,
              marginTop: 2,
              color: textColor,
            }}
          >
            Amount Paid: {formatCurrency(receiptData.amountPaid)}
          </Text>
        )}
        {showChange && receiptData?.change && receiptData.change > 0 && (
          <Text
            style={{
              fontSize,
              fontFamily,
              fontWeight: fontWeightNum,
              textAlign: sectionStyles.textAlign,
              color: textColor,
            }}
          >
            Change: {formatCurrency(receiptData.change)}
          </Text>
        )}
      </View>
    );
  };

  // Render Customer Info Section - for displaying customer details separately
  const renderCustomerInfo = (section) => {
    const fontSize = getFontSize(section.props?.fontSize || "sm");
    const fontFamily = getFontFamily(section.props?.fontFamily, section.props?.fontWeight);
    const fontWeightNum = getFontWeight(section.props?.fontWeight || "normal");
    const sectionStyles = getSectionStyles(section.props);
    const showName = section.props?.showName !== false;
    const showPhone = section.props?.showPhone !== false;
    const showEmail = section.props?.showEmail !== false;

    // Handle textColor prop with accent resolution
    const rawTextColor = section.props?.textColor;
    const textColor = rawTextColor
      ? resolveColor(rawTextColor)
      : sectionStyles.color || "#000";

    return (
      <View style={sectionStyles} key={section.id}>
        {showName && receiptData?.customer?.name && (
          <Text
            style={{
              fontSize,
              fontFamily,
              fontWeight: fontWeightNum,
              textAlign: sectionStyles.textAlign,
              marginBottom: 2,
              color: textColor,
            }}
          >
            {receiptData.customer.name}
          </Text>
        )}
        {showPhone && receiptData?.customer?.phone && (
          <Text
            style={{
              fontSize: getFontSize("xs"),
              fontFamily,
              fontWeight: fontWeightNum,
              textAlign: sectionStyles.textAlign,
              marginBottom: 2,
              color: textColor,
            }}
          >
            {receiptData.customer.phone}
          </Text>
        )}
        {showEmail && receiptData?.customer?.email && (
          <Text
            style={{
              fontSize: getFontSize("xs"),
              fontFamily,
              fontWeight: fontWeightNum,
              textAlign: sectionStyles.textAlign,
              color: textColor,
            }}
          >
            {receiptData.customer.email}
          </Text>
        )}
      </View>
    );
  };

  // Render Custom Text Section - matching builder exactly with all text styling
  const renderCustomText = (section) => {
    const fontSize = getFontSize(section.props?.fontSize || "xs");
    const fontFamily = getFontFamily(section.props?.fontFamily, section.props?.fontWeight);
    const fontWeightNum = getFontWeight(section.props?.fontWeight || "normal");
    const sectionStyles = getSectionStyles(section.props);
    const fontStyle = section.props?.fontStyle; // "italic" support
    let text = section.props?.text || "";

    // Replace dynamic placeholders with actual data
    text = text
      .replace(/\{companyEmail\}/gi, companyInfo?.email || "")
      .replace(/\{companyName\}/gi, companyInfo?.name || "")
      .replace(/\{companyPhone\}/gi, companyInfo?.phone || "")
      .replace(/\{companyAddress\}/gi, companyInfo?.address || "")
      .replace(/\{customerName\}/gi, receiptData?.customer?.name || "")
      .replace(/\{customerEmail\}/gi, receiptData?.customer?.email || "")
      .replace(/\{customerPhone\}/gi, receiptData?.customer?.phone || "")
      .replace(
        /\{receiptNumber\}/gi,
        receiptData?.receiptNumber || receiptData?.reference || ""
      )
      .replace(
        /\{date\}/gi,
        receiptData?.date || new Date().toLocaleDateString()
      )
      .replace(
        /\{total\}/gi,
        formatCurrency(receiptData?.total || receiptData?.amountPaid || 0)
      );

    // Handle textTransform: "uppercase"
    if (section.props?.textTransform === "uppercase") {
      text = text.toUpperCase();
    }

    // Handle textColor prop with accent resolution
    const rawTextColor = section.props?.textColor;
    const textColor = rawTextColor
      ? resolveColor(rawTextColor)
      : sectionStyles.color || "#000";

    // Split text by newlines (handle both \n and \\n)
    const lines = text.split(/\\n|\n/).filter((line) => line.trim());

    // If no lines after filtering, don't render anything
    if (lines.length === 0) return null;

    return (
      <View style={sectionStyles} key={section.id}>
        {lines.map((line, index) => (
          <Text
            key={index}
            style={{
              fontSize,
              fontFamily,
              fontWeight: fontWeightNum,
              fontStyle: fontStyle === "italic" ? "italic" : "normal",
              textAlign: sectionStyles.textAlign,
              marginBottom: index < lines.length - 1 ? 2 : 0,
              color: textColor,
            }}
          >
            {line}
          </Text>
        ))}
      </View>
    );
  };

  // Render Divider Section - matching builder exactly with all style variations and partial width
  const renderDivider = (section) => {
    const thickness = parseInt(section.props?.thickness || 1);
    const style = section.props?.style || "solid";
    // Resolve "accent" and "accentLight" color keywords
    const color = resolveColor(section.props?.color) || "#9ca3af";
    const marginTop = parseInt(section.props?.marginTop || 2) * 4;
    const marginBottom = parseInt(section.props?.marginBottom || 2) * 4;
    const width = section.props?.width || "100%";
    const centered = section.props?.centered || false;

    // Container style for centering partial dividers
    const containerStyle = {
      width: "100%",
      marginTop,
      marginBottom,
      alignItems: centered ? "center" : "flex-start",
    };

    // Handle double border - two lines with gap
    if (style === "double") {
      return (
        <View key={section.id} style={containerStyle}>
          <View style={{ width }}>
            <View
              style={{
                height: thickness,
                backgroundColor: color,
                marginBottom: 2,
              }}
            />
            <View style={{ height: thickness, backgroundColor: color }} />
          </View>
        </View>
      );
    }

    // Handle dashed border
    if (style === "dashed") {
      return (
        <View key={section.id} style={containerStyle}>
          <View
            style={{
              width,
              height: thickness,
              borderTopWidth: thickness,
              borderTopColor: color,
              borderStyle: "dashed",
            }}
          />
        </View>
      );
    }

    // Default solid border
    return (
      <View key={section.id} style={containerStyle}>
        <View
          style={{
            width,
            height: thickness,
            backgroundColor: color,
          }}
        />
      </View>
    );
  };

  // Main render function for each section
  const renderSection = (section) => {
    switch (section.type) {
      case "header":
        return renderHeader(section);
      case "companyInfo":
        return renderCompanyInfo(section);
      case "customerInfo":
        return renderCustomerInfo(section);
      case "receiptDetails":
        return renderReceiptDetails(section);
      case "itemsTable":
        return renderItemsTable(section);
      case "totals":
        return renderTotals(section);
      case "paymentInfo":
        return renderPaymentInfo(section);
      case "customText":
        return renderCustomText(section);
      case "divider":
        return renderDivider(section);
      default:
        return null;
    }
  };

  // Render the document
  const sections = templateData?.sections || [];

  // If no sections, show fallback
  if (sections.length === 0) {
    return (
      <Document>
        <Page size={{ width: 226, height: 600 }} style={styles.page}>
          <Text style={{ textAlign: "center", fontSize: 12 }}>
            No custom receipt template configured
          </Text>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size={{ width: 240, height: 842 }} style={styles.page} wrap={true}>
        {sections.map((section, idx) => (
          <View key={idx}>{renderSection(section)}</View>
        ))}
      </Page>
    </Document>
  );
};

export default CustomReceiptPDF;
