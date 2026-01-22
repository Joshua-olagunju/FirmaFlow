# FirmaFlow AI Copilot Instructions

## Architecture Overview

FirmaFlow is a **PHP/MySQL + React** business management system with an AI assistant. The AI orchestration layer (`api/ai_assistant/orchestrator/`) is modular and follows JEPA-style design.

### AI System Architecture (JEPA-Style)

```
User Input → AIAssistantChat.jsx → api/ai_assistant.php → index_v3.php
                                                              ↓
                                               orchestrator_adapter.php
                                                              ↓
                                          orchestrator/index.php (Coordinator)
                                                              ↓
                    ┌─────────────────────┼──────────────────────┐
                    ↓                     ↓                      ↓
              WorldState.php        AIReasoner.php         StateHandler.php
           (JEPA World Model)    (Intent + Prediction)    (FSM Transitions)
                                          ↓
                                   TaskExecutor.php
                                          ↓
                                   ResponseBuilder.php → JSON Response
```

**JEPA Design Principle**:

1. WorldState builds a "world model" snapshot
2. AIReasoner understands intent and predicts next states
3. PHP code validates and decides (AI suggests, code decides)
4. TaskExecutor performs the actual operation

## Core Components

### Orchestrator Modules (`api/ai_assistant/orchestrator/`)

| File                                                                       | Purpose                                                   |
| -------------------------------------------------------------------------- | --------------------------------------------------------- |
| [index.php](api/ai_assistant/orchestrator/index.php)                       | Main coordinator - thin delegator to modules              |
| [WorldState.php](api/ai_assistant/orchestrator/WorldState.php)             | JEPA world model - builds state snapshot for AI context   |
| [AIReasoner.php](api/ai_assistant/orchestrator/AIReasoner.php)             | JEPA prediction - intent understanding + state prediction |
| [StateHandler.php](api/ai_assistant/orchestrator/StateHandler.php)         | FSM state transitions - CODE-OWNED state management       |
| [TaskExecutor.php](api/ai_assistant/orchestrator/TaskExecutor.php)         | Execute validated tasks via domain handlers               |
| [ResponseBuilder.php](api/ai_assistant/orchestrator/ResponseBuilder.php)   | Format all response types for frontend                    |
| [FormBuilder.php](api/ai_assistant/orchestrator/FormBuilder.php)           | Build form configurations for data collection             |
| [ValidationEngine.php](api/ai_assistant/orchestrator/ValidationEngine.php) | Validate extracted data, determine required fields        |
| [DataQueryHandler.php](api/ai_assistant/orchestrator/DataQueryHandler.php) | Fast-path data queries (bypass AI for common patterns)    |
| [FollowUpHandler.php](api/ai_assistant/orchestrator/FollowUpHandler.php)   | Handle "yes"/"view them" responses                        |

### Supporting Files

| File                                                                  | Purpose                                               |
| --------------------------------------------------------------------- | ----------------------------------------------------- |
| [orchestrator_adapter.php](api/ai_assistant/orchestrator_adapter.php) | Bridge between old entry point and new modular system |
| [index_v3.php](api/ai_assistant/index_v3.php)                         | Main API entry point                                  |
| [fsm.php](api/ai_assistant/fsm.php)                                   | FSM state constants and helpers                       |
| [router.php](api/ai_assistant/router.php)                             | Pattern-based intent routing                          |
| [prompt_loader.php](api/ai_assistant/prompt_loader.php)               | Combines global + module + task prompts               |

## Critical Patterns

### 1. JEPA World State Pattern

```php
// WorldState.php builds context for AI
$worldSnapshot = $this->worldState->getSnapshot();
// Returns: fsmState, currentTask, taskQueue, businessContext, lastOfferedActions

// AIReasoner.php receives world state for reasoning
$understanding = $this->aiReasoner->understand($message, $worldSnapshot);
```

### 2. State Management (FSM)

- All state lives in `ai_fsm_state` MySQL table, keyed by `company_id + user_id + session_id`
- State transitions are CODE-OWNED, never AI-decided
- Timeout auto-reset prevents stuck states

