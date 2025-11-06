# FirmaFlow - Frontend Development Setup Guide

## 🚀 Quick Start for Frontend Developers

### Prerequisites
- XAMPP (with Apache & MySQL)
- Git
- Code editor (VS Code recommended)

### 1. XAMPP Setup
```bash
1. Download and install XAMPP
2. Start Apache and MySQL services
3. Open phpMyAdmin: http://localhost/phpmyadmin
4. Create database: 'ledgerly'
```

### 2. Project Setup
```bash
# Clone the project
git clone [repository-url]

# Navigate to XAMPP htdocs
cd C:\xampp\htdocs\

# Copy project to correct location
# Project should be at: C:\xampp\htdocs\firmaflow-React\FirmaFlow\
```

### 3. Database Setup
```sql
-- In phpMyAdmin, run this SQL:
CREATE DATABASE ledgerly CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Then import the schema file:
-- Go to: Import -> Choose file -> database/firmaflow_complete_schema_v2.sql
```

### 4. Configuration Files
The project includes development-ready configuration files:
- `config/email_config_dev.php` - Email settings (ready to use)
- `includes/db_dev.php` - Database connection (ready to use)  
- `.env.dev` - Environment variables (ready to use)

### 5. API Testing
Test the API endpoints at:
```
http://localhost/firmaflow-React/FirmaFlow/api/auth.php
http://localhost/firmaflow-React/FirmaFlow/api/customers.php
http://localhost/firmaflow-React/FirmaFlow/api/products.php
```

### 6. Available API Endpoints

#### Authentication
- `POST /api/auth.php?action=signup` - User registration
- `POST /api/auth.php?action=login` - User login
- `POST /api/auth.php?action=verify_otp` - Email verification

#### Business Data
- `GET /api/customers.php` - Get customers
- `POST /api/customers.php` - Create customer
- `GET /api/products.php` - Get products
- `POST /api/products.php` - Create product
- `GET /api/sales.php` - Get sales data
- `POST /api/sales.php` - Create sale

#### Financial
- `GET /api/financial_reports.php` - Financial reports
- `GET /api/dashboard_stats.php` - Dashboard statistics

### 7. Development Credentials

#### Email Testing (All developers can use these)
- **Host:** mail.firmaflowledger.com
- **Username:** test@firmaflowledger.com
- **Password:** Firmaflow123
- **Port:** 587 (TLS)

#### Database (XAMPP Default)
- **Host:** localhost
- **Database:** ledgerly
- **Username:** root
- **Password:** (empty)

#### Payment Testing (Sandbox)
- Uses Flutterwave sandbox environment
- No real payments processed in development

### 8. CORS Headers
All API endpoints include CORS headers for React frontend:
```php
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### 9. Error Debugging
- PHP errors logged in XAMPP logs
- API returns JSON error responses
- Email debug mode enabled in development

### 10. Common Issues & Solutions

**Database Connection Failed:**
- Check XAMPP MySQL is running
- Verify database name is 'ledgerly'
- Check the database exists in phpMyAdmin

**CORS Errors:**
- Ensure you're accessing via http://localhost (not file://)
- Check browser developer console for specific errors

**Email Not Sending:**
- Check XAMPP has internet connection
- Verify email credentials in config/email_config_dev.php

### 11. File Structure for Frontend
```
FirmaFlow/
├── api/                    # API endpoints (your backend)
│   ├── auth.php           # Authentication API
│   ├── customers.php      # Customer management
│   ├── products.php       # Product management
│   └── ...
├── config/                # Configuration files
│   └── email_config_dev.php
├── includes/              # Shared PHP files
│   └── db_dev.php
└── database/              # SQL schema files
    └── firmaflow_complete_schema_v2.sql
```

### 12. Next Steps
1. Set up your React frontend project
2. Configure axios/fetch to call the API endpoints
3. Test authentication flow first
4. Implement CRUD operations for customers, products, etc.

---

**Need Help?** 
Check the API documentation or test endpoints using the provided HTML test files.