# AI ASSISTANT - DEVELOPER QUICK REFERENCE

## How the New Architecture Works

---

## 🎯 THE CORE RULE

> **AI OUTPUT IS ADVISORY, NOT AUTHORITATIVE**

If AI fails, the system MUST still respond helpfully.

---

## 📊 MESSAGE PROCESSING FLOW

### Every user message goes through this pipeline:

```
1. SEMANTIC ANALYSIS (AI #1)
   ├─ semantic_analyzer.php
   ├─ Understands INTENT
   ├─ Tolerates misspellings
   └─ Output: advisory analysis

2. ROUTING (CODE)
   ├─ router.php::detectIntentsWithSemantics()
   ├─ Uses semantic hints + patterns
   ├─ ALWAYS returns valid module
   └─ Fallback: GENERAL module

3. EXECUTION SPLIT
   ├─ Question? → Execute immediately
   ├─ Action? → Confirmation flow
   └─ Chat? → Conversational response

4. DATA EXTRACTION (AI #2, if needed)
   ├─ orchestrator.php::callAI()
   ├─ Extracts structured data
   ├─ JSON parsing OPTIONAL
   └─ Failure → conversational fallback

5. EXECUTION OR CONVERSATION
   ├─ Handlers execute validated actions
   ├─ Or GENERAL module responds
   └─ ALWAYS returns to IDLE
```

---

## 🔧 KEY FUNCTIONS BY FILE

### **semantic_analyzer.php**

```php
$analyzer = new SemanticAnalyzer($apiKey, $conversationHistory);
$result = $analyzer->analyze($userMessage);

// $result always contains:
[
    'success' => true,
    'summary' => 'User wants to view customers',
    'user_intent_type' => 'question', // or action, conversation, greeting, help, unclear
    'action_required' => false,
    'confidence' => 0.9,
    'suggested_topics' => ['customer'],
    'is_conversational' => false
]

// NEVER throws exceptions
// ALWAYS returns valid structure
```

---

### **router.php**

```php
// NEW primary routing function
Router::detectIntentsWithSemantics($message, $semanticAnalysis);

// Returns intent array with fallback chain:
// 1. Semantic-based routing
// 2. Pattern matching
// 3. Topic-based routing
// 4. Default to GENERAL

// NEVER returns empty array
// NEVER returns hard "unknown"
```

---

### **orchestrator.php**

#### Main Entry Point

```php
$orchestrator->processMessage($userMessage);

// Steps:
// 1. Check timeout
// 2. Get FSM state
// 3. Route to state handler
// 4. ALWAYS returns response (never exception to user)
```

#### Key New Functions

**Semantic-aware idle handler:**

```php
private function handleIdleState(string $message);
// - Calls semantic analyzer
// - Routes with semantic hints
// - Executes queries immediately
// - Creates task queue for actions
```

**Informational query executor:**

```php
private function executeInformationalQuery(array $intent, string $message);
// - No confirmation needed
// - Instant response
// - For "show", "list", "view" queries
```

**Improved error handling:**

```php
private function handleUnknownIntent(string $message, array $semanticAnalysis);
// - Uses semantic hints
// - Suggests based on topics
// - NEVER says "error"
// - Always helpful
```

**Timeout management:**

```php
private function checkAndHandleTimeout();
// - Checks state timeout_at
// - Auto-resets to IDLE
// - Prevents stuck states
```

**Graceful AI failure:**

```php
private function callAI(string $systemPrompt, string $userMessage);
// - If JSON parse fails → return conversational response
// - If network fails → return helpful error
// - NEVER throws exception
```

---

## 🚦 DECISION TREE FOR NEW MESSAGES

```
User sends message
    │
    ├─ Is cancel/reset? → Reset to IDLE
    │
    ├─ Check state timeout → Auto-reset if expired
    │
    ├─ Get semantic understanding
    │   └─ (always succeeds, uses fallback if AI fails)
    │
    ├─ Route with semantics
    │   ├─ Conversational? → handleGeneralIntent()
    │   ├─ Informational query? → executeInformationalQuery()
    │   └─ Action request? → Create task queue
    │
    └─ Execute or respond
        ├─ Action → Confirmation flow
        ├─ Query → Immediate response
        └─ Chat → Conversational response
```

---

## 🎨 RESPONSE TYPES

### System now returns these response types:

| Type            | When                       | Example                                    |
| --------------- | -------------------------- | ------------------------------------------ |
| `assistant`     | Conversational help        | "I think you're asking about customers..." |
| `greeting`      | User greets                | "Hello! I'm your assistant..."             |
| `help`          | User asks capabilities     | "Here's what I can do..."                  |
| `chat`          | General conversation       | "I'm doing great! How can I help?"         |
| `info`          | Informational query result | Shows customer list                        |
| `form`          | Action needs user input    | Customer creation form                     |
| `confirmation`  | Action needs approval      | "Please confirm: Delete customer X?"       |
| `clarification` | Missing data               | "Which customer would you like to view?"   |
| `success`       | Action completed           | "✅ Customer created!"                     |
| `error`         | Soft failure               | "I couldn't complete that, but..."         |

