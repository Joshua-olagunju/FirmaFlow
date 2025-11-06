<?php
/**
 * Currency Helper Functions
 * Provides currency formatting and conversion utilities across the system
 */

// Currency symbols and configurations
$CURRENCY_CONFIG = [
    'NGN' => ['symbol' => '₦', 'name' => 'Nigerian Naira', 'decimals' => 2, 'position' => 'before'],
    'USD' => ['symbol' => '$', 'name' => 'US Dollar', 'decimals' => 2, 'position' => 'before'],
    'EUR' => ['symbol' => '€', 'name' => 'Euro', 'decimals' => 2, 'position' => 'before'],
    'GBP' => ['symbol' => '£', 'name' => 'British Pound', 'decimals' => 2, 'position' => 'before'],
    'CAD' => ['symbol' => 'C$', 'name' => 'Canadian Dollar', 'decimals' => 2, 'position' => 'before'],
    'AUD' => ['symbol' => 'A$', 'name' => 'Australian Dollar', 'decimals' => 2, 'position' => 'before'],
    'JPY' => ['symbol' => '¥', 'name' => 'Japanese Yen', 'decimals' => 0, 'position' => 'before'],
    'CNY' => ['symbol' => '¥', 'name' => 'Chinese Yuan', 'decimals' => 2, 'position' => 'before'],
    'INR' => ['symbol' => '₹', 'name' => 'Indian Rupee', 'decimals' => 2, 'position' => 'before'],
    'ZAR' => ['symbol' => 'R', 'name' => 'South African Rand', 'decimals' => 2, 'position' => 'before']
];

/**
 * Get the current system currency from database
 */
function getSystemCurrency($pdo, $company_id) {
    static $cache = [];
    
    // Return default if no PDO connection or company_id
    if (!$pdo || !$company_id) {
        return 'NGN';
    }
    
    if (isset($cache[$company_id])) {
        return $cache[$company_id];
    }
    
    try {
        $stmt = $pdo->prepare("SELECT setting_value FROM company_settings WHERE company_id = ? AND setting_key = 'currency'");
        $stmt->execute([$company_id]);
        $result = $stmt->fetch();
        
        $currency = $result ? $result['setting_value'] : 'NGN';
        $cache[$company_id] = $currency;
        
        return $currency;
    } catch (Exception $e) {
        return 'NGN'; // Fallback currency
    }
}

/**
 * Get currency configuration
 */
function getCurrencyConfig($currency = 'NGN') {
    global $CURRENCY_CONFIG;
    return $CURRENCY_CONFIG[$currency] ?? $CURRENCY_CONFIG['NGN'];
}

/**
 * Format amount with currency symbol
 */
function formatCurrency($amount, $currency = null, $pdo = null, $company_id = null) {
    // If no currency provided, try to get from system settings
    if (!$currency && $pdo && $company_id) {
        $currency = getSystemCurrency($pdo, $company_id);
    }
    
    // Default to NGN if still no currency
    if (!$currency) {
        $currency = 'NGN';
    }
    
    $config = getCurrencyConfig($currency);
    $symbol = $config['symbol'];
    $decimals = $config['decimals'];
    $position = $config['position'];
    
    // Format the number
    $formattedAmount = number_format((float)$amount, $decimals);
    
    // Position the symbol
    if ($position === 'before') {
        return $symbol . $formattedAmount;
    } else {
        return $formattedAmount . $symbol;
    }
}

/**
 * Format currency for JavaScript (returns array with symbol and formatted amount)
 */
function formatCurrencyForJS($amount, $currency = 'NGN') {
    $config = getCurrencyConfig($currency);
    
    return [
        'symbol' => $config['symbol'],
        'amount' => number_format((float)$amount, $config['decimals']),
        'formatted' => formatCurrency($amount, $currency),
        'decimals' => $config['decimals'],
        'position' => $config['position']
    ];
}

/**
 * Get all available currencies
 */
function getAllCurrencies() {
    global $CURRENCY_CONFIG;
    return $CURRENCY_CONFIG;
}

/**
 * Parse amount from formatted currency string
 */
function parseCurrencyAmount($formattedAmount, $currency = 'NGN') {
    $config = getCurrencyConfig($currency);
    $symbol = $config['symbol'];
    
    // Remove currency symbol and formatting
    $cleaned = str_replace([$symbol, ',', ' '], '', $formattedAmount);
    
    return (float)$cleaned;
}

