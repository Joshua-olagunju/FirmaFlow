import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Svg,
  Path,
} from "@react-pdf/renderer";

// Create styles for Modern Receipt
const createStyles = (color = "#667eea") =>
  StyleSheet.create({
    page: {
      padding: 40,
      fontSize: 10,
      fontFamily: "Helvetica",
      backgroundColor: "#ffffff",
      position: "relative",
    },
    // Diagonal design overlay at top right
    diagonalDesign: {
      position: "absolute",
      top: 0,
      right: 0,
      width: 150,
      height: 150,
    },
    // Header section
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 30,
      zIndex: 1,
    },
    leftHeader: {
      flex: 1,
    },
    rightHeader: {
      flex: 1,
      alignItems: "flex-end",
    },
    logo: {
      width: 60,
      height: 48,
      marginBottom: 10,
      objectFit: "contain",
    },
    receiptTitle: {
      fontSize: 28,
      fontFamily: "Helvetica-Bold",
      marginBottom: 5,
    },
    receiptNumber: {
      fontSize: 10,
      color: "#666666",
    },
    companyName: {
      fontSize: 16,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
      marginBottom: 5,
    },
    companyInfo: {
      fontSize: 9,
      color: "#666666",
      marginBottom: 2,
      textAlign: "right",
    },
    // Receipt Details Section
    detailsSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 30,
    },
    detailColumn: {
      flex: 1,
    },
    detailColumnRight: {
      flex: 1,
      alignItems: "flex-end",
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      marginBottom: 8,
    },
    customerName: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
      marginBottom: 3,
    },
    customerInfo: {
      fontSize: 9,
      color: "#666666",
      marginBottom: 2,
    },
    dateLabel: {
      fontSize: 9,
      color: "#666666",
      marginBottom: 2,
    },
    dateValue: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
      marginBottom: 8,
    },
    // Payment Details Box
    paymentBox: {
      padding: 20,
      marginBottom: 25,
      borderRadius: 5,
    },
    paymentRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
    },
    paymentLabel: {
      fontSize: 10,
      color: "#666666",
    },
    paymentValue: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
    },
    // Amount Section
    amountSection: {
      marginTop: 20,
      marginBottom: 25,
    },
    amountBox: {
      width: "100%",
    },
    amountRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
    },
    amountLabel: {
      fontSize: 10,
      color: "#666666",
    },
    amountValue: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 12,
      marginTop: 8,
      paddingHorizontal: 10,
    },
    totalLabel: {
      fontSize: 14,
      fontFamily: "Helvetica-Bold",
    },
    totalValue: {
      fontSize: 14,
      fontFamily: "Helvetica-Bold",
    },
    // Invoice Reference
    referenceSection: {
      marginTop: 20,
      padding: 15,
      backgroundColor: "#f9fafb",
      borderRadius: 5,
    },
    referenceTitle: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
      marginBottom: 8,
    },
    referenceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 5,
    },
    referenceLabel: {
      fontSize: 9,
      color: "#666666",
    },
    referenceValue: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
    },
    // Notes section
    notesSection: {
      marginTop: 20,
      padding: 15,
      backgroundColor: "#f9fafb",
      borderRadius: 5,
    },
    notesTitle: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
      marginBottom: 5,
    },
    notesText: {
      fontSize: 9,
      color: "#666666",
      lineHeight: 1.5,
    },
    // Footer
    footer: {
      borderTopWidth: 1,
      borderTopColor: "#e5e7eb",
      paddingTop: 15,
      textAlign: "center",
      marginTop: "auto",
    },
    footerText: {
      fontSize: 10,
      color: "#666666",
    },
    pageNumber: {
      position: "absolute",
      fontSize: 8,
      bottom: 20,
      left: 0,
      right: 0,
      textAlign: "center",
      color: "#999999",
    },
    // Status badge
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
      alignSelf: "flex-start",
      marginBottom: 10,
    },
    statusText: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#ffffff",
    },
  });

