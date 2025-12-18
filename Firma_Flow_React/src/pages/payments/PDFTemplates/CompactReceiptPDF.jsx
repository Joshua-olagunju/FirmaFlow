import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import "./pdfFonts"; // Register Unicode fonts
import { currencySymbols } from "./pdfFonts";

// Compact Receipt - matching CompactReceipt.jsx exactly - thermal POS width
const createStyles = (color = "#667eea") =>
  StyleSheet.create({
    page: {
      padding: 12,
      fontSize: 11,
      fontFamily: "NotoSans",
      backgroundColor: "#ffffff",
      width: 226, // 80mm thermal width
    },
    // Compact Header
    header: {
      textAlign: "center",
      marginBottom: 10,
    },
    companyName: {
      fontSize: 12,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: color,
      marginBottom: 3,
    },
    companyInfo: {
      fontSize: 9,
      color: "#6b7280",
      marginBottom: 2,
    },
    // Receipt Info Bar
    receiptInfoBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: "#d1d5db",
      paddingVertical: 6,
      marginBottom: 8,
    },
    receiptLabel: {
      fontSize: 9,
      fontFamily: "NotoSans",
      fontWeight: 700,
    },
    receiptMeta: {
      fontSize: 9,
      color: "#6b7280",
    },
    // Items Section
    itemsContainer: {
      marginBottom: 8,
    },
    itemRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 4,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
    },
    itemDetails: {
      flex: 1,
    },
    itemName: {
      fontSize: 9,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#1f2937",
    },
    itemQty: {
      fontSize: 9,
      color: "#6b7280",
      marginLeft: 6,
    },
    itemTotal: {
      fontSize: 9,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#1f2937",
    },
    // Totals Section
    totalsSection: {
      borderTopWidth: 2,
      borderTopColor: color,
      paddingTop: 8,
      marginBottom: 8,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 2,
    },
    totalLabel: {
      fontSize: 9,
      color: "#6b7280",
    },
    totalValue: {
      fontSize: 9,
      color: "#1f2937",
    },
    discountValue: {
      fontSize: 9,
      color: "#dc2626",
    },
    grandTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 4,
      paddingTop: 4,
      borderTopWidth: 1,
      borderTopColor: `${color}80`,
    },
    grandTotalLabel: {
      fontSize: 11,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: color,
    },
    grandTotalValue: {
      fontSize: 11,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: color,
    },
    // Payment Section
    paymentSection: {
      backgroundColor: "#f9fafb",
      padding: 8,
      marginBottom: 8,
    },
    paymentRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 2,
    },
    paymentLabel: {
      fontSize: 9,
      color: "#6b7280",
    },
    paymentValue: {
      fontSize: 9,
      fontFamily: "NotoSans",
      fontWeight: 700,
    },
    changeValue: {
      fontSize: 9,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#16a34a",
    },
    // Footer
    footer: {
      textAlign: "center",
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: "#e5e7eb",
    },
    footerText: {
      fontSize: 9,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#6b7280",
    },
  });

const CompactReceiptPDF = ({ companyInfo, receiptData, color = "#667eea" }) => {
  const styles = createStyles(color);

  // Currency formatter with actual Unicode currency symbols (NotoSans font required)
  const formatCurrency = (amount) => {
    const symbol =
      currencySymbols[receiptData?.currency] || receiptData?.currency || "₦";
    const formatted = parseFloat(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${symbol}${formatted}`;
  };

  const formatMethod = (method) => {
    if (!method) return "N/A";
    return method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <Document>
      <Page size={{ width: 226, height: 842 }} style={styles.page}>
        {/* Compact Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>
            {companyInfo?.name || companyInfo?.company_name || "Company Name"}
          </Text>
          <Text style={styles.companyInfo}>{companyInfo?.address}</Text>
          <Text style={styles.companyInfo}>{companyInfo?.phone}</Text>
        </View>

        {/* Receipt Info Bar */}
        <View style={styles.receiptInfoBar}>
          <Text style={styles.receiptLabel}>
            Receipt: {receiptData?.reference || receiptData?.receiptNumber}
          </Text>
          <Text style={styles.receiptMeta}>
            {receiptData?.date} {receiptData?.time || ""}
          </Text>
        </View>

        {/* Items */}
        <View style={styles.itemsContainer}>
          {receiptData?.items?.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>
                  {item.name}
                  <Text style={styles.itemQty}> x{item.quantity}</Text>
                </Text>
              </View>
              <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(receiptData?.subtotal || receiptData?.amount)}
            </Text>
          </View>
          {receiptData?.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={styles.discountValue}>
                -{formatCurrency(receiptData?.discount)}
              </Text>
            </View>
          )}
          {receiptData?.tax > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(receiptData?.tax)}
              </Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(receiptData?.total || receiptData?.amount)}
            </Text>
          </View>
        </View>

        {/* Payment Section */}
        <View style={styles.paymentSection}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>
              Paid (
              {formatMethod(receiptData?.paymentMethod || receiptData?.method)})
            </Text>
            <Text style={styles.paymentValue}>
              {formatCurrency(receiptData?.amountPaid || receiptData?.amount)}
            </Text>
          </View>
          {receiptData?.change > 0 && (
            <View style={[styles.paymentRow, { marginTop: 2 }]}>
              <Text
                style={[
                  styles.paymentLabel,
                  { fontFamily: "NotoSans", fontWeight: 700, color: "#1f2937" },
                ]}
              >
                Change
              </Text>
              <Text style={styles.changeValue}>
                {formatCurrency(receiptData?.change)}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank You!</Text>
        </View>
      </Page>
    </Document>
  );
};

export default CompactReceiptPDF;
