import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Create styles that match the Elegant template
const createStyles = (color = "#667eea") =>
  StyleSheet.create({
    page: {
      padding: 40,
      fontFamily: "Times-Roman",
      fontSize: 10,
      backgroundColor: "#ffffff",
    },
    // Elegant header with double border
    elegantHeader: {
      border: `4pt double ${color}`,
      padding: 30,
      marginBottom: 30,
    },
    headerCenter: {
      textAlign: "center",
      marginBottom: 20,
    },
    logo: {
      width: 80,
      height: 64,
      marginLeft: "auto",
      marginRight: "auto",
      marginBottom: 12,
      objectFit: "contain",
    },
    companyName: {
      fontSize: 24,
      fontFamily: "Times-Roman",
      color: color,
      marginBottom: 10,
      letterSpacing: 2,
    },
    divider: {
      width: 80,
      height: 1.5,
      backgroundColor: color,
      marginLeft: "auto",
      marginRight: "auto",
      marginVertical: 12,
    },
    companyInfo: {
      fontSize: 10,
      color: "#666",
      marginBottom: 2,
    },
    // Invoice title
    invoiceTitleSection: {
      textAlign: "center",
      marginBottom: 30,
    },
    invoiceTitle: {
      fontSize: 20,
      fontFamily: "Times-Roman",
      color: color,
      letterSpacing: 3,
    },
    invoiceNumber: {
      fontSize: 10,
      color: "#666",
      fontFamily: "Times-Roman",
      marginTop: 5,
    },
    // Details grid
    detailsGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 35,
    },
    detailColumn: {
      flex: 1,
      paddingHorizontal: 10,
    },
    detailDivider: {
      width: 40,
      height: 1,
      backgroundColor: color,
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 10,
      fontFamily: "Times-Bold",
      color: color,
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    customerName: {
      fontSize: 11,
      fontFamily: "Times-Bold",
      color: "#333",
      marginBottom: 4,
    },
    customerInfo: {
      fontSize: 10,
      color: "#666",
      marginBottom: 2,
    },
    dateLabel: {
      fontSize: 9,
      color: "#999",
      marginBottom: 2,
    },
    dateValue: {
      fontSize: 10,
      fontFamily: "Times-Bold",
      color: "#333",
      marginBottom: 8,
    },
    // Table styles
    table: {
      marginBottom: 30,
      border: `1pt solid ${color}30`,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: `${color}10`,
      borderBottomWidth: 2,
      borderBottomColor: color,
      padding: 12,
      fontFamily: "Times-Bold",
      fontSize: 10,
      color: color,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#f0f0f0",
      padding: 12,
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
      fontFamily: "Times-Bold",
    },
    // Totals section
    totalsSection: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: 30,
    },
    totalsBox: {
      width: 260,
      border: `1pt solid ${color}30`,
      padding: 15,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: "#f0f0f0",
    },
    totalLabel: {
      fontSize: 10,
      color: "#666",
      fontFamily: "Times-Roman",
    },
    totalValue: {
      fontSize: 10,
      fontFamily: "Times-Bold",
      color: "#333",
    },
    discountValue: {
      fontSize: 10,
      fontFamily: "Times-Bold",
      color: "#dc2626",
    },
    grandTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 12,
      marginTop: 10,
      borderTopWidth: 2,
      borderTopColor: color,
      backgroundColor: `${color}05`,
    },
    grandTotalLabel: {
      fontSize: 13,
      fontFamily: "Times-Bold",
      color: color,
      letterSpacing: 1,
    },
    grandTotalValue: {
      fontSize: 13,
      fontFamily: "Times-Bold",
      color: color,
    },
    // Payment info
    paymentSection: {
      borderTopWidth: 1,
      borderTopColor: color,
      paddingTop: 20,
      marginBottom: 20,
    },
    paymentTitle: {
      fontSize: 11,
      fontFamily: "Times-Bold",
      color: "#333",
      marginBottom: 12,
      textAlign: "center",
    },
    paymentGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    paymentItem: {
      flex: 1,
      textAlign: "center",
    },
    paymentLabel: {
      fontSize: 9,
      color: "#666",
      marginBottom: 3,
    },
    paymentValue: {
      fontSize: 10,
      fontFamily: "Times-Bold",
      color: "#333",
    },
    // Footer
    footer: {
      borderTopWidth: 1,
      borderTopColor: "#e5e7eb",
      paddingTop: 20,
      textAlign: "center",
    },
    footerDivider: {
      width: 60,
      height: 1,
      backgroundColor: color,
      marginLeft: "auto",
      marginRight: "auto",
      marginBottom: 8,
    },
    footerText: {
      fontSize: 10,
      color: "#666",
      fontFamily: "Times-Italic",
      letterSpacing: 0.5,
    },
  });

