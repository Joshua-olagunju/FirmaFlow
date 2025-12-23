# AI Assistant - Modular Architecture

## 🎯 Overview

The AI Assistant has been refactored into a modular, scalable architecture following enterprise best practices. This new structure prevents code bloat, enables parallel development, and makes the system easier to maintain and extend.

---

## 📁 Directory Structure

```
api/ai_assistant/
├── index.php                          # Main router (100 lines)
├── parser.php                         # AI parsing & Groq API (300 lines)
├── intent_classifier.php              # Intent mapping & metadata (250 lines)
├── query_engine.php                   # Safe database queries (400 lines)
├── utils.php                          # Helper functions (200 lines)
└── handlers/                          # Intent handlers (modular)
    ├── customer_handler.php           # Customer operations
    ├── inventory_handler.php          # Inventory management
    ├── sales_handler.php              # Sales & invoicing
    ├── payment_handler.php            # Payment processing
    ├── purchase_handler.php           # Purchase orders
    ├── expense_handler.php            # Expense tracking
    ├── report_handler.php             # Report generation
    ├── subscription_handler.php       # Subscription management
    └── settings_handler.php           # Settings & configuration
```

---

## 🔄 Request Flow

```
User Input
    ↓
Frontend (AIAssistantChat.jsx)
    ↓
api/ai_assistant.php (legacy redirect)
    ↓
api/ai_assistant/index.php (router)
    ↓
parser.php → Groq AI (intent classification)
    ↓
intent_classifier.php (validation & risk assessment)
    ↓
handlers/{module}_handler.php (execution)
    ↓
query_engine.php (for data retrieval)
    ↓
Response to Frontend
```

---

## 🚀 Core Modules

### 1. **index.php** - Main Router

- Entry point for all AI assistant requests
- Routes actions to appropriate modules
- Handles authentication & CORS
- **Actions:**
  - `parse_prompt` - Parse user input with AI
  - `execute_task` - Execute confirmed actions
  - `query_info` - Retrieve information
  - `get_capabilities` - List available features

### 2. **parser.php** - AI Intelligence Layer

- Communicates with Groq AI API
- Converts natural language to structured data
- Implements the strict AI system prompt
- Returns JSON with: `intent`, `confidence`, `risk_level`, `extracted_data`

### 3. **intent_classifier.php** - Intent Management

- Maps intents to categories (customers, inventory, sales, etc.)
- Defines required/optional fields per intent
- Determines risk levels and confirmation requirements
- Validates extracted data

### 4. **query_engine.php** - Safe Database Access

- Handles all read-only database operations
- Implements safe, parameterized queries
- Scopes all queries to `company_id`
- Formats results for natural language responses

### 5. **utils.php** - Helper Functions

- Confidence scoring
- Risk assessment
- Number generation (invoices, expenses, SKUs)
- Entity lookup (customers, products)
- Permission checking
- Currency formatting

---

## 🎯 Supported Intents

### **Customers** (`customer_handler.php`) ✅

- ✅ `create_customer` - Add new customers
- ✅ `update_customer` - Modify customer info
- ✅ `view_customer` - Get customer details
- ✅ `customer_summary` - Customer statistics

### **Inventory** (`inventory_handler.php`) ✅

- ✅ `add_product` - Add products to inventory
- ✅ `add_multiple_products` - Bulk product import
- ✅ `update_product` - Update product details
- ✅ `adjust_stock` - Adjust inventory levels
- ✅ `view_inventory` - View inventory status
- ✅ `inventory_analysis` - Inventory insights

### **Sales** (`sales_handler.php`) ✅

- ✅ `create_invoice` - Create sales invoices
- ✅ `update_invoice` - Update invoice details
- ✅ `view_invoice` - View invoice information
- ✅ `record_payment` - Record customer payments
- ✅ `sales_summary` - Sales reports

### **Payments** (`payment_handler.php`) 🚧

- ✅ `view_pending_invoices` - Unpaid invoices
- ✅ `view_pending_supplier_bills` - Supplier bills
- 🚧 `approve_supplier_payment` - Approve payments
- 🚧 `view_transaction_history` - Payment history

### **Expenses** (`expense_handler.php`) ✅

- ✅ `add_expense` - Record expenses
- ✅ `update_expense` - Update expense records
- ✅ `view_expenses` - View expense list
- ✅ `expense_summary` - Expense reports

### **Reports** (`report_handler.php`) 🚧

- ✅ `generate_report` - Generate reports
- 🚧 `report_analysis` - Business analytics

### **Purchases** (`purchase_handler.php`) ✅ NEW!

- ✅ `create_purchase_order` - Create purchase orders
- ✅ `update_purchase_order` - Update POs
- ✅ `receive_goods` - Record goods receipts
- ✅ `purchase_summary` - Purchase reports

### **Subscriptions** (`subscription_handler.php`) ✅ NEW!

- ✅ `view_subscription` - Check subscription status
- ✅ `upgrade_subscription` - Upgrade to new plan
- ✅ `upgrade_guidance` - Get upgrade recommendations

### **Settings** (`settings_handler.php`) ✅ NEW!

- ✅ `view_settings` - View all settings
- ✅ `update_company_info` - Update company details
- ✅ `create_tax` - Create new tax rates
- ✅ `update_tax` - Update existing tax rates
- ✅ `create_tag` - Create new tags
- ✅ `update_tag` - Update existing tags
- ✅ `create_template` - Create invoice/receipt templates
- ✅ `update_settings` - Update general settings

### **Users** (`settings_handler.php`) 🆕 NEW MODULE!

