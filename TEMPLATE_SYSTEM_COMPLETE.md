# Template System - Complete Implementation Guide

## Overview

Complete invoice and receipt template system with 10 customizable templates (5 invoice + 5 receipt).

## File Structure

```
Firma_Flow_React/src/pages/Settings/
├── InvoiceTemplates/
│   ├── InvoiceTemplates.jsx          # Main page with template selection
│   ├── InvoicePreviewModal.jsx       # Full-screen preview modal
│   └── templates/
│       ├── ModernInvoice.jsx         # Diagonal gradient, clean design
│       ├── ClassicInvoice.jsx        # Double border, serif fonts
│       ├── MinimalInvoice.jsx        # Ultra-clean, minimal borders
│       ├── ProfessionalInvoice.jsx   # Corporate header bar
│       └── ElegantInvoice.jsx        # Ornate, decorative
│
├── ReceiptTemplates/
│   ├── ReceiptTemplates.jsx          # Main page with template selection
│   ├── ReceiptPreviewModal.jsx       # Full-screen preview modal
│   └── templates/
│       ├── ThermalReceipt.jsx        # POS thermal printer (302px)
│       ├── ModernReceipt.jsx         # Card-style with colored header
│       ├── ClassicReceipt.jsx        # Traditional bordered receipt
│       ├── CompactReceipt.jsx        # Ultra-compact (320px)
│       └── DetailedReceipt.jsx       # Full details with bank info
│
└── Settings.jsx                       # Updated to include template routes
```

## Features

### Template Selection

- Dropdown menu with 5 template options per type
- Visual template name display with icon
- Smooth hover effects and transitions

### Color Customization

- 8 preset colors: Purple, Blue, Green, Red, Orange, Pink, Indigo, Teal
- Visual grid selector with checkmark on selected
- Color applies as theme throughout entire template
- Saved in database with template settings

### Preview System

- Full-screen modal with gradient header
- Scrollable content area for long templates
- Print preview button (opens browser print dialog)
- Close button to return to selection

### Data Integration

All templates dynamically pull from:

- **Company Info**: name, address, city, state, phone, email, logo, bank_name, bank_account
- **Invoice Data**: invoiceNumber, date, dueDate, customer, items[], subtotal, tax, discount, total
- **Receipt Data**: receiptNumber, date, time, items[], subtotal, tax, discount, total, paymentMethod, amountPaid, change

### Save Functionality

- "Save as Default" button
- Saves to `template_settings` database table
- Stores template name, color, and is_default flag
- Success message on save
- Integrates with existing API (settings.php)

## Template Styles

### Invoice Templates

1. **Modern** (`ModernInvoice.jsx`)

   - Diagonal gradient overlay (top-right corner)
   - Clean sans-serif fonts
   - 2-column grid layout
   - Colored header backgrounds
   - Right-aligned totals with colored box

2. **Classic** (`ClassicInvoice.jsx`)

   - Double border frame around entire invoice
   - Centered company info
   - Serif fonts (Georgia)
   - Bordered sections for bill-to and details
   - Dashed border payment box
   - Formal, traditional appearance

3. **Minimal** (`MinimalInvoice.jsx`)

   - Maximum white space
   - Helvetica font
   - Only bottom borders (no side/top borders)
   - 3-column info grid
   - Clean horizontal lines
   - No background colors

4. **Professional** (`ProfessionalInvoice.jsx`)

   - Full-width colored header bar
   - White logo container on colored background
   - Corporate grid structure
   - Gray background boxes for sections
   - Blue info box for payment details
   - Business-ready appearance

5. **Elegant** (`ElegantInvoice.jsx`)
   - Double border frame (ornate)
   - Times New Roman serif fonts
   - Centered decorative header
   - Colored horizontal dividers
   - Double borders on table and totals
   - Letter-spaced uppercase labels
   - Sophisticated design

### Receipt Templates

1. **Thermal** (`ThermalReceipt.jsx`)

   - 302px width (simulates 80mm thermal paper)
   - Monospace font, 12px
   - Dashed borders throughout
   - Compact spacing
   - Centered layout
   - "CUSTOMER COPY" footer
   - Authentic POS receipt appearance

2. **Modern** (`ModernReceipt.jsx`)

   - 400px width
   - Card-style design
   - Colored header with bottom border
   - Rounded gray boxes for sections
   - Table with colored header
   - Modern sans-serif fonts

