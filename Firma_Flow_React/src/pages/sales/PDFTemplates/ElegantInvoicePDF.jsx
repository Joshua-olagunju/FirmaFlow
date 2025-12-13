import React from "react";
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

// Create styles that match the Elegant template EXACTLY
const createStyles = (color = "#667eea") =>
  StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 10,
      backgroundColor: "#ffffff",
    },
    // Top accent bar - gradient effect simulated with solid color
    accentBar: {
      height: 8,
      backgroundColor: color,
    },
    // Main content container
    content: {
      padding: 40,
    },
    // Header section - flex row with company branding and invoice badge
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 35,
    },
    // Company branding (left side)
    companyBranding: {
      flexDirection: "row",
      alignItems: "center",
    },
    logoContainer: {
      padding: 8,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: "#e5e5e5",
      marginRight: 12,
    },
    logo: {
      width: 48,
      height: 48,
      objectFit: "contain",
    },
    companyNameSection: {
      flexDirection: "column",
    },
    companyName: {
      fontSize: 22,
      fontFamily: "Helvetica",
      color: "#1a1a1a",
      letterSpacing: 0.5,
    },
    companyEmail: {
      fontSize: 9,
      color: "#888888",
      marginTop: 3,
    },
    // Invoice badge (right side)
    invoiceBadge: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: "#f8f8ff",
    },
    invoiceTitle: {
      fontSize: 20,
      fontFamily: "Helvetica",
      color: color,
      letterSpacing: 3,
      textAlign: "right",
    },
    invoiceNumber: {
      fontSize: 10,
      color: "#666666",
      marginTop: 4,
      textAlign: "right",
    },
    // Decorative divider with diamond
    decorativeDivider: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 35,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: "#e5e5e5",
    },
    dividerDiamond: {
      width: 10,
      height: 10,
      backgroundColor: color,
      marginHorizontal: 12,
      transform: "rotate(45deg)",
    },
    // Three column info section
    infoGrid: {
      flexDirection: "row",
      marginBottom: 35,
    },
    infoCard: {
      flex: 1,
      padding: 14,
      borderRadius: 8,
      backgroundColor: "#fafafa",
      borderLeftWidth: 3,
      borderLeftColor: color,
      marginRight: 15,
    },
    infoCardLast: {
      flex: 1,
      padding: 14,
      borderRadius: 8,
      backgroundColor: "#fafafa",
      borderLeftWidth: 3,
      borderLeftColor: color,
      marginRight: 0,
    },
    infoCardTitle: {
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      color: color,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 10,
    },
    infoCardName: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
      marginBottom: 4,
    },
    infoCardText: {
      fontSize: 9,
      color: "#666666",
      lineHeight: 1.5,
    },
    // Details card specific
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    detailLabel: {
      fontSize: 9,
      color: "#888888",
    },
    detailValue: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
    },
    detailValueAccent: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: color,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: "#f0f0ff",
    },
    statusText: {
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      color: color,
    },
    // Table styles
    tableContainer: {
      marginBottom: 35,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: color,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
      padding: 12,
    },
    tableHeaderText: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#ffffff",
    },
    tableRow: {
      flexDirection: "row",
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e5e5",
    },
    tableRowEven: {
      backgroundColor: "#fafafa",
    },
    tableRowOdd: {
      backgroundColor: "#ffffff",
    },
    tableColDesc: {
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
    tableCellTextLight: {
      fontSize: 10,
      color: "#666666",
    },
    tableCellTextBold: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#1a1a1a",
    },
    // Totals section
    totalsContainer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: 35,
    },
    totalsBox: {
      width: 240,
      borderRadius: 8,
      overflow: "hidden",
    },
    totalsSubSection: {
      padding: 14,
      backgroundColor: "#fafafa",
    },
    totalsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    totalsLabel: {
      fontSize: 10,
      color: "#666666",
    },
    totalsValue: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
    },
    discountValue: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#dc2626",
    },
    grandTotalSection: {
      padding: 14,
      backgroundColor: color,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    grandTotalLabel: {
      fontSize: 12,
      fontFamily: "Helvetica-Bold",
      color: "#ffffff",
    },
    grandTotalValue: {
      fontSize: 16,
      fontFamily: "Helvetica-Bold",
      color: "#ffffff",
    },
    // Payment section - dashed border style
    paymentSection: {
      padding: 18,
      borderRadius: 8,
      backgroundColor: "#fafaff",
      marginBottom: 30,
    },
    paymentHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 14,
    },
    paymentIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: color,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
    },
    paymentTitle: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
    },
    paymentGrid: {
      flexDirection: "row",
    },
    paymentItem: {
      flex: 1,
    },
    paymentLabel: {
      fontSize: 8,
      color: "#888888",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    paymentValue: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: "#333333",
    },
    // Footer
    footer: {
      textAlign: "center",
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: "#e5e5e5",
    },
    footerText: {
      fontSize: 10,
      fontFamily: "Helvetica-Oblique",
      color: "#888888",
      marginBottom: 12,
    },
    footerDecoration: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    footerLine: {
      width: 30,
      height: 1,
      backgroundColor: color,
    },
    footerDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: color,
      marginHorizontal: 8,
    },
    // Bottom accent bar
    bottomBar: {
      height: 8,
      backgroundColor: color,
    },
  });

