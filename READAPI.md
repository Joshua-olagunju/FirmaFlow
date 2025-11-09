# FirmaFlow API Documentation

This document provides comprehensive API endpoints for the FirmaFlow React frontend. All endpoints use JSON for request/response data and include proper CORS headers.

**Base URL:** `http://localhost/firmaflow-React/FirmaFlow/api/`

---

## 🔐 Authentication API (`/api/auth.php`)

### 1. User Registration/Signup
- **Endpoint:** `POST /api/auth.php`
- **Action:** `signup`
- **Description:** Register a new user and company account

**Request Body:**
```json
{
    "action": "signup",
    "first_name": "John",
    "last_name": "Doe", 
    "email": "john@company.com",
    "password": "password123",
    "confirm_password": "password123",
    "company_name": "John's Business",
    "phone": "+1234567890"
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Registration successful! Please check your email for OTP verification.",
    "email": "john@company.com",
    "otp_sent": true
}
```

**Error Response (400/409):**
```json
{
    "success": false,
    "error": "Email address is already registered"
}
```

### 2. OTP Verification
- **Endpoint:** `POST /api/auth.php`
- **Action:** `verify_otp`
- **Description:** Verify email OTP and complete registration

**Request Body:**
```json
{
    "action": "verify_otp",
    "email": "john@company.com",
    "otp_code": "123456"
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Email verified successfully! Your account is now active.",
    "user": {
        "id": 1,
        "email": "john@company.com",
        "name": "John Doe",
        "company_name": "John's Business"
    }
}
```

### 3. User Login
- **Endpoint:** `POST /api/auth.php`
- **Action:** `login`
- **Description:** Authenticate user and create session

**Request Body:**
```json
{
    "action": "login",
    "email": "john@company.com",
    "password": "password123"
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Login successful",
    "user": {
        "id": 1,
        "email": "john@company.com",
        "name": "John Doe",
        "company_id": 1,
        "company_name": "John's Business",
        "role": "admin"
    }
}
```

### 4. Check Session Status
- **Endpoint:** `GET /api/auth.php?action=check`
- **Description:** Check if user is logged in and get user info

**Success Response (200):**
```json
{
    "logged_in": true,
    "user": {
        "id": 1,
        "email": "john@company.com",
        "name": "John Doe",
        "company_id": 1,
        "company_name": "John's Business"
    }
}
```

### 5. User Logout
- **Endpoint:** `POST /api/auth.php`
- **Action:** `logout`
- **Description:** End user session

**Request Body:**
```json
{
    "action": "logout"
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Logged out successfully"
}
```

### 6. Resend OTP
- **Endpoint:** `POST /api/auth.php`
- **Action:** `resend_otp`
- **Description:** Resend OTP code to email

**Request Body:**
```json
{
    "action": "resend_otp",
    "email": "john@company.com"
}
```

---

## 👥 Customers API (`/api/customers.php`)

### 1. Get All Customers
- **Endpoint:** `GET /api/customers.php`
- **Description:** Retrieve all customers for the company with pagination and search

**Query Parameters:**
- `search` (optional): Search term for name, email, or phone
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 20)
- `sort_by` (optional): Sort field (name, email, phone, created_at)
- `sort_order` (optional): ASC or DESC
- `filter` (optional): active, with_balance

**Example:** `GET /api/customers.php?search=john&page=1&per_page=10&sort_by=name&sort_order=ASC`

