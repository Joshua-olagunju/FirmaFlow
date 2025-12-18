# Receipt Invoice Items Implementation

## Overview

This document explains how invoice items are fetched and displayed on receipts throughout the FirmaFlow system.

## Database Structure

### Payments Table

```sql
payments (
    id, company_id, type, party_type, party_id,
    reference, reference_type, reference_id,
    amount, method, payment_date, status, notes,
    receipt_path,
    invoice_total, balance_before, balance_after, invoice_number,
    created_at, updated_at
)
```

**Key Fields:**

- `reference_type`: 'customer' or 'supplier'
- `reference_id`: Points to customer_id or supplier_id (NOT invoice_id directly)
- `invoice_number`: Stored for display purposes
- `invoice_total`, `balance_before`, `balance_after`: Calculated at payment time

### Payment Items Table

```sql
payment_items (
    id, payment_id, company_id,
    product_name, description,
    quantity, unit_price, total_price,
    created_at
)
```

**Purpose:** Permanently stores invoice line items with each payment, so even if the invoice is deleted, the receipt still shows what was purchased.

### Sales Invoices & Lines

```sql
sales_invoices (id, invoice_no, customer_id, total, amount_paid, status, ...)
sales_invoice_lines (id, invoice_id, product_id, description, quantity, unit_price, ...)
```

## Payment Creation Flow

### 1. Frontend (PayInvoiceModal.jsx)

When a user pays an invoice:

```javascript
formData.append("reference_type", "customer");
formData.append("reference_id", invoice.customer_id); // Customer ID, not invoice ID
formData.append("invoice_id", invoice.id); // Sent separately for processing
formData.append("amount", paymentAmount);
// ... other fields
```

### 2. Backend (api/payments.php - POST)

The API:

1. Receives `invoice_id` parameter
2. Fetches invoice details to calculate balances
3. Stores payment with `reference_id = customer_id` and `reference_type = 'customer'`
4. Stores invoice metadata: `invoice_number`, `invoice_total`, `balance_before`, `balance_after`
5. **Copies all invoice line items to payment_items table** (lines 494-515):

```php
$stmt = $pdo->prepare("
    SELECT sil.*, p.name as product_name,
           sil.description as description,
           sil.quantity as quantity,
           sil.unit_price as unit_price
    FROM sales_invoice_lines sil
    LEFT JOIN products p ON sil.product_id = p.id
    WHERE sil.invoice_id = ?
");
$stmt->execute([$invoice_id]);
$invoice_items = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($invoice_items as $item) {
    // Insert into payment_items table
}
```

## Receipt Display Flow

### 1. Backend (api/payments.php - GET)

When fetching a single payment:

```php
// Fetch payment
$stmt = $pdo->prepare("SELECT * FROM payments WHERE id = ?");
$payment = $stmt->fetch();

// Fetch stored items
$stmt = $pdo->prepare("SELECT * FROM payment_items WHERE payment_id = ?");
$payment['stored_items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
```

### 2. Frontend (ViewReceiptModal.jsx)

**Step A: Fetch Invoice Data (Optional)**

```javascript
const fetchInvoiceData = useCallback(async () => {
  // Use reference_id when reference_type is 'customer' to fetch invoice
  if (!payment?.reference_id || payment?.reference_type !== "customer") {
    setInvoiceData(null);
    return;
  }

  const response = await fetch(`api/sales.php?id=${payment.reference_id}`);
  const data = await response.json();
  if (data.success) {
    setInvoiceData(data.data); // Contains invoice.lines array
  }
}, [payment?.reference_id, payment?.reference_type]);
```

**Step B: Build Receipt Data**

```javascript
const buildReceiptData = useCallback(() => {
  const receiptInfo = {
    // ... other fields
    // Prioritize stored payment items, then invoice lines
    invoice_items:
      payment.stored_items || invoiceData?.lines || invoiceData?.items || null,
  };
  setReceiptData(receiptInfo);
}, [payment, invoiceData]);
```

