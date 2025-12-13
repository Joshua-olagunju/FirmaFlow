import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Create styles for Classic Receipt
const createStyles = (color = "#1e3a5f") =>
  StyleSheet.create({
    page: {
      padding: 50,
      fontSize: 10,
      fontFamily: "Helvetica",
      backgroundColor: "#ffffff",
    },
    // Header with border
    header: {
      borderBottomWidth: 3,
      borderBottomColor: color,
      paddingBottom: 20,
      marginBottom: 30,
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    logoSection: {
      flexDirection: "row",
      alignItems: "center",
    },
    logo: {
      width: 50,
      height: 40,
      marginRight: 15,
      objectFit: "contain",
    },
    companyName: {
      fontSize: 20,
      fontFamily: "Helvetica-Bold",
      color: color,
    },
    receiptLabel: {
      fontSize: 24,
      fontFamily: "Helvetica-Bold",
      color: color,
      textTransform: "uppercase",
    },
    // Company Details
    companyDetails: {
      marginTop: 10,
      paddingTop: 10,
    },
    companyInfo: {
      fontSize: 9,
      color: "#666666",
      marginBottom: 2,
    },
    // Receipt Info Section
    receiptInfoSection: {
      flexDirection: "row",
      marginBottom: 30,
    },
    infoColumn: {
      flex: 1,
    },
    infoColumnRight: {
      flex: 1,
      alignItems: "flex-end",
    },
    infoBox: {
      backgroundColor: "#f8f9fa",
      padding: 15,
      borderLeftWidth: 3,
      borderLeftColor: color,
      marginBottom: 10,
    },
    infoBoxLabel: {
      fontSize: 8,
      color: "#666666",
      textTransform: "uppercase",
      marginBottom: 3,
    },
    infoBoxValue: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
    },
    // Customer Section
    sectionTitle: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: color,
      marginBottom: 10,
      paddingBottom: 5,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
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
    // Payment Details Table
    table: {
      marginTop: 20,
      marginBottom: 20,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: color,
      padding: 10,
    },
    tableHeaderCell: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: "#ffffff",
      textTransform: "uppercase",
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
      padding: 10,
    },
    tableCell: {
      fontSize: 10,
      color: "#333333",
    },
    tableCellBold: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
    },
    // Amount Section
    amountSection: {
      marginTop: 20,
      marginBottom: 30,
      borderTopWidth: 2,
      borderTopColor: color,
      paddingTop: 15,
    },
    amountRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: 8,
    },
    amountLabel: {
      fontSize: 10,
      color: "#666666",
      width: 150,
      textAlign: "right",
      paddingRight: 20,
    },
    amountValue: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
      width: 120,
      textAlign: "right",
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 2,
      borderTopColor: color,
    },
    totalLabel: {
      fontSize: 12,
      fontFamily: "Helvetica-Bold",
      color: color,
      width: 150,
      textAlign: "right",
      paddingRight: 20,
    },
    totalValue: {
      fontSize: 14,
      fontFamily: "Helvetica-Bold",
      color: color,
      width: 120,
      textAlign: "right",
    },
    // Reference Section
    referenceSection: {
      backgroundColor: "#f8f9fa",
      padding: 15,
      marginTop: 20,
    },
    referenceTitle: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
      marginBottom: 10,
    },
    referenceRow: {
      flexDirection: "row",
      marginBottom: 5,
    },
    referenceLabel: {
      fontSize: 9,
      color: "#666666",
      width: 120,
    },
    referenceValue: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
    },
    // Notes
    notesSection: {
      marginTop: 20,
      padding: 15,
      borderWidth: 1,
      borderColor: "#e5e7eb",
      borderStyle: "dashed",
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
      position: "absolute",
      bottom: 40,
      left: 50,
      right: 50,
      borderTopWidth: 1,
      borderTopColor: "#e5e7eb",
      paddingTop: 15,
    },
    footerText: {
      fontSize: 9,
      color: "#666666",
      textAlign: "center",
    },
    // Status
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 3,
    },
    statusText: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#ffffff",
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
  });

const ClassicReceiptPDF = ({ companyInfo, receiptData, color = "#1e3a5f" }) => {
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
            </View>
            <Text style={styles.receiptLabel}>Payment Receipt</Text>
          </View>
          <View style={styles.companyDetails}>
            <Text style={styles.companyInfo}>{companyInfo?.address}</Text>
            <Text style={styles.companyInfo}>
              {[companyInfo?.city, companyInfo?.state]
                .filter(Boolean)
                .join(", ")}
            </Text>
            <Text style={styles.companyInfo}>
              Phone: {companyInfo?.phone} | Email: {companyInfo?.email}
            </Text>
          </View>
        </View>

        {/* Receipt Info Section */}
        <View style={styles.receiptInfoSection}>
          <View style={styles.infoColumn}>
            <Text style={styles.sectionTitle}>Received From:</Text>
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
          <View style={styles.infoColumnRight}>
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxLabel}>Receipt No.</Text>
              <Text style={styles.infoBoxValue}>{receiptData?.reference}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxLabel}>Date</Text>
              <Text style={styles.infoBoxValue}>{receiptData?.date}</Text>
            </View>
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

        {/* Payment Details Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Method</Text>
            <Text
              style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}
            >
              Amount
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 2 }]}>
              {receiptData?.type === "received"
                ? "Payment Received"
                : "Payment Made"}
              {receiptData?.invoice?.invoice_no &&
                ` - ${receiptData.invoice.invoice_no}`}
            </Text>
            <Text style={[styles.tableCell, { flex: 1.5 }]}>
              {formatMethod(receiptData?.method)}
            </Text>
            <Text
              style={[styles.tableCellBold, { flex: 1, textAlign: "right" }]}
            >
              {formatCurrency(receiptData?.amount)}
            </Text>
          </View>
        </View>

        {/* Amount Section */}
        <View style={styles.amountSection}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Subtotal:</Text>
            <Text style={styles.amountValue}>
              {formatCurrency(receiptData?.amount)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL PAID:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(receiptData?.amount)}
            </Text>
          </View>
        </View>

        {/* Invoice Reference */}
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
              <Text style={styles.referenceLabel}>Balance Before Payment:</Text>
              <Text style={styles.referenceValue}>
                {formatCurrency(receiptData.balance_before)}
              </Text>
            </View>
            <View style={styles.referenceRow}>
              <Text style={styles.referenceLabel}>Balance After Payment:</Text>
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
          <Text style={[styles.footerText, { marginTop: 3 }]}>
            This is a computer-generated receipt and does not require a
            signature.
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

export default ClassicReceiptPDF;
