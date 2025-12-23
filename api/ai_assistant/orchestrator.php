<?php
/**
 * AI Orchestrator
 * 
 * PRODUCTION-GRADE WORKFLOW ORCHESTRATION
 * 
 * This is the MASTER CONTROLLER of the AI system.
 * It owns ALL workflow logic and state transitions.
 * 
 * The AI ONLY:
 * - Extracts data
 * - Estimates confidence
 * - Suggests clarifications
 * 
 * The ORCHESTRATOR:
 * - Controls FSM state
 * - Manages task queue
 * - Loads prompts
 * - Calls AI
 * - Validates output
 * - Executes actions
 * - Handles confirmations
 */

require_once __DIR__ . '/fsm.php';
require_once __DIR__ . '/task_queue.php';
require_once __DIR__ . '/router.php';
require_once __DIR__ . '/prompt_loader.php';

class Orchestrator {
    private $pdo;
    private $companyId;
    private $userId;
    private $apiKey;
    private $fsm;
    
    // Confidence thresholds
    const MIN_CONFIDENCE_TO_PROCEED = 0.7;
    const MIN_CONFIDENCE_FOR_AUTO_EXECUTE = 0.9;
    
    public function __construct($pdo, $companyId, $userId, $apiKey) {
        $this->pdo = $pdo;
        $this->companyId = $companyId;
        $this->userId = $userId;
        $this->apiKey = $apiKey;
        $this->fsm = new FSM($pdo, $companyId, $userId);
    }
    
    /**
     * Process user message through the complete flow
     * 
     * This is the MAIN ENTRY POINT
     */
    public function processMessage(string $message): array {
        $startTime = microtime(true);
        
        try {
            // STEP 1: Check for cancel/reset command
            if (Router::isCancelCommand($message)) {
                return $this->handleCancel();
            }
            
            // STEP 2: Get current FSM state
            $currentState = $this->fsm->getState();
            
            // STEP 3: Route based on current state
            switch ($currentState['state']) {
                case FSM::STATE_IDLE:
                    return $this->handleIdleState($message);
                    
                case FSM::STATE_INTENT_DETECTED:
                    return $this->handleIntentDetectedState($message);
                    
                case FSM::STATE_DATA_EXTRACTED:
                    return $this->handleDataExtractedState($message);
                    
                case FSM::STATE_AWAITING_CONFIRMATION:
                    return $this->handleAwaitingConfirmationState($message);
                    
                case FSM::STATE_EXECUTING:
                    // Should not receive messages during execution
                    return $this->formatResponse(
                        'warning',
                        'Please wait, an action is currently being executed.',
                        ['state' => $currentState['state']]
                    );
                    
                case FSM::STATE_COMPLETED:
                    // Check for more tasks or reset
                    return $this->handleCompletedState($message);
                    
                case FSM::STATE_FAILED:
                    // Auto-reset to IDLE
                    $this->fsm->resetToIdle('Auto-reset from FAILED state');
                    return $this->handleIdleState($message);
                    
                default:
                    $this->fsm->resetToIdle('Unknown state encountered');
                    return $this->handleIdleState($message);
            }
            
        } catch (Exception $e) {
            error_log("Orchestrator Error: " . $e->getMessage());
            $this->fsm->resetToIdle('Error: ' . $e->getMessage());
            
            return $this->formatResponse(
                'error',
                'An error occurred. Please try again.',
                ['error' => $e->getMessage()]
            );
        }
    }
    
    /**
     * IDLE STATE: Detect intents and create task queue
     */
    private function handleIdleState(string $message): array {
        // STEP 1: CODE detects intents (NOT AI)
        $intents = Router::detectIntents($message);
        error_log("handleIdleState - message: '{$message}', detected intents: " . json_encode($intents));
        
        // STEP 2: Handle unknown intent
        if (count($intents) === 1 && $intents[0]['action'] === 'unknown') {
            error_log("Unknown intent - returning handleUnknownIntent");
            return $this->handleUnknownIntent($message);
        }
        
        // STEP 3: Handle general/greeting intents (no AI needed)
        if ($intents[0]['module'] === 'general') {
            return $this->handleGeneralIntent($intents[0], $message);
        }
        
        // STEP 4: Handle capability questions ("can I...", "how do I...")
        // These should respond conversationally and offer to help
        if ($this->isCapabilityQuestion($intents[0]['action'])) {
            return $this->handleCapabilityQuestion($intents[0], $message);
        }
        
        // STEP 5: Create task queue
        $taskQueue = TaskQueue::buildQueue($intents);
        $this->fsm->setTaskQueue($taskQueue);
        
        // STEP 6: Transition to INTENT_DETECTED
        $this->fsm->transition(FSM::STATE_INTENT_DETECTED, [
            'originalMessage' => $message,
            'intentCount' => count($intents)
        ], 'Intents detected by router');
        
        // STEP 7: Immediately process first task
        return $this->processCurrentTask($message);
    }
    
    /**
     * Check if action is a capability question
     */
    private function isCapabilityQuestion(string $action): bool {
        return strpos($action, 'ask_') === 0;
    }
    
    /**
     * Handle capability questions conversationally
     * e.g., "can I delete a customer?" -> "Yes! Would you like me to show you the list?"
     */
    private function handleCapabilityQuestion(array $intent, string $message): array {
        $action = $intent['action'];
        
        // Map ask_* actions to actual actions and responses
        $capabilityResponses = [
            'ask_delete_customer' => [
                'response' => "✅ **Yes, you can delete customers!**\n\nWould you like me to show you the list of customers so you can select one to delete?",
                'actual_action' => 'delete_customer',
                'offer_type' => 'selection'
            ],
            'ask_update_customer' => [
                'response' => "✅ **Yes, you can edit/update customers!**\n\nWould you like me to show you the list of customers so you can select one to edit?",
                'actual_action' => 'update_customer',
                'offer_type' => 'selection'
            ],
            'ask_create_customer' => [
                'response' => "✅ **Yes, you can create new customers!**\n\nWould you like to add a new customer now? Just say **'yes'** or tell me the customer details.",
                'actual_action' => 'create_customer',
                'offer_type' => 'form'
            ],
            'ask_view_customers' => [
                'response' => "✅ **Yes, you can view your customers!**\n\nWould you like me to show you the list now?",
                'actual_action' => 'customer_summary',
                'offer_type' => 'list'
            ],
        ];
        
        if (!isset($capabilityResponses[$action])) {
            return $this->formatResponse(
                'assistant',
                "Yes, I can help you with that! What would you like to do?",
                []
            );
        }
        
        $config = $capabilityResponses[$action];
        
        // Store the pending action so when user says "yes", we proceed
        $this->fsm->setContextData([
            'pendingCapabilityAction' => $config['actual_action'],
            'offerType' => $config['offer_type']
        ]);
        
        // Transition to a state where we wait for confirmation
        $this->fsm->transition(FSM::STATE_INTENT_DETECTED, [
            'originalMessage' => $message,
            'capabilityQuestion' => true,
            'pendingAction' => $config['actual_action']
        ], 'Capability question - awaiting user response');
        
        return $this->formatResponse(
            'capability_offer',
            $config['response'],
            [
                'pendingAction' => $config['actual_action'],
                'offerType' => $config['offer_type'],
                'options' => ['Yes, please', 'No, thanks']
            ]
        );
    }
    
