import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Create styles that match the Professional template
const createStyles = (color = "#667eea") =>
  StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 10,
      backgroundColor: "#ffffff",
    },
    // Professional colored header
    coloredHeader: {
      backgroundColor: color,
      padding: 30,
      color: "#ffffff",
    },
    headerContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    leftHeaderSection: {
      flex: 1,
    },
    rightHeaderSection: {
      flex: 1,
      alignItems: "flex-end",
    },
    logoContainer: {
      backgroundColor: "#ffffff",
      padding: 6,
      borderRadius: 4,
      marginBottom: 8,
      width: 70,
    },
    logo: {
      width: 58,
      height: 48,
      objectFit: "contain",
    },
    companyName: {
      fontSize: 20,
      fontFamily: "Helvetica-Bold",
      color: "#ffffff",
      marginBottom: 3,
    },
    companyEmail: {
      fontSize: 10,
      color: "rgba(255, 255, 255, 0.8)",
    },
    invoiceTitle: {
      fontSize: 28,
      fontFamily: "Helvetica-Bold",
      color: "#ffffff",
      marginBottom: 5,
    },
    invoiceNumber: {
      fontSize: 11,
      color: "rgba(255, 255, 255, 0.9)",
    },
    // Content area
    content: {
      padding: 30,
    },
    // Info Grid
    infoGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 30,
    },
    infoColumn: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: "#999",
      textTransform: "uppercase",
      marginBottom: 8,
    },
    companyAddress: {
      fontSize: 10,
      color: "#333",
      marginBottom: 2,
    },
    customerName: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: "#333",
      marginBottom: 3,
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
      fontFamily: "Helvetica-Bold",
      color: "#333",
      marginBottom: 8,
    },
    // Table styles
    table: {
      marginBottom: 25,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: "#f9fafb",
      borderBottomWidth: 2,
      borderBottomColor: color,
      padding: 10,
      fontFamily: "Helvetica-Bold",
      fontSize: 9,
      color: "#666",
      textTransform: "uppercase",
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
      fontFamily: "Helvetica-Bold",
    },
    // Totals section
    totalsSection: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: 25,
    },
    totalsBox: {
      width: 240,
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
      fontFamily: "Helvetica-Bold",
      color: "#333",
    },
    discountValue: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#dc2626",
    },
    grandTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 12,
      marginTop: 8,
      backgroundColor: color,
      paddingHorizontal: 10,
    },
    grandTotalLabel: {
      fontSize: 14,
      fontFamily: "Helvetica-Bold",
      color: "#ffffff",
    },
    grandTotalValue: {
      fontSize: 14,
      fontFamily: "Helvetica-Bold",
      color: "#ffffff",
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
      fontSize: 10,
      color: "#666",
    },
  });

const ProfessionalInvoicePDF = ({
  color = "#667eea",
  companyInfo,
  invoiceData,
}) => {
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
        {/* Professional Colored Header */}
        <View style={styles.coloredHeader}>
          <View style={styles.headerContent}>
            {/* Left: Company Info */}
            <View style={styles.leftHeaderSection}>
              {companyInfo?.logo && companyInfo.logo.startsWith("data:") && (
                <View style={styles.logoContainer}>
                  <Image
                    src={companyInfo.logo}
                    style={styles.logo}
                    cache={false}
                  />
                </View>
              )}
              <Text style={styles.companyName}>
                {companyInfo?.name || "Company Name"}
              </Text>
              <Text style={styles.companyEmail}>{companyInfo?.email}</Text>
            </View>

            {/* Right: Invoice Title */}
            <View style={styles.rightHeaderSection}>
              <Text style={styles.invoiceTitle}>INVOICE</Text>
              <Text style={styles.invoiceNumber}>
                #{invoiceData?.invoiceNumber}
              </Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Info Grid */}
          <View style={styles.infoGrid}>
            {/* Company Address */}
            <View style={styles.infoColumn}>
              <Text style={styles.sectionTitle}>Company Address</Text>
              <Text style={styles.companyAddress}>{companyInfo?.address}</Text>
              <Text style={styles.companyAddress}>
                {companyInfo?.city}, {companyInfo?.state}
              </Text>
              <Text style={styles.companyAddress}>{companyInfo?.phone}</Text>
            </View>

            {/* Bill To */}
            <View style={styles.infoColumn}>
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
            <View style={styles.infoColumn}>
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
                <Text style={styles.tableColDescription}>
                  {item.description}
                </Text>
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
                  <Text style={styles.paymentValue}>
                    {companyInfo.bank_name}
                  </Text>
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
        </View>
      </Page>
    </Document>
  );
};

export default ProfessionalInvoicePDF;
