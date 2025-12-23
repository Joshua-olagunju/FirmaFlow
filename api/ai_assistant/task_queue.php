<?php
/**
 * Task Queue Manager
 * 
 * PRODUCTION-GRADE TASK QUEUE SYSTEM
 * 
 * Handles multi-intent requests by splitting them into ordered tasks.
 * Executes ONE task at a time.
 * Clears AI context between tasks.
 * 
 * Task Structure:
 * {
 *   id: string,
 *   module: string,
 *   action: string,
 *   status: 'pending' | 'in_progress' | 'completed' | 'failed',
 *   priority: number,
 *   data: object,
 *   createdAt: timestamp,
 *   completedAt: timestamp | null,
 *   error: string | null
 * }
 */

class TaskQueue {
    
    /**
     * Create a new task
     */
    public static function createTask(string $module, string $action, array $data = [], int $priority = 0): array {
        return [
            'id' => self::generateTaskId(),
            'module' => $module,
            'action' => $action,
            'status' => 'pending',
            'priority' => $priority,
            'data' => $data,
            'createdAt' => date('Y-m-d H:i:s'),
            'completedAt' => null,
            'error' => null
        ];
    }
    
    /**
     * Build task queue from detected intents
     * 
     * @param array $intents Array of {intent, module, data, priority}
     * @return array Ordered task queue
     */
    public static function buildQueue(array $intents): array {
        $queue = [];
        
        // Sort by the Router's priority values (LOWER priority number = execute FIRST)
        // DO NOT use getActionPriority - respect Router's intent detection!
        usort($intents, function($a, $b) {
            $priorityA = $a['priority'] ?? 99;
            $priorityB = $b['priority'] ?? 99;
            return $priorityA - $priorityB;
        });
        
        foreach ($intents as $index => $intent) {
            $queue[] = self::createTask(
                $intent['module'],
                $intent['action'],
                $intent['data'] ?? [],
                $intent['priority'] ?? $index
            );
        }
        
        return $queue;
    }
    
    /**
     * Get priority for action ordering
     * Lower number = higher priority (executes first)
     */
    private static function getActionPriority(string $action): int {
        // Read operations first (less risk)
        $readActions = [
            'view_', 'list_', 'get_', 'show_', 'check_', 
            'search_', 'query_', 'summary', 'analytics', 'analysis'
        ];
        
        foreach ($readActions as $prefix) {
            if (strpos($action, $prefix) === 0 || strpos($action, $prefix) !== false) {
                return 1; // High priority (execute first)
            }
        }
        
        // Create operations
        if (strpos($action, 'create_') === 0 || strpos($action, 'add_') === 0) {
            return 2;
        }
        
        // Update operations
        if (strpos($action, 'update_') === 0 || strpos($action, 'edit_') === 0) {
            return 3;
        }
        
        // Delete/Dangerous operations last
        if (strpos($action, 'delete_') === 0 || strpos($action, 'remove_') === 0) {
            return 5;
        }
        
        // Payment/Financial operations
        if (strpos($action, 'payment') !== false || strpos($action, 'approve') !== false) {
            return 4;
        }
        
        return 3; // Default priority
    }
    
    /**
     * Validate task queue structure
     */
    public static function validateQueue(array $queue): array {
        $errors = [];
        
        foreach ($queue as $index => $task) {
            if (empty($task['module'])) {
                $errors[] = "Task {$index}: Missing module";
            }
            if (empty($task['action'])) {
                $errors[] = "Task {$index}: Missing action";
            }
            if (!in_array($task['status'] ?? '', ['pending', 'in_progress', 'completed', 'failed'])) {
                $errors[] = "Task {$index}: Invalid status";
            }
        }
        
        return [
            'isValid' => empty($errors),
            'errors' => $errors
        ];
    }
    
