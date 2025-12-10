import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Create dynamic styles based on custom template data
const createStyles = (templateData) => {
  const color = templateData?.color || "#667eea";

  return StyleSheet.create({
    page: {
      padding: 40,
      fontFamily: "Helvetica",
      fontSize: 10,
      backgroundColor: "#ffffff",
    },
    // Freeform styles
    freeformContainer: {
      position: "relative",
      width: "100%",
      minHeight: "100%",
    },
    freeformElement: {
      position: "absolute",
    },
    // Structured styles
    section: {
      marginBottom: 20,
    },
    header: {
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontFamily: "Helvetica-Bold",
      color: color,
    },
    subtitle: {
      fontSize: 12,
      color: "#666",
    },
    text: {
      fontSize: 10,
      color: "#333",
      marginBottom: 2,
    },
    textBold: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#333",
    },
    logo: {
      width: 60,
      height: 48,
      objectFit: "contain",
      marginBottom: 10,
    },
    // Table
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
      fontFamily: "Helvetica-Bold",
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
      fontFamily: "Helvetica-Bold",
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
      fontFamily: "Helvetica-Bold",
      color: "#333",
    },
    grandTotal: {
      borderTopWidth: 1,
      borderTopColor: color,
      paddingTop: 8,
      marginTop: 5,
    },
    grandTotalText: {
      fontFamily: "Helvetica-Bold",
      color: color,
      fontSize: 12,
    },
  });
};

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