**Success Response (200):**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "John Customer",
            "email": "customer@example.com",
            "phone": "+1234567890",
            "billing_address": "123 Main St",
            "customer_type": "individual",
            "payment_terms": "Net 30",
            "credit_limit": 5000.00,
            "is_active": 1,
            "balance": 1500.00,
            "created_date": "2024-01-15",
            "created_at": "2024-01-15 10:30:00"
        }
    ],
    "pagination": {
        "current_page": 1,
        "total_pages": 5,
        "total_items": 47,
        "per_page": 10
    },
    "total": 47
}
```

### 2. Get Single Customer
- **Endpoint:** `GET /api/customers.php?id={customer_id}`
- **Description:** Retrieve specific customer details

**Success Response (200):**
```json
{
    "id": 1,
    "name": "John Customer",
    "email": "customer@example.com",
    "phone": "+1234567890",
    "billing_address": "123 Main St",
    "customer_type": "individual",
    "payment_terms": "Net 30",
    "credit_limit": 5000.00,
    "is_active": 1,
    "balance": 1500.00,
    "created_at": "2024-01-15 10:30:00"
}
```

### 3. Create New Customer
- **Endpoint:** `POST /api/customers.php`
- **Description:** Create a new customer

**Request Body:**
```json
{
    "name": "John Customer",
    "email": "customer@example.com",
    "phone": "+1234567890",
    "billing_address": "123 Main St",
    "customer_type": "individual",
    "payment_terms": "Net 30",
    "credit_limit": 5000.00,
    "is_active": 1,
    "balance": 0
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Customer created successfully",
    "data": {
        "id": 1,
        "name": "John Customer",
        "email": "customer@example.com",
        "phone": "+1234567890",
        "billing_address": "123 Main St",
        "customer_type": "individual",
        "payment_terms": "Net 30",
        "credit_limit": 5000.00,
        "is_active": 1,
        "balance": 0,
        "created_at": "2024-01-15 10:30:00"
    }
}
```

**Error Response (403) - Limit Reached:**
```json
{
    "error": "Customer limit reached for your current plan. Upgrade to Starter plan to add more customers.",
    "current_count": 50,
    "limit": 50,
    "plan": "free"
}
```

### 4. Update Customer
- **Endpoint:** `PUT /api/customers.php?id={customer_id}`
- **Description:** Update existing customer

**Request Body:**
```json
{
    "name": "Updated Customer Name",
    "email": "updated@example.com",
    "phone": "+0987654321",
    "is_active": 0
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Customer updated successfully",
    "data": {
        "id": 1,
        "name": "Updated Customer Name",
        "email": "updated@example.com",
        "phone": "+0987654321",
        "is_active": 0
    }
}
```

### 5. Delete Customer
- **Endpoint:** `DELETE /api/customers.php?id={customer_id}`
- **Description:** Delete a customer

**Success Response (200):**
```json
{
    "success": true
}
```

---

## 🏢 Suppliers API (`/api/suppliers.php`)

### 1. Get All Suppliers
- **Endpoint:** `GET /api/suppliers.php`
- **Description:** Retrieve all suppliers with balance information

**Query Parameters:**
- `search` (optional): Search term for name, email, or phone

**Example:** `GET /api/suppliers.php?search=supplier`

**Success Response (200):**
```json
[
    {
        "id": 1,
        "name": "ABC Supplies Ltd",
        "email": "orders@abcsupplies.com",
        "phone": "+1234567890",
        "address": "456 Industrial Ave",
        "tax_number": "TAX123456",
        "contact_person": "Jane Smith",
        "payment_terms": "Net 30",
        "is_active": 1,
        "balance_due": 2500.00,
        "total_bills": 8,
        "created_at": "2024-01-10 09:00:00"
    }
]
```

### 2. Get Single Supplier
- **Endpoint:** `GET /api/suppliers.php?id={supplier_id}`
- **Description:** Retrieve specific supplier with detailed balance info

**Success Response (200):**
```json
{
    "id": 1,
    "name": "ABC Supplies Ltd",
    "email": "orders@abcsupplies.com",
    "phone": "+1234567890",
    "address": "456 Industrial Ave",
    "tax_number": "TAX123456",
    "contact_person": "Jane Smith",
    "payment_terms": "Net 30",
    "is_active": 1,
    "balance_due": 2500.00,
    "recent_purchases": 3,
    "created_at": "2024-01-10 09:00:00"
}
```

### 3. Create New Supplier
- **Endpoint:** `POST /api/suppliers.php`
- **Description:** Create a new supplier

**Request Body:**
```json
{
    "name": "XYZ Supplies",
    "email": "contact@xyzsupplies.com",
    "phone": "+1234567890",
    "address": "789 Business Park",
    "tax_number": "TAX789012",
    "contact_person": "Bob Johnson",
    "payment_terms": "Net 15",
    "is_active": 1
}
```

**Success Response (200):**
```json
{
    "id": 2,
    "name": "XYZ Supplies",
    "email": "contact@xyzsupplies.com",
    "phone": "+1234567890",
    "address": "789 Business Park",
    "tax_number": "TAX789012",
    "contact_person": "Bob Johnson",
    "payment_terms": "Net 15",
    "is_active": 1,
    "balance_due": 0,
    "recent_purchases": 0,
    "created_at": "2024-01-15 14:20:00"
}
```

### 4. Update Supplier
- **Endpoint:** `PUT /api/suppliers.php?id={supplier_id}`
- **Description:** Update existing supplier

**Request Body:**
```json
{
    "name": "Updated Supplier Name",
    "email": "newemail@supplier.com",
    "phone": "+0987654321",
    "payment_terms": "Net 45",
    "is_active": 0
}
```

**Success Response (200):**
```json
{
    "id": 1,
    "name": "Updated Supplier Name",
    "email": "newemail@supplier.com",
    "phone": "+0987654321",
    "payment_terms": "Net 45",
    "is_active": 0,
    "balance_due": 2500.00,
    "total_bills": 8
}
```

### 5. Delete Supplier
- **Endpoint:** `DELETE /api/suppliers.php?id={supplier_id}`
- **Description:** Delete a supplier (only if no purchase bills exist)

**Success Response (200):**
```json
{
    "success": true
}
```

**Error Response (400):**
```json
{
    "error": "Cannot delete supplier with existing purchase bills"
}
```

---

## 💰 Sales API (`/api/sales.php`)

### 1. Get All Sales Invoices
- **Endpoint:** `GET /api/sales.php`
- **Description:** Retrieve all sales invoices with customer info and status

**Query Parameters:**
- `search` (optional): Search by customer name

**Example:** `GET /api/sales.php?search=customer`

**Success Response (200):**
```json
[
    {
        "id": 1,
        "company_id": 1,
        "customer_id": 1,
        "customer_name": "John Customer",
        "invoice_no": "INV-001",
        "invoice_date": "2024-01-15",
        "due_date": "2024-02-14",
        "subtotal": 1000.00,
        "tax_amount": 100.00,
        "discount_amount": 50.00,
        "discount_type": "fixed",
        "discount_value": 50.00,
        "total": 1050.00,
        "amount_paid": 500.00,
        "balance": 550.00,
        "status": "partially_paid",
        "notes": "First invoice",
        "created_at": "2024-01-15 10:30:00"
    }
]
```

### 2. Get Single Sales Invoice
- **Endpoint:** `GET /api/sales.php?id={invoice_id}`
- **Description:** Retrieve specific invoice with line items and customer details

**Success Response (200):**
```json
{
    "id": 1,
    "company_id": 1,
    "customer_id": 1,
    "customer_name": "John Customer",
    "customer_email": "customer@example.com",
    "invoice_no": "INV-001",
    "invoice_date": "2024-01-15",
    "due_date": "2024-02-14",
    "subtotal": 1000.00,
    "tax_amount": 100.00,
    "discount_amount": 50.00,
    "discount_type": "fixed",
    "discount_value": 50.00,
    "total": 1050.00,
    "amount_paid": 500.00,
    "balance": 550.00,
    "status": "partially_paid",
    "notes": "First invoice",
    "lines": [
        {
            "id": 1,
            "invoice_id": 1,
            "product_id": 1,
            "product_name": "Widget A",
            "description": "Premium widget",
            "quantity": 2,
            "unit_price": 500.00,
            "tax_rate": 10.00,
            "line_total": 1000.00
        }
    ],
    "created_at": "2024-01-15 10:30:00"
}
```

### 3. Create New Sales Invoice
- **Endpoint:** `POST /api/sales.php`
- **Description:** Create a new sales invoice with line items

**Request Body:**
```json
{
    "customer_id": 1,
    "invoice_date": "2024-01-15",
    "due_date": "2024-02-14",
    "notes": "New invoice",
    "discount_amount": 50.00,
    "discount_type": "fixed",
    "tax_rate_id": 1,
    "items": [
        {
            "product_id": 1,
            "description": "Widget A",
            "quantity": 2,
            "unit_price": 500.00,
            "tax_rate": 10.00
        }
    ]
}
```

**Success Response (200):**
```json
{
    "id": 1,
    "company_id": 1,
    "customer_id": 1,
    "invoice_no": "INV-001",
    "invoice_date": "2024-01-15",
    "due_date": "2024-02-14",
    "subtotal": 1000.00,
    "tax_amount": 100.00,
    "discount_amount": 50.00,
    "discount_type": "fixed",
    "discount_value": 50.00,
    "total": 1050.00,
    "amount_paid": 0.00,
    "status": "draft",
    "notes": "New invoice",
    "discounted_subtotal": 950.00,
    "discounted_total": 1050.00,
    "lines": [
        {
            "id": 1,
            "product_id": 1,
            "description": "Widget A",
            "quantity": 2,
            "unit_price": 500.00,
            "tax_rate": 10.00,
            "line_total": 1000.00
        }
    ],
    "created_at": "2024-01-15 10:30:00"
}
```

### 4. Update Invoice Status
- **Endpoint:** `PUT /api/sales.php`
- **Description:** Update invoice status (draft, sent, paid, cancelled)

**Request Body:**
```json
{
    "id": 1,
    "status": "paid"
}
```

**Success Response (200):**
```json
{
    "id": 1,
    "customer_name": "John Customer",
    "invoice_no": "INV-001",
    "total": 1050.00,
    "status": "paid",
    "amount": 1050.00
}
```

### 5. Delete Sales Invoice
- **Endpoint:** `DELETE /api/sales.php?id={invoice_id}`
- **Description:** Delete an invoice (reverses stock, updates customer balance)

**Success Response (200):**
```json
{
    "success": true
}
```

---

## 🔑 Authentication Requirements

All customer, supplier, and sales API endpoints require authentication. Include session cookies or ensure the user is logged in via the auth API first.

**Unauthorized Response (401):**
```json
{
    "error": "Unauthorized - Please login"
}
```

---

## 📋 Common Response Patterns

### Success Responses
- **200 OK**: Request successful with data
- **201 Created**: Resource created successfully  
- **204 No Content**: Request successful, no data returned

### Error Responses
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Permission denied (e.g., subscription limits)
- **404 Not Found**: Resource not found
- **405 Method Not Allowed**: HTTP method not supported
- **500 Internal Server Error**: Server error

### Error Response Format
```json
{
    "error": "Error description",
    "success": false
}
```

---

## 🚀 Frontend Integration Tips

1. **Base URL**: Use `http://localhost/firmaflow-React/FirmaFlow/api/` for all requests
2. **CORS**: All endpoints include proper CORS headers for React
3. **Content-Type**: Always use `Content-Type: application/json`
4. **Sessions**: Login once, session is maintained across requests
5. **Error Handling**: Check for `success: false` or HTTP error codes
6. **Pagination**: Use pagination parameters for large datasets
7. **Search**: Most list endpoints support search parameters

