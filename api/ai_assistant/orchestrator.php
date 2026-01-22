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
require_once __DIR__ . '/semantic_analyzer.php';

class Orchestrator {
    private $pdo;
    private $companyId;
    private $userId;
    private $apiKey;
    private $fsm;
    private $conversationHistory; // Store conversation context
    private $lastOfferedActions = []; // Track what was just offered for follow-up handling
    private $router;
    
    // Confidence thresholds
    const MIN_CONFIDENCE_TO_PROCEED = 0.7;
    const MIN_CONFIDENCE_FOR_AUTO_EXECUTE = 0.9;
    
    // Maximum messages to include in context (to avoid token limits)
    const MAX_CONTEXT_MESSAGES = 4;
    
    public function __construct($pdo, $companyId, $userId, $apiKey, $conversationHistory = []) {
        $this->pdo = $pdo;
        $this->companyId = $companyId;
        $this->userId = $userId;
        $this->apiKey = $apiKey;
        $this->conversationHistory = $conversationHistory;
        $this->fsm = new FSM($pdo, $companyId, $userId);
        $this->router = new Router();
        
        // Load last offered actions from session
        if (isset($_SESSION['ai_last_offered_actions'])) {
            $this->lastOfferedActions = $_SESSION['ai_last_offered_actions'];
        }
    }
    
    /**
     * Process user message through the complete flow
     * 
     * This is the MAIN ENTRY POINT
     */
    public function processMessage(string $message): array {
        $startTime = microtime(true);
        
        try {
            // STEP 0: Check for timeout and auto-reset if needed
            $this->checkAndHandleTimeout();
            
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
            
            // NEVER return a hard error - always conversational
            return $this->formatResponse(
                'assistant',
                "Oops! Something went wrong on my end, but don't worry - I've reset everything. What would you like to do?",
                ['technical_note' => $e->getMessage()]
            );
        }
    }
    
    /**
     * Check for timeout and handle gracefully
     * 
     * This ensures states don't get stuck indefinitely
     */
    private function checkAndHandleTimeout(): void {
        $state = $this->fsm->getState();
        
        // If no timeout is set or state is IDLE, nothing to check
        if ($state['state'] === FSM::STATE_IDLE || empty($state['timeout_at'])) {
            return;
        }
        
        $timeoutAt = strtotime($state['timeout_at']);
        $now = time();
        
        // If timeout exceeded, reset to IDLE
        if ($timeoutAt > 0 && $now > $timeoutAt) {
            error_log("State timeout detected: {$state['state']} exceeded timeout at {$state['timeout_at']}");
            $this->fsm->resetToIdle("State timeout after " . ($now - $timeoutAt) . " seconds");
        }
    }
    
    /**
     * IDLE STATE: Detect intents and create task queue
     * 
     * NEW FLOW:
     * 1. Check if this is a follow-up to recently offered actions
     * 2. Semantic analysis (AI understanding with spelling correction)
     * 3. Smart routing (code + AI hints)
     * 4. Conversational fallback (NEVER fails)
     */
    private function handleIdleState(string $message): array {
        // STEP 1: Check for follow-ups to recently offered actions
        // Examples: "yes", "view them", "okay let's do that", "create one"
        $followUpResult = $this->handleFollowUp($message);
        if ($followUpResult !== null) {
            return $followUpResult;
        }
        
        // STEP 1.5: FAST PATH - Pattern-based data query detection
        // This catches common queries BEFORE semantic analysis for speed and reliability
        $fastPathResult = $this->detectDataQueryFastPath($message);
        if ($fastPathResult !== null) {
            error_log("handleIdleState - Fast path detected data query");
            return $fastPathResult;
        }
        
        // STEP 2: SEMANTIC UNDERSTANDING (First AI call - with spelling tolerance)
        error_log("handleIdleState - Starting semantic analysis for: '{$message}'");
        $semanticAnalyzer = new SemanticAnalyzer($this->apiKey, $this->conversationHistory);
        $semanticAnalysis = $semanticAnalyzer->analyze($message);
        
        error_log("handleIdleState - Semantic analysis result: " . json_encode($semanticAnalysis));
        
        // STEP 3: SMART ROUTING (Code uses AI hints)
        $intents = Router::detectIntentsWithSemantics($message, $semanticAnalysis);
        error_log("handleIdleState - Detected intents: " . json_encode($intents));
        
        // STEP 3: Handle based on intent type
        $primaryIntent = $intents[0];
        
        // If it's a general/conversational intent, handle immediately
        if ($primaryIntent['module'] === 'general') {
            return $this->handleGeneralIntent($primaryIntent, $message, $semanticAnalysis);
        }
        
        // STEP 4: Check if it's a data query that should execute immediately
        // Examples: "who is my top customer?", "show my sales", "what products do I have?"
        if (!empty($primaryIntent['is_data_query']) || 
            $semanticAnalysis['user_intent_type'] === 'data_query') {
            // This is a database query - execute immediately and return REAL data
            error_log("handleIdleState - Detected data query, executing immediately");
            
            // For data queries, we need to determine the specific action
            $originalQuery = $primaryIntent['data']['original_query'] ?? $message;
            $dataIntent = $this->determineDataQueryAction($primaryIntent, $originalQuery);
            
            return $this->executeDataQuery($dataIntent, $originalQuery);
        }
        
        // STEP 5: Check if it's a pure definition question (no database needed)
        if (!$semanticAnalysis['action_required'] && 
            $semanticAnalysis['user_intent_type'] === 'question') {
            // This is a definition question, not a data query
            // Example: "what is a customer?", "how does invoicing work?"
            error_log("handleIdleState - Detected definition question, routing to chat");
            return $this->handleGeneralIntent($primaryIntent, $message, $semanticAnalysis);
        }
        
        // STEP 5: Handle capability questions ("can I...", "how do I...")
        if ($this->isCapabilityQuestion($primaryIntent['action'])) {
            return $this->handleCapabilityQuestion($primaryIntent, $message);
        }
        
        // STEP 6: This is an action request - create task queue
        $taskQueue = TaskQueue::buildQueue($intents);
        $this->fsm->setTaskQueue($taskQueue);
        
        // STEP 7: Transition to INTENT_DETECTED
        $this->fsm->transition(FSM::STATE_INTENT_DETECTED, [
            'originalMessage' => $message,
            'intentCount' => count($intents),
            'semanticAnalysis' => $semanticAnalysis
        ], 'Intents detected by router');
        
        // STEP 8: Immediately process first task
        return $this->processCurrentTask($message);
    }
    
    /**
     * Execute informational query directly (no confirmation needed)
     */
    private function executeInformationalQuery(array $intent, string $message): array {
        error_log("executeInformationalQuery - Module: {$intent['module']}, Action: {$intent['action']}");
        
        // Load handler
        $handlerFile = __DIR__ . '/handlers/' . $intent['module'] . '_handler.php';
        if (!file_exists($handlerFile)) {
            return $this->formatResponse(
                'assistant',
                "I understand you're asking about {$intent['module']}, but I don't have access to that module yet. What else can I help you with?",
                []
            );
        }
        
        require_once $handlerFile;
        $handlerFunction = 'handle' . ucfirst($intent['module']) . 'Intent';
        
        if (!function_exists($handlerFunction)) {
            return $this->formatResponse(
                'assistant',
                "I can help you with {$intent['module']}, but the system needs to be configured first. Is there anything else I can assist with?",
                []
            );
        }
        
        // Execute query
        $result = $handlerFunction(
            $intent['action'],
            $intent['data'] ?? [],
            'executing',
            $this->pdo,
            $this->companyId,
            $this->userId
        );
        
        // Return result directly
        return $result;
    }
    