    /**
     * Get task by ID from queue
     */
    public static function getTask(array $queue, string $taskId): ?array {
        foreach ($queue as $task) {
            if ($task['id'] === $taskId) {
                return $task;
            }
        }
        return null;
    }
    
    /**
     * Update task in queue
     */
    public static function updateTask(array $queue, string $taskId, array $updates): array {
        foreach ($queue as $index => $task) {
            if ($task['id'] === $taskId) {
                $queue[$index] = array_merge($task, $updates);
                break;
            }
        }
        return $queue;
    }
    
    /**
     * Mark task as completed
     */
    public static function markCompleted(array $queue, string $taskId, array $result = []): array {
        return self::updateTask($queue, $taskId, [
            'status' => 'completed',
            'completedAt' => date('Y-m-d H:i:s'),
            'result' => $result
        ]);
    }
    
    /**
     * Mark task as failed
     */
    public static function markFailed(array $queue, string $taskId, string $error): array {
        return self::updateTask($queue, $taskId, [
            'status' => 'failed',
            'completedAt' => date('Y-m-d H:i:s'),
            'error' => $error
        ]);
    }
    
    /**
     * Get pending tasks count
     */
    public static function getPendingCount(array $queue): int {
        return count(array_filter($queue, fn($t) => $t['status'] === 'pending'));
    }
    
    /**
     * Get completed tasks count
     */
    public static function getCompletedCount(array $queue): int {
        return count(array_filter($queue, fn($t) => $t['status'] === 'completed'));
    }
    
    /**
     * Check if all tasks are completed
     */
    public static function isQueueComplete(array $queue): bool {
        if (empty($queue)) return true;
        
        foreach ($queue as $task) {
            if ($task['status'] !== 'completed') {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Check if queue has failures
     */
    public static function hasFailures(array $queue): bool {
        foreach ($queue as $task) {
            if ($task['status'] === 'failed') {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Get queue summary for user display
     */
    public static function getQueueSummary(array $queue, int $currentIndex): array {
        $total = count($queue);
        $completed = self::getCompletedCount($queue);
        $current = $queue[$currentIndex] ?? null;
        
        return [
            'total' => $total,
            'completed' => $completed,
            'remaining' => $total - $completed,
            'progress' => $total > 0 ? round(($completed / $total) * 100) : 100,
            'currentTask' => $current ? [
                'module' => $current['module'],
                'action' => $current['action'],
                'description' => self::getTaskDescription($current)
            ] : null
        ];
    }
    
    /**
     * Get human-readable task description
     */
    public static function getTaskDescription(array $task): string {
        $action = str_replace('_', ' ', $task['action']);
        $action = ucwords($action);
        
        $descriptions = [
            'create_customer' => 'Creating new customer',
            'update_customer' => 'Updating customer information',
            'view_customer' => 'Viewing customer details',
            'customer_summary' => 'Getting customer summary',
            'add_product' => 'Adding new product',
            'update_product' => 'Updating product',
            'view_inventory' => 'Viewing inventory',
            'inventory_analysis' => 'Analyzing inventory',
            'create_invoice' => 'Creating invoice',
            'view_invoice' => 'Viewing invoice',
            'record_payment' => 'Recording payment',
            'sales_summary' => 'Getting sales summary',
            'add_expense' => 'Adding expense',
            'expense_summary' => 'Getting expense summary',
            'create_purchase_order' => 'Creating purchase order',
            'approve_supplier_payment' => 'Approving supplier payment',
            'generate_report' => 'Generating report'
        ];
        
        return $descriptions[$task['action']] ?? $action;
    }
    
    /**
     * Generate unique task ID
     */
    private static function generateTaskId(): string {
        return 'task_' . bin2hex(random_bytes(8));
    }
    
    /**
     * Serialize queue for storage
     */
    public static function serialize(array $queue): string {
        return json_encode($queue);
    }
    
    /**
     * Deserialize queue from storage
     */
    public static function deserialize(string $data): array {
        return json_decode($data, true) ?? [];
    }
}
