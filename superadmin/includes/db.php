<?php
// SuperAdmin Database Connection
// This connects to the same database but provides SuperAdmin-specific functions

// Include the main database configuration
require_once __DIR__ . '/../../includes/db.php';

/**
 * Get SuperAdmin database connection
 * Uses the same PDO connection but with SuperAdmin context
 */
function getSuperAdminDB() {
    global $pdo;
    return $pdo;
}

/**
 * Initialize SuperAdmin database tables if they don't exist
 */
function initializeSuperAdminTables() {
    $pdo = getSuperAdminDB();
    
    try {
        // Create chat_sessions table if it doesn't exist
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id VARCHAR(100) UNIQUE NOT NULL,
                visitor_name VARCHAR(255) NOT NULL,
                visitor_email VARCHAR(255) NOT NULL,
                visitor_phone VARCHAR(50),
                visitor_ip VARCHAR(45),
                user_agent TEXT,
                page_url TEXT,
                status ENUM('waiting', 'active', 'closed') DEFAULT 'waiting',
                priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
                assigned_admin VARCHAR(100),
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                ended_at TIMESTAMP NULL,
                last_read_at TIMESTAMP NULL,
                INDEX idx_status (status),
                INDEX idx_session_id (session_id),
                INDEX idx_visitor_email (visitor_email),
                INDEX idx_assigned_admin (assigned_admin)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        // Create chat_messages table if it doesn't exist
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS chat_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id VARCHAR(100) NOT NULL,
                sender_type ENUM('visitor', 'admin', 'system') NOT NULL,
                sender_name VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                message_type ENUM('text', 'system', 'file') DEFAULT 'text',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_read BOOLEAN DEFAULT FALSE,
                INDEX idx_session_id (session_id),
                INDEX idx_created_at (created_at),
                FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        // Create chat_queue table if it doesn't exist
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS chat_queue (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id VARCHAR(100) NOT NULL,
                queue_position INT NOT NULL,
                estimated_wait_time INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_session_id (session_id),
                INDEX idx_queue_position (queue_position),
                FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        // Create complaints table if it doesn't exist
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS complaints (
                id INT AUTO_INCREMENT PRIMARY KEY,
                complaint_id VARCHAR(20) UNIQUE NOT NULL,
                visitor_name VARCHAR(255) NOT NULL,
                visitor_email VARCHAR(255) NOT NULL,
                visitor_phone VARCHAR(50),
                company_name VARCHAR(255),
                complaint_type VARCHAR(100) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
                status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
                assigned_to VARCHAR(100),
                attachments JSON,
                ip_address VARCHAR(45),
                user_agent TEXT,
                source_page VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP NULL,
                admin_notes TEXT,
                INDEX idx_complaint_id (complaint_id),
                INDEX idx_status (status),
                INDEX idx_priority (priority),
                INDEX idx_visitor_email (visitor_email),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        
        return true;
    } catch (Exception $e) {
        error_log("SuperAdmin DB initialization error: " . $e->getMessage());
        return false;
    }
}

// Initialize tables on first load
initializeSuperAdminTables();
?>