3. **Classic** (`ClassicReceipt.jsx`)

   - 400px width
   - Double border frame (matching classic invoice)
   - Serif fonts (Georgia)
   - Traditional receipt layout
   - Dashed border payment section
   - Centered header with divider line

4. **Compact** (`CompactReceipt.jsx`)

   - 320px width (smallest)
   - Ultra-compact spacing
   - 11px base font size
   - Minimal padding
   - Items list without table structure
   - Gray background for payment section
   - Perfect for small receipts

5. **Detailed** (`DetailedReceipt.jsx`)
   - 450px width (largest receipt)
   - Full transaction details
   - Item table with unit price + quantity columns
   - Bank transfer information included
   - Official receipt designation
   - Gray boxes for sections
   - Professional footer with retention notice

## Usage

### Accessing Templates

1. Navigate to **Settings** page
2. Click **Invoice Templates** or **Receipt Templates** in sidebar
3. Select template from dropdown
4. Choose color theme from grid
5. Click **Preview Template** to see full design
6. Click **Save as Default** to store preference

### Integration Points

**Settings.jsx** now includes:

```jsx
import InvoiceTemplates from "./InvoiceTemplates/InvoiceTemplates";
import ReceiptTemplates from "./ReceiptTemplates/ReceiptTemplates";

case "invoice-templates":
  return <InvoiceTemplates />;
case "receipt-templates":
  return <ReceiptTemplates />;
```

**API Endpoint**: `/api/settings.php`

- Action: `save_template`
- Parameters: type, name, data (JSON with color + templateId), is_default
- Returns: success boolean

**Database Table**: `template_settings`

- Columns: id, company_id, template_type (enum: 'invoice', 'receipt', 'report'), template_name, template_data (JSON), is_default, created_at, updated_at

## Currency Formatting

All templates use consistent NGN formatting:

```javascript
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};
```

## Responsive Design

- All invoice templates: Full-width designs (responsive containers)
- Receipt templates: Fixed widths for receipt-style appearance
  - Thermal: 302px
  - Compact: 320px
  - Modern/Classic: 400px
  - Detailed: 450px
- Preview modals: Centered with max-w-5xl
- Mobile-friendly scrolling in preview

## Next Steps

### For Future Development:

1. **Template Usage in Invoice/Receipt Generation**

   - Load saved default template when creating invoice/receipt
   - Apply selected color theme
   - Populate with actual transaction data
   - Generate PDF using template HTML

2. **Additional Features** (Optional):

   - Custom logo upload per template
   - Font selection (serif vs sans-serif)
   - Additional color themes
   - Template duplication/editing
   - Multiple templates per company (not just default)

3. **Print Optimization**
   - Add `@media print` CSS rules
   - Hide preview modal chrome when printing
   - Page break handling for multi-page documents
   - Print-specific styling (remove shadows, adjust colors)

## Sample Data Structure

### Invoice Data

```javascript
{
  invoiceNumber: "INV-2024-001",
  date: "2024-01-15",
  dueDate: "2024-02-15",
  customer: {
    name: "John Doe",
    address: "123 Main Street",
    city: "Lagos",
    phone: "+234 123 456 7890"
  },
  items: [
    { description: "Product A", quantity: 2, rate: 50000, amount: 100000 },
    { description: "Service B", quantity: 1, rate: 75000, amount: 75000 }
  ],
  subtotal: 175000,
  tax: 13125,
  discount: 0,
  total: 188125
}
```

### Receipt Data

```javascript
{
  receiptNumber: "RCP-2024-001",
  date: "2024-01-15",
  time: "14:30",
  items: [
    { name: "Product A", quantity: 2, price: 50000, total: 100000 },
    { name: "Service B", quantity: 1, price: 75000, total: 75000 }
  ],
  subtotal: 175000,
  tax: 13125,
  discount: 0,
  total: 188125,
  paymentMethod: "Cash",
  amountPaid: 200000,
  change: 11875
}
```

## Status

✅ All 10 templates created and tested
✅ Preview modals functional
✅ Color selection system complete
✅ Integration into Settings page complete
✅ Database save functionality implemented
✅ No compilation errors
✅ Ready for user testing

---

**Implementation Completed**: January 2024
**Total Files Created**: 14 (10 templates + 2 main pages + 2 preview modals)
**Lines of Code**: ~2,500+
**Templates**: 5 Invoice + 5 Receipt = 10 Total
