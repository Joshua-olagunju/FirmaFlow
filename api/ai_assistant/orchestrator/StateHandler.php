<?php
/**
 * FSM STATE HANDLER MODULE
 * 
 * Manages all FSM state transitions.
 * 
 * KEY PRINCIPLE: State transitions are CODE-OWNED.
 * The AI never decides state changes - only PHP code does.
 * 
 * States: IDLE → INTENT_DETECTED → DATA_EXTRACTED → AWAITING_CONFIRMATION → EXECUTING → COMPLETED
 */

namespace FirmaFlow\AIOrchestrator;

class StateHandler {
    
    private $pdo;
    private $companyId;
    private $userId;
    private $sessionId;
    
    // State timeout in seconds (15 minutes)
    const STATE_TIMEOUT = 900;
    
    public function __construct($pdo, $companyId, $userId) {
        $this->pdo = $pdo;
        $this->companyId = $companyId;
        $this->userId = $userId;
        $this->sessionId = session_id() ?: 'default';
    }
    
    /**
     * Transition to new state
     */
    public function transitionTo(string $newState, array $contextData = [], string $reason = ''): void {
        // Get current state
        $current = $this->getCurrentState();
        
        // Validate transition
        if (!$this->isValidTransition($current['state'], $newState)) {
            error_log("Invalid state transition: {$current['state']} -> {$newState}");
            // Force reset on invalid transition
            $this->resetToIdle("Invalid transition from {$current['state']}");
            return;
        }
        
        // Merge context data
        $mergedContext = array_merge($current['contextData'], $contextData);
        $mergedContext['transitionHistory'][] = [
            'from' => $current['state'],
            'to' => $newState,
            'reason' => $reason,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        // Limit history
        if (count($mergedContext['transitionHistory'] ?? []) > 10) {
            $mergedContext['transitionHistory'] = array_slice(
                $mergedContext['transitionHistory'], -10
            );
        }
        
        $this->saveState($newState, $mergedContext);
        
        error_log("State transition: {$current['state']} -> {$newState} ({$reason})");
    }
    
    /**
     * Reset to IDLE state
     */
    public function resetToIdle(string $reason = ''): void {
        $this->saveState(\FSM::STATE_IDLE, [
            'resetReason' => $reason,
            'resetTime' => date('Y-m-d H:i:s'),
            'taskQueue' => [],
            'currentTask' => null
        ]);
        
        // Clear session-based offered actions
        WorldState::clearLastOfferedActions();
        
        error_log("State reset to IDLE: {$reason}");
    }
    
    /**
     * Handle cancel command
     */
    public function handleCancel(): array {
        $this->resetToIdle('User cancelled');
        
        return ResponseBuilder::cancelled(
            'Alright, I\'ve cancelled the current action. What would you like to do instead?'
        );
    }
    
    /**
     * Get current state
     */
    public function getCurrentState(): array {
        try {
            $stmt = $this->pdo->prepare("
                SELECT state, context_data, last_activity
                FROM ai_fsm_state
                WHERE company_id = ? AND user_id = ? AND session_id = ?
            ");
            $stmt->execute([$this->companyId, $this->userId, $this->sessionId]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if ($row) {
                // Check for timeout
                $lastActivity = strtotime($row['last_activity']);
                if ((time() - $lastActivity) > self::STATE_TIMEOUT) {
                    $this->resetToIdle('Session timeout');
                    return [
                        'state' => \FSM::STATE_IDLE,
                        'contextData' => []
                    ];
                }
                
                return [
                    'state' => $row['state'],
                    'contextData' => json_decode($row['context_data'], true) ?? []
                ];
            }
            
            return [
                'state' => \FSM::STATE_IDLE,
                'contextData' => []
            ];
            
        } catch (\Exception $e) {
            error_log("StateHandler getCurrentState error: " . $e->getMessage());
            return [
                'state' => \FSM::STATE_IDLE,
                'contextData' => []
            ];
        }
    }
    
    /**
     * Save state to database
     */
    private function saveState(string $state, array $contextData): void {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO ai_fsm_state (company_id, user_id, session_id, state, context_data, last_activity)
                VALUES (?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE state = ?, context_data = ?, last_activity = NOW()
            ");
            
            $contextJson = json_encode($contextData);
            
            $stmt->execute([
                $this->companyId,
                $this->userId,
                $this->sessionId,
                $state,
                $contextJson,
                $state,
                $contextJson
            ]);
            
        } catch (\Exception $e) {
            error_log("StateHandler saveState error: " . $e->getMessage());
        }
    }
    
    /**
     * Check if state transition is valid
     */
    private function isValidTransition(string $from, string $to): bool {
        $validTransitions = [
            \FSM::STATE_IDLE => [
                \FSM::STATE_INTENT_DETECTED,
                \FSM::STATE_IDLE // self-loop for greetings
            ],
            \FSM::STATE_INTENT_DETECTED => [
                \FSM::STATE_DATA_EXTRACTED,
                \FSM::STATE_AWAITING_CONFIRMATION,
                \FSM::STATE_EXECUTING,
                \FSM::STATE_IDLE, // cancel
                \FSM::STATE_FAILED,
                \FSM::STATE_INTENT_DETECTED // self-loop for showing new selection/clearing pending
            ],
            \FSM::STATE_DATA_EXTRACTED => [
                \FSM::STATE_AWAITING_CONFIRMATION,
                \FSM::STATE_EXECUTING,
                \FSM::STATE_IDLE, // cancel
                \FSM::STATE_FAILED
            ],
            \FSM::STATE_AWAITING_CONFIRMATION => [
                \FSM::STATE_EXECUTING,
                \FSM::STATE_INTENT_DETECTED, // modify
                \FSM::STATE_IDLE, // cancel
                \FSM::STATE_FAILED
            ],
            \FSM::STATE_EXECUTING => [
                \FSM::STATE_COMPLETED,
                \FSM::STATE_FAILED,
                \FSM::STATE_IDLE // error recovery
            ],
            \FSM::STATE_COMPLETED => [
                \FSM::STATE_IDLE,
                \FSM::STATE_INTENT_DETECTED // next task
            ],
            \FSM::STATE_FAILED => [
                \FSM::STATE_IDLE,
                \FSM::STATE_INTENT_DETECTED // retry
            ]
        ];
        
        return in_array($to, $validTransitions[$from] ?? [\FSM::STATE_IDLE]);
    }
    
    /**
     * Set task queue
     */
    public function setTaskQueue(array $queue): void {
        $current = $this->getCurrentState();
        $current['contextData']['taskQueue'] = $queue;
        
        if (!empty($queue)) {
            $current['contextData']['currentTask'] = $queue[0];
            $current['contextData']['currentTaskIndex'] = 0;
        }
        
        $this->saveState($current['state'], $current['contextData']);
    }
    
    /**
     * Get current task
     */
    public function getCurrentTask(): ?array {
        $state = $this->getCurrentState();
        return $state['contextData']['currentTask'] ?? null;
    }
    
    /**
     * Check if more tasks in queue
     */
    public function hasMoreTasks(): bool {
        $state = $this->getCurrentState();
        $queue = $state['contextData']['taskQueue'] ?? [];
        $index = $state['contextData']['currentTaskIndex'] ?? 0;
        
        return ($index + 1) < count($queue);
    }
    
    /**
     * Complete current task and check for next
     */
    public function completeCurrentTask(): void {
        $current = $this->getCurrentState();
        $index = $current['contextData']['currentTaskIndex'] ?? 0;
        
        // Mark task as completed
        if (isset($current['contextData']['taskQueue'][$index])) {
            $current['contextData']['taskQueue'][$index]['completed'] = true;
            $current['contextData']['taskQueue'][$index]['completedAt'] = date('Y-m-d H:i:s');
        }
        
        $this->saveState($current['state'], $current['contextData']);
    }
    
    /**
     * Advance to next task in queue
     */
    public function advanceToNextTask(): void {
        $current = $this->getCurrentState();
        $queue = $current['contextData']['taskQueue'] ?? [];
        $index = ($current['contextData']['currentTaskIndex'] ?? 0) + 1;
        
        if ($index < count($queue)) {
            $current['contextData']['currentTaskIndex'] = $index;
            $current['contextData']['currentTask'] = $queue[$index];
        } else {
            $current['contextData']['currentTask'] = null;
        }
        
        $this->saveState($current['state'], $current['contextData']);
    }
    
    /**
     * Get FSM state name (for debugging)
     */
    public static function getStateName(string $state): string {
        $names = [
            \FSM::STATE_IDLE => 'Idle',
            \FSM::STATE_INTENT_DETECTED => 'Intent Detected',
            \FSM::STATE_DATA_EXTRACTED => 'Data Extracted',
            \FSM::STATE_AWAITING_CONFIRMATION => 'Awaiting Confirmation',
            \FSM::STATE_EXECUTING => 'Executing',
            \FSM::STATE_COMPLETED => 'Completed',
            \FSM::STATE_FAILED => 'Failed'
        ];
        
        return $names[$state] ?? 'Unknown';
    }
}