### Example Frontend Code (JavaScript/React)
```javascript
// Login
const login = async (email, password) => {
    const response = await fetch('/api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password })
    });
    return response.json();
};

// Get customers
const getCustomers = async (search = '', page = 1) => {
    const response = await fetch(`/api/customers.php?search=${search}&page=${page}`);
    return response.json();
};

// Create customer
const createCustomer = async (customerData) => {
    const response = await fetch('/api/customers.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
    });
    return response.json();
};
```

---

## 📦 Products API (`/api/products.php`)

### 1. Get All Products
- **Endpoint:** `GET /api/products.php`
- **Description:** Retrieve all products with optional search and filtering

**Query Parameters:**
- `search` (optional): Search term for name, SKU, or description
- `filter` (optional): `active`, `low_stock`, `out_of_stock`

**Example:** `GET /api/products.php?search=widget&filter=active`

**Success Response (200):**
```json
[
    {
        "id": 1,
        "company_id": 1,
        "sku": "WID001",
        "name": "Premium Widget",
        "description": "High-quality widget for industrial use",
        "unit": "pcs",
        "cost_price": 25.00,
        "selling_price": 50.00,
        "track_inventory": 1,
        "stock_quantity": 150,
        "reorder_level": 20,
        "is_active": 1,
        "created_at": "2024-01-10 09:00:00",
        "updated_at": "2024-01-15 14:30:00"
    }
]
```

