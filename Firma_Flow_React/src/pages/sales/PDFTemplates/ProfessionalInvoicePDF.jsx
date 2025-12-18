import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Svg,
  Circle,
} from "@react-pdf/renderer";
import "./fontConfig"; // Register NotoSans font for Unicode currency symbols

// Create styles that match the Professional template exactly
const createStyles = (color = "#667eea") =>
  StyleSheet.create({
    page: {
      fontFamily: "NotoSans",
      fontSize: 10,
      backgroundColor: "#ffffff",
    },
    // Professional colored header - matches HTML exactly
    coloredHeader: {
      backgroundColor: color,
      paddingVertical: 30,
      paddingHorizontal: 32,
      color: "#ffffff",
    },
    headerContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    leftHeaderSection: {
      flexDirection: "column",
    },
    rightHeaderSection: {
      alignItems: "flex-end",
    },
    logoContainer: {
      backgroundColor: "#ffffff",
      padding: 8,
      borderRadius: 4,
      width: 70,
      marginBottom: 10,
    },
    logo: {
      width: 48,
      height: 40,
      objectFit: "contain",
    },
    companyName: {
      fontSize: 22,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#ffffff",
      marginBottom: 4,
    },
    companyEmail: {
      fontSize: 10,
      color: "rgba(255, 255, 255, 0.8)",
    },
    invoiceTitle: {
      fontSize: 30,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#ffffff",
      marginBottom: 6,
    },
    invoiceNumber: {
      fontSize: 11,
      color: "rgba(255, 255, 255, 0.9)",
    },
    // Content area
    content: {
      padding: 32,
    },
    // Info Grid - matches HTML layout
    infoGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 32,
    },
    leftInfoColumn: {
      flex: 1,
    },
    rightInfoColumn: {
      alignItems: "flex-end",
    },
    // Company Address Section
    companyAddressSection: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 9,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#888888",
      textTransform: "uppercase",
      marginBottom: 8,
    },
    addressText: {
      fontSize: 10,
      color: "#333333",
      marginBottom: 2,
    },
    // Bill To Section
    billToSection: {
      marginTop: 4,
    },
    customerName: {
      fontSize: 13,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#333333",
      marginBottom: 4,
    },
    customerInfo: {
      fontSize: 10,
      color: "#555555",
      marginBottom: 2,
    },
    // Date Box - gray background matches HTML bg-gray-50
    dateBox: {
      backgroundColor: "#f9fafb",
      padding: 14,
      borderRadius: 8,
    },
    dateSection: {
      marginBottom: 14,
    },
    dateLabel: {
      fontSize: 10,
      color: "#666666",
      marginBottom: 3,
    },
    dateValue: {
      fontSize: 13,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#333333",
    },
    dueDateValue: {
      fontSize: 13,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: color,
    },
    // Table styles - matches HTML bg-color-20
    table: {
      marginBottom: 32,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: `${color}20`,
      padding: 14,
    },
    tableHeaderText: {
      fontSize: 10,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#333333",
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
      padding: 14,
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
    },
    tableCellText: {
      fontSize: 10,
      color: "#333333",
    },
    tableCellTextBold: {
      fontSize: 10,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#333333",
    },
    // Totals section - matches HTML bg-gray-50 rounded-lg
    totalsSection: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: 32,
    },
    totalsBox: {
      width: 280,
      backgroundColor: "#f9fafb",
      borderRadius: 8,
      padding: 20,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
    },
    totalLabel: {
      fontSize: 10,
      color: "#555555",
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
      alignItems: "center",
      paddingTop: 14,
      marginTop: 10,
      borderTopWidth: 2,
      borderTopColor: color,
    },
    grandTotalLabel: {
      fontSize: 14,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#333333",
    },
    grandTotalValue: {
      fontSize: 18,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: color,
    },
    // Payment section - matches HTML bg-blue-50 with left border
    paymentSection: {
      backgroundColor: "#eff6ff",
      borderLeftWidth: 4,
      borderLeftColor: color,
      borderRadius: 4,
      padding: 20,
      marginBottom: 20,
    },
    paymentHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 14,
    },
    paymentDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: color,
      marginRight: 8,
    },
    paymentTitle: {
      fontSize: 12,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#333333",
    },
    paymentGrid: {
      flexDirection: "row",
    },
    paymentItem: {
      flex: 1,
    },
    paymentLabel: {
      fontSize: 9,
      color: "#666666",
      marginBottom: 4,
    },
    paymentValue: {
      fontSize: 12,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#333333",
    },
    // Footer - matches HTML bg-gray-100
    footer: {
      backgroundColor: "#f3f4f6",
      paddingVertical: 20,
      paddingHorizontal: 32,
      textAlign: "center",
    },
    footerText: {
      fontSize: 10,
      color: "#666666",
      marginBottom: 4,
    },
    footerSubtext: {
      fontSize: 9,
      color: "#888888",
    },
  });