const ElegantInvoicePDF = ({ color = "#667eea", companyInfo, invoiceData }) => {
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
        {/* Top Accent Bar */}
        <View style={styles.accentBar} />

        {/* Main Content */}
        <View style={styles.content}>
          {/* Header - Company Branding & Invoice Badge */}
          <View style={styles.header}>
            {/* Company Branding (Left) */}
            <View style={styles.companyBranding}>
              {companyInfo?.logo && (
                <View style={styles.logoContainer}>
                  <Image
                    src={companyInfo.logo}
                    style={styles.logo}
                    cache={false}
                  />
                </View>
              )}
              <View style={styles.companyNameSection}>
                <Text style={styles.companyName}>
                  {companyInfo?.name || "Company Name"}
                </Text>
                <Text style={styles.companyEmail}>{companyInfo?.email}</Text>
              </View>
            </View>

            {/* Invoice Badge (Right) */}
            <View style={styles.invoiceBadge}>
              <Text style={styles.invoiceTitle}>INVOICE</Text>
              <Text style={styles.invoiceNumber}>
                #{invoiceData?.invoiceNumber}
              </Text>
            </View>
          </View>

          {/* Decorative Divider */}
          <View style={styles.decorativeDivider}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerDiamond} />
            <View style={styles.dividerLine} />
          </View>

          {/* Three Column Info Section */}
          <View style={styles.infoGrid}>
            {/* From Section */}
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>From</Text>
              <Text style={styles.infoCardName}>{companyInfo?.name}</Text>
              <Text style={styles.infoCardText}>
                {companyInfo?.address}
                {"\n"}
                {[companyInfo?.city, companyInfo?.state]
                  .filter(Boolean)
                  .join(", ")}
                {"\n"}
                {companyInfo?.phone}
              </Text>
            </View>

            {/* Bill To Section */}
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>Bill To</Text>
              <Text style={styles.infoCardName}>
                {invoiceData?.customer?.name}
              </Text>
              <Text style={styles.infoCardText}>
                {invoiceData?.customer?.address}
                {"\n"}
                {invoiceData?.customer?.city}
                {"\n"}
                {invoiceData?.customer?.phone}
              </Text>
            </View>

            {/* Details Section */}
            <View style={styles.infoCardLast}>
              <Text style={styles.infoCardTitle}>Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Issue Date:</Text>
                <Text style={styles.detailValue}>{invoiceData?.date}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Due Date:</Text>
                <Text style={styles.detailValueAccent}>
                  {invoiceData?.dueDate}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {invoiceData?.status || "Pending"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Items Table */}
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.tableColDesc]}>
                Description
              </Text>
              <Text style={[styles.tableHeaderText, styles.tableColQty]}>
                Qty
              </Text>
              <Text style={[styles.tableHeaderText, styles.tableColRate]}>
                Rate
              </Text>
              <Text style={[styles.tableHeaderText, styles.tableColAmount]}>
                Amount
              </Text>
            </View>

            {/* Table Rows */}
            {invoiceData?.items?.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.tableRow,
                  index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                ]}
              >
                <Text style={[styles.tableCellText, styles.tableColDesc]}>
                  {item.description}
                </Text>
                <Text style={[styles.tableCellTextLight, styles.tableColQty]}>
                  {item.quantity}
                </Text>
                <Text style={[styles.tableCellTextLight, styles.tableColRate]}>
                  {formatCurrency(item.rate)}
                </Text>
                <Text style={[styles.tableCellTextBold, styles.tableColAmount]}>
                  {formatCurrency(item.amount)}
                </Text>
              </View>
            ))}
          </View>

          {/* Totals Section */}
          <View style={styles.totalsContainer}>
            <View style={styles.totalsBox}>
              {/* Subtotals */}
              <View style={styles.totalsSubSection}>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Subtotal</Text>
                  <Text style={styles.totalsValue}>
                    {formatCurrency(invoiceData?.subtotal)}
                  </Text>
                </View>
                {invoiceData?.discount > 0 && (
                  <View style={styles.totalsRow}>
                    <Text style={styles.totalsLabel}>Discount</Text>
                    <Text style={styles.discountValue}>
                      -{formatCurrency(invoiceData?.discount)}
                    </Text>
                  </View>
                )}
                {invoiceData?.tax > 0 && (
                  <View style={[styles.totalsRow, { marginBottom: 0 }]}>
                    <Text style={styles.totalsLabel}>Tax (7.5%)</Text>
                    <Text style={styles.totalsValue}>
                      {formatCurrency(invoiceData?.tax)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Grand Total */}
              <View style={styles.grandTotalSection}>
                <Text style={styles.grandTotalLabel}>Total Due</Text>
                <Text style={styles.grandTotalValue}>
                  {formatCurrency(invoiceData?.total)}
                </Text>
              </View>
            </View>
          </View>

          {/* Payment Information */}
          {companyInfo?.bank_account && (
            <View style={styles.paymentSection}>
              <View style={styles.paymentHeader}>
                <View style={styles.paymentIcon}>
                  <Svg width="14" height="14" viewBox="0 0 24 24">
                    <Path
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </Svg>
                </View>
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

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Thank you for your business!</Text>
            <View style={styles.footerDecoration}>
              <View style={styles.footerLine} />
              <View style={styles.footerDot} />
              <View style={styles.footerLine} />
            </View>
          </View>
        </View>

        {/* Bottom Accent Bar */}
        <View style={styles.bottomBar} />
      </Page>
    </Document>
  );
};

export default ElegantInvoicePDF;
