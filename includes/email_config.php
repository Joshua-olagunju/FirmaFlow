<?php
/**
 * Email Configuration for FirmaFlow
 * Configure your hosting email settings here
 */

// Email Configuration - Production Server Settings
define('EMAIL_HOST', 'mail.firmaflowledger.com');
define('EMAIL_PORT', 587);
define('EMAIL_USERNAME', 'test@firmaflowledger.com');
define('EMAIL_PASSWORD', 'Firmaflow123');
define('EMAIL_ENCRYPTION', 'tls');
                  // TLS encryption for port 587

// Alternative ports for fallback (if main port fails)
// define('EMAIL_PORT', 465);                            // Alternative SSL port
// define('EMAIL_ENCRYPTION', 'ssl');                    // SSL encryption

// Legacy SMTP constants for backward compatibility
define('SMTP_HOST', 'mail.firmaflowledger.com');        // Production server
define('SMTP_PORT', 587);                               // Updated SMTP port  
define('SMTP_USERNAME', 'test@firmaflowledger.com');    // Full email address as username
define('SMTP_PASSWORD', 'Firmaflow123');                // Updated email password
define('SMTP_ENCRYPTION', 'tls');                       // TLS encryption for production
// Email Addresses
define('EMAIL_FROM_ADDRESS', 'test@firmaflowledger.com');    // From email address
define('EMAIL_FROM_NAME', 'Firmaflow Ledger');               // From name
define('EMAIL_REPLY_TO', 'test@firmaflowledger.com');        // Reply-to address
define('SMTP_FROM_EMAIL', 'test@firmaflowledger.com');       // Legacy compatibility
define('SMTP_FROM_NAME', 'Firmaflow Ledger');                // Legacy compatibility
define('SUPPORT_EMAIL', 'test@firmaflowledger.com');         // Support email
define('ADMIN_EMAIL', 'test@firmaflowledger.com');           // Admin email

// IMAP Configuration (for reading emails if needed) - Production Server
define('IMAP_HOST', 'mail.firmaflowledger.com');
define('IMAP_PORT', 993);
define('IMAP_USERNAME', 'test@firmaflowledger.com');     // Full email address
define('IMAP_PASSWORD', 'Firmaflow123');                 // Updated email password
define('IMAP_ENCRYPTION', 'ssl');

// POP3 Configuration (alternative to IMAP) - Production Server
define('POP3_HOST', 'mail.firmaflowledger.com');
define('POP3_PORT', 995);
define('POP3_USERNAME', 'test@firmaflowledger.com');     // Full email address
define('POP3_PASSWORD', 'Firmaflow123');                 // Updated email password
define('POP3_ENCRYPTION', 'ssl');

// Email Settings
define('EMAIL_ENABLED', true);                      // Set to false to disable emails
define('EMAIL_DEBUG', true);                        // Set to true for debugging

// Email Templates Directory
define('EMAIL_TEMPLATES_DIR', __DIR__ . '/email_templates/');

// Alternative Email Services (Optional - for fallback)
// Uncomment and configure these if you want to use SendGrid or Mailgun as backup
// define('SENDGRID_API_KEY', 'your_sendgrid_api_key_here');
// define('MAILGUN_API_KEY', 'your_mailgun_api_key_here');  
// define('MAILGUN_DOMAIN', 'your_mailgun_domain_here');

/**
 * Email Configuration Details - Production Server
 * 
 * ✅ CONFIGURED - Production Email Server (mail.firmaflowledger.com)
 * 
 * OUTGOING (SMTP):
 *    Server: mail.firmaflowledger.com
 *    Port: 587 (TLS - PRODUCTION)
 *    Username: test@firmaflowledger.com (full email address)
 *    Password: Firmaflow123 (CONFIGURED)
 *    Encryption: TLS
 *    Authentication: Required
 * 
 * INCOMING (IMAP):
 *    Server: mail.firmaflowledger.com
 *    Port: 993 (SSL/TLS)
 *    Username: test@firmaflowledger.com (full email address)
 *    Password: Firmaflow123 (CONFIGURED)
 *    Encryption: SSL/TLS
 * 
 * INCOMING (POP3):
 *    Server: mail.firmaflowledger.com
 *    Port: 995 (SSL/TLS)
 *    Username: test@firmaflowledger.com (full email address)
 *    Password: Firmaflow123 (CONFIGURED)
 *    Encryption: SSL/TLS
 * 
 * WEBMAIL ACCESS:
 *    URL: https://mail.firmaflowledger.com
 *    Login: test@firmaflowledger.com
 *    Password: Firmaflow123
 * 
 * CALENDAR ACCESS (CalDAV):
 *    URL: https://mail.firmaflowledger.com/calendars/test@firmaflowledger.com/calendar
 * 
 * CONTACTS ACCESS (CardDAV):
 *    URL: https://mail.firmaflowledger.com/addressbooks/test@firmaflowledger.com/addressbook
 * 
 * IMPORTANT NOTES:
 * - Production server using TLS on port 587
 * - Always use FULL email address as username
 * - Email account already exists and configured
 * 
 * Usage Examples:
 * - Registration welcome emails
 * - Payment confirmations
 * - Subscription notifications
 * - Password reset emails
 * - Customer support communications
 */