### 2. Get Single Product
- **Endpoint:** `GET /api/products.php?id={product_id}`
- **Description:** Retrieve specific product details

**Success Response (200):**
```json
{
    "id": 1,
    "company_id": 1,
    "sku": "WID001",
    "name": "Premium Widget",
    "description": "High-quality widget for industrial use",
    "unit": "pcs",
    "cost_price": 25.00,
    "selling_price": 50.00,
    "track_inventory": 1,
    "stock_quantity": 150,
    "reorder_level": 20,
    "is_active": 1,
    "created_at": "2024-01-10 09:00:00"
}
```

### 3. Create New Product
- **Endpoint:** `POST /api/products.php`
- **Description:** Create a new product

**Request Body:**
```json
{
    "name": "Premium Widget",
    "sku": "WID001",
    "description": "High-quality widget for industrial use",
    "unit": "pcs",
    "cost_price": 25.00,
    "selling_price": 50.00,
    "stock_quantity": 150,
    "reorder_level": 20,
    "track_inventory": 1,
    "is_active": 1
}
```

**Success Response (200):**
```json
{
    "id": 1,
    "company_id": 1,
    "sku": "WID001",
    "name": "Premium Widget",
    "description": "High-quality widget for industrial use",
    "unit": "pcs",
    "cost_price": 25.00,
    "selling_price": 50.00,
    "track_inventory": 1,
    "stock_quantity": 150,
    "reorder_level": 20,
    "is_active": 1,
    "created_at": "2024-01-10 09:00:00"
}
```

**Error Response (403) - Limit Reached:**
```json
{
    "error": "Product limit reached for your current plan. Upgrade to Starter plan to add more products.",
    "current_count": 200,
    "limit": 200,
    "plan": "free"
}
```

