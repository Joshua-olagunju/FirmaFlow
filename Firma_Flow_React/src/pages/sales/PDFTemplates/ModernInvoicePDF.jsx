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
import "./fontConfig"; // Register NotoSans font for Unicode currency symbols

// Create styles that match the Modern template EXACTLY
// eslint-disable-next-line no-unused-vars
const createStyles = (color = "#667eea") =>
  StyleSheet.create({
    page: {
      padding: 40,
      fontSize: 10,
      fontFamily: "NotoSans",
      backgroundColor: "#ffffff",
      position: "relative",
    },
    // Diagonal design overlay at top right (like the Modern template)
    diagonalDesign: {
      position: "absolute",
      top: 0,
      right: 0,
      width: 200,
      height: 200,
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
    invoiceTitle: {
      fontSize: 32,
      fontFamily: "NotoSans",
      fontWeight: 700,
      marginBottom: 5,
    },
    invoiceNumber: {
      fontSize: 10,
      color: "#666666",
    },
    companyName: {
      fontSize: 18,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#333333",
      marginBottom: 5,
    },
    companyInfo: {
      fontSize: 9,
      color: "#666666",
      marginBottom: 2,
      textAlign: "right",
    },
    // Bill To Section
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
      fontFamily: "NotoSans",
      fontWeight: 700,
      marginBottom: 8,
    },
    customerName: {
      fontSize: 11,
      fontFamily: "NotoSans",
      fontWeight: 700,
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
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#333333",
      marginBottom: 8,
    },
    // Table styles
    table: {
      marginBottom: 25,
    },
    tableHeader: {
      flexDirection: "row",
      padding: 10,
      fontFamily: "NotoSans",
      fontWeight: 700,
      fontSize: 10,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
      padding: 10,
      fontSize: 10,
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
      fontFamily: "NotoSans",
      fontWeight: 700,
    },
    // Totals section
    totalsSection: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: 25,
    },
    totalsBox: {
      width: 220,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
    },
    totalLabel: {
      fontSize: 10,
      color: "#666666",
    },
    totalValue: {
      fontSize: 10,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#333333",
    },
    discountValue: {
      fontSize: 10,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#dc2626",
    },
    grandTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 10,
      marginTop: 8,
      paddingHorizontal: 8,
    },
    grandTotalLabel: {
      fontSize: 14,
      fontFamily: "NotoSans",
      fontWeight: 700,
    },
    grandTotalValue: {
      fontSize: 14,
      fontFamily: "NotoSans",
      fontWeight: 700,
    },
    // Payment info
    paymentSection: {
      borderTopWidth: 1,
      borderTopColor: "#e5e7eb",
      paddingTop: 20,
      marginBottom: 20,
    },
    paymentTitle: {
      fontSize: 11,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#333333",
      marginBottom: 10,
    },
    paymentGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    paymentItem: {
      flex: 1,
    },
    paymentLabel: {
      fontSize: 9,
      color: "#666666",
      marginBottom: 2,
    },
    paymentValue: {
      fontSize: 10,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#333333",
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
  });

const ModernInvoicePDF = ({
  companyInfo,
  invoiceData,
  color = "#667eea",
  showPaymentInfo,
}) => {
  const styles = createStyles(color);

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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Diagonal Design at Top Right - Triangle shape matching Modern template */}
        <Svg style={styles.diagonalDesign} viewBox="0 0 200 200">
          <Path d="M200 0 L0 0 L200 200 Z" fill={color} opacity="0.1" />
        </Svg>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.leftHeader}>
            {companyInfo?.logo && (
              <Image src={companyInfo.logo} style={styles.logo} cache={false} />
            )}
            <Text style={[styles.invoiceTitle, { color: color }]}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>
              #{invoiceData?.invoiceNumber}
            </Text>
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

        {/* Invoice Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailColumn}>
            <Text style={[styles.sectionTitle, { color: color }]}>
              BILL TO:
            </Text>
            <Text style={styles.customerName}>
              {invoiceData?.customer?.name}
            </Text>
            <Text style={styles.customerInfo}>
              {invoiceData?.customer?.address}
            </Text>
            <Text style={styles.customerInfo}>
              {invoiceData?.customer?.city}
            </Text>
            <Text style={styles.customerInfo}>
              {invoiceData?.customer?.phone}
            </Text>
          </View>
          <View style={styles.detailColumnRight}>
            <Text style={styles.dateLabel}>Invoice Date:</Text>
            <Text style={styles.dateValue}>{invoiceData?.date}</Text>
            <Text style={styles.dateLabel}>Due Date:</Text>
            <Text style={styles.dateValue}>{invoiceData?.dueDate}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={[styles.tableHeader, { backgroundColor: `${color}15` }]}>
            <Text style={[styles.tableColDescription, { color: color }]}>
              Description
            </Text>
            <Text style={[styles.tableColQty, { color: color }]}>Qty</Text>
            <Text style={[styles.tableColRate, { color: color }]}>Rate</Text>
            <Text style={[styles.tableColAmount, { color: color }]}>
              Amount
            </Text>
          </View>
          {invoiceData?.items?.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableColDescription}>{item.description}</Text>
              <Text style={styles.tableColQty}>{item.quantity}</Text>
              <Text style={styles.tableColRate}>
                {formatCurrency(item.rate)}
              </Text>
              <Text style={styles.tableColAmount}>
                {formatCurrency(item.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoiceData?.subtotal)}
              </Text>
            </View>
            {invoiceData?.discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount:</Text>
                <Text style={styles.discountValue}>
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
            <View
              style={[styles.grandTotalRow, { backgroundColor: `${color}15` }]}
            >
              <Text style={[styles.grandTotalLabel, { color: color }]}>
                TOTAL:
              </Text>
              <Text style={[styles.grandTotalValue, { color: color }]}>
                {formatCurrency(invoiceData?.total)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Info */}
        {showPaymentInfo !== false && companyInfo?.bank_name && (
          <View style={styles.paymentSection}>
            <Text style={styles.paymentTitle}>Payment Information</Text>
            <View style={styles.paymentGrid}>
              <View style={styles.paymentItem}>
                <Text style={styles.paymentLabel}>Bank Name:</Text>
                <Text style={styles.paymentValue}>{companyInfo.bank_name}</Text>
              </View>
              <View style={styles.paymentItem}>
                <Text style={styles.paymentLabel}>Account Number:</Text>
                <Text style={styles.paymentValue}>
                  {companyInfo.account_number || companyInfo.bank_account}
                </Text>
              </View>
              <View style={styles.paymentItem}>
                <Text style={styles.paymentLabel}>Account Name:</Text>
                <Text style={styles.paymentValue}>
                  {companyInfo.account_name || companyInfo.name}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your business!</Text>
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

export default ModernInvoicePDF;
