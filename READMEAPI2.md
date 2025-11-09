# FirmaFlow Extended API Documentation

This document provides comprehensive API endpoints for advanced FirmaFlow features including subscriptions, chat system, financial reports, settings management, and administrative functions.

**Base URL:** `http://localhost/firmaflow-React/FirmaFlow/api/`

---

## 💳 Subscription API (`/api/subscription.php`)

### 1. Get Current Subscription
- **Endpoint:** `GET /api/subscription.php?action=current`
- **Description:** Get current user's subscription details
- **Authentication:** Required

**Success Response (200):**
```json
{
    "success": true,
    "subscription": {
        "plan": "professional",
        "billing_type": "monthly",
        "start_date": "2024-01-15 10:00:00",
        "end_date": "2024-02-15 10:00:00",
        "status": "active",
        "last_payment_date": "2024-01-15 10:00:00",
        "payment_reference": "TXN-123456789"
    }
}
```

### 2. Get Payment History
- **Endpoint:** `GET /api/subscription.php?action=payments` or `GET /api/subscription.php?action=history`
- **Description:** Get subscription payment history

**Success Response (200):**
```json
{
    "success": true,
    "payments": [
        {
            "id": 1,
            "transaction_id": "FLW-TXN-123456789",
            "amount": 10000.00,
            "currency": "NGN",
            "status": "successful",
            "plan_type": "professional",
            "billing_type": "monthly",
            "payment_date": "2024-01-15 10:00:00",
            "subscription_start": "2024-01-15 10:00:00",
            "subscription_end": "2024-02-15 10:00:00"
        }
    ]
}
```

### 3. Get Usage Statistics
- **Endpoint:** `GET /api/subscription.php?action=usage`
- **Description:** Get current plan usage statistics

**Success Response (200):**
```json
{
    "success": true,
    "usage": {
        "customers": {
            "current": 45,
            "limit": 1000,
            "percentage": 4.5
        },
        "products": {
            "current": 123,
            "limit": 2000,
            "percentage": 6.15
        },
        "users": {
            "current": 3,
            "limit": 10,
            "percentage": 30.0
        }
    }
}
```

### 4. Get Available Plans
- **Endpoint:** `GET /api/subscription.php?action=plans`
- **Description:** Get all available subscription plans with pricing

**Success Response (200):**
```json
{
    "success": true,
    "plans": {
        "starter": {
            "name": "Starter",
            "monthly": {
                "amount": 5000,
                "currency": "NGN",
                "interval": "monthly"
            },
            "yearly": {
                "amount": 54000,
                "currency": "NGN",
                "interval": "yearly",
                "discount": 10
            }
        },
        "professional": {
            "name": "Professional",
            "monthly": {
                "amount": 10000,
                "currency": "NGN",
                "interval": "monthly"
            }
        },
        "enterprise": {
            "name": "Enterprise",
            "monthly": {
                "amount": 15000,
                "currency": "NGN",
                "interval": "monthly"
            }
        }
    }
}
```

### 5. Activate Subscription
- **Endpoint:** `POST /api/subscription.php`
- **Action:** `activate_subscription`
- **Description:** Activate a paid subscription after successful payment

**Request Body:**
```json
{
    "action": "activate_subscription",
    "plan": "professional",
    "billing_type": "monthly",
    "transaction_id": "FLW-TXN-123456789",
    "tx_ref": "TXN-REF-123456789",
    "amount": 10000.00,
    "currency": "NGN",
    "payment_method": "flutterwave",
    "payment_status": "successful",
    "for_user_id": 5
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Subscription activated successfully",
    "subscription": {
        "plan": "professional",
        "billing_type": "monthly",
        "start_date": "2024-01-15 10:00:00",
        "end_date": "2024-02-15 10:00:00",
        "amount_paid": 10000.00,
        "currency": "NGN",
        "transaction_id": "FLW-TXN-123456789"
    }
}
```

---

## 💬 Chat System API

### 1. Admin Get Messages
- **Endpoint:** `POST /api/admin-get-messages.php`
- **Description:** Get chat messages for admin users (company support)
- **Authentication:** Admin role required

**Request Body:**
```json
{
    "session_id": "chat-session-12345",
    "since_id": 0
}
```

**Success Response (200):**
```json
{
    "success": true,
    "messages": [
        {
            "id": 1,
            "session_id": "chat-session-12345",
            "sender_type": "customer",
            "sender_name": "John Customer",
            "message": "I need help with my invoice",
            "created_at": "2024-01-15 14:30:00"
        },
        {
            "id": 2,
            "session_id": "chat-session-12345",
            "sender_type": "admin",
            "sender_name": "Support Agent",
            "message": "How can I help you with your invoice?",
            "created_at": "2024-01-15 14:32:00"
        }
    ],
    "session_info": {
        "session_id": "chat-session-12345",
        "status": "active",
        "visitor_name": "John Customer",
        "created_at": "2024-01-15 14:25:00"
    }
}
```

### 2. Admin Send Message
- **Endpoint:** `POST /api/admin-send-message.php`
- **Description:** Send message as admin in customer support chat
- **Authentication:** Admin role required

**Request Body:**
```json
{
    "session_id": "chat-session-12345",
    "message": "I can help you with that. Please provide your invoice number."
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Message sent successfully",
    "data": {
        "id": 3,
        "session_id": "chat-session-12345",
        "sender_type": "admin",
        "sender_name": "Support Agent",
        "message": "I can help you with that. Please provide your invoice number.",
        "created_at": "2024-01-15 14:35:00"
    }
}
```

