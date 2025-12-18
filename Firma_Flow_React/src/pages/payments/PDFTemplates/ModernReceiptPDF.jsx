import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import "./pdfFonts"; // Register Unicode fonts
import { currencySymbols } from "./pdfFonts";

// Modern Receipt - Fresh redesign matching ModernReceipt.jsx - thermal width
const createStyles = (color = "#667eea") =>
  StyleSheet.create({
    page: {
      fontSize: 10,
      fontFamily: "NotoSans",
      backgroundColor: "#ffffff",
      width: 226, // 80mm thermal width
    },
    // Colored Header Bar
    headerBar: {
      padding: 16,
      backgroundColor: color,
      textAlign: "center",
    },
    headerSubtitle: {
      fontSize: 9,
      color: "#ffffffee",
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#ffffff",
      marginBottom: 8,
    },
    headerDate: {
      fontSize: 8,
      color: "#ffffffcc",
    },
    // Company Info Card
    companyCard: {
      padding: 16,
      backgroundColor: "#f9fafb",
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
    },
    companyCardCentered: {
      textAlign: "center",
    },
    companyName: {
      fontSize: 9,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#1f2937",
      marginBottom: 4,
    },
    companyInfo: {
      fontSize: 8,
      color: "#6b7280",
      marginBottom: 2,
    },
    companyInfoRow: {
      fontSize: 8,
      color: "#6b7280",
      marginTop: 4,
    },
    // Customer Section
    customerSection: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
    },
    sectionLabel: {
      fontSize: 8,
      color: color,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    customerName: {
      fontSize: 9,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#111827",
      marginBottom: 4,
    },
    customerInfo: {
      fontSize: 8,
      color: "#6b7280",
      marginBottom: 2,
    },
    // Payment Method & Status
    paymentStatusSection: {
      padding: 16,
      backgroundColor: "#f9fafb",
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
    },
    paymentRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    paymentRowLabel: {
      fontSize: 8,
      color: "#6b7280",
    },
    paymentRowValue: {
      fontSize: 8,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#111827",
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 3,
    },
    statusText: {
      fontSize: 8,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#ffffff",
    },
    // Items Section
    itemsSection: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
    },
    itemRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    itemDetails: {
      flex: 1,
    },
    itemName: {
      fontSize: 8,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#111827",
      marginBottom: 2,
    },
    itemQty: {
      fontSize: 8,
      color: "#6b7280",
    },
    itemTotal: {
      fontSize: 8,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#111827",
      textAlign: "right",
    },
    // Totals Section
    totalsSection: {
      padding: 16,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    totalLabel: {
      fontSize: 8,
      color: "#6b7280",
    },
    totalValue: {
      fontSize: 8,
      color: "#111827",
    },
    discountValue: {
      fontSize: 8,
      color: "#dc2626",
    },
    grandTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: 12,
      marginTop: 12,
      borderTopWidth: 2,
      borderTopColor: color,
    },
    grandTotalLabel: {
      fontSize: 9,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: color,
    },
    grandTotalValue: {
      fontSize: 14,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: color,
    },
    // Invoice Reference
    invoiceSection: {
      padding: 16,
      backgroundColor: "#f9fafb",
      borderTopWidth: 1,
      borderTopColor: "#e5e7eb",
    },
    invoiceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    invoiceLabel: {
      fontSize: 8,
      color: "#6b7280",
    },
    invoiceValue: {
      fontSize: 8,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#111827",
    },
    // Notes Section
    notesSection: {
      padding: 16,
      backgroundColor: "#fef3c7",
      borderTopWidth: 1,
      borderTopColor: "#fcd34d",
    },
    notesTitle: {
      fontSize: 8,
      fontFamily: "NotoSans",
      fontWeight: 700,
      color: "#78350f",
      marginBottom: 4,
    },
    notesText: {
      fontSize: 8,
      color: "#92400e",
    },
    // Footer
    footer: {
      padding: 16,
      backgroundColor: "#f9fafb",
      borderTopWidth: 1,
      borderTopColor: "#e5e7eb",
      textAlign: "center",
    },
    footerText: {
      fontSize: 8,
      color: "#6b7280",
      marginBottom: 4,
    },
    footerTextSmall: {
      fontSize: 7,
      color: "#9ca3af",
    },
  });

