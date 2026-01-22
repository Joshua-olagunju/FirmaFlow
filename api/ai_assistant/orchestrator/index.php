<?php
/**
 * MODULAR ORCHESTRATOR - MAIN ENTRY POINT
 * 
 * This is the slim coordinator that delegates to specialized modules.
 * 
 * JEPA-STYLE ARCHITECTURE:
 * The AI receives a "world state" summary and predicts next states.
 * PHP code remains authoritative - AI only suggests, code decides.
 * 
 * MODULES:
 * - WorldState: Current system state snapshot (JEPA world model)
 * - AIReasoner: JEPA-style prediction and understanding
 * - StateHandler: FSM state transition logic
 * - TaskExecutor: Action execution
 * - ResponseBuilder: Format responses for frontend
 * - FormBuilder: Build form configurations
 * - ValidationEngine: Data validation
 * 
 * @version 4.0 (JEPA-Integrated Modular Architecture)
 */

namespace FirmaFlow\AIOrchestrator;

// Load all modules
require_once __DIR__ . '/WorldState.php';
require_once __DIR__ . '/AIReasoner.php';
require_once __DIR__ . '/StateHandler.php';
require_once __DIR__ . '/TaskExecutor.php';
require_once __DIR__ . '/ResponseBuilder.php';
require_once __DIR__ . '/FormBuilder.php';
require_once __DIR__ . '/ValidationEngine.php';
require_once __DIR__ . '/DataQueryHandler.php';
require_once __DIR__ . '/FollowUpHandler.php';
require_once __DIR__ . '/BusinessIntelligence.php';

// Load external dependencies
require_once __DIR__ . '/../fsm.php';
require_once __DIR__ . '/../task_queue.php';
require_once __DIR__ . '/../router.php';
require_once __DIR__ . '/../prompt_loader.php';

/**
 * Main Orchestrator Class
 * 
 * Thin coordinator - delegates all work to specialized modules
 */
class Orchestrator {
    
    private $pdo;
    private $companyId;
    private $userId;
    private $apiKey;
    private $conversationHistory;
    
    // Modules
    private $worldState;
    private $aiReasoner;
    private $stateHandler;
    private $taskExecutor;
    
    // Confidence thresholds
    const MIN_CONFIDENCE_TO_PROCEED = 0.7;
    const MIN_CONFIDENCE_FOR_AUTO_EXECUTE = 0.9;
    
    public function __construct($pdo, $companyId, $userId, $apiKey, $conversationHistory = []) {
        $this->pdo = $pdo;
        $this->companyId = $companyId;
        $this->userId = $userId;
        $this->apiKey = $apiKey;
        $this->conversationHistory = $conversationHistory;
        
        // Initialize modules
        $this->worldState = new WorldState($pdo, $companyId, $userId);
        $this->aiReasoner = new AIReasoner($apiKey, $conversationHistory);
        $this->stateHandler = new StateHandler($pdo, $companyId, $userId);
        $this->taskExecutor = new TaskExecutor($pdo, $companyId, $userId);
    }
    
