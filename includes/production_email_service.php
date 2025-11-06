<?php
/**
 * Production Email Service for FirmaFlow
 * Provides multiple email sending methods with fallbacks
 * Designed to work in production environments with various hosting providers
 */

require_once __DIR__ . '/email_config.php';

class ProductionEmailService {
    
    /**
     * Send Welcome Email with Multiple Fallback Methods
     */
    public static function sendWelcomeEmail($userEmail, $userName, $companyName = '') {
        $subject = "Welcome to FirmaFlow - Your Business Management Journey Starts Here!";
        $htmlBody = self::getWelcomeEmailTemplate($userName, $companyName);
        $textBody = self::getWelcomeEmailText($userName, $companyName);
        
        return self::sendEmailWithFallbacks($userEmail, $subject, $htmlBody, $textBody);
    }
    
    /**
     * Send Payment Confirmation Email
     */
    public static function sendPaymentConfirmation($userEmail, $userName, $planName, $amount, $transactionId) {
        $subject = "Payment Confirmed - Welcome to FirmaFlow $planName!";
        $htmlBody = self::getPaymentConfirmationTemplate($userName, $planName, $amount, $transactionId);
        $textBody = self::getPaymentConfirmationText($userName, $planName, $amount, $transactionId);
        
        return self::sendEmailWithFallbacks($userEmail, $subject, $htmlBody, $textBody);
    }
    
    /**
     * Core Email Sending with Multiple Fallbacks
     */
    private static function sendEmailWithFallbacks($to, $subject, $htmlBody, $textBody = '') {
        // Skip email sending on localhost/development
        if (self::isLocalhost()) {
            error_log("Development Environment: Skipping email to $to with subject: $subject");
            return true;
        }
        
        // Validate email
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            error_log("Invalid email address: $to");
            return false;
        }
        
        $methods = [
            'smtp_ssl_2080' => 'Try SMTP with SSL on port 2080 (Primary)',
            'smtp_tls_587' => 'Try SMTP with TLS on port 587 (Fallback)',
            'smtp_ssl_465' => 'Try SMTP with SSL on port 465 (Fallback)', 
            'sendgrid_api' => 'Try SendGrid API (if configured)',
            'mailgun_api' => 'Try Mailgun API (if configured)',
            'php_mail' => 'Try PHP mail() function'
        ];
        
        foreach ($methods as $method => $description) {
            try {
                error_log("Attempting email send via: $description");
                
                $result = false;
                switch ($method) {
                    case 'smtp_ssl_2080':
                        $result = self::sendViaSMTP($to, $subject, $htmlBody, $textBody, 2080, 'ssl');
                        break;
                    case 'smtp_tls_587':
                        $result = self::sendViaSMTP($to, $subject, $htmlBody, $textBody, 587, 'tls');
                        break;
                    case 'smtp_ssl_465':
                        $result = self::sendViaSMTP($to, $subject, $htmlBody, $textBody, 465, 'ssl');
                        break;
                    case 'sendgrid_api':
                        $result = self::sendViaSendGrid($to, $subject, $htmlBody, $textBody);
                        break;
                    case 'mailgun_api':
                        $result = self::sendViaMailgun($to, $subject, $htmlBody, $textBody);
                        break;
                    case 'php_mail':
                        $result = self::sendViaPHPMail($to, $subject, $htmlBody, $textBody);
                        break;
                }
                
                if ($result) {
                    error_log("Email sent successfully via: $description to $to");
                    return true;
                }
                
            } catch (Exception $e) {
                error_log("Email method '$method' failed: " . $e->getMessage());
                continue;
            }
        }
        
