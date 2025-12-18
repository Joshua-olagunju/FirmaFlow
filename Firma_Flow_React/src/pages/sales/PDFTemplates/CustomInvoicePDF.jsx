import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import "./fontConfig"; // Register custom fonts

// Helper to get font size from template size string
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

// Helper to get padding value
const getPadding = (padding) => {
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
  return paddingMap[padding] || 16;
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

// Helper to get justify content based on alignment
const getJustifyContent = (alignment) => {
  switch (alignment) {
    case "center":
      return "center";
    case "right":
      return "flex-end";
    default:
      return "flex-start";
  }
};

// Helper to get logo dimensions based on size
const getLogoDimensions = (size) => {
  const sizeMap = {
    sm: { width: 40, height: 32 },
    md: { width: 60, height: 48 },
    lg: { width: 80, height: 64 },
    xl: { width: 100, height: 80 },
  };
  return sizeMap[size] || sizeMap.md;
};

// Helper to lighten a color (for backgrounds)
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

// Create dynamic styles based on custom template data
const createStyles = (templateData) => {
  const color = templateData?.color || "#667eea";
  const docBorder = templateData?.documentBorder;

  return StyleSheet.create({
    page: {
      padding: docBorder?.enabled ? parseInt(docBorder.margin || 20) : 40,
      fontFamily: "NotoSans",
      fontSize: 10,
      backgroundColor: "#ffffff",
      ...(docBorder?.enabled && {
        borderWidth: parseInt(docBorder.width || 1),
        borderStyle: docBorder.style || "solid",
        borderColor: docBorder.color || "#000000",
        borderRadius: parseInt(docBorder.radius || 0),
      }),
    },
    section: {
      marginBottom: 15,
    },
    // Table styles
    table: {
      width: "100%",
      marginBottom: 15,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: `${color}15`,
      borderBottomWidth: 2,
      borderBottomColor: color,
      padding: 8,
      fontFamily: "NotoSans",
      fontWeight: "bold",
      fontSize: 9,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
      padding: 8,
      fontSize: 9,
    },
    tableColDescription: {
      flex: 3,
    },
    tableColQty: {
      flex: 1,
      textAlign: "center",
    },
    tableColRate: {
      flex: 1.5,
      textAlign: "right",
    },
    tableColAmount: {
      flex: 1.5,
      textAlign: "right",
      fontFamily: "NotoSans",
      fontWeight: "bold",
    },
    // Totals
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 4,
      fontSize: 10,
    },
    totalLabel: {
      color: "#666",
    },
    totalValue: {
      fontFamily: "NotoSans",
      fontWeight: "bold",
      color: "#333",
    },
    grandTotal: {
      borderTopWidth: 1,
      borderTopColor: color,
      paddingTop: 8,
      marginTop: 5,
    },
    grandTotalText: {
      fontFamily: "NotoSans",
      fontWeight: "bold",
      color: color,
      fontSize: 12,
    },
  });
};