- ✅ `create_user` - Create new user accounts
- ✅ `update_user` - Update user information
- ✅ `view_users` - List all users
- ✅ `deactivate_user` - Deactivate user accounts

### **Notifications** (`settings_handler.php`) 🆕 NEW MODULE!

- ✅ `send_notification` - Send notifications
- ✅ `get_notifications` - Retrieve notifications
- ✅ `check_overdue_invoices` - Check overdue invoices
- ✅ `check_low_stock` - Check low stock alerts

**Legend:** ✅ Implemented | 🚧 Partial | 🆕 Newly Added

**Total Intents:** 50+ intents across 10 modules

---

## 🔒 Security Features

1. **Company Scoping** - All queries filtered by `company_id`
2. **Parameterized Queries** - Prevents SQL injection
3. **Risk Assessment** - High-risk actions require confirmation
4. **Confidence Scoring** - AI provides confidence levels (0.0-1.0)
5. **Permission Checking** - Role-based access control
6. **Input Validation** - Required fields validated before execution

---

## 💡 How to Add New Features

### **Adding a New Intent:**

1. **Add to System Prompt** (parser.php)

```php
CUSTOMERS:
- your_new_intent
```

2. **Add to Intent Classifier** (intent_classifier.php)

```php
'your_new_intent' => 'customers',
```

3. **Add Metadata** (intent_classifier.php)

```php
'your_new_intent' => [
    'required_fields' => ['field1'],
    'optional_fields' => ['field2'],
    'default_risk' => 'medium',
    'requires_confirmation' => true,
    'can_auto_execute' => false
],
```

4. **Implement Handler** (handlers/customer_handler.php)

```php
case 'your_new_intent':
    return yourNewIntentAction($data, $pdo, $companyId);
```

5. **Create Action Function**

```php
function yourNewIntentAction($data, $pdo, $companyId) {
    // Your logic here
    return formatSuccessResponse($message, $data);
}
```

### **Adding a New Query Type:**

Add to `query_engine.php`:

```php
case 'your_query':
    return queryYourData($pdo, $companyId, $filters);
```

---

## 📊 Response Format

### **Success Response:**

```json
{
  "success": true,
  "message": "✅ Customer created successfully!",
  "data": {
    "customer_id": 123,
    "customer_name": "John Doe"
  }
}
```

### **Error Response:**

```json
{
  "success": false,
  "error": "Customer name is required",
  "error_code": "VALIDATION_ERROR"
}
```

### **Parsed Intent:**

```json
{
  "success": true,
  "parsed": {
    "intent": "create_customer",
    "category": "customers",
    "confidence": 0.95,
    "risk_level": "medium",
    "extracted_data": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "missing_fields": [],
    "requires_confirmation": true,
    "suggested_action": "Create new customer?"
  }
}
```

---

## 🎓 AI System Principles

The AI follows these core principles (from your requirements):

1. **Intent Classification** - Every input classified to ONE intent
2. **State Awareness** - Respects current system state
3. **Structured Data** - Always returns valid JSON
4. **Confirmation Gates** - High-risk actions require approval
5. **Confidence Signaling** - Provides confidence scores
6. **Memory Awareness** - Can reference conversation history
7. **Feedback Handling** - Learns from corrections
8. **Multi-Action Orchestration** - Handles chained requests
9. **Failure Handling** - Never guesses, always clarifies
10. **Conversational Mode** - Friendly for general chat

**Golden Rule:**

> You suggest. The system decides. Humans approve risk.

---

## 🚀 Migration from Old System

The original `api/ai_assistant.php` now redirects to the new modular system automatically. **No frontend changes required** - all existing API calls continue to work.

### **What Changed:**

- ✅ Monolithic file → Modular architecture
- ✅ Basic prompts → Comprehensive system prompt
- ✅ Limited intents → 40+ intent types
- ✅ Simple execution → Risk assessment & confidence scoring
- ✅ No validation → Structured validation system

### **What Stayed the Same:**

- ✅ API endpoints (`parse_prompt`, `execute_task`, `query_info`)
- ✅ Request/response format
- ✅ Authentication flow
- ✅ CORS configuration

---

## 📝 Next Steps

### **Priority Implementations:**

1. ✅ Core infrastructure (DONE)
2. ✅ Customer & Inventory handlers (DONE)
3. ✅ Sales & Expenses handlers (DONE)
4. 🚧 Complete payment processing
5. 🚧 Purchase order management
6. 🚧 Advanced reporting
7. 🚧 Subscription management
8. 🚧 Settings & task management

### **Future Enhancements:**

- Multi-step action orchestration
- User preference learning
- Advanced analytics with AI insights
- Bulk operations
- Automated reminders
- Predictive forecasting

---

## 🐛 Debugging

### **Enable Logging:**

```php
error_log("AI Assistant Debug: " . json_encode($data));
```

### **Test Individual Handlers:**

```php
$result = handleCustomerIntent('create_customer', $data, 'idle', $pdo, 1, 1);
var_dump($result);
```

### **Check Intent Classification:**

```php
$category = getIntentCategory('create_customer'); // Returns: 'customers'
$metadata = getIntentMetadata('create_customer'); // Returns: full metadata
```

---

## 📧 Support

For issues or questions about the AI Assistant architecture:

- Check handler files for implementation details
- Review `query_engine.php` for available queries
- See `intent_classifier.php` for supported intents

---

**Built with:** PHP 8.x, Groq AI (Llama 3.3), MySQL  
**Architecture:** Modular, Scalable, Secure  
**Status:** ✅ Production Ready (Core Features)
