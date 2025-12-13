import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Create styles that match the Minimal template
const createStyles = (color = "#667eea") =>
  StyleSheet.create({
    page: {
      padding: 40,
      fontFamily: "Helvetica",
      fontSize: 10,
      backgroundColor: "#ffffff",
    },
    // Minimal Header with bottom border
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 40,
      paddingBottom: 20,
      borderBottomWidth: 2,
      borderBottomColor: color,
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
      marginBottom: 8,
      objectFit: "contain",
    },
    companyName: {
      fontSize: 16,
      fontFamily: "Helvetica-Bold",
      color: "#333",
    },
    invoiceTitle: {
      fontSize: 36,
      fontFamily: "Helvetica",
      color: color,
    },
    invoiceNumber: {
      fontSize: 10,
      color: "#666",
      marginTop: 5,
    },
    // Clean Info Layout
    infoGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 40,
      fontSize: 10,
    },
    infoColumn: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 9,
      color: "#999",
      textTransform: "uppercase",
      marginBottom: 6,
    },
    infoText: {
      fontSize: 10,
      color: "#333",
      marginBottom: 2,
    },
    // Table styles
    table: {
      marginBottom: 30,
    },
    tableHeader: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: color,
      paddingBottom: 8,
      marginBottom: 8,
      fontFamily: "Helvetica",
      fontSize: 9,
      color: "#666",
      textTransform: "uppercase",
    },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: "#f0f0f0",
      fontSize: 10,
    },
    tableColDescription: {
      flex: 3,
    },
    tableColQty: {
      flex: 1,
      textAlign: "right",
    },
    tableColRate: {
      flex: 1.5,
      textAlign: "right",
    },
    tableColAmount: {
      flex: 1.5,
      textAlign: "right",
      fontFamily: "Helvetica-Bold",
    },
    // Totals section
    totalsSection: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: 30,
    },
    totalsBox: {
      width: 220,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 5,
      fontSize: 10,
    },
    totalLabel: {
      color: "#666",
    },
    totalValue: {
      fontFamily: "Helvetica-Bold",
      color: "#333",
    },
    discountValue: {
      fontFamily: "Helvetica-Bold",
      color: "#dc2626",
    },
    grandTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 12,
      marginTop: 8,
      borderTopWidth: 2,
      borderTopColor: color,
    },
    grandTotalLabel: {
      fontSize: 12,
      fontFamily: "Helvetica-Bold",
      color: color,
    },
    grandTotalValue: {
      fontSize: 12,
      fontFamily: "Helvetica-Bold",
      color: color,
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
      fontFamily: "Helvetica-Bold",
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
      fontFamily: "Helvetica-Bold",
      color: "#333",
    },
    // Footer
    footer: {
      borderTopWidth: 1,
      borderTopColor: "#e5e7eb",
      paddingTop: 15,
      textAlign: "center",
    },
    footerText: {
      fontSize: 9,
      color: "#999",
    },
    notes: {
      marginTop: 30,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: "#e5e7eb",
    },
    notesTitle: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#333",
      marginBottom: 5,
    },
    notesText: {
      fontSize: 9,
      color: "#666",
      lineHeight: 1.4,
    },
  });

const MinimalInvoicePDF = ({ color = "#667eea", companyInfo, invoiceData }) => {
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
        "NGN ";
      const formatted = parseFloat(amount || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return `${symbol}${formatted}`;
    });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Minimal Header */}
        <View style={styles.header}>
          {/* Left: Logo and Company Name */}
          <View style={styles.leftHeader}>
            {companyInfo?.logo && (
              <Image src={companyInfo.logo} style={styles.logo} cache={false} />
            )}
            <Text style={styles.companyName}>
              {companyInfo?.name || "Company Name"}
            </Text>
          </View>

          {/* Right: Invoice Title */}
          <View style={styles.rightHeader}>
            <Text style={styles.invoiceTitle}>Invoice</Text>
            <Text style={styles.invoiceNumber}>
              {invoiceData?.invoiceNumber}
            </Text>
          </View>
        </View>

        {/* Clean Info Layout */}
        <View style={styles.infoGrid}>
          {/* From */}
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>From</Text>
            <Text style={styles.infoText}>{companyInfo?.address}</Text>
            <Text style={styles.infoText}>{companyInfo?.city}</Text>
            <Text style={styles.infoText}>{companyInfo?.phone}</Text>
          </View>

          {/* Bill To */}
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Bill To</Text>
            <Text style={styles.infoText}>{invoiceData?.customer?.name}</Text>
            <Text style={styles.infoText}>
              {invoiceData?.customer?.address}
            </Text>
            <Text style={styles.infoText}>{invoiceData?.customer?.city}</Text>
          </View>

          {/* Dates */}
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Invoice Details</Text>
            <Text style={styles.infoText}>Date: {invoiceData?.date}</Text>
            <Text style={styles.infoText}>Due: {invoiceData?.dueDate}</Text>
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
              <Text style={styles.grandTotalLabel}>Total</Text>
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
          <Text style={styles.footerText}>Thank you for your business</Text>
        </View>
      </Page>
    </Document>
  );
};

export default MinimalInvoicePDF;
