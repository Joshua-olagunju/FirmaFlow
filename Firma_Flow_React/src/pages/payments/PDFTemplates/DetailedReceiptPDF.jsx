import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import "./pdfFonts"; // Register Unicode fonts
import { currencySymbols } from "./pdfFonts";

// Detailed Receipt - matching DetailedReceipt.jsx exactly - thermal POS width
const createStyles = (color = "#667eea") =>
  StyleSheet.create({
    page: {
      padding: 20,
      fontSize: 10,
      fontFamily: "NotoSans",
      backgroundColor: "#ffffff",
      width: 226, // 80mm thermal width
    },
    // Header Section
    header: {
      marginBottom: 15,
      paddingBottom: 15,
      borderBottomWidth: 2,
      borderBottomColor: color,
    },
    companyInfoSection: {
      marginBottom: 12,
    },
    companyName: {
      fontSize: 18,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: color,
      marginBottom: 4,
    },
    companyEmail: {
      fontSize: 9,
      color: "#6b7280",
      marginTop: 4,
    },
    addressBox: {
      backgroundColor: "#f9fafb",
      padding: 8,
      marginTop: 8,
    },
    addressText: {
      fontSize: 9,
      color: "#374151",
      marginBottom: 2,
    },
    // Receipt Title Section
    titleSection: {
      marginBottom: 15,
    },
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    receiptTitle: {
      fontSize: 16,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#1f2937",
    },
    receiptBadge: {
      backgroundColor: `${color}15`,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    receiptNumber: {
      fontSize: 12,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: color,
    },
    dateTimeGrid: {
      backgroundColor: "#f9fafb",
      padding: 10,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    dateTimeBox: {
      flex: 1,
    },
    dateTimeBoxRight: {
      flex: 1,
      alignItems: "flex-end",
    },
    dateTimeLabel: {
      fontSize: 8,
      color: "#6b7280",
      marginBottom: 3,
    },
    dateTimeValue: {
      fontSize: 9,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#1f2937",
    },
    // Items Section
    itemsSection: {
      marginBottom: 15,
    },
    sectionHeader: {
      fontSize: 9,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: color,
      marginBottom: 10,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: color,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: `${color}10`,
      paddingVertical: 6,
      paddingHorizontal: 8,
    },
    tableHeaderText: {
      fontSize: 8,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: color,
    },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
    },
    tableCellDescription: {
      flex: 2,
      fontSize: 9,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#1f2937",
    },
    tableCellUnitPrice: {
      flex: 1.5,
      fontSize: 8,
      color: "#6b7280",
      textAlign: "center",
    },
    tableCellQty: {
      flex: 1,
      fontSize: 9,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#1f2937",
      textAlign: "center",
    },
    tableCellAmount: {
      flex: 1.5,
      fontSize: 9,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#1f2937",
      textAlign: "right",
    },
    // Totals Section
    totalsSection: {
      marginBottom: 15,
    },
    totalsBox: {
      backgroundColor: "#f9fafb",
      padding: 12,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    totalLabel: {
      fontSize: 9,
      color: "#6b7280",
    },
    totalValue: {
      fontSize: 9,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#1f2937",
    },
    discountValue: {
      fontSize: 9,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#dc2626",
    },
    grandTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: 10,
      marginTop: 8,
      borderTopWidth: 2,
      borderTopColor: color,
    },
    grandTotalLabel: {
      fontSize: 14,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: color,
    },
    grandTotalValue: {
      fontSize: 14,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: color,
    },
    // Payment Details Section
    paymentSection: {
      marginBottom: 15,
      backgroundColor: `${color}10`,
      padding: 12,
    },
    paymentSectionTitle: {
      fontSize: 9,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: color,
      marginBottom: 10,
    },
    paymentRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    paymentLabel: {
      fontSize: 9,
      color: "#374151",
    },
    paymentValue: {
      fontSize: 9,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#1f2937",
    },
    changeRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: 8,
      marginTop: 6,
      borderTopWidth: 1,
      borderTopColor: `${color}50`,
    },
    changeLabel: {
      fontSize: 9,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#1f2937",
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
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: "#d1d5db",
    },
    footerTitle: {
      fontSize: 10,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#1f2937",
      marginBottom: 4,
    },
    footerText: {
      fontSize: 8,
      color: "#6b7280",
      marginBottom: 2,
    },
  });

const DetailedReceiptPDF = ({
  companyInfo,
  receiptData,
  color = "#667eea",
}) => {
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
        {/* Detailed Header */}
        <View style={styles.header}>
          <View style={styles.companyInfoSection}>
            <Text style={styles.companyName}>
              {companyInfo?.name || companyInfo?.company_name || "Company Name"}
            </Text>
            <Text style={styles.companyEmail}>{companyInfo?.email}</Text>
          </View>
          <View style={styles.addressBox}>
            <Text style={styles.addressText}>{companyInfo?.address}</Text>
            <Text style={styles.addressText}>
              {[companyInfo?.city, companyInfo?.state]
                .filter(Boolean)
                .join(", ")}
            </Text>
            <Text style={styles.addressText}>Phone: {companyInfo?.phone}</Text>
          </View>
        </View>

        {/* Receipt Title Info */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.receiptTitle}>OFFICIAL{"\n"}RECEIPT</Text>
            <View style={styles.receiptBadge}>
              <Text style={styles.receiptNumber}>
                {receiptData?.reference || receiptData?.receiptNumber}
              </Text>
            </View>
          </View>
          <View style={styles.dateTimeGrid}>
            <View style={styles.dateTimeBox}>
              <Text style={styles.dateTimeLabel}>Transaction Date</Text>
              <Text style={styles.dateTimeValue}>{receiptData?.date}</Text>
            </View>
            <View style={styles.dateTimeBoxRight}>
              <Text style={styles.dateTimeLabel}>Transaction Time</Text>
              <Text style={styles.dateTimeValue}>
                {receiptData?.time || "--:--"}
              </Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionHeader}>ITEMS PURCHASED</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>
              Description
            </Text>
            <Text
              style={[
                styles.tableHeaderText,
                { flex: 1.5, textAlign: "center" },
              ]}
            >
              Unit Price
            </Text>
            <Text
              style={[styles.tableHeaderText, { flex: 1, textAlign: "center" }]}
            >
              Qty
            </Text>
            <Text
              style={[
                styles.tableHeaderText,
                { flex: 1.5, textAlign: "right" },
              ]}
            >
              Amount
            </Text>
          </View>
          {receiptData?.items?.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCellDescription}>{item.name}</Text>
              <Text style={styles.tableCellUnitPrice}>
                {formatCurrency(item.price)}
              </Text>
              <Text style={styles.tableCellQty}>{item.quantity}</Text>
              <Text style={styles.tableCellAmount}>
                {formatCurrency(item.total)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(receiptData?.subtotal || receiptData?.amount)}
              </Text>
            </View>
            {receiptData?.discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount Applied:</Text>
                <Text style={styles.discountValue}>
                  -{formatCurrency(receiptData?.discount)}
                </Text>
              </View>
            )}
            {receiptData?.tax > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>VAT (7.5%):</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(receiptData?.tax)}
                </Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL{"\n"}AMOUNT:</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(receiptData?.total || receiptData?.amount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentSectionTitle}>PAYMENT DETAILS</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment Method:</Text>
            <Text style={styles.paymentValue}>
              {formatMethod(receiptData?.paymentMethod || receiptData?.method)}
            </Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Amount Paid:</Text>
            <Text style={styles.paymentValue}>
              {formatCurrency(receiptData?.amountPaid || receiptData?.amount)}
            </Text>
          </View>
          {receiptData?.change > 0 && (
            <View style={styles.changeRow}>
              <Text style={styles.changeLabel}>Change Given:</Text>
              <Text style={styles.changeValue}>
                {formatCurrency(receiptData?.change)}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Thank You For Your Business!</Text>
          <Text style={styles.footerText}>
            This is an official receipt and serves as proof of payment
          </Text>
          <Text style={styles.footerText}>
            Please retain this receipt for your records
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default DetailedReceiptPDF;
