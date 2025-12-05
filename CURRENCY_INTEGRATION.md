# Currency Integration Guide

## Overview

The SettingsContext has been created to manage global currency and date format settings. All currency values should now use the `formatCurrency()` function from this context.

## How to Use

### 1. Import the SettingsContext

```jsx
import { useSettings } from "../../contexts/SettingsContext";
```

### 2. Use in Component

```jsx
const { formatCurrency, currencySymbols, currency } = useSettings();

// Format a number as currency
<p>{formatCurrency(1234.56)}</p>  // Output: ₦1,234.56 (or $1,234.56 if USD selected)

// Get just the symbol
<span>{currencySymbols[currency]}</span>  // Output: ₦ (or $ if USD)
```

## Files That Need Currency Integration

### Dashboard

- **Dashboard.jsx** - Lines 197, 205 (Total Sales displays)

### Customers

- **CustomerTable.jsx** - Line 77 (Balance column)
- **CustomerReportModal.jsx** - Lines 105, 119, 133, 155, 194 (All currency displays)
- **AddCustomerModal.jsx** - Line 242 (Credit Limit label)
- **EditCustomerModal.jsx** - Line 246 (Credit Limit label)
- **Customers.jsx** - Line 268 (Export header "Currency: NGN")

### Suppliers

- **SupplierTable.jsx** - Line 77 (Balance column)
- **SupplierReportModal.jsx** - Lines 105, 119, 133 (All currency displays)
- **InvoiceHistory.jsx** - Lines 79, 82, 105, 108 (Amount columns)
- **PaymentHistory.jsx** - Lines 61, 82 (Amount columns)
- **Suppliers.jsx** - Line 272 (Export header "Currency: NGN")

### Inventory

- **ProductTable.jsx** - Lines 85-86, 91-92 (Cost Price & Selling Price columns)
- **AddProductModal.jsx** - Labels for cost/selling price fields
- **EditProductModal.jsx** - Labels for cost/selling price fields
- **Inventory.jsx** - Line 279 (Export header "Currency: NGN")

## Example Implementations

### Simple Currency Display

```jsx
// Before
<p>₦{amount.toLocaleString()}</p>;

// After
import { useSettings } from "../../contexts/SettingsContext";

const { formatCurrency } = useSettings();
<p>{formatCurrency(amount)}</p>;
```

### Table Column

```jsx
// Before
<td className={theme.textPrimary}>
  ₦
  {parseFloat(product.costPrice).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
</td>;

// After
import { useSettings } from "../../contexts/SettingsContext";

const { formatCurrency } = useSettings();
<td className={theme.textPrimary}>{formatCurrency(product.costPrice)}</td>;
```

### Input Label

```jsx
// Before
<label>Cost Price (₦)</label>;

// After
import { useSettings } from "../../contexts/SettingsContext";

const { currencySymbols, currency } = useSettings();
<label>Cost Price ({currencySymbols[currency]})</label>;
```

### Export Headers

```jsx
// Before
"Currency: NGN";

// After
import { useSettings } from "../../contexts/SettingsContext";

const { currency } = useSettings();
`Currency: ${currency}`;
```

## Notes

- Currency conversion is **frontend-only** (display purposes)
- All data is stored in NGN in the database
- The SettingsContext automatically saves to localStorage
- Changes in Settings > General Settings will immediately affect all components