    /**
     * INTENT_DETECTED STATE: Extract data via AI
     * SMART: Handle read-only questions while keeping task context
     */
    private function handleIntentDetectedState(string $message): array {
        $currentTask = $this->fsm->getCurrentTask();
        $state = $this->fsm->getState();
        $contextData = $state['contextData'] ?? [];
        
        // Check if we're waiting for response to capability question
        if (isset($contextData['pendingCapabilityAction'])) {
            $pendingAction = $contextData['pendingCapabilityAction'];
            $offerType = $contextData['offerType'] ?? 'selection';
            
            // Check if user said yes
            $lowerMessage = strtolower(trim($message));
            $affirmativeResponses = ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'yes please', 'yes, please', 'go ahead', 'do it', 'proceed', 'y'];
            $negativeResponses = ['no', 'nope', 'nah', 'cancel', 'no thanks', 'no, thanks', 'n', 'never mind', 'nevermind'];
            
            if (in_array($lowerMessage, $affirmativeResponses) || preg_match('/^(yes|yeah|sure|ok)/i', $lowerMessage)) {
                // User wants to proceed - create task queue with actual action
                $taskQueue = TaskQueue::buildQueue([[
                    'module' => 'customers',
                    'action' => $pendingAction,
                    'confidence' => 0.9,
                    'priority' => 1,
                    'data' => []
                ]]);
                $this->fsm->setTaskQueue($taskQueue);
                
                // Clear pending capability action
                $this->fsm->setContextData(['pendingCapabilityAction' => null, 'offerType' => null]);
                
                // Process the task
                return $this->processCurrentTask($message);
            } elseif (in_array($lowerMessage, $negativeResponses)) {
                // User declined - reset to idle
                $this->fsm->resetToIdle('User declined capability offer');
                return $this->formatResponse(
                    'assistant',
                    "No problem! Is there anything else I can help you with?",
                    []
                );
            }
            // If response is neither yes nor no, try to detect new intent
        }
        
        // Check if user is asking a read-only/informational question mid-task
        $interruptIntent = Router::detectIntents($message);
        if (!empty($interruptIntent) && $interruptIntent[0]['action'] !== 'unknown') {
            $action = $interruptIntent[0]['action'];
            
            // If it's a read-only query (like "show my customers"), answer it without losing context
            if ($this->isInformationalQuery($action, $message)) {
                // Answer the question
                $result = $this->handleInformationalQuery($interruptIntent[0], $message);
                
                // Add hint about the pending task
                if ($currentTask) {
                    $result['message'] .= "\n\n💡 *You were in the middle of: **" . 
                        str_replace('_', ' ', $currentTask['action']) . "**. " .
                        "Please provide the required information to continue, or say 'cancel' to abort.*";
                    $result['pending_task'] = $currentTask['action'];
                }
                return $result;
            }
        }
        
