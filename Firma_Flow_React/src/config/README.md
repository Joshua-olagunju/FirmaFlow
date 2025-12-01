# API Configuration

This folder contains centralized API configuration for the FirmaFlow React application.

## Usage

### Basic Import

```javascript
import { buildApiUrl } from "../config/api.config";

// Build API endpoint
const authEndpoint = buildApiUrl("api/auth.php");

// Use in fetch
const response = await fetch(authEndpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "login", email, password }),
});
```

### Available Helpers

```javascript
import { API_BASE_URL, buildApiUrl } from "../config/api.config";

// Direct base URL access
console.log(API_BASE_URL); // http://localhost/FirmaFlow

// Build any API path
const customersUrl = buildApiUrl("api/customers.php");
const productsUrl = buildApiUrl("api/products.php");
const reportsUrl = buildApiUrl("api/reports.php");
```

### Common Endpoints Examples

```javascript
import { buildApiUrl } from "../config/api.config";

// Authentication
buildApiUrl("api/auth.php");

// User management
buildApiUrl("api/users.php");

// Customers
buildApiUrl("api/customers.php");

// Products
buildApiUrl("api/products.php");

// Sales
buildApiUrl("api/sales.php");

// Reports
buildApiUrl("api/reports.php");
```

## Environment Configuration

The API base URL is read from the `.env` file:

```env
VITE_API_BASE="http://localhost/FirmaFlow"
```

### For Production

Update your production `.env` file:

```env
VITE_API_BASE="https://your-production-domain.com"
```

### Important Notes

⚠️ **After changing `.env` file, you MUST restart the dev server:**

```bash
# Stop the server (Ctrl+C) then restart
npm run dev
```

## Benefits

✅ **Simple & Clean** - Only base URL stored, paths added when needed  
✅ **Centralized Management** - Change the API URL in one place  
✅ **Environment Aware** - Automatically uses the correct URL based on `.env`  
✅ **Flexible** - Build any endpoint path on the fly  
✅ **No Hardcoding** - Eliminates scattered URL strings in components