### 4. Update Product
- **Endpoint:** `PUT /api/products.php?id={product_id}`
- **Description:** Update existing product

**Request Body:**
```json
{
    "name": "Updated Widget Name",
    "selling_price": 55.00,
    "stock_quantity": 120,
    "is_active": 1
}
```

**Success Response (200):**
```json
{
    "id": 1,
    "name": "Updated Widget Name",
    "selling_price": 55.00,
    "stock_quantity": 120,
    "is_active": 1,
    "updated_at": "2024-01-16 10:15:00"
}
```

### 5. Delete Product
- **Endpoint:** `DELETE /api/products.php?id={product_id}`
- **Description:** Delete a product (only if no sales transactions exist)

**Success Response (200):**
```json
{
    "success": true
}
```

**Error Response (400):**
```json
{
    "error": "Cannot delete product with existing sales transactions"
}
```

---

## 🛒 Purchases API (`/api/purchases.php`)

### 1. Get All Purchase Bills
- **Endpoint:** `GET /api/purchases.php`
- **Description:** Retrieve all purchase bills with supplier information

**Query Parameters:**
- `search` (optional): Search by supplier name

**Example:** `GET /api/purchases.php?search=supplier`

**Success Response (200):**
```json
[
    {
        "id": 1,
        "company_id": 1,
        "supplier_id": 1,
        "supplier_name": "ABC Supplies Ltd",
        "reference": "PUR0001",
        "bill_date": "2024-01-15",
        "due_date": "2024-02-14",
        "subtotal": 1000.00,
        "tax_amount": 100.00,
        "total": 1100.00,
        "amount_paid": 0.00,
        "status": "received",
        "notes": "Office supplies order",
        "created_at": "2024-01-15 11:00:00"
    }
]
```

### 2. Get Single Purchase Bill
- **Endpoint:** `GET /api/purchases.php?id={purchase_id}`
- **Description:** Retrieve specific purchase bill with line items

**Success Response (200):**
```json
{
    "id": 1,
    "company_id": 1,
    "supplier_id": 1,
    "reference": "PUR0001",
    "bill_date": "2024-01-15",
    "due_date": "2024-02-14",
    "subtotal": 1000.00,
    "tax_amount": 100.00,
    "total": 1100.00,
    "amount_paid": 0.00,
    "status": "received",
    "notes": "Office supplies order",
    "lines": [
        {
            "id": 1,
            "purchase_id": 1,
            "product_id": 1,
            "product_name": "Office Chair",
            "description": "Ergonomic office chair",
            "quantity": 5,
            "unit_price": 200.00,
            "line_total": 1000.00
        }
    ],
    "created_at": "2024-01-15 11:00:00"
}
```

### 3. Create New Purchase Bill
- **Endpoint:** `POST /api/purchases.php`
- **Description:** Create a new purchase bill with line items

**Request Body:**
```json
{
    "supplier_id": 1,
    "bill_date": "2024-01-15",
    "due_date": "2024-02-14",
    "notes": "Office supplies order",
    "tax_rate_id": 1,
    "items": [
        {
            "product_id": 1,
            "description": "Office Chair",
            "quantity": 5,
            "unit_price": 200.00,
            "tax_rate": 10.00
        }
    ]
}
```

**Success Response (200):**
```json
{
    "success": true,
    "id": 1,
    "reference": "PUR0001"
}
```

### 4. Update Purchase Bill
- **Endpoint:** `PUT /api/purchases.php`
- **Description:** Update existing purchase bill

**Request Body:**
```json
{
    "id": 1,
    "supplier_id": 1,
    "bill_date": "2024-01-15",
    "due_date": "2024-02-20",
    "notes": "Updated notes",
    "items": [
        {
            "product_id": 1,
            "description": "Office Chair - Updated",
            "quantity": 6,
            "unit_price": 200.00,
            "tax_rate": 10.00
        }
    ]
}
```

**Success Response (200):**
```json
{
    "success": true,
    "id": 1,
    "message": "Purchase updated successfully"
}
```

### 5. Delete Purchase Bill
- **Endpoint:** `DELETE /api/purchases.php?id={purchase_id}`
- **Description:** Delete a purchase bill and reverse inventory

**Success Response (200):**
```json
{
    "success": true,
    "message": "Purchase deleted successfully"
}
```

---

## 💳 Payments API (`/api/payments.php`)

### 1. Get All Payments
- **Endpoint:** `GET /api/payments.php`
- **Description:** Retrieve all payments with customer/supplier information

**Query Parameters:**
- `reference_type` (optional): `customer` or `supplier`
- `search` (optional): Search term for payment reference or entity name