    /**
     * MAIN ENTRY POINT
     * 
     * Process user message through JEPA-style flow:
     * 1. Build world state snapshot
     * 2. AI reasons about intent and next state
     * 3. Code validates and decides
     * 4. Execute if appropriate
     */
    public function processMessage(string $message): array {
        try {
            // STEP 1: Build current world state (JEPA world model)
            $worldSnapshot = $this->worldState->getSnapshot();
            
            // STEP 2: Check for cancel/reset
            if (\Router::isCancelCommand($message)) {
                return $this->stateHandler->handleCancel();
            }
            
            // STEP 3: Fast-path check (skip AI for common patterns)
            $fastPathResult = DataQueryHandler::tryFastPath(
                $message, 
                $this->pdo, 
                $this->companyId, 
                $this->userId
            );
            if ($fastPathResult !== null) {
                // Handle selection_needed from fast-path (e.g., "edit product")
                if ($fastPathResult['type'] === 'selection_needed') {
                    return $this->showEntitySelection(
                        $fastPathResult['entity'],
                        $fastPathResult['action'],
                        $fastPathResult['fullAction'],
                        $fastPathResult['module'],
                        $fastPathResult['message']
                    );
                }
                return $fastPathResult;
            }
            
            // STEP 4: Check for follow-up to previous offer
            $followUpResult = FollowUpHandler::tryHandle($message, $worldSnapshot['lastOfferedActions']);
            if ($followUpResult !== null) {
                return $this->handleFollowUpResult($followUpResult);
            }
            
            // STEP 5: Route based on FSM state
            $currentState = $worldSnapshot['fsmState'];
            
            switch ($currentState['state']) {
                case \FSM::STATE_IDLE:
                    return $this->handleIdleState($message, $worldSnapshot);
                    
                case \FSM::STATE_INTENT_DETECTED:
                case \FSM::STATE_DATA_EXTRACTED:
                    return $this->handleActiveState($message, $worldSnapshot);
                    
                case \FSM::STATE_AWAITING_CONFIRMATION:
                    return $this->handleConfirmationState($message, $worldSnapshot);
                    
                case \FSM::STATE_EXECUTING:
                    return ResponseBuilder::warning(
                        'Please wait, an action is currently being executed.'
                    );
                    
                case \FSM::STATE_COMPLETED:
                    return $this->handleCompletedState($message, $worldSnapshot);
                    
                default:
                    $this->stateHandler->resetToIdle('Unknown state');
                    return $this->handleIdleState($message, $worldSnapshot);
            }
            
        } catch (\Exception $e) {
            error_log("Orchestrator Error: " . $e->getMessage());
            $this->stateHandler->resetToIdle('Error: ' . $e->getMessage());
            
            return ResponseBuilder::assistant(
                "Oops! Something went wrong, but I've reset. What would you like to do?"
            );
        }
    }
    
    /**
     * Handle IDLE state - detect intent with JEPA reasoning
     */
    private function handleIdleState(string $message, array $worldSnapshot): array {
        // JEPA Step 1: AI understands intent given world state
        $understanding = $this->aiReasoner->understand($message, $worldSnapshot);
        
        // JEPA Step 2: AI predicts likely next states
        $prediction = $this->aiReasoner->predictNextStates($understanding, $worldSnapshot);
        
        // Code decides: Is this conversational or actionable?
        if ($understanding['isConversational']) {
            return $this->handleConversation($message, $understanding);
        }
        
        // Code decides: If no clear module/action detected, treat as conversational
        if (empty($understanding['module']) || empty($understanding['action'])) {
            return $this->handleConversation($message, $understanding);
        }
        
        // Code decides: Is this a data query?
        if ($understanding['isDataQuery']) {
            return $this->handleDataQuery($understanding);
        }
        
        // Code decides: This is an action request
        return $this->startActionFlow($message, $understanding, $prediction);
    }
    
    /**
     * Handle active task state (collecting data or awaiting selection)
     */
    private function handleActiveState(string $message, array $worldSnapshot): array {
        $currentTask = $worldSnapshot['currentTask'];
        $contextData = $worldSnapshot['fsmState']['contextData'] ?? [];
        
        // Check if we're waiting for entity selection
        if (isset($contextData['pendingSelection'])) {
            return $this->handleEntitySelection($message, $contextData['pendingSelection']);
        }
        
        if (!$currentTask) {
            $this->stateHandler->resetToIdle('No current task');
            return $this->handleIdleState($message, $worldSnapshot);
        }
        
        // JEPA: AI extracts data given current task context
        $extraction = $this->aiReasoner->extractData(
            $message, 
            $currentTask, 
            $worldSnapshot
        );
        
        // Code validates extraction
        $validation = ValidationEngine::validateData(
            $extraction['data'], 
            $currentTask['action']
        );
        
        if ($validation['isValid']) {
            // Data complete - proceed to confirmation or execution
            return $this->proceedWithTask($currentTask, $extraction['data']);
        } else {
            // Need more data - ask for clarification
            return $this->requestMissingData($validation['missing'], $currentTask);
        }
    }
    
