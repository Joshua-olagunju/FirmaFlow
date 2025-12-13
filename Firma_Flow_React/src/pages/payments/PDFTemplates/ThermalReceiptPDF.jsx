import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Thermal/POS-style receipt - narrower width
const createStyles = (color = "#000000") =>
  StyleSheet.create({
    page: {
      padding: 20,
      paddingHorizontal: 25,
      fontSize: 9,
      fontFamily: "Courier",
      backgroundColor: "#ffffff",
      width: 226, // 80mm thermal paper width
    },
    // Header
    header: {
      textAlign: "center",
      marginBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: "#000000",
      borderBottomStyle: "dashed",
      paddingBottom: 15,
    },
    logo: {
      width: 50,
      height: 40,
      marginBottom: 8,
      alignSelf: "center",
      objectFit: "contain",
    },
    companyName: {
      fontSize: 14,
      fontFamily: "Courier-Bold",
      textAlign: "center",
      marginBottom: 5,
    },
    companyInfo: {
      fontSize: 8,
      textAlign: "center",
      marginBottom: 2,
      color: "#333333",
    },
    // Receipt Title
    titleSection: {
      textAlign: "center",
      marginBottom: 12,
    },
    receiptTitle: {
      fontSize: 12,
      fontFamily: "Courier-Bold",
      textAlign: "center",
      marginBottom: 3,
    },
    receiptNumber: {
      fontSize: 9,
      textAlign: "center",
      color: "#666666",
    },
    // Divider
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: "#000000",
      borderBottomStyle: "dashed",
      marginVertical: 10,
    },
    // Info rows
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    infoLabel: {
      fontSize: 8,
      color: "#666666",
    },
    infoValue: {
      fontSize: 8,
      fontFamily: "Courier-Bold",
      textAlign: "right",
    },
    // Customer Section
    customerSection: {
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 9,
      fontFamily: "Courier-Bold",
      marginBottom: 5,
    },
    customerName: {
      fontSize: 9,
      fontFamily: "Courier-Bold",
      marginBottom: 2,
    },
    customerInfo: {
      fontSize: 8,
      color: "#333333",
      marginBottom: 2,
    },
    // Payment Details
    paymentSection: {
      backgroundColor: "#f5f5f5",
      padding: 10,
      marginVertical: 10,
    },
    paymentRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 5,
    },
    paymentLabel: {
      fontSize: 8,
    },
    paymentValue: {
      fontSize: 8,
      fontFamily: "Courier-Bold",
    },
    // Total
    totalSection: {
      borderTopWidth: 2,
      borderTopColor: "#000000",
      borderBottomWidth: 2,
      borderBottomColor: "#000000",
      paddingVertical: 10,
      marginVertical: 10,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    totalLabel: {
      fontSize: 12,
      fontFamily: "Courier-Bold",
    },
    totalValue: {
      fontSize: 12,
      fontFamily: "Courier-Bold",
    },
    // Reference
    referenceSection: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: "#000000",
      borderTopStyle: "dashed",
    },
    referenceTitle: {
      fontSize: 8,
      fontFamily: "Courier-Bold",
      marginBottom: 5,
    },
    referenceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 3,
    },
    referenceLabel: {
      fontSize: 7,
      color: "#666666",
    },
    referenceValue: {
      fontSize: 7,
    },
    // Notes
    notesSection: {
      marginTop: 10,
      padding: 8,
      backgroundColor: "#f9f9f9",
      borderWidth: 1,
      borderColor: "#e5e5e5",
    },
    notesTitle: {
      fontSize: 8,
      fontFamily: "Courier-Bold",
      marginBottom: 3,
    },
    notesText: {
      fontSize: 7,
      color: "#666666",
    },
    // Footer
    footer: {
      marginTop: 15,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: "#000000",
      borderTopStyle: "dashed",
      textAlign: "center",
    },
    footerText: {
      fontSize: 8,
      textAlign: "center",
      marginBottom: 3,
    },
    footerTextSmall: {
      fontSize: 7,
      textAlign: "center",
      color: "#666666",
    },
    // Status
    statusText: {
      fontSize: 8,
      fontFamily: "Courier-Bold",
      textAlign: "center",
      marginTop: 5,
    },
    // Stars decoration
    starsText: {
      fontSize: 8,
      textAlign: "center",
      letterSpacing: 2,
    },
  });

const ThermalReceiptPDF = ({ companyInfo, receiptData, color = "#000000" }) => {
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
      <Page size={{ width: 226, height: 842 }} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {companyInfo?.logo && (
            <Image src={companyInfo.logo} style={styles.logo} cache={false} />
          )}
          <Text style={styles.companyName}>
            {companyInfo?.name || companyInfo?.company_name || "Company Name"}
          </Text>
          <Text style={styles.companyInfo}>{companyInfo?.address}</Text>
          <Text style={styles.companyInfo}>
            {[companyInfo?.city, companyInfo?.state].filter(Boolean).join(", ")}
          </Text>
          <Text style={styles.companyInfo}>Tel: {companyInfo?.phone}</Text>
        </View>

        {/* Receipt Title */}
        <View style={styles.titleSection}>
          <Text style={styles.starsText}>* * * * * * * * * *</Text>
          <Text style={styles.receiptTitle}>PAYMENT RECEIPT</Text>
          <Text style={styles.receiptNumber}>#{receiptData?.reference}</Text>
          <Text style={styles.starsText}>* * * * * * * * * *</Text>
        </View>

        {/* Date/Time Info */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date:</Text>
          <Text style={styles.infoValue}>{receiptData?.date}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Time:</Text>
          <Text style={styles.infoValue}>{receiptData?.time || "--:--"}</Text>
        </View>

        <View style={styles.divider} />

        {/* Customer Section */}
        <View style={styles.customerSection}>
          <Text style={styles.sectionTitle}>RECEIVED FROM:</Text>
          <Text style={styles.customerName}>
            {receiptData?.customer?.name ||
              receiptData?.entity_name ||
              "Customer"}
          </Text>
          {receiptData?.customer?.phone && (
            <Text style={styles.customerInfo}>
              {receiptData.customer.phone}
            </Text>
          )}
        </View>

        <View style={styles.divider} />

        {/* Payment Details */}
        <View style={styles.paymentSection}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment Type:</Text>
            <Text style={styles.paymentValue}>
              {receiptData?.type === "received" ? "RECEIVED" : "MADE"}
            </Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Method:</Text>
            <Text style={styles.paymentValue}>
              {formatMethod(receiptData?.method)}
            </Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Status:</Text>
            <Text style={styles.paymentValue}>
              {receiptData?.status?.toUpperCase() || "COMPLETED"}
            </Text>
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(receiptData?.amount)}
            </Text>
          </View>
        </View>

        {/* Invoice Reference */}
        {receiptData?.invoice && (
          <View style={styles.referenceSection}>
            <Text style={styles.referenceTitle}>INVOICE REF:</Text>
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
              <Text style={styles.referenceLabel}>Balance:</Text>
              <Text style={styles.referenceValue}>
                {formatCurrency(receiptData.balance_after)}
              </Text>
            </View>
          </View>
        )}

        {/* Notes */}
        {receiptData?.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Note:</Text>
            <Text style={styles.notesText}>{receiptData.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your payment!</Text>
          <Text style={styles.footerTextSmall}>
            Please keep this receipt for your records
          </Text>
          <Text style={styles.starsText}>* * * * * * * * * *</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ThermalReceiptPDF;
