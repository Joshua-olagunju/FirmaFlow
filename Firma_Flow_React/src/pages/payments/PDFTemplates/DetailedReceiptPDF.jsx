import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Detailed Receipt - comprehensive with all payment information
const createStyles = (color = "#059669") =>
  StyleSheet.create({
    page: {
      padding: 40,
      fontSize: 10,
      fontFamily: "Helvetica",
      backgroundColor: "#ffffff",
    },
    // Header
    header: {
      marginBottom: 25,
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 15,
    },
    logoSection: {
      flexDirection: "column",
    },
    logo: {
      width: 60,
      height: 48,
      marginBottom: 10,
      objectFit: "contain",
    },
    companyName: {
      fontSize: 18,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
      marginBottom: 5,
    },
    companyInfo: {
      fontSize: 9,
      color: "#666666",
      marginBottom: 2,
    },
    receiptTitleBox: {
      alignItems: "flex-end",
    },
    receiptTitle: {
      fontSize: 26,
      fontFamily: "Helvetica-Bold",
      marginBottom: 5,
    },
    receiptSubtitle: {
      fontSize: 10,
      color: "#666666",
      marginBottom: 8,
    },
    statusBadge: {
      paddingHorizontal: 15,
      paddingVertical: 6,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#ffffff",
    },
    // Divider
    divider: {
      height: 3,
      marginBottom: 20,
    },
    // Details Grid
    detailsGrid: {
      flexDirection: "row",
      marginBottom: 25,
    },
    detailsColumn: {
      flex: 1,
    },
    detailsBox: {
      backgroundColor: "#f9fafb",
      padding: 15,
      borderRadius: 5,
      marginRight: 10,
      minHeight: 100,
    },
    detailsBoxRight: {
      backgroundColor: "#f9fafb",
      padding: 15,
      borderRadius: 5,
      marginLeft: 10,
      minHeight: 100,
    },
    detailsTitle: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      marginBottom: 10,
      paddingBottom: 5,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
    },
    detailRow: {
      flexDirection: "row",
      marginBottom: 6,
    },
    detailLabel: {
      fontSize: 9,
      color: "#666666",
      width: 100,
    },
    detailValue: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
      flex: 1,
    },
    customerName: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
      marginBottom: 5,
    },
    customerInfo: {
      fontSize: 9,
      color: "#666666",
      marginBottom: 2,
    },
    // Payment Summary Table
    table: {
      marginBottom: 20,
    },
    tableHeader: {
      flexDirection: "row",
      paddingVertical: 12,
      paddingHorizontal: 15,
      borderRadius: 5,
      marginBottom: 5,
    },
    tableHeaderCell: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: "#ffffff",
      textTransform: "uppercase",
    },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 12,
      paddingHorizontal: 15,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
    },
    tableRowAlt: {
      flexDirection: "row",
      paddingVertical: 12,
      paddingHorizontal: 15,
      backgroundColor: "#f9fafb",
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
    },
    tableCell: {
      fontSize: 9,
      color: "#333333",
    },
    tableCellBold: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
    },
    // Totals Section
    totalsSection: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: 25,
    },
    totalsBox: {
      width: 280,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
    },
    totalLabel: {
      fontSize: 10,
      color: "#666666",
    },
    totalValue: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
    },
    grandTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 12,
      marginTop: 5,
      borderRadius: 5,
      paddingHorizontal: 10,
    },
    grandTotalLabel: {
      fontSize: 12,
      fontFamily: "Helvetica-Bold",
      color: "#ffffff",
    },
    grandTotalValue: {
      fontSize: 14,
      fontFamily: "Helvetica-Bold",
      color: "#ffffff",
    },
    // Invoice Reference Section
    referenceSection: {
      marginBottom: 20,
      padding: 20,
      backgroundColor: "#f9fafb",
      borderRadius: 5,
      borderLeftWidth: 4,
    },
    referenceTitle: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
      marginBottom: 15,
    },
    referenceGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    referenceItem: {
      width: "50%",
      marginBottom: 10,
    },
    referenceLabel: {
      fontSize: 8,
      color: "#999999",
      textTransform: "uppercase",
      marginBottom: 3,
    },
    referenceValue: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
    },
    // Notes Section
    notesSection: {
      marginBottom: 20,
      padding: 15,
      backgroundColor: "#fffbeb",
      borderRadius: 5,
      borderLeftWidth: 4,
      borderLeftColor: "#f59e0b",
    },
    notesTitle: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#92400e",
      marginBottom: 5,
    },
    notesText: {
      fontSize: 9,
      color: "#78350f",
      lineHeight: 1.5,
    },
    // Terms Section
    termsSection: {
      marginTop: 15,
      padding: 15,
      backgroundColor: "#f0f9ff",
      borderRadius: 5,
    },
    termsTitle: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: "#0369a1",
      marginBottom: 5,
    },
    termsText: {
      fontSize: 8,
      color: "#0c4a6e",
      lineHeight: 1.4,
    },
    // Footer
    footer: {
      position: "absolute",
      bottom: 30,
      left: 40,
      right: 40,
      borderTopWidth: 2,
      paddingTop: 15,
    },
    footerContent: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    footerColumn: {
      flex: 1,
    },
    footerText: {
      fontSize: 8,
      color: "#666666",
      marginBottom: 2,
    },
    footerTextCenter: {
      fontSize: 9,
      color: "#333333",
      textAlign: "center",
      fontFamily: "Helvetica-Bold",
    },
    pageNumber: {
      position: "absolute",
      fontSize: 8,
      bottom: 15,
      left: 0,
      right: 0,
      textAlign: "center",
      color: "#999999",
    },
  });