    /**
     * Handle entity selection from list
     */
    private function handleEntitySelection(string $message, array $pendingSelection): array {
        // Try to extract selection number from message
        $selectionNum = null;
        $directId = null;
        
        // Check for number only (selection position, 1-indexed)
        if (preg_match('/^(\d+)$/', trim($message), $matches)) {
            $selectionNum = (int)$matches[1];
        }
        // Check for "id X" format (direct ID)
        elseif (preg_match('/^id\s+(\d+)$/i', trim($message), $matches)) {
            $directId = (int)$matches[1];
        }
        // Check for "#X" format (selection position)
        elseif (preg_match('/^#(\d+)$/', trim($message), $matches)) {
            $selectionNum = (int)$matches[1];
        }
        
        // Get the items array from pending selection
        $items = $pendingSelection['items'] ?? [];
        
        // Determine the actual database ID
        $selectedId = null;
        
        if ($directId) {
            // User specified direct ID - use as-is
            $selectedId = $directId;
        } elseif ($selectionNum && !empty($items)) {
            // User gave position number - map to actual ID
            // Selection is 1-indexed, array is 0-indexed
            $index = $selectionNum - 1;
            if (isset($items[$index])) {
                $selectedId = $items[$index]['id'];
            } else {
                return ResponseBuilder::clarification(
                    "Please select a number between 1 and " . count($items) . ".",
                    ['selectType' => $pendingSelection['entity']]
                );
            }
        }
        
        if (!$selectedId) {
            return ResponseBuilder::clarification(
                "Please select an item by entering its number (1, 2, 3...) or 'id X' for a specific ID.",
                ['selectType' => $pendingSelection['entity']]
            );
        }
        
        $entity = $pendingSelection['entity'];
        $actionType = $pendingSelection['actionType'];
        $fullAction = $pendingSelection['action'];
        $module = $pendingSelection['module'];
        
        // Fetch the entity data
        $entityData = $this->taskExecutor->fetchEntity($entity, $selectedId);
        
        if (!$entityData) {
            return ResponseBuilder::error(
                "I couldn't find that {$entity}. Please try again with a valid ID."
            );
        }
        
        // Clear pending selection
        $this->stateHandler->transitionTo(\FSM::STATE_INTENT_DETECTED, [], 'Selection made');
        
        if ($actionType === 'update') {
            // Show pre-filled form for editing
            return $this->showUpdateForm($entity, $entityData, $fullAction, $module);
        } elseif ($actionType === 'delete') {
            // Show confirmation for deletion
            return $this->showDeleteConfirmation($entity, $entityData, $fullAction, $module);
        }
        
        return ResponseBuilder::error("Unknown action type");
    }
    
    /**
     * Show pre-filled update form
     */
    private function showUpdateForm(string $entity, array $entityData, string $action, string $module): array {
        // Set pending task for form submission
        $this->stateHandler->transitionTo(\FSM::STATE_AWAITING_CONFIRMATION, [
            'extractedData' => $entityData,
            'currentAction' => $action,
            'currentModule' => $module
        ], 'Showing form');
        
        // Build form with entity data
        switch ($entity) {
            case 'customer':
                $formConfig = FormBuilder::buildCustomerForm($entityData);
                $name = $entityData['name'] ?? 'Customer';
                return ResponseBuilder::form(
                    "📝 Edit **{$name}** - Update the details below:",
                    $formConfig,
                    $action,
                    $module
                );
                
            case 'supplier':
                $formConfig = FormBuilder::buildSupplierForm($entityData);
                $name = $entityData['name'] ?? 'Supplier';
                return ResponseBuilder::form(
                    "📝 Edit **{$name}** - Update the details below:",
                    $formConfig,
                    $action,
                    $module
                );
                
            case 'product':
                $formConfig = FormBuilder::buildProductForm($entityData);
                $name = $entityData['name'] ?? 'Product';
                return ResponseBuilder::form(
                    "📝 Edit **{$name}** - Update the details below:",
                    $formConfig,
                    $action,
                    $module
                );
                
            case 'expense':
                $formConfig = FormBuilder::buildExpenseForm($entityData);
                $desc = $entityData['description'] ?? 'Expense';
                return ResponseBuilder::form(
                    "📝 Edit expense: **{$desc}** - Update the details below:",
                    $formConfig,
                    $action,
                    $module
                );
                
            default:
                return ResponseBuilder::error("Unknown entity type");
        }
    }
    
    /**
     * Show delete confirmation
     */
    private function showDeleteConfirmation(string $entity, array $entityData, string $action, string $module): array {
        // Set pending task for confirmation
        $idField = $entity . '_id';
        $entityData[$idField] = $entityData['id'];
        
        $this->stateHandler->transitionTo(\FSM::STATE_AWAITING_CONFIRMATION, [
            'extractedData' => $entityData,
            'currentAction' => $action,
            'currentModule' => $module
        ], 'Awaiting delete confirmation');
        
        $name = $entityData['name'] ?? $entityData['description'] ?? "ID {$entityData['id']}";
        
        return ResponseBuilder::confirmation(
            "⚠️ Are you sure you want to delete **{$name}**? This cannot be undone.",
            ['action' => $action, 'module' => $module],
            $entityData
        );
    }
    
