<?php
/**
 * Email Configuration Template for FirmaFlow
 * Copy this file to email_config.php and update with your credentials
 * DO NOT commit the actual email_config.php file to version control
 */

// SMTP Configuration
define('EMAIL_HOST', 'your.smtp.server.com');
define('EMAIL_PORT', 587); // STARTTLS
define('EMAIL_USERNAME', 'your-email@yourdomain.com');
define('EMAIL_PASSWORD', 'your-email-password-here');
define('EMAIL_FROM_ADDRESS', 'your-email@yourdomain.com');
define('EMAIL_FROM_NAME', 'Your App Name');
define('EMAIL_ENCRYPTION', 'tls'); // Use 'ssl' for port 465, 'tls' for port 587

// Email Templates
define('EMAIL_REPLY_TO', 'your-email@yourdomain.com');
define('EMAIL_SUPPORT', 'support@yourdomain.com');

// Application URLs (update these to match your hosting)
define('APP_URL', 'https://yourdomain.com'); // Update this to your actual domain
define('LOGIN_URL', APP_URL . '/public/index.php');
define('DASHBOARD_URL', APP_URL . '/public/dashboard.php');
?>