        error_log("All email methods failed for: $to");
        return false;
    }
    
    /**
     * SMTP Email Sending
     */
    private static function sendViaSMTP($to, $subject, $htmlBody, $textBody, $port, $encryption) {
        // Manual SMTP implementation
        $smtp_host = EMAIL_HOST;
        $smtp_user = EMAIL_USERNAME;
        $smtp_pass = EMAIL_PASSWORD;
        
        // Skip if password is not set
        if ($smtp_pass === 'your_email_password_here' || empty($smtp_pass)) {
            throw new Exception("SMTP password not configured");
        }
        
        // Create socket connection
        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ]
        ]);
        
        if ($encryption === 'ssl') {
            $socket = @stream_socket_client("ssl://$smtp_host:$port", $errno, $errstr, 30, STREAM_CLIENT_CONNECT, $context);
        } else {
            $socket = @stream_socket_client("$smtp_host:$port", $errno, $errstr, 30, STREAM_CLIENT_CONNECT, $context);
        }
        
        if (!$socket) {
            throw new Exception("Could not connect to SMTP server: $errstr ($errno)");
        }
        
        // SMTP conversation
        $response = fgets($socket, 512);
        if (substr($response, 0, 3) !== '220') {
            fclose($socket);
            throw new Exception("SMTP connection failed: $response");
        }
        
        // EHLO
        fwrite($socket, "EHLO " . $_SERVER['SERVER_NAME'] . "\r\n");
        $response = '';
        do {
            $line = fgets($socket, 512);
            $response .= $line;
        } while (substr($line, 3, 1) === '-');
        
        // STARTTLS for port 587
        if ($encryption === 'tls' && $port == 587) {
            fwrite($socket, "STARTTLS\r\n");
            $response = fgets($socket, 512);
            if (substr($response, 0, 3) !== '220') {
                fclose($socket);
                throw new Exception("STARTTLS failed: $response");
            }
            
            // Enable crypto
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                fclose($socket);
                throw new Exception("Failed to enable TLS encryption");
            }
            
            // EHLO again after STARTTLS
            fwrite($socket, "EHLO " . $_SERVER['SERVER_NAME'] . "\r\n");
            $response = '';
            do {
                $line = fgets($socket, 512);
                $response .= $line;
            } while (substr($line, 3, 1) === '-');
        }
        
        // AUTH LOGIN
        fwrite($socket, "AUTH LOGIN\r\n");
        $response = fgets($socket, 512);
        if (substr($response, 0, 3) !== '334') {
            fclose($socket);
            throw new Exception("AUTH LOGIN failed: $response");
        }
        
        // Username
        fwrite($socket, base64_encode($smtp_user) . "\r\n");
        $response = fgets($socket, 512);
        if (substr($response, 0, 3) !== '334') {
            fclose($socket);
            throw new Exception("Username authentication failed: $response");
        }
        
        // Password
        fwrite($socket, base64_encode($smtp_pass) . "\r\n");
        $response = fgets($socket, 512);
        if (substr($response, 0, 3) !== '235') {
            fclose($socket);
            throw new Exception("Password authentication failed: $response");
        }
        
        // MAIL FROM
        fwrite($socket, "MAIL FROM: <" . EMAIL_FROM_ADDRESS . ">\r\n");
        $response = fgets($socket, 512);
        if (substr($response, 0, 3) !== '250') {
            fclose($socket);
            throw new Exception("MAIL FROM failed: $response");
        }
        
        // RCPT TO
        fwrite($socket, "RCPT TO: <$to>\r\n");
        $response = fgets($socket, 512);
        if (substr($response, 0, 3) !== '250') {
            fclose($socket);
            throw new Exception("RCPT TO failed: $response");
        }
        
        // DATA
        fwrite($socket, "DATA\r\n");
        $response = fgets($socket, 512);
        if (substr($response, 0, 3) !== '354') {
            fclose($socket);
            throw new Exception("DATA command failed: $response");
        }
        
        // Email headers and body
        $email_data = "From: " . EMAIL_FROM_NAME . " <" . EMAIL_FROM_ADDRESS . ">\r\n";
        $email_data .= "To: $to\r\n";
        $email_data .= "Subject: $subject\r\n";
        $email_data .= "MIME-Version: 1.0\r\n";
        $email_data .= "Content-Type: text/html; charset=UTF-8\r\n";
        $email_data .= "X-Mailer: FirmaFlow Email System\r\n";
        $email_data .= "\r\n";
        $email_data .= $htmlBody;
        $email_data .= "\r\n.\r\n";
        
        fwrite($socket, $email_data);
        $response = fgets($socket, 512);
        
        // QUIT
        fwrite($socket, "QUIT\r\n");
        fclose($socket);
        
        if (substr($response, 0, 3) !== '250') {
            throw new Exception("Email sending failed: $response");
        }
        
        return true;
    }
    
    /**
     * SendGrid API Email Sending
     */
    private static function sendViaSendGrid($to, $subject, $htmlBody, $textBody) {
        // Check if SendGrid API key is configured
        if (!defined('SENDGRID_API_KEY') || empty(constant('SENDGRID_API_KEY'))) {
            throw new Exception("SendGrid API key not configured");
        }
        
        $data = [
            'personalizations' => [[
                'to' => [['email' => $to]]
            ]],
            'from' => ['email' => EMAIL_FROM_ADDRESS, 'name' => EMAIL_FROM_NAME],
            'subject' => $subject,
            'content' => [
                ['type' => 'text/html', 'value' => $htmlBody],
                ['type' => 'text/plain', 'value' => $textBody]
            ]
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://api.sendgrid.com/v3/mail/send');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . constant('SENDGRID_API_KEY'),
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 202) {
            throw new Exception("SendGrid API failed with code $httpCode: $response");
        }
        
        return true;
    }
    
    /**
     * Mailgun API Email Sending  
     */
    private static function sendViaMailgun($to, $subject, $htmlBody, $textBody) {
        // Check if Mailgun is configured
        if (!defined('MAILGUN_API_KEY') || !defined('MAILGUN_DOMAIN') || empty(constant('MAILGUN_API_KEY')) || empty(constant('MAILGUN_DOMAIN'))) {
            throw new Exception("Mailgun not configured");
        }
        
        $data = [
            'from' => EMAIL_FROM_NAME . ' <' . EMAIL_FROM_ADDRESS . '>',
            'to' => $to,
            'subject' => $subject,
            'html' => $htmlBody,
            'text' => $textBody
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://api.mailgun.net/v3/' . constant('MAILGUN_DOMAIN') . '/messages');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_USERPWD, 'api:' . constant('MAILGUN_API_KEY'));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            throw new Exception("Mailgun API failed with code $httpCode: $response");
        }
        
        return true;
    }
    
    /**
     * PHP mail() Function Fallback
     */
    private static function sendViaPHPMail($to, $subject, $htmlBody, $textBody) {
        $headers = [];
        $headers[] = 'MIME-Version: 1.0';
        $headers[] = 'Content-Type: text/html; charset=UTF-8';
        $headers[] = 'From: ' . EMAIL_FROM_NAME . ' <' . EMAIL_FROM_ADDRESS . '>';
        $headers[] = 'Reply-To: ' . EMAIL_FROM_ADDRESS;
        $headers[] = 'X-Mailer: FirmaFlow Email System';
        
        $result = @mail($to, $subject, $htmlBody, implode("\r\n", $headers));
        
        if (!$result) {
            throw new Exception("PHP mail() function failed");
        }
        
        return true;
    }
    
    /**
     * Check if running on localhost
     */
    private static function isLocalhost() {
        if (isset($_SERVER['HTTP_HOST'])) {
            $host = $_SERVER['HTTP_HOST'];
            return (strpos($host, 'localhost') !== false || 
                    strpos($host, '127.0.0.1') !== false || 
                    strpos($host, '::1') !== false);
        }
        // Also check if we're running CLI (command line) which is often localhost
        return (php_sapi_name() === 'cli');
    }
    
    // Email Templates (same as in EmailHelper)
    private static function getWelcomeEmailTemplate($userName, $companyName) {
        $company = $companyName ? " for $companyName" : "";
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Welcome to FirmaFlow</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { color: #dc2626; font-size: 24px; font-weight: bold; }
                .welcome-title { color: #333; margin: 20px 0; }
                .content { color: #555; margin-bottom: 20px; }
                .cta-button { display: inline-block; padding: 12px 30px; background: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 12px; }
                .feature-list { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
                .feature-item { margin: 10px 0; }
                .feature-item::before { content: '✓'; color: #28a745; font-weight: bold; margin-right: 10px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <div class='logo'>🏢 FirmaFlow</div>
                    <h1 class='welcome-title'>Welcome to FirmaFlow!</h1>
                </div>
                
                <div class='content'>
                    <p>Dear $userName,</p>
                    
                    <p>Welcome to <strong>FirmaFlow</strong> - Your complete business management solution$company! We're excited to have you on board.</p>
                    
                    <p>With FirmaFlow, you can now:</p>
                    
                    <div class='feature-list'>
                        <div class='feature-item'>Manage customers and suppliers efficiently</div>
                        <div class='feature-item'>Track sales and purchases in real-time</div>
                        <div class='feature-item'>Generate professional invoices and receipts</div>
                        <div class='feature-item'>Monitor your business finances</div>
                        <div class='feature-item'>Access detailed reports and analytics</div>
                        <div class='feature-item'>Manage inventory and stock levels</div>
                    </div>
                    
                    <p>Your account is now active and ready to use. Start managing your business more efficiently today!</p>
                    
                    <p>If you have any questions or need assistance, our support team is here to help:</p>
                    <ul>
                        <li>📧 Email: <a href='mailto:" . SUPPORT_EMAIL . "'>" . SUPPORT_EMAIL . "</a></li>
                        <li>💬 Live Chat: Available on our website</li>
                        <li>📚 Help Center: Available on our dashboard</li>
                    </ul>
                    
                    <p>Thank you for choosing FirmaFlow. We're committed to helping your business grow!</p>
                    
                    <p>Best regards,<br>
                    <strong>The FirmaFlow Team</strong></p>
                </div>
                
                <div class='footer'>
                    <p>&copy; " . date('Y') . " FirmaFlow. All rights reserved.</p>
                    <p>This email was sent to you because you registered for a FirmaFlow account.</p>
                </div>
            </div>
        </body>
        </html>";
    }
    
    private static function getWelcomeEmailText($userName, $companyName) {
        $company = $companyName ? " for $companyName" : "";
        return "Welcome to FirmaFlow!

Dear $userName,

Welcome to FirmaFlow - Your complete business management solution$company! We're excited to have you on board.

With FirmaFlow, you can now:
✓ Manage customers and suppliers efficiently
✓ Track sales and purchases in real-time
✓ Generate professional invoices and receipts
✓ Monitor your business finances
✓ Access detailed reports and analytics
✓ Manage inventory and stock levels

Your account is now active and ready to use. Start managing your business more efficiently today!

If you have any questions or need assistance, our support team is here to help:
📧 Email: " . SUPPORT_EMAIL . "
💬 Live Chat: Available on our website
📚 Help Center: Available on our dashboard

Thank you for choosing FirmaFlow. We're committed to helping your business grow!

Best regards,
The FirmaFlow Team

© " . date('Y') . " FirmaFlow. All rights reserved.";
    }
    
    private static function getPaymentConfirmationTemplate($userName, $planName, $amount, $transactionId) {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Payment Confirmed - FirmaFlow</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { color: #dc2626; font-size: 24px; font-weight: bold; }
                .success-badge { background: #28a745; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin: 20px 0; }
                .payment-details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
                .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 5px 0; border-bottom: 1px solid #eee; }
                .detail-label { font-weight: bold; color: #555; }
                .detail-value { color: #333; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <div class='logo'>🏢 FirmaFlow</div>
                    <div class='success-badge'>✅ Payment Confirmed!</div>
                    <h1>Welcome to FirmaFlow $planName</h1>
                </div>
                
                <div class='content'>
                    <p>Dear $userName,</p>
                    
                    <p>Great news! Your payment has been successfully processed and your <strong>FirmaFlow $planName</strong> subscription is now active.</p>
                    
                    <div class='payment-details'>
                        <h3>Payment Details</h3>
                        <div class='detail-row'>
                            <span class='detail-label'>Plan:</span>
                            <span class='detail-value'>$planName</span>
                        </div>
                        <div class='detail-row'>
                            <span class='detail-label'>Amount Paid:</span>
                            <span class='detail-value'>$amount</span>
                        </div>
                        <div class='detail-row'>
                            <span class='detail-label'>Transaction ID:</span>
                            <span class='detail-value'>$transactionId</span>
                        </div>
                        <div class='detail-row'>
                            <span class='detail-label'>Date:</span>
                            <span class='detail-value'>" . date('F j, Y g:i A') . "</span>
                        </div>
                        <div class='detail-row'>
                            <span class='detail-label'>Status:</span>
                            <span class='detail-value' style='color: #28a745; font-weight: bold;'>CONFIRMED</span>
                        </div>
                    </div>
                    
                    <p>You now have access to all the powerful features of FirmaFlow $planName. Start managing your business more efficiently today!</p>
                    
                    <p>Thank you for choosing FirmaFlow!</p>
                    
                    <p>Best regards,<br>
                    <strong>The FirmaFlow Team</strong></p>
                </div>
                
                <div class='footer'>
                    <p>&copy; " . date('Y') . " FirmaFlow. All rights reserved.</p>
                    <p>Keep this email as your payment receipt for your records.</p>
                </div>
            </div>
        </body>
        </html>";
    }
    
    private static function getPaymentConfirmationText($userName, $planName, $amount, $transactionId) {
        return "Payment Confirmed - FirmaFlow $planName

Dear $userName,

Great news! Your payment has been successfully processed and your FirmaFlow $planName subscription is now active.

Payment Details:
- Plan: $planName
- Amount Paid: $amount
- Transaction ID: $transactionId
- Date: " . date('F j, Y g:i A') . "
- Status: CONFIRMED

You now have access to all the powerful features of FirmaFlow $planName. Start managing your business more efficiently today!

Thank you for choosing FirmaFlow!

Best regards,
The FirmaFlow Team

© " . date('Y') . " FirmaFlow. All rights reserved.
Keep this email as your payment receipt for your records.";
    }
}