    /**
     * Handle confirmation state
     */
    private function handleConfirmationState(string $message, array $worldSnapshot): array {
        $response = \Router::isConfirmationResponse($message);
        $currentTask = $worldSnapshot['currentTask'];
        $extractedData = $worldSnapshot['fsmState']['contextData']['extractedData'] ?? [];
        
        // Check for form submission (JSON data)
        $formData = json_decode($message, true);
        if (is_array($formData) && !empty($formData)) {
            $extractedData = array_merge($extractedData, $formData);
            return $this->executeTask($currentTask, $extractedData);
        }
        
        // Check for selection (id X)
        if (preg_match('/^id\s+(\d+)$/i', trim($message), $matches)) {
            return $this->handleSelection((int)$matches[1], $currentTask, $extractedData);
        }
        
        switch ($response) {
            case 'approve':
                return $this->executeTask($currentTask, $extractedData);
                
            case 'reject':
                $this->stateHandler->transitionTo(\FSM::STATE_FAILED, [], 'User rejected');
                return ResponseBuilder::cancelled('Action cancelled. What would you like to do instead?');
                
            case 'modify':
                $this->stateHandler->transitionTo(\FSM::STATE_INTENT_DETECTED, [], 'User wants to modify');
                return ResponseBuilder::assistant('What would you like to change?');
                
            default:
                // Re-prompt for confirmation
                return $this->requestConfirmation($currentTask, $extractedData);
        }
    }
    
    /**
     * Handle completed state
     */
    private function handleCompletedState(string $message, array $worldSnapshot): array {
        if ($this->stateHandler->hasMoreTasks()) {
            return $this->processNextTask();
        }
        
        $this->stateHandler->resetToIdle('All tasks completed');
        
        if (!empty(trim($message))) {
            return $this->handleIdleState($message, $this->worldState->getSnapshot());
        }
        
        return ResponseBuilder::success('All done! What would you like to do next?');
    }
    
    /**
     * Handle conversational message (no action needed)
     */
    private function handleConversation(string $message, array $understanding): array {
        // Use AI to generate natural response
        $response = $this->aiReasoner->generateConversationalResponse(
            $message, 
            $understanding
        );
        
        // Track topics for follow-up
        if (!empty($understanding['topics'])) {
            FollowUpHandler::saveTopicActions($understanding['topics']);
        }
        
        return ResponseBuilder::assistant($response);
    }
    
    /**
     * Handle data query (read-only)
     */
    private function handleDataQuery(array $understanding): array {
        $result = DataQueryHandler::execute(
            $understanding['module'],
            $understanding['action'],
            $understanding['data'] ?? [],
            $this->pdo,
            $this->companyId,
            $this->userId
        );
        
        return $result;
    }
    
    /**
     * Start action flow (create, update, delete)
     */
    private function startActionFlow(string $message, array $understanding, array $prediction): array {
        // Build task queue
        $intents = [[
            'module' => $understanding['module'],
            'action' => $understanding['action'],
            'confidence' => $understanding['confidence'],
            'data' => $understanding['data'] ?? []
        ]];
        
        $taskQueue = \TaskQueue::buildQueue($intents);
        $this->stateHandler->setTaskQueue($taskQueue);
        
        // Transition to INTENT_DETECTED
        $this->stateHandler->transitionTo(\FSM::STATE_INTENT_DETECTED, [
            'originalMessage' => $message,
            'prediction' => $prediction
        ], 'Intent detected');
        
        // Process first task
        return $this->processCurrentTask($message);
    }
    