**Example:** `GET /api/payments.php?reference_type=customer&search=john`

**Success Response (200):**
```json
[
    {
        "id": 1,
        "company_id": 1,
        "reference": "PAY-001",
        "reference_type": "customer",
        "reference_id": 1,
        "entity_name": "John Customer",
        "payment_type": "received",
        "amount": 500.00,
        "method": "bank_transfer",
        "payment_date": "2024-01-15",
        "status": "completed",
        "notes": "Payment for invoice INV-001",
        "receipt_path": "uploads/receipts/receipt_123.jpg",
        "invoice_total": 1050.00,
        "balance_before": 1050.00,
        "balance_after": 550.00,
        "invoice_number": "INV-001",
        "created_at": "2024-01-15 14:30:00"
    }
]
```

### 2. Get Single Payment
- **Endpoint:** `GET /api/payments.php?id={payment_id}`
- **Description:** Retrieve specific payment details

**Success Response (200):**
```json
{
    "id": 1,
    "company_id": 1,
    "reference": "PAY-001",
    "reference_type": "customer",
    "reference_id": 1,
    "payment_type": "received",
    "amount": 500.00,
    "method": "bank_transfer",
    "payment_date": "2024-01-15",
    "status": "completed",
    "notes": "Payment for invoice INV-001",
    "receipt_path": "uploads/receipts/receipt_123.jpg",
    "created_at": "2024-01-15 14:30:00"
}
```

### 3. Record New Payment
- **Endpoint:** `POST /api/payments.php`
- **Description:** Record a new payment (supports file upload for receipts)

**Content-Type:** `multipart/form-data` (for file upload) or `application/json`

**Form Data Fields:**
```
reference_type: "customer"
reference_id: 1
amount: 500.00
payment_method: "bank_transfer"
payment_date: "2024-01-15"
notes: "Payment for invoice INV-001"
invoice_id: 1
receipt: [file] (optional)
```

**JSON Body (alternative):**
```json
{
    "reference_type": "customer",
    "reference_id": 1,
    "amount": 500.00,
    "payment_method": "bank_transfer",
    "payment_date": "2024-01-15",
    "notes": "Payment for invoice INV-001",
    "invoice_id": 1
}
```

**Success Response (200):**
```json
{
    "success": true,
    "payment_id": 1,
    "message": "Payment recorded successfully",
    "invoice_status": "partially_paid",
    "remaining_balance": 550.00
}
```

### 4. Update Payment
- **Endpoint:** `PUT /api/payments.php`
- **Description:** Update existing payment

**Request Body:**
```json
{
    "id": 1,
    "amount": 600.00,
    "payment_method": "cash",
    "payment_date": "2024-01-16",
    "notes": "Updated payment amount"
}
```

**Success Response (200):**
```json
{
    "id": 1,
    "amount": 600.00,
    "method": "cash",
    "payment_date": "2024-01-16",
    "notes": "Updated payment amount",
    "entity_name": "John Customer"
}
```

### 5. Delete Payment
- **Endpoint:** `DELETE /api/payments.php?id={payment_id}`
- **Description:** Delete a payment and reverse associated transactions

**Success Response (200):**
```json
{
    "success": true
}
```

---

## 💸 Expenses API (`/api/expenses.php`)

### 1. Get All Expenses
- **Endpoint:** `GET /api/expenses.php`
- **Description:** Retrieve all expenses with optional search

**Query Parameters:**
- `search` (optional): Search by category, description, payee name, or receipt number

**Example:** `GET /api/expenses.php?search=office`

**Success Response (200):**
```json
[
    {
        "id": 1,
        "company_id": 1,
        "reference": "EXP-001",
        "payee_name": "Office Depot",
        "category": "Office Supplies",
        "description": "Monthly office supplies purchase",
        "amount": 250.00,
        "expense_date": "2024-01-15",
        "payment_method": "card",
        "receipt_number": "REC-12345",
        "notes": "Bulk purchase for Q1",
        "expense_account_id": 15,
        "payment_account_id": 3,
        "created_at": "2024-01-15 09:30:00"
    }
]
```

### 2. Get Single Expense
- **Endpoint:** `GET /api/expenses.php?id={expense_id}`
- **Description:** Retrieve specific expense details

**Success Response (200):**
```json
{
    "id": 1,
    "company_id": 1,
    "reference": "EXP-001",
    "payee_name": "Office Depot",
    "category": "Office Supplies",
    "description": "Monthly office supplies purchase",
    "amount": 250.00,
    "expense_date": "2024-01-15",
    "payment_method": "card",
    "receipt_number": "REC-12345",
    "notes": "Bulk purchase for Q1",
    "expense_account_id": 15,
    "payment_account_id": 3,
    "created_at": "2024-01-15 09:30:00"
}
```