    /**
     * Determine specific action for a data query
     * Examples: "who is my top customer?" -> top_customers
     *           "show my customers" -> customer_summary
     *           "today's sales" -> sales_summary
     */
    private function determineDataQueryAction(array $intent, string $query): array {
        $query = strtolower($query);
        
        // Detect "top" queries for customers
        if (preg_match('/\b(top|best|biggest|highest)\b.*\b(customer|client)/i', $query)) {
            $intent['action'] = 'top_customers';
            $intent['data']['limit'] = 10;
            $intent['data']['metric'] = 'revenue';
        }
        // Detect sales/revenue queries
        elseif (preg_match('/\b(sales?|revenue|earnings?|income)\b/i', $query)) {
            // Check for time-based filters
            if (preg_match('/\b(today|today\'?s)\b/i', $query)) {
                $intent['data']['date_range'] = 'today';
            } elseif (preg_match('/\b(this\s+month|monthly)\b/i', $query)) {
                $intent['data']['date_range'] = 'this_month';
            } elseif (preg_match('/\b(this\s+week|weekly)\b/i', $query)) {
                $intent['data']['date_range'] = 'this_week';
            } elseif (preg_match('/\b(this\s+year|yearly|annual)\b/i', $query)) {
                $intent['data']['date_range'] = 'this_year';
            }
            
            // Ensure correct module and action
            $intent['module'] = 'sales';
            $intent['action'] = 'sales_summary';
        }
        // Detect "recent" queries
        elseif (preg_match('/\b(recent|latest|last)\b/i', $query)) {
            // Keep the summary action but add ordering
            $intent['data']['sort'] = 'recent';
        }
        
        return $intent;
    }
    
