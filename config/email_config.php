<?php
/**
 * Email Configuration for FirmaFlow
 * Using noreply@firmaflowledger.com SMTP settings
 */

// SMTP Configuration
define('EMAIL_HOST', 'mail.firmaflowledger.com');
define('EMAIL_PORT', 587); // STARTTLS
define('EMAIL_USERNAME', 'test@firmaflowledger.com');
define('EMAIL_PASSWORD', 'Firmaflow123');
define('EMAIL_FROM_ADDRESS', 'test@firmaflowledger.com');
define('EMAIL_FROM_NAME', 'FirmaFlow Ledger');
define('EMAIL_ENCRYPTION', 'tls'); // Use 'ssl' for port 465, 'tls' for port 587

// Email Templates
define('EMAIL_REPLY_TO', 'test@firmaflowledger.com');
define('EMAIL_SUPPORT', 'test@firmaflowledger.com');

// Application URLs (update these to match your hosting)
define('APP_URL', 'https://firmaflowledger.com'); // Update this to your actual domain
define('LOGIN_URL', APP_URL . '/public/index.php');
define('DASHBOARD_URL', APP_URL . '/public/dashboard.php');
?>