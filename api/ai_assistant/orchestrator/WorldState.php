<?php
/**
 * JEPA-STYLE WORLD STATE MODULE
 * 
 * Builds a snapshot of the current system state for AI reasoning.
 * 
 * The AI receives this "world model" to understand context before reasoning.
 * This enables better intent understanding and reduces hallucinations.
 * 
 * World State includes:
 * - Current FSM state
 * - Current task being worked on
 * - Recent conversation history
 * - Business context (customer counts, recent activity)
 * - Last offered actions (for follow-up handling)
 */

namespace FirmaFlow\AIOrchestrator;

class WorldState {
    
    private $pdo;
    private $companyId;
    private $userId;
    private $sessionId;
    
    public function __construct($pdo, $companyId, $userId) {
        $this->pdo = $pdo;
        $this->companyId = $companyId;
        $this->userId = $userId;
        $this->sessionId = session_id() ?: 'default';
    }
    
    /**
     * Get complete world state snapshot
     * 
     * This is the "JEPA world model" - everything the AI needs
     * to understand the current context before reasoning.
     */
    public function getSnapshot(): array {
        return [
            'fsmState' => $this->getFSMState(),
            'currentTask' => $this->getCurrentTask(),
            'taskQueue' => $this->getTaskQueue(),
            'businessContext' => $this->getBusinessContext(),
            'lastOfferedActions' => $this->getLastOfferedActions(),
            'recentActivity' => $this->getRecentActivity(),
            'timestamp' => date('Y-m-d H:i:s'),
            'companyId' => $this->companyId,
            'userId' => $this->userId
        ];
    }
    
    /**
     * Get summarized world state for AI prompt
     * 
     * Condensed version optimized for AI context window
     */
    public function getSummaryForAI(): string {
        $snapshot = $this->getSnapshot();
        
        $summary = "## Current World State\n\n";
        
        // FSM State
        $summary .= "### System State\n";
        $summary .= "- FSM State: {$snapshot['fsmState']['state']}\n";
        
        // Current Task
        if ($snapshot['currentTask']) {
            $summary .= "- Current Task: {$snapshot['currentTask']['module']}.{$snapshot['currentTask']['action']}\n";
        } else {
            $summary .= "- Current Task: None (ready for new request)\n";
        }
        
        // Task Queue
        if (!empty($snapshot['taskQueue'])) {
            $summary .= "- Pending Tasks: " . count($snapshot['taskQueue']) . "\n";
        }
        
        // Business Context
        $bc = $snapshot['businessContext'];
        $summary .= "\n### Business Context\n";
        $summary .= "- Customers: {$bc['counts']['customers']}\n";
        $summary .= "- Suppliers: {$bc['counts']['suppliers']}\n";
        $summary .= "- Products: {$bc['counts']['products']}\n";
        
        // Recent Activity
        if (!empty($snapshot['recentActivity'])) {
            $summary .= "\n### Recent Activity\n";
            foreach (array_slice($snapshot['recentActivity'], 0, 3) as $activity) {
                $summary .= "- {$activity}\n";
            }
        }
        
        // Last Offered Actions
        if (!empty($snapshot['lastOfferedActions'])) {
            $summary .= "\n### Recently Discussed\n";
            foreach ($snapshot['lastOfferedActions'] as $action) {
                $summary .= "- {$action['description']}\n";
            }
        }
        
        return $summary;
    }
    