---

## 🔐 Password Reset API (`/api/password_reset.php`)

### 1. Request Password Reset
- **Endpoint:** `POST /api/password_reset.php`
- **Action:** `request_reset`
- **Description:** Request password reset OTP via email

**Request Body:**
```json
{
    "action": "request_reset",
    "email": "user@company.com"
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Password reset request processed. If your email is registered, you will receive an OTP code shortly.",
    "email_sent": true
}
```

### 2. Verify OTP
- **Endpoint:** `POST /api/password_reset.php`
- **Action:** `verify_otp`
- **Description:** Verify OTP code for password reset

**Request Body:**
```json
{
    "action": "verify_otp",
    "email": "user@company.com",
    "otp": "123456"
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "OTP verified",
    "reset_token": "base64EncodedResetToken"
}
```

### 3. Reset Password
- **Endpoint:** `POST /api/password_reset.php`
- **Action:** `reset_password`
- **Description:** Reset password with verified token

**Request Body:**
```json
{
    "action": "reset_password",
    "reset_token": "base64EncodedResetToken",
    "new_password": "newSecurePassword123",
    "confirm_password": "newSecurePassword123"
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Password reset successfully. You can now login."
}
```

---

## 📊 Financial Statements API (`/api/financial_statements.php`)

### 1. Get Key Performance Indicators
- **Endpoint:** `GET /api/financial_statements.php?action=kpis&from=2024-01-01&to=2024-01-31`
- **Description:** Get financial KPIs for dashboard

**Success Response (200):**
```json
{
    "success": true,
    "currency": "NGN",
    "revenue": 125000.00,
    "expenses": 85000.00,
    "profit": 40000.00,
    "cashFlow": 35000.00,
    "revenueFormatted": "₦125,000.00",
    "expensesFormatted": "₦85,000.00",
    "profitFormatted": "₦40,000.00",
    "cashFlowFormatted": "₦35,000.00",
    "revenueChange": 15.5,
    "expensesChange": 8.2,
    "profitChange": 25.3,
    "cashFlowChange": 12.1
}
```

### 2. Get Charts Data
- **Endpoint:** `GET /api/financial_statements.php?action=charts&from=2024-01-01&to=2024-01-31`
- **Description:** Get chart data for financial dashboards

**Success Response (200):**
```json
{
    "success": true,
    "currency": "NGN",
    "revenueExpenses": {
        "labels": ["Sep 2024", "Oct 2024", "Nov 2024", "Dec 2024", "Jan 2025"],
        "datasets": [
            {
                "label": "Revenue",
                "data": [95000, 110000, 125000, 130000, 125000],
                "backgroundColor": "#10b981"
            },
            {
                "label": "Expenses",
                "data": [65000, 72000, 85000, 88000, 85000],
                "backgroundColor": "#ef4444"
            }
        ]
    },
    "monthlyPerformance": {
        "labels": ["Sep 2024", "Oct 2024", "Nov 2024", "Dec 2024", "Jan 2025"],
        "datasets": [
            {
                "label": "Net Profit",
                "data": [30000, 38000, 40000, 42000, 40000],
                "backgroundColor": "#6366f1"
            }
        ]
    }
}
```

### 3. Get Profit & Loss Statement
- **Endpoint:** `GET /api/financial_statements.php?action=profit_loss&from=2024-01-01&to=2024-01-31`
- **Description:** Get detailed profit and loss statement

**Success Response (200):**
```json
{
    "success": true,
    "data": {
        "income_accounts": [
            {
                "account_name": "Sales Revenue",
                "balance": 125000.00
            }
        ],
        "expense_accounts": [
            {
                "account_name": "Cost of Goods Sold",
                "balance": 60000.00
            },
            {
                "account_name": "Operating Expenses",
                "balance": 25000.00
            }
        ],
        "total_income": 125000.00,
        "total_expenses": 85000.00,
        "gross_profit": 65000.00,
        "net_income": 40000.00
    },
    "statement": [
        {
            "account": "REVENUE",
            "current": 0,
            "previous": 0,
            "change": 0,
            "percent_change": "0.0",
            "is_total": true
        },
        {
            "account": "Sales Revenue",
            "current": 125000.00,
            "previous": 110000.00,
            "change": 15000.00,
            "percent_change": "13.6",
            "is_total": false
        }
    ]
}
```

### 4. Get Balance Sheet
- **Endpoint:** `GET /api/financial_statements.php?action=balance_sheet&to=2024-01-31`
- **Description:** Get balance sheet as of specific date

**Success Response (200):**
```json
{
    "success": true,
    "data": {
        "current_assets": [
            {
                "account_name": "Cash & Bank",
                "balance": 45000.00
            },
            {
                "account_name": "Accounts Receivable",
                "balance": 25000.00
            }
        ],
        "current_liabilities": [
            {
                "account_name": "Accounts Payable",
                "balance": 15000.00
            }
        ],
        "equity_accounts": [
            {
                "account_name": "Retained Earnings",
                "balance": 55000.00
            }
        ],
        "total_assets": 70000.00,
        "total_liabilities": 15000.00,
        "total_equity": 55000.00
    }
}
```

### 5. Get Cash Flow Statement
- **Endpoint:** `GET /api/financial_statements.php?action=cash_flow&from=2024-01-01&to=2024-01-31`
- **Description:** Get cash flow statement

