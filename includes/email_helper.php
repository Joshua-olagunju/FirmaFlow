<?php
// includes/email_helper.php - Updated to work with email_config.php
// -------------------------
// Email Helper with subscription notification support

declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Load email configuration
require_once __DIR__ . '/email_config.php';

// Composer autoload (if available) - PHPMailer is preferred
$composerAutoload = __DIR__ . '/../vendor/autoload.php';
if (file_exists($composerAutoload)) {
    require_once $composerAutoload;
}

class EmailHelper
{
    /**
     * Send welcome email. Returns true on success.
     */
    public static function sendWelcomeEmail(string $toEmail, string $recipientName = ''): bool
    {
        if (!EMAIL_ENABLED) {
            if (EMAIL_DEBUG) error_log('[EmailHelper] EMAIL_DISABLED, pretending success');
            return true;
        }

        if (!filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
            if (EMAIL_DEBUG) error_log('[EmailHelper] Invalid email: ' . $toEmail);
            return false;
        }

        // Allow emails on localhost if EMAIL_ENABLED is true (for development testing)
        // if (self::isLocalhost()) {
        //     if (EMAIL_DEBUG) error_log('[EmailHelper] Skipping email on localhost for: ' . $toEmail);
        //     return true;
        // }

        $subject = 'Welcome to FirmaFlow!';
        $html = self::getWelcomeHtml($recipientName);
        $text = self::getWelcomeText($recipientName);

        return self::send($toEmail, $subject, $html, $text);
    }

    /**
     * Internal send wrapper (PHPMailer preferred, fallback to mail()).
     */
    private static function send(string $to, string $subject, string $htmlBody, string $textBody = ''): bool
    {
        // Try PHPMailer if available
        if (class_exists(PHPMailer::class)) {
            try {
                $mail = new PHPMailer(true);
                $mail->isSMTP();
                $mail->Host = EMAIL_HOST;
                $mail->SMTPAuth = true;
                $mail->Username = EMAIL_USERNAME;
                $mail->Password = EMAIL_PASSWORD;

                // Use email_config.php settings
                if (defined('PHPMailer\\PHPMailer\\PHPMailer::ENCRYPTION_STARTTLS') && strtolower(EMAIL_ENCRYPTION) === 'tls') {
                    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
                } elseif (strtolower(EMAIL_ENCRYPTION) === 'ssl') {
                    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
                } else {
                    $mail->SMTPSecure = EMAIL_ENCRYPTION;
                }

                $mail->Port = (int) EMAIL_PORT;

                // Optional: relax SSL checks for hosts with self-signed certs (NOT recommended in production)
                $mail->SMTPOptions = [
                    'ssl' => [
                        'verify_peer' => false,
                        'verify_peer_name' => false,
                        'allow_self_signed' => true,
                    ],
                ];

                if (EMAIL_DEBUG) {
                    $mail->SMTPDebug = 2;
                    $mail->Debugoutput = function ($str) { error_log('[PHPMailer] ' . $str); };
                }

                $mail->setFrom(EMAIL_FROM_ADDRESS, EMAIL_FROM_NAME);
                $mail->addAddress($to);
                $mail->addReplyTo(EMAIL_REPLY_TO, EMAIL_FROM_NAME . ' Support');

                $mail->isHTML(true);
                $mail->Subject = $subject;
                $mail->Body = $htmlBody;
                $mail->AltBody = $textBody ?: strip_tags($htmlBody);

                $mail->send();

                if (EMAIL_DEBUG) error_log('[EmailHelper] PHPMailer sent to ' . $to);
                return true;
            } catch (Exception $e) {
                error_log('[EmailHelper] PHPMailer error: ' . $e->getMessage());
                // fallthrough to mail() fallback
            } catch (Throwable $t) {
                error_log('[EmailHelper] PHPMailer throwable: ' . $t->getMessage());
            }
        } else {
            if (EMAIL_DEBUG) error_log('[EmailHelper] PHPMailer not available, using mail() fallback');
        }

        // Fallback to mail()
        $headers = [];
        $headers[] = 'MIME-Version: 1.0';
        $headers[] = 'Content-Type: text/html; charset=UTF-8';
        $headers[] = 'From: ' . EMAIL_FROM_NAME . ' <' . EMAIL_FROM_ADDRESS . '>';
        $headers[] = 'Reply-To: ' . EMAIL_REPLY_TO;
        $headers[] = 'X-Mailer: FirmaFlow-Mailer';
        $headerStr = implode("\r\n", $headers);

        $result = @mail($to, $subject, $htmlBody, $headerStr);
        if (EMAIL_DEBUG) error_log('[EmailHelper] mail() result for ' . $to . ': ' . ($result ? 'OK' : 'FAILED'));
        return (bool) $result;
    }

