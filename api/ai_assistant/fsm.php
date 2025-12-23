<?php
/**
 * Finite State Machine (FSM)
 * 
 * PRODUCTION-GRADE STATE MANAGEMENT
 * 
 * This module owns ALL state transitions.
 * AI NEVER changes state - only CODE does.
 * 
 * Allowed States:
 * - IDLE: No active task
 * - INTENT_DETECTED: Intent parsed, awaiting data extraction
 * - DATA_EXTRACTED: Data ready, awaiting confirmation (if needed)
 * - AWAITING_CONFIRMATION: Waiting for user approval
 * - EXECUTING: Action being executed
 * - COMPLETED: Task finished successfully
 * - FAILED: Task failed, will reset to IDLE
 */

class FSM {
    // State constants - ONLY these states are allowed
    const STATE_IDLE = 'IDLE';
    const STATE_INTENT_DETECTED = 'INTENT_DETECTED';
    const STATE_DATA_EXTRACTED = 'DATA_EXTRACTED';
    const STATE_AWAITING_CONFIRMATION = 'AWAITING_CONFIRMATION';
    const STATE_EXECUTING = 'EXECUTING';
    const STATE_COMPLETED = 'COMPLETED';
    const STATE_FAILED = 'FAILED';
    
    // Valid state transitions (from => [allowed destinations])
    private static $transitions = [
        self::STATE_IDLE => [
            self::STATE_INTENT_DETECTED,
            self::STATE_IDLE // Reset always allowed
        ],
        self::STATE_INTENT_DETECTED => [
            self::STATE_DATA_EXTRACTED,
            self::STATE_EXECUTING, // READ-ONLY actions can skip data extraction
            self::STATE_FAILED,
            self::STATE_IDLE // Cancel allowed
        ],
        self::STATE_DATA_EXTRACTED => [
            self::STATE_AWAITING_CONFIRMATION,
            self::STATE_EXECUTING, // Direct execute for low-risk
            self::STATE_FAILED,
            self::STATE_IDLE
        ],
        self::STATE_AWAITING_CONFIRMATION => [
            self::STATE_EXECUTING, // User approved
            self::STATE_FAILED,    // User rejected
            self::STATE_IDLE       // User cancelled
        ],
        self::STATE_EXECUTING => [
            self::STATE_COMPLETED,
            self::STATE_FAILED,
            self::STATE_IDLE
        ],
        self::STATE_COMPLETED => [
            self::STATE_INTENT_DETECTED, // Next task in queue
            self::STATE_IDLE             // No more tasks
        ],
        self::STATE_FAILED => [
            self::STATE_IDLE // FAILED always goes to IDLE
        ]
    ];
    
    // Timeout in seconds for each state
    private static $stateTimeouts = [
        self::STATE_IDLE => 0, // No timeout
        self::STATE_INTENT_DETECTED => 30,
        self::STATE_DATA_EXTRACTED => 30,
        self::STATE_AWAITING_CONFIRMATION => 120, // 2 minutes for user
        self::STATE_EXECUTING => 60,
        self::STATE_COMPLETED => 5,
        self::STATE_FAILED => 5
    ];
    
    private $pdo;
    private $companyId;
    private $userId;
    private $sessionId;
    
    public function __construct($pdo, $companyId, $userId) {
        $this->pdo = $pdo;
        $this->companyId = $companyId;
        $this->userId = $userId;
        $this->sessionId = session_id();
    }
    