**Success Response (200):**
```json
{
    "success": true,
    "data": {
        "operating_activities": [
            {
                "description": "Cash from Sales",
                "amount": 120000.00
            },
            {
                "description": "Cash paid to Suppliers",
                "amount": -75000.00
            }
        ],
        "investing_activities": [],
        "financing_activities": [],
        "net_operating_cash": 45000.00,
        "net_investing_cash": 0.00,
        "net_financing_cash": 0.00,
        "net_change_in_cash": 45000.00,
        "opening_cash": 25000.00,
        "closing_cash": 70000.00
    }
}
```

### 6. Get Top Customers
- **Endpoint:** `GET /api/financial_statements.php?action=top_customers&from=2024-01-01&to=2024-01-31`
- **Description:** Get top customers by revenue

**Success Response (200):**
```json
{
    "success": true,
    "customers": [
        {
            "customer_name": "ABC Corporation",
            "total_sales": 25000.00,
            "invoice_count": 5,
            "average_sale": 5000.00
        },
        {
            "customer_name": "XYZ Ltd",
            "total_sales": 18000.00,
            "invoice_count": 3,
            "average_sale": 6000.00
        }
    ]
}
```

### 7. Get Revenue Sources
- **Endpoint:** `GET /api/financial_statements.php?action=revenue_sources&from=2024-01-01&to=2024-01-31`
- **Description:** Get revenue breakdown by product/service

**Success Response (200):**
```json
{
    "success": true,
    "sources": [
        {
            "product_name": "Premium Widget",
            "revenue": 45000.00,
            "quantity_sold": 90,
            "invoice_count": 12,
            "percentage": 36.0
        },
        {
            "product_name": "Standard Service",
            "revenue": 35000.00,
            "quantity_sold": 70,
            "invoice_count": 8,
            "percentage": 28.0
        }
    ],
    "total_revenue": 125000.00
}
```

---

## 📈 Reports API (`/api/reports.php`)

### 1. Get Trial Balance
- **Endpoint:** `GET /api/reports.php?type=trial_balance&as_of=2024-01-31`
- **Description:** Generate trial balance report

**Success Response (200):**
```json
{
    "success": true,
    "report_type": "trial_balance",
    "as_of_date": "2024-01-31",
    "data": {
        "asset_accounts": [
            {
                "account_name": "Cash & Bank",
                "account_code": "1001",
                "debit_total": 45000.00,
                "credit_total": 0.00,
                "balance": 45000.00
            }
        ],
        "liability_accounts": [
            {
                "account_name": "Accounts Payable",
                "account_code": "2001",
                "debit_total": 0.00,
                "credit_total": 15000.00,
                "balance": -15000.00
            }
        ],
        "grand_total_debits": 125000.00,
        "grand_total_credits": 125000.00,
        "books_balanced": true,
        "balance_difference": 0.00
    }
}
```

### 2. Get Profit & Loss Report
- **Endpoint:** `GET /api/reports.php?type=profit_loss&start_date=2024-01-01&end_date=2024-01-31`
- **Description:** Generate detailed profit and loss report

**Success Response (200):**
```json
{
    "success": true,
    "report_type": "profit_loss",
    "period": {
        "start_date": "2024-01-01",
        "end_date": "2024-01-31"
    },
    "data": {
        "income_accounts": [
            {
                "account_name": "Sales Revenue",
                "balance": 125000.00,
                "percentage_of_total": 100.0
            }
        ],
        "expense_accounts": [
            {
                "account_name": "Cost of Goods Sold",
                "balance": 60000.00,
                "percentage_of_total": 70.6
            },
            {
                "account_name": "Operating Expenses",
                "balance": 25000.00,
                "percentage_of_total": 29.4
            }
        ],
        "total_income": 125000.00,
        "total_expenses": 85000.00,
        "gross_profit": 65000.00,
        "net_income": 40000.00,
        "profit_margin": 32.0
    }
}
```

### 3. Get Balance Sheet Report
- **Endpoint:** `GET /api/reports.php?type=balance_sheet&as_of=2024-01-31`
- **Description:** Generate balance sheet report

**Success Response (200):**
```json
{
    "success": true,
    "report_type": "balance_sheet",
    "as_of_date": "2024-01-31",
    "data": {
        "current_assets": [
            {
                "account_name": "Cash & Bank",
                "balance": 45000.00
            },
            {
                "account_name": "Accounts Receivable", 
                "balance": 25000.00
            }
        ],
        "total_current_assets": 70000.00,
        "current_liabilities": [
            {
                "account_name": "Accounts Payable",
                "balance": 15000.00
            }
        ],
        "total_current_liabilities": 15000.00,
        "equity_accounts": [
            {
                "account_name": "Retained Earnings",
                "balance": 55000.00
            }
        ],
        "total_equity": 55000.00,
        "total_assets": 70000.00,
        "total_liabilities_equity": 70000.00,
        "balanced": true
    }
}
```

### 4. Get Cash Flow Report
- **Endpoint:** `GET /api/reports.php?type=cash_flow&start_date=2024-01-01&end_date=2024-01-31`
- **Description:** Generate cash flow report

**Success Response (200):**
```json
{
    "success": true,
    "report_type": "cash_flow",
    "period": {
        "start_date": "2024-01-01",
        "end_date": "2024-01-31"
    },
    "data": {
        "operating_activities": [
            {
                "description": "Collections from Customers",
                "amount": 120000.00
            },
            {
                "description": "Payments to Suppliers",
                "amount": -75000.00
            }
        ],
        "net_operating_cash": 45000.00,
        "net_investing_cash": 0.00,
        "net_financing_cash": 0.00,
        "net_change_in_cash": 45000.00,
        "opening_cash_balance": 25000.00,
        "closing_cash_balance": 70000.00
    }
}
```