const ElegantInvoicePDF = ({ color = "#667eea", companyInfo, invoiceData }) => {
  const styles = createStyles(color);

  const formatCurrency =
    invoiceData?.formatCurrency ||
    ((amount) => {
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
    });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Elegant Header with Double Border */}
        <View style={styles.elegantHeader}>
          <View style={styles.headerSection}>
            {companyInfo?.logo && companyInfo.logo.startsWith("data:") && (
              <Image src={companyInfo.logo} style={styles.logo} cache={false} />
            )}
            <Text style={styles.companyName}>
              {companyInfo?.name || "Company Name"}
            </Text>
            <View style={styles.divider} />
            <Text style={styles.companyInfo}>{companyInfo?.address}</Text>
            <Text style={styles.companyInfo}>
              {companyInfo?.city}, {companyInfo?.state}
            </Text>
            <Text style={styles.companyInfo}>
              {companyInfo?.phone} • {companyInfo?.email}
            </Text>
          </View>
        </View>

        {/* Invoice Title */}
        <View style={styles.invoiceTitleSection}>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <Text style={styles.invoiceNumber}>{invoiceData?.invoiceNumber}</Text>
        </View>

        {/* Elegant Details Grid */}
        <View style={styles.detailsGrid}>
          {/* Bill To */}
          <View style={styles.detailColumn}>
            <View style={styles.detailDivider} />
            <Text style={styles.sectionTitle}>Bill To</Text>
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

          {/* Invoice Details */}
          <View style={styles.detailColumn}>
            <View style={styles.detailDivider} />
            <Text style={styles.sectionTitle}>Invoice Details</Text>
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.dateLabel}>Invoice Date</Text>
              <Text style={styles.dateValue}>{invoiceData?.date}</Text>
            </View>
            <View>
              <Text style={styles.dateLabel}>Due Date</Text>
              <Text style={styles.dateValue}>{invoiceData?.dueDate}</Text>
            </View>
          </View>

          {/* Payment Terms */}
          <View style={styles.detailColumn}>
            <View style={styles.detailDivider} />
            <Text style={styles.sectionTitle}>Payment Terms</Text>
            <Text style={styles.customerInfo}>Due upon receipt</Text>
            <Text style={styles.customerInfo}>Net 30 days</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.tableColDescription}>Description</Text>
            <Text style={styles.tableColQty}>Qty</Text>
            <Text style={styles.tableColRate}>Rate</Text>
            <Text style={styles.tableColAmount}>Amount</Text>
          </View>

          {/* Table Rows */}
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
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoiceData?.subtotal)}
              </Text>
            </View>

            {invoiceData?.discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={styles.discountValue}>
                  -{formatCurrency(invoiceData?.discount)}
                </Text>
              </View>
            )}

            {invoiceData?.tax > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax (7.5%)</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(invoiceData?.tax)}
                </Text>
              </View>
            )}

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(invoiceData?.total)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Info */}
        {companyInfo?.bank_account && (
          <View style={styles.paymentSection}>
            <Text style={styles.paymentTitle}>Payment Information</Text>
            <View style={styles.paymentGrid}>
              <View style={styles.paymentItem}>
                <Text style={styles.paymentLabel}>Bank Name</Text>
                <Text style={styles.paymentValue}>{companyInfo.bank_name}</Text>
              </View>
              <View style={styles.paymentItem}>
                <Text style={styles.paymentLabel}>Account Number</Text>
                <Text style={styles.paymentValue}>
                  {companyInfo.bank_account}
                </Text>
              </View>
              <View style={styles.paymentItem}>
                <Text style={styles.paymentLabel}>Account Name</Text>
                <Text style={styles.paymentValue}>
                  {companyInfo.account_name}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>Thank you for your patronage</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ElegantInvoicePDF;
