<?php
/**
 * Email Configuration for Local Development
 * Safe for version control - contains only development/testing settings
 */

// SMTP Configuration for Local Development
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

// Development Mode Flag
define('EMAIL_DEBUG', true);                        // Enable email debugging
define('EMAIL_LOG_ENABLED', true);                  // Log all email attempts

/**
 * DEVELOPMENT NOTES:
 * 
 * ✅ This email account is specifically created for development/testing
 * ✅ Safe to share with frontend team members
 * ✅ All team members can use the same credentials for local testing
 * ✅ Email debugging enabled for troubleshooting
 * 
 * Frontend developers can use this to test:
 * - User registration emails
 * - Password reset emails  
 * - Payment confirmation emails
 * - OTP verification emails
 * 
 * For production deployment, create a separate email_config.php 
 * with production credentials that should NOT be committed to git.
 */
?>