# 🚀 FirmaFlow Production Deployment Guide

This guide explains how to deploy FirmaFlow to a production server.

## 📋 Prerequisites

- Web server (Apache/Nginx) with PHP 8.0+
- MySQL/MariaDB database
- Domain name with SSL certificate
- SMTP email service

## 🔧 Deployment Steps

### 1. **Prepare Production Environment**

```bash
# On your production server
mkdir /var/www/firmaflowledger.com
cd /var/www/firmaflowledger.com
```

### 2. **Upload Files**

Upload your built application files to the server:
- All files from the `public/` directory (created by build script)
- Or manually upload: `api/`, `includes/`, `config/`, `vendor/`, and React build files

### 3. **Database Setup**

```sql
-- Create production database
CREATE DATABASE ledgerly_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create database user
CREATE USER 'firmaflow_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON ledgerly_production.* TO 'firmaflow_user'@'localhost';
FLUSH PRIVILEGES;

-- Import the database schema
mysql -u firmaflow_user -p ledgerly_production < database/firmaflow_complete_production.sql
```

### 4. **Environment Configuration**

Update `.env` file with production values:

```env
# Production Database
DB_HOST=localhost
DB_NAME=ledgerly_production
DB_USER=firmaflow_user
DB_PASS=your_secure_password

# Production URLs
APP_URL=https://firmaflowledger.com
API_BASE_URL=https://firmaflowledger.com/api

# Email (Production SMTP)
EMAIL_HOST=smtp.your-email-provider.com
EMAIL_USERNAME=noreply@firmaflowledger.com
EMAIL_PASSWORD=your_secure_email_password

# Security
DEBUG_MODE=false
EMAIL_DEBUG=false
```

### 5. **Web Server Configuration**

#### **Apache (.htaccess)**

Create `/var/www/firmaflowledger.com/.htaccess`:

```apache
# Enable mod_rewrite
RewriteEngine On

# API routes - serve PHP files
RewriteRule ^api/(.+)$ api/$1 [L]

# Frontend routes - serve index.html for SPA
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule . /index.html [L]

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
</IfModule>

# PHP settings
<IfModule mod_php8.c>
    php_value upload_max_filesize 10M
    php_value post_max_size 10M
    php_value max_execution_time 300
    php_value memory_limit 256M
</IfModule>
```

#### **Nginx Configuration**

```nginx
server {
    listen 443 ssl http2;
    server_name firmaflowledger.com www.firmaflowledger.com;
    root /var/www/firmaflowledger.com;
    index index.html index.php;

    # SSL configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # API routes
    location /api/ {
        try_files $uri $uri/ /api/index.php$is_args$args;
        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            include fastcgi_params;
        }
    }

    # Frontend SPA routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

### 6. **File Permissions**

```bash
# Set proper permissions
chown -R www-data:www-data /var/www/firmaflowledger.com
chmod -R 755 /var/www/firmaflowledger.com
chmod 600 /var/www/firmaflowledger.com/.env
```

### 7. **SSL Certificate**

Install SSL certificate (Let's Encrypt example):

```bash
sudo certbot --apache -d firmaflowledger.com -d www.firmaflowledger.com
```

## 🔍 Communication Flow in Production

### **Frontend ↔ Backend Communication**

1. **Same Origin**: Frontend and backend served from same domain
   - Frontend: `https://firmaflowledger.com/`
   - Backend API: `https://firmaflowledger.com/api/`
   - No CORS issues (same origin)

2. **API Calls**: Frontend makes requests to `/api/*`
   - Login: `POST /api/auth.php`
   - Signup: `POST /api/auth.php`
   - Data: `GET /api/customers.php`

3. **Session Management**: PHP sessions work seamlessly
   - Cookies automatically sent with requests
   - No cross-origin credential issues

### **Database Communication**

- PHP backend connects to MySQL database
- Database runs on same server or dedicated database server
- Connection via `includes/db.php` using production credentials

### **Email Communication**

- PHP sends emails via SMTP
- Uses production email service (e.g., SendGrid, Mailgun, or your hosting provider)
- No localhost limitations

## ✅ Testing Production Setup

1. **Database Connection**:
   ```bash
   php -r "require 'includes/db.php'; echo 'DB Connected: ' . ($pdo ? 'YES' : 'NO') . PHP_EOL;"
   ```

2. **API Endpoints**:
   ```bash
   curl -X POST https://firmaflowledger.com/api/auth.php \
        -H "Content-Type: application/json" \
        -d '{"action":"check"}'
   ```

3. **Frontend**:
   - Visit `https://firmaflowledger.com`
   - Test login/signup functionality

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` to version control
2. **Database**: Use strong passwords and restricted user privileges
3. **HTTPS**: Always use SSL in production
4. **File Permissions**: Restrict access to sensitive files
5. **Regular Updates**: Keep PHP, MySQL, and server software updated

## 🚀 Deployment Automation

Consider using deployment tools like:
- **GitHub Actions** for CI/CD
- **Deployer** for PHP applications
- **Docker** for containerized deployment
- **CloudFlare** for CDN and security

---

## 📞 Support

If you encounter issues during deployment, check:
1. Server error logs (`/var/log/apache2/error.log`)
2. PHP error logs
3. Database connection settings
4. File permissions
5. SSL certificate validity