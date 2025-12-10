# PDF Template System - Implementation Complete

## Overview

Created a comprehensive PDF generation system using @react-pdf/renderer where each invoice template (5 prebuilt + custom) has its own dedicated PDF generator that matches the exact design of the template.

## Files Created

### 1. PDFTemplates Folder Structure

**Location:** `src/pages/sales/PDFTemplates/`

### 2. Individual Template PDF Files

#### ModernInvoicePDF.jsx

- **Design:** Diagonal gradient header design
- **Font:** Helvetica (sans-serif)
- **Features:**
  - Logo in top left
  - INVOICE title with diagonal accent
  - Company info in top right
  - Bill To section with customer details
  - Items table with colored header
  - Totals section with highlighted grand total
  - Payment information grid
  - Thank you footer

#### ClassicInvoicePDF.jsx

- **Design:** Traditional double border layout
- **Font:** Times-Roman (serif)
- **Features:**
  - Double border frame around entire header
  - Centered company info with logo
  - Bordered detail boxes for billing and dates
  - Bordered items table
  - Classic totals with bordered box
  - Payment information with centered grid

#### MinimalInvoicePDF.jsx

- **Design:** Clean, minimal aesthetic
- **Font:** Helvetica (light weight)
- **Features:**
  - Minimal header with bottom border
  - Large "Invoice" title
  - 3-column info grid (From, Bill To, Details)
  - Simple table with minimal borders
  - Clean totals with top border accent
  - Subtle footer

#### ProfessionalInvoicePDF.jsx

- **Design:** Colored header bar
- **Font:** Helvetica
- **Features:**
  - Full-width colored header background
  - White logo container in header
  - Company name and invoice title in white text
  - 3-column professional grid layout
  - Gray table header
  - Colored grand total background
  - Professional payment info section

#### ElegantInvoicePDF.jsx

- **Design:** Sophisticated serif design
- **Font:** Times-Roman (elegant)
- **Features:**
  - Double border elegant header
  - Centered company information
  - Decorative divider lines
  - Letter-spaced titles
  - 3-column details with dividers
  - Bordered table and totals box
  - Centered payment information
  - Italic footer with decorative divider

### 3. CustomInvoicePDF.jsx

**Purpose:** Dynamic PDF generator for user-created custom templates

**Supports Two Types:**

#### Freeform Templates (elements array)

- Renders elements based on position
- Supports element types:
  - `header` - Invoice title and number
  - `companyInfo` - Company name, address, contact
  - `customerInfo` - Bill To section
  - `invoiceDetails` - Invoice and due dates
  - `itemsTable` - Line items with description, qty, rate, amount
  - `totals` - Subtotal, tax, discount, total
  - `paymentInfo` - Bank account details
  - `logo` - Company logo image
  - `text` - Custom text elements

#### Structured Templates (sections array)

- Renders sections in order
- Supports section types:
  - `header` - Company header
  - `invoiceDetails` - Customer and date info
  - `items` - Product/service table
  - `totals` - Financial totals
  - `payment` - Payment information

**Features:**

- Respects user's font size settings
- Applies bold/alignment preferences
- Uses template color scheme
- Handles missing logo gracefully

### 4. InvoicePDFFactory.jsx

**Purpose:** Router component that selects the correct PDF template

**Logic:**

```javascript
if (isCustom) {
  return <CustomInvoicePDF />;
}

switch (templateType) {
  case "modern":
    return <ModernInvoicePDF />;
  case "classic":
    return <ClassicInvoicePDF />;
  case "minimal":
    return <MinimalInvoicePDF />;
  case "professional":
    return <ProfessionalInvoicePDF />;
  case "elegant":
    return <ElegantInvoicePDF />;
  default:
    return <ModernInvoicePDF />;
}
```

**Parameters:**

- `templateType` - Template name (modern, classic, etc.)
- `isCustom` - Boolean flag for custom templates
- `customData` - Template data for custom templates
- `companyInfo` - Company details
- `invoiceData` - Invoice data
- `color` - Brand color
- `showPaymentInfo` - Toggle payment section

## Integration

### Updated ViewInvoiceModal.jsx

**Changed Import:**

```javascript
// Old
import InvoicePDFTemplate from "./InvoicePDFTemplate";

// New
import InvoicePDFFactory from "./PDFTemplates/InvoicePDFFactory";
```

**Updated PDF Generation:**
Both `handleDownloadPDF` and `handleSharePDF` now use:

```javascript
const blob = await pdf(
  <InvoicePDFFactory
    templateType={templateSettings?.template}
    isCustom={templateSettings?.isCustom}
    customData={templateSettings?.customData}
    companyInfo={companyInfo}
    invoiceData={pdfInvoiceData}
    color={templateSettings?.color || "#667eea"}
    showPaymentInfo={templateSettings?.showPaymentInfo !== false}
  />
).toBlob();
```

**Added formatCurrency:**
Now passes `formatCurrency` function to PDF templates for proper currency formatting:

```javascript
const pdfInvoiceData = {
  // ... other fields
  formatCurrency: formatCurrency,
};
```

## Key Features

### 1. Template-Specific Design

Each PDF template matches its corresponding screen template exactly:

- Same fonts (Helvetica, Times-Roman)
- Same layout structure
- Same color schemes
- Same spacing and sizing

### 2. Logo Support

