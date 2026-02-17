import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    objectFit: "contain",
  },
  companyInfo: {
    textAlign: "right",
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  invoiceNumber: {
    fontSize: 12,
    color: "#666",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  billToSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  billTo: {
    width: "45%",
  },
  invoiceDetails: {
    width: "45%",
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    paddingBottom: 5,
    marginBottom: 10,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tableCol1: {
    width: "45%",
  },
  tableCol2: {
    width: "15%",
    textAlign: "right",
  },
  tableCol3: {
    width: "20%",
    textAlign: "right",
  },
  tableCol4: {
    width: "20%",
    textAlign: "right",
  },
  totals: {
    marginTop: 20,
    marginLeft: "auto",
    width: "40%",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  totalLabel: {
    fontSize: 10,
  },
  totalValue: {
    fontSize: 10,
    textAlign: "right",
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#000",
    fontWeight: "bold",
    fontSize: 12,
  },
  notes: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: "#666",
    lineHeight: 1.5,
  },
  paymentInfo: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#999",
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 10,
  },
  pageNumber: {
    position: "absolute",
    fontSize: 8,
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#999",
  },
});

const InvoicePDFTemplate = ({
  companyInfo,
  invoiceData,
  color,
  showPaymentInfo,
}) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: invoiceData?.currency || "NGN",
    }).format(amount || 0);
  };

  // Split items into pages if needed (max 15 items per page for safety)
  const itemsPerPage = 15;
  const totalPages = Math.ceil(
    (invoiceData?.items?.length || 0) / itemsPerPage
  );

  return (
    <Document>
      {Array.from({ length: Math.max(1, totalPages) }).map((_, pageIndex) => {
        const startIdx = pageIndex * itemsPerPage;
        const endIdx = startIdx + itemsPerPage;
        const pageItems = invoiceData?.items?.slice(startIdx, endIdx) || [];
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === totalPages - 1;

        return (
          <Page key={pageIndex} size="A4" style={styles.page}>
            {/* Header - Only on first page */}
            {isFirstPage && (
              <View style={styles.header}>
                <View>
                  {companyInfo?.logo && (
                    <Image src={companyInfo.logo} style={styles.logo} />
                  )}
                  <Text
                    style={[styles.invoiceTitle, { color: color || "#667eea" }]}
                  >
                    INVOICE
                  </Text>
                  <Text style={styles.invoiceNumber}>
                    #{invoiceData?.invoiceNumber}
                  </Text>
                </View>
                <View style={styles.companyInfo}>
                  <Text style={styles.companyName}>
                    {companyInfo?.name ||
                      companyInfo?.company_name ||
                      "Company Name"}
                  </Text>
                  {companyInfo?.address && (
                    <Text style={{ fontSize: 9, marginBottom: 2 }}>
                      {companyInfo.address}
                    </Text>
                  )}
                  {companyInfo?.city && companyInfo?.state && (
                    <Text style={{ fontSize: 9, marginBottom: 2 }}>
                      {companyInfo.city}, {companyInfo.state}
                    </Text>
                  )}
                  {companyInfo?.phone && (
                    <Text style={{ fontSize: 9, marginBottom: 2 }}>
                      {companyInfo.phone}
                    </Text>
                  )}
                  {companyInfo?.email && (
                    <Text style={{ fontSize: 9 }}>{companyInfo.email}</Text>
                  )}
                </View>
              </View>
            )}

            {/* Bill To and Invoice Details - Only on first page */}
            {isFirstPage && (
              <View style={styles.billToSection}>
                <View style={styles.billTo}>
                  <Text
                    style={[styles.sectionTitle, { color: color || "#667eea" }]}
                  >
                    BILL TO:
                  </Text>
                  <Text style={{ fontWeight: "bold", marginBottom: 3 }}>
                    {invoiceData?.customer?.name || "Customer Name"}
                  </Text>
                  {invoiceData?.customer?.address && (
                    <Text style={{ fontSize: 9, marginBottom: 2 }}>
                      {invoiceData.customer.address}
                    </Text>
                  )}
                  {invoiceData?.customer?.email && (
                    <Text style={{ fontSize: 9, marginBottom: 2 }}>
                      {invoiceData.customer.email}
                    </Text>
                  )}
                  {invoiceData?.customer?.phone && (
                    <Text style={{ fontSize: 9 }}>
                      {invoiceData.customer.phone}
                    </Text>
                  )}
                </View>

                <View style={styles.invoiceDetails}>
                  <View style={styles.row}>
                    <Text style={{ fontWeight: "bold" }}>Invoice Date:</Text>
                    <Text>{invoiceData?.date || ""}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={{ fontWeight: "bold" }}>Due Date:</Text>
                    <Text>{invoiceData?.dueDate || ""}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Page continuation indicator */}
            {!isFirstPage && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: "bold" }}>
                  Invoice #{invoiceData?.invoiceNumber} (Continued)
                </Text>
              </View>
            )}

            {/* Items Table */}
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCol1}>Description</Text>
                <Text style={styles.tableCol2}>Qty</Text>
                <Text style={styles.tableCol3}>Rate</Text>
                <Text style={styles.tableCol4}>Amount</Text>
              </View>

              {pageItems.map((item, idx) => (
                <View key={startIdx + idx} style={styles.tableRow}>
                  <Text style={styles.tableCol1}>{item.description}</Text>
                  <Text style={styles.tableCol2}>{item.quantity}</Text>
                  <Text style={styles.tableCol3}>
                    {formatCurrency(item.rate)}
                  </Text>
                  <Text style={styles.tableCol4}>
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Totals - Only on last page */}
            {isLastPage && (
              <>
                <View style={styles.totals}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Subtotal:</Text>
                    <Text style={styles.totalValue}>
                      {formatCurrency(invoiceData?.subtotal)}
                    </Text>
                  </View>

                  {invoiceData?.discount > 0 && (
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Discount:</Text>
                      <Text style={styles.totalValue}>
                        -{formatCurrency(invoiceData.discount)}
                      </Text>
                    </View>
                  )}

                  {invoiceData?.shipping > 0 && (
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Shipping:</Text>
                      <Text style={styles.totalValue}>
                        {formatCurrency(invoiceData.shipping)}
                      </Text>
                    </View>
                  )}

                  {invoiceData?.tax > 0 && (
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Tax:</Text>
                      <Text style={styles.totalValue}>
                        {formatCurrency(invoiceData.tax)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.grandTotal}>
                    <Text>Total:</Text>
                    <Text>{formatCurrency(invoiceData?.total)}</Text>
                  </View>
                </View>

                {/* Notes */}
                {invoiceData?.notes && (
                  <View style={styles.notes} break={pageItems.length > 12}>
                    <Text style={styles.notesTitle}>Notes:</Text>
                    <Text style={styles.notesText}>{invoiceData.notes}</Text>
                  </View>
                )}

                {/* Payment Information */}
                {showPaymentInfo && companyInfo?.bank_name && (
                  <View
                    style={styles.paymentInfo}
                    break={pageItems.length > 10}
                  >
                    <Text style={styles.notesTitle}>Payment Information:</Text>
                    <View style={{ marginTop: 5 }}>
                      <Text style={{ fontSize: 9, marginBottom: 3 }}>
                        Bank: {companyInfo.bank_name}
                      </Text>
                      <Text style={{ fontSize: 9, marginBottom: 3 }}>
                        Account Name:{" "}
                        {companyInfo.account_name || companyInfo.name}
                      </Text>
                      <Text style={{ fontSize: 9 }}>
                        Account Number: {companyInfo.account_number}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}

            {/* Page Number */}
            <Text
              style={styles.pageNumber}
              render={({ pageNumber, totalPages }) =>
                `Page ${pageNumber} of ${totalPages}`
              }
              fixed
            />
          </Page>
        );
      })}
    </Document>
  );
};

export default InvoicePDFTemplate;