const CustomInvoicePDF = ({
  templateData,
  companyInfo,
  invoiceData,
  color: propColor,
}) => {
  const templateColor = templateData?.color || propColor || "#667eea";
  const styles = createStyles(templateData);

  // Debug logging
  console.log("=== CustomInvoicePDF Debug ===");
  console.log("Template Data:", templateData);
  console.log("Sections:", templateData?.sections);
  console.log("Invoice Data:", invoiceData);
  console.log("Items:", invoiceData?.items);
  console.log("==============================");

  // Use formatCurrency from invoiceData which includes proper currency
  const formatCurrency =
    invoiceData?.formatCurrency ||
    ((amount) => {
      const currencyMap = {
        NGN: "₦",
        USD: "$",
        EUR: "€",
        GBP: "£",
        JPY: "¥",
        CNY: "¥",
        INR: "₹",
        ZAR: "R",
        KES: "KSh",
        GHS: "₵",
      };
      const symbol =
        currencyMap[invoiceData?.currency] ||
        invoiceData?.currency + " " ||
        "₦";
      const formatted = parseFloat(amount || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return `${symbol}${formatted}`;
    });

  // Helper to get section styles from props
  const getSectionStyles = (props) => {
    const baseStyles = {
      padding: getPadding(props?.padding),
      textAlign: getTextAlign(props?.alignment),
      alignItems: getFlexAlign(props?.alignment),
    };

    // Background color - handle 'accent' and 'accentLight' values
    if (props?.backgroundColor) {
      if (props.backgroundColor === "accent") {
        baseStyles.backgroundColor = templateColor;
      } else if (props.backgroundColor === "accentLight") {
        baseStyles.backgroundColor = lightenColor(templateColor, 0.85);
      } else if (props.backgroundColor !== "transparent") {
        baseStyles.backgroundColor = props.backgroundColor;
      }
    }

    // Border
    if (props?.borderWidth && parseInt(props.borderWidth) > 0) {
      baseStyles.borderWidth = parseInt(props.borderWidth);
      baseStyles.borderStyle = props?.borderStyle || "solid";
      baseStyles.borderColor = props?.borderColor || "#000000";
      baseStyles.borderRadius = 4;
    }

    return baseStyles;
  };

  // Render Accent Bar Section (for elegant template)
  const renderAccentBar = (section) => {
    const height = (parseInt(section.props?.height) || 2) * 4;

    return (
      <View
        style={{
          width: "100%",
          height: height,
          backgroundColor: templateColor,
          marginBottom: section.props?.position === "top" ? 10 : 0,
          marginTop: section.props?.position === "bottom" ? 10 : 0,
        }}
      />
    );
  };

  // Render Diamond Divider Section (for elegant template)
  const renderDiamondDivider = (section) => {
    const marginTop = (parseInt(section.props?.marginTop) || 8) * 4;
    const marginBottom = (parseInt(section.props?.marginBottom) || 8) * 4;
    const showDiamond = section.props?.showDiamond !== false;

    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop,
          marginBottom,
        }}
      >
        <View
          style={{
            flex: 1,
            height: 1,
            backgroundColor: lightenColor(templateColor, 0.7),
          }}
        />
        {showDiamond && (
          <View
            style={{
              width: 8,
              height: 8,
              backgroundColor: templateColor,
              transform: "rotate(45deg)",
              marginHorizontal: 10,
            }}
          />
        )}
        <View
          style={{
            flex: 1,
            height: 1,
            backgroundColor: lightenColor(templateColor, 0.7),
          }}
        />
      </View>
    );
  };

  // Render Three Column Info Section (for elegant template)
  const renderThreeColumnInfo = (section) => {
    const fontSize = getFontSize(section.props?.fontSize || "xs");
    const bgColor = section.props?.backgroundColor || "#fafafa";
    const hasLeftAccent = section.props?.borderStyle === "leftAccent";

    const columnStyle = {
      width: "32%",
      padding: 12,
      backgroundColor: bgColor === "transparent" ? undefined : bgColor,
      borderRadius: 4,
      ...(hasLeftAccent && {
        borderLeftWidth: 3,
        borderLeftColor: templateColor,
      }),
    };

    return (
      <View
        style={{
          ...styles.section,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {/* From Section */}
        <View style={columnStyle}>
          <Text
            style={{
              fontSize: fontSize,
              fontFamily: "NotoSans",
              fontWeight: "bold",
              color: templateColor,
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            From
          </Text>
          <Text
            style={{
              fontSize: fontSize + 1,
              fontFamily: "NotoSans",
              fontWeight: "bold",
              color: "#333",
              marginBottom: 4,
            }}
          >
            {companyInfo?.name || "Company Name"}
          </Text>
          <Text style={{ fontSize: fontSize, color: "#666", lineHeight: 1.4 }}>
            {companyInfo?.address}
          </Text>
          <Text style={{ fontSize: fontSize, color: "#666" }}>
            {companyInfo?.phone}
          </Text>
        </View>

        {/* Bill To Section */}
        <View style={columnStyle}>
          <Text
            style={{
              fontSize: fontSize,
              fontFamily: "NotoSans",
              fontWeight: "bold",
              color: templateColor,
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Bill To
          </Text>
          <Text
            style={{
              fontSize: fontSize + 1,
              fontFamily: "NotoSans",
              fontWeight: "bold",
              color: "#333",
              marginBottom: 4,
            }}
          >
            {invoiceData?.customer?.name}
          </Text>
          <Text style={{ fontSize: fontSize, color: "#666", lineHeight: 1.4 }}>
            {invoiceData?.customer?.address}
          </Text>
        </View>

        {/* Details Section */}
        <View style={columnStyle}>
          <Text
            style={{
              fontSize: fontSize,
              fontFamily: "NotoSans",
              fontWeight: "bold",
              color: templateColor,
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Details
          </Text>
          <View style={{ marginBottom: 6 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ fontSize: fontSize, color: "#666" }}>
                Invoice #:
              </Text>
              <Text
                style={{
                  fontSize: fontSize,
                  fontFamily: "NotoSans",
                  fontWeight: "bold",
                  color: "#333",
                }}
              >
                {invoiceData?.invoiceNumber}
              </Text>
            </View>
          </View>
          <View style={{ marginBottom: 6 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ fontSize: fontSize, color: "#666" }}>
                Issue Date:
              </Text>
              <Text
                style={{
                  fontSize: fontSize,
                  fontFamily: "NotoSans",
                  fontWeight: "bold",
                  color: "#333",
                }}
              >
                {invoiceData?.date}
              </Text>
            </View>
          </View>
          <View style={{ marginBottom: 6 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ fontSize: fontSize, color: "#666" }}>
                Due Date:
              </Text>
              <Text
                style={{
                  fontSize: fontSize,
                  fontFamily: "NotoSans",
                  fontWeight: "bold",
                  color: templateColor,
                }}
              >
                {invoiceData?.dueDate}
              </Text>
            </View>
          </View>
          {section.props?.showStatus && (
            <View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: fontSize, color: "#666" }}>
                  Status:
                </Text>
                <View
                  style={{
                    backgroundColor: lightenColor(templateColor, 0.8),
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: fontSize,
                      fontFamily: "NotoSans",
                      fontWeight: "bold",
                      color: templateColor,
                    }}
                  >
                    {invoiceData?.status || "Pending"}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Render Modern Totals Section (for elegant template)
  const renderModernTotals = (section) => {
    const fontSize = getFontSize(section.props?.fontSize || "base");
    const alignment = section.props?.alignment || "right";
    const bgColor = section.props?.backgroundColor || "#fafafa";
    const grandTotalBgColor =
      section.props?.grandTotalBgColor === "accent"
        ? templateColor
        : section.props?.grandTotalBgColor || templateColor;
    const isBordered = section.props?.bordered;

    return (
      <View
        style={{
          ...styles.section,
          flexDirection: "row",
          justifyContent: getJustifyContent(alignment),
        }}
      >
        <View
          style={{
            width: 220,
            borderRadius: 6,
            overflow: "hidden",
            ...(isBordered && {
              borderWidth: 1,
              borderColor: lightenColor(templateColor, 0.7),
            }),
          }}
        >
          {/* Subtotals section */}
          <View
            style={{
              padding: 12,
              backgroundColor: bgColor === "transparent" ? undefined : bgColor,
            }}
          >
            {section.props?.showSubtotal !== false && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: fontSize, color: "#666" }}>
                  Subtotal
                </Text>
                <Text
                  style={{
                    fontSize: fontSize,
                    fontFamily: "NotoSans",
                    fontWeight: "bold",
                    color: "#333",
                  }}
                >
                  {formatCurrency(invoiceData?.subtotal)}
                </Text>
              </View>
            )}
            {section.props?.showDiscount !== false &&
              (invoiceData?.discount > 0 ||
                invoiceData?.discount_amount > 0) && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontSize: fontSize, color: "#666" }}>
                    Discount
                  </Text>
                  <Text
                    style={{
                      fontSize: fontSize,
                      fontFamily: "NotoSans",
                      fontWeight: "bold",
                      color: "#dc2626",
                    }}
                  >
                    -
                    {formatCurrency(
                      invoiceData?.discount || invoiceData?.discount_amount
                    )}
                  </Text>
                </View>
              )}
            {section.props?.showTax && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: fontSize, color: "#666" }}>
                  Tax{" "}
                  {invoiceData?.tax_rate ? `(${invoiceData.tax_rate}%)` : ""}
                </Text>
                <Text
                  style={{
                    fontSize: fontSize,
                    fontFamily: "NotoSans",
                    fontWeight: "bold",
                    color: "#333",
                  }}
                >
                  {formatCurrency(
                    invoiceData?.tax || invoiceData?.tax_amount || 0
                  )}
                </Text>
              </View>
            )}
          </View>
          {/* Grand Total */}
          <View
            style={{
              padding: 12,
              backgroundColor: grandTotalBgColor,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: fontSize + 2,
                fontFamily: "NotoSans",
                fontWeight: "bold",
                color: "#ffffff",
              }}
            >
              Total Due
            </Text>
            <Text
              style={{
                fontSize: fontSize + 4,
                fontFamily: "NotoSans",
                fontWeight: "bold",
                color: "#ffffff",
              }}
            >
              {formatCurrency(invoiceData?.total)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Render Footer Section (for elegant template)
  const renderFooter = (section) => {
    const fontSize = getFontSize(section.props?.fontSize || "sm");
    const alignment = section.props?.alignment || "center";

    return (
      <View
        style={{
          ...styles.section,
          paddingTop: 15,
          borderTopWidth: 1,
          borderTopColor: lightenColor(templateColor, 0.7),
          alignItems: getFlexAlign(alignment),
        }}
      >
        {section.props?.showThankYou !== false && (
          <Text
            style={{
              fontSize: fontSize,
              color: "#666",
              fontStyle: "italic",
              textAlign: alignment,
              marginBottom: 8,
            }}
          >
            Thank you for your business!
          </Text>
        )}
        {section.props?.showDecorative && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 8,
            }}
          >
            <View
              style={{
                width: 30,
                height: 1,
                backgroundColor: templateColor,
              }}
            />
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: templateColor,
                marginHorizontal: 8,
              }}
            />
            <View
              style={{
                width: 30,
                height: 1,
                backgroundColor: templateColor,
              }}
            />
          </View>
        )}
      </View>
    );
  };

  // Render Header Section
  const renderHeader = (section) => {
    const sectionStyles = getSectionStyles(section.props);
    const fontSize = getFontSize(section.props?.fontSize || "2xl");
    const isBold = section.props?.fontWeight === "bold";
    const alignment = section.props?.alignment || "left";
    const flexAlign = getFlexAlign(alignment);
    const logoDimensions = getLogoDimensions(section.props?.logoSize || "md");

    // Check if header has dark background
    const hasDarkBg =
      section.props?.backgroundColor &&
      section.props.backgroundColor !== "transparent" &&
      section.props.backgroundColor !== "#ffffff" &&
      section.props.backgroundColor !== "#f9fafb" &&
      section.props.backgroundColor !== "#f3f4f6";

    const textColor = hasDarkBg ? "#ffffff" : templateColor;

    return (
      <View
        style={{ ...styles.section, ...sectionStyles, alignItems: flexAlign }}
      >
        {section.props?.showLogo !== false && companyInfo?.logo && (
          <Image
            src={companyInfo.logo}
            style={{
              width: logoDimensions.width,
              height: logoDimensions.height,
              objectFit: "contain",
              marginBottom: 10,
            }}
            cache={false}
          />
        )}
        <Text
          style={{
            fontSize: fontSize,
            fontFamily: "NotoSans",
            fontWeight: isBold ? "bold" : "normal",
            color: textColor,
            marginBottom: 5,
            textAlign: alignment,
          }}
        >
          INVOICE
        </Text>
        {section.props?.showInvoiceBadge && (
          <View
            style={{
              backgroundColor: lightenColor(templateColor, 0.85),
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 4,
              marginTop: 5,
            }}
          >
            <Text
              style={{
                fontSize: fontSize - 6,
                fontFamily: "NotoSans",
                fontWeight: "bold",
                color: templateColor,
              }}
            >
              #{invoiceData?.invoiceNumber}
            </Text>
          </View>
        )}
        {!section.props?.showInvoiceBadge && (
          <Text
            style={{
              fontSize: 10,
              color: hasDarkBg ? "#ffffff" : "#666",
              textAlign: alignment,
            }}
          >
            #{invoiceData?.invoiceNumber}
          </Text>
        )}
      </View>
    );
  };

  // Render Company Info Section
  const renderCompanyInfo = (section) => {
    const sectionStyles = getSectionStyles(section.props);
    const fontSize = getFontSize(section.props?.fontSize || "base");
    const alignment = section.props?.alignment || "left";
    const flexAlign = getFlexAlign(alignment);

    // Check if section has dark background
    const hasDarkBg =
      section.props?.backgroundColor &&
      section.props.backgroundColor !== "transparent" &&
      section.props.backgroundColor !== "#ffffff" &&
      !section.props.backgroundColor.startsWith("#f") &&
      !section.props.backgroundColor.startsWith("#e") &&
      !section.props.backgroundColor.startsWith("#d");

    const primaryColor = hasDarkBg ? "#ffffff" : "#333";
    const secondaryColor = hasDarkBg ? "#ffffffcc" : "#666";

    return (
      <View
        style={{ ...styles.section, ...sectionStyles, alignItems: flexAlign }}
      >
        <Text
          style={{
            fontSize: fontSize + 4,
            fontFamily: "NotoSans",
            fontWeight: "bold",
            color: primaryColor,
            marginBottom: 4,
            textAlign: alignment,
          }}
        >
          {companyInfo?.name || "Company Name"}
        </Text>
        {section.props?.showAddress !== false && (
          <>
            <Text
              style={{
                fontSize: fontSize - 1,
                color: secondaryColor,
                marginBottom: 2,
                textAlign: alignment,
              }}
            >
              {companyInfo?.address}
            </Text>
            <Text
              style={{
                fontSize: fontSize - 1,
                color: secondaryColor,
                marginBottom: 2,
                textAlign: alignment,
              }}
            >
              {[companyInfo?.city, companyInfo?.state]
                .filter(Boolean)
                .join(", ")}
            </Text>
          </>
        )}
        {section.props?.showPhone !== false && (
          <Text
            style={{
              fontSize: fontSize - 1,
              color: secondaryColor,
              marginBottom: 2,
              textAlign: alignment,
            }}
          >
            {companyInfo?.phone}
          </Text>
        )}
        {section.props?.showEmail !== false && (
          <Text
            style={{
              fontSize: fontSize - 1,
              color: secondaryColor,
              textAlign: alignment,
            }}
          >
            {companyInfo?.email}
          </Text>
        )}
      </View>
    );
  };

  // Render Customer Info Section
  const renderCustomerInfo = (section) => {
    const sectionStyles = getSectionStyles(section.props);
    const fontSize = getFontSize(section.props?.fontSize || "sm");
    const alignment = section.props?.alignment || "left";
    const flexAlign = getFlexAlign(alignment);

    return (
      <View
        style={{ ...styles.section, ...sectionStyles, alignItems: flexAlign }}
      >
        <Text
          style={{
            fontSize: fontSize,
            fontFamily: "NotoSans",
            fontWeight: "bold",
            color: templateColor,
            marginBottom: 5,
            textAlign: alignment,
          }}
        >
          BILL TO:
        </Text>
        <Text
          style={{
            fontSize: fontSize + 1,
            fontFamily: "NotoSans",
            fontWeight: "bold",
            color: "#333",
            marginBottom: 3,
            textAlign: alignment,
          }}
        >
          {invoiceData?.customer?.name}
        </Text>
        <Text
          style={{
            fontSize: fontSize,
            color: "#666",
            marginBottom: 2,
            textAlign: alignment,
          }}
        >
          {invoiceData?.customer?.address}
        </Text>
        <Text
          style={{
            fontSize: fontSize,
            color: "#666",
            marginBottom: 2,
            textAlign: alignment,
          }}
        >
          {invoiceData?.customer?.city}
        </Text>
        <Text
          style={{ fontSize: fontSize, color: "#666", textAlign: alignment }}
        >
          {invoiceData?.customer?.phone}
        </Text>
        {invoiceData?.customer?.email && (
          <Text
            style={{ fontSize: fontSize, color: "#666", textAlign: alignment }}
          >
            {invoiceData?.customer?.email}
          </Text>
        )}
      </View>
    );
  };

  // Render Invoice Details Section
  const renderInvoiceDetails = (section) => {
    const sectionStyles = getSectionStyles(section.props);
    const fontSize = getFontSize(section.props?.fontSize || "sm");
    const alignment = section.props?.alignment || "right";
    const flexAlign = getFlexAlign(alignment);

    return (
      <View
        style={{ ...styles.section, ...sectionStyles, alignItems: flexAlign }}
      >
        {section.props?.showInvoiceNumber !== false && (
          <View style={{ marginBottom: 8 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: getJustifyContent(alignment),
                gap: 10,
              }}
            >
              <Text style={{ fontSize: fontSize, color: "#666" }}>
                Invoice #:
              </Text>
              <Text
                style={{
                  fontSize: fontSize + 1,
                  fontFamily: "NotoSans",
                  fontWeight: "bold",
                  color: "#333",
                }}
              >
                {invoiceData?.invoiceNumber}
              </Text>
            </View>
          </View>
        )}
        {section.props?.showDate !== false && (
          <View style={{ marginBottom: 8 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: getJustifyContent(alignment),
                gap: 10,
              }}
            >
              <Text style={{ fontSize: fontSize, color: "#666" }}>Date:</Text>
              <Text
                style={{
                  fontSize: fontSize + 1,
                  fontFamily: "NotoSans",
                  fontWeight: "bold",
                  color: "#333",
                }}
              >
                {invoiceData?.date}
              </Text>
            </View>
          </View>
        )}
        {section.props?.showDueDate !== false && (
          <View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: getJustifyContent(alignment),
                gap: 10,
              }}
            >
              <Text style={{ fontSize: fontSize, color: "#666" }}>
                Due Date:
              </Text>
              <Text
                style={{
                  fontSize: fontSize + 1,
                  fontFamily: "NotoSans",
                  fontWeight: "bold",
                  color: "#333",
                }}
              >
                {invoiceData?.dueDate}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Render Items Table Section
  const renderItemsTable = (section) => {
    const sectionStyles = getSectionStyles(section.props);
    const fontSize = getFontSize(section.props?.fontSize || "sm");
    const showBorders = section.props?.showBorders !== false;
    const borderColor = section.props?.borderColor || "#e5e7eb";
    const borderWidth = parseInt(section.props?.borderWidth || "1");
    const zebraStripes = section.props?.zebraStripes !== false;

    // Handle header colors - support 'accent' keyword
    let headerBgColor = section.props?.headerBgColor || templateColor;
    if (headerBgColor === "accent") {
      headerBgColor = templateColor;
    } else if (headerBgColor === "transparent") {
      headerBgColor = undefined;
    }

    const headerTextColor = section.props?.headerTextColor || "#ffffff";
    const alternateColors = section.props?.alternateColors || [
      "#fafafa",
      "#ffffff",
    ];

    const items = invoiceData?.items || [];
    console.log("Rendering items table in PDF, items count:", items.length);
    console.log("Items data:", items);

    const tableStyles = {
      width: "100%",
      marginBottom: 15,
      ...(showBorders && {
        borderWidth: borderWidth,
        borderColor: borderColor,
        borderStyle: section.props?.borderStyle || "solid",
      }),
    };

    const headerStyles = {
      flexDirection: "row",
      backgroundColor: headerBgColor,
      borderBottomWidth: 2,
      borderBottomColor: headerBgColor || templateColor,
      padding: 8,
      fontFamily: "NotoSans",
      fontWeight: "bold",
      fontSize: fontSize,
    };

    const getRowStyles = (index) => ({
      flexDirection: "row",
      borderBottomWidth: showBorders ? 1 : 0,
      borderBottomColor: borderColor,
      padding: 8,
      fontSize: fontSize,
      backgroundColor: zebraStripes
        ? index % 2 === 0
          ? alternateColors[1]
          : alternateColors[0]
        : undefined,
    });

    return (
      <View style={{ ...styles.section, ...sectionStyles }}>
        <View style={tableStyles}>
          {/* Table Header */}
          <View style={headerStyles}>
            <Text style={{ flex: 3, color: headerTextColor }}>Description</Text>
            <Text
              style={{ flex: 1, textAlign: "center", color: headerTextColor }}
            >
              Qty
            </Text>
            <Text
              style={{ flex: 1.5, textAlign: "right", color: headerTextColor }}
            >
              Rate
            </Text>
            <Text
              style={{ flex: 1.5, textAlign: "right", color: headerTextColor }}
            >
              Amount
            </Text>
          </View>

          {/* Table Rows */}
          {items.length > 0 ? (
            items.map((item, index) => (
              <View key={index} style={getRowStyles(index)}>
                <Text style={{ flex: 3, color: "#333" }}>
                  {item.description || item.name || "Item"}
                </Text>
                <Text style={{ flex: 1, textAlign: "center", color: "#333" }}>
                  {item.quantity || item.qty || 0}
                </Text>
                <Text style={{ flex: 1.5, textAlign: "right", color: "#333" }}>
                  {formatCurrency(
                    item.rate || item.unit_price || item.price || 0
                  )}
                </Text>
                <Text
                  style={{
                    flex: 1.5,
                    textAlign: "right",
                    fontFamily: "NotoSans",
                    fontWeight: "bold",
                    color: "#333",
                  }}
                >
                  {formatCurrency(
                    item.amount ||
                      item.total ||
                      (item.quantity || item.qty || 0) *
                        (item.rate || item.unit_price || item.price || 0)
                  )}
                </Text>
              </View>
            ))
          ) : (
            <View style={getRowStyles(0)}>
              <Text style={{ flex: 1, textAlign: "center", color: "#666" }}>
                No items
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Render Totals Section
  const renderTotals = (section) => {
    const sectionStyles = getSectionStyles(section.props);
    const fontSize = getFontSize(section.props?.fontSize || "sm");
    const isBold =
      section.props?.fontWeight === "bold" ||
      section.props?.fontWeight === "semibold";
    const alignment = section.props?.alignment || "right";
    const flexAlign = getFlexAlign(alignment);

    return (
      <View
        style={{ ...styles.section, ...sectionStyles, alignItems: flexAlign }}
      >
        <View style={{ width: 200 }}>
          {/* Subtotal */}
          {section.props?.showSubtotal !== false && (
            <View style={styles.totalRow}>
              <Text style={{ fontSize: fontSize, color: "#666" }}>
                Subtotal:
              </Text>
              <Text
                style={{
                  fontSize: fontSize,
                  fontFamily: "NotoSans",
                  fontWeight: isBold ? "bold" : "normal",
                  color: "#333",
                }}
              >
                {formatCurrency(invoiceData?.subtotal)}
              </Text>
            </View>
          )}

          {/* Discount */}
          {section.props?.showDiscount !== false &&
            (invoiceData?.discount > 0 || invoiceData?.discount_amount > 0) && (
              <View style={styles.totalRow}>
                <Text style={{ fontSize: fontSize, color: "#666" }}>
                  Discount:
                </Text>
                <Text
                  style={{
                    fontSize: fontSize,
                    fontFamily: "NotoSans",
                    fontWeight: isBold ? "bold" : "normal",
                    color: "#dc2626",
                  }}
                >
                  -
                  {formatCurrency(
                    invoiceData?.discount || invoiceData?.discount_amount
                  )}
                </Text>
              </View>
            )}

          {/* Tax */}
          {section.props?.showTax && (
            <View style={styles.totalRow}>
              <Text style={{ fontSize: fontSize, color: "#666" }}>
                Tax {invoiceData?.tax_rate ? `(${invoiceData.tax_rate}%)` : ""}:
              </Text>
              <Text
                style={{
                  fontSize: fontSize,
                  fontFamily: "NotoSans",
                  fontWeight: isBold ? "bold" : "normal",
                  color: "#333",
                }}
              >
                {formatCurrency(
                  invoiceData?.tax || invoiceData?.tax_amount || 0
                )}
              </Text>
            </View>
          )}

          {/* Grand Total */}
          <View style={{ ...styles.totalRow, ...styles.grandTotal }}>
            <Text
              style={{
                fontSize: fontSize + 2,
                fontFamily: "NotoSans",
                fontWeight: "bold",
                color: templateColor,
              }}
            >
              TOTAL:
            </Text>
            <Text
              style={{
                fontSize: fontSize + 2,
                fontFamily: "NotoSans",
                fontWeight: "bold",
                color: templateColor,
              }}
            >
              {formatCurrency(invoiceData?.total)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Render Payment Info Section
  const renderPaymentInfo = (section) => {
    const sectionStyles = getSectionStyles(section.props);
    const fontSize = getFontSize(section.props?.fontSize || "xs");
    const alignment = section.props?.alignment || "left";
    const flexAlign = getFlexAlign(alignment);
    const layout = section.props?.layout || "default";
    const hasDashedBorder = section.props?.borderStyle === "dashed";

    // Check if section has dark background
    const hasDarkBg =
      section.props?.backgroundColor &&
      section.props.backgroundColor !== "transparent" &&
      section.props.backgroundColor !== "#ffffff" &&
      !section.props.backgroundColor.startsWith("#f") &&
      !section.props.backgroundColor.startsWith("#e") &&
      !section.props.backgroundColor.startsWith("#d") &&
      section.props.backgroundColor !== "accentLight";

    const titleColor = hasDarkBg ? "#ffffff" : templateColor;
    const labelColor = hasDarkBg ? "#ffffffcc" : "#666";
    const valueColor = hasDarkBg ? "#ffffff" : "#333";

    // Three column layout for elegant style
    if (layout === "threeColumn") {
      return (
        <View
          style={{
            ...styles.section,
            ...sectionStyles,
            ...(hasDashedBorder && {
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: lightenColor(templateColor, 0.6),
              borderRadius: 6,
            }),
          }}
        >
          <Text
            style={{
              fontSize: fontSize + 1,
              fontFamily: "NotoSans",
              fontWeight: "bold",
              color: titleColor,
              marginBottom: 12,
              textAlign: alignment,
            }}
          >
            Payment Information
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            {section.props?.showBankName !== false && (
              <View style={{ width: "30%", paddingRight: 10 }}>
                <Text
                  style={{
                    fontSize: fontSize,
                    color: labelColor,
                    marginBottom: 2,
                  }}
                >
                  Bank
                </Text>
                <Text
                  style={{
                    fontSize: fontSize + 1,
                    fontFamily: "NotoSans",
                    fontWeight: "bold",
                    color: valueColor,
                  }}
                >
                  {companyInfo?.bank_name || "N/A"}
                </Text>
              </View>
            )}
            {section.props?.showAccountNumber !== false && (
              <View style={{ width: "35%", paddingHorizontal: 5 }}>
                <Text
                  style={{
                    fontSize: fontSize,
                    color: labelColor,
                    marginBottom: 2,
                  }}
                >
                  Account Number
                </Text>
                <Text
                  style={{
                    fontSize: fontSize + 1,
                    fontFamily: "NotoSans",
                    fontWeight: "bold",
                    color: valueColor,
                  }}
                >
                  {companyInfo?.bank_account ||
                    companyInfo?.account_number ||
                    "N/A"}
                </Text>
              </View>
            )}
            {section.props?.showAccountName !== false && (
              <View style={{ width: "35%", paddingLeft: 5 }}>
                <Text
                  style={{
                    fontSize: fontSize,
                    color: labelColor,
                    marginBottom: 2,
                  }}
                >
                  Account Name
                </Text>
                <Text
                  style={{
                    fontSize: fontSize + 1,
                    fontFamily: "NotoSans",
                    fontWeight: "bold",
                    color: valueColor,
                  }}
                >
                  {companyInfo?.account_name || "N/A"}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    // Default layout
    return (
      <View
        style={{ ...styles.section, ...sectionStyles, alignItems: flexAlign }}
      >
        <Text
          style={{
            fontSize: fontSize + 1,
            fontFamily: "NotoSans",
            fontWeight: "bold",
            color: titleColor,
            marginBottom: 8,
            textAlign: alignment,
          }}
        >
          Payment Information
        </Text>
        <View
          style={{
            flexDirection: "row",
            justifyContent: alignment === "center" ? "center" : "flex-start",
            width: "100%",
          }}
        >
          {section.props?.showBankName !== false && (
            <View style={{ marginRight: 30 }}>
              <Text style={{ fontSize: fontSize, color: labelColor }}>
                Bank:
              </Text>
              <Text
                style={{
                  fontSize: fontSize,
                  fontFamily: "NotoSans",
                  fontWeight: "bold",
                  color: valueColor,
                }}
              >
                {companyInfo?.bank_name || "N/A"}
              </Text>
            </View>
          )}
          {section.props?.showAccountNumber !== false && (
            <View style={{ marginRight: 30 }}>
              <Text style={{ fontSize: fontSize, color: labelColor }}>
                Account:
              </Text>
              <Text
                style={{
                  fontSize: fontSize,
                  fontFamily: "NotoSans",
                  fontWeight: "bold",
                  color: valueColor,
                }}
              >
                {companyInfo?.bank_account ||
                  companyInfo?.account_number ||
                  "N/A"}
              </Text>
            </View>
          )}
          <View>
            <Text style={{ fontSize: fontSize, color: labelColor }}>Name:</Text>
            <Text
              style={{
                fontSize: fontSize,
                fontFamily: "NotoSans",
                fontWeight: "bold",
                color: valueColor,
              }}
            >
              {companyInfo?.account_name || "N/A"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Render Custom Text Section
  const renderCustomText = (section) => {
    const sectionStyles = getSectionStyles(section.props);
    const fontSize = getFontSize(section.props?.fontSize || "sm");
    const isBold =
      section.props?.fontWeight === "bold" ||
      section.props?.fontWeight === "semibold";
    const isItalic = section.props?.textStyle === "italic";
    const alignment = section.props?.alignment || "center";
    const flexAlign = getFlexAlign(alignment);

    return (
      <View
        style={{ ...styles.section, ...sectionStyles, alignItems: flexAlign }}
      >
        <Text
          style={{
            fontSize: fontSize,
            fontFamily: "NotoSans",
            fontWeight: isBold ? "bold" : "normal",
            fontStyle: isItalic ? "italic" : "normal",
            textDecoration:
              section.props?.textStyle === "underline" ? "underline" : "none",
            color: "#666",
            textAlign: alignment,
          }}
        >
          {section.props?.text || "Custom text"}
        </Text>
      </View>
    );
  };

  // Render Divider Section
  const renderDivider = (section) => {
    const marginTop = (parseInt(section.props?.marginTop) || 4) * 4;
    const marginBottom = (parseInt(section.props?.marginBottom) || 4) * 4;
    const thickness = parseInt(section.props?.thickness || "1");
    const color = section.props?.color || "#e5e7eb";
    const style = section.props?.style || "solid";

    return (
      <View style={{ marginTop, marginBottom }}>
        <View
          style={{
            borderBottomWidth: thickness,
            borderBottomColor: color,
            borderStyle: style === "double" ? "solid" : style,
          }}
        />
        {style === "double" && (
          <View
            style={{
              borderBottomWidth: thickness,
              borderBottomColor: color,
              marginTop: 2,
            }}
          />
        )}
      </View>
    );
  };

  // Main render function for each section
  const renderSection = (section, index) => {
    console.log(`Rendering section ${index}:`, section.type, section);

    switch (section.type) {
      case "header":
        return <View key={index}>{renderHeader(section)}</View>;
      case "companyInfo":
        return <View key={index}>{renderCompanyInfo(section)}</View>;
      case "customerInfo":
        return <View key={index}>{renderCustomerInfo(section)}</View>;
      case "invoiceDetails":
        return <View key={index}>{renderInvoiceDetails(section)}</View>;
      case "itemsTable":
        return <View key={index}>{renderItemsTable(section)}</View>;
      case "totals":
        return <View key={index}>{renderTotals(section)}</View>;
      case "paymentInfo":
        return <View key={index}>{renderPaymentInfo(section)}</View>;
      case "customText":
        return <View key={index}>{renderCustomText(section)}</View>;
      case "divider":
        return <View key={index}>{renderDivider(section)}</View>;
      case "accentBar":
        return <View key={index}>{renderAccentBar(section)}</View>;
      case "diamondDivider":
        return <View key={index}>{renderDiamondDivider(section)}</View>;
      case "threeColumnInfo":
        return <View key={index}>{renderThreeColumnInfo(section)}</View>;
      case "modernTotals":
        return <View key={index}>{renderModernTotals(section)}</View>;
      case "footer":
        return <View key={index}>{renderFooter(section)}</View>;
      default:
        console.log("Unknown section type:", section.type);
        return null;
    }
  };

  // Render the document
  const sections = templateData?.sections || [];

  // If no sections, show fallback
  if (sections.length === 0) {
    console.log("No sections found in template data");
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>No template sections found</Text>
        </Page>
      </Document>
    );
  }

  // Check if template has a footer section
  const hasFooterSection = sections.some((s) => s.type === "footer");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Render all sections */}
        {sections.map((section, index) => renderSection(section, index))}

        {/* Default Footer if no footer section exists */}
        {!hasFooterSection && (
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: "#e5e7eb",
              paddingTop: 15,
              marginTop: 20,
              textAlign: "center",
            }}
          >
            <Text style={{ fontSize: 10, color: "#666" }}>
              Thank you for your business!
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
};

export default CustomInvoicePDF;
