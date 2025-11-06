<?php
/**
 * Currency Helper for SuperAdmin
 * Handles currency formatting and conversion
 */

class CurrencyHelper {
    private static $pdo;
    private static $defaultCurrency = 'USD';
    private static $currencies = [
        'USD' => ['name' => 'US Dollar', 'symbol' => '$', 'rate' => 1.00],
        'NGN' => ['name' => 'Nigerian Naira', 'symbol' => '₦', 'rate' => 1640.00],
        'EUR' => ['name' => 'Euro', 'symbol' => '€', 'rate' => 0.92],
        'GBP' => ['name' => 'British Pound', 'symbol' => '£', 'rate' => 0.79],
        'CAD' => ['name' => 'Canadian Dollar', 'symbol' => 'C$', 'rate' => 1.36],
        'AUD' => ['name' => 'Australian Dollar', 'symbol' => 'A$', 'rate' => 1.53],
        'JPY' => ['name' => 'Japanese Yen', 'symbol' => '¥', 'rate' => 149.50],
        'ZAR' => ['name' => 'South African Rand', 'symbol' => 'R', 'rate' => 18.75],
        'KES' => ['name' => 'Kenyan Shilling', 'symbol' => 'KSh', 'rate' => 148.50],
        'GHS' => ['name' => 'Ghanaian Cedi', 'symbol' => '₵', 'rate' => 12.05],
    ];

    public static function init($pdo) {
        self::$pdo = $pdo;
        self::loadSystemCurrency();
    }

    private static function loadSystemCurrency() {
        if (!self::$pdo) return;
        
        try {
            $stmt = self::$pdo->prepare("SELECT setting_value FROM system_settings WHERE setting_key = 'default_currency'");
            $stmt->execute();
            $currency = $stmt->fetchColumn();
            
            if ($currency && isset(self::$currencies[$currency])) {
                self::$defaultCurrency = $currency;
            }
        } catch (Exception $e) {
            // Ignore errors, use default currency
        }
    }

    public static function getDefaultCurrency() {
        return self::$defaultCurrency;
    }

    public static function setDefaultCurrency($currency) {
        if (!isset(self::$currencies[$currency])) {
            throw new InvalidArgumentException("Unsupported currency: $currency");
        }

        self::$defaultCurrency = $currency;

        // Save to database
        if (self::$pdo) {
            try {
                $stmt = self::$pdo->prepare("
                    INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, updated_by) 
                    VALUES ('default_currency', ?, 'string', 'currency', 'Default system currency', 'superadmin')
                    ON DUPLICATE KEY UPDATE 
                    setting_value = VALUES(setting_value), 
                    updated_at = NOW(), 
                    updated_by = VALUES(updated_by)
                ");
                $stmt->execute([$currency]);
            } catch (Exception $e) {
                error_log("Failed to save currency setting: " . $e->getMessage());
            }
        }
    }

    public static function getCurrencies() {
        return self::$currencies;
    }

    public static function getCurrencyInfo($currency = null) {
        $currency = $currency ?: self::$defaultCurrency;
        return self::$currencies[$currency] ?? self::$currencies['USD'];
    }

    public static function format($amount, $currency = null, $includeSymbol = true) {
        $currency = $currency ?: self::$defaultCurrency;
        $currencyInfo = self::getCurrencyInfo($currency);
        
        // Format number with proper decimals
        if ($currency === 'JPY') {
            // Japanese Yen doesn't use decimal places
            $formatted = number_format($amount, 0);
        } else {
            $formatted = number_format($amount, 2);
        }

        if ($includeSymbol) {
            return $currencyInfo['symbol'] . $formatted;
        }

        return $formatted;
    }

    public static function convert($amount, $fromCurrency = 'USD', $toCurrency = null) {
        $toCurrency = $toCurrency ?: self::$defaultCurrency;
        
        if ($fromCurrency === $toCurrency) {
            return $amount;
        }

        $fromRate = self::$currencies[$fromCurrency]['rate'] ?? 1.00;
        $toRate = self::$currencies[$toCurrency]['rate'] ?? 1.00;

        // Convert to USD first, then to target currency
        $usdAmount = $amount / $fromRate;
        return $usdAmount * $toRate;
    }

