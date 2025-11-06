<?php
/**
 * SuperAdmin Security Configuration
 * Defines password policies and security settings
 */

return [
    'password_policy' => [
        'min_length' => 8,
        'require_uppercase' => true,
        'require_lowercase' => true,
        'require_numbers' => true,
        'require_special_chars' => true,
        'special_chars_pattern' => '@$!%*?&',
        'max_age_days' => 90, // Password expiry in days
        'prevent_reuse_count' => 5, // Prevent reusing last N passwords
    ],
    
    'session_security' => [
        'timeout_minutes' => 60,
        'regenerate_id_interval' => 30, // minutes
        'max_concurrent_sessions' => 3,
    ],
    
    'login_security' => [
        'max_failed_attempts' => 5,
        'lockout_duration_minutes' => 15,
        'require_2fa' => false, // For future implementation
    ],
    
    'audit_logging' => [
        'enabled' => true,
        'log_login_attempts' => true,
        'log_password_changes' => true,
        'log_profile_updates' => true,
        'retention_days' => 365,
    ]
];
?>