<?php
/**
 * State Management Module
 * Handles conversation state, context tracking, and multi-step workflows
 */

class StateManager {
    private $pdo;
    private $companyId;
    private $userId;
    private $sessionId;
    
    // State types
    const STATE_IDLE = 'idle';
    const STATE_AWAITING_CONFIRMATION = 'awaiting_confirmation';
    const STATE_AWAITING_CLARIFICATION = 'awaiting_clarification';
    const STATE_EXECUTING = 'executing';
    const STATE_MULTI_STEP = 'multi_step';
    const STATE_ERROR = 'error';
    
    public function __construct($pdo, $companyId, $userId) {
        $this->pdo = $pdo;
        $this->companyId = $companyId;
        $this->userId = $userId;
        $this->sessionId = session_id();
    }
    
    /**
     * Get current conversation state
     */
    public function getState() {
        $stmt = $this->pdo->prepare("
            SELECT state_data, state_type, updated_at 
            FROM ai_conversation_state 
            WHERE company_id = ? AND user_id = ? AND session_id = ?
            ORDER BY updated_at DESC 
            LIMIT 1
        ");
        $stmt->execute([$this->companyId, $this->userId, $this->sessionId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result) {
            return [
                'type' => $result['state_type'],
                'data' => json_decode($result['state_data'], true),
                'timestamp' => $result['updated_at']
            ];
        }
        
        return [
            'type' => self::STATE_IDLE,
            'data' => [],
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Save conversation state
     */
    public function saveState($stateType, $stateData) {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO ai_conversation_state 
                (company_id, user_id, session_id, state_type, state_data, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
            ");
            
            $stmt->execute([
                $this->companyId,
                $this->userId,
                $this->sessionId,
                $stateType,
                json_encode($stateData)
            ]);
            
            return true;
        } catch (Exception $e) {
            error_log("Failed to save state: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Clear conversation state (reset to idle)
     */
    public function clearState() {
        try {
            $stmt = $this->pdo->prepare("
                DELETE FROM ai_conversation_state 
                WHERE company_id = ? AND user_id = ? AND session_id = ?
            ");
            $stmt->execute([$this->companyId, $this->userId, $this->sessionId]);
            return true;
        } catch (Exception $e) {
            error_log("Failed to clear state: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Check if awaiting user response
     */
    public function isAwaitingResponse() {
        $state = $this->getState();
        return in_array($state['type'], [
            self::STATE_AWAITING_CONFIRMATION,
            self::STATE_AWAITING_CLARIFICATION
        ]);
    }
    
    /**
     * Get pending task from state
     */
    public function getPendingTask() {
        $state = $this->getState();
        
        if ($state['type'] === self::STATE_AWAITING_CONFIRMATION) {
            return $state['data']['pending_task'] ?? null;
        }
        
        return null;
    }
    
    /**
     * Create confirmation state
     */
    public function createConfirmationState($intent, $data, $riskAssessment, $message) {
        return $this->saveState(self::STATE_AWAITING_CONFIRMATION, [
            'pending_task' => [
                'intent' => $intent,
                'data' => $data,
                'risk' => $riskAssessment,
                'message' => $message
            ],
            'created_at' => time(),
            'expires_at' => time() + 300 // 5 minutes
        ]);
    }
    
    /**
     * Create clarification state
     */
    public function createClarificationState($intent, $data, $missingFields, $message) {
        return $this->saveState(self::STATE_AWAITING_CLARIFICATION, [
            'intent' => $intent,
            'partial_data' => $data,
            'missing_fields' => $missingFields,
            'clarification_message' => $message,
            'created_at' => time()
        ]);
    }
    
    /**
     * Create multi-step workflow state
     */
    public function createMultiStepState($workflow, $currentStep, $collectedData) {
        return $this->saveState(self::STATE_MULTI_STEP, [
            'workflow' => $workflow,
            'current_step' => $currentStep,
            'total_steps' => count($workflow['steps']),
            'collected_data' => $collectedData,
            'started_at' => time()
        ]);
    }
    
    /**
     * Check if state is expired
     */
    public function isStateExpired() {
        $state = $this->getState();
        
        if (isset($state['data']['expires_at'])) {
            return time() > $state['data']['expires_at'];
        }
        
        // Default expiration: 10 minutes
        $timestamp = strtotime($state['timestamp']);
        return (time() - $timestamp) > 600;
    }
    
    /**
     * Get conversation context (recent history)
     */
    public function getConversationContext($limit = 5) {
        $stmt = $this->pdo->prepare("
            SELECT state_type, state_data, created_at 
            FROM ai_conversation_state 
            WHERE company_id = ? AND user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        ");
        $stmt->execute([$this->companyId, $this->userId, $limit]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Clean up old states (housekeeping)
     */
    public function cleanupOldStates() {
        try {
            $stmt = $this->pdo->prepare("
                DELETE FROM ai_conversation_state 
                WHERE company_id = ? 
                AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ");
            $stmt->execute([$this->companyId]);
            return true;
        } catch (Exception $e) {
            error_log("Failed to cleanup old states: " . $e->getMessage());
            return false;
        }
    }
}

/**
 * Context Tracker - Tracks entities and references across conversation
 */
class ContextTracker {
    private $context = [];
    
    /**
     * Add entity to context
     */
    public function addEntity($type, $id, $data) {
        if (!isset($this->context['entities'])) {
            $this->context['entities'] = [];
        }
        
        $this->context['entities'][$type] = [
            'id' => $id,
            'data' => $data,
            'referenced_at' => time()
        ];
    }
    
    /**
     * Get entity from context
     */
    public function getEntity($type) {
        return $this->context['entities'][$type] ?? null;
    }
    
    /**
     * Get last referenced customer
     */
    public function getLastCustomer() {
        return $this->getEntity('customer');
    }
    
    /**
     * Get last referenced product
     */
    public function getLastProduct() {
        return $this->getEntity('product');
    }
    
    /**
     * Get last referenced invoice
     */
    public function getLastInvoice() {
        return $this->getEntity('invoice');
    }
    
    /**
     * Set current intent
     */
    public function setCurrentIntent($intent, $data) {
        $this->context['current_intent'] = [
            'intent' => $intent,
            'data' => $data,
            'timestamp' => time()
        ];
    }
    
    /**
     * Get full context
     */
    public function getContext() {
        return $this->context;
    }
    
    /**
     * Clear context
     */
    public function clearContext() {
        $this->context = [];
    }
}

/**
 * Helper function to create state manager instance
 */
function createStateManager($pdo, $companyId, $userId) {
    return new StateManager($pdo, $companyId, $userId);
}

/**
 * Helper function to create context tracker instance
 */
function createContextTracker() {
    return new ContextTracker();
}
