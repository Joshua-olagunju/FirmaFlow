import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

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
    width: 60,
    height: 60,
    objectFit: "contain",
  },
  companyInfo: {
    textAlign: "right",
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
  },
  invoiceNumber: {
    fontSize: 11,
    color: "#666",
  },
  billToSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  billTo: {
    width: "45%",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
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
  tableCol1: { width: "45%" },
  tableCol2: { width: "15%", textAlign: "right" },
  tableCol3: { width: "20%", textAlign: "right" },
  tableCol4: { width: "20%", textAlign: "right" },
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
  },
  paymentInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f0f0f0",
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

const ModernInvoicePDF = ({
  companyInfo,
  invoiceData,
  color,
  showPaymentInfo,
}) => {
  // Debug logging
  console.log("ModernInvoicePDF - companyInfo:", companyInfo);
  console.log("ModernInvoicePDF - invoiceData:", invoiceData);
  console.log("ModernInvoicePDF - logo:", companyInfo?.logo);
  console.log(
    "ModernInvoicePDF - logo starts with data:",
    companyInfo?.logo?.startsWith("data:")
  );
  console.log("ModernInvoicePDF - items:", invoiceData?.items);
  console.log(
    "ModernInvoicePDF - formatCurrency type:",
    typeof invoiceData?.formatCurrency
  );

  // Use formatCurrency from invoiceData if available, otherwise use simple formatter
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

  // Test the formatCurrency function
  console.log("ModernInvoicePDF - formatCurrency test:", formatCurrency(1000));
  console.log(
    "ModernInvoicePDF - currency symbol test:",
    invoiceData?.currency
  );

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
            {isFirstPage && (
              <>
                <View style={styles.header}>
                  <View>
                    {companyInfo?.logo &&
                      companyInfo.logo.startsWith("data:") && (
                        <Image
                          src={companyInfo.logo}
                          style={styles.logo}
                          cache={false}
                        />
                      )}
                    <Text
                      style={[
                        styles.invoiceTitle,
                        { color: color || "#667eea" },
                      ]}
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
                    <Text style={{ fontSize: 9, marginBottom: 2 }}>
                      {companyInfo?.address}
                    </Text>
                    <Text style={{ fontSize: 9, marginBottom: 2 }}>
                      {companyInfo?.city}, {companyInfo?.state}
                    </Text>
                    <Text style={{ fontSize: 9, marginBottom: 2 }}>
                      {companyInfo?.phone}
                    </Text>
                    <Text style={{ fontSize: 9 }}>{companyInfo?.email}</Text>
                  </View>
                </View>

                <View style={styles.billToSection}>
                  <View style={styles.billTo}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: color || "#667eea" },
                      ]}
                    >
                      BILL TO:
                    </Text>
                    <Text style={{ fontWeight: "bold", marginBottom: 3 }}>
                      {invoiceData?.customer?.name}
                    </Text>
                    <Text style={{ fontSize: 9 }}>
                      {invoiceData?.customer?.address}
                    </Text>
                    <Text style={{ fontSize: 9 }}>
                      {invoiceData?.customer?.email}
                    </Text>
                  </View>
                  <View style={styles.billTo}>
                    <View style={{ marginBottom: 5 }}>
                      <Text style={{ fontWeight: "bold" }}>Invoice Date:</Text>
                      <Text>{invoiceData?.date}</Text>
                    </View>
                    <View>
                      <Text style={{ fontWeight: "bold" }}>Due Date:</Text>
                      <Text>{invoiceData?.dueDate}</Text>
                    </View>
                  </View>
                </View>
              </>
            )}

            {!isFirstPage && (
              <Text
                style={{ fontSize: 14, fontWeight: "bold", marginBottom: 20 }}
              >
                Invoice #{invoiceData?.invoiceNumber} (Continued)
              </Text>
            )}

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

            {isLastPage && (
              <>
                <View style={styles.totals}>
                  <View style={styles.totalRow}>
                    <Text>Subtotal:</Text>
                    <Text>{formatCurrency(invoiceData?.subtotal)}</Text>
                  </View>
                  {invoiceData?.discount > 0 && (
                    <View style={styles.totalRow}>
                      <Text>Discount:</Text>
                      <Text>-{formatCurrency(invoiceData.discount)}</Text>
                    </View>
                  )}
                  {invoiceData?.tax > 0 && (
                    <View style={styles.totalRow}>
                      <Text>Tax:</Text>
                      <Text>{formatCurrency(invoiceData.tax)}</Text>
                    </View>
                  )}
                  <View style={styles.grandTotal}>
                    <Text>Total:</Text>
                    <Text>{formatCurrency(invoiceData?.total)}</Text>
                  </View>
                </View>

                {invoiceData?.notes && (
                  <View style={styles.notes} break={pageItems.length > 12}>
                    <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
                      Notes:
                    </Text>
                    <Text style={{ fontSize: 9 }}>{invoiceData.notes}</Text>
                  </View>
                )}

                {showPaymentInfo && companyInfo?.bank_name && (
                  <View
                    style={styles.paymentInfo}
                    break={pageItems.length > 10}
                  >
                    <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
                      Payment Information:
                    </Text>
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
                )}
              </>
            )}

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

export default ModernInvoicePDF;
