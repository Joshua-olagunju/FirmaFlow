-- ================================================
-- AI FSM STATE MANAGEMENT TABLES
-- ================================================
-- Run this migration to set up the FSM infrastructure
-- ================================================

-- FSM State Table
CREATE TABLE IF NOT EXISTS ai_fsm_state (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    user_id INT NOT NULL,
    session_id VARCHAR(128) NOT NULL,
    state ENUM('IDLE', 'INTENT_DETECTED', 'DATA_EXTRACTED', 'AWAITING_CONFIRMATION', 'EXECUTING', 'COMPLETED', 'FAILED') DEFAULT 'IDLE',
    task_queue JSON DEFAULT '[]',
    current_task_index INT DEFAULT 0,
    context_data JSON DEFAULT '{}',
    timeout_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_session (company_id, user_id, session_id),
    INDEX idx_company_user (company_id, user_id),
    INDEX idx_state (state),
    INDEX idx_timeout (timeout_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FSM Transition Log (for debugging)
CREATE TABLE IF NOT EXISTS ai_fsm_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    user_id INT NOT NULL,
    session_id VARCHAR(128) NOT NULL,
    from_state VARCHAR(50) NOT NULL,
    to_state VARCHAR(50) NOT NULL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_company_user_session (company_id, user_id, session_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Task Execution Log
CREATE TABLE IF NOT EXISTS ai_task_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    user_id INT NOT NULL,
    session_id VARCHAR(128) NOT NULL,
    task_id VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    input_data JSON,
    output_data JSON,
    status ENUM('pending', 'in_progress', 'completed', 'failed') DEFAULT 'pending',
    error_message TEXT,
    execution_time_ms INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME DEFAULT NULL,
    
    INDEX idx_company_user (company_id, user_id),
    INDEX idx_task (task_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cleanup old state entries (run periodically)
-- DELETE FROM ai_fsm_state WHERE updated_at < DATE_SUB(NOW(), INTERVAL 24 HOUR);
-- DELETE FROM ai_fsm_log WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
-- DELETE FROM ai_task_log WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
