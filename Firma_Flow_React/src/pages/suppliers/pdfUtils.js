/**
 * Export supplier report to PDF
 * @param {Object} supplier - Supplier data
 * @param {Array} invoices - Purchase history data
 * @param {Array} payments - Payment history data
 * @param {Object} stats - Supplier statistics (totalSpending, totalPayments, balance)
 */
export const exportToPDF = (supplier, invoices, payments, stats) => {
  // Create a new window for PDF generation
  const printWindow = window.open("", "_blank");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Supplier Report - ${supplier.companyName}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #667eea;
          padding-bottom: 15px;
        }
        .header h1 {
          color: #667eea;
          margin: 0;
        }
        .supplier-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }
        .stat-card {
          background: white;
          border: 1px solid #e2e8f0;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
        }
        .stat-label {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 5px;
        }
        .stat-value {
          font-size: 20px;
          font-weight: bold;
          color: #667eea;
        }
        .section {
          margin-bottom: 30px;
        }
        .section h2 {
          color: #667eea;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        th {
          background: #f8f9fa;
          font-weight: 600;
          color: #475569;
        }
        .total-row {
          background: #f1f5f9;
          font-weight: bold;
        }
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }
        .status-active { background: #dcfce7; color: #16a34a; }
        .status-inactive { background: #fee2e2; color: #dc2626; }
        .status-paid { background: #dcfce7; color: #16a34a; }
        .status-partial { background: #dbeafe; color: #2563eb; }
        .status-unpaid { background: #fee2e2; color: #dc2626; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Supplier Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>

      <div class="supplier-info">
        <h3>${supplier.companyName}</h3>
        <p><strong>Contact Person:</strong> ${
          supplier.contactPerson || "N/A"
        }</p>
        <p><strong>Email:</strong> ${supplier.email || "N/A"}</p>
        <p><strong>Phone:</strong> ${supplier.phone || "N/A"}</p>
        <p><strong>Address:</strong> ${supplier.address || "N/A"}</p>
        <p><strong>Tax Number:</strong> ${supplier.taxNumber || "N/A"}</p>
        <p><strong>Payment Terms:</strong> ${supplier.paymentTerms || "N/A"}</p>
        <p><strong>Status:</strong> <span class="status-badge status-${
          supplier.status === "Active" ? "active" : "inactive"
        }">${supplier.status}</span></p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Purchases</div>
          <div class="stat-value">₦${(
            stats.totalSpending || 0
          ).toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Payments</div>
          <div class="stat-value">₦${(
            stats.totalPayments || 0
          ).toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Amount Due</div>
          <div class="stat-value">₦${(
            stats.balance || 0
          ).toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Status</div>
          <div class="stat-value">${supplier.status}</div>
        </div>
      </div>

      <div class="section">
        <h2>Purchase History</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Invoice #</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Paid</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${
              invoices.length > 0
                ? invoices
                    .map(
                      (inv) => `
              <tr>
                <td>${inv.date}</td>
                <td>${inv.invoiceNumber}</td>
                <td>${inv.description}</td>
                <td>₦${(inv.amount || 0).toLocaleString()}</td>
                <td>₦${(inv.paid || 0).toLocaleString()}</td>
                <td><span class="status-badge status-${inv.status.toLowerCase()}">${
                        inv.status
                      }</span></td>
              </tr>
            `
                    )
                    .join("")
                : '<tr><td colspan="6" style="text-align: center; color: #94a3b8;">No purchases found</td></tr>'
            }
            ${
              invoices.length > 0
                ? `
              <tr class="total-row">
                <td colspan="3">Purchase Totals</td>
                <td>₦${invoices
                  .reduce((sum, inv) => sum + (inv.amount || 0), 0)
                  .toLocaleString()}</td>
                <td>₦${invoices
                  .reduce((sum, inv) => sum + (inv.paid || 0), 0)
                  .toLocaleString()}</td>
                <td>-</td>
              </tr>
            `
                : ""
            }
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>Payment History</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Method</th>
              <th>Reference</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${
              payments.length > 0
                ? payments
                    .map(
                      (pmt) => `
              <tr>
                <td>${pmt.date}</td>
                <td>${pmt.method}</td>
                <td>${pmt.reference}</td>
                <td>₦${(pmt.amount || 0).toLocaleString()}</td>
                <td><span class="status-badge status-${pmt.status.toLowerCase()}">${
                        pmt.status
                      }</span></td>
              </tr>
            `
                    )
                    .join("")
                : '<tr><td colspan="5" style="text-align: center; color: #94a3b8;">No payments found</td></tr>'
            }
            ${
              payments.length > 0
                ? `
              <tr class="total-row">
                <td colspan="3">Total Payments Made</td>
                <td>₦${payments
                  .reduce((sum, pmt) => sum + (pmt.amount || 0), 0)
                  .toLocaleString()}</td>
                <td>-</td>
              </tr>
            `
                : ""
            }
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for content to load, then trigger download
  printWindow.onload = () => {
    printWindow.print();
    // Close after printing/saving
    setTimeout(() => printWindow.close(), 1000);
  };
};

/**
 * Print supplier report directly
 * @param {Object} supplier - Supplier data
 * @param {Array} invoices - Purchase history data
 * @param {Array} payments - Payment history data
 * @param {Object} stats - Supplier statistics
 */
export const printPDF = (supplier, invoices, payments, stats) => {
  // Use the same function for printing
  exportToPDF(supplier, invoices, payments, stats);
};
