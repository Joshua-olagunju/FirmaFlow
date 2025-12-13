import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Compact Receipt - smaller, cleaner design
const createStyles = (color = "#4f46e5") =>
  StyleSheet.create({
    page: {
      padding: 30,
      fontSize: 9,
      fontFamily: "Helvetica",
      backgroundColor: "#ffffff",
    },
    // Header
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 20,
      paddingBottom: 15,
      borderBottomWidth: 2,
      borderBottomColor: color,
    },
    logoSection: {
      flexDirection: "row",
      alignItems: "center",
    },
    logo: {
      width: 40,
      height: 32,
      marginRight: 10,
      objectFit: "contain",
    },
    companyName: {
      fontSize: 14,
      fontFamily: "Helvetica-Bold",
      color: color,
    },
    headerRight: {
      alignItems: "flex-end",
    },
    receiptLabel: {
      fontSize: 16,
      fontFamily: "Helvetica-Bold",
      color: color,
      marginBottom: 3,
    },
    receiptNumber: {
      fontSize: 9,
      color: "#666666",
    },
    // Two Column Layout
    twoColumn: {
      flexDirection: "row",
      marginBottom: 15,
    },
    column: {
      flex: 1,
    },
    columnRight: {
      flex: 1,
      alignItems: "flex-end",
    },
    // Labels and values
    label: {
      fontSize: 8,
      color: "#999999",
      textTransform: "uppercase",
      marginBottom: 2,
    },
    value: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
      marginBottom: 8,
    },
    valueSmall: {
      fontSize: 9,
      color: "#333333",
      marginBottom: 2,
    },
    // Amount Box
    amountBox: {
      padding: 15,
      marginVertical: 15,
      borderRadius: 5,
      borderWidth: 1,
    },
    amountRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    amountLabel: {
      fontSize: 9,
      color: "#666666",
    },
    amountValue: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
    },
    totalDivider: {
      borderTopWidth: 1,
      borderTopColor: "#e5e7eb",
      paddingTop: 10,
      marginTop: 5,
    },
    totalLabel: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
    },
    totalValue: {
      fontSize: 13,
      fontFamily: "Helvetica-Bold",
    },
    // Reference Section
    referenceBox: {
      backgroundColor: "#f9fafb",
      padding: 12,
      marginTop: 10,
      borderRadius: 5,
    },
    referenceTitle: {
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
      marginBottom: 8,
      textTransform: "uppercase",
    },
    referenceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    referenceLabel: {
      fontSize: 8,
      color: "#666666",
    },
    referenceValue: {
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
    },
    // Notes
    notesSection: {
      marginTop: 12,
      padding: 10,
      borderLeftWidth: 3,
      backgroundColor: "#fafafa",
    },
    notesTitle: {
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
      marginBottom: 4,
    },
    notesText: {
      fontSize: 8,
      color: "#666666",
      lineHeight: 1.4,
    },
    // Footer
    footer: {
      marginTop: "auto",
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: "#e5e7eb",
    },
    footerText: {
      fontSize: 8,
      color: "#999999",
      textAlign: "center",
    },
    // Status Badge
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      alignSelf: "flex-end",
      marginTop: 5,
    },
    statusText: {
      fontSize: 7,
      fontFamily: "Helvetica-Bold",
      color: "#ffffff",
    },
    pageNumber: {
      position: "absolute",
      fontSize: 7,
      bottom: 15,
      left: 0,
      right: 0,
      textAlign: "center",
      color: "#cccccc",
    },
  });

const CompactReceiptPDF = ({ companyInfo, receiptData, color = "#4f46e5" }) => {
  const styles = createStyles(color);

  // Currency formatter
  const formatCurrency =
    receiptData?.formatCurrency ||
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
        currencyMap[receiptData?.currency] ||
        receiptData?.currency + " " ||
        "₦";
      const formatted = parseFloat(amount || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return `${symbol}${formatted}`;
    });

  const formatMethod = (method) => {
    if (!method) return "N/A";
    return method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <Document>
      <Page size="A5" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            {companyInfo?.logo && (
              <Image src={companyInfo.logo} style={styles.logo} cache={false} />
            )}
            <Text style={styles.companyName}>
              {companyInfo?.name || companyInfo?.company_name || "Company Name"}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.receiptLabel}>Receipt</Text>
            <Text style={styles.receiptNumber}>#{receiptData?.reference}</Text>
          </View>
        </View>

        {/* Two Column Info */}
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Text style={styles.label}>Received From</Text>
            <Text style={styles.value}>
              {receiptData?.customer?.name ||
                receiptData?.entity_name ||
                "Customer"}
            </Text>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>
              {formatMethod(receiptData?.method)}
            </Text>
          </View>
          <View style={styles.columnRight}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{receiptData?.date}</Text>
            <Text style={styles.label}>Status</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    receiptData?.status === "completed" ? "#10b981" : "#f59e0b",
                },
              ]}
            >
              <Text style={styles.statusText}>
                {receiptData?.status?.toUpperCase() || "COMPLETED"}
              </Text>
            </View>
          </View>
        </View>

        {/* Amount Box */}
        <View
          style={[
            styles.amountBox,
            { borderColor: color, backgroundColor: `${color}05` },
          ]}
        >
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Reference:</Text>
            <Text style={styles.amountValue}>{receiptData?.reference}</Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Type:</Text>
            <Text style={styles.amountValue}>
              {receiptData?.type === "received"
                ? "Payment Received"
                : "Payment Made"}
            </Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Method:</Text>
            <Text style={styles.amountValue}>
              {formatMethod(receiptData?.method)}
            </Text>
          </View>
          <View style={styles.totalDivider}>
            <View style={styles.amountRow}>
              <Text style={[styles.totalLabel, { color: color }]}>
                Amount Paid:
              </Text>
              <Text style={[styles.totalValue, { color: color }]}>
                {formatCurrency(receiptData?.amount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Invoice Reference */}
        {receiptData?.invoice && (
          <View style={styles.referenceBox}>
            <Text style={styles.referenceTitle}>Invoice Reference</Text>
            <View style={styles.referenceRow}>
              <Text style={styles.referenceLabel}>Invoice #:</Text>
              <Text style={styles.referenceValue}>
                {receiptData.invoice.invoice_no || receiptData.invoice_number}
              </Text>
            </View>
            <View style={styles.referenceRow}>
              <Text style={styles.referenceLabel}>Invoice Total:</Text>
              <Text style={styles.referenceValue}>
                {formatCurrency(
                  receiptData.invoice_total || receiptData.invoice?.total
                )}
              </Text>
            </View>
            <View style={styles.referenceRow}>
              <Text style={styles.referenceLabel}>Balance After:</Text>
              <Text style={styles.referenceValue}>
                {formatCurrency(receiptData.balance_after)}
              </Text>
            </View>
          </View>
        )}

        {/* Notes */}
        {receiptData?.notes && (
          <View style={[styles.notesSection, { borderLeftColor: color }]}>
            <Text style={styles.notesTitle}>Notes:</Text>
            <Text style={styles.notesText}>{receiptData.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your payment!</Text>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};

export default CompactReceiptPDF;