const DetailedReceiptPDF = ({
  companyInfo,
  receiptData,
  color = "#059669",
}) => {
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

  const getStatusColor = () => {
    if (receiptData?.status === "completed") return "#10b981";
    if (receiptData?.status === "pending") return "#f59e0b";
    return "#6b7280";
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.logoSection}>
              {companyInfo?.logo && (
                <Image
                  src={companyInfo.logo}
                  style={styles.logo}
                  cache={false}
                />
              )}
              <Text style={styles.companyName}>
                {companyInfo?.name ||
                  companyInfo?.company_name ||
                  "Company Name"}
              </Text>
              <Text style={styles.companyInfo}>{companyInfo?.address}</Text>
              <Text style={styles.companyInfo}>
                {[companyInfo?.city, companyInfo?.state]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
              <Text style={styles.companyInfo}>Tel: {companyInfo?.phone}</Text>
              <Text style={styles.companyInfo}>
                Email: {companyInfo?.email}
              </Text>
            </View>
            <View style={styles.receiptTitleBox}>
              <Text style={[styles.receiptTitle, { color: color }]}>
                PAYMENT RECEIPT
              </Text>
              <Text style={styles.receiptSubtitle}>
                Receipt No: {receiptData?.reference}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor() },
                ]}
              >
                <Text style={styles.statusText}>
                  {receiptData?.status?.toUpperCase() || "COMPLETED"}
                </Text>
              </View>
            </View>
          </View>
          {/* Colored Divider */}
          <View style={[styles.divider, { backgroundColor: color }]} />
        </View>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailsColumn}>
            <View style={styles.detailsBox}>
              <Text style={[styles.detailsTitle, { color: color }]}>
                PAYMENT FROM
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
                  Phone: {receiptData.customer.phone}
                </Text>
              )}
              {receiptData?.customer?.email && (
                <Text style={styles.customerInfo}>
                  Email: {receiptData.customer.email}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.detailsColumn}>
            <View style={styles.detailsBoxRight}>
              <Text style={[styles.detailsTitle, { color: color }]}>
                PAYMENT DETAILS
              </Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Receipt No:</Text>
                <Text style={styles.detailValue}>{receiptData?.reference}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>{receiptData?.date}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time:</Text>
                <Text style={styles.detailValue}>
                  {receiptData?.time || "--:--"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Method:</Text>
                <Text style={styles.detailValue}>
                  {formatMethod(receiptData?.method)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payment Summary Table */}
        <View style={styles.table}>
          <View style={[styles.tableHeader, { backgroundColor: color }]}>
            <Text style={[styles.tableHeaderCell, { flex: 3 }]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Reference</Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { flex: 1.5, textAlign: "center" },
              ]}
            >
              Method
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { flex: 1.5, textAlign: "right" },
              ]}
            >
              Amount
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 3 }]}>
              {receiptData?.type === "received"
                ? "Payment Received"
                : "Payment Made"}
              {receiptData?.invoice?.invoice_no &&
                ` for Invoice ${receiptData.invoice.invoice_no}`}
            </Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>
              {receiptData?.reference}
            </Text>
            <Text
              style={[styles.tableCell, { flex: 1.5, textAlign: "center" }]}
            >
              {formatMethod(receiptData?.method)}
            </Text>
            <Text
              style={[styles.tableCellBold, { flex: 1.5, textAlign: "right" }]}
            >
              {formatCurrency(receiptData?.amount)}
            </Text>
          </View>
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Payment Type:</Text>
              <Text style={styles.totalValue}>
                {receiptData?.type === "received"
                  ? "Incoming Payment"
                  : "Outgoing Payment"}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Payment Method:</Text>
              <Text style={styles.totalValue}>
                {formatMethod(receiptData?.method)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Status:</Text>
              <Text style={styles.totalValue}>
                {receiptData?.status?.charAt(0).toUpperCase() +
                  receiptData?.status?.slice(1) || "Completed"}
              </Text>
            </View>
            <View style={[styles.grandTotalRow, { backgroundColor: color }]}>
              <Text style={styles.grandTotalLabel}>TOTAL PAID:</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(receiptData?.amount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Invoice Reference Section */}
        {receiptData?.invoice && (
          <View style={[styles.referenceSection, { borderLeftColor: color }]}>
            <Text style={styles.referenceTitle}>Invoice Reference Details</Text>
            <View style={styles.referenceGrid}>
              <View style={styles.referenceItem}>
                <Text style={styles.referenceLabel}>Invoice Number</Text>
                <Text style={styles.referenceValue}>
                  {receiptData.invoice.invoice_no || receiptData.invoice_number}
                </Text>
              </View>
              <View style={styles.referenceItem}>
                <Text style={styles.referenceLabel}>Invoice Total</Text>
                <Text style={styles.referenceValue}>
                  {formatCurrency(
                    receiptData.invoice_total || receiptData.invoice?.total
                  )}
                </Text>
              </View>
              <View style={styles.referenceItem}>
                <Text style={styles.referenceLabel}>
                  Balance Before Payment
                </Text>
                <Text style={styles.referenceValue}>
                  {formatCurrency(receiptData.balance_before)}
                </Text>
              </View>
              <View style={styles.referenceItem}>
                <Text style={styles.referenceLabel}>Balance After Payment</Text>
                <Text style={styles.referenceValue}>
                  {formatCurrency(receiptData.balance_after)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Notes */}
        {receiptData?.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes / Memo:</Text>
            <Text style={styles.notesText}>{receiptData.notes}</Text>
          </View>
        )}

        {/* Terms */}
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Important Information:</Text>
          <Text style={styles.termsText}>
            This receipt confirms payment has been processed. Please retain this
            document for your records. For any questions regarding this
            transaction, please contact us at{" "}
            {companyInfo?.email || "support@company.com"}.
          </Text>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: color }]}>
          <Text style={styles.footerTextCenter}>
            Thank you for your payment!
          </Text>
          <Text
            style={[styles.footerText, { textAlign: "center", marginTop: 5 }]}
          >
            This is a computer-generated receipt. No signature required.
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

export default DetailedReceiptPDF;