    /**
     * Execute data query and format response using AI with REAL data
     * This prevents AI from inventing data
     */
    private function executeDataQuery(array $intent, string $originalQuery): array {
        error_log("executeDataQuery - Query: '{$originalQuery}', Module: {$intent['module']}, Action: {$intent['action']}");
        
        // Load handler
        $handlerFile = __DIR__ . '/handlers/' . $intent['module'] . '_handler.php';
        if (!file_exists($handlerFile)) {
            return $this->formatResponse(
                'assistant',
                "I'd like to help with that query, but I don't have access to {$intent['module']} data yet.",
                []
            );
        }
        
        require_once $handlerFile;
        $handlerFunction = 'handle' . ucfirst($intent['module']) . 'Intent';
        
        if (!function_exists($handlerFunction)) {
            return $this->formatResponse(
                'assistant',
                "I can access {$intent['module']}, but the handler isn't configured. Please contact support.",
                []
            );
        }
        
        // Execute query to get REAL data
        $result = $handlerFunction(
            $intent['action'],
            $intent['data'] ?? [],
            'executing',
            $this->pdo,
            $this->companyId,
            $this->userId
        );
        
        error_log("executeDataQuery - Raw result: " . json_encode($result));
        
        // If query succeeded, store result in session for follow-up questions
        // Note: Some handlers return 'success', others return 'status'
        $isSuccess = (!empty($result['success']) || (!empty($result['status']) && $result['status'] === 'success'));
        
        if ($isSuccess && !empty($result['data'])) {
            $_SESSION['last_query_result'] = [
                'query' => $originalQuery,
                'module' => $intent['module'],
                'action' => $intent['action'],
                'data' => $result['data'],
                'timestamp' => time()
            ];
            error_log("executeDataQuery - Stored result in session for follow-ups");
        }
        
        // Return the result wrapped in formatResponse for frontend compatibility
        // Handlers return {success, message, data} OR {status, message, data}
        if ($isSuccess) {
            return $this->formatResponse(
                'success',
                $result['message'] ?? 'Query completed',
                $result['data'] ?? []
            );
        } else {
            return $this->formatResponse(
                'error',
                $result['error'] ?? $result['message'] ?? 'Query failed',
                []
            );
        }
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
        
        // Check if message contains form data (JSON from frontend)
        $decodedData = json_decode($message, true);
        if (is_array($decodedData) && !empty($decodedData)) {
            // Form data provided - merge with extracted data
            $extractedData = array_merge($extractedData, $decodedData);
            $this->fsm->setContextData([
                'extractedData' => $extractedData,
                'pendingTask' => $currentTask
            ]);
            // Treat as approval with updated data
            return $this->executeTask($currentTask, $extractedData);
        }
        
        // Check if message is "id X" format (from selection list)
        if (preg_match('/^id\s+(\d+)$/i', trim($message), $matches)) {
            $selectedId = (int)$matches[1];
            error_log("Selected ID from list: {$selectedId}");
            
            // Handle supplier selection
            if (in_array($currentTask['action'], ['update_supplier', 'delete_supplier', 'view_supplier', 'supplier_balance', 'supplier_transactions', 'supplier_details'])) {
                $extractedData['supplier_id'] = $selectedId;
                
                // For update_supplier, fetch and show form
                if ($currentTask['action'] === 'update_supplier') {
                    $stmt = $this->pdo->prepare("
                        SELECT id, name, contact_person, phone, email, address, 
                               tax_number, payment_terms, is_active 
                        FROM suppliers 
                        WHERE id = ? AND company_id = ?
                    ");
                    $stmt->execute([$selectedId, $this->companyId]);
                    $supplier = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if (!$supplier) {
                        return $this->formatResponse(
                            'error',
                            'Supplier not found.',
                            []
                        );
                    }
                    
                    // Map database fields to form fields
                    $data = [
                        'supplier_id' => $selectedId,
                        'company_name' => $supplier['name'],
                        'contact_person' => $supplier['contact_person'],
                        'phone' => $supplier['phone'],
                        'email' => $supplier['email'],
                        'address' => $supplier['address'],
                        'tax_number' => $supplier['tax_number'],
                        'payment_terms' => $supplier['payment_terms'] ?? 'Net 30 days',
                        'is_active' => $supplier['is_active'] == 1
                    ];
                    error_log("Loaded supplier data for edit: " . json_encode($data));
                    
                    // Update FSM context with complete data
                    $this->fsm->setContextData([
                        'extractedData' => $data,
                        'pendingTask' => $currentTask
                    ]);
                    
                    // Build and return form
                    $formConfig = $this->buildSupplierFormConfig($data);
                    
                    return $this->formatResponse(
                        'form',
                        "📝 Edit Supplier - Review and edit the details below:",
                        array_merge($formConfig, [
                            'action' => $currentTask['action'],
                            'module' => $currentTask['module']
                        ])
                    );
                }
                
                // For delete_supplier, fetch supplier details for confirmation display
                if ($currentTask['action'] === 'delete_supplier') {
                    $stmt = $this->pdo->prepare("
                        SELECT id, name, email, phone, contact_person 
                        FROM suppliers 
                        WHERE id = ? AND company_id = ?
                    ");
                    $stmt->execute([$selectedId, $this->companyId]);
                    $supplier = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($supplier) {
                        $extractedData['supplier_name'] = $supplier['name'];
                        $extractedData['supplier_email'] = $supplier['email'];
                        $extractedData['supplier_phone'] = $supplier['phone'];
                    }
                    
                    // Update context without re-transitioning (already in AWAITING_CONFIRMATION)
                    $this->fsm->setContextData([
                        'extractedData' => $extractedData,
                        'pendingTask' => $currentTask
                    ]);
                    
                    // Build and return confirmation directly without requestConfirmation()
                    $displayData = $this->enhanceDataForDisplay($currentTask, $extractedData);
                    $summary = $this->formatConfirmationMessage($currentTask, $displayData);
                    
                    return $this->formatResponse(
                        'confirmation',
                        $summary,
                        [
                            'action' => $currentTask['action'],
                            'module' => $currentTask['module'],
                            'data' => $displayData,
                            'options' => ['Confirm', 'Cancel', 'Modify']
                        ]
                    );
                }
                
                // For other supplier actions with selection, update data and show confirmation
                $this->fsm->setContextData([
                    'extractedData' => $extractedData,
                    'pendingTask' => $currentTask
                ]);
                
                return $this->requestConfirmation($currentTask, $extractedData);
            }
            
            // Handle customer selection
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
            
            // For create_supplier with missing data, show form immediately
            if ($action === 'create_supplier') {
                // Go straight to form for create supplier
                $extractedData = $extracted['extracted_data'] ?? [];
                $this->fsm->transition(FSM::STATE_DATA_EXTRACTED, [
                    'extractedData' => $extractedData,
                    'confidence' => 0.8
                ], 'Showing supplier creation form');
                
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
            
            // For update_supplier with missing supplier identifier, show supplier list
            if ($action === 'update_supplier' && 
                (in_array('supplier_name', $validation['missing']) || in_array('supplier_id', $validation['missing']))) {
                $suppliers = $this->fetchSupplierList(20);
                
                if (empty($suppliers)) {
                    return $this->formatResponse(
                        'error',
                        'No suppliers found in your account. Please create a supplier first.',
                        []
                    );
                }
                
                // CRITICAL: Transition through proper FSM states
                // INTENT_DETECTED → DATA_EXTRACTED → AWAITING_CONFIRMATION
                $this->fsm->transition(FSM::STATE_DATA_EXTRACTED, [
                    'extractedData' => $extracted['extracted_data'] ?? [],
                    'pendingFields' => $validation['missing'],
                    'pendingTask' => $currentTask
                ], 'Data extracted for supplier selection');
                
                $this->fsm->transition(FSM::STATE_AWAITING_CONFIRMATION, [
                    'extractedData' => $extracted['extracted_data'] ?? [],
                    'pendingFields' => $validation['missing'],
                    'pendingTask' => $currentTask,
                    'action' => $action
                ], 'Showing supplier selection list for update');
                
                return $this->formatResponse(
                    'clarification',
                    '**Select a supplier to edit:**',
                    [
                        'missing' => $validation['missing'],
                        'currentData' => $extracted['extracted_data'] ?? [],
                        'options' => array_map(function($supplier) {
                            return [
                                'id' => $supplier['id'],
                                'label' => $supplier['name'],
                                'sublabel' => $supplier['email'] ?? $supplier['contact_person'] ?? '',
                                'value' => $supplier['id']
                            ];
                        }, $suppliers),
                        'selectType' => 'supplier',
                        'awaitingInput' => true
                    ]
                );
            }
            
            // For delete_supplier with missing supplier identifier, show supplier list
            if ($action === 'delete_supplier' && 
                (in_array('supplier_name', $validation['missing']) || in_array('supplier_id', $validation['missing']))) {
                $suppliers = $this->fetchSupplierList(20);
                
                if (empty($suppliers)) {
                    return $this->formatResponse(
                        'error',
                        'No suppliers found in your account. Please create a supplier first.',
                        []
                    );
                }
                
                // CRITICAL: Transition through proper FSM states
                // INTENT_DETECTED → DATA_EXTRACTED → AWAITING_CONFIRMATION
                $this->fsm->transition(FSM::STATE_DATA_EXTRACTED, [
                    'extractedData' => $extracted['extracted_data'] ?? [],
                    'pendingFields' => $validation['missing'],
                    'pendingTask' => $currentTask
                ], 'Data extracted for supplier selection');
                
                $this->fsm->transition(FSM::STATE_AWAITING_CONFIRMATION, [
                    'extractedData' => $extracted['extracted_data'] ?? [],
                    'pendingFields' => $validation['missing'],
                    'pendingTask' => $currentTask,
                    'action' => $action
                ], 'Showing supplier selection list for delete');
                
                return $this->formatResponse(
                    'clarification',
                    '**Select a supplier to delete:**',
                    [
                        'missing' => $validation['missing'],
                        'currentData' => $extracted['extracted_data'] ?? [],
                        'options' => array_map(function($supplier) {
                            return [
                                'id' => $supplier['id'],
                                'label' => $supplier['name'],
                                'sublabel' => $supplier['email'] ?? $supplier['contact_person'] ?? '',
                                'value' => $supplier['id']
                            ];
                        }, $suppliers),
                        'selectType' => 'supplier',
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
            
            // Add selectable supplier list for supplier-related actions
            if (in_array($action, ['delete_supplier', 'view_supplier', 'supplier_balance', 'supplier_transactions', 'supplier_details']) && 
                (in_array('supplier_name', $validation['missing']) || in_array('supplier_id', $validation['missing']))) {
                $suppliers = $this->fetchSupplierList(20);
                error_log("Fetched " . count($suppliers) . " suppliers for selection");
                if (!empty($suppliers)) {
                    $responseData['options'] = array_map(function($supplier) {
                        return [
                            'id' => $supplier['id'],
                            'label' => $supplier['name'],
                            'sublabel' => $supplier['email'] ?? $supplier['contact_person'] ?? '',
                            'value' => $supplier['id']
                        ];
                    }, $suppliers);
                    $responseData['selectType'] = 'supplier';
                    error_log("Added " . count($responseData['options']) . " supplier options to response");
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
        
        // For supplier_details, also include raw_input for fallback name extraction
        if ($action === 'supplier_details') {
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
        
        // For create/edit supplier, return editable form
        if (in_array($task['action'], ['create_supplier', 'update_supplier'])) {
            // For update_supplier, fetch full supplier data if only ID/name provided
            if ($task['action'] === 'update_supplier') {
                $supplierId = $data['supplier_id'] ?? null;
                $supplierName = null;
                
                // Check if supplier_name is numeric (ID from selection) or actual name
                if (!$supplierId && isset($data['supplier_name'])) {
                    if (is_numeric($data['supplier_name'])) {
                        $supplierId = (int)$data['supplier_name'];
                    } else {
                        $supplierName = $data['supplier_name'];
                    }
                }
                
                // If we have a supplier ID, fetch the record
                if ($supplierId) {
                    $stmt = $this->pdo->prepare("
                        SELECT id, name, contact_person, phone, email, address, 
                               tax_number, payment_terms, is_active 
                        FROM suppliers 
                        WHERE id = ? AND company_id = ?
                    ");
                    $stmt->execute([$supplierId, $this->companyId]);
                    $supplier = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($supplier) {
                        // Filter out empty values from $data to preserve supplier data
                        $nonEmptyData = array_filter($data, function($value) {
                            return $value !== '' && $value !== null;
                        });
                        // Map database fields to form fields
                        $mappedSupplier = [
                            'supplier_id' => $supplier['id'],
                            'company_name' => $supplier['name'],
                            'contact_person' => $supplier['contact_person'],
                            'phone' => $supplier['phone'],
                            'email' => $supplier['email'],
                            'address' => $supplier['address'],
                            'tax_number' => $supplier['tax_number'],
                            'payment_terms' => $supplier['payment_terms'],
                            'is_active' => $supplier['is_active'] == 1
                        ];
                        $data = array_merge($mappedSupplier, $nonEmptyData);
                        $data['supplier_id'] = $supplierId;
                    }
                } elseif ($supplierName) {
                    // Search by name
                    error_log("Searching for supplier by name: {$supplierName}");
                    $stmt = $this->pdo->prepare("
                        SELECT id, name, contact_person, phone, email, address, 
                               tax_number, payment_terms, is_active 
                        FROM suppliers 
                        WHERE name LIKE ? AND company_id = ? AND is_active = 1
                    ");
                    $stmt->execute(["%{$supplierName}%", $this->companyId]);
                    $matches = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    error_log("Found " . count($matches) . " matching suppliers");
                    
                    if (empty($matches)) {
                        // No supplier found - show full list with message
                        $allSuppliers = $this->fetchSupplierList(20);
                        
                        if (empty($allSuppliers)) {
                            return $this->formatResponse(
                                'error',
                                'No suppliers found in your account.',
                                []
                            );
                        }
                        
                        return $this->formatResponse(
                            'clarification',
                            "⚠️ Supplier **{$supplierName}** not found. Please select from the list below:",
                            [
                                'missing' => ['supplier_name'],
                                'currentData' => [],
                                'options' => array_map(function($supplier) {
                                    return [
                                        'id' => $supplier['id'],
                                        'label' => $supplier['name'],
                                        'sublabel' => $supplier['email'] ?? $supplier['contact_person'] ?? '',
                                        'value' => $supplier['id']
                                    ];
                                }, $allSuppliers),
                                'selectType' => 'supplier',
                                'awaitingInput' => true
                            ]
                        );
                    } elseif (count($matches) === 1) {
                        // Exact match - show form
                        $supplier = $matches[0];
                        // Filter out empty values to preserve supplier data
                        $nonEmptyData = array_filter($data, function($value) {
                            return $value !== '' && $value !== null;
                        });
                        // Map database fields to form fields
                        $mappedSupplier = [
                            'supplier_id' => $supplier['id'],
                            'company_name' => $supplier['name'],
                            'contact_person' => $supplier['contact_person'],
                            'phone' => $supplier['phone'],
                            'email' => $supplier['email'],
                            'address' => $supplier['address'],
                            'tax_number' => $supplier['tax_number'],
                            'payment_terms' => $supplier['payment_terms'],
                            'is_active' => $supplier['is_active'] == 1
                        ];
                        $data = array_merge($mappedSupplier, $nonEmptyData);
                        $data['supplier_id'] = $supplier['id'];
                    } else {
                        // Multiple matches - show selection
                        return $this->formatResponse(
                            'clarification',
                            "Found **" . count($matches) . " suppliers** matching **{$supplierName}**. Please select one:",
                            [
                                'missing' => ['supplier_name'],
                                'currentData' => [],
                                'options' => array_map(function($supplier) {
                                    return [
                                        'id' => $supplier['id'],
                                        'label' => $supplier['name'],
                                        'sublabel' => $supplier['email'] ?? $supplier['contact_person'] ?? '',
                                        'value' => $supplier['id']
                                    ];
                                }, $matches),
                                'selectType' => 'supplier',
                                'awaitingInput' => true
                            ]
                        );
                    }
                }
            }
            
            $formConfig = $this->buildSupplierFormConfig($data);
            $actionLabel = $task['action'] === 'create_supplier' ? 'Create Supplier' : 'Edit Supplier';
            
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
        
        // For supplier actions, enhance display with supplier details
        if (in_array($task['action'], ['delete_supplier', 'view_supplier', 'supplier_balance', 'supplier_transactions', 'supplier_details'])) {
            $supplierId = null;
            
            // Get supplier ID from either supplier_id field or supplier_name if it's numeric
            if (isset($data['supplier_id'])) {
                $supplierId = $data['supplier_id'];
            } elseif (isset($data['supplier_name']) && is_numeric($data['supplier_name'])) {
                // supplier_name contains an ID
                $supplierId = (int)$data['supplier_name'];
            }
            
            if ($supplierId && !isset($data['supplier_name']) || (isset($data['supplier_name']) && is_numeric($data['supplier_name']))) {
                error_log("Fetching supplier by ID: {$supplierId}");
                $supplier = $this->fetchSupplierById($supplierId);
                error_log("Fetched supplier: " . json_encode($supplier));
                if ($supplier) {
                    $displayData['supplier_id'] = $supplierId; // Ensure ID is in data for execution
                    $displayData['supplier_name'] = $supplier['name'];
                    if ($supplier['email']) {
                        $displayData['supplier_email'] = $supplier['email'];
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
            
            // Skip showing supplier_id if we have supplier_name (it's redundant for display)
            if ($key === 'supplier_id' && isset($data['supplier_name'])) {
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
     * Fetch supplier by ID for display purposes
     */
    private function fetchSupplierById(int $supplierId): ?array {
        try {
            $stmt = $this->pdo->prepare("SELECT id, name, email, phone, contact_person FROM suppliers WHERE id = ? AND company_id = ?");
            $stmt->execute([$supplierId, $this->companyId]);
            $supplier = $stmt->fetch(PDO::FETCH_ASSOC);
            return $supplier ?: null;
        } catch (Exception $e) {
            error_log("fetchSupplierById error: " . $e->getMessage());
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
     * Build supplier form configuration for editable UI
     */
    private function buildSupplierFormConfig(array $data = []): array {
        return [
            'type' => 'form',
            'fieldConfig' => [
                'company_name' => [
                    'label' => 'Company Name',
                    'type' => 'text',
                    'required' => true,
                    'placeholder' => 'Enter supplier company name'
                ],
                'contact_person' => [
                    'label' => 'Contact Person',
                    'type' => 'text',
                    'required' => true,
                    'placeholder' => 'Enter contact person name'
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
                    'placeholder' => 'supplier@example.com'
                ],
                'address' => [
                    'label' => 'Address',
                    'type' => 'textarea',
                    'required' => true,
                    'placeholder' => 'Enter complete address'
                ],
                'tax_number' => [
                    'label' => 'Tax Number / TIN',
                    'type' => 'text',
                    'required' => false,
                    'placeholder' => 'Enter tax identification number'
                ],
                'payment_terms' => [
                    'label' => 'Payment Terms',
                    'type' => 'select',
                    'required' => false,
                    'options' => ['Immediate', 'Net 7 days', 'Net 15 days', 'Net 30 days', 'Net 45 days', 'Net 60 days'],
                    'default' => 'Net 30 days'
                ],
                'is_active' => [
                    'label' => 'Active Supplier',
                    'type' => 'checkbox',
                    'required' => false,
                    'placeholder' => 'Mark as active supplier',
                    'default' => true
                ]
            ],
            'fields' => [
                'supplier_id' => $data['supplier_id'] ?? $data['id'] ?? null, // CRITICAL: Preserve ID for updates
                'company_name' => $data['company_name'] ?? $data['name'] ?? $data['supplier_name'] ?? '',
                'contact_person' => $data['contact_person'] ?? $data['contact'] ?? '',
                'phone' => $data['phone'] ?? '',
                'email' => $data['email'] ?? '',
                'address' => $data['address'] ?? '',
                'tax_number' => $data['tax_number'] ?? $data['tax_id'] ?? '',
                'payment_terms' => $data['payment_terms'] ?? 'Net 30 days',
                'is_active' => $data['is_active'] ?? (($data['status'] ?? 'active') === 'active')
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
     * Handle unknown intent - NEVER fails, always responds helpfully
     */
    private function handleUnknownIntent(string $message, array $semanticAnalysis = []): array {
        // Use semantic summary if available
        $summary = $semanticAnalysis['summary'] ?? '';
        
        // If semantic analysis gave us some hints
        if (!empty($semanticAnalysis['suggested_topics'])) {
            $topics = implode(', ', $semanticAnalysis['suggested_topics']);
            return $this->formatResponse(
                'assistant',
                "I think you're asking about {$topics}. Could you tell me a bit more about what you'd like to do? For example:\n" .
                "• View information\n" .
                "• Create something new\n" .
                "• Update existing data\n" .
                "• Get a report",
                ['originalMessage' => $message, 'semanticHints' => $semanticAnalysis]
            );
        }
        
        // Generic helpful response
        return $this->formatResponse(
            'assistant',
            "I want to help, but I'm not quite sure what you're looking for. Here are some things I can do:\n\n" .
            "**Data & Reports:**\n" .
            "• \"Show me my customers\"\n" .
            "• \"List my products\"\n" .
            "• \"Sales summary\"\n\n" .
            "**Actions:**\n" .
            "• \"Create a customer\"\n" .
            "• \"Add a product\"\n" .
            "• \"Record an expense\"\n\n" .
            "What would you like to try?",
            ['originalMessage' => $message]
        );
    }
    
    /**
     * Handle follow-up responses to recently offered actions
     * Examples: "yes", "view them", "okay let's do that", "create one"
     */
    private function handleFollowUp(string $message): ?array {
        if (empty($this->lastOfferedActions)) {
            error_log("handleFollowUp - No offered actions in session");
            return null; // No recent offers to follow up on
        }
        
        error_log("handleFollowUp - Last offered actions: " . json_encode($this->lastOfferedActions));
        
        $lower = trim(strtolower($message));
        
        // Check if message is a confirmation/selection
        $isViewRequest = preg_match('/^(yes|yeah|yep|sure|ok|okay|alright|yea|yup)$/i', $lower) ||
                         preg_match('/\b(view|show|list|see|display)\s*(them|it|those|the|my|all)?\b/i', $lower) ||
                         preg_match('/^let\'?s?\s*(view|show|see|look)/i', $lower);
        
        $isCreateRequest = preg_match('/\b(create|add|new|make)\s*(one|it|a|an|them)?\b/i', $lower) ||
                           preg_match('/^let\'?s?\s*(create|add|make)/i', $lower);
        
        $isNegative = preg_match('/^(no|nope|nah|cancel|nevermind|never\s*mind|not?\s*now)$/i', $lower);
        
        error_log("handleFollowUp - isViewRequest: " . ($isViewRequest ? 'yes' : 'no') . 
                  ", isCreateRequest: " . ($isCreateRequest ? 'yes' : 'no') . 
                  ", isNegative: " . ($isNegative ? 'yes' : 'no'));
        
        if ($isNegative) {
            // User declined - clear offers and stay conversational
            $this->clearOfferedActions();
            return $this->formatResponse(
                'assistant',
                "No problem! Let me know if you need anything else.",
                []
            );
        }
        
        if ($isViewRequest) {
            // User wants to VIEW - execute the view action
            $actionInfo = $this->lastOfferedActions;
            $this->clearOfferedActions();
            
            if (isset($actionInfo['view_action']) && isset($actionInfo['module'])) {
                error_log("handleFollowUp - Executing view action: {$actionInfo['view_action']} in {$actionInfo['module']}");
                // Execute the view action immediately (no confirmation needed)
                return $this->executeDirectQuery($actionInfo['view_action'], $actionInfo['module']);
            }
        }
        
        if ($isCreateRequest) {
            // User wants to CREATE
            $actionInfo = $this->lastOfferedActions;
            $this->clearOfferedActions();
            
            if (isset($actionInfo['create_action']) && isset($actionInfo['module'])) {
                error_log("handleFollowUp - Starting create flow: {$actionInfo['create_action']} in {$actionInfo['module']}");
                // Start the creation flow
                return $this->startCreationFlow($actionInfo['create_action'], $actionInfo['module']);
            }
        }
        
        error_log("handleFollowUp - No match, returning null");
        return null; // Not a follow-up, process normally
    }
    
    /**
     * Execute a direct query action (view customers, list products, etc.)
     */
    private function executeDirectQuery(string $action, string $module): array {
        try {
            error_log("Executing direct query: {$action} in module {$module}");
            
            // Route to appropriate handler based on module
            $handlerPath = __DIR__ . "/handlers/{$module}_handler.php";
            if (!file_exists($handlerPath)) {
                return $this->formatResponse(
                    'error',
                    "I couldn't find the handler for {$module}. Please try again or contact support.",
                    []
                );
            }
            
            require_once $handlerPath;
            
            // Map module to handler function
            $handlerFunctionMap = [
                'customers' => 'handleCustomersIntent',
                'inventory' => 'handleInventoryIntent',
                'suppliers' => 'handleSuppliersIntent',
                'sales' => 'handleSalesIntent',
                'expenses' => 'handleExpensesIntent',
                'reports' => 'handleReportsIntent',
                'payments' => 'handlePaymentsIntent',
                'purchases' => 'handlePurchasesIntent'
            ];
            
            $handlerFunction = $handlerFunctionMap[$module] ?? null;
            
            if (!$handlerFunction || !function_exists($handlerFunction)) {
                return $this->formatResponse(
                    'error',
                    "Handler function not found for module: {$module}",
                    []
                );
            }
            
            // Call the handler with the action and empty data (list all)
            $state = $this->fsm->getState();
            $result = $handlerFunction($action, [], $state, $this->pdo, $this->companyId, $this->userId);
            
            if ($result['success']) {
                return $result;
            } else {
                return $this->formatResponse(
                    'error',
                    $result['message'] ?? "An error occurred while fetching the data.",
                    []
                );
            }
            
        } catch (Exception $e) {
            error_log("Error executing direct query: " . $e->getMessage());
            return $this->formatResponse(
                'error',
                "Sorry, I encountered an error: " . $e->getMessage(),
                []
            );
        }
    }
    
    /**
     * Start a creation flow (create customer, product, etc.)
     */
    private function startCreationFlow(string $action, string $module): array {
        // Build task queue for creation
        $intent = [
            'module' => $module,
            'action' => $action,
            'confidence' => 1.0,
            'matched_patterns' => []
        ];
        
        $taskQueue = TaskQueue::buildQueue([$intent]);
        $this->fsm->setTaskQueue($taskQueue);
        
        $this->fsm->transition(FSM::STATE_INTENT_DETECTED, [
            'originalMessage' => "create {$module}",
            'intentCount' => 1
        ], 'Starting creation flow from follow-up');
        
        // Process the first task
        return $this->handleIntentDetected();
    }
    
    /**
     * Save offered actions to session for follow-up
     */
    private function saveOfferedActions(string $module, ?string $viewAction = null, ?string $createAction = null) {
        $this->lastOfferedActions = [
            'module' => $module,
            'view_action' => $viewAction,
            'create_action' => $createAction,
            'timestamp' => time()
        ];
        $_SESSION['ai_last_offered_actions'] = $this->lastOfferedActions;
    }
    
    /**
     * Clear offered actions
     */
    private function clearOfferedActions() {
        $this->lastOfferedActions = [];
        unset($_SESSION['ai_last_offered_actions']);
    }
    
    /**
     * Save offered actions based on message content
     * This detects what topic was discussed and saves relevant actions for follow-up
     */
    private function saveOfferedActionsFromMessage(string $message) {
        $lower = strtolower($message);
        
        // Topic to action mappings
        $topicMappings = [
            'customer' => ['module' => 'customers', 'view_action' => 'customer_summary', 'create_action' => 'create_customer'],
            'supplier' => ['module' => 'suppliers', 'view_action' => 'supplier_summary', 'create_action' => 'create_supplier'],
            'vendor' => ['module' => 'suppliers', 'view_action' => 'supplier_summary', 'create_action' => 'create_supplier'],
            'product' => ['module' => 'inventory', 'view_action' => 'inventory_summary', 'create_action' => 'create_product'],
            'inventory' => ['module' => 'inventory', 'view_action' => 'inventory_summary', 'create_action' => 'create_product'],
            'invoice' => ['module' => 'sales', 'view_action' => 'sales_summary', 'create_action' => 'create_invoice'],
            'sale' => ['module' => 'sales', 'view_action' => 'sales_summary', 'create_action' => 'create_invoice'],
            'expense' => ['module' => 'expenses', 'view_action' => 'expense_summary', 'create_action' => 'create_expense'],
            'payment' => ['module' => 'payments', 'view_action' => 'payment_summary', 'create_action' => 'record_payment'],
            'report' => ['module' => 'reports', 'view_action' => 'view_dashboard', 'create_action' => null],
        ];
        
        // Find which topic was mentioned
        foreach ($topicMappings as $topic => $actions) {
            if (preg_match("/\\b{$topic}s?\\b/i", $lower)) {
                $this->saveOfferedActions($actions['module'], $actions['view_action'], $actions['create_action']);
                error_log("Saved offered actions for topic: {$topic} - " . json_encode($actions));
                return;
            }
        }
    }

    /**
     * Handle general intents (greetings, help, chat)
     * Now accepts semantic analysis for smarter responses
     */
    private function handleGeneralIntent(array $intent, string $message, array $semanticAnalysis = []): array {
        $action = $intent['action'];
        
        // For unknown actions, use semantic intelligence
        if ($action === 'unknown') {
            return $this->handleUnknownIntent($message, $semanticAnalysis);
        }
        
        switch ($action) {
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
                    "Just ask me anything or tell me what you need!",
                    []
                );
            
            case 'chat':
                // For actual questions, use AI to respond intelligently (NOT as JSON)
                if ($semanticAnalysis['user_intent_type'] === 'question' || 
                    preg_match('/\b(what|who|where|when|why|how|explain|tell\s+me)\b/i', $message)) {
                    
                    // Check if we have recent query results that might be relevant
                    $contextData = '';
                    if (!empty($_SESSION['last_query_result'])) {
                        $lastQuery = $_SESSION['last_query_result'];
                        // Only use if it's recent (within last 2 minutes)
                        if ((time() - $lastQuery['timestamp']) < 120) {
                            $contextData = "\n\nIMPORTANT: The user just received this data from the database:\n" .
                                json_encode($lastQuery['data'], JSON_PRETTY_PRINT) . "\n" .
                                "Use this REAL data to answer their question. Do NOT make up any information.";
                            error_log("handleGeneralIntent - Providing last query result as context");
                        }
                    }
                    
                    // Build a simple conversational prompt (no JSON requirement)
                    $conversationalPrompt = "You are a helpful business assistant for FirmaFlow, a business management system. " .
                        "Answer the user's question naturally and conversationally. " .
                        "If it's about a business concept (customer, invoice, product, expense, etc.), explain it clearly. " .
                        "If they ask about something you can help with, offer to show them or help them create one. " .
                        "Keep your response brief and friendly. Do NOT return JSON - just respond naturally." .
                        $contextData;
                    
                    $aiResponse = $this->callAI($conversationalPrompt, $message, false); // false = don't force JSON
                    
                    if ($aiResponse['success'] && !empty($aiResponse['data']['response'])) {
                        // Save offered actions based on the topic discussed
                        $this->saveOfferedActionsFromMessage($message);
                        
                        return $this->formatResponse(
                            'assistant',
                            $aiResponse['data']['response'],
                            ['ai_generated' => true]
                        );
                    }
                    
                    // Fallback if AI fails - but still try to answer
                    return $this->formatResponse(
                        'assistant',
                        $this->getContextualAnswer($message, $semanticAnalysis),
                        ['fallback_used' => true]
                    );
                }
                
                // For casual greetings and small talk - use AI for natural response
                if (preg_match('/\b(how\s+(are|is|r)\s+(you|u|your\s+day)|what\'?s?\s+up|hows?\s+it\s+going)\b/i', $message)) {
                    $casualPrompt = "You are a friendly business assistant. The user is making small talk. " .
                        "Respond warmly and briefly, then ask how you can help with their business. " .
                        "Do NOT return JSON - just respond naturally.";
                    
                    $casualResponse = $this->callAI($casualPrompt, $message, false);
                    if ($casualResponse['success'] && !empty($casualResponse['data']['response'])) {
                        return $this->formatResponse(
                            'assistant',
                            $casualResponse['data']['response'],
                            ['ai_generated' => true]
                        );
                    }
                    
                    return $this->formatResponse(
                        'assistant',
                        "I'm doing great, thanks for asking! 😊 How can I help you with your business today?",
                        []
                    );
                }
                
                // For off-topic questions (sports, weather, news, etc.) - use AI for natural deflection
                if (preg_match('/\b(football|soccer|basketball|sports|weather|news|movie|music|game|politics)\b/i', $message)) {
                    $offTopicPrompt = "You are a friendly business assistant for FirmaFlow. " .
                        "The user asked about something off-topic (not business related). " .
                        "Politely acknowledge their question, explain you specialize in business management " .
                        "(customers, products, sales, expenses, reports), and ask if there's anything " .
                        "business-related you can help with. Be friendly, not dismissive. " .
                        "Do NOT return JSON - just respond naturally.";
                    
                    $offTopicResponse = $this->callAI($offTopicPrompt, $message, false);
                    if ($offTopicResponse['success'] && !empty($offTopicResponse['data']['response'])) {
                        return $this->formatResponse(
                            'assistant',
                            $offTopicResponse['data']['response'],
                            ['ai_generated' => true]
                        );
                    }
                    
                    return $this->formatResponse(
                        'assistant',
                        "That's an interesting topic! While I'd love to chat about it, I'm specifically designed to help you manage your business. " .
                        "I'm great at helping with customers, products, sales, expenses, and reports. Is there anything business-related I can help with?",
                        []
                    );
                }
                
                // For other conversational messages - use AI to respond naturally
                $generalPrompt = "You are a friendly business assistant for FirmaFlow. " .
                    "Respond naturally to the user. If they seem to want help, offer to assist with " .
                    "customers, products, sales, expenses, or reports. Keep it brief and friendly. " .
                    "Do NOT return JSON - just respond naturally.";
                
                $generalResponse = $this->callAI($generalPrompt, $message, false);
                if ($generalResponse['success'] && !empty($generalResponse['data']['response'])) {
                    return $this->formatResponse(
                        'assistant',
                        $generalResponse['data']['response'],
                        ['ai_generated' => true]
                    );
                }
                
                // Final fallback
                return $this->formatResponse(
                    'assistant',
                    "I'm here to help! What would you like to do today?",
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
                return $this->handleUnknownIntent($message, $semanticAnalysis);
        }
    }
    
    /**
     * Call AI API for data extraction
     */
    private function callAI(string $systemPrompt, string $userMessage, bool $forceJson = true): array {
        $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
        
        // Build messages array with conversation history
        $messages = [['role' => 'system', 'content' => $systemPrompt]];
        
        // Add conversation history (limit to last N messages to avoid token limits)
        $historyToInclude = array_slice($this->conversationHistory, -self::MAX_CONTEXT_MESSAGES);
        foreach ($historyToInclude as $msg) {
            $messages[] = [
                'role' => $msg['role'] ?? 'user',
                'content' => $msg['content'] ?? ''
            ];
        }
        
        // Add current user message
        $messages[] = ['role' => 'user', 'content' => $userMessage];
        
        // Log context info for debugging
        $contextInfo = sprintf(
            "AI Context: %d history messages + 1 system + 1 current = %d total messages sent to AI",
            count($historyToInclude),
            count($messages)
        );
        error_log($contextInfo);
        
        $data = [
            'model' => 'openai/gpt-oss-20b',  // Updated to currently supported model
            'messages' => $messages,
            'temperature' => 0.7, // Higher temperature for more natural responses
            'max_tokens' => 500
        ];
        
        // Only force JSON for structured extraction, not for conversation
        if ($forceJson) {
            $data['response_format'] = ['type' => 'json_object'];
            $data['temperature'] = 0.1; // Lower for structured extraction
        }
        
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
            error_log("AI curl error: " . $curlError);
            return ['success' => false, 'error' => 'Network error: ' . $curlError];
        }
        
        if ($httpCode !== 200) {
            $errorData = json_decode($response, true);
            error_log("AI HTTP error {$httpCode}: " . substr($response, 0, 500));
            if ($httpCode === 429) {
                preg_match('/try again in ([^.]+)/', $errorData['error']['message'] ?? '', $matches);
                return ['success' => false, 'error' => 'Rate limit. Try again in ' . ($matches[1] ?? '30 seconds')];
            }
            return ['success' => false, 'error' => 'AI service error (HTTP ' . $httpCode . ')'];
        }
        
        $result = json_decode($response, true);
        $aiContent = $result['choices'][0]['message']['content'] ?? '';
        
        error_log("AI raw response: " . substr($aiContent, 0, 300));
        
        // If not forcing JSON, return plain text response
        if (!$forceJson) {
            return [
                'success' => true,
                'data' => [
                    'response' => trim($aiContent),
                    'mode' => 'conversational'
                ]
            ];
        }
        
        // Try to parse as JSON
        $parsed = json_decode($aiContent, true);
        
        // If JSON parsing fails, create a conversational fallback response
        if (!$parsed || json_last_error() !== JSON_ERROR_NONE) {
            error_log("AI JSON parsing failed, using conversational fallback");
            
            // Return raw content as conversational response
            return [
                'success' => true,
                'data' => [
                    'mode' => 'conversational',
                    'confidence' => 0.5,
                    'response' => $aiContent ?: 'I\'m processing your request. Could you provide more details?',
                    'extracted_data' => [],
                    'parsing_failed' => true
                ]
            ];
        }
        
        // Normalize the response field (AI might use different names)
        if (!isset($parsed['response']) && isset($parsed['answer'])) {
            $parsed['response'] = $parsed['answer'];
        }
        if (!isset($parsed['response']) && isset($parsed['message'])) {
            $parsed['response'] = $parsed['message'];
        }
        if (!isset($parsed['response']) && isset($parsed['reply'])) {
            $parsed['response'] = $parsed['reply'];
        }
        if (!isset($parsed['response']) && isset($parsed['text'])) {
            $parsed['response'] = $parsed['text'];
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
            // Customer actions
            'create_customer' => [], // Form will collect all fields
            'update_customer' => ['customer_name'], // Need identifier to know which customer to edit
            'delete_customer' => ['customer_name'], // Need customer identifier
            'view_customer' => ['customer_name'],
            'customer_balance' => ['customer_name'],
            'customer_transactions' => ['customer_name'],
            'customer_details' => ['customer_name'], // Need customer identifier for profile
            
            // Supplier actions
            'create_supplier' => [], // Form will collect all fields
            'update_supplier' => ['supplier_name'], // Need identifier to know which supplier to edit
            'delete_supplier' => ['supplier_name'], // Need supplier identifier
            'view_supplier' => ['supplier_name'],
            'supplier_balance' => ['supplier_name'],
            'supplier_transactions' => ['supplier_name'],
            'supplier_details' => ['supplier_name'], // Need supplier identifier for profile
            'activate_supplier' => ['supplier_name'],
            'deactivate_supplier' => ['supplier_name'],
            
            // Other actions
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
            // For supplier actions, accept EITHER supplier_id OR supplier_name
            } elseif ($field === 'supplier_name' && in_array($action, ['delete_supplier', 'view_supplier', 'supplier_balance', 'supplier_transactions', 'update_supplier', 'supplier_details', 'activate_supplier', 'deactivate_supplier'])) {
                if (!isset($data['supplier_name']) && !isset($data['supplier_id'])) {
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
        
        // For supplier actions, assume input is a supplier name/identifier
        if (in_array($action, ['delete_supplier', 'view_supplier', 'supplier_balance', 'supplier_transactions', 'activate_supplier', 'deactivate_supplier', 'supplier_details'])) {
            if (in_array('supplier_name', $missingFields) || in_array('supplier_id', $missingFields)) {
                // Check if user entered a list number (1, 2, 3...) - resolve to actual supplier
                if (is_numeric($extractedValue) && (int)$extractedValue <= 10) {
                    $listIndex = (int)$extractedValue - 1;
                    $suppliers = $this->fetchSupplierList();
                    if (isset($suppliers[$listIndex])) {
                        $merged['supplier_id'] = $suppliers[$listIndex]['id'];
                        $merged['supplier_name'] = $suppliers[$listIndex]['name'];
                        return $merged;
                    }
                    // Fall through - treat as supplier ID
                    $merged['supplier_id'] = (int)$extractedValue;
                } else {
                    $merged['supplier_name'] = $extractedValue;
                }
                return $merged;
            }
        }
        
        // For create_customer, assume input is the name
        if ($action === 'create_customer' && in_array('name', $missingFields)) {
            $merged['name'] = $input;
            return $merged;
        }
        
        // For create_supplier, assume input is the company name
        if ($action === 'create_supplier' && in_array('company_name', $missingFields)) {
            $merged['company_name'] = $input;
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
            'supplier_name' => 'supplier name',
            'supplier_id' => 'supplier',
            'company_name' => 'company name',
            'contact_person' => 'contact person',
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
     * Fetch supplier list for clarification
     */
    private function fetchSupplierList(int $limit = 10): array {
        try {
            error_log("fetchSupplierList called with companyId={$this->companyId}, limit={$limit}");
            $stmt = $this->pdo->prepare("
                SELECT id, name, email, phone, contact_person 
                FROM suppliers 
                WHERE company_id = ? AND is_active = 1
                ORDER BY name ASC
                LIMIT " . intval($limit) . "
            ");
            $stmt->execute([$this->companyId]);
            $suppliers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            error_log("fetchSupplierList returned " . count($suppliers) . " suppliers");
            return $suppliers;
        } catch (Exception $e) {
            error_log("fetchSupplierList error: " . $e->getMessage());
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
    
    /**
     * Get contextual answer for questions (fallback when AI fails)
     */
    private function getContextualAnswer(string $message, array $semanticAnalysis): string {
        $lower = strtolower($message);
        
        // Business concept explanations
        $concepts = [
            'customer' => [
                'explanation' => "A **customer** is a person or business who purchases your products or services. In FirmaFlow, you can:\n• Track customer contact details\n• View purchase history\n• Manage invoices and payments\n• Set payment terms and credit limits\n\nWould you like to view your customers or create a new one?",
                'module' => 'customers',
                'view_action' => 'customer_summary',
                'create_action' => 'create_customer'
            ],
            
            'supplier' => [
                'explanation' => "A **supplier** (or vendor) is a person or business that provides goods or services to your company. In FirmaFlow, you can:\n• Store supplier information\n• Track purchase orders\n• Manage payments to suppliers\n• Monitor supplier balances\n\nWould you like to see your suppliers or add a new one?",
                'module' => 'suppliers',
                'view_action' => 'supplier_summary',
                'create_action' => 'create_supplier'
            ],
            
            'invoice' => [
                'explanation' => "An **invoice** is a bill you send to customers for products or services. It includes:\n• Items and quantities\n• Prices and totals\n• Payment terms\n• Due dates\n\nIn FirmaFlow, you can create, track, and manage invoices. Want to create one?",
                'module' => 'sales',
                'view_action' => 'sales_summary',
                'create_action' => 'create_invoice'
            ],
            
            'product' => [
                'explanation' => "A **product** (or inventory item) is something you sell to customers. You can track:\n• Product details and descriptions\n• Stock quantities\n• Selling prices\n• Categories\n\nWould you like to view your inventory or add a new product?",
                'module' => 'inventory',
                'view_action' => 'inventory_summary',
                'create_action' => 'create_product'
            ],
            
            'expense' => [
                'explanation' => "An **expense** is money spent to run your business, such as:\n• Rent and utilities\n• Supplies and materials\n• Salaries and wages\n• Marketing costs\n\nFirmaFlow helps you track and categorize expenses. Want to record one or see your expenses?",
                'module' => 'expenses',
                'view_action' => 'expense_summary',
                'create_action' => 'create_expense'
            ],
            
            'payment' => [
                'explanation' => "A **payment** is money received from customers or paid to suppliers. You can:\n• Record incoming payments\n• Track payment methods\n• Monitor outstanding balances\n• Generate payment receipts\n\nNeed help viewing payments or recording a new one?",
                'module' => 'payments',
                'view_action' => 'payment_summary',
                'create_action' => 'record_payment'
            ],
            
            'report' => [
                'explanation' => "**Reports** give you insights into your business performance:\n• Sales reports\n• Expense summaries\n• Profit & loss statements\n• Customer analytics\n\nWant to see your dashboard or a specific report?",
                'module' => 'reports',
                'view_action' => 'view_dashboard',
                'create_action' => null
            ],
        ];
        
        // Check for concept matches and save offered actions
        foreach ($concepts as $concept => $info) {
            if (preg_match("/\b(what\s+(is|are)|explain|tell\s+me\s+about)\s+.*\b{$concept}s?\b/i", $lower) ||
                preg_match("/\b{$concept}s?\b.*\?/i", $lower)) {
                
                // Save the offered actions for follow-up
                $this->saveOfferedActions($info['module'], $info['view_action'], $info['create_action']);
                
                return $info['explanation'];
            }
        }
        
        // Generic helpful response for off-topic questions
        if (preg_match('/\b(football|soccer|sports|weather|news|movies|games|music)\b/i', $lower)) {
            return "I appreciate the question, but I'm specifically designed to help you manage your business with FirmaFlow. " .
                   "I specialize in helping with customers, products, sales, expenses, and reports.\n\n" .
                   "Is there anything business-related I can help you with?";
        }
        
        // Generic helpful response for other questions
        if (preg_match('/\b(what|how|why|when|where|who|can\s+you|do\s+you)\b/i', $message)) {
            return "I'm designed to help you manage your business with FirmaFlow. " .
                   "I can help you with customers, products, sales, expenses, and reports.\n\n" .
                   "What would you like to explore?";
        }
        
        return "I'm here to assist you with your business management. What would you like to do?";
    }
    
    /**
     * Fast path detection for common data queries
     * Bypasses AI for speed and reliability
     */
    private function detectDataQueryFastPath(string $message): ?array {
        $lower = strtolower(trim($message));
        
        // Pattern: "tell me about [customer name]", "info about [customer]"
        if (preg_match('/\b(tell\s+me\s+about|info\s+about|details\s+(about|of|for)|information\s+(about|on))\s+(.+)/i', $message, $matches)) {
            $possibleName = trim($matches[5] ?? $matches[4]);
            
            // Check if it mentions "customer" explicitly or if it's a proper name
            if (preg_match('/\bcustomer\b/i', $lower) || 
                preg_match('/^[A-Z][a-z]+(\s+[A-Z][a-z]+)+/', $possibleName)) {
                
                error_log("Fast path: customer details query detected for: {$possibleName}");
                
                // Clean up the name
                $cleanName = preg_replace('/\b(customer|client|that|this)\b/i', '', $possibleName);
                $cleanName = trim($cleanName);
                
                $intent = [
                    'module' => 'customers',
                    'action' => 'customer_details',
                    'data' => ['customer_name' => $cleanName, 'raw_input' => $message],
                    'is_data_query' => true
                ];
                return $this->executeDataQuery($intent, $message);
            }
        }
        
        // Pattern: "[Customer Name] tell me about that customer"
        if (preg_match('/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+(tell\s+me|what|who|show)/i', $message, $matches)) {
            $customerName = trim($matches[1]);
            error_log("Fast path: customer details query detected (name first) for: {$customerName}");
            
            $intent = [
                'module' => 'customers',
                'action' => 'customer_details',
                'data' => ['customer_name' => $customerName, 'raw_input' => $message],
                'is_data_query' => true
            ];
            return $this->executeDataQuery($intent, $message);
        }
        
        // Pattern: "show/pull [customer]'s transactions/history"
        if (preg_match('/\b(show|pull|get|give\s+me|display)\s+(?:the\s+)?(.+?)(?:\'s|\s+)(transaction|history|purchases|orders|invoices)/i', $message, $matches)) {
            $customerName = trim($matches[2]);
            $customerName = preg_replace('/\b(customer|client|that|this)\b/i', '', $customerName);
            $customerName = trim($customerName);
            
            error_log("Fast path: customer transactions query detected for: {$customerName}");
            
            $intent = [
                'module' => 'customers',
                'action' => 'customer_details',
                'data' => ['customer_name' => $customerName, 'raw_input' => $message],
                'is_data_query' => true
            ];
            return $this->executeDataQuery($intent, $message);
        }
        
        // Pattern: "who is my top customer", "show top customers"
        if (preg_match('/\b(who\s+is|show|give\s+me|what\s+is).*\btop\s+(customer|client)s?\b/i', $lower)) {
            error_log("Fast path: top customers query detected");
            $intent = [
                'module' => 'customers',
                'action' => 'top_customers',
                'data' => ['limit' => 10, 'metric' => 'revenue'],
                'is_data_query' => true
            ];
            return $this->executeDataQuery($intent, $message);
        }
        
        // Pattern: "who is my best customer"
        if (preg_match('/\b(who\s+is|show|give\s+me).*\b(best|biggest|largest)\s+(customer|client)s?\b/i', $lower)) {
            error_log("Fast path: best customers query detected");
            $intent = [
                'module' => 'customers',
                'action' => 'top_customers',
                'data' => ['limit' => 10, 'metric' => 'revenue'],
                'is_data_query' => true
            ];
            return $this->executeDataQuery($intent, $message);
        }
        
        // Pattern: "show my customers", "list customers", "view customers"
        if (preg_match('/\b(show|list|view|give\s+me|display)\s+(my\s+)?customers?\b/i', $lower) &&
            !preg_match('/\b(create|add|new|delete|remove|update|edit)  \b/i', $lower)) {
            error_log("Fast path: customer list query detected");
            $intent = [
                'module' => 'customers',
                'action' => 'customer_summary',
                'data' => [],
                'is_data_query' => true
            ];
            return $this->executeDataQuery($intent, $message);
        }
        
        // Pattern: "show my products", "list inventory"
        if (preg_match('/\b(show|list|view|give\s+me|display)\s+(my\s+)?(products?|inventory|items?)\b/i', $lower) &&
            !preg_match('/\b(create|add|new|delete|remove|update|edit)\b/i', $lower)) {
            error_log("Fast path: inventory query detected");
            $intent = [
                'module' => 'inventory',
                'action' => 'inventory_summary',
                'data' => [],
                'is_data_query' => true
            ];
            return $this->executeDataQuery($intent, $message);
        }
        
        // Pattern: "today's sales", "sales summary", "show sales"
        if (preg_match('/\b(show|give\s+me|display|what\s+(is|are)|tell\s+me).*\b(sales?|revenue|earnings?|summary)\b/i', $lower) ||
            preg_match('/\bsales?\s+(summary|report|today|this\s+(month|week|year))\b/i', $lower) ||
            preg_match('/\b(today|today\'?s|this\s+(month|week|year))\s+(summary|report|sales?)\b/i', $lower)) {
            error_log("Fast path: sales query detected");
            
            $intent = [
                'module' => 'sales',
                'action' => 'sales_summary',
                'data' => [],
                'is_data_query' => true
            ];
            
            // Add date filters
            if (preg_match('/\b(today|today\'?s)\b/i', $lower)) {
                $intent['data']['date_range'] = 'today';
            } elseif (preg_match('/\bthis\s+month\b/i', $lower)) {
                $intent['data']['date_range'] = 'this_month';
            } elseif (preg_match('/\bthis\s+week\b/i', $lower)) {
                $intent['data']['date_range'] = 'this_week';
            } elseif (preg_match('/\bthis\s+year\b/i', $lower)) {
                $intent['data']['date_range'] = 'this_year';
            }
            
            return $this->executeDataQuery($intent, $message);
        }
        
        // Pattern: "show my expenses", "expense summary"
        if (preg_match('/\b(show|list|view|give\s+me|display)\s+(my\s+)?expenses?\b/i', $lower) ||
            preg_match('/\bexpenses?\s+summary\b/i', $lower)) {
            error_log("Fast path: expenses query detected");
            $intent = [
                'module' => 'expenses',
                'action' => 'expense_summary',
                'data' => [],
                'is_data_query' => true
            ];
            return $this->executeDataQuery($intent, $message);
        }
        
        // Pattern: "show my suppliers", "list suppliers"
        if (preg_match('/\b(show|list|view|give\s+me|display)\s+(my\s+)?(suppliers?|vendors?)\b/i', $lower) &&
            !preg_match('/\b(create|add|new|delete|remove|update|edit)\b/i', $lower)) {
            error_log("Fast path: suppliers query detected");
            $intent = [
                'module' => 'suppliers',
                'action' => 'supplier_summary',
                'data' => [],
                'is_data_query' => true
            ];
            return $this->executeDataQuery($intent, $message);
        }
        
        return null; // No fast path match, continue to semantic analysis
    }
}