const ModernReceiptPDF = ({ companyInfo, receiptData, color = "#667eea" }) => {
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
      <Page size="A4" style={styles.page}>
        {/* Diagonal Design at Top Right */}
        <Svg style={styles.diagonalDesign} viewBox="0 0 150 150">
          <Path d="M150 0 L0 0 L150 150 Z" fill={color} opacity="0.1" />
        </Svg>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.leftHeader}>
            {companyInfo?.logo && (
              <Image src={companyInfo.logo} style={styles.logo} cache={false} />
            )}
            <Text style={[styles.receiptTitle, { color: color }]}>
              PAYMENT RECEIPT
            </Text>
            <Text style={styles.receiptNumber}>#{receiptData?.reference}</Text>
          </View>
          <View style={styles.rightHeader}>
            <Text style={styles.companyName}>
              {companyInfo?.name || companyInfo?.company_name || "Company Name"}
            </Text>
            <Text style={styles.companyInfo}>{companyInfo?.address}</Text>
            <Text style={styles.companyInfo}>
              {[companyInfo?.city, companyInfo?.state]
                .filter(Boolean)
                .join(", ")}
            </Text>
            <Text style={styles.companyInfo}>{companyInfo?.phone}</Text>
            <Text style={styles.companyInfo}>{companyInfo?.email}</Text>
          </View>
        </View>

        {/* Receipt Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailColumn}>
            <Text style={[styles.sectionTitle, { color: color }]}>
              RECEIVED FROM:
            </Text>
            <Text style={styles.customerName}>
              {receiptData?.customer?.name ||
                receiptData?.entity_name ||
                "Customer"}
            </Text>
            {receiptData?.customer?.address && (
              <Text style={styles.customerInfo}>
                {receiptData.customer.address}
              </Text>
            )}
            {receiptData?.customer?.phone && (
              <Text style={styles.customerInfo}>
                {receiptData.customer.phone}
              </Text>
            )}
            {receiptData?.customer?.email && (
              <Text style={styles.customerInfo}>
                {receiptData.customer.email}
              </Text>
            )}
          </View>
          <View style={styles.detailColumnRight}>
            <Text style={styles.dateLabel}>Payment Date:</Text>
            <Text style={styles.dateValue}>{receiptData?.date}</Text>
            <Text style={styles.dateLabel}>Payment Method:</Text>
            <Text style={styles.dateValue}>
              {formatMethod(receiptData?.method)}
            </Text>
            {/* Status Badge */}
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

        {/* Payment Amount Box */}
        <View style={[styles.paymentBox, { backgroundColor: `${color}08` }]}>
          <View style={styles.amountBox}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Payment Reference:</Text>
              <Text style={styles.amountValue}>{receiptData?.reference}</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Payment Type:</Text>
              <Text style={styles.amountValue}>
                {receiptData?.type === "received"
                  ? "Payment Received"
                  : "Payment Made"}
              </Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Payment Method:</Text>
              <Text style={styles.amountValue}>
                {formatMethod(receiptData?.method)}
              </Text>
            </View>
            <View style={[styles.totalRow, { backgroundColor: `${color}15` }]}>
              <Text style={[styles.totalLabel, { color: color }]}>
                AMOUNT PAID:
              </Text>
              <Text style={[styles.totalValue, { color: color }]}>
                {formatCurrency(receiptData?.amount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Invoice Reference (if applicable) */}
        {receiptData?.invoice && (
          <View style={styles.referenceSection}>
            <Text style={styles.referenceTitle}>Invoice Reference</Text>
            <View style={styles.referenceRow}>
              <Text style={styles.referenceLabel}>Invoice Number:</Text>
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
              <Text style={styles.referenceLabel}>Balance Before:</Text>
              <Text style={styles.referenceValue}>
                {formatCurrency(receiptData.balance_before)}
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
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes:</Text>
            <Text style={styles.notesText}>{receiptData.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your payment!</Text>
          <Text style={[styles.footerText, { marginTop: 5 }]}>
            This is a computer-generated receipt.
          </Text>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};

export default ModernReceiptPDF;