const ProfessionalInvoicePDF = ({
  color = "#667eea",
  companyInfo,
  invoiceData,
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
        {/* Professional Colored Header */}
        <View style={styles.coloredHeader}>
          <View style={styles.headerContent}>
            {/* Left: Company Info with Logo */}
            <View style={styles.leftHeaderSection}>
              {companyInfo?.logo && (
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
          {/* Info Grid - Two Column Layout */}
          <View style={styles.infoGrid}>
            {/* Left Column: Company Address + Bill To */}
            <View style={styles.leftInfoColumn}>
              {/* Company Address Section */}
              <View style={styles.companyAddressSection}>
                <Text style={styles.sectionTitle}>Company Address</Text>
                <Text style={styles.addressText}>{companyInfo?.address}</Text>
                <Text style={styles.addressText}>
                  {[companyInfo?.city, companyInfo?.state]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
                <Text style={styles.addressText}>{companyInfo?.phone}</Text>
              </View>

              {/* Bill To Section */}
              <View style={styles.billToSection}>
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
            </View>

            {/* Right Column: Date Box */}
            <View style={styles.rightInfoColumn}>
              <View style={styles.dateBox}>
                <View style={styles.dateSection}>
                  <Text style={styles.dateLabel}>Invoice Date</Text>
                  <Text style={styles.dateValue}>{invoiceData?.date}</Text>
                </View>
                <View>
                  <Text style={styles.dateLabel}>Due Date</Text>
                  <Text style={styles.dueDateValue}>
                    {invoiceData?.dueDate}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Items Table */}
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text
                style={[styles.tableHeaderText, styles.tableColDescription]}
              >
                Description
              </Text>
              <Text style={[styles.tableHeaderText, styles.tableColQty]}>
                Qty
              </Text>
              <Text style={[styles.tableHeaderText, styles.tableColRate]}>
                Unit Price
              </Text>
              <Text style={[styles.tableHeaderText, styles.tableColAmount]}>
                Amount
              </Text>
            </View>

            {/* Table Rows */}
            {invoiceData?.items?.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text
                  style={[styles.tableCellText, styles.tableColDescription]}
                >
                  {item.description}
                </Text>
                <Text style={[styles.tableCellText, styles.tableColQty]}>
                  {item.quantity}
                </Text>
                <Text style={[styles.tableCellText, styles.tableColRate]}>
                  {formatCurrency(item.rate)}
                </Text>
                <Text style={[styles.tableCellTextBold, styles.tableColAmount]}>
                  {formatCurrency(item.amount)}
                </Text>
              </View>
            ))}
          </View>

          {/* Totals in Gray Box */}
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

              {/* Grand Total with colored border-top */}
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>Total Due:</Text>
                <Text style={styles.grandTotalValue}>
                  {formatCurrency(invoiceData?.total)}
                </Text>
              </View>
            </View>
          </View>

          {/* Payment Info - Blue background with left border */}
          {companyInfo?.bank_account && (
            <View style={styles.paymentSection}>
              <View style={styles.paymentHeader}>
                <View style={styles.paymentDot} />
                <Text style={styles.paymentTitle}>Payment Information</Text>
              </View>
              <View style={styles.paymentGrid}>
                <View style={styles.paymentItem}>
                  <Text style={styles.paymentLabel}>Bank Name</Text>
                  <Text style={styles.paymentValue}>
                    {companyInfo.bank_name}
                  </Text>
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
        </View>

        {/* Footer - Gray background */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your business!</Text>
          <Text style={styles.footerSubtext}>
            Please make payment by the due date
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default ProfessionalInvoicePDF;
