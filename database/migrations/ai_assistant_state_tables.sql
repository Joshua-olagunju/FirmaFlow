-- AI Assistant State Management Tables
-- Migration for conversation state tracking

-- Conversation state table (without foreign key to avoid constraint issues)
CREATE TABLE IF NOT EXISTS `ai_conversation_state` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `session_id` varchar(255) NOT NULL,
  `state_type` enum('idle','awaiting_confirmation','awaiting_clarification','executing','multi_step','error') DEFAULT 'idle',
  `state_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_company_user` (`company_id`,`user_id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- AI action logs table (if not exists)
CREATE TABLE IF NOT EXISTS `ai_assistant_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `intent` varchar(100) NOT NULL,
  `input_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `output_result` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `confidence` decimal(3,2) DEFAULT NULL,
  `risk_level` enum('low','medium','high') DEFAULT 'medium',
  `execution_time_ms` int(11) DEFAULT NULL,
  `status` enum('success','error','partial') DEFAULT 'success',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_company` (`company_id`),
  KEY `idx_intent` (`intent`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS `idx_state_type` ON `ai_conversation_state` (`state_type`);
CREATE INDEX IF NOT EXISTS `idx_log_status` ON `ai_assistant_logs` (`status`);

-- Example queries for testing:

-- Get active states for a company
-- SELECT * FROM ai_conversation_state WHERE company_id = 1 AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR);

-- Get AI action logs for analytics
-- SELECT intent, COUNT(*) as count, AVG(confidence) as avg_confidence, AVG(execution_time_ms) as avg_time
-- FROM ai_assistant_logs 
-- WHERE company_id = 1 
-- GROUP BY intent 
-- ORDER BY count DESC;

-- Cleanup old states (run periodically)
-- DELETE FROM ai_conversation_state WHERE created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR);