```php
// StateHandler.php owns all transitions
$this->stateHandler->transitionTo(\FSM::STATE_DATA_EXTRACTED, [
    'extractedData' => $data
], 'Data extracted');
```

### 3. Confidence Thresholds

```php
const MIN_CONFIDENCE_TO_PROCEED = 0.7;
const MIN_CONFIDENCE_FOR_AUTO_EXECUTE = 0.9;
```

### 4. Response Format (Use ResponseBuilder)

```php
// ResponseBuilder.php static methods
ResponseBuilder::success($message, $data);
ResponseBuilder::error($message);
ResponseBuilder::form($message, $formConfig, $action, $module);
ResponseBuilder::confirmation($message, $task, $data);
ResponseBuilder::clarification($message, $options);
ResponseBuilder::assistant($message, $suggestions);
```

### 5. Company Scoping

ALL database queries MUST include `company_id`:

```php
$stmt->execute([$this->companyId, ...]);
```

### 6. Form Building (Use FormBuilder)

```php
FormBuilder::buildCustomerForm($data);
FormBuilder::buildSupplierForm($data);
FormBuilder::buildProductForm($data);
FormBuilder::buildExpenseForm($data);
```

### 7. Validation (Use ValidationEngine)

```php
$validation = ValidationEngine::validateData($data, $action);
$needsConfirmation = ValidationEngine::requiresConfirmation($module, $action);
```

## AI Call Pattern

AIReasoner handles all AI communication:

```php
// In AIReasoner.php
$understanding = $this->understand($message, $worldSnapshot);  // Intent analysis
$prediction = $this->predictNextStates($understanding, $worldSnapshot);  // JEPA prediction
$extraction = $this->extractData($message, $currentTask, $worldSnapshot);  // Data extraction
```

## Frontend Integration

- React app lives in `Firma_Flow_React/`
- API base configured in `src/config/api.config.js`
- AI chat component: `src/components/AIAssistant/AIAssistantChat.jsx`

### Response Types Frontend Handles:

- `greeting`, `help`, `assistant` - Conversational
- `success`, `task_complete`, `complete` - Action succeeded
- `error`, `cancelled` - Action failed/cancelled
- `confirmation` - Awaiting user confirmation
- `form` - Show editable form
- `clarification`, `selection` - Need more info
- `capability_offer` - Show available actions

## Database

- Connection in `includes/db.php` (XAMPP/MySQL)
- Database name: `ledgerly`
- All timestamps use UTC

## Refactoring Guidelines

When modifying the AI orchestration:

1. **Keep orchestrator/index.php thin** - It should only coordinate, not execute
2. **World state in WorldState.php** - All context building goes here
3. **AI reasoning in AIReasoner.php** - All AI calls and parsing here
4. **State in StateHandler.php** - All FSM manipulation here
5. **Execution in TaskExecutor.php** - All CRUD operations here
6. **Responses in ResponseBuilder.php** - All response formatting here

## Common Gotchas

1. **Orchestrator is now modular** - Don't add methods to index.php, create/use modules
2. **Fast path detection** bypasses AI for common queries (performance optimization)
   - Expanded to handle many help variations: "tell me what u can do", "list things", etc.
   - Excludes conversational patterns first: "how are you" is NOT a help request
3. **Session-based offered actions** track last suggested actions for follow-up handling
   - WorldState.setLastOfferedActions() MUST be called when offering capabilities
   - FollowUpHandler checks session for "yes"/"no" responses
4. **Null module/action detection** - If AI returns no clear intent, treat as conversational
5. **Customer/Supplier forms** use `FormBuilder::buildCustomerForm()`/`buildSupplierForm()`
6. **Adapter maintains compatibility** - Old entry point works unchanged
7. **Follow-up handling** - "yes" after capabilities directly shows form, doesn't re-process through AI

## Testing Locally

1. Start XAMPP (Apache + MySQL)
2. `cd Firma_Flow_React && npm run dev`
3. Access at `http://localhost:5173`
4. AI endpoint: `POST /api/ai_assistant.php` with `{action: 'parse_prompt', prompt: '...'}`