    /**
     * Process current task with JEPA-style extraction
     */
    private function processCurrentTask(string $message): array {
        $currentTask = $this->stateHandler->getCurrentTask();
        
        if (!$currentTask) {
            $this->stateHandler->resetToIdle('No task');
            return ResponseBuilder::error('No task to process');
        }
        
        // Check if this action needs AI extraction
        if (!ValidationEngine::requiresExtraction($currentTask['action'])) {
            return $this->executeReadOnlyTask($currentTask);
        }
        
        // JEPA: Extract data for this specific task
        $worldSnapshot = $this->worldState->getSnapshot();
        $extraction = $this->aiReasoner->extractData(
            $message, 
            $currentTask, 
            $worldSnapshot
        );
        
        // Validate extraction
        $validation = ValidationEngine::validateData(
            $extraction['data'], 
            $currentTask['action']
        );
        
        if ($validation['isValid']) {
            return $this->proceedWithTask($currentTask, $extraction['data']);
        }
        
        // Show form for create/update actions
        if (FormBuilder::isFormAction($currentTask['action'])) {
            return $this->showForm($currentTask, $extraction['data']);
        }
        
        // Request missing data
        return $this->requestMissingData($validation['missing'], $currentTask);
    }
    
    /**
     * Proceed with validated task
     */
    private function proceedWithTask(array $task, array $data): array {
        $this->stateHandler->transitionTo(\FSM::STATE_DATA_EXTRACTED, [
            'extractedData' => $data
        ], 'Data extracted');
        
        // Check if confirmation needed
        if (ValidationEngine::requiresConfirmation($task['module'], $task['action'])) {
            return $this->requestConfirmation($task, $data);
        }
        
        return $this->executeTask($task, $data);
    }
    
    /**
     * Show form for data collection
     */
    private function showForm(array $task, array $data): array {
        $this->stateHandler->transitionTo(\FSM::STATE_AWAITING_CONFIRMATION, [
            'extractedData' => $data,
            'pendingTask' => $task
        ], 'Showing form');
        
        $formConfig = FormBuilder::getFormForAction($task['action'], $data);
        $actionLabel = str_replace('_', ' ', ucwords($task['action']));
        
        return ResponseBuilder::form(
            "📝 {$actionLabel} - Review and edit:",
            $formConfig,
            $task['action'],
            $task['module']
        );
    }
    
    /**
     * Request confirmation before execution
     */
    private function requestConfirmation(array $task, array $data): array {
        $this->stateHandler->transitionTo(\FSM::STATE_AWAITING_CONFIRMATION, [
            'extractedData' => $data,
            'pendingTask' => $task
        ], 'Awaiting confirmation');
        
        // For form-based actions, show form
        if (FormBuilder::isFormAction($task['action'])) {
            return $this->showForm($task, $data);
        }
        
        // For other actions, show confirmation message
        $message = ResponseBuilder::formatConfirmationMessage($task, $data);
        return ResponseBuilder::confirmation($message, $task, $data);
    }
    
    /**
     * Request missing data from user
     */
    private function requestMissingData(array $missing, array $task): array {
        $message = ResponseBuilder::buildClarificationMessage($missing, $task['action']);
        
        // For entity selection, include options
        $options = $this->getSelectionOptions($missing, $task);
        
        return ResponseBuilder::clarification($message, [
            'missing' => $missing,
            'options' => $options,
            'selectType' => $this->getSelectType($missing)
        ]);
    }
    
    /**
     * Execute task
     */
    private function executeTask(array $task, array $data): array {
        $this->stateHandler->transitionTo(\FSM::STATE_EXECUTING, [], 'Executing');
        
        $result = $this->taskExecutor->execute($task, $data);
        
        if ($result['success']) {
            $this->stateHandler->completeCurrentTask();
            $this->stateHandler->transitionTo(\FSM::STATE_COMPLETED, [
                'lastResult' => $result
            ], 'Task completed');
            
            if ($this->stateHandler->hasMoreTasks()) {
                return $this->processNextTask();
            }
            
            $this->stateHandler->resetToIdle('All tasks done');
            return ResponseBuilder::success($result['message'], $result['data'] ?? []);
        } else {
            $this->stateHandler->transitionTo(\FSM::STATE_FAILED, [
                'error' => $result['error']
            ], 'Execution failed');
            
            return ResponseBuilder::error($result['error'] ?? 'Execution failed');
        }
    }
    
    /**
     * Execute read-only task (no confirmation needed)
     */
    private function executeReadOnlyTask(array $task): array {
        $this->stateHandler->transitionTo(\FSM::STATE_EXECUTING, [], 'Executing read-only');
        
        $result = $this->taskExecutor->execute($task, $task['data'] ?? []);
        
        $this->stateHandler->completeCurrentTask();
        $this->stateHandler->resetToIdle('Read-only completed');
        
        if ($result['success']) {
            return ResponseBuilder::success($result['message'], $result['data'] ?? []);
        }
        return ResponseBuilder::error($result['error'] ?? 'Query failed');
    }
    