const ModernReceiptPDF = ({ companyInfo, receiptData, color = "#667eea" }) => {
  const styles = createStyles(color);

  // Currency formatter with actual Unicode currency symbols (NotoSans font required)
  const formatCurrency = (amount) => {
    const symbol =
      currencySymbols[receiptData?.currency] || receiptData?.currency || "₦";
    const formatted = parseFloat(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${symbol}${formatted}`;
  };

  const formatMethod = (method) => {
    if (!method) return "N/A";
    return method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <Document>
      <Page size={{ width: 226, height: 842 }} style={styles.page}>
        {/* Colored Header Bar */}
        <View style={styles.headerBar}>
          <Text style={styles.headerSubtitle}>PAYMENT RECEIPT</Text>
          <Text style={styles.headerTitle}>
            #{receiptData?.reference || receiptData?.receiptNumber}
          </Text>
          <Text style={styles.headerDate}>{receiptData?.date}</Text>
        </View>

        {/* Company Info Card */}
        <View style={styles.companyCard}>
          <View style={styles.companyCardCentered}>
            <Text style={styles.companyName}>
              {companyInfo?.name || companyInfo?.company_name || "Company Name"}
            </Text>
            <Text style={styles.companyInfo}>{companyInfo?.address}</Text>
            <Text style={styles.companyInfo}>
              {[companyInfo?.city, companyInfo?.state]
                .filter(Boolean)
                .join(", ")}
            </Text>
            <Text style={styles.companyInfoRow}>
              {companyInfo?.phone} • {companyInfo?.email}
            </Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.customerSection}>
          <Text style={styles.sectionLabel}>Received From</Text>
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
          {receiptData?.customer?.email && (
            <Text style={styles.customerInfo}>
              {receiptData.customer.email}
            </Text>
          )}
        </View>

        {/* Payment Method & Status */}
        <View style={styles.paymentStatusSection}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentRowLabel}>Payment Method</Text>
            <Text style={styles.paymentRowValue}>
              {formatMethod(receiptData?.paymentMethod || receiptData?.method)}
            </Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentRowLabel}>Status</Text>
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

        {/* Items */}
        {receiptData?.items && receiptData.items.length > 0 && (
          <View style={styles.itemsSection}>
            <Text style={styles.sectionLabel}>Items</Text>
            {receiptData.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQty}>
                    {item.quantity} x {formatCurrency(item.price)}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  {formatCurrency(item.total)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Totals */}
        <View style={styles.totalsSection}>
          {receiptData?.subtotal && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(receiptData.subtotal)}
              </Text>
            </View>
          )}
          {receiptData?.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={styles.discountValue}>
                -{formatCurrency(receiptData.discount)}
              </Text>
            </View>
          )}
          {receiptData?.tax > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(receiptData.tax)}
              </Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL PAID</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(
                receiptData?.amountPaid ||
                  receiptData?.total ||
                  receiptData?.amount
              )}
            </Text>
          </View>
        </View>

        {/* Invoice Reference */}
        {receiptData?.invoice && (
          <View style={styles.invoiceSection}>
            <Text style={styles.sectionLabel}>Invoice Reference</Text>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Invoice #:</Text>
              <Text style={styles.invoiceValue}>
                {receiptData.invoice.invoice_no || receiptData.invoice_number}
              </Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Invoice Total:</Text>
              <Text style={styles.invoiceValue}>
                {formatCurrency(
                  receiptData.invoice_total || receiptData.invoice?.total
                )}
              </Text>
            </View>
            {receiptData.balance_after !== undefined && (
              <View style={styles.invoiceRow}>
                <Text style={styles.invoiceLabel}>Balance:</Text>
                <Text style={styles.invoiceValue}>
                  {formatCurrency(receiptData.balance_after)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Notes */}
        {receiptData?.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Note</Text>
            <Text style={styles.notesText}>{receiptData.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your payment!</Text>
          <Text style={styles.footerTextSmall}>Powered by FirmaFlow</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ModernReceiptPDF;
