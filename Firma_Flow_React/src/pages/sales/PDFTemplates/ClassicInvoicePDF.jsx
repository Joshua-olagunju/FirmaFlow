import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Create styles that match the Classic template
const createStyles = (color = "#667eea") =>
  StyleSheet.create({
    page: {
      padding: 40,
      fontFamily: "Times-Roman",
      fontSize: 10,
      backgroundColor: "#ffffff",
    },
    // Outer double border
    outerBorder: {
      border: `4pt double ${color}`,
      padding: 24,
      marginBottom: 20,
    },
    // Header section
    headerCenter: {
      textAlign: "center",
      marginBottom: 20,
    },
    logo: {
      width: 80,
      height: 60,
      marginLeft: "auto",
      marginRight: "auto",
      marginBottom: 10,
      objectFit: "contain",
    },
    companyName: {
      fontSize: 20,
      fontFamily: "Times-Bold",
      color: "#333",
      marginBottom: 5,
    },
    companyInfo: {
      fontSize: 10,
      color: "#666",
      marginBottom: 2,
    },
    invoiceTitle: {
      fontSize: 18,
      fontFamily: "Times-Bold",
      color: color,
      marginTop: 15,
    },
    invoiceNumber: {
      fontSize: 10,
      color: "#666",
      marginTop: 3,
    },
    // Details section
    detailsSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 25,
    },
    detailBox: {
      width: "48%",
      border: `1pt solid ${color}40`,
      padding: 12,
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: "Times-Bold",
      color: color,
      borderBottomWidth: 1,
      borderBottomColor: color,
      paddingBottom: 6,
      marginBottom: 8,
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
      fontSize: 10,
      color: "#666",
      marginBottom: 2,
    },
    dateValue: {
      fontSize: 11,
      fontFamily: "Times-Bold",
      color: "#333",
      marginBottom: 10,
    },
    // Table styles
    table: {
      marginBottom: 25,
      border: `1pt solid ${color}`,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: `${color}15`,
      borderBottomWidth: 2,
      borderBottomColor: color,
      padding: 10,
      fontFamily: "Times-Bold",
      fontSize: 10,
      color: color,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
      padding: 10,
      fontSize: 10,
    },
    tableColDescription: {
      flex: 4,
    },
    tableColQty: {
      flex: 1,
      textAlign: "center",
    },
    tableColRate: {
      flex: 2,
      textAlign: "right",
    },
    tableColAmount: {
      flex: 2,
      textAlign: "right",
      fontFamily: "Times-Bold",
    },
    // Totals section
    totalsSection: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: 25,
    },
    totalsBox: {
      width: 250,
      border: `1pt solid ${color}40`,
      padding: 10,
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
      color: "#666",
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
      paddingVertical: 10,
      backgroundColor: `${color}15`,
      paddingHorizontal: 10,
      marginTop: 8,
      borderWidth: 1,
      borderColor: color,
    },
    grandTotalLabel: {
      fontSize: 14,
      fontFamily: "Times-Bold",
      color: color,
    },
    grandTotalValue: {
      fontSize: 14,
      fontFamily: "Times-Bold",
      color: color,
    },
    // Payment info
    paymentSection: {
      borderTopWidth: 2,
      borderTopColor: color,
      paddingTop: 15,
      marginBottom: 15,
    },
    paymentTitle: {
      fontSize: 12,
      fontFamily: "Times-Bold",
      color: "#333",
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
      color: "#666",
      marginBottom: 2,
    },
    paymentValue: {
      fontSize: 10,
      fontFamily: "Times-Bold",
      color: "#333",
    },
    // Footer
    footer: {
      borderTopWidth: 1,
      borderTopColor: "#666",
      paddingTop: 15,
      textAlign: "center",
    },
    footerText: {
      fontSize: 10,
      color: "#666",
      fontStyle: "italic",
    },
  });

const ClassicInvoicePDF = ({ color = "#667eea", companyInfo, invoiceData }) => {
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
        {/* Header with Double Border */}
        <View style={styles.outerBorder}>
          <View style={styles.headerCenter}>
            {companyInfo?.logo && companyInfo.logo.startsWith("data:") && (
              <Image src={companyInfo.logo} style={styles.logo} cache={false} />
            )}
            <Text style={styles.companyName}>
              {companyInfo?.name || "Company Name"}
            </Text>
            <Text style={styles.companyInfo}>{companyInfo?.address}</Text>
            <Text style={styles.companyInfo}>
              {companyInfo?.city}, {companyInfo?.state}
            </Text>
            <Text style={styles.companyInfo}>
              {companyInfo?.phone} | {companyInfo?.email}
            </Text>
          </View>

          <View style={{ textAlign: "center" }}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>
              #{invoiceData?.invoiceNumber}
            </Text>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          {/* Bill To */}
          <View style={styles.detailBox}>
            <Text style={styles.sectionTitle}>BILLED TO:</Text>
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

          {/* Dates */}
          <View style={styles.detailBox}>
            <Text style={styles.sectionTitle}>INVOICE DETAILS:</Text>
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.dateLabel}>Invoice Date:</Text>
              <Text style={styles.dateValue}>{invoiceData?.date}</Text>
            </View>
            <View>
              <Text style={styles.dateLabel}>Due Date:</Text>
              <Text style={styles.dateValue}>{invoiceData?.dueDate}</Text>
            </View>
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

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL:</Text>
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
                <Text style={styles.paymentLabel}>Bank Name:</Text>
                <Text style={styles.paymentValue}>{companyInfo.bank_name}</Text>
              </View>
              <View style={styles.paymentItem}>
                <Text style={styles.paymentLabel}>Account Number:</Text>
                <Text style={styles.paymentValue}>
                  {companyInfo.bank_account}
                </Text>
              </View>
              <View style={styles.paymentItem}>
                <Text style={styles.paymentLabel}>Account Name:</Text>
                <Text style={styles.paymentValue}>
                  {companyInfo.account_name}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your business!</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ClassicInvoicePDF;
