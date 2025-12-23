# Supplier AI Module - Full CRUD Implementation

## Overview

This document describes the enhanced AI-powered supplier management module, which mirrors the functionality of the customer module.

## Implemented Features

### 1. Create Supplier (`create_supplier`)

**Natural Language Examples:**

- "Add supplier Tech Solutions"
- "Create vendor ABC Corp, contact John, email john@abc.com"
- "Add new supplier Samsung with phone 08012345678"
- "i want to add a supplier" (will show form)

**Form Fields:**

- Company Name (required)
- Contact Person (required)
- Phone (required)
- Email (required)
- Address (required)
- Tax Number/TIN (optional)
- Payment Terms (dropdown: Immediate, Net 7/15/30/45/60 days)
- Active Status (checkbox)

### 2. Update Supplier (`update_supplier`)

**Natural Language Examples:**

- "Edit supplier Tech Solutions"
- "Update ABC Corp phone to 09087654321"
- "Change supplier email to new@abc.com"

**Behavior:**

- If supplier name not provided, shows selectable list
- If multiple matches found, prompts for selection
- Pre-fills form with existing supplier data

### 3. Delete Supplier (`delete_supplier`)

**Natural Language Examples:**

- "Delete supplier Tech Solutions"
- "Remove ABC Corp from suppliers"
- "Get rid of that vendor"

**Safety Features:**

- If supplier has purchase history, performs soft delete (deactivation)
- Shows confirmation with supplier name before deletion

### 4. View Suppliers (`view_suppliers`, `supplier_summary`)

**Natural Language Examples:**

- "Show my suppliers"
- "List all vendors"
- "My suppliers"

### 5. Supplier Details (`supplier_details`)

**Natural Language Examples:**

- "Tell me about supplier ABC"
- "Info about Tech Solutions"
- "Supplier XYZ details"

**Displays:**

- Contact information
- Purchase statistics (count, total, average)
- Recent purchases (last 5)

### 6. Supplier Balance (`supplier_balance`)

**Natural Language Examples:**

- "What do I owe Tech Solutions?"
- "How much is outstanding to ABC?"
- "Supplier balance for XYZ"

### 7. Supplier Transactions (`supplier_transactions`)

**Natural Language Examples:**

- "Show ABC's purchase history"
- "Transactions with Tech Solutions"
- "Supplier purchase history"

### 8. Top Suppliers (`top_suppliers`)

**Natural Language Examples:**

- "Who are my top suppliers?"
- "Best vendors by purchase volume"
- "Top 10 suppliers"

### 9. Activate/Deactivate Supplier

**Natural Language Examples:**

- "Activate supplier ABC"
- "Deactivate Tech Solutions"
- "Enable supplier XYZ"

## Files Modified

### Backend (PHP)

1. **`api/ai_assistant/handlers/suppliers_handler.php`**

   - Added: `createSupplierAction()`, `updateSupplierAction()`, `deleteSupplierAction()`
   - Added: `viewSupplierAction()`, `supplierDetailsAction()`
   - Added: `supplierTransactionsAction()`, `supplierBalanceAction()`
   - Added: `toggleSupplierStatusAction()`
   - Helper: `findSupplierByData()`, `formatSupplierError()`

2. **`api/ai_assistant/router.php`**

   - Added 20+ patterns for supplier CRUD operations
   - Supports casual speech ("add a vendor", "get rid of supplier")
   - Typo tolerance for common misspellings

3. **`api/ai_assistant/orchestrator.php`**

   - Added: `buildSupplierFormConfig()` for editable forms
   - Added: `fetchSupplierById()`, `fetchSupplierList()` helpers
   - Enhanced: `enhanceDataForDisplay()` for supplier data
   - Enhanced: `requestConfirmation()` for supplier form handling
   - Enhanced: `smartMergeData()` for supplier field handling
   - Updated: `getRequiredFields()` with supplier actions
   - Updated: `validateExtractionFromData()` with supplier validation

4. **`api/ai_assistant/fsm.php`**

   - Updated: `requiresConfirmation()` to include supplier actions

5. **`api/ai_assistant/prompts/suppliers.prompt`**
   - Complete rewrite with CRUD schemas and examples
   - Natural language variations documented

### Frontend (React)

- No changes needed - `AIAssistantChat.jsx` handles forms dynamically based on `fieldConfig`

## Database Fields (suppliers table)

| Field          | Type     | Notes                  |
| -------------- | -------- | ---------------------- |
| id             | INT      | Primary key            |
| company_id     | INT      | Foreign key            |
| name           | VARCHAR  | Company name           |
| contact_person | VARCHAR  |                        |
| phone          | VARCHAR  |                        |
| email          | VARCHAR  |                        |
| address        | TEXT     |                        |
| tax_number     | VARCHAR  | TIN/VAT number         |
| payment_terms  | VARCHAR  | Default: 'Net 30 days' |
| status         | ENUM     | 'active' or 'inactive' |
| created_at     | DATETIME |                        |
| updated_at     | DATETIME |                        |

## Usage Examples

### Creating a Supplier

```
User: Add supplier Lagos Trading Co, contact Adewale, phone 08012345678
AI: [Shows editable form with pre-filled data]
User: [Edits/confirms form]
AI: ✅ Supplier Created Successfully!
```

### Editing a Supplier

```
User: Edit supplier Lagos Trading
AI: 📝 Edit Supplier - Review and edit the details below:
    [Shows form with current supplier data]
```

### Checking Balance

```
User: How much do I owe Lagos Trading?
AI: 💰 Balance with Lagos Trading Co
    • Total Purchases: ₦500,000.00
    • Total Paid: ₦350,000.00
    • Outstanding: ₦150,000.00 ⏳
```

## Error Handling

- Duplicate supplier name detection
- Supplier not found graceful handling with list display
- Soft delete for suppliers with purchase history
- Required field validation
- Email format validation (on form submission)

## Testing Checklist

- [ ] Create supplier with full details
- [ ] Create supplier with minimal data (shows form)
- [ ] Update supplier by name
- [ ] Update supplier when multiple matches (shows selection)
- [ ] Delete supplier without purchase history (hard delete)
- [ ] Delete supplier with purchase history (soft delete)
- [ ] View supplier details
- [ ] Check supplier balance
- [ ] View supplier transactions
- [ ] List top suppliers
- [ ] Activate/deactivate supplier
