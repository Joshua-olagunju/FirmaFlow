<?php
/**
 * Email Configuration for Local Development
 * This file is safe for version control and team sharing
 * Contains development email credentials that frontend team can use
 */

// SMTP Configuration for Development
define('EMAIL_HOST', 'mail.firmaflowledger.com');
define('EMAIL_PORT', 587); // STARTTLS
define('EMAIL_USERNAME', 'test@firmaflowledger.com');
define('EMAIL_PASSWORD', 'Firmaflow123');  // Development email - safe to share with team
define('EMAIL_FROM_ADDRESS', 'test@firmaflowledger.com');
define('EMAIL_FROM_NAME', 'FirmaFlow Ledger - Development');
define('EMAIL_ENCRYPTION', 'tls');

// Email Templates
define('EMAIL_REPLY_TO', 'test@firmaflowledger.com');
define('EMAIL_SUPPORT', 'test@firmaflowledger.com');

// Local Development URLs
define('APP_URL', 'http://localhost/firmaflow-React/FirmaFlow');
define('LOGIN_URL', APP_URL . '/public/index.php');
define('DASHBOARD_URL', APP_URL . '/public/dashboard.php');

// Development Settings
define('EMAIL_DEBUG', true);     // Enable debugging for development
define('EMAIL_LOG_ENABLED', true); // Log email attempts

/**
 * DEVELOPMENT NOTES:
 * - This email account is specifically for development/testing
 * - Safe to share with all frontend team members
 * - All developers can use same credentials for local testing
 * - For production, create separate config with production credentials
 */
?>