/**
 * Validate currency code
 */
function isValidCurrency($currency) {
    global $CURRENCY_CONFIG;
    return isset($CURRENCY_CONFIG[$currency]);
}

/**
 * Get currency symbol only
 */
function getCurrencySymbol($currency = 'NGN') {
    $config = getCurrencyConfig($currency);
    return $config['symbol'];
}

/**
 * Get currency name
 */
function getCurrencyName($currency = 'NGN') {
    $config = getCurrencyConfig($currency);
    return $config['name'];
}

/**
 * Format currency for display in tables (shorter format for large amounts)
 */
function formatCurrencyCompact($amount, $currency = 'NGN') {
    $config = getCurrencyConfig($currency);
    $symbol = $config['symbol'];
    
    $absAmount = abs($amount);
    
    if ($absAmount >= 1000000000) {
        $formatted = number_format($amount / 1000000000, 1) . 'B';
    } elseif ($absAmount >= 1000000) {
        $formatted = number_format($amount / 1000000, 1) . 'M';
    } elseif ($absAmount >= 1000) {
        $formatted = number_format($amount / 1000, 1) . 'K';
    } else {
        $formatted = number_format($amount, $config['decimals']);
    }
    
    return $config['position'] === 'before' ? $symbol . $formatted : $formatted . $symbol;
}

/**
 * Generate JavaScript currency formatter function
 */
function generateJSCurrencyFormatter($currency = 'NGN') {
    $config = getCurrencyConfig($currency);
    
    return "
    function formatCurrency(amount) {
        const config = " . json_encode($config) . ";
        const formatted = amount.toLocaleString(undefined, {
            minimumFractionDigits: config.decimals,
            maximumFractionDigits: config.decimals
        });
        
        return config.position === 'before' ? 
            config.symbol + formatted : 
            formatted + config.symbol;
    }
    
    function parseCurrency(str) {
        const config = " . json_encode($config) . ";
        // Simple approach: remove common currency symbols and separators
        return parseFloat(str.replace(/[₦\$€£¥₹R,\s]/g, '')) || 0;
    }
    ";
}

/**
 * Get currency settings for a company as JSON (for use in JavaScript)
 */
function getCurrencySettingsJSON($pdo, $company_id) {
    if (!$pdo || !$company_id) {
        $config = getCurrencyConfig('NGN');
        return json_encode([
            'code' => 'NGN',
            'symbol' => $config['symbol'],
            'name' => $config['name'],
            'decimals' => $config['decimals'],
            'position' => $config['position']
        ]);
    }
    
    $currency = getSystemCurrency($pdo, $company_id);
    $config = getCurrencyConfig($currency);
    
    return json_encode([
        'code' => $currency,
        'symbol' => $config['symbol'],
        'name' => $config['name'],
        'decimals' => $config['decimals'],
        'position' => $config['position']
    ]);
}

/**
 * Format currency for export (plain text)
 */
function formatCurrencyForExport($amount, $currency = 'NGN') {
    $config = getCurrencyConfig($currency);
    return number_format((float)$amount, $config['decimals']);
}

/**
 * Convert currency amount for database storage (always store as decimal)
 */
function prepareCurrencyForDB($amount) {
    // Remove any formatting and convert to float
    $cleaned = preg_replace('/[^0-9.-]/', '', $amount);
    return (float)$cleaned;
}

/**
 * Middleware function to inject currency settings into templates
 */
function injectCurrencySettings($pdo, $company_id) {
    // Check if PDO and company_id are available
    if (!$pdo || !$company_id) {
        // Inject default currency settings if no database connection
        echo "<script>
            window.CURRENCY_SETTINGS = {
                code: 'NGN',
                symbol: '₦',
                name: 'Nigerian Naira',
                decimals: 2,
                position: 'before'
            };
            
            " . generateJSCurrencyFormatter('NGN') . "
        </script>";
        return;
    }
    
    $currency = getSystemCurrency($pdo, $company_id);
    $config = getCurrencyConfig($currency);
    
    echo "<script>
        window.CURRENCY_SETTINGS = {
            code: '{$currency}',
            symbol: '{$config['symbol']}',
            name: '{$config['name']}',
            decimals: {$config['decimals']},
            position: '{$config['position']}'
        };
        
        " . generateJSCurrencyFormatter($currency) . "
    </script>";
}
?>