    /**
     * Blast launch emails to all active subscribers if today is launch day (Nov 1st).
     * Call this from a cron job (or from your script). Returns number of emails attempted.
     */
    public static function blastLaunchEmails(PDO $pdo): int
    {
        // guard
        if (!EMAIL_ENABLED) return 0;

        $today = date('Y-m-d');
        $launchDay = date('Y') . '-11-01';
        if ($today !== $launchDay) return 0;

        $count = 0;
        try {
            $stmt = $pdo->prepare("SELECT email FROM newsletter_subscriptions WHERE status = 'active'");
            $stmt->execute();
            $emails = $stmt->fetchAll(PDO::FETCH_COLUMN);

            foreach ($emails as $email) {
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) continue;
                self::sendLaunchEmail($email);
                $count++;
                // small delay helps avoid throttle/spam flags
                sleep(1);
            }
        } catch (Throwable $e) {
            error_log('[EmailHelper] blastLaunchEmails error: ' . $e->getMessage());
        }

        return $count;
    }

    /**
     * Send subscription expiry warning email
     */
    public static function sendExpiryWarning(string $toEmail, string $recipientName, string $planType, string $expiryDate, int $daysRemaining): bool
    {
        if (!EMAIL_ENABLED) {
            if (EMAIL_DEBUG) error_log('[EmailHelper] EMAIL_DISABLED, pretending success for expiry warning');
            return true;
        }

        if (!filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
            if (EMAIL_DEBUG) error_log('[EmailHelper] Invalid email for expiry warning: ' . $toEmail);
            return false;
        }

        // Allow emails on localhost if EMAIL_ENABLED is true (for development testing)
        // if (self::isLocalhost()) {
        //     if (EMAIL_DEBUG) error_log('[EmailHelper] Skipping expiry warning email on localhost for: ' . $toEmail);
        //     return true;
        // }

        $subject = "⚠️ FirmaFlow Subscription Expiring in {$daysRemaining} Days";
        $html = self::getExpiryWarningHtml($recipientName, $planType, $expiryDate, $daysRemaining);
        $text = self::getExpiryWarningText($recipientName, $planType, $expiryDate, $daysRemaining);

        return self::send($toEmail, $subject, $html, $text);
    }

    /**
     * Send subscription expired notice email
     */
    public static function sendExpiryNotice(string $toEmail, string $recipientName, string $planType): bool
    {
        if (!EMAIL_ENABLED) {
            if (EMAIL_DEBUG) error_log('[EmailHelper] EMAIL_DISABLED, pretending success for expiry notice');
            return true;
        }

        if (!filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
            if (EMAIL_DEBUG) error_log('[EmailHelper] Invalid email for expiry notice: ' . $toEmail);
            return false;
        }

        // Allow emails on localhost if EMAIL_ENABLED is true (for development testing)
        // if (self::isLocalhost()) {
        //     if (EMAIL_DEBUG) error_log('[EmailHelper] Skipping expiry notice email on localhost for: ' . $toEmail);
        //     return true;
        // }

        $subject = "🔒 FirmaFlow Subscription Expired - Renew Now";
        $html = self::getExpiryNoticeHtml($recipientName, $planType);
        $text = self::getExpiryNoticeText($recipientName, $planType);

        return self::send($toEmail, $subject, $html, $text);
    }

    /**
     * Private helper to send the launch email content
     */
    private static function sendLaunchEmail(string $to): bool
    {
        $subject = '🚀 FirmaFlow is Live — Get Your 1-Month Free Access!';
        $html = <<<HTML
<!DOCTYPE html>
<html><body>
  <h2>FirmaFlow is Live!</h2>
  <p>Hello,</p>
  <p>It’s finally here — <strong>FirmaFlow</strong> is now live.</p>
  <p><a href="https://firmaflowledger.com/register">Register now</a> and get <strong>1 month free</strong> as an early supporter.</p>
  <p>Thank you for believing in us — The FirmaFlow Team</p>
</body></html>
HTML;
        $text = "FirmaFlow is Live! Visit https://firmaflowledger.com/register and get 1 month free.";
        return self::send($to, $subject, $html, $text);
    }

    /**
     * Simple localhost detection to avoid sending emails when developing locally.
     */
    private static function isLocalhost(): bool
    {
        if (!isset($_SERVER['HTTP_HOST'])) return false;
        $host = strtolower((string) $_SERVER['HTTP_HOST']);
        return (strpos($host, 'localhost') !== false || strpos($host, '127.0.0.1') !== false);
    }

    // ----------------- Simple templates -----------------
    private static function getWelcomeHtml(string $name = ''): string
    {
        $year = date('Y');
        $greet = $name ? htmlspecialchars($name) : 'there';
        return <<<HTML
<!doctype html>
<html><body>
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#fff;border-radius:6px;">
    <h1>Welcome to FirmaFlow!</h1>
    <p>Hi {$greet},</p>
    <p>Thanks for subscribing — you'll be the first to know as we prepare to launch on <strong>November 1st</strong>.</p>
    <p>— The FirmaFlow Team</p>
    <hr>
    <small>© {$year} FirmaFlow</small>
  </div>
</body></html>
HTML;
    }

    private static function getWelcomeText(string $name = ''): string
    {
        $greet = $name ?: 'there';
        return "Hi $greet,\n\nThanks for subscribing to FirmaFlow. We'll send launch updates on November 1st.\n\n— The FirmaFlow Team";
    }

    // ----------------- Subscription Email Templates -----------------
    
    private static function getExpiryWarningHtml(string $name, string $planType, string $expiryDate, int $daysRemaining): string
    {
        $year = date('Y');
        $greet = $name ? htmlspecialchars($name) : 'there';
        $urgency = $daysRemaining <= 3 ? 'urgent' : 'warning';
        $urgencyColor = $daysRemaining <= 3 ? '#dc3545' : '#fd7e14';
        $formattedDate = date('F j, Y', strtotime($expiryDate));
        
        return <<<HTML
<!doctype html>
<html><body>
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#fff;border-radius:6px;">
    <div style="text-align:center;padding:20px;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;border-radius:6px;margin-bottom:20px;">
      <h1 style="margin:0;font-size:28px;">⚠️ Subscription Expiring Soon</h1>
      <p style="margin:10px 0 0 0;font-size:18px;">Your {$planType} plan expires in {$daysRemaining} days</p>
    </div>
    
    <div style="padding:20px;border:2px solid {$urgencyColor};border-radius:6px;background:#f8f9fa;margin-bottom:20px;">
      <h2 style="color:{$urgencyColor};margin-top:0;">Action Required</h2>
      <p><strong>Hi {$greet},</strong></p>
      <p>Your FirmaFlow <strong>{$planType}</strong> subscription will expire on <strong>{$formattedDate}</strong> ({$daysRemaining} days from now).</p>
      <p>To continue enjoying uninterrupted access to your business management tools, please renew your subscription before the expiry date.</p>
    </div>
    
    <div style="text-align:center;margin:30px 0;">
      <a href="https://firmaflowledger.com/subscription" 
         style="display:inline-block;padding:15px 30px;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;">
        Renew Subscription Now
      </a>
    </div>
    
    <div style="background:#e9ecef;padding:15px;border-radius:6px;margin:20px 0;">
      <h3 style="margin-top:0;color:#495057;">What happens if I don't renew?</h3>
      <ul style="margin:0;padding-left:20px;color:#6c757d;">
        <li>Access to your dashboard will be restricted</li>
        <li>Data exports and reports will be disabled</li>
        <li>Customer management features will be limited</li>
        <li>Your data remains safe and can be accessed once renewed</li>
      </ul>
    </div>
    
    <p style="color:#6c757d;">If you have any questions or need assistance, please contact our support team.</p>
    <p>— The FirmaFlow Team</p>
    <hr>
    <small style="color:#adb5bd;">© {$year} FirmaFlow | <a href="https://firmaflowledger.com">firmaflowledger.com</a></small>
  </div>
</body></html>
HTML;
    }

    private static function getExpiryWarningText(string $name, string $planType, string $expiryDate, int $daysRemaining): string
    {
        $greet = $name ?: 'there';
        $formattedDate = date('F j, Y', strtotime($expiryDate));
        
        return <<<TEXT
Hi {$greet},

⚠️ SUBSCRIPTION EXPIRING SOON ⚠️

Your FirmaFlow {$planType} subscription will expire on {$formattedDate} ({$daysRemaining} days from now).

To continue enjoying uninterrupted access to your business management tools, please renew your subscription before the expiry date.

Renew now: https://firmaflowledger.com/subscription

What happens if I don't renew?
• Access to your dashboard will be restricted
• Data exports and reports will be disabled  
• Customer management features will be limited
• Your data remains safe and can be accessed once renewed

If you have any questions, please contact our support team.

— The FirmaFlow Team
https://firmaflowledger.com
TEXT;
    }

    private static function getExpiryNoticeHtml(string $name, string $planType): string
    {
        $year = date('Y');
        $greet = $name ? htmlspecialchars($name) : 'there';
        
        return <<<HTML
<!doctype html>
<html><body>
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#fff;border-radius:6px;">
    <div style="text-align:center;padding:20px;background:#dc3545;color:white;border-radius:6px;margin-bottom:20px;">
      <h1 style="margin:0;font-size:28px;">🔒 Subscription Expired</h1>
      <p style="margin:10px 0 0 0;font-size:18px;">Your {$planType} plan has expired</p>
    </div>
    
    <div style="padding:20px;border:2px solid #dc3545;border-radius:6px;background:#f8d7da;margin-bottom:20px;">
      <h2 style="color:#721c24;margin-top:0;">Immediate Action Required</h2>
      <p><strong>Hi {$greet},</strong></p>
      <p>Your FirmaFlow <strong>{$planType}</strong> subscription has expired and your account access has been restricted.</p>
      <p>To restore full access to your business management tools and data, please renew your subscription immediately.</p>
    </div>
    
    <div style="text-align:center;margin:30px 0;">
      <a href="https://firmaflowledger.com/subscription" 
         style="display:inline-block;padding:15px 30px;background:#dc3545;color:white;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;">
        Renew Subscription Now
      </a>
    </div>
    
    <div style="background:#fff3cd;padding:15px;border-radius:6px;margin:20px 0;border:1px solid #ffeaa7;">
      <h3 style="margin-top:0;color:#856404;">Don't Worry - Your Data is Safe</h3>
      <ul style="margin:0;padding-left:20px;color:#856404;">
        <li>All your business data remains secure</li>
        <li>Customer information is preserved</li>
        <li>Product inventory data is intact</li>
        <li>Full access returns immediately upon renewal</li>
      </ul>
    </div>
    
    <div style="background:#d1ecf1;padding:15px;border-radius:6px;margin:20px 0;border:1px solid #b6d4fe;">
      <h3 style="margin-top:0;color:#0c5460;">Need Help?</h3>
      <p style="margin:0;color:#0c5460;">Our support team is here to assist you with the renewal process. Contact us if you have any questions or need assistance.</p>
    </div>
    
    <p style="color:#6c757d;">Thank you for being a valued FirmaFlow customer.</p>
    <p>— The FirmaFlow Team</p>
    <hr>
    <small style="color:#adb5bd;">© {$year} FirmaFlow | <a href="https://firmaflowledger.com">firmaflowledger.com</a></small>
  </div>
</body></html>
HTML;
    }

    private static function getExpiryNoticeText(string $name, string $planType): string
    {
        $greet = $name ?: 'there';
        
        return <<<TEXT
Hi {$greet},

🔒 SUBSCRIPTION EXPIRED 🔒

Your FirmaFlow {$planType} subscription has expired and your account access has been restricted.

To restore full access to your business management tools and data, please renew your subscription immediately.

Renew now: https://firmaflowledger.com/subscription

Don't Worry - Your Data is Safe:
• All your business data remains secure
• Customer information is preserved  
• Product inventory data is intact
• Full access returns immediately upon renewal

Need help? Our support team is here to assist you with the renewal process.

Thank you for being a valued FirmaFlow customer.

— The FirmaFlow Team
https://firmaflowledger.com
TEXT;
    }

    /**
     * Send OTP verification email
     */
    public static function sendOTPEmail(string $email, string $otpCode, string $firstName): bool
    {
        if (!EMAIL_ENABLED) {
            if (EMAIL_DEBUG) error_log('[EmailHelper] EMAIL_DISABLED, pretending OTP email sent');
            return true;
        }

        $subject = "Your FirmaFlow Verification Code";
        $htmlBody = self::getOTPHtml($firstName, $otpCode);
        $textBody = self::getOTPText($firstName, $otpCode);

        if (EMAIL_DEBUG) {
            error_log('[EmailHelper] Sending OTP email to: ' . $email . ' with code: ' . $otpCode);
        }

        return self::send($email, $subject, $htmlBody, $textBody);
    }

    /**
     * Generate 6-digit OTP code
     */
    public static function generateOTP(): string
    {
        return str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    private static function getOTPHtml(string $name, string $otpCode): string
    {
        $greet = $name ?: 'there';
        
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 1.8rem; }
        .content { padding: 2rem; line-height: 1.6; }
        .otp-box { background: #f8f9fa; border: 2px dashed #667eea; border-radius: 15px; padding: 2rem; text-align: center; margin: 2rem 0; }
        .otp-code { font-size: 2.5rem; font-weight: bold; color: #667eea; letter-spacing: 0.8rem; margin: 1rem 0; font-family: 'Courier New', monospace; text-shadow: 1px 1px 2px rgba(0,0,0,0.1); }
        .welcome-box { background: linear-gradient(135deg, #e8f5e8 0%, #f0f8ff 100%); border-radius: 10px; padding: 1.5rem; margin: 1.5rem 0; text-align: center; }
        .footer { background: #f8f9fa; padding: 1.5rem; text-align: center; color: #666; font-size: 0.9rem; }
        .feature-list { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
        .feature-item { display: flex; align-items: center; margin: 0.5rem 0; }
        .checkmark { color: #28a745; font-weight: bold; margin-right: 0.5rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to FirmaFlow Ledger</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 0.5rem 0 0 0; font-size: 1.1rem;">Email Verification Required</p>
        </div>
        
        <div class="content">
            <div class="welcome-box">
                <h2 style="color: #667eea; margin: 0 0 0.5rem 0;">Hi {$greet}! 👋</h2>
                <p style="margin: 0; color: #555;">Thank you for joining FirmaFlow Ledger - your business management solution!</p>
            </div>
            
            <p>To complete your registration and secure your account, please verify your email address using the code below:</p>
            
            <div class="otp-box">
                <p style="margin: 0; color: #333; font-weight: 600; font-size: 1.1rem;">🔐 Your Verification Code</p>
                <div class="otp-code">{$otpCode}</div>
                <p style="margin: 0; color: #666; font-size: 0.9rem;">⏰ This code expires in 15 minutes</p>
            </div>
            
            <div class="feature-list">
                <h3 style="color: #667eea; margin: 0 0 1rem 0;">What you'll get with FirmaFlow Ledger:</h3>
                <div class="feature-item"><span class="checkmark">✓</span> Complete business accounting system</div>
                <div class="feature-item"><span class="checkmark">✓</span> Invoice and payment management</div>
                <div class="feature-item"><span class="checkmark">✓</span> Real-time financial reports</div>
                <div class="feature-item"><span class="checkmark">✓</span> Customer and supplier management</div>
                <div class="feature-item"><span class="checkmark">✓</span> Secure cloud-based access</div>
            </div>
            
            <p style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 1rem; color: #856404;">
                <strong>⚠️ Security Note:</strong> If you didn't create an account with FirmaFlow Ledger, please ignore this email or contact our support team.
            </p>
            
            <p>Need assistance? Our support team is ready to help at <a href="mailto:support@firmaflow.com" style="color: #667eea; text-decoration: none; font-weight: 600;">support@firmaflow.com</a></p>
            
            <p style="margin-top: 2rem;">
                Best regards,<br>
                <strong style="color: #667eea;">The FirmaFlow Team</strong>
            </p>
        </div>
        
        <div class="footer">
            <p><strong>© 2025 FirmaFlow Ledger. All rights reserved.</strong></p>
            <p>This is an automated message for account verification. Please do not reply to this email.</p>
            <p style="font-size: 0.8rem; color: #999;">🌐 Visit us at <a href="https://firmaflowledger.com" style="color: #667eea;">firmaflowledger.com</a></p>
        </div>
    </div>
</body>
</html>
HTML;
    }

    private static function getOTPText(string $name, string $otpCode): string
    {
        $greet = $name ?: 'there';
        
        return <<<TEXT
🎉 WELCOME TO FIRMAFLOW LEDGER 🎉

Hi {$greet}!

Thank you for joining FirmaFlow Ledger - your complete business management solution!

To complete your registration and secure your account, please verify your email address using the code below:

🔐 YOUR VERIFICATION CODE: {$otpCode}

⏰ This code expires in 15 minutes.

WHAT YOU'LL GET WITH FIRMAFLOW LEDGER:
✓ Complete business accounting system
✓ Invoice and payment management  
✓ Real-time financial reports
✓ Customer and supplier management
✓ Secure cloud-based access

⚠️ SECURITY NOTE: If you didn't create an account with FirmaFlow Ledger, please ignore this email or contact our support team.

Need assistance? Email: support@firmaflow.com

Best regards,
The FirmaFlow Team

© 2025 FirmaFlow Ledger. All rights reserved.
Visit us at: https://firmaflowledger.com
TEXT;
    }
}