**Step C: Map Items for Display**
All three contexts (PDF, Share, Preview) map items the same way:

```javascript
items: receiptData.invoice_items && receiptData.invoice_items.length > 0
  ? receiptData.invoice_items.map((item) => ({
      name: item.description || item.product_name || item.name,
      quantity: parseFloat(item.quantity) || 1,
      price: parseFloat(item.unit_price || item.price) || 0,
      total: parseFloat(item.total_price || item.total || item.amount) || 0,
    }))
  : [
      /* Fallback: Single "Payment Received" line */
    ];
```

**Field Name Mapping:**

- **payment_items table**: `description`, `product_name`, `quantity`, `unit_price`, `total_price`
- **sales_invoice_lines table**: `description`, `product_name`, `quantity`, `unit_price`, `total` (calculated)
- **Standardized for display**: `name`, `quantity`, `price`, `total`

### 3. PDF Templates (5 templates)

All PDF templates receive `receiptData.items` array and display it:

```jsx
{
  receiptData?.items?.map((item, index) => (
    <View key={index} style={styles.tableRow}>
      <Text style={styles.tableCell}>{item.name}</Text>
      <Text style={styles.tableCell}>{item.quantity}</Text>
      <Text style={styles.tableCell}>{formatCurrency(item.price)}</Text>
      <Text style={styles.tableCell}>{formatCurrency(item.total)}</Text>
    </View>
  ));
}
```

**Templates:**

- ClassicReceiptPDF.jsx
- ModernReceiptPDF.jsx
- ThermalReceiptPDF.jsx
- CompactReceiptPDF.jsx
- DetailedReceiptPDF.jsx

### 4. Preview Templates (5 templates)

Preview templates use the same `receiptData.items` structure in HTML/CSS format.

## Multiple Receipts for One Invoice

The system correctly supports multiple receipts (partial payments) for one invoice:

1. **First Payment:**

   - Invoice total: $1000
   - Payment: $400
   - Receipt shows all invoice items
   - `balance_before: 1000`, `balance_after: 600`
   - Items stored in `payment_items` table

2. **Second Payment:**
   - Invoice total: $1000 (unchanged)
   - Payment: $600
   - Receipt shows all invoice items AGAIN
   - `balance_before: 600`, `balance_after: 0`
   - Items stored in `payment_items` table AGAIN

Each receipt is independent and shows the full invoice items, with balance snapshots at that moment in time.

## Data Integrity

### Why Store Items Permanently?

If an invoice is modified or deleted:

- Historical receipts remain accurate
- Items on the receipt reflect what was sold at payment time
- Audit trail is preserved

### Fallback Behavior

If no items are found (edge case):

- Receipt shows single line: "Payment Received" or "Payment Made"
- Quantity: 1
- Price & Total: Payment amount

## Key Corrections Made

1. ✅ Fixed `fetchInvoiceData` to use `payment.reference_id` instead of non-existent `payment.invoice_id`
2. ✅ Updated `buildReceiptData` to prioritize `payment.stored_items` from payment_items table
3. ✅ Fixed item mapping to include `total_price` field from payment_items table
4. ✅ Applied same mapping logic to PDF generation, Share PDF, and Preview template

## Testing Checklist

- [ ] Pay an invoice and verify receipt shows invoice items
- [ ] Make a partial payment and verify receipt shows correct balance_before/balance_after
- [ ] Make a second partial payment and verify it also shows all items
- [ ] Download PDF and verify items display correctly
- [ ] Share PDF and verify items are included
- [ ] Test all 5 PDF templates (Classic, Modern, Thermal, Compact, Detailed)
- [ ] Test all 5 preview templates
- [ ] Verify receipt still works if invoice is deleted (uses stored_items)
- [ ] Test with different currencies
- [ ] Test with items that have long descriptions
- [ ] Test with large quantities and decimal prices