    /**
     * Process next task in queue
     */
    private function processNextTask(): array {
        $this->stateHandler->advanceToNextTask();
        $this->stateHandler->transitionTo(\FSM::STATE_INTENT_DETECTED, [], 'Next task');
        
        return $this->processCurrentTask('');
    }
    
    /**
     * Handle follow-up result
     */
    private function handleFollowUpResult(array $result): array {
        if ($result['type'] === 'decline') {
            return ResponseBuilder::assistant($result['message']);
        }
        
        // Handle clarification (e.g., after capability_offer + "yes")
        if ($result['type'] === 'clarification') {
            return ResponseBuilder::clarification($result['message'], []);
        }
        
        if ($result['type'] === 'view') {
            return DataQueryHandler::execute(
                $result['module'],
                $result['action'],
                [],
                $this->pdo,
                $this->companyId,
                $this->userId
            );
        }
        
        // Handle selection needed for update/delete
        if ($result['type'] === 'selection_needed') {
            return $this->showEntitySelection(
                $result['entity'],
                $result['action'],
                $result['fullAction'],
                $result['module'],
                $result['message']
            );
        }
        
        if ($result['type'] === 'create') {
            // Start creation flow by showing form
            $action = $result['action'];
            
            // Build form based on action
            if (strpos($action, 'create_customer') !== false) {
                $formConfig = FormBuilder::buildCustomerForm([]);
                return ResponseBuilder::form(
                    'Let\'s create a customer. Please fill in the details:',
                    $formConfig,
                    'create_customer',
                    'customers'
                );
            } elseif (strpos($action, 'create_supplier') !== false) {
                $formConfig = FormBuilder::buildSupplierForm([]);
                return ResponseBuilder::form(
                    'Let\'s add a supplier. Please fill in the details:',
                    $formConfig,
                    'create_supplier',
                    'suppliers'
                );
            } elseif (strpos($action, 'create_product') !== false) {
                $formConfig = FormBuilder::buildProductForm([]);
                return ResponseBuilder::form(
                    'Let\'s create a product. Please fill in the details:',
                    $formConfig,
                    'create_product',
                    'inventory'
                );
            } elseif (strpos($action, 'create_expense') !== false) {
                $formConfig = FormBuilder::buildExpenseForm([]);
                return ResponseBuilder::form(
                    'Let\'s record an expense. Please fill in the details:',
                    $formConfig,
                    'create_expense',
                    'expenses'
                );
            }
            
            // Fallback: use normal action flow
            $understanding = [
                'module' => $result['module'],
                'action' => $result['action'],
                'confidence' => 1.0,
                'data' => []
            ];
            $prediction = $this->aiReasoner->predictNextStates($understanding, $this->worldState->getSnapshot());
            return $this->startActionFlow('', $understanding, $prediction);
        }
        
        return ResponseBuilder::assistant('How can I help?');
    }
    
    /**
     * Show entity selection list for update/delete
     */
    private function showEntitySelection(string $entity, string $actionType, string $fullAction, string $module, string $message): array {
        // Fetch entities for selection
        $items = $this->fetchEntitiesForSelection($entity);
        
        if (empty($items)) {
            return ResponseBuilder::assistant(
                "You don't have any {$entity}s yet. Would you like to create one?"
            );
        }
        
        // Store the pending action in state for when user selects
        // IMPORTANT: Include items array so we can map position to ID
        $this->stateHandler->transitionTo(\FSM::STATE_INTENT_DETECTED, [
            'pendingSelection' => [
                'action' => $fullAction,
                'actionType' => $actionType,
                'module' => $module,
                'entity' => $entity,
                'items' => $items  // Store items for position->ID mapping
            ]
        ], 'Awaiting selection');
        
        return ResponseBuilder::selection(
            $message,
            $items,
            $entity
        );
    }
    