All templates display company logo:

- Fetches from `companyInfo.logo`
- Handles missing logos gracefully
- Properly sized for each template

### 3. Currency Formatting

Uses the global currency formatter:

- Respects user's currency settings (NGN, USD, etc.)
- Formats all amounts consistently
- Handles decimals properly

### 4. Dynamic Colors

All templates use the template color setting:

- Headers, titles, accents use brand color
- Backgrounds use semi-transparent versions (`${color}15`)
- Borders use the brand color

### 5. Payment Information

Conditional rendering of bank details:

- Shows only if `companyInfo.bank_account` exists
- Displays bank name, account number, account name
- Properly formatted in each template's style

### 6. Responsive to Template Settings

PDFs respect all template settings:

- Template type (modern, classic, etc.)
- Custom template data (elements/sections)
- Brand color
- Show/hide payment info
- Custom fonts and sizes (for custom templates)

## Data Flow

```
ViewInvoiceModal
    ↓
Fetches invoice data + company info + template settings
    ↓
Builds pdfInvoiceData object
    ↓
Passes to InvoicePDFFactory with template settings
    ↓
Factory selects appropriate PDF template
    ↓
Template renders with @react-pdf/renderer
    ↓
pdf().toBlob() generates PDF file
    ↓
Download or Share
```

## Invoice Data Structure

```javascript
{
  invoiceNumber: "INV-001",
  date: "2024-01-15",
  dueDate: "2024-02-15",
  customer: {
    name: "Customer Name",
    address: "123 Main St",
    email: "customer@example.com",
    phone: "+234 123 456 7890",
    city: "Lagos"
  },
  items: [
    {
      description: "Product/Service",
      quantity: 2,
      rate: 50000,
      amount: 100000
    }
  ],
  subtotal: 100000,
  tax: 7500,
  discount: 0,
  total: 107500,
  notes: "Payment terms: Net 30",
  currency: "NGN",
  formatCurrency: function(amount) { ... }
}
```

## Company Info Structure

```javascript
{
  name: "Paira",
  logo: "http://localhost/api/uploads/company/logo.png",
  address: "123 Business St",
  city: "Lagos",
  state: "Lagos State",
  phone: "+234 123 456 7890",
  email: "info@paira.com",
  bank_name: "First Bank",
  bank_account: "1234567890",
  account_name: "Paira Ltd"
}
```

## Custom Template Structure

### Freeform:

```javascript
{
  elements: [
    {
      id: 1,
      type: "header",
      position: { x: 0, y: 0 },
      size: { width: 200, height: 100 },
      fontSize: "2xl",
      bold: true,
      alignment: "left"
    },
    // ... more elements
  ],
  color: "#667eea"
}
```

### Structured:

```javascript
{
  sections: [
    { type: "header" },
    { type: "invoiceDetails" },
    { type: "items" },
    { type: "totals" },
    { type: "payment" }
  ],
  color: "#667eea"
}
```

## Benefits

### 1. No oklch Color Issues

- Uses standard hex colors
- No Tailwind CSS dependencies
- Works with all browsers

### 2. True Vector PDFs

- Scalable without quality loss
- Searchable text
- Smaller file sizes than image-based PDFs

### 3. Template Consistency

- PDF matches what user sees on screen
- Same design language
- Predictable output

### 4. Maintainability

- Each template in separate file
- Easy to update individual templates
- Clear separation of concerns

### 5. Extensibility

- Easy to add new templates
- Factory pattern makes routing simple
- Custom templates fully supported

## Testing Checklist

- [ ] Modern template generates correctly
- [ ] Classic template generates correctly
- [ ] Minimal template generates correctly
- [ ] Professional template generates correctly
- [ ] Elegant template generates correctly
- [ ] Custom freeform template generates correctly
- [ ] Custom structured template generates correctly
- [ ] Logo displays in all templates
- [ ] Currency formatting works
- [ ] Payment info shows/hides correctly
- [ ] Colors match template settings
- [ ] Download PDF works
- [ ] Share PDF works
- [ ] All invoice data displays correctly

## Next Steps (Optional Enhancements)

1. **Add Page Breaks:** For invoices with many items
2. **Add Watermarks:** For draft/unpaid invoices
3. **Add QR Codes:** For payment links
4. **Add Terms & Conditions:** Configurable footer text
5. **Add Multi-language Support:** Translate labels
6. **Add Custom Fonts:** Support Google Fonts
7. **Add Email Integration:** Send PDF via email directly
8. **Add Print Styles:** Optimize for physical printing

## File Locations Summary

```
src/pages/sales/PDFTemplates/
├── ModernInvoicePDF.jsx      (321 lines)
├── ClassicInvoicePDF.jsx     (new file)
├── MinimalInvoicePDF.jsx     (new file)
├── ProfessionalInvoicePDF.jsx (new file)
├── ElegantInvoicePDF.jsx     (new file)
├── CustomInvoicePDF.jsx      (new file)
└── InvoicePDFFactory.jsx     (updated)

src/pages/sales/
└── ViewInvoiceModal.jsx      (updated - import and 2 functions)
```

## Implementation Complete ✅

All PDF templates are now created and integrated. The system now generates proper, template-specific PDFs using @react-pdf/renderer instead of html2canvas. Each template has its own file that matches the exact design of the corresponding screen template.