const CustomInvoicePDF = ({
  templateData,
  companyInfo,
  invoiceData,
  color,
}) => {
  const styles = createStyles(templateData);

  // Simple currency formatter that works in PDFs
  const formatCurrency = (amount) => {
    const currencySymbol =
      invoiceData?.currency === "USD"
        ? "$"
        : invoiceData?.currency === "EUR"
        ? "€"
        : "NGN ";
    const formatted = parseFloat(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${currencySymbol}${formatted}`;
  };

  // Render freeform element based on type
  const renderFreeformElement = (element) => {
    const elementColor = templateData?.color || color || "#667eea";
    const fontSize = element.fontSize
      ? getFontSize(element.fontSize)
      : undefined;
    const fontFamily = element.bold ? "Helvetica-Bold" : "Helvetica";
    const textAlign = element.alignment || "left";

    const elementStyle = {
      fontSize,
      fontFamily,
      textAlign,
      color: element.type === "header" ? elementColor : "#333",
    };

    switch (element.type) {
      case "header":
        return (
          <View>
            <Text style={{ ...elementStyle, fontSize: fontSize || 24 }}>
              INVOICE
            </Text>
            <Text style={{ fontSize: 10, color: "#666", marginTop: 5 }}>
              #{invoiceData?.invoiceNumber}
            </Text>
          </View>
        );

      case "companyInfo":
        return (
          <View>
            <Text style={{ ...elementStyle, fontFamily: "Helvetica-Bold" }}>
              {companyInfo?.name || "Company Name"}
            </Text>
            <Text style={{ fontSize: 9, color: "#666", marginTop: 2 }}>
              {companyInfo?.address}
            </Text>
            <Text style={{ fontSize: 9, color: "#666" }}>
              {companyInfo?.city}, {companyInfo?.state}
            </Text>
            <Text style={{ fontSize: 9, color: "#666" }}>
              {companyInfo?.phone}
            </Text>
            <Text style={{ fontSize: 9, color: "#666" }}>
              {companyInfo?.email}
            </Text>
          </View>
        );

      case "customerInfo":
        return (
          <View>
            <Text
              style={{
                fontSize: 9,
                color: elementColor,
                fontFamily: "Helvetica-Bold",
                marginBottom: 5,
              }}
            >
              BILL TO:
            </Text>
            <Text style={{ ...elementStyle, fontFamily: "Helvetica-Bold" }}>
              {invoiceData?.customer?.name}
            </Text>
            <Text style={{ fontSize: 9, color: "#666", marginTop: 2 }}>
              {invoiceData?.customer?.address}
            </Text>
            <Text style={{ fontSize: 9, color: "#666" }}>
              {invoiceData?.customer?.city}
            </Text>
            <Text style={{ fontSize: 9, color: "#666" }}>
              {invoiceData?.customer?.phone}
            </Text>
          </View>
        );

      case "invoiceDetails":
        return (
          <View>
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 9, color: "#666" }}>Invoice Date:</Text>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Helvetica-Bold",
                  marginTop: 2,
                }}
              >
                {invoiceData?.date}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 9, color: "#666" }}>Due Date:</Text>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Helvetica-Bold",
                  marginTop: 2,
                }}
              >
                {invoiceData?.dueDate}
              </Text>
            </View>
          </View>
        );

      case "itemsTable":
        console.log("Rendering items table, items:", invoiceData?.items);
        return (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableColDescription}>Description</Text>
              <Text style={styles.tableColQty}>Qty</Text>
              <Text style={styles.tableColRate}>Rate</Text>
              <Text style={styles.tableColAmount}>Amount</Text>
            </View>
            {(invoiceData?.items || []).map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableColDescription}>
                  {item.description || "No description"}
                </Text>
                <Text style={styles.tableColQty}>{item.quantity || 0}</Text>
                <Text style={styles.tableColRate}>
                  {formatCurrency(item.rate || 0)}
                </Text>
                <Text style={styles.tableColAmount}>
                  {formatCurrency(item.amount || 0)}
                </Text>
              </View>
            ))}
          </View>
        );

      case "totals":
        return (
          <View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoiceData?.subtotal)}
              </Text>
            </View>
            {invoiceData?.discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount:</Text>
                <Text style={{ ...styles.totalValue, color: "#dc2626" }}>
                  -{formatCurrency(invoiceData?.discount)}
                </Text>
              </View>
            )}
            {invoiceData?.tax > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax (7.5%):</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(invoiceData?.tax)}
                </Text>
              </View>
            )}
            <View style={{ ...styles.totalRow, ...styles.grandTotal }}>
              <Text style={styles.grandTotalText}>TOTAL:</Text>
              <Text style={styles.grandTotalText}>
                {formatCurrency(invoiceData?.total)}
              </Text>
            </View>
          </View>
        );

      case "paymentInfo":
        return (
          <View>
            <Text
              style={{
                fontSize: 10,
                fontFamily: "Helvetica-Bold",
                marginBottom: 5,
                color: elementColor,
              }}
            >
              Payment Information
            </Text>
            <Text style={{ fontSize: 9, color: "#666" }}>
              Bank: {companyInfo?.bank_name}
            </Text>
            <Text style={{ fontSize: 9, color: "#666" }}>
              Account: {companyInfo?.bank_account}
            </Text>
            <Text style={{ fontSize: 9, color: "#666" }}>
              Name: {companyInfo?.account_name}
            </Text>
          </View>
        );

      case "logo":
        return companyInfo?.logo && companyInfo.logo.startsWith("data:") ? (
          <Image src={companyInfo.logo} style={styles.logo} cache={false} />
        ) : null;

      case "text":
        return (
          <Text style={elementStyle}>{element.text || "Custom Text"}</Text>
        );

      default:
        return null;
    }
  };

  // Render freeform template
  if (templateData?.elements) {
    const elements = templateData.elements;

    return (
      <Document>
        <Page size="A4" style={styles.page}>
          {/* Since @react-pdf/renderer doesn't support absolute positioning well,
              we'll render elements in order based on their Y position */}
          {elements
            .sort((a, b) => a.position.y - b.position.y)
            .map((element, index) => (
              <View key={index} style={{ marginBottom: 15 }}>
                {renderFreeformElement(element)}
              </View>
            ))}
        </Page>
      </Document>
    );
  }

  // Render structured template
  if (templateData?.sections) {
    const { sections } = templateData;
    const templateColor = templateData?.color || color || "#667eea";

    return (
      <Document>
        <Page size="A4" style={styles.page}>
          {sections.map((section, sectionIndex) => {
            // Render each section based on its type
            if (section.type === "header") {
              return (
                <View key={sectionIndex} style={styles.header}>
                  {companyInfo?.logo &&
                    companyInfo.logo.startsWith("data:") && (
                      <Image
                        src={companyInfo.logo}
                        style={styles.logo}
                        cache={false}
                      />
                    )}
                  <Text
                    style={{
                      fontSize: 24,
                      fontFamily: "Helvetica-Bold",
                      color: templateColor,
                      marginBottom: 5,
                    }}
                  >
                    {companyInfo?.name || "Company Name"}
                  </Text>
                  <Text style={{ fontSize: 10, color: "#666" }}>
                    {companyInfo?.address}
                  </Text>
                </View>
              );
            }

            if (section.type === "invoiceDetails") {
              return (
                <View
                  key={sectionIndex}
                  style={{
                    ...styles.section,
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <View>
                    <Text
                      style={{
                        fontSize: 9,
                        color: templateColor,
                        fontFamily: "Helvetica-Bold",
                      }}
                    >
                      BILL TO:
                    </Text>
                    <Text style={styles.textBold}>
                      {invoiceData?.customer?.name}
                    </Text>
                    <Text style={styles.text}>
                      {invoiceData?.customer?.address}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.text}>Date: {invoiceData?.date}</Text>
                    <Text style={styles.text}>Due: {invoiceData?.dueDate}</Text>
                  </View>
                </View>
              );
            }

            if (section.type === "items") {
              return (
                <View key={sectionIndex} style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={styles.tableColDescription}>Description</Text>
                    <Text style={styles.tableColQty}>Qty</Text>
                    <Text style={styles.tableColRate}>Rate</Text>
                    <Text style={styles.tableColAmount}>Amount</Text>
                  </View>
                  {(invoiceData?.items || []).map((item, index) => (
                    <View key={index} style={styles.tableRow}>
                      <Text style={styles.tableColDescription}>
                        {item.description || "No description"}
                      </Text>
                      <Text style={styles.tableColQty}>
                        {item.quantity || 0}
                      </Text>
                      <Text style={styles.tableColRate}>
                        {formatCurrency(item.rate || 0)}
                      </Text>
                      <Text style={styles.tableColAmount}>
                        {formatCurrency(item.amount || 0)}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            }

            if (section.type === "totals") {
              return (
                <View
                  key={sectionIndex}
                  style={{ ...styles.section, alignItems: "flex-end" }}
                >
                  <View style={{ width: 200 }}>
                    {renderFreeformElement({ type: "totals" })}
                  </View>
                </View>
              );
            }

            if (section.type === "payment") {
              return (
                <View key={sectionIndex} style={styles.section}>
                  {renderFreeformElement({ type: "paymentInfo" })}
                </View>
              );
            }

            return null;
          })}

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
  }

  // Fallback if no template data
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text>No template data available</Text>
      </Page>
    </Document>
  );
};

export default CustomInvoicePDF;