    /**
     * Get current FSM state from database
     */
    public function getState(): array {
        $stmt = $this->pdo->prepare("
            SELECT state, task_queue, current_task_index, context_data, 
                   created_at, updated_at, timeout_at
            FROM ai_fsm_state 
            WHERE company_id = ? AND user_id = ? AND session_id = ?
            LIMIT 1
        ");
        $stmt->execute([$this->companyId, $this->userId, $this->sessionId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            return $this->createInitialState();
        }
        
        // Check for timeout - reset inline to avoid recursion
        if ($result['timeout_at'] && strtotime($result['timeout_at']) < time()) {
            $this->logTransition($result['state'], self::STATE_IDLE, 'TIMEOUT');
            // Reset directly without calling resetToIdle() to avoid recursion
            $stmt = $this->pdo->prepare("
                UPDATE ai_fsm_state 
                SET state = ?, task_queue = '[]', current_task_index = 0, 
                    context_data = '{}', timeout_at = NULL, updated_at = NOW()
                WHERE company_id = ? AND user_id = ? AND session_id = ?
            ");
            $stmt->execute([self::STATE_IDLE, $this->companyId, $this->userId, $this->sessionId]);
            
            return [
                'state' => self::STATE_IDLE,
                'taskQueue' => [],
                'currentTaskIndex' => 0,
                'contextData' => [],
                'createdAt' => $result['created_at'],
                'updatedAt' => date('Y-m-d H:i:s'),
                'timeoutAt' => null
            ];
        }
        
        return [
            'state' => $result['state'],
            'taskQueue' => json_decode($result['task_queue'], true) ?? [],
            'currentTaskIndex' => (int)$result['current_task_index'],
            'contextData' => json_decode($result['context_data'], true) ?? [],
            'createdAt' => $result['created_at'],
            'updatedAt' => $result['updated_at'],
            'timeoutAt' => $result['timeout_at']
        ];
    }
    
    /**
     * Transition to a new state (CODE-OWNED)
     * 
     * @param string $newState Target state
     * @param array $data Optional data to store
     * @param string $reason Reason for transition (for logging)
     * @return array Updated state
     * @throws Exception if transition is invalid
     */
    public function transition(string $newState, array $data = [], string $reason = ''): array {
        $current = $this->getState();
        $currentState = $current['state'];
        
        // Validate transition
        if (!$this->isValidTransition($currentState, $newState)) {
            throw new Exception("Invalid state transition: {$currentState} → {$newState}");
        }
        
        // Log transition
        $this->logTransition($currentState, $newState, $reason);
        
        // Calculate timeout
        $timeout = self::$stateTimeouts[$newState] ?? 30;
        $timeoutAt = $timeout > 0 ? date('Y-m-d H:i:s', time() + $timeout) : null;
        
        // Merge context data
        $contextData = array_merge($current['contextData'], $data);
        
        // Update in database
        $stmt = $this->pdo->prepare("
            UPDATE ai_fsm_state 
            SET state = ?, context_data = ?, timeout_at = ?, updated_at = NOW()
            WHERE company_id = ? AND user_id = ? AND session_id = ?
        ");
        $stmt->execute([
            $newState,
            json_encode($contextData),
            $timeoutAt,
            $this->companyId,
            $this->userId,
            $this->sessionId
        ]);
        
        // Handle special states
        if ($newState === self::STATE_FAILED) {
            // FAILED always transitions to IDLE
            return $this->transition(self::STATE_IDLE, ['failureReason' => $reason], 'Auto-reset from FAILED');
        }
        
        return $this->getState();
    }
    
    /**
     * Set task queue
     */
    public function setTaskQueue(array $tasks): array {
        $current = $this->getState();
        
        $stmt = $this->pdo->prepare("
            UPDATE ai_fsm_state 
            SET task_queue = ?, current_task_index = 0, updated_at = NOW()
            WHERE company_id = ? AND user_id = ? AND session_id = ?
        ");
        $stmt->execute([
            json_encode($tasks),
            $this->companyId,
            $this->userId,
            $this->sessionId
        ]);
        
        return $this->getState();
    }
    
    /**
     * Get current task from queue
     */
    public function getCurrentTask(): ?array {
        $state = $this->getState();
        $index = $state['currentTaskIndex'];
        $queue = $state['taskQueue'];
        
        if (empty($queue) || $index >= count($queue)) {
            return null;
        }
        
        return $queue[$index];
    }
    
    /**
     * Mark current task as completed and advance index
     */
    public function completeCurrentTask(): array {
        $state = $this->getState();
        $queue = $state['taskQueue'];
        $index = $state['currentTaskIndex'];
        
        // Mark task completed
        if (isset($queue[$index])) {
            $queue[$index]['status'] = 'completed';
            $queue[$index]['completedAt'] = date('Y-m-d H:i:s');
        }
        
        // Advance index
        $newIndex = $index + 1;
        
        $stmt = $this->pdo->prepare("
            UPDATE ai_fsm_state 
            SET task_queue = ?, current_task_index = ?, updated_at = NOW()
            WHERE company_id = ? AND user_id = ? AND session_id = ?
        ");
        $stmt->execute([
            json_encode($queue),
            $newIndex,
            $this->companyId,
            $this->userId,
            $this->sessionId
        ]);
        
        return $this->getState();
    }
    
    /**
     * Check if more tasks remain
     */
    public function hasMoreTasks(): bool {
        $state = $this->getState();
        return $state['currentTaskIndex'] < count($state['taskQueue']);
    }
    
    /**
     * Reset to IDLE state (hard reset)
     */
    public function resetToIdle(string $reason = 'User requested reset'): array {
        // Get current state directly from DB to avoid recursion
        $stmt = $this->pdo->prepare("
            SELECT state FROM ai_fsm_state 
            WHERE company_id = ? AND user_id = ? AND session_id = ?
        ");
        $stmt->execute([$this->companyId, $this->userId, $this->sessionId]);
        $currentState = $stmt->fetchColumn() ?: self::STATE_IDLE;
        
        $this->logTransition($currentState, self::STATE_IDLE, $reason);
        
        $stmt = $this->pdo->prepare("
            UPDATE ai_fsm_state 
            SET state = ?, task_queue = '[]', current_task_index = 0, 
                context_data = '{}', timeout_at = NULL, updated_at = NOW()
            WHERE company_id = ? AND user_id = ? AND session_id = ?
        ");
        $stmt->execute([
            self::STATE_IDLE,
            $this->companyId,
            $this->userId,
            $this->sessionId
        ]);
        
        // Return state directly without calling getState()
        return [
            'state' => self::STATE_IDLE,
            'taskQueue' => [],
            'currentTaskIndex' => 0,
            'contextData' => [],
            'createdAt' => date('Y-m-d H:i:s'),
            'updatedAt' => date('Y-m-d H:i:s'),
            'timeoutAt' => null
        ];
    }
    
    /**
     * Clear AI context (between tasks)
     */
    public function clearAIContext(): void {
        $state = $this->getState();
        $contextData = $state['contextData'];
        
        // Remove AI-specific context, keep task data
        unset($contextData['aiResponse']);
        unset($contextData['lastPrompt']);
        unset($contextData['extractedData']);
        
        $stmt = $this->pdo->prepare("
            UPDATE ai_fsm_state 
            SET context_data = ?, updated_at = NOW()
            WHERE company_id = ? AND user_id = ? AND session_id = ?
        ");
        $stmt->execute([
            json_encode($contextData),
            $this->companyId,
            $this->userId,
            $this->sessionId
        ]);
    }
    
    /**
     * Store context data
     */
    public function setContextData(array $data): void {
        $state = $this->getState();
        $contextData = array_merge($state['contextData'], $data);
        
        $stmt = $this->pdo->prepare("
            UPDATE ai_fsm_state 
            SET context_data = ?, updated_at = NOW()
            WHERE company_id = ? AND user_id = ? AND session_id = ?
        ");
        $stmt->execute([
            json_encode($contextData),
            $this->companyId,
            $this->userId,
            $this->sessionId
        ]);
    }
    
    /**
     * Check if transition is valid
     */
    private function isValidTransition(string $from, string $to): bool {
        // IDLE can always be reached (emergency reset)
        if ($to === self::STATE_IDLE) {
            return true;
        }
        
        return isset(self::$transitions[$from]) && 
               in_array($to, self::$transitions[$from]);
    }
    
    /**
     * Create initial state record
     */
    private function createInitialState(): array {
        $stmt = $this->pdo->prepare("
            INSERT INTO ai_fsm_state 
            (company_id, user_id, session_id, state, task_queue, current_task_index, context_data, created_at, updated_at)
            VALUES (?, ?, ?, ?, '[]', 0, '{}', NOW(), NOW())
            ON DUPLICATE KEY UPDATE updated_at = NOW()
        ");
        $stmt->execute([
            $this->companyId,
            $this->userId,
            $this->sessionId,
            self::STATE_IDLE
        ]);
        
        return [
            'state' => self::STATE_IDLE,
            'taskQueue' => [],
            'currentTaskIndex' => 0,
            'contextData' => [],
            'createdAt' => date('Y-m-d H:i:s'),
            'updatedAt' => date('Y-m-d H:i:s'),
            'timeoutAt' => null
        ];
    }
    
    /**
     * Log state transition for debugging
     */
    private function logTransition(string $from, string $to, string $reason): void {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO ai_fsm_log 
                (company_id, user_id, session_id, from_state, to_state, reason, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $this->companyId,
                $this->userId,
                $this->sessionId,
                $from,
                $to,
                $reason
            ]);
        } catch (Exception $e) {
            error_log("FSM Log Error: " . $e->getMessage());
        }
    }
    
    /**
     * Get all valid states
     */
    public static function getAllStates(): array {
        return [
            self::STATE_IDLE,
            self::STATE_INTENT_DETECTED,
            self::STATE_DATA_EXTRACTED,
            self::STATE_AWAITING_CONFIRMATION,
            self::STATE_EXECUTING,
            self::STATE_COMPLETED,
            self::STATE_FAILED
        ];
    }
    
    /**
     * Check if action requires confirmation based on risk
     */
    public static function requiresConfirmation(string $module, string $action): bool {
        $riskyActions = [
            'inventory' => ['add_product', 'update_product', 'adjust_stock', 'add_multiple_products'],
            'payments' => ['approve_supplier_payment', 'record_payment'],
            'purchases' => ['create_purchase_order', 'receive_goods'],
            'sales' => ['create_invoice', 'update_invoice', 'record_payment'],
            'customers' => ['create_customer', 'update_customer', 'delete_customer'],
            'suppliers' => ['create_supplier', 'update_supplier'],
            'expenses' => ['add_expense', 'update_expense'],
            'settings' => ['create_tax', 'update_tax', 'update_settings']
        ];
        
        return isset($riskyActions[$module]) && in_array($action, $riskyActions[$module]);
    }
}