    /**
     * Get FSM state from database
     */
    private function getFSMState(): array {
        try {
            $stmt = $this->pdo->prepare("
                SELECT state, context_data, last_activity
                FROM ai_fsm_state
                WHERE company_id = ? AND user_id = ? AND session_id = ?
            ");
            $stmt->execute([$this->companyId, $this->userId, $this->sessionId]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if ($row) {
                return [
                    'state' => $row['state'],
                    'contextData' => json_decode($row['context_data'], true) ?? [],
                    'lastActivity' => $row['last_activity'],
                    'isStale' => $this->isStateStale($row['last_activity'])
                ];
            }
            
            return [
                'state' => \FSM::STATE_IDLE,
                'contextData' => [],
                'lastActivity' => null,
                'isStale' => false
            ];
        } catch (\Exception $e) {
            error_log("WorldState FSM fetch error: " . $e->getMessage());
            return [
                'state' => \FSM::STATE_IDLE,
                'contextData' => [],
                'lastActivity' => null,
                'isStale' => false
            ];
        }
    }
    
    /**
     * Check if state is stale (timeout)
     */
    private function isStateStale(?string $lastActivity): bool {
        if (!$lastActivity) return false;
        
        $timeout = 15 * 60; // 15 minutes
        $lastTime = strtotime($lastActivity);
        return (time() - $lastTime) > $timeout;
    }
    
    /**
     * Get current task from state context
     */
    private function getCurrentTask(): ?array {
        $fsmState = $this->getFSMState();
        return $fsmState['contextData']['currentTask'] ?? null;
    }
    
    /**
     * Get task queue from state context
     */
    private function getTaskQueue(): array {
        $fsmState = $this->getFSMState();
        return $fsmState['contextData']['taskQueue'] ?? [];
    }
    
    /**
     * Get business context (counts, recent records)
     */
    private function getBusinessContext(): array {
        return [
            'counts' => $this->getEntityCounts(),
            'hasData' => $this->hasBusinessData(),
            'currency' => $this->getCompanyCurrency(),
            'fiscalYear' => date('Y')
        ];
    }
    
    /**
     * Get entity counts for context
     */
    private function getEntityCounts(): array {
        $counts = [
            'customers' => 0,
            'suppliers' => 0,
            'products' => 0,
            'sales' => 0,
            'purchases' => 0,
            'expenses' => 0
        ];
        
        // Map logical names to actual table names
        $tableMap = [
            'customers' => 'customers',
            'suppliers' => 'suppliers', 
            'products' => 'products',
            'sales' => 'sales',
            'purchases' => 'purchase_bills',
            'expenses' => 'expenses'
        ];
        
        foreach ($tableMap as $entity => $table) {
            try {
                $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM {$table} WHERE company_id = ?");
                $stmt->execute([$this->companyId]);
                $counts[$entity] = (int)$stmt->fetchColumn();
            } catch (\Exception $e) {
                // Table might not exist, just continue
            }
        }
        
        return $counts;
    }
    
    /**
     * Check if company has any business data
     */
    private function hasBusinessData(): bool {
        $counts = $this->getEntityCounts();
        return array_sum($counts) > 0;
    }
    
    /**
     * Get company currency
     */
    private function getCompanyCurrency(): string {
        try {
            $stmt = $this->pdo->prepare("
                SELECT currency FROM companies WHERE id = ?
            ");
            $stmt->execute([$this->companyId]);
            return $stmt->fetchColumn() ?: 'USD';
        } catch (\Exception $e) {
            return 'USD';
        }
    }
    
    /**
     * Get last offered actions (for follow-up handling)
     */
    private function getLastOfferedActions(): array {
        return $_SESSION['ai_last_offered_actions'] ?? [];
    }
    
    /**
     * Save offered actions for follow-up
     */
    public static function setLastOfferedActions(array $actions): void {
        $_SESSION['ai_last_offered_actions'] = $actions;
    }
    
    /**
     * Clear offered actions
     */
    public static function clearLastOfferedActions(): void {
        $_SESSION['ai_last_offered_actions'] = [];
    }
    
    /**
     * Get recent activity for context
     */
    private function getRecentActivity(): array {
        $activity = [];
        
        try {
            // Recent customers
            $stmt = $this->pdo->prepare("
                SELECT name, created_at FROM customers 
                WHERE company_id = ? 
                ORDER BY created_at DESC LIMIT 2
            ");
            $stmt->execute([$this->companyId]);
            while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
                $activity[] = "Customer '{$row['name']}' created on " . date('M j', strtotime($row['created_at']));
            }
            
            // Recent sales
            $stmt = $this->pdo->prepare("
                SELECT id, total_amount, created_at FROM sales 
                WHERE company_id = ? 
                ORDER BY created_at DESC LIMIT 2
            ");
            $stmt->execute([$this->companyId]);
            while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
                $activity[] = "Sale #{$row['id']} for {$row['total_amount']} on " . date('M j', strtotime($row['created_at']));
            }
            
        } catch (\Exception $e) {
            error_log("WorldState activity error: " . $e->getMessage());
        }
        
        return $activity;
    }
    
    /**
     * Get entity details by name (for disambiguation)
     */
    public function findEntityByName(string $type, string $name): ?array {
        $table = $type . 's'; // customers, suppliers, products
        
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$table} 
                WHERE company_id = ? AND name LIKE ?
                ORDER BY name
                LIMIT 5
            ");
            $stmt->execute([$this->companyId, "%{$name}%"]);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return null;
        }
    }
    
    /**
     * Get specific entity by ID
     */
    public function getEntityById(string $type, int $id): ?array {
        $table = $type . 's';
        
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$table} WHERE company_id = ? AND id = ?
            ");
            $stmt->execute([$this->companyId, $id]);
            return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
        } catch (\Exception $e) {
            return null;
        }
    }
}
