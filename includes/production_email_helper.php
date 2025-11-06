<?php
/**
 * Enhanced Email Helper for Production Use
 * This version provides better debugging and fallback options
 */

require_once __DIR__ . '/email_config.php';

class ProductionEmailHelper {
    
    /**
     * Send email with enhanced error handling and debugging
     */
    public static function sendEmail($to, $subject, $htmlBody, $textBody = '', $debug = false) {
        // Validate email
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'error' => 'Invalid email address'];
        }
        
        // Check if emails are enabled
        if (!EMAIL_ENABLED) {
            return ['success' => false, 'error' => 'Email system is disabled'];
        }
        
        // Skip on localhost unless forced
        if (!isset($_GET['force_email']) && self::isLocalhost()) {
            return ['success' => true, 'message' => 'Skipped on localhost (add ?force_email=1 to test)'];
        }
        
        $result = ['success' => false, 'method' => 'none', 'debug' => []];
        
        // Try Method 1: Enhanced mail() with proper headers
        if (!$result['success']) {
            $result = self::tryMailFunction($to, $subject, $htmlBody, $textBody, $debug);
        }
        
        // Try Method 2: Manual SMTP (if mail() fails)
        if (!$result['success'] && defined('EMAIL_HOST')) {
            $result = self::tryManualSMTP($to, $subject, $htmlBody, $textBody, $debug);
        }
        
        return $result;
    }
    
    /**
     * Try using PHP mail() function with enhanced headers
     */
    private static function tryMailFunction($to, $subject, $htmlBody, $textBody, $debug = false) {
        $result = ['success' => false, 'method' => 'mail()', 'debug' => []];
        
        try {
            // Enhanced headers for better delivery with TrueHost Cloud
            $headers = [
                'MIME-Version: 1.0',
                'Content-Type: text/html; charset=UTF-8',
                'From: ' . SMTP_FROM_NAME . ' <' . SMTP_FROM_EMAIL . '>',
                'Reply-To: ' . SUPPORT_EMAIL,
                'Return-Path: ' . SMTP_FROM_EMAIL,
                'X-Mailer: FirmaFlow Ledger v1.0 (TrueHost Cloud)',
                'X-Priority: 3',
                'X-MSMail-Priority: Normal',
                'Message-ID: <' . time() . '.firmaflow@firmaflowledger.com>',
                'Date: ' . date('D, d M Y H:i:s O'),
                'Authentication-Results: firmaflowledger.com; none'
            ];
            
            $headerString = implode("\r\n", $headers);
            
            if ($debug) {
                $result['debug'][] = "Headers: " . $headerString;
                $result['debug'][] = "To: $to";
                $result['debug'][] = "Subject: $subject";
            }
            
            // Send email with error suppression
            $mailResult = @mail($to, $subject, $htmlBody, $headerString);
            
            if ($mailResult) {
                $result['success'] = true;
                $result['message'] = 'Email sent successfully via mail()';
            } else {
                $result['error'] = 'mail() function returned false';
                
                // Check for errors
                $lastError = error_get_last();
                if ($lastError && strpos(strtolower($lastError['message']), 'mail') !== false) {
                    $result['error'] .= ' - ' . $lastError['message'];
                }
            }
            
        } catch (Exception $e) {
            $result['error'] = 'Exception in mail(): ' . $e->getMessage();
        }
        
        return $result;
    }
    
    /**
     * Try manual SMTP connection (basic implementation)
     */
    private static function tryManualSMTP($to, $subject, $htmlBody, $textBody, $debug = false) {
        $result = ['success' => false, 'method' => 'manual_smtp', 'debug' => []];
        
        try {
            $smtpHost = EMAIL_HOST;
            $smtpPort = EMAIL_PORT;
            $smtpUser = EMAIL_USERNAME;
            $smtpPass = EMAIL_PASSWORD;
            $smtpEncryption = EMAIL_ENCRYPTION;
            
            if ($debug) {
                $result['debug'][] = "SMTP Host: $smtpHost:$smtpPort";
                $result['debug'][] = "SMTP User: $smtpUser";
                $result['debug'][] = "SMTP Encryption: $smtpEncryption";
            }
            
            // Create socket connection
            $contextOptions = [];
            if ($smtpEncryption === 'ssl') {
                $contextOptions['ssl'] = [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                ];
            }
            
            $context = stream_context_create($contextOptions);
            
            if ($smtpEncryption === 'ssl') {
                $connection = @stream_socket_client("ssl://$smtpHost:$smtpPort", $errno, $errstr, 30, STREAM_CLIENT_CONNECT, $context);
            } else {
                $connection = @stream_socket_client("tcp://$smtpHost:$smtpPort", $errno, $errstr, 30, STREAM_CLIENT_CONNECT, $context);
            }
            
            if (!$connection) {
                $result['error'] = "Cannot connect to SMTP server: $errstr ($errno)";
                return $result;
            }
            
            // Read initial response
            $response = fgets($connection, 515);
            if ($debug) {
                $result['debug'][] = "Initial response: " . trim($response);
            }
            
            if (substr($response, 0, 3) !== '220') {
                $result['error'] = "SMTP server not ready: $response";
                fclose($connection);
                return $result;
            }
            
            // EHLO command
            fwrite($connection, "EHLO firmaflowledger.com\r\n");
            $response = fgets($connection, 515);
            if ($debug) {
                $result['debug'][] = "EHLO response: " . trim($response);
            }
            
            // Start TLS if needed
            if ($smtpEncryption === 'tls') {
                fwrite($connection, "STARTTLS\r\n");
                $response = fgets($connection, 515);
                if ($debug) {
                    $result['debug'][] = "STARTTLS response: " . trim($response);
                }
                
                if (substr($response, 0, 3) === '220') {
                    stream_socket_enable_crypto($connection, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                    
                    // Send EHLO again after TLS
                    fwrite($connection, "EHLO firmaflowledger.com\r\n");
                    $response = fgets($connection, 515);
                    if ($debug) {
                        $result['debug'][] = "EHLO after TLS: " . trim($response);
                    }
                }
            }
            
            // Authenticate
            fwrite($connection, "AUTH LOGIN\r\n");
            $response = fgets($connection, 515);
            if ($debug) {
                $result['debug'][] = "AUTH LOGIN response: " . trim($response);
            }
            
            if (substr($response, 0, 3) === '334') {
                // Send username
                fwrite($connection, base64_encode($smtpUser) . "\r\n");
                $response = fgets($connection, 515);
                
                // Send password  
                fwrite($connection, base64_encode($smtpPass) . "\r\n");
                $response = fgets($connection, 515);
                if ($debug) {
                    $result['debug'][] = "AUTH response: " . trim($response);
                }
                
                if (substr($response, 0, 3) !== '235') {
                    $result['error'] = "SMTP authentication failed: $response";
                    fclose($connection);
                    return $result;
                }
                
                // Set sender
                fwrite($connection, "MAIL FROM: <$smtpUser>\r\n");
                $response = fgets($connection, 515);
                
                // Set recipient
                fwrite($connection, "RCPT TO: <$to>\r\n");
                $response = fgets($connection, 515);
                
                // Start data
                fwrite($connection, "DATA\r\n");
                $response = fgets($connection, 515);
                
                if (substr($response, 0, 3) === '354') {
                    // Send headers and body
                    $mailData = "From: " . SMTP_FROM_NAME . " <$smtpUser>\r\n";
                    $mailData .= "To: $to\r\n";
                    $mailData .= "Subject: $subject\r\n";
                    $mailData .= "MIME-Version: 1.0\r\n";
                    $mailData .= "Content-Type: text/html; charset=UTF-8\r\n";
                    $mailData .= "Date: " . date('D, d M Y H:i:s O') . "\r\n";
                    $mailData .= "\r\n";
                    $mailData .= $htmlBody;
                    $mailData .= "\r\n.\r\n";
                    
                    fwrite($connection, $mailData);
                    $response = fgets($connection, 515);
                    
                    if (substr($response, 0, 3) === '250') {
                        $result['success'] = true;
                        $result['message'] = 'Email sent successfully via manual SMTP';
                    } else {
                        $result['error'] = "SMTP DATA failed: $response";
                    }
                } else {
                    $result['error'] = "SMTP DATA command rejected: $response";
                }
                
                // Quit
                fwrite($connection, "QUIT\r\n");
            }
            
            fclose($connection);
            
        } catch (Exception $e) {
            $result['error'] = 'Exception in manual SMTP: ' . $e->getMessage();
        }
        
        return $result;
    }
    
    /**
     * Check if running on localhost
     */
    private static function isLocalhost() {
        $host = $_SERVER['HTTP_HOST'] ?? '';
        return strpos($host, 'localhost') !== false || strpos($host, '127.0.0.1') !== false;
    }
    
    /**
     * Send welcome email with enhanced error handling
     */
    public static function sendWelcomeEmail($userEmail, $userName, $companyName = '', $debug = false) {
        $subject = "Welcome to FirmaFlow - Your Business Management Journey Starts Here!";
        
        $htmlBody = "
        <html>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                <h2 style='color: #667eea;'>Welcome to FirmaFlow!</h2>
                <p>Dear $userName,</p>
                <p>Welcome to <strong>FirmaFlow</strong> - Your complete business management solution" . ($companyName ? " for $companyName" : "") . "! We're excited to have you on board.</p>
                <p>Your account is now active and ready to use.</p>
                <p>Best regards,<br><strong>The FirmaFlow Team</strong></p>
            </div>
        </body>
        </html>";
        
        return self::sendEmail($userEmail, $subject, $htmlBody, '', $debug);
    }
}
?>