### 3. Create New Expense
- **Endpoint:** `POST /api/expenses.php`
- **Description:** Create a new expense entry

**Request Body:**
```json
{
    "reference": "EXP-002",
    "payee_name": "Utility Company",
    "expense_category": "Utilities",
    "description": "Monthly electricity bill",
    "amount": 150.00,
    "expense_date": "2024-01-15",
    "payment_method": "bank_transfer",
    "receipt_number": "ELEC-456",
    "notes": "January 2024 electricity"
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Expense created successfully",
    "expense": {
        "id": 2,
        "reference": "EXP-002",
        "payee_name": "Utility Company",
        "category": "Utilities",
        "description": "Monthly electricity bill",
        "amount": 150.00,
        "expense_date": "2024-01-15",
        "payment_method": "bank",
        "created_at": "2024-01-15 10:15:00"
    }
}
```

### 4. Update Expense
- **Endpoint:** `PUT /api/expenses.php`
- **Description:** Update existing expense

**Request Body:**
```json
{
    "id": 1,
    "payee_name": "Updated Vendor",
    "expense_category": "Office Expenses",
    "amount": 275.00,
    "notes": "Updated expense details"
}
```

**Success Response (200):**
```json
{
    "id": 1,
    "reference": "EXP-001",
    "payee_name": "Updated Vendor",
    "category": "Office Expenses",
    "amount": 275.00,
    "notes": "Updated expense details",
    "updated_at": "2024-01-16 11:00:00"
}
```

### 5. Delete Expense
- **Endpoint:** `DELETE /api/expenses.php?id={expense_id}`
- **Description:** Delete an expense and reverse journal entries

**Success Response (200):**
```json
{
    "success": true,
    "message": "Expense deleted successfully"
}
```

---

## 👤 Users API (`/api/users.php`)

### 1. Get All Users
- **Endpoint:** `GET /api/users.php`
- **Description:** Get all users in the company (default behavior)

**Success Response (200):**
```json
{
    "success": true,
    "users": [
        {
            "id": 1,
            "first_name": "John",
            "last_name": "Admin",
            "email": "admin@company.com",
            "phone": "+1234567890",
            "role": "admin",
            "is_active": 1,
            "created_at": "2024-01-01 10:00:00"
        }
    ]
}
```

### 2. Get Admin Users
- **Endpoint:** `GET /api/users.php?action=get_admin_users`
- **Description:** Get all users created by current admin

**Success Response (200):**
```json
{
    "success": true,
    "users": [
        {
            "id": 2,
            "first_name": "Jane",
            "last_name": "Manager",
            "email": "jane@company.com",
            "phone": "+1234567891",
            "role": "manager",
            "is_active": 1,
            "created_at": "2024-01-05 14:30:00"
        }
    ]
}
```

### 3. Validate Current User
- **Endpoint:** `GET /api/users.php?action=validate_current_user`
- **Description:** Validate current user account status

**Success Response (200):**
```json
{
    "success": true,
    "valid": true,
    "user": {
        "id": 1,
        "email": "admin@company.com",
        "name": "John Admin",
        "role": "admin",
        "company_active": true
    }
}
```

### 4. Get Companies
- **Endpoint:** `GET /api/users.php?action=get_companies`
- **Description:** Get all available companies

**Success Response (200):**
```json
{
    "success": true,
    "companies": [
        {
            "id": 1,
            "name": "Company ABC",
            "is_active": 1,
            "created_at": "2024-01-01 10:00:00"
        }
    ]
}
```

### 5. Get Single User
- **Endpoint:** `GET /api/users.php?id={user_id}`
- **Description:** Get specific user details

**Success Response (200):**
```json
{
    "success": true,
    "user": {
        "id": 2,
        "first_name": "Jane",
        "last_name": "Manager",
        "email": "jane@company.com",
        "phone": "+1234567891",
        "role": "manager",
        "is_active": 1,
        "created_at": "2024-01-05 14:30:00"
    }
}
```

### 6. Create New User
- **Endpoint:** `POST /api/users.php`
- **Description:** Create a new user account

**Request Body:**
```json
{
    "first_name": "Bob",
    "last_name": "Employee",
    "email": "bob@company.com",
    "phone": "+1234567892",
    "password": "securepassword123",
    "role": "user",
    "is_active": 1
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "User created successfully",
    "user_id": 3
}
```