**Note:** Even "error" type is conversational and helpful now.

---

## 🧪 TESTING NEW FEATURES

### Test Semantic Tolerance:

```php
// These should all work now:
"hw cn i add a custmer?"      // Misspellings
"shw me my custmers"          // More misspellings
"I wanna see customers"       // Casual language
"can you list customers?"     // Question format
```

### Test Action vs Question Split:

```php
"show me customers"           // → Immediate list (no confirmation)
"delete customer john"        // → Asks for confirmation
"can I delete customers?"     // → Answers question, offers to help
"how do I add a customer?"    // → Explains, doesn't execute
```

### Test Fallback Handling:

```php
"asdfghjkl"                   // → Helpful response, not error
"I'm confused"                // → Offers guidance
"help"                        // → Shows capabilities
```

### Test State Management:

```php
// Start action, don't respond, wait 3 minutes
// Next message should auto-reset and process normally
```

---

## ⚠️ COMMON PITFALLS TO AVOID

### DON'T:

❌ **Rely on AI output being perfectly structured**

```php
// BAD
$data = json_decode($aiResponse);
$name = $data['customer_name']; // Can crash

// GOOD
$data = json_decode($aiResponse) ?: ['fallback' => true];
$name = $data['customer_name'] ?? 'Unknown';
```

❌ **Return hard errors to users**

```php
// BAD
if (!$intent) {
    return ['success' => false, 'error' => 'Unknown intent'];
}

// GOOD
if (!$intent) {
    return $this->handleUnknownIntent($message, $semanticAnalysis);
}
```

❌ **Block on low confidence**

```php
// BAD
if ($confidence < 0.7) {
    throw new Exception('Low confidence');
}

// GOOD
if ($confidence < 0.7) {
    return $this->formatResponse('clarification', 'Could you clarify...?');
}
```

❌ **Create states without timeouts**

```php
// FSM already handles this, but if adding new states:
// BAD: No timeout
// GOOD: Every state in $stateTimeouts array
```

---

## 🔐 SAFETY GUARANTEES

### The system GUARANTEES:

✅ **Never silent failures**

- Even if all AI calls fail, user gets a response

✅ **Never stuck states**

- All states have timeout
- Failed states auto-reset

✅ **Never breaks on typos**

- Semantic understanding is spelling-agnostic

✅ **Never executes without confirmation**

- Read-only queries are instant
- Write actions require approval

✅ **Never loses context unnecessarily**

- Conversation history preserved
- State context maintained

---

## 📝 ADDING NEW FEATURES

### To add a new action:

1. **Add pattern to router.php**

```php
'/\bnew\s+action\s+pattern\b/i' => [
    'module' => 'your_module',
    'action' => 'your_action',
    'priority' => 1
]
```

2. **Add to required fields (if needed)**

```php
// orchestrator.php::getRequiredFields()
'your_action' => ['field1', 'field2']
```

3. **Add handler logic**

```php
// handlers/your_module_handler.php
function handleYourModuleIntent($action, $data, $state, $pdo, $companyId, $userId) {
    if ($action === 'your_action') {
        // Execute action
        return [
            'status' => 'success',
            'message' => 'Action completed!',
            'data' => [...]
        ];
    }
}
```

4. **Test semantic understanding**

```php
// Verify these work:
"exact pattern"
"misspelled patern"
"casual phrasing of pattern"
```

---

## 🐛 DEBUGGING TIPS

### Enable verbose logging:

```php
error_log("Semantic analysis: " . json_encode($semanticAnalysis));
error_log("Router intents: " . json_encode($intents));
error_log("Current state: " . json_encode($state));
```

### Check FSM state:

```php
// In orchestrator
$state = $this->fsm->getState();
error_log("FSM: " . $state['state'] . " at " . $state['updated_at']);
```

### Monitor semantic failures:

```php
// In semantic_analyzer.php
if (!$aiResponse['success']) {
    error_log("Semantic AI failed, using fallback");
}
```

### Track routing fallbacks:

```php
// In router.php
if ($intent['semantic_routed']) {
    error_log("Used semantic routing");
}
```

---

## 📖 FURTHER READING

- **[AI_ARCHITECTURE_REFACTOR_V4.md](AI_ARCHITECTURE_REFACTOR_V4.md)** - Full architectural docs
- **[api/ai_assistant/prompts/general.prompt](api/ai_assistant/prompts/general.prompt)** - GENERAL module behavior
- **[api/ai_assistant/semantic_analyzer.php](api/ai_assistant/semantic_analyzer.php)** - Semantic understanding logic
- **[api/ai_assistant/router.php](api/ai_assistant/router.php)** - Intent routing logic
- **[api/ai_assistant/orchestrator.php](api/ai_assistant/orchestrator.php)** - Main orchestration flow

---

## 💡 REMEMBER

> "The system should NEVER feel stuck, silent, or rigid. If uncertain, be conversational. If AI fails, have a fallback. If state is stuck, reset to IDLE. The user experience comes first."

---

**Architecture Version:** 4.0 (Semantic Understanding)  
**Last Updated:** December 23, 2025  
**Maintained by:** Development Team