    /**
     * Fetch entities for selection list
     */
    private function fetchEntitiesForSelection(string $entity): array {
        $items = [];
        
        try {
            switch ($entity) {
                case 'customer':
                    $stmt = $this->pdo->prepare("
                        SELECT id, name, email, phone 
                        FROM customers 
                        WHERE company_id = ? 
                        ORDER BY name 
                        LIMIT 50
                    ");
                    $stmt->execute([$this->companyId]);
                    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
                        $items[] = [
                            'id' => $row['id'],
                            'label' => $row['name'],
                            'sublabel' => $row['email'] ?: $row['phone'] ?: ''
                        ];
                    }
                    break;
                    
                case 'supplier':
                    $stmt = $this->pdo->prepare("
                        SELECT id, name, email, phone 
                        FROM suppliers 
                        WHERE company_id = ? 
                        ORDER BY name 
                        LIMIT 50
                    ");
                    $stmt->execute([$this->companyId]);
                    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
                        $items[] = [
                            'id' => $row['id'],
                            'label' => $row['name'],
                            'sublabel' => $row['email'] ?: $row['phone'] ?: ''
                        ];
                    }
                    break;
                    
                case 'product':
                    $stmt = $this->pdo->prepare("
                        SELECT id, name, sku, selling_price 
                        FROM products 
                        WHERE company_id = ? 
                        ORDER BY name 
                        LIMIT 50
                    ");
                    $stmt->execute([$this->companyId]);
                    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
                        $items[] = [
                            'id' => $row['id'],
                            'label' => $row['name'],
                            'sublabel' => $row['sku'] ? "SKU: {$row['sku']}" : "Price: {$row['selling_price']}"
                        ];
                    }
                    break;
                    
                case 'expense':
                    $stmt = $this->pdo->prepare("
                        SELECT id, description, amount, created_at 
                        FROM expenses 
                        WHERE company_id = ? 
                        ORDER BY created_at DESC 
                        LIMIT 50
                    ");
                    $stmt->execute([$this->companyId]);
                    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
                        $items[] = [
                            'id' => $row['id'],
                            'label' => $row['description'],
                            'sublabel' => "Amount: {$row['amount']}"
                        ];
                    }
                    break;
            }
        } catch (\Exception $e) {
            error_log("Entity fetch error: " . $e->getMessage());
        }
        
        return $items;
    }
    
    /**
     * Handle selection from list
     */
    private function handleSelection(int $id, array $task, array $data): array {
        $entityType = ValidationEngine::getEntityType($task['action']);
        
        if ($entityType === 'customer') {
            $data['customer_id'] = $id;
        } elseif ($entityType === 'supplier') {
            $data['supplier_id'] = $id;
        } elseif ($entityType === 'product') {
            $data['product_id'] = $id;
        }
        
        // For update actions, fetch entity and show form
        if (strpos($task['action'], 'update_') === 0) {
            $entity = $this->taskExecutor->fetchEntity($entityType, $id);
            if ($entity) {
                $data = array_merge($entity, $data);
            }
            return $this->showForm($task, $data);
        }
        
        // For delete/view actions, proceed to confirmation
        return $this->requestConfirmation($task, $data);
    }
    
    /**
     * Get selection options for entity selection
     */
    private function getSelectionOptions(array $missing, array $task): ?array {
        $entityType = ValidationEngine::getEntityType($task['action']);
        
        if (!$entityType) return null;
        
        if ($entityType === 'customer' && 
            (in_array('customer_name', $missing) || in_array('customer_id', $missing))) {
            return $this->taskExecutor->fetchEntityList('customer', 20);
        }
        
        if ($entityType === 'supplier' && 
            (in_array('supplier_name', $missing) || in_array('supplier_id', $missing))) {
            return $this->taskExecutor->fetchEntityList('supplier', 20);
        }
        
        return null;
    }
    
    /**
     * Get select type for entity selection
     */
    private function getSelectType(array $missing): ?string {
        if (in_array('customer_name', $missing) || in_array('customer_id', $missing)) {
            return 'customer';
        }
        if (in_array('supplier_name', $missing) || in_array('supplier_id', $missing)) {
            return 'supplier';
        }
        return null;
    }
    
    /**
     * Get debug state (for troubleshooting)
     */
    public function getDebugState(): array {
        return [
            'worldState' => $this->worldState->getSnapshot(),
            'modules' => [
                'worldState' => 'active',
                'aiReasoner' => 'active',
                'stateHandler' => 'active',
                'taskExecutor' => 'active'
            ]
        ];
    }
}