    public static function formatWithConversion($amount, $fromCurrency = 'USD', $toCurrency = null, $includeSymbol = true) {
        $convertedAmount = self::convert($amount, $fromCurrency, $toCurrency);
        return self::format($convertedAmount, $toCurrency, $includeSymbol);
    }

    public static function getMonthlyRevenue($pdo = null) {
        $pdo = $pdo ?: self::$pdo;
        if (!$pdo) return 0;

        try {
            // Get revenue from active subscriptions
            $stmt = $pdo->query("
                SELECT COALESCE(SUM(subscription_amount), 0) as revenue 
                FROM companies 
                WHERE subscription_status = 'active'
            ");
            $revenue = $stmt->fetchColumn() ?: 0;

            return (float)$revenue;
        } catch (Exception $e) {
            error_log("Failed to get monthly revenue: " . $e->getMessage());
            return 0;
        }
    }

    public static function getTotalRevenue($pdo = null) {
        $pdo = $pdo ?: self::$pdo;
        if (!$pdo) return 0;

        try {
            // Calculate total revenue from all payments and active subscriptions
            $stmt = $pdo->query("
                SELECT 
                    COALESCE(SUM(
                        CASE 
                            WHEN billing_cycle = 'yearly' THEN subscription_amount
                            ELSE subscription_amount * 12
                        END
                    ), 0) as annual_revenue
                FROM companies 
                WHERE subscription_status = 'active'
            ");
            $revenue = $stmt->fetchColumn() ?: 0;

            return (float)$revenue;
        } catch (Exception $e) {
            error_log("Failed to get total revenue: " . $e->getMessage());
            return 0;
        }
    }

    public static function getRevenueByPlan($pdo = null) {
        $pdo = $pdo ?: self::$pdo;
        if (!$pdo) return [];

        try {
            $stmt = $pdo->query("
                SELECT 
                    subscription_plan,
                    COUNT(*) as count,
                    COALESCE(SUM(subscription_amount), 0) as revenue
                FROM companies 
                WHERE subscription_status = 'active'
                GROUP BY subscription_plan
            ");
            
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format results with currency
            foreach ($results as &$result) {
                $result['formatted_revenue'] = self::format($result['revenue']);
                $result['revenue'] = (float)$result['revenue'];
                $result['count'] = (int)$result['count'];
            }
            
            return $results;
        } catch (Exception $e) {
            error_log("Failed to get revenue by plan: " . $e->getMessage());
            return [];
        }
    }

    public static function updateExchangeRates() {
        // In a real application, you would fetch rates from an API
        // For now, this is a placeholder for manual rate updates
        $rates = [
            'USD' => 1.00,
            'NGN' => 1640.00, // Updated rate as of 2025
            'EUR' => 0.92,
            'GBP' => 0.79,
            'CAD' => 1.36,
            'AUD' => 1.53,
            'JPY' => 149.50,
            'ZAR' => 18.75,
            'KES' => 148.50,
            'GHS' => 12.05,
        ];

        foreach ($rates as $currency => $rate) {
            if (isset(self::$currencies[$currency])) {
                self::$currencies[$currency]['rate'] = $rate;
            }
        }

        return true;
    }
}

// Convenience functions for templates
function formatCurrency($amount, $currency = null, $includeSymbol = true) {
    return CurrencyHelper::format($amount, $currency, $includeSymbol);
}

function convertCurrency($amount, $fromCurrency = 'USD', $toCurrency = null) {
    return CurrencyHelper::convert($amount, $fromCurrency, $toCurrency);
}

function getCurrencySymbol($currency = null) {
    $info = CurrencyHelper::getCurrencyInfo($currency);
    return $info['symbol'];
}
?>