### 5. Get Accounts Receivable Report
- **Endpoint:** `GET /api/reports.php?type=accounts_receivable`
- **Description:** Generate accounts receivable aging report

**Success Response (200):**
```json
{
    "success": true,
    "report_type": "accounts_receivable",
    "data": {
        "customers": [
            {
                "customer_name": "ABC Corporation",
                "total_outstanding": 15000.00,
                "current": 10000.00,
                "days_30": 5000.00,
                "days_60": 0.00,
                "days_90": 0.00,
                "over_90": 0.00
            }
        ],
        "totals": {
            "total_outstanding": 25000.00,
            "current": 18000.00,
            "days_30": 7000.00,
            "days_60": 0.00,
            "days_90": 0.00,
            "over_90": 0.00
        }
    }
}
```

### 6. Get Sales Report
- **Endpoint:** `GET /api/reports.php?type=sales&start_date=2024-01-01&end_date=2024-01-31`
- **Description:** Generate detailed sales report

**Success Response (200):**
```json
{
    "success": true,
    "report_type": "sales",
    "period": {
        "start_date": "2024-01-01",
        "end_date": "2024-01-31"
    },
    "data": {
        "summary": {
            "total_sales": 125000.00,
            "total_invoices": 25,
            "average_invoice": 5000.00,
            "tax_collected": 12500.00
        },
        "by_customer": [
            {
                "customer_name": "ABC Corporation",
                "total_sales": 25000.00,
                "invoice_count": 5,
                "average_sale": 5000.00
            }
        ],
        "by_product": [
            {
                "product_name": "Premium Widget",
                "quantity_sold": 90,
                "revenue": 45000.00,
                "percentage": 36.0
            }
        ],
        "by_month": [
            {
                "month": "2024-01",
                "sales": 125000.00,
                "invoices": 25
            }
        ]
    }
}
```

---

## ⚙️ Settings API (`/api/settings.php`)

### 1. Get All Settings
- **Endpoint:** `GET /api/settings.php?type=all`
- **Description:** Get comprehensive settings data

**Success Response (200):**
```json
{
    "success": true,
    "data": {
        "company": {
            "id": 1,
            "name": "ABC Corporation",
            "email": "info@abc.com",
            "phone": "+1234567890",
            "website": "https://abc.com",
            "address": "123 Business St",
            "logo": "uploads/logos/company_logo.png"
        },
        "settings": {
            "currency": "NGN",
            "date_format": "Y-m-d",
            "time_zone": "Africa/Lagos",
            "tax_enabled": true,
            "default_tax_rate": 7.5,
            "invoice_prefix": "INV-",
            "invoice_numbering": "sequential"
        },
        "tags": [
            {
                "id": 1,
                "name": "Priority Customer",
                "color": "#10b981",
                "description": "High priority customers",
                "is_active": 1
            }
        ],
        "templates": [
            {
                "id": 1,
                "template_type": "invoice",
                "template_name": "Modern Invoice",
                "is_default": 1,
                "template_data": {
                    "header_color": "#2563eb",
                    "show_logo": true,
                    "footer_text": "Thank you for your business"
                }
            }
        ],
        "tax_rates": [
            {
                "id": 1,
                "name": "VAT",
                "rate": 7.5,
                "description": "Value Added Tax",
                "is_active": 1,
                "is_default": 1
            }
        ]
    }
}
```

### 2. Get Company Data
- **Endpoint:** `GET /api/settings.php?type=company`
- **Description:** Get company information

**Success Response (200):**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "name": "ABC Corporation",
        "email": "info@abc.com",
        "phone": "+1234567890",
        "website": "https://abc.com",
        "address": "123 Business Street",
        "city": "Lagos",
        "state": "Lagos State",
        "country": "Nigeria",
        "postal_code": "100001",
        "tax_number": "TAX123456789",
        "registration_number": "RC123456",
        "logo": "uploads/logos/company_logo.png",
        "created_at": "2024-01-01 10:00:00"
    }
}
```

### 3. Update Company Information
- **Endpoint:** `PUT /api/settings.php`
- **Action:** `update_company`
- **Description:** Update company details

**Request Body:**
```json
{
    "action": "update_company",
    "name": "ABC Corporation Ltd",
    "email": "contact@abc.com", 
    "phone": "+1234567890",
    "website": "https://www.abc.com",
    "address": "123 New Business Street",
    "city": "Lagos",
    "state": "Lagos State",
    "country": "Nigeria",
    "postal_code": "100001"
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Company updated successfully"
}
```

### 4. Get Company Settings
- **Endpoint:** `GET /api/settings.php?type=settings`
- **Description:** Get company configuration settings

**Success Response (200):**
```json
{
    "success": true,
    "data": {
        "currency": "NGN",
        "date_format": "Y-m-d",
        "time_zone": "Africa/Lagos",
        "tax_enabled": true,
        "default_tax_rate": 7.5,
        "invoice_prefix": "INV-",
        "invoice_numbering": "sequential",
        "email_notifications": true,
        "sms_notifications": false,
        "inventory_tracking": true,
        "low_stock_threshold": 10,
        "backup_frequency": "daily"
    }
}
```

### 5. Save Setting
- **Endpoint:** `POST /api/settings.php`
- **Action:** `save_setting`
- **Description:** Save individual setting

**Request Body:**
```json
{
    "action": "save_setting",
    "key": "default_tax_rate",
    "value": 7.5,
    "type": "number"
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Setting saved successfully"
}
```

### 6. Get Tags
- **Endpoint:** `GET /api/settings.php?type=tags`
- **Description:** Get all company tags

**Success Response (200):**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "Priority Customer",
            "color": "#10b981",
            "description": "High priority customers requiring special attention",
            "is_active": 1,
            "created_at": "2024-01-10 09:00:00"
        },
        {
            "id": 2,
            "name": "Wholesale",
            "color": "#f59e0b",
            "description": "Wholesale customers with bulk pricing",
            "is_active": 1,
            "created_at": "2024-01-12 11:30:00"
        }
    ]
}
```

### 7. Create Tag
- **Endpoint:** `POST /api/settings.php`
- **Action:** `create_tag`
- **Description:** Create a new tag

**Request Body:**
```json
{
    "action": "create_tag",
    "name": "VIP Customer",
    "color": "#8b5cf6",
    "description": "VIP customers with premium services"
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Tag created successfully",
    "id": 3
}
```

### 8. Update Tag
- **Endpoint:** `PUT /api/settings.php`
- **Action:** `update_tag`
- **Description:** Update existing tag

**Request Body:**
```json
{
    "action": "update_tag",
    "id": 3,
    "name": "VIP Customer Updated",
    "color": "#8b5cf6",
    "description": "Updated VIP customer description"
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Tag updated successfully"
}
```

### 9. Delete Tag
- **Endpoint:** `DELETE /api/settings.php`
- **Action:** `delete_tag`
- **Description:** Delete a tag

**Request Body:**
```json
{
    "action": "delete_tag",
    "id": 3
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Tag deleted successfully"
}
```

### 10. Get Tax Rates
- **Endpoint:** `GET /api/settings.php?type=tax_rates`
- **Description:** Get all tax rates

**Success Response (200):**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "VAT",
            "rate": 7.5,
            "description": "Value Added Tax - Standard Rate",
            "is_active": 1,
            "is_default": 1,
            "created_at": "2024-01-01 10:00:00"
        },
        {
            "id": 2,
            "name": "Service Tax",
            "rate": 5.0,
            "description": "Service Tax for professional services",
            "is_active": 1,
            "is_default": 0,
            "created_at": "2024-01-05 14:30:00"
        }
    ]
}
```

### 11. Create Tax Rate
- **Endpoint:** `POST /api/settings.php`
- **Action:** `create_tax_rate`
- **Description:** Create new tax rate

**Request Body:**
```json
{
    "action": "create_tax_rate",
    "name": "Export Tax",
    "rate": 0.0,
    "description": "Zero-rated tax for export transactions",
    "is_active": true,
    "is_default": false
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Tax rate created successfully",
    "id": 3
}
```

### 12. Upload Company Logo
- **Endpoint:** `POST /api/settings.php`
- **Content-Type:** `multipart/form-data`
- **Description:** Upload company logo image

**Form Data:**
```
company_logo: [file] (JPG, PNG, GIF, max 2MB)
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Logo uploaded successfully",
    "logo_path": "uploads/logos/company_1_20240115_143022.jpg"
}
```

---

## 🔑 Authentication & Authorization

### Access Levels:
- **Public**: Password reset APIs
- **Authenticated**: All other APIs require login
- **Admin Only**: Chat admin APIs, subscription activation for other users
- **Subscription-based**: Advanced reports, premium features

### Error Responses:
```json
{
    "success": false,
    "error": "Authentication required"
}
```

```json
{
    "success": false,
    "error": "Admin access required"
}
```

```json
{
    "success": false,
    "error": "Subscription upgrade required for this feature"
}
```

---

## 📋 Response Patterns

### Success Response:
```json
{
    "success": true,
    "message": "Operation successful",
    "data": {}
}
```

### Error Response:
```json
{
    "success": false,
    "error": "Error description",
    "message": "Detailed error message"
}
```

### Pagination Response:
```json
{
    "success": true,
    "data": [],
    "pagination": {
        "current_page": 1,
        "total_pages": 5,
        "total_items": 47,
        "per_page": 10
    }
}
```

---

## 🚀 Integration Notes

1. **Session Management**: All authenticated APIs use PHP sessions
2. **File Uploads**: Use `multipart/form-data` for file upload endpoints
3. **Date Formats**: Use `Y-m-d` format for dates, `Y-m-d H:i:s` for timestamps
4. **Currency**: Amounts are in decimal format (e.g., 1250.00)
5. **Subscription Limits**: APIs enforce plan-based limits automatically
6. **Error Logging**: All errors are logged server-side for debugging

---

## 💰 Payment Verification API (`/api/verify-payment.php`)

### 1. Verify Flutterwave Payment
- **Endpoint:** `POST /api/verify-payment.php`
- **Description:** Verify and activate subscription after Flutterwave payment
- **Authentication:** Required

**Request Body:**
```json
{
    "transaction_id": "FLW-TXN-123456789",
    "tx_ref": "FF_123_professional_monthly_1641123456_abc"
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Payment verified and subscription activated",
    "plan": "professional",
    "amount": 10000.00,
    "subscription_end": "2024-02-15 10:00:00"
}
```

**Error Response (400):**
```json
{
    "success": false,
    "error": "Transaction ID and reference are required"
}
```

---

## 🏢 Supplier Reports API (`/api/supplier-reports.php`)

### 1. Get Supplier Purchase Report
- **Endpoint:** `GET /api/supplier-reports.php?supplier_id=1&report_type=purchase-report&start_date=2024-01-01&end_date=2024-01-31`
- **Description:** Get detailed purchase report for specific supplier

**Success Response (200):**
```json
{
    "supplier_id": 1,
    "period": "2024-01-01 to 2024-01-31",
    "purchases": [
        {
            "reference": "PB-2024-001",
            "date": "2024-01-15",
            "amount": 25000.00,
            "status": "approved",
            "description": "Office supplies purchase",
            "amount_paid": 25000.00
        }
    ],
    "total_amount": 75000.00,
    "amount_paid": 65000.00,
    "balance_due": 10000.00,
    "purchase_count": 3
}
```

### 2. Get Supplier Payment History
- **Endpoint:** `GET /api/supplier-reports.php?supplier_id=1&report_type=payment-history&start_date=2024-01-01&end_date=2024-01-31`
- **Description:** Get payment history for specific supplier

**Success Response (200):**
```json
{
    "supplier_id": 1,
    "period": "2024-01-01 to 2024-01-31",
    "payments": [
        {
            "date": "2024-01-20",
            "reference": "PAY-001",
            "amount": 25000.00,
            "method": "bank_transfer",
            "notes": "Payment for invoice PB-2024-001",
            "bill_reference": "PB-2024-001"
        }
    ],
    "total_paid": 65000.00,
    "avg_payment": 21666.67,
    "payment_count": 3
}
```

### 3. Get Supplier Statement
- **Endpoint:** `GET /api/supplier-reports.php?supplier_id=1&report_type=supplier-statement&start_date=2024-01-01&end_date=2024-01-31`
- **Description:** Get detailed supplier statement with running balances

**Success Response (200):**
```json
{
    "supplier_id": 1,
    "period": "2024-01-01 to 2024-01-31",
    "opening_balance": 5000.00,
    "closing_balance": 15000.00,
    "total_purchases": 75000.00,
    "total_payments": 65000.00,
    "transactions": [
        {
            "date": "2024-01-15",
            "type": "purchase",
            "reference": "PB-2024-001",
            "amount": 25000.00,
            "description": "Office supplies",
            "running_balance": 30000.00
        },
        {
            "date": "2024-01-20",
            "type": "payment",
            "reference": "PAY-001",
            "amount": 25000.00,
            "description": "Payment received",
            "running_balance": 5000.00
        }
    ]
}
```

---

## 📊 Sales Summary API (`/api/sales_summary.php`)

### 1. Get Sales Summary Report
- **Endpoint:** `GET /api/sales_summary.php?type=sales_summary&start_date=2024-01-01&end_date=2024-01-31`
- **Description:** Get comprehensive sales summary with business metrics

**Success Response (200):**
```json
{
    "title": "Sales Summary Report",
    "period": "2024-01-01 to 2024-01-31",
    "sales": [
        {
            "invoice_date": "2024-01-15",
            "invoice_no": "INV-2024-001",
            "reference": "REF-001",
            "customer_name": "ABC Corporation",
            "customer_phone": "+1234567890",
            "customer_email": "contact@abc.com",
            "subtotal": 100000.00,
            "tax": 7500.00,
            "total": 107500.00,
            "amount_paid": 107500.00,
            "outstanding_amount": 0.00,
            "status": "paid",
            "due_date": "2024-02-14",
            "payment_status": "Fully Paid",
            "days_overdue": 0
        }
    ],
    "summary": {
        "total_invoices": 25,
        "total_sales_amount": 1250000.00,
        "average_sale_value": 50000.00,
        "total_customers_in_system": 45,
        "customers_who_bought_in_period": 18,
        "status_breakdown": {
            "draft_invoices": 2,
            "sent_invoices": 8,
            "paid_invoices": 15
        },
        "payment_analysis": {
            "total_paid_amount": 1100000.00,
            "total_outstanding_amount": 150000.00,
            "collection_rate": 88.0
        }
    },
    "metadata": {
        "currency": "₦",
        "generated_at": "2024-01-31 15:30:00",
        "company_id": 1,
        "explanation": {
            "total_invoices": "All recorded sales regardless of status (draft, sent, paid)",
            "total_sales_amount": "Total monetary value of all sales made",
            "average_sale_value": "Average value per sale (Total Sales ÷ Total Invoices)",
            "total_customers_in_system": "Total active customers for this company"
        }
    },
    "status": "success"
}
```

---

## 👥 Customer Reports API (`/api/customer-reports.php`)

### 1. Get Customer Sales Report
- **Endpoint:** `GET /api/customer-reports.php?customer_id=1&report_type=sales-report&start_date=2024-01-01&end_date=2024-01-31`
- **Description:** Get sales report for specific customer

**Success Response (200):**
```json
{
    "success": true,
    "customer_id": 1,
    "period": "2024-01-01 to 2024-01-31",
    "sales": [
        {
            "id": 1,
            "reference": "INV-2024-001",
            "date": "2024-01-15",
            "amount": 107500.00,
            "status": "paid",
            "description": "Product sales",
            "amount_paid": 107500.00,
            "balance_due": 0.00
        }
    ],
    "total_amount": 215000.00,
    "amount_paid": 200000.00,
    "balance_due": 15000.00,
    "sales_count": 4
}
```

### 2. Get Customer Payment History
- **Endpoint:** `GET /api/customer-reports.php?customer_id=1&report_type=payment-history&start_date=2024-01-01&end_date=2024-01-31`
- **Description:** Get payment history for specific customer

**Success Response (200):**
```json
{
    "success": true,
    "customer_id": 1,
    "period": "2024-01-01 to 2024-01-31",
    "payments": [
        {
            "date": "2024-01-20",
            "reference": "PAY-C001",
            "amount": 107500.00,
            "method": "bank_transfer",
            "notes": "Payment for invoice INV-2024-001",
            "invoice_reference": "INV-2024-001"
        }
    ],
    "total_paid": 200000.00,
    "avg_payment": 66666.67,
    "payment_count": 3
}
```

### 3. Get Customer Statement
- **Endpoint:** `GET /api/customer-reports.php?customer_id=1&report_type=customer-statement&start_date=2024-01-01&end_date=2024-01-31`
- **Description:** Get detailed customer statement with running balances

**Success Response (200):**
```json
{
    "success": true,
    "customer_id": 1,
    "period": "2024-01-01 to 2024-01-31",
    "opening_balance": 25000.00,
    "closing_balance": 40000.00,
    "total_sales": 215000.00,
    "total_payments": 200000.00,
    "transactions": [
        {
            "date": "2024-01-15",
            "type": "sale",
            "reference": "INV-2024-001",
            "amount": 107500.00,
            "description": "Product sales",
            "status": "paid",
            "running_balance": 132500.00
        },
        {
            "date": "2024-01-20",
            "type": "payment",
            "reference": "PAY-C001",
            "amount": 107500.00,
            "description": "Payment received",
            "status": "completed",
            "running_balance": 25000.00
        }
    ]
}
```

### 4. Get Outstanding Balance
- **Endpoint:** `GET /api/customer-reports.php?customer_id=1&report_type=outstanding-balance`
- **Description:** Get customer's outstanding invoices and aging

**Success Response (200):**
```json
{
    "success": true,
    "customer_id": 1,
    "outstanding_invoices": [
        {
            "id": 3,
            "invoice_number": "INV-2024-003",
            "sale_date": "2024-01-25",
            "total_amount": 50000.00,
            "amount_paid": 35000.00,
            "balance_due": 15000.00,
            "days_overdue": 45
        }
    ],
    "total_outstanding": 15000.00,
    "overdue_amount": 15000.00,
    "current_amount": 0.00,
    "invoice_count": 1
}
```

### 5. Get Comprehensive Customer Report
- **Endpoint:** `POST /api/customer-reports.php`
- **Action:** `comprehensive_report`
- **Description:** Get complete customer report with all data

**Request Body:**
```json
{
    "customer_id": 1,
    "action": "comprehensive_report"
}
```

**Success Response (200):**
```json
{
    "success": true,
    "data": {
        "sales": [
            {
                "id": 1,
                "reference": "INV-2024-001",
                "date": "2024-01-15",
                "total_amount": 107500.00,
                "paid_amount": 107500.00,
                "status": "paid",
                "outstanding": 0.00
            }
        ],
        "payments": [
            {
                "id": 1,
                "reference": "PAY-C001",
                "payment_date": "2024-01-20",
                "amount": 107500.00,
                "method": "bank_transfer",
                "status": "completed"
            }
        ],
        "totals": {
            "total_sales": 215000.00,
            "total_payments": 200000.00,
            "outstanding_balance": 15000.00
        }
    }
}
```

---

## 📝 Complaint Submission API (`/api/submit-complaint.php`)

### 1. Submit Customer Complaint
- **Endpoint:** `POST /api/submit-complaint.php`
- **Content-Type:** `multipart/form-data`
- **Description:** Submit customer feedback or complaint with file attachments
- **Authentication:** Not required (public endpoint)

**Form Data:**
```
name: "John Customer"
email: "john@customer.com"
phone: "+1234567890" (optional)
subject: "Billing Issue"
message: "I have an issue with my latest invoice..."
category: "billing" (bug|feature_request|billing|technical|general)
priority: "medium" (low|medium|high|urgent)
attachments[]: [files] (optional, max 10MB each)
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Your feedback has been submitted successfully",
    "complaint_id": 12345,
    "uploaded_files": 2
}
```

**Error Response (400):**
```json
{
    "success": false,
    "message": "Missing required fields: name, email, subject"
}
```

**Validation Rules:**
- **Required Fields:** name, email, subject, message, category
- **File Types:** JPG, PNG, GIF, PDF, DOC, DOCX, TXT, ZIP, RAR
- **File Size:** Maximum 10MB per file
- **Email:** Must be valid email format
- **Categories:** bug, feature_request, billing, technical, general
- **Priorities:** low, medium, high, urgent

---

## 💬 Chat System API (`/api/chat.php`)

**Note:** Chat features require Starter plan or higher subscription.

### 1. Get Company Users
- **Endpoint:** `GET /api/chat.php?action=get_users`
- **Description:** Get list of users in company for chat (excluding current user)
- **Authentication:** Required
- **Subscription:** Starter+ required

**Success Response (200):**
```json
{
    "success": true,
    "users": [
        {
            "id": 2,
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane@company.com",
            "role": "manager",
            "avatar": "uploads/avatars/user_2.jpg",
            "is_online": 1,
            "last_seen": "2024-01-15 14:30:00"
        },
        {
            "id": 3,
            "first_name": "Bob",
            "last_name": "Johnson",
            "email": "bob@company.com",
            "role": "user",
            "avatar": null,
            "is_online": 0,
            "last_seen": "2024-01-15 12:15:00"
        }
    ]
}
```

### 2. Get Conversations
- **Endpoint:** `GET /api/chat.php?action=get_conversations`
- **Description:** Get list of chat conversations for current user
- **Authentication:** Required
- **Subscription:** Starter+ required

**Success Response (200):**
```json
{
    "success": true,
    "conversations": [
        {
            "user_id": 2,
            "user_name": "Jane Smith",
            "user_email": "jane@company.com",
            "last_message": "Thanks for the update!",
            "last_message_time": "2024-01-15 14:30:00",
            "unread_count": 0,
            "is_online": 1
        },
        {
            "user_id": 3,
            "user_name": "Bob Johnson",
            "user_email": "bob@company.com",
            "last_message": "Can we discuss the project?",
            "last_message_time": "2024-01-15 12:15:00",
            "unread_count": 2,
            "is_online": 0
        }
    ]
}
```

### 3. Get Messages
- **Endpoint:** `GET /api/chat.php?action=get_messages&user_id=2&page=1`
- **Description:** Get chat messages with specific user
- **Authentication:** Required
- **Subscription:** Starter+ required

**Success Response (200):**
```json
{
    "success": true,
    "messages": [
        {
            "id": 1,
            "sender_id": 1,
            "receiver_id": 2,
            "message": "Hi Jane, how's the project going?",
            "created_at": "2024-01-15 14:00:00",
            "is_read": 1,
            "sender_name": "John Doe"
        },
        {
            "id": 2,
            "sender_id": 2,
            "receiver_id": 1,
            "message": "Going well! Just finished the reports.",
            "created_at": "2024-01-15 14:15:00",
            "is_read": 1,
            "sender_name": "Jane Smith"
        },
        {
            "id": 3,
            "sender_id": 2,
            "receiver_id": 1,
            "message": "Thanks for the update!",
            "created_at": "2024-01-15 14:30:00",
            "is_read": 1,
            "sender_name": "Jane Smith"
        }
    ]
}
```

### 4. Get New Messages
- **Endpoint:** `GET /api/chat.php?action=get_new_messages&user_id=2&since_id=10`
- **Description:** Get new messages since last message ID (for real-time updates)
- **Authentication:** Required
- **Subscription:** Starter+ required

**Success Response (200):**
```json
{
    "success": true,
    "messages": [
        {
            "id": 11,
            "sender_id": 2,
            "receiver_id": 1,
            "message": "Just sent you the files!",
            "created_at": "2024-01-15 15:00:00",
            "is_read": 0,
            "sender_name": "Jane Smith"
        }
    ]
}
```

### 5. Send Message
- **Endpoint:** `POST /api/chat.php`
- **Action:** `send_message`
- **Description:** Send a chat message to another user
- **Authentication:** Required
- **Subscription:** Starter+ required

**Request Body:**
```json
{
    "action": "send_message",
    "receiver_id": 2,
    "message": "Hi Jane, can we schedule a meeting for tomorrow?"
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message_id": 15
}
```

### 6. Mark Messages as Read
- **Endpoint:** `POST /api/chat.php`
- **Action:** `mark_read`
- **Description:** Mark all messages from specific sender as read
- **Authentication:** Required
- **Subscription:** Starter+ required

**Request Body:**
```json
{
    "action": "mark_read",
    "sender_id": 2
}
```

**Success Response (200):**
```json
{
    "success": true
}
```

### 7. Update Online Status
- **Endpoint:** `POST /api/chat.php`
- **Action:** `update_online_status`
- **Description:** Update user's online status
- **Authentication:** Required
- **Subscription:** Starter+ required

**Request Body:**
```json
{
    "action": "update_online_status",
    "is_online": true
}
```

**Success Response (200):**
```json
{
    "success": true
}
```

### Chat Subscription Error Response:
```json
{
    "success": false,
    "error": "Chat feature requires Starter plan or higher. Please upgrade your subscription.",
    "upgrade_required": true,
    "current_plan": "free",
    "silent": true
}
```

---

## 📋 Additional Response Patterns

### File Upload Response:
```json
{
    "success": true,
    "message": "Files uploaded successfully",
    "uploaded_files": [
        {
            "original_name": "invoice.pdf",
            "file_path": "uploads/complaints/complaint_123_abc123.pdf",
            "file_size": 1024000,
            "mime_type": "application/pdf"
        }
    ]
}
```

### Pagination Response (Reports):
```json
{
    "success": true,
    "data": [],
    "pagination": {
        "current_page": 1,
        "total_pages": 5,
        "total_items": 47,
        "per_page": 10,
        "has_next": true,
        "has_prev": false
    }
}
```

### Subscription Access Control:
```json
{
    "success": false,
    "error": "This feature requires Professional plan or higher",
    "upgrade_required": true,
    "current_plan": "starter",
    "required_plan": "professional"
}
```

---

## 🔧 Integration Guidelines

### Real-time Chat Implementation:
1. **Polling Method:** Use `get_new_messages` endpoint every 2-3 seconds for active conversations
2. **Online Status:** Update online status on page load and before page unload
3. **Message Reading:** Auto-mark messages as read when conversation is viewed
4. **Subscription Check:** Handle subscription upgrade prompts gracefully

### File Upload Best Practices:
1. **Size Limits:** Enforce 10MB limit on frontend before upload
2. **Type Validation:** Check file types on frontend for better UX
3. **Progress Indicators:** Show upload progress for large files
4. **Error Handling:** Provide clear error messages for failed uploads

### Report Generation:
1. **Date Ranges:** Always provide default date ranges (current month)
2. **Caching:** Consider caching large reports for better performance
3. **Export Options:** Implement CSV/PDF export for business reports
4. **Real-time Updates:** Refresh report data when underlying data changes

---

*Last updated: November 2024*