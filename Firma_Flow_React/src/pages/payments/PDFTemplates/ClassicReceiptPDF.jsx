import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import "./pdfFonts"; // Register Unicode fonts
import { currencySymbols } from "./pdfFonts";

// Create styles matching ClassicReceipt.jsx exactly - thermal POS width
const createStyles = (color = "#667eea") =>
  StyleSheet.create({
    page: {
      padding: 12,
      fontSize: 10,
      fontFamily: "NotoSans",
      backgroundColor: "#ffffff",
      width: 226, // 80mm thermal width
      borderWidth: 3,
      borderColor: color,
      borderStyle: "solid",
    },
    // Classic Header
    header: {
      textAlign: "center",
      marginBottom: 12,
      paddingBottom: 12,
      borderBottomWidth: 2,
      borderBottomColor: color,
    },
    companyName: {
      fontSize: 16,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: color,
      marginBottom: 6,
    },
    companyInfo: {
      fontSize: 9,
      color: "#374151",
      marginTop: 2,
    },
    // Receipt Title
    titleSection: {
      textAlign: "center",
      marginBottom: 12,
    },
    receiptTitle: {
      fontSize: 14,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#1f2937",
      marginBottom: 6,
    },
    underline: {
      width: 50,
      height: 2,
      backgroundColor: color,
      marginHorizontal: "auto",
      marginVertical: 6,
    },
    receiptNumber: {
      fontSize: 10,
      color: "#6b7280",
    },
    // Date & Time Row
    dateTimeRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: "#9ca3af",
      borderBottomStyle: "dashed",
    },
    dateTimeLabel: {
      fontSize: 9,
      color: "#6b7280",
    },
    dateTimeValue: {
      fontSize: 9,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#1f2937",
    },
    // Items Table
    table: {
      marginBottom: 12,
    },
    tableHeader: {
      flexDirection: "row",
      borderBottomWidth: 2,
      borderBottomColor: color,
      paddingBottom: 6,
      marginBottom: 6,
    },
    tableHeaderCell: {
      fontSize: 10,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: color,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
      paddingVertical: 6,
    },
    tableCell: {
      fontSize: 9,
      color: "#1f2937",
    },
    // Totals Section
    totalsSection: {
      borderTopWidth: 2,
      borderTopColor: color,
      paddingTop: 10,
      marginBottom: 12,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    totalLabel: {
      fontSize: 9,
      color: "#374151",
    },
    totalValue: {
      fontSize: 9,
      color: "#1f2937",
    },
    grandTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: 8,
      marginTop: 4,
      borderTopWidth: 1,
      borderTopColor: `${color}80`,
    },
    grandTotalLabel: {
      fontSize: 12,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#1f2937",
    },
    grandTotalValue: {
      fontSize: 12,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: color,
    },
    // Payment Details Box
    paymentBox: {
      borderWidth: 2,
      borderColor: `${color}80`,
      borderStyle: "dashed",
      padding: 10,
      marginBottom: 12,
    },
    paymentRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 3,
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
    // Footer
    footer: {
      textAlign: "center",
      borderTopWidth: 2,
      borderTopColor: color,
      paddingTop: 10,
    },
    footerMain: {
      fontSize: 10,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#1f2937",
      marginBottom: 6,
    },
    footerSub: {
      fontSize: 8,
      color: "#6b7280",
      fontStyle: "italic",
    },
  });

const ClassicReceiptPDF = ({ companyInfo, receiptData, color = "#667eea" }) => {
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
        {/* Classic Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>
            {companyInfo?.name || companyInfo?.company_name || "COMPANY NAME"}
          </Text>
          <Text style={styles.companyInfo}>{companyInfo?.address}</Text>
          <Text style={styles.companyInfo}>
            {[companyInfo?.city, companyInfo?.state].filter(Boolean).join(", ")}
          </Text>
          <Text style={styles.companyInfo}>Tel: {companyInfo?.phone}</Text>
        </View>

        {/* Receipt Title */}
        <View style={styles.titleSection}>
          <Text style={styles.receiptTitle}>RECEIPT</Text>
          <View style={styles.underline} />
          <Text style={styles.receiptNumber}>{receiptData?.reference}</Text>
        </View>

        {/* Date & Time */}
        <View style={styles.dateTimeRow}>
          <View style={{ flexDirection: "row" }}>
            <Text style={styles.dateTimeLabel}>Date: </Text>
            <Text style={styles.dateTimeValue}>{receiptData?.date}</Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            <Text style={styles.dateTimeLabel}>Time: </Text>
            <Text style={styles.dateTimeValue}>
              {receiptData?.time || "--:--"}
            </Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 3 }]}>
              Description
            </Text>
            <Text
              style={[styles.tableHeaderCell, { flex: 1, textAlign: "center" }]}
            >
              Qty
            </Text>
            <Text
              style={[styles.tableHeaderCell, { flex: 2, textAlign: "right" }]}
            >
              Amount
            </Text>
          </View>
          {receiptData?.items?.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3 }]}>{item.name}</Text>
              <Text
                style={[styles.tableCell, { flex: 1, textAlign: "center" }]}
              >
                {item.quantity}
              </Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: "right" }]}>
                {formatCurrency(item.total)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(receiptData?.subtotal || receiptData?.amount)}
            </Text>
          </View>
          {receiptData?.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount:</Text>
              <Text style={[styles.totalValue, { color: "#dc2626" }]}>
                -{formatCurrency(receiptData?.discount)}
              </Text>
            </View>
          )}
          {receiptData?.tax > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax:</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(receiptData?.tax)}
              </Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL:</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(receiptData?.total || receiptData?.amount)}
            </Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.paymentBox}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment:</Text>
            <Text style={styles.paymentValue}>
              {formatMethod(receiptData?.paymentMethod || receiptData?.method)}
            </Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Paid:</Text>
            <Text style={styles.paymentValue}>
              {formatCurrency(receiptData?.amountPaid || receiptData?.amount)}
            </Text>
          </View>
          {receiptData?.change > 0 && (
            <View style={[styles.paymentRow, { marginTop: 3 }]}>
              <Text
                style={[
                  styles.paymentLabel,
                  { fontFamily: "NotoSans", fontWeight: 700 },
                ]}
              >
                Change:
              </Text>
              <Text style={[styles.paymentValue, { color: "#16a34a" }]}>
                {formatCurrency(receiptData?.change)}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerMain}>Thank You For Your Business!</Text>
          <Text style={styles.footerSub}>We appreciate your patronage</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ClassicReceiptPDF;