        // Otherwise, continue with the current task
        return $this->processCurrentTask($message);
    }
    
    /**
     * Check if a query is informational/read-only (won't modify data)
     */
    private function isInformationalQuery(string $action, string $message): bool {
        $infoPatterns = [
            'customer_summary', 'top_customers', 'view_suppliers', 'supplier_summary',
            'inventory_summary', 'view_inventory', 'sales_summary', 'expense_summary',
            'view_pending_invoices', 'dashboard_stats', 'greeting', 'help'
        ];
        
        // Check explicit patterns
        if (in_array($action, $infoPatterns)) {
            return true;
        }
        
        // Check message patterns for "show me" / "list" / "what are" questions
        if (preg_match('/\b(show|list|what\s+are|give\s+me|how\s+many|who\s+are)\b.*\b(customers?|products?|suppliers?|invoices?)\b/i', $message)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Handle informational query without changing state
     */
    private function handleInformationalQuery(array $intent, string $message): array {
        $module = $intent['module'];
        $action = $intent['action'];
        
        // Load handler
        $handlerFile = __DIR__ . '/handlers/' . $module . '_handler.php';
        if (!file_exists($handlerFile)) {
            return $this->formatResponse('error', 'Handler not found for ' . $module, []);
        }
        require_once $handlerFile;
        
        $handlerFunction = 'handle' . ucfirst($module) . 'Intent';
        if (!function_exists($handlerFunction)) {
            return $this->formatResponse('error', 'Handler function not found', []);
        }
        
        $result = $handlerFunction(
            $action,
            $intent['data'] ?? [],
            'executing',
            $this->pdo,
            $this->companyId,
            $this->userId
        );
        
        // Get pending task info for context
        $currentTask = $this->fsm->getCurrentTask();
        $pendingNote = '';
        if ($currentTask) {
            $actionName = str_replace('_', ' ', $currentTask['action']);
            $pendingNote = "\n\n---\n💡 *Your pending **{$actionName}** task is still waiting. Just provide the required info when ready!*";
        }
        
        $resultMessage = $result['message'] ?? 'Here is the information:';
        return $this->formatResponse('info', $resultMessage . $pendingNote, $result);
    }
    
    /**
     * DATA_EXTRACTED STATE: Check if ready for confirmation or execution
     */
    private function handleDataExtractedState(string $message): array {
        $state = $this->fsm->getState();
        $currentTask = $this->fsm->getCurrentTask();
        
        if (!$currentTask) {
            $this->fsm->resetToIdle('No current task');
            return $this->handleIdleState($message);
        }
        
        $extractedData = $state['contextData']['extractedData'] ?? [];
        
        // Check if user is providing additional data
        if (!empty($message)) {
            // Re-process with AI to merge data
            return $this->processCurrentTask($message);
        }
        
        // Otherwise, determine next step
        if (FSM::requiresConfirmation($currentTask['module'], $currentTask['action'])) {
            return $this->requestConfirmation($currentTask, $extractedData);
        }
        
        return $this->executeTask($currentTask, $extractedData);
    }
    
    /**
     * AWAITING_CONFIRMATION STATE: Handle user response
     */
    private function handleAwaitingConfirmationState(string $message): array {
        $response = Router::isConfirmationResponse($message);
        $state = $this->fsm->getState();
        $currentTask = $this->fsm->getCurrentTask();
        $extractedData = $state['contextData']['extractedData'] ?? [];
        
        // Check if message is "id X" format (from selection list)
        if (preg_match('/^id\s+(\d+)$/i', trim($message), $matches)) {
            $selectedId = (int)$matches[1];
            error_log("Selected ID from list: {$selectedId}");
            
            // Update extracted data with the selected ID
            $extractedData['customer_id'] = $selectedId;
            
            // For update_customer, fetch and show form
            if ($currentTask['action'] === 'update_customer') {
                $stmt = $this->pdo->prepare("
                    SELECT id, name, phone, email, billing_address, customer_type, 
                           payment_terms, credit_limit, is_active 
                    FROM customers 
                    WHERE id = ? AND company_id = ?
                ");
                $stmt->execute([$selectedId, $this->companyId]);
                $customer = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$customer) {
                    return $this->formatResponse(
                        'error',
                        'Customer not found.',
                        []
                    );
                }
                
                // Use database customer data as primary (don't use extracted partial name)
                $data = $customer;
                $data['customer_id'] = $selectedId;
                error_log("Loaded customer data for edit: " . json_encode($data));
                
                // Update FSM context with complete data
                $this->fsm->setContextData([
                    'extractedData' => $data,
                    'pendingTask' => $currentTask
                ]);
                
                // Build and return form
                $formConfig = $this->buildCustomerFormConfig($data);
                
                return $this->formatResponse(
                    'form',
                    "📝 Edit Customer - Review and edit the details below:",
                    array_merge($formConfig, [
                        'action' => $currentTask['action'],
                        'module' => $currentTask['module']
                    ])
                );
            }
            
            // For other actions with selection, update data and show confirmation
            $extractedData['customer_id'] = $selectedId;
            $this->fsm->setContextData([
                'extractedData' => $extractedData,
                'pendingTask' => $currentTask
            ]);
            
            return $this->requestConfirmation($currentTask, $extractedData);
        }
        
        switch ($response) {
            case 'approve':
                return $this->executeTask($currentTask, $extractedData);
                
            case 'reject':
                $this->fsm->transition(FSM::STATE_FAILED, [], 'User rejected');
                return $this->formatResponse(
                    'cancelled',
                    'Action cancelled. What would you like to do instead?',
                    ['state' => 'IDLE']
                );
                
            case 'modify':
                // Go back to data extraction
                $this->fsm->transition(FSM::STATE_INTENT_DETECTED, [], 'User wants to modify');
                return $this->formatResponse(
                    'modify',
                    'What would you like to change?',
                    ['currentData' => $extractedData]
                );
                
            default:
                // Not a clear response - re-prompt
                return $this->requestConfirmation($currentTask, $extractedData);
        }
    }
    
    /**
     * COMPLETED STATE: Check for more tasks or reset
     */
    private function handleCompletedState(string $message): array {
        if ($this->fsm->hasMoreTasks()) {
            // Clear AI context for next task
            $this->fsm->clearAIContext();
            
            // Move to next task
            $this->fsm->transition(FSM::STATE_INTENT_DETECTED, [], 'Moving to next task');
            
            return $this->processCurrentTask($message);
        }
        
        // All tasks complete - reset to IDLE
        $this->fsm->resetToIdle('All tasks completed');
        
        // Process new message if provided
        if (!empty(trim($message))) {
            return $this->handleIdleState($message);
        }
        
        return $this->formatResponse(
            'complete',
            'All done! What would you like to do next?',
            ['state' => 'IDLE']
        );
    }
    
    /**
     * Process current task with AI
     */
    private function processCurrentTask(string $message): array {
        $currentTask = $this->fsm->getCurrentTask();
        
        if (!$currentTask) {
            $this->fsm->resetToIdle('No task to process');
            return $this->formatResponse('error', 'No task to process', []);
        }
        
        $module = $currentTask['module'];
        $action = $currentTask['action'];
        
        // Check if AI extraction is needed
        if (!Router::requiresAIExtraction($action)) {
            // Read-only action - execute directly
            return $this->executeReadOnlyTask($currentTask, $message);
        }
        
        // Get previous context for clarification flows
        $state = $this->fsm->getState();
        $previousData = $state['contextData']['extractedData'] ?? [];
        $pendingFields = $state['contextData']['pendingFields'] ?? $state['contextData']['missingFields'] ?? [];
        
        // SMART: If user provides short data-like input and we have pending fields, merge it directly
        if (!empty($pendingFields) && Router::looksLikeDataInput($message)) {
            $mergedData = $this->smartMergeData($previousData, $message, $pendingFields, $action);
            if ($mergedData !== null) {
                // Re-validate with merged data
                $validation = $this->validateExtractionFromData($mergedData, $action);
                
                if ($validation['isValid']) {
                    // Data complete - proceed to confirmation
                    $this->fsm->transition(FSM::STATE_DATA_EXTRACTED, [
                        'extractedData' => $mergedData,
                        'confidence' => 0.9
                    ], 'Data merged from user input');
                    
                    if (FSM::requiresConfirmation($module, $action)) {
                        return $this->requestConfirmation($currentTask, $mergedData);
                    }
                    
                    return $this->executeTask($currentTask, $mergedData);
                } else {
                    // Still missing fields
                    $this->fsm->setContextData([
                        'extractedData' => $mergedData,
                        'missingFields' => $validation['missing']
                    ]);
                    
                    return $this->formatResponse(
                        'clarification',
                        $this->buildClarificationMessage($validation['missing'], $action),
                        ['missing' => $validation['missing'], 'currentData' => $mergedData]
                    );
                }
            }
        }
        
        // STEP 1: Load prompts (GLOBAL + MODULE + TASK)
        $prompt = PromptLoader::loadPromptForTask($module, $action, [
            'fsmState' => $state['state'],
            'userMessage' => $message,
            'previousData' => $previousData
        ]);
        
        // STEP 2: Call AI for data extraction
        $aiResponse = $this->callAI($prompt, $message);
        
        if (!$aiResponse['success']) {
            return $this->formatResponse('error', $aiResponse['error'], []);
        }
        
        $extracted = $aiResponse['data'];
        
        // STEP 3: Validate AI output (CODE validates, not AI)
        $validation = $this->validateExtraction($extracted, $action);
        
        // STEP 4: Handle based on validation
        if (!$validation['isValid']) {
            // For create_customer or update_customer with missing data, show form immediately
            if ($action === 'create_customer') {
                // Go straight to form for create customer
                $extractedData = $extracted['extracted_data'] ?? [];
                $this->fsm->transition(FSM::STATE_DATA_EXTRACTED, [
                    'extractedData' => $extractedData,
                    'confidence' => 0.8
                ], 'Showing customer creation form');
                
                return $this->requestConfirmation($currentTask, $extractedData);
            }
            
            // For update_customer with missing customer identifier, show customer list
            if ($action === 'update_customer' && 
                (in_array('customer_name', $validation['missing']) || in_array('customer_id', $validation['missing']))) {
                $customers = $this->fetchCustomerList(20);
                
                if (empty($customers)) {
                    return $this->formatResponse(
                        'error',
                        'No customers found in your account. Please create a customer first.',
                        []
                    );
                }
                
                $this->fsm->setContextData([
                    'extractedData' => $extracted['extracted_data'] ?? [],
                    'pendingFields' => $validation['missing'],
                    'action' => $action
                ]);
                
                return $this->formatResponse(
                    'clarification',
                    '**Select a customer to edit:**',
                    [
                        'missing' => $validation['missing'],
                        'currentData' => $extracted['extracted_data'] ?? [],
                        'options' => array_map(function($customer) {
                            return [
                                'id' => $customer['id'],
                                'label' => $customer['name'],
                                'sublabel' => $customer['email'] ?? $customer['phone'] ?? '',
                                'value' => $customer['id']
                            ];
                        }, $customers),
                        'selectType' => 'customer',
                        'awaitingInput' => true
                    ]
                );
            }
            
            // Missing required fields - ask for clarification with friendly message
            $clarification = $this->buildClarificationMessage($validation['missing'], $action);
            
            // Store both extracted data AND pending fields for smart merge later
            $this->fsm->setContextData([
                'extractedData' => $extracted['extracted_data'] ?? [],
                'pendingFields' => $validation['missing'],
                'action' => $action
            ]);
            
            // For customer selection actions, include customer list as selectable options
            $responseData = [
                'missing' => $validation['missing'],
                'currentData' => $extracted['extracted_data'] ?? [],
                'awaitingInput' => true
            ];
            
            // Add selectable customer list for customer-related actions
            if (in_array($action, ['delete_customer', 'view_customer', 'customer_balance', 'customer_transactions']) && 
                (in_array('customer_name', $validation['missing']) || in_array('customer_id', $validation['missing']))) {
                $customers = $this->fetchCustomerList(20);
                error_log("Fetched " . count($customers) . " customers for selection");
                if (!empty($customers)) {
                    $responseData['options'] = array_map(function($customer) {
                        return [
                            'id' => $customer['id'],
                            'label' => $customer['name'],
                            'sublabel' => $customer['email'] ?? $customer['phone'] ?? '',
                            'value' => $customer['id']
                        ];
                    }, $customers);
                    $responseData['selectType'] = 'customer';
                    error_log("Added " . count($responseData['options']) . " options to response");
                }
            }
            
            error_log("Response data: " . json_encode($responseData));
            
            return $this->formatResponse(
                'clarification',
                $clarification,
                $responseData
            );
        }
        
        // STEP 5: Data is complete - transition to DATA_EXTRACTED
        $extractedData = $extracted['extracted_data'];
        $confidence = $extracted['confidence'] ?? 0.8;
        
        // For customer_details, also include raw_input for fallback name extraction
        if ($action === 'customer_details') {
            $extractedData['raw_input'] = $message;
        }
        
        $this->fsm->transition(FSM::STATE_DATA_EXTRACTED, [
            'extractedData' => $extractedData,
            'confidence' => $confidence
        ], 'Data extraction complete');
        
        // STEP 6: Determine if confirmation needed
        if (FSM::requiresConfirmation($module, $action)) {
            return $this->requestConfirmation($currentTask, $extractedData);
        }
        
        // STEP 7: Auto-execute if confidence is high enough
        if ($confidence >= self::MIN_CONFIDENCE_FOR_AUTO_EXECUTE) {
            return $this->executeTask($currentTask, $extractedData);
        }
        
        // STEP 8: Request confirmation for lower confidence
        return $this->requestConfirmation($currentTask, $extractedData);
    }
    
    /**
     * Execute read-only task (no AI needed)
     */
    private function executeReadOnlyTask(array $task, string $message): array {
        $this->fsm->transition(FSM::STATE_EXECUTING, [], 'Executing read-only task');
        
        // Get handlers
        require_once __DIR__ . '/handlers/' . $task['module'] . '_handler.php';
        
        $handlerFunction = 'handle' . ucfirst($task['module']) . 'Intent';
        
        if (!function_exists($handlerFunction)) {
            $this->fsm->transition(FSM::STATE_FAILED, [], 'Handler not found');
            return $this->formatResponse('error', 'Handler not found for ' . $task['module'], []);
        }
        
        $result = $handlerFunction(
            $task['action'],
            $task['data'] ?? [],
            'executing',
            $this->pdo,
            $this->companyId,
            $this->userId
        );
        
        // Mark task completed
        $this->fsm->completeCurrentTask();
        $this->fsm->transition(FSM::STATE_COMPLETED, [], 'Task completed');
        
        // Check for more tasks
        if ($this->fsm->hasMoreTasks()) {
            $summary = TaskQueue::getQueueSummary(
                $this->fsm->getState()['taskQueue'],
                $this->fsm->getState()['currentTaskIndex']
            );
            
            return $this->formatResponse(
                'task_complete',
                $result['message'] ?? 'Done',
                array_merge($result, ['queueProgress' => $summary])
            );
        }
        
        $this->fsm->resetToIdle('All tasks completed');
        
        return $this->formatResponse(
            'success',
            $result['message'] ?? 'Done',
            $result
        );
    }
    
    /**
     * Execute task with extracted data
     */
    private function executeTask(array $task, array $data): array {
        $this->fsm->transition(FSM::STATE_EXECUTING, [], 'Executing task');
        
        $startTime = microtime(true);
        
        try {
            // Load handler
            $handlerFile = __DIR__ . '/handlers/' . $task['module'] . '_handler.php';
            if (!file_exists($handlerFile)) {
                throw new Exception('Handler file not found: ' . $task['module']);
            }
            require_once $handlerFile;
            
            $handlerFunction = 'handle' . ucfirst($task['module']) . 'Intent';
            
            if (!function_exists($handlerFunction)) {
                throw new Exception('Handler function not found: ' . $handlerFunction);
            }
            
            // Execute
            $result = $handlerFunction(
                $task['action'],
                $data,
                'executing',
                $this->pdo,
                $this->companyId,
                $this->userId
            );
            
            error_log("Handler result for {$task['action']}: " . json_encode(['status' => $result['status'] ?? 'unknown', 'message_length' => strlen($result['message'] ?? ''), 'has_data' => !empty($result['data'])]));
            
            $executionTime = (microtime(true) - $startTime) * 1000;
            
            // Log task execution
            $this->logTaskExecution($task, $data, $result, 'completed', null, $executionTime);
            
            // Mark completed
            $this->fsm->completeCurrentTask();
            $this->fsm->transition(FSM::STATE_COMPLETED, [
                'lastResult' => $result
            ], 'Task executed successfully');
            
            // Check for more tasks
            if ($this->fsm->hasMoreTasks()) {
                $state = $this->fsm->getState();
                $summary = TaskQueue::getQueueSummary($state['taskQueue'], $state['currentTaskIndex']);
                
                // Clear AI context before next task
                $this->fsm->clearAIContext();
                $this->fsm->transition(FSM::STATE_INTENT_DETECTED, [], 'Moving to next task');
                
                return $this->formatResponse(
                    'task_complete',
                    $result['message'] ?? 'Task completed. Processing next task...',
                    array_merge($result, [
                        'queueProgress' => $summary,
                        'nextTask' => $summary['currentTask']
                    ])
                );
            }
            
            // All done
            $this->fsm->resetToIdle('All tasks completed');
            
            return $this->formatResponse(
                'success',
                $result['message'] ?? '✅ Action completed successfully!',
                $result
            );
            
        } catch (Exception $e) {
            $executionTime = (microtime(true) - $startTime) * 1000;
            $this->logTaskExecution($task, $data, null, 'failed', $e->getMessage(), $executionTime);
            
            $this->fsm->transition(FSM::STATE_FAILED, [
                'error' => $e->getMessage()
            ], 'Execution failed');
            
            return $this->formatResponse(
                'error',
                'Failed to execute: ' . $e->getMessage(),
                ['error' => $e->getMessage()]
            );
        }
    }
    
    /**
     * Request user confirmation
     */
    private function requestConfirmation(array $task, array $data): array {
        $this->fsm->transition(FSM::STATE_AWAITING_CONFIRMATION, [
            'extractedData' => $data,
            'pendingTask' => $task
        ], 'Awaiting user confirmation');
        
        // For create/edit customer, return editable form
        if (in_array($task['action'], ['create_customer', 'update_customer'])) {
            // For update_customer, fetch full customer data if only ID/name provided
            if ($task['action'] === 'update_customer') {
                $customerId = $data['customer_id'] ?? null;
                $customerName = null;
                
                // Check if customer_name is numeric (ID from selection) or actual name
                if (!$customerId && isset($data['customer_name'])) {
                    if (is_numeric($data['customer_name'])) {
                        $customerId = (int)$data['customer_name'];
                    } else {
                        $customerName = $data['customer_name'];
                    }
                }
                
                // If we have a customer ID, fetch the record
                if ($customerId) {
                    $stmt = $this->pdo->prepare("
                        SELECT id, name, phone, email, billing_address, customer_type, 
                               payment_terms, credit_limit, is_active 
                        FROM customers 
                        WHERE id = ? AND company_id = ?
                    ");
                    $stmt->execute([$customerId, $this->companyId]);
                    $customer = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($customer) {
                        // Filter out empty values from $data to preserve customer data
                        $nonEmptyData = array_filter($data, function($value) {
                            return $value !== '' && $value !== null;
                        });
                        $data = array_merge($customer, $nonEmptyData);
                        $data['customer_id'] = $customerId;
                    }
                } elseif ($customerName) {
                    // Search by name
                    error_log("Searching for customer by name: {$customerName}");
                    $stmt = $this->pdo->prepare("
                        SELECT id, name, phone, email, billing_address, customer_type, 
                               payment_terms, credit_limit, is_active 
                        FROM customers 
                        WHERE name LIKE ? AND company_id = ? AND is_active = 1
                    ");
                    $stmt->execute(["%{$customerName}%", $this->companyId]);
                    $matches = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    error_log("Found " . count($matches) . " matching customers");
                    
                    if (empty($matches)) {
                        // No customer found - show full list with message
                        $allCustomers = $this->fetchCustomerList(20);
                        
                        if (empty($allCustomers)) {
                            return $this->formatResponse(
                                'error',
                                'No customers found in your account.',
                                []
                            );
                        }
                        
                        return $this->formatResponse(
                            'clarification',
                            "⚠️ Customer **{$customerName}** not found. Please select from the list below:",
                            [
                                'missing' => ['customer_name'],
                                'currentData' => [],
                                'options' => array_map(function($customer) {
                                    return [
                                        'id' => $customer['id'],
                                        'label' => $customer['name'],
                                        'sublabel' => $customer['email'] ?? $customer['phone'] ?? '',
                                        'value' => $customer['id']
                                    ];
                                }, $allCustomers),
                                'selectType' => 'customer',
                                'awaitingInput' => true
                            ]
                        );
                    } elseif (count($matches) === 1) {
                        // Exact match - show form
                        $customer = $matches[0];
                        // Filter out empty values to preserve customer data
                        $nonEmptyData = array_filter($data, function($value) {
                            return $value !== '' && $value !== null;
                        });
                        $data = array_merge($customer, $nonEmptyData);
                        $data['customer_id'] = $customer['id'];
                    } else {
                        // Multiple matches - show selection
                        return $this->formatResponse(
                            'clarification',
                            "Found **" . count($matches) . " customers** matching **{$customerName}**. Please select one:",
                            [
                                'missing' => ['customer_name'],
                                'currentData' => [],
                                'options' => array_map(function($customer) {
                                    return [
                                        'id' => $customer['id'],
                                        'label' => $customer['name'],
                                        'sublabel' => $customer['email'] ?? $customer['phone'] ?? '',
                                        'value' => $customer['id']
                                    ];
                                }, $matches),
                                'selectType' => 'customer',
                                'awaitingInput' => true
                            ]
                        );
                    }
                }
            }
            
            $formConfig = $this->buildCustomerFormConfig($data);
            $actionLabel = $task['action'] === 'create_customer' ? 'Create Customer' : 'Edit Customer';
            
            return $this->formatResponse(
                'form',
                "📝 {$actionLabel} - Review and edit the details below:",
                array_merge($formConfig, [
                    'action' => $task['action'],
                    'module' => $task['module']
                ])
            );
        }
        
        // For other actions, enhance data for display and show confirmation
        $displayData = $this->enhanceDataForDisplay($task, $data);
        
        $summary = $this->formatConfirmationMessage($task, $displayData);
        
        return $this->formatResponse(
            'confirmation',
            $summary,
            [
                'action' => $task['action'],
                'module' => $task['module'],
                'data' => $displayData,
                'options' => ['Confirm', 'Cancel', 'Modify']
            ]
        );
    }
    
    /**
     * Enhance data with readable names for display (doesn't modify execution data)
     */
    private function enhanceDataForDisplay(array $task, array $data): array {
        error_log("enhanceDataForDisplay called with action={$task['action']}, data=" . json_encode($data));
        $displayData = $data;
        
        // For customer actions, enhance display with customer details
        if (in_array($task['action'], ['delete_customer', 'view_customer', 'customer_balance', 'customer_transactions'])) {
            $customerId = null;
            
            // Get customer ID from either customer_id field or customer_name if it's numeric
            if (isset($data['customer_id'])) {
                $customerId = $data['customer_id'];
            } elseif (isset($data['customer_name']) && is_numeric($data['customer_name'])) {
                // customer_name contains an ID (like "35")
                $customerId = (int)$data['customer_name'];
            }
            
            if ($customerId && !isset($data['customer_name']) || (isset($data['customer_name']) && is_numeric($data['customer_name']))) {
                error_log("Fetching customer by ID: {$customerId}");
                $customer = $this->fetchCustomerById($customerId);
                error_log("Fetched customer: " . json_encode($customer));
                if ($customer) {
                    $displayData['customer_id'] = $customerId; // Ensure ID is in data for execution
                    $displayData['customer_name'] = $customer['name'];
                    if ($customer['email']) {
                        $displayData['customer_email'] = $customer['email'];
                    }
                }
            }
        }
        
        error_log("Enhanced display data: " . json_encode($displayData));
        return $displayData;
    }
    
    /**
     * Format confirmation message
     */
    private function formatConfirmationMessage(array $task, array $data): string {
        $action = str_replace('_', ' ', $task['action']);
        $action = ucwords($action);
        
        $message = "📋 **Please confirm: {$action}**\n\n";
        
        foreach ($data as $key => $value) {
            if ($value === null || $value === '') continue;
            
            // Skip showing customer_id if we have customer_name (it's redundant for display)
            if ($key === 'customer_id' && isset($data['customer_name'])) {
                continue;
            }
            
            $label = ucwords(str_replace('_', ' ', $key));
            
            if (is_array($value)) {
                $message .= "**{$label}:**\n";
                foreach ($value as $item) {
                    if (is_array($item)) {
                        $itemStr = implode(', ', array_map(fn($k, $v) => "{$k}: {$v}", array_keys($item), $item));
                        $message .= "  • {$itemStr}\n";
                    } else {
                        $message .= "  • {$item}\n";
                    }
                }
            } else {
                $message .= "• **{$label}:** {$value}\n";
            }
        }
        
        $message .= "\n*Reply 'Confirm' to proceed, 'Cancel' to abort, or tell me what to change.*";
        
        return $message;
    }
    
    /**
     * Fetch customer by ID for display purposes
     */
    private function fetchCustomerById(int $customerId): ?array {
        try {
            $stmt = $this->pdo->prepare("SELECT id, name, email, phone FROM customers WHERE id = ? AND company_id = ?");
            $stmt->execute([$customerId, $this->companyId]);
            $customer = $stmt->fetch(PDO::FETCH_ASSOC);
            return $customer ?: null;
        } catch (Exception $e) {
            error_log("fetchCustomerById error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Build customer form configuration for editable UI
     */
    private function buildCustomerFormConfig(array $data = []): array {
        return [
            'type' => 'form',
            'fieldConfig' => [
                'name' => [
                    'label' => 'Customer Name',
                    'type' => 'text',
                    'required' => true,
                    'placeholder' => 'Enter customer name'
                ],
                'phone' => [
                    'label' => 'Phone Number',
                    'type' => 'tel',
                    'required' => true,
                    'placeholder' => 'Enter phone number'
                ],
                'email' => [
                    'label' => 'Email Address',
                    'type' => 'email',
                    'required' => true,
                    'placeholder' => 'customer@example.com'
                ],
                'billing_address' => [
                    'label' => 'Billing Address',
                    'type' => 'textarea',
                    'required' => true,
                    'placeholder' => 'Enter complete billing address'
                ],
                'customer_type' => [
                    'label' => 'Customer Type',
                    'type' => 'select',
                    'required' => false,
                    'options' => ['Individual', 'Business'],
                    'default' => 'Individual'
                ],
                'payment_terms' => [
                    'label' => 'Payment Terms',
                    'type' => 'select',
                    'required' => false,
                    'options' => ['Cash on Delivery', 'Net 7 days', 'Net 15 days', 'Net 30 days', 'Net 60 days'],
                    'default' => 'Cash on Delivery'
                ],
                'credit_limit' => [
                    'label' => 'Credit Limit',
                    'type' => 'number',
                    'required' => false,
                    'placeholder' => '0.00'
                ],
                'is_active' => [
                    'label' => 'Active Customer',
                    'type' => 'checkbox',
                    'required' => false,
                    'placeholder' => 'Mark as active customer',
                    'default' => true
                ]
            ],
            'fields' => [
                'customer_id' => $data['customer_id'] ?? $data['id'] ?? null, // CRITICAL: Preserve ID for updates
                'name' => $data['name'] ?? $data['customer_name'] ?? '',
                'phone' => $data['phone'] ?? '',
                'email' => $data['email'] ?? '',
                'billing_address' => $data['billing_address'] ?? $data['address'] ?? '',
                'customer_type' => $data['customer_type'] ?? 'Individual',
                'payment_terms' => $data['payment_terms'] ?? 'Cash on Delivery',
                'credit_limit' => $data['credit_limit'] ?? '',
                'is_active' => $data['is_active'] ?? true
            ]
        ];
    }
    
    /**
     * Handle cancel command
     */
    private function handleCancel(): array {
        $this->fsm->resetToIdle('User cancelled');
        
        return $this->formatResponse(
            'cancelled',
            '🔄 Reset! What would you like to do?',
            ['state' => 'IDLE']
        );
    }
    
    /**
     * Handle unknown intent
     */
    private function handleUnknownIntent(string $message): array {
        return $this->formatResponse(
            'unknown',
            "I'm not sure what you'd like to do. Try:\n" .
            "• \"Create customer John Doe\"\n" .
            "• \"Show me my inventory\"\n" .
            "• \"Create invoice for...\"\n" .
            "• \"Add expense...\"\n" .
            "• \"Show sales summary\"",
            ['originalMessage' => $message]
        );
    }
    
    /**
     * Handle general intents (greetings, help, chat)
     */
    private function handleGeneralIntent(array $intent, string $message): array {
        switch ($intent['action']) {
            case 'greeting':
                return $this->formatResponse(
                    'greeting',
                    "👋 Hello! I'm your FirmaFlow AI Assistant.\n\n" .
                    "I can help you with:\n" .
                    "• 👤 Customers - Create, view, manage\n" .
                    "• 📦 Inventory - Products, stock\n" .
                    "• 💰 Sales - Invoices, payments\n" .
                    "• 💸 Expenses - Track spending\n" .
                    "• 📊 Reports - Financial insights\n\n" .
                    "What would you like to do?",
                    []
                );
            
            case 'chat':
                // Friendly responses to general conversation
                $responses = [
                    "I'm doing great, thank you for asking! 😊 How can I help you with your business today?",
                    "All good here! Ready to assist you. What would you like to do?",
                    "I'm great! Always ready to help manage your business. What do you need?"
                ];
                return $this->formatResponse(
                    'chat',
                    $responses[array_rand($responses)],
                    []
                );
            
            case 'thanks':
                $responses = [
                    "You're welcome! 😊 Let me know if you need anything else.",
                    "Happy to help! Is there anything else I can do for you?",
                    "No problem! Feel free to ask if you need more help."
                ];
                return $this->formatResponse(
                    'chat',
                    $responses[array_rand($responses)],
                    []
                );
                
            case 'help':
                return $this->formatResponse(
                    'help',
                    $this->getHelpMessage(),
                    ['capabilities' => Router::getAllModules()]
                );
                
            default:
                return $this->handleUnknownIntent($message);
        }
    }
    
    /**
     * Call AI API for data extraction
     */
    private function callAI(string $systemPrompt, string $userMessage): array {
        $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
        
        $data = [
            'model' => 'openai/gpt-oss-20b',
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userMessage]
            ],
            'temperature' => 0.1, // Low temperature for deterministic extraction
            'max_tokens' => 500,
            'response_format' => ['type' => 'json_object']
        ];
        
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->apiKey
            ],
            CURLOPT_TIMEOUT => 30,
            CURLOPT_SSL_VERIFYPEER => false
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        if ($curlError) {
            return ['success' => false, 'error' => 'Network error: ' . $curlError];
        }
        
        if ($httpCode !== 200) {
            $errorData = json_decode($response, true);
            if ($httpCode === 429) {
                preg_match('/try again in ([^.]+)/', $errorData['error']['message'] ?? '', $matches);
                return ['success' => false, 'error' => 'Rate limit. Try again in ' . ($matches[1] ?? '30 seconds')];
            }
            return ['success' => false, 'error' => 'AI service error (HTTP ' . $httpCode . ')'];
        }
        
        $result = json_decode($response, true);
        $aiContent = $result['choices'][0]['message']['content'] ?? '';
        $parsed = json_decode($aiContent, true);
        
        if (!$parsed) {
            return ['success' => false, 'error' => 'Failed to parse AI response'];
        }
        
        return ['success' => true, 'data' => $parsed];
    }
    
    /**
     * Validate AI extraction output
     */
    private function validateExtraction(array $extracted, string $action): array {
        $requiredFields = $this->getRequiredFields($action);
        $extractedData = $extracted['extracted_data'] ?? [];
        $missing = [];
        
        foreach ($requiredFields as $field) {
            // For customer actions, accept EITHER customer_id OR customer_name
            if ($field === 'customer_name' && in_array($action, ['delete_customer', 'view_customer', 'customer_balance', 'customer_transactions', 'update_customer', 'customer_details'])) {
                if (!isset($extractedData['customer_name']) && !isset($extractedData['customer_id'])) {
                    $missing[] = $field;
                }
            } else {
                if (!isset($extractedData[$field]) || $extractedData[$field] === null || $extractedData[$field] === '') {
                    $missing[] = $field;
                }
            }
        }
        
        // Also check AI's own missing_required field
        $aiMissing = $extracted['missing_required'] ?? [];
        $missing = array_unique(array_merge($missing, $aiMissing));
        
        return [
            'isValid' => empty($missing),
            'missing' => $missing,
            'confidence' => $extracted['confidence'] ?? 0.5
        ];
    }
    
    /**
     * Get required fields for action
     */
    private function getRequiredFields(string $action): array {
        $requirements = [
            'create_customer' => [], // Form will collect all fields
            'update_customer' => ['customer_name'], // Need identifier to know which customer to edit
            'delete_customer' => ['customer_name'], // Need customer identifier
            'view_customer' => ['customer_name'],
            'customer_balance' => ['customer_name'],
            'customer_transactions' => ['customer_name'],
            'customer_details' => ['customer_name'], // Need customer identifier for profile
            'add_product' => ['name', 'selling_price'],
            'update_product' => [],
            'create_invoice' => ['items'], // Customer can be looked up
            'record_payment' => ['amount'],
            'add_expense' => ['description', 'amount'],
            'create_tax' => ['name', 'rate'],
            'create_purchase_order' => ['items'],
            'approve_supplier_payment' => []
        ];
        
        return $requirements[$action] ?? [];
    }
    
    /**
     * Validate extraction from data array (without AI response wrapper)
     */
    private function validateExtractionFromData(array $data, string $action): array {
        $requiredFields = $this->getRequiredFields($action);
        $missing = [];
        
        foreach ($requiredFields as $field) {
            // For customer actions, accept EITHER customer_id OR customer_name
            if ($field === 'customer_name' && in_array($action, ['delete_customer', 'view_customer', 'customer_balance', 'customer_transactions', 'update_customer', 'customer_details'])) {
                if (!isset($data['customer_name']) && !isset($data['customer_id'])) {
                    $missing[] = $field;
                }
            } else {
                if (!isset($data[$field]) || $data[$field] === null || $data[$field] === '') {
                    $missing[] = $field;
                }
            }
        }
        
        return [
            'isValid' => empty($missing),
            'missing' => $missing
        ];
    }
    
    /**
     * Smart merge user input into existing data based on missing fields
     */
    private function smartMergeData(array $previousData, string $input, array $missingFields, string $action): ?array {
        // Extract actual data from input like "his name is john doe" => "john doe"
        $extractedValue = Router::extractDataFromInput($input);
        $merged = $previousData;
        
        // For customer actions, assume input is a customer name/identifier
        if (in_array($action, ['delete_customer', 'view_customer', 'customer_balance', 'customer_transactions', 'change_customer_type', 'activate_customer', 'deactivate_customer', 'customer_details'])) {
            if (in_array('customer_name', $missingFields) || in_array('customer_id', $missingFields)) {
                // Check if user entered a list number (1, 2, 3...) - resolve to actual customer
                if (is_numeric($extractedValue) && (int)$extractedValue <= 10) {
                    $listIndex = (int)$extractedValue - 1;
                    $customers = $this->fetchCustomerList();
                    if (isset($customers[$listIndex])) {
                        $merged['customer_id'] = $customers[$listIndex]['id'];
                        $merged['customer_name'] = $customers[$listIndex]['name'];
                        return $merged;
                    }
                    // Fall through - treat as customer ID
                    $merged['customer_id'] = (int)$extractedValue;
                } else {
                    $merged['customer_name'] = $extractedValue;
                }
                return $merged;
            }
        }
        
        // For create_customer, assume input is the name
        if ($action === 'create_customer' && in_array('name', $missingFields)) {
            $merged['name'] = $input;
            return $merged;
        }
        
        // For products, check what's missing
        if (in_array($action, ['add_product', 'update_product', 'adjust_stock'])) {
            if (in_array('name', $missingFields)) {
                $merged['name'] = $input;
                return $merged;
            }
            if (in_array('selling_price', $missingFields) && is_numeric(str_replace(',', '', $input))) {
                $merged['selling_price'] = floatval(str_replace(',', '', $input));
                return $merged;
            }
        }
        
        // For expenses
        if ($action === 'add_expense') {
            if (in_array('description', $missingFields) && !is_numeric(str_replace(',', '', $input))) {
                $merged['description'] = $input;
                return $merged;
            }
            if (in_array('amount', $missingFields) && is_numeric(str_replace(',', '', $input))) {
                $merged['amount'] = floatval(str_replace(',', '', $input));
                return $merged;
            }
        }
        
        return null; // Couldn't determine how to merge
    }
    
    /**
     * Build a friendly clarification message
     * For delete/customer actions, show the customer list as selectable options
     */
    private function buildClarificationMessage(array $missing, string $action): string {
        $fieldLabels = [
            'customer_name' => 'customer name',
            'customer_id' => 'customer',
            'name' => 'name',
            'selling_price' => 'selling price',
            'cost_price' => 'cost price',
            'quantity' => 'quantity',
            'description' => 'description',
            'amount' => 'amount'
        ];
        
        // For customer selection actions - return message for selection UI
        if (in_array($action, ['delete_customer', 'view_customer', 'customer_balance', 'customer_transactions', 'update_customer']) && 
            (in_array('customer_name', $missing) || in_array('customer_id', $missing))) {
            
            $actionLabel = str_replace('_', ' ', $action);
            $actionLabel = str_replace(' customer', '', $actionLabel);
            return "**Select a customer to {$actionLabel}:**";
        }
        
        $missingLabels = array_map(fn($f) => $fieldLabels[$f] ?? $f, $missing);
        
        if (count($missingLabels) === 1) {
            return "What is the **{$missingLabels[0]}**?";
        }
        
        $last = array_pop($missingLabels);
        return "I need the **" . implode('**, **', $missingLabels) . "** and **{$last}**.";
    }
    
    /**
     * Fetch customer list for clarification
     */
    private function fetchCustomerList(int $limit = 10): array {
        try {
            error_log("fetchCustomerList called with companyId={$this->companyId}, limit={$limit}");
            $stmt = $this->pdo->prepare("
                SELECT id, name, email, phone 
                FROM customers 
                WHERE company_id = ? AND is_active = 1
                ORDER BY name ASC
                LIMIT " . intval($limit) . "
            ");
            $stmt->execute([$this->companyId]);
            $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            error_log("fetchCustomerList returned " . count($customers) . " customers");
            return $customers;
        } catch (Exception $e) {
            error_log("fetchCustomerList error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Log task execution
     */
    private function logTaskExecution(array $task, array $input, ?array $output, string $status, ?string $error, float $executionTime): void {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO ai_task_log 
                (company_id, user_id, session_id, task_id, module, action, input_data, output_data, status, error_message, execution_time_ms, created_at, completed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), " . ($status === 'completed' ? 'NOW()' : 'NULL') . ")
            ");
            
            $stmt->execute([
                $this->companyId,
                $this->userId,
                session_id(),
                $task['id'] ?? 'unknown',
                $task['module'],
                $task['action'],
                json_encode($input),
                json_encode($output),
                $status,
                $error,
                (int)$executionTime
            ]);
        } catch (Exception $e) {
            error_log("Task log error: " . $e->getMessage());
        }
    }
    
    /**
     * Format response - Compatible with legacy frontend
     * 
     * The frontend expects:
     * - data.parsed.task_type
     * - data.parsed.extracted_data  
     * - data.parsed.requires_confirmation
     * - data.parsed.risk_level
     * - data.parsed.confidence
     * - data.parsed.conversational_response
     * - data.parsed.clarification_message
     * - data.parsed.has_all_required
     */
    private function formatResponse(string $type, string $message, array $data): array {
        $currentState = $this->fsm->getState();
        $currentTask = $this->fsm->getCurrentTask();
        
        // Map orchestrator types to frontend-expected task types
        $taskTypeMap = [
            'greeting' => 'general_chat',
            'help' => 'general_chat',
            'unknown' => 'unknown',
            'clarification' => $currentTask['action'] ?? 'unknown',
            'confirmation' => $currentTask['action'] ?? 'unknown',
            'success' => $currentTask['action'] ?? 'unknown',
            'error' => 'error',
            'cancelled' => 'cancelled',
            'complete' => 'complete',
            'modify' => $currentTask['action'] ?? 'unknown',
            'warning' => 'warning'
        ];
        
        $taskType = $taskTypeMap[$type] ?? $type;
        $isError = in_array($type, ['error', 'failed']);
        
        // Build parsed object for frontend compatibility
        $parsed = [
            'task_type' => $taskType,
            'intent' => $currentTask['action'] ?? $type,
            'category' => $currentTask['module'] ?? 'general',
            'confidence' => $data['confidence'] ?? ($isError ? 0.0 : 0.9),
            'risk_level' => $data['risk_level'] ?? ($type === 'confirmation' ? 'medium' : 'low'),
            'requires_confirmation' => in_array($type, ['confirmation']),
            'has_all_required' => !in_array($type, ['clarification']),
            'extracted_data' => $data['data'] ?? $data['currentData'] ?? $data,
            'missing_fields' => $data['missing'] ?? [],
            'clarification_message' => $type === 'clarification' ? $message : null,
            'conversational_response' => in_array($type, ['greeting', 'help', 'unknown']) ? $message : null,
            'suggested_action' => $data['suggested_action'] ?? null
        ];
        
        // For direct success/complete responses, include the response message
        if (in_array($type, ['success', 'complete', 'cancelled'])) {
            $parsed['response_message'] = $message;
        }
        
        return [
            'success' => !$isError,
            'type' => $type,
            'message' => $message,
            'parsed' => $parsed,
            'data' => $data,
            'state' => $currentState['state'],
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Get help message
     */
    private function getHelpMessage(): string {
        return "📚 **FirmaFlow AI Assistant - Help**\n\n" .
            "**Customers:**\n" .
            "• \"Create customer [name] with email [email]\"\n" .
            "• \"Show me my customers\"\n\n" .
            "**Inventory:**\n" .
            "• \"Add product [name] price [amount]\"\n" .
            "• \"Show inventory\" / \"What's low in stock?\"\n\n" .
            "**Sales:**\n" .
            "• \"Create invoice for [customer] with [products]\"\n" .
            "• \"Show today's sales\"\n\n" .
            "**Expenses:**\n" .
            "• \"Add expense [description] [amount]\"\n" .
            "• \"Show expense summary\"\n\n" .
            "**Reports:**\n" .
            "• \"Generate profit and loss report\"\n" .
            "• \"Business overview\"\n\n" .
            "**Commands:**\n" .
            "• \"Cancel\" / \"Reset\" - Stop current action\n" .
            "• \"Confirm\" - Approve pending action";
    }
    
    /**
     * Get current state (for debugging)
     */
    public function getDebugState(): array {
        return [
            'fsm' => $this->fsm->getState(),
            'currentTask' => $this->fsm->getCurrentTask(),
            'hasMoreTasks' => $this->fsm->hasMoreTasks()
        ];
    }
}