**Error Response (403) - Limit Reached:**
```json
{
    "success": false,
    "error": "User limit reached for your current plan. Free plan allows 1 users. Upgrade to Starter plan for 3 users, Professional plan for 10 users, or Enterprise plan for unlimited users.",
    "current_count": 1,
    "limit": 1,
    "plan": "free"
}
```

### 7. Update User
- **Endpoint:** `PUT /api/users.php`
- **Description:** Update existing user (cannot edit self or admin users)

**Request Body:**
```json
{
    "id": 3,
    "first_name": "Robert",
    "last_name": "Employee",
    "email": "robert@company.com",
    "role": "manager",
    "is_active": 1
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "User updated successfully"
}
```

### 8. Delete User
- **Endpoint:** `DELETE /api/users.php?id={user_id}`
- **Description:** Delete a user (cannot delete self or admin users)

**Success Response (200):**
```json
{
    "success": true,
    "message": "User deleted successfully"
}
```

---

## 📊 Dashboard Stats API (`/api/admin_dashboard_stats.php`)

### 1. Get Complete Dashboard Data
- **Endpoint:** `GET /api/admin_dashboard_stats.php`
- **Description:** Get comprehensive dashboard statistics (Admin/Manager access required)

**Success Response (200):**
```json
{
    "success": true,
    "sales_stats": {
        "total_sales": 25000.00,
        "total_invoices": 45,
        "today_sales": 1200.00
    },
    "purchase_stats": {
        "total_purchases": 15000.00,
        "total_bills": 23,
        "today_purchases": 800.00
    },
    "customer_stats": {
        "total_customers": 67,
        "new_customers_30d": 8
    },
    "product_stats": {
        "total_products": 125,
        "low_stock_count": 5,
        "out_of_stock_count": 2
    },
    "low_stock_items": [
        {
            "id": 15,
            "name": "Office Paper",
            "sku": "PAP001",
            "stock_quantity": 3,
            "reorder_level": 10,
            "selling_price": 25.00,
            "stock_status": "Low Stock",
            "threshold_used": "Product Level (10)",
            "days_until_critical": 2
        }
    ],
    "outstanding_receivables": 5500.00,
    "sales_trend": [
        {
            "date": "2024-01-09",
            "sales": 450.00
        },
        {
            "date": "2024-01-10",
            "sales": 720.00
        }
    ],
    "top_products": [
        {
            "product_name": "Premium Widget",
            "total_quantity": 25,
            "total_sales": 1250.00,
            "percentage": 35.5
        }
    ],
    "top_customers": [
        {
            "customer_name": "ABC Corp",
            "total_spent": 2500.00,
            "invoice_count": 5
        }
    ],
    "user_activity": [
        {
            "user_name": "John Admin",
            "last_login": "2024-01-15 09:30:00",
            "role": "admin"
        }
    ],
    "cash_flow": {
        "total_received": 18500.00,
        "total_paid": 12000.00,
        "net_flow": 6500.00
    },
    "recent_sales": [
        {
            "id": 1,
            "customer_name": "John Customer",
            "invoice_number": "INV-001",
            "amount": 1050.00,
            "payment_status": "Partially Paid",
            "sale_date": "2024-01-15"
        }
    ]
}
```

### 2. Get Low Stock Data Only
- **Endpoint:** `GET /api/admin_dashboard_stats.php?low_stock_only=true`
- **Description:** Get only low stock information (User role access allowed)

**Success Response (200):**
```json
{
    "success": true,
    "low_stock_items": [
        {
            "id": 15,
            "name": "Office Paper",
            "sku": "PAP001",
            "stock_quantity": 3,
            "reorder_level": 10,
            "selling_price": 25.00,
            "stock_status": "Low Stock",
            "threshold_used": "Product Level (10)",
            "days_until_critical": 2
        }
    ],
    "low_stock_count": 5,
    "inventory_settings": {
        "use_global_threshold": false,
        "global_threshold": 10
    }
}
```

### 3. Get Dashboard with Date Range
- **Endpoint:** `GET /api/admin_dashboard_stats.php?range_days=30`
- **Description:** Get dashboard data for specific date range

**Query Parameters:**
- `range_days` (optional): Number of days for top products analysis (1-365, default: 30)

**Success Response:** Same as complete dashboard data but filtered by date range

---

## 🔑 API Access Levels

### Admin/Manager Required:
- Complete dashboard statistics
- User management (create, update, delete)
- All supplier payments (GET)

### User Level Access:
- Low stock data only
- Own profile information
- Standard CRUD operations on customers, products, sales, expenses

### Authentication Required:
- All endpoints except authentication APIs
- Session-based authentication maintained across requests

---

*Last updated: November 2024*