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

// Create dynamic styles based on custom template data
const createStyles = (templateData) => {
  const color = templateData?.color || "#667eea";
  const docBorder = templateData?.documentBorder;

  return StyleSheet.create({
    page: {
      padding: docBorder?.enabled ? parseInt(docBorder.margin || 20) : 40,
      fontFamily: "Open Sans",
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
      fontFamily: "Open Sans",
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
      fontFamily: "Open Sans",
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
      fontFamily: "Open Sans",
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
      fontFamily: "Open Sans",
      fontWeight: "bold",
      color: color,
      fontSize: 12,
    },
    logo: {
      width: 60,
      height: 48,
      objectFit: "contain",
      marginBottom: 10,
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

    // Background color
    if (props?.backgroundColor && props?.backgroundColor !== "transparent") {
      baseStyles.backgroundColor = props.backgroundColor;
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

  // Render Header Section
  const renderHeader = (section) => {
    const sectionStyles = getSectionStyles(section.props);
    const fontSize = getFontSize(section.props?.fontSize || "2xl");
    const isBold = section.props?.fontWeight === "bold";
    const alignment = section.props?.alignment || "left";

    // Determine flex alignment based on alignment prop
    const flexAlign = getFlexAlign(alignment);

    return (
      <View
        style={{ ...styles.section, ...sectionStyles, alignItems: flexAlign }}
      >
        {section.props?.showLogo !== false && companyInfo?.logo && (
          <Image src={companyInfo.logo} style={styles.logo} cache={false} />
        )}
        <Text
          style={{
            fontSize: fontSize,
            fontFamily: "Open Sans",
            fontWeight: isBold ? "bold" : "normal",
            color: templateColor,
            marginBottom: 5,
            textAlign: alignment,
          }}
        >
          INVOICE
        </Text>
        <Text style={{ fontSize: 10, color: "#666", textAlign: alignment }}>
          #{invoiceData?.invoiceNumber}
        </Text>
      </View>
    );
  };

  // Render Company Info Section
  const renderCompanyInfo = (section) => {
    const sectionStyles = getSectionStyles(section.props);
    const fontSize = getFontSize(section.props?.fontSize || "base");
    const alignment = section.props?.alignment || "left";
    const flexAlign = getFlexAlign(alignment);

    return (
      <View
        style={{ ...styles.section, ...sectionStyles, alignItems: flexAlign }}
      >
        <Text
          style={{
            fontSize: fontSize + 4,
            fontFamily: "Open Sans",
            fontWeight: "bold",
            color: "#333",
            marginBottom: 4,
            textAlign: alignment,
          }}
        >
          {companyInfo?.name || "Company Name"}
        </Text>
        <Text
          style={{
            fontSize: fontSize - 1,
            color: "#666",
            marginBottom: 2,
            textAlign: alignment,
          }}
        >
          {companyInfo?.address}
        </Text>
        <Text
          style={{
            fontSize: fontSize - 1,
            color: "#666",
            marginBottom: 2,
            textAlign: alignment,
          }}
        >
          {[companyInfo?.city, companyInfo?.state].filter(Boolean).join(", ")}
        </Text>
        <Text
          style={{
            fontSize: fontSize - 1,
            color: "#666",
            marginBottom: 2,
            textAlign: alignment,
          }}
        >
          {companyInfo?.phone}
        </Text>
        <Text
          style={{
            fontSize: fontSize - 1,
            color: "#666",
            textAlign: alignment,
          }}
        >
          {companyInfo?.email}
        </Text>
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
            fontFamily: "Open Sans",
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
            fontFamily: "Open Sans",
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
        <View style={{ marginBottom: 8 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent:
                alignment === "left"
                  ? "flex-start"
                  : alignment === "center"
                  ? "center"
                  : "flex-end",
              gap: 10,
            }}
          >
            <Text style={{ fontSize: fontSize, color: "#666" }}>
              Invoice #:
            </Text>
            <Text
              style={{
                fontSize: fontSize + 1,
                fontFamily: "Open Sans",
                fontWeight: "bold",
                color: "#333",
              }}
            >
              {invoiceData?.invoiceNumber}
            </Text>
          </View>
        </View>
        <View style={{ marginBottom: 8 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent:
                alignment === "left"
                  ? "flex-start"
                  : alignment === "center"
                  ? "center"
                  : "flex-end",
              gap: 10,
            }}
          >
            <Text style={{ fontSize: fontSize, color: "#666" }}>Date:</Text>
            <Text
              style={{
                fontSize: fontSize + 1,
                fontFamily: "Open Sans",
                fontWeight: "bold",
                color: "#333",
              }}
            >
              {invoiceData?.date}
            </Text>
          </View>
        </View>
        <View>
          <View
            style={{
              flexDirection: "row",
              justifyContent:
                alignment === "left"
                  ? "flex-start"
                  : alignment === "center"
                  ? "center"
                  : "flex-end",
              gap: 10,
            }}
          >
            <Text style={{ fontSize: fontSize, color: "#666" }}>Due Date:</Text>
            <Text
              style={{
                fontSize: fontSize + 1,
                fontFamily: "Open Sans",
                fontWeight: "bold",
                color: "#333",
              }}
            >
              {invoiceData?.dueDate}
            </Text>
          </View>
        </View>
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
      backgroundColor: `${templateColor}15`,
      borderBottomWidth: 2,
      borderBottomColor: templateColor,
      padding: 8,
      fontFamily: "Open Sans",
      fontWeight: "bold",
      fontSize: fontSize,
    };

    const rowStyles = {
      flexDirection: "row",
      borderBottomWidth: showBorders ? 1 : 0,
      borderBottomColor: borderColor,
      padding: 8,
      fontSize: fontSize,
    };

    return (
      <View style={{ ...styles.section, ...sectionStyles }}>
        <View style={tableStyles}>
          {/* Table Header */}
          <View style={headerStyles}>
            <Text style={{ flex: 3, color: "#333" }}>Description</Text>
            <Text style={{ flex: 1, textAlign: "center", color: "#333" }}>
              Qty
            </Text>
            <Text style={{ flex: 1.5, textAlign: "right", color: "#333" }}>
              Rate
            </Text>
            <Text style={{ flex: 1.5, textAlign: "right", color: "#333" }}>
              Amount
            </Text>
          </View>

          {/* Table Rows */}
          {items.length > 0 ? (
            items.map((item, index) => (
              <View key={index} style={rowStyles}>
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
                    fontFamily: "Open Sans",
                    fontWeight: "bold",
                    color: "#333",
                  }}
                >
                  {formatCurrency(
                    item.amount || item.total || item.quantity * item.rate || 0
                  )}
                </Text>
              </View>
            ))
          ) : (
            <View style={rowStyles}>
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
          <View style={styles.totalRow}>
            <Text style={{ fontSize: fontSize, color: "#666" }}>Subtotal:</Text>
            <Text
              style={{
                fontSize: fontSize,
                fontFamily: "Open Sans",
                fontWeight: isBold ? "bold" : "normal",
                color: "#333",
              }}
            >
              {formatCurrency(invoiceData?.subtotal)}
            </Text>
          </View>

          {/* Discount */}
          {(invoiceData?.discount > 0 || invoiceData?.discount_amount > 0) && (
            <View style={styles.totalRow}>
              <Text style={{ fontSize: fontSize, color: "#666" }}>
                Discount:
              </Text>
              <Text
                style={{
                  fontSize: fontSize,
                  fontFamily: "Open Sans",
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
          {(invoiceData?.tax > 0 || invoiceData?.tax_amount > 0) && (
            <View style={styles.totalRow}>
              <Text style={{ fontSize: fontSize, color: "#666" }}>Tax:</Text>
              <Text
                style={{
                  fontSize: fontSize,
                  fontFamily: "Open Sans",
                  fontWeight: isBold ? "bold" : "normal",
                  color: "#333",
                }}
              >
                {formatCurrency(invoiceData?.tax || invoiceData?.tax_amount)}
              </Text>
            </View>
          )}

          {/* Grand Total */}
          <View style={{ ...styles.totalRow, ...styles.grandTotal }}>
            <Text
              style={{
                fontSize: fontSize + 2,
                fontFamily: "Open Sans",
                fontWeight: "bold",
                color: templateColor,
              }}
            >
              TOTAL:
            </Text>
            <Text
              style={{
                fontSize: fontSize + 2,
                fontFamily: "Open Sans",
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

    return (
      <View
        style={{ ...styles.section, ...sectionStyles, alignItems: flexAlign }}
      >
        <Text
          style={{
            fontSize: fontSize + 1,
            fontFamily: "Open Sans",
            fontWeight: "bold",
            color: templateColor,
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
            gap: 30,
          }}
        >
          <View>
            <Text style={{ fontSize: fontSize, color: "#666" }}>Bank:</Text>
            <Text
              style={{
                fontSize: fontSize,
                fontFamily: "Open Sans",
                fontWeight: "bold",
                color: "#333",
              }}
            >
              {companyInfo?.bank_name || "N/A"}
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: fontSize, color: "#666" }}>Account:</Text>
            <Text
              style={{
                fontSize: fontSize,
                fontFamily: "Open Sans",
                fontWeight: "bold",
                color: "#333",
              }}
            >
              {companyInfo?.bank_account ||
                companyInfo?.account_number ||
                "N/A"}
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: fontSize, color: "#666" }}>Name:</Text>
            <Text
              style={{
                fontSize: fontSize,
                fontFamily: "Open Sans",
                fontWeight: "bold",
                color: "#333",
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
            fontFamily: "Open Sans",
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
    const marginTop = parseInt(section.props?.marginTop || "4") * 4;
    const marginBottom = parseInt(section.props?.marginBottom || "4") * 4;
    const thickness = parseInt(section.props?.thickness || "1");
    const color = section.props?.color || "#e5e7eb";

    return (
      <View style={{ marginTop, marginBottom }}>
        <View
          style={{
            borderBottomWidth: thickness,
            borderBottomColor: color,
            borderBottomStyle: section.props?.style || "solid",
          }}
        />
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Render all sections */}
        {sections.map((section, index) => renderSection(section, index))}

        {/* Footer */}
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
      </Page>
    </Document>
  );
};

export default CustomInvoicePDF;
