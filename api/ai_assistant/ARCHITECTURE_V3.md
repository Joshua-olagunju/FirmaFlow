# AI Assistant v3.0 - Production-Grade Architecture

## 🎯 Core Philosophy

This system is a **DETERMINISTIC BUSINESS APPLICATION** that uses AI as a **REASONING COMPONENT**.

### Absolute Rules (NEVER VIOLATE)

- ❌ AI does NOT own state
- ❌ AI does NOT route requests
- ❌ AI does NOT execute actions
- ❌ AI does NOT write to database
- ❌ AI does NOT manage workflows

### AI's ONLY Responsibilities

- ✅ Interpret intent (extract structured data)
- ✅ Estimate confidence
- ✅ Suggest clarifications when data incomplete

### ALL CONTROL Lives in CODE

---

## 📁 Architecture Overview

```
api/ai_assistant/
├── index_v3.php              # Main entry point (new architecture)
├── orchestrator.php          # Master controller (FSM + Tasks)
├── fsm.php                   # Finite State Machine
├── task_queue.php            # Task queue manager
├── router.php                # Code-owned intent router
├── prompt_loader.php         # Modular prompt system
├── prompts/                  # Prompt files
│   ├── global.prompt         # Always loaded (small, stable)
│   ├── customers.prompt      # Customer module rules
│   ├── inventory.prompt      # Inventory module rules
│   ├── sales.prompt          # Sales module rules
│   ├── payments.prompt       # Payments module rules
│   ├── expenses.prompt       # Expenses module rules
│   ├── purchases.prompt      # Purchases module rules
│   ├── suppliers.prompt      # Suppliers module rules
│   ├── reports.prompt        # Reports module rules
│   ├── settings.prompt       # Settings module rules
│   ├── subscriptions.prompt  # Subscriptions module rules
│   └── general.prompt        # Greetings/help
├── handlers/                 # Action executors (unchanged)
│   ├── customer_handler.php
│   ├── inventory_handler.php
│   └── ... (10 handlers)
└── [legacy files]            # Old v2 system (still works)
```

---

## 🔄 Complete Flow (Step by Step)

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER SENDS MESSAGE                           │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. ROUTER (CODE) analyzes message                              │
│     - Pattern matching for intent detection                     │
│     - NO AI involved in routing                                 │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. ROUTER creates TASK QUEUE                                   │
│     - One or more tasks detected                                │
│     - Tasks ordered by priority                                 │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. FSM transitions to INTENT_DETECTED                          │
│     - State stored in database                                  │
│     - Timeout set                                               │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. PROMPT LOADER assembles prompt:                             │
│     a) GLOBAL prompt (always loaded)                            │
│     b) MODULE prompt (one module only)                          │
│     c) TASK prompt (generated, ephemeral)                       │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. AI CALLED (once per task)                                   │
│     - Groq API: llama-3.1-8b-instant                           │
│     - Temperature: 0.1 (deterministic)                          │
│     - Returns JSON only                                         │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. SYSTEM VALIDATES OUTPUT (code)                              │
│     - Required fields check                                     │
│     - Confidence threshold check                                │
│     - Data type validation                                      │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
           VALID (≥0.7 conf)           INVALID (<0.7 conf)
                    │                           │
                    ▼                           ▼
┌───────────────────────────┐   ┌───────────────────────────────┐
│  7a. Check if HIGH-RISK   │   │  7b. Ask CLARIFICATION        │
│      action               │   │      - Return to user         │
└───────────┬───────────────┘   │      - Wait for more info     │
            │                   └───────────────────────────────┘
  ┌─────────┴─────────┐
  │                   │
HIGH-RISK        LOW-RISK
  │                   │
  ▼                   ▼
┌─────────────┐   ┌─────────────────────────────────────────────┐
│  8a. STATE: │   │  8b. STATE: EXECUTING                       │
│  AWAITING   │   │      - Execute directly                     │
│  CONFIRM    │   │      - No user approval needed              │
└──────┬──────┘   └─────────────────────────┬───────────────────┘
       │                                    │
       ▼                                    │
┌────────────────┐                          │
│ WAIT FOR USER  │                          │
│ - Confirm      │──────────────────────────┤
│ - Reject       │→ FAILED → IDLE           │
│ - Cancel       │→ IDLE                    │
│ - Modify       │→ INTENT_DETECTED         │
└────────────────┘                          │
                                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  9. EXECUTE ACTION (code)                                       │
│     - Handler processes request                                 │
│     - Database operations                                       │
│     - Response generated                                        │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  10. MARK TASK COMPLETED                                        │
│      - Increment currentTaskIndex                               │
│      - Log execution                                            │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  11. CLEAR AI CONTEXT                                           │
│      - Remove extracted data                                    │
│      - Remove AI response                                       │
│      - Keep task results                                        │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
            MORE TASKS?                   NO MORE TASKS
                    │                           │
                    ▼                           ▼
┌───────────────────────────┐   ┌───────────────────────────────┐
│  12a. Load NEXT task      │   │  12b. RESET to IDLE           │
│       - Loop to step 4    │   │       - Clear task queue      │
└───────────────────────────┘   │       - Ready for new message │
                                └───────────────────────────────┘
```

---

## 🎛️ Finite State Machine (FSM)

### States

| State                   | Description                        | Timeout |
| ----------------------- | ---------------------------------- | ------- |
| `IDLE`                  | No active task, ready for input    | None    |
| `INTENT_DETECTED`       | Intent parsed, extracting data     | 30s     |
| `DATA_EXTRACTED`        | Data ready, checking confirmation  | 30s     |
| `AWAITING_CONFIRMATION` | Waiting for user approval          | 120s    |
| `EXECUTING`             | Action in progress                 | 60s     |
| `COMPLETED`             | Task finished, checking for more   | 5s      |
| `FAILED`                | Error occurred, auto-reset to IDLE | 5s      |

### Transitions

```
IDLE → INTENT_DETECTED (new message)
INTENT_DETECTED → DATA_EXTRACTED (AI extraction complete)
DATA_EXTRACTED → AWAITING_CONFIRMATION (high-risk action)
DATA_EXTRACTED → EXECUTING (low-risk, high confidence)
AWAITING_CONFIRMATION → EXECUTING (user approved)
AWAITING_CONFIRMATION → FAILED (user rejected)
AWAITING_CONFIRMATION → IDLE (user cancelled)
EXECUTING → COMPLETED (success)
EXECUTING → FAILED (error)
COMPLETED → INTENT_DETECTED (more tasks)
COMPLETED → IDLE (all tasks done)
FAILED → IDLE (always)
```

### Golden Rule

**Every state has an EXIT. No stuck states.**

---

## 📋 Task Queue

### Structure

```json
{
  "state": "INTENT_DETECTED",
  "taskQueue": [
    {
      "id": "task_abc123",
      "module": "customers",
      "action": "create_customer",
      "status": "pending",
      "priority": 2,
      "data": {},
      "createdAt": "2024-12-22 10:00:00",
      "completedAt": null,
      "error": null
    }
  ],
  "currentTaskIndex": 0,
  "timeoutAt": "2024-12-22 10:00:30"
}
```

### Rules

- Execute ONE task at a time
- Increment index ONLY after success
- Clear AI context between tasks
- Never skip tasks
- Never reorder tasks

---

## 📝 Prompt Architecture

### 1. GLOBAL Prompt (Always Loaded)

- Defines AI behavior ONLY
- Safety boundaries
- Output format rules
- **NO business logic**
- **NO modules or intents**
- Small and stable (~60 lines)

### 2. MODULE Prompts (Dynamic)

- One per business domain
- Only ONE loaded at a time
- Never combined
- Defines allowed actions
- Explicit domain boundaries

Available modules:

- `customers.prompt`
- `inventory.prompt`
- `sales.prompt`
- `payments.prompt`
- `expenses.prompt`
- `purchases.prompt`
- `suppliers.prompt`
- `reports.prompt`
- `settings.prompt`
- `subscriptions.prompt`
- `general.prompt`

### 3. TASK Prompt (Ephemeral)

Generated per task. Contains:

- Current FSM state
- User message
- Required output schema
- Previous extracted data (for clarification)

---

## 🚨 Safety Mechanisms

### 1. Cancel Command

User can always say:

- "Cancel"
- "Reset"
- "Stop"
- "Start over"

**Immediately resets to IDLE.**

### 2. Timeout Escape

Each state has a timeout:

- AWAITING_CONFIRMATION: 2 minutes
- Others: 30-60 seconds

If exceeded → Auto-reset to IDLE

### 3. Failure Handling

ALL failures transition:

```
FAILED → IDLE
```

No exceptions. No loops.

### 4. High-Risk Actions

These ALWAYS require confirmation:

- Create/Update customer
- Add/Update product
- Adjust stock
- Create invoice
- Record payment
- Approve supplier payment
- Create purchase order
- Add expense
- Create tax rate

---

## 🔌 API Endpoints

### Primary: Process Message

```http
POST /api/ai_assistant.php
Content-Type: application/json

{
  "action": "process",
  "message": "Create customer John Doe with email john@example.com"
}
```

### Confirm Action

```http
POST /api/ai_assistant.php
{
  "action": "confirm",
  "response": "confirm" // or "reject" or "modify"
}
```

### Cancel/Reset

```http
POST /api/ai_assistant.php
{
  "action": "cancel"
}
```

### Get Current State (Debug)

```http
POST /api/ai_assistant.php
{
  "action": "get_state"
}
```

---

## 📊 Database Tables

### ai_fsm_state

Stores current FSM state per session.

```sql
CREATE TABLE ai_fsm_state (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_id INT NOT NULL,
  user_id INT NOT NULL,
  session_id VARCHAR(128) NOT NULL,
  state ENUM('IDLE','INTENT_DETECTED','DATA_EXTRACTED','AWAITING_CONFIRMATION','EXECUTING','COMPLETED','FAILED'),
  task_queue JSON,
  current_task_index INT,
  context_data JSON,
  timeout_at DATETIME,
  created_at DATETIME,
  updated_at DATETIME
);
```

### ai_fsm_log

Audit trail of state transitions.

### ai_task_log

Execution log with timing and results.

---

## 🆚 v2 vs v3 Comparison

| Aspect       | v2 (Old)           | v3 (New)           |
| ------------ | ------------------ | ------------------ |
| Routing      | AI decides         | Code decides       |
| State        | Session-based      | Database FSM       |
| Prompts      | Single monolithic  | Modular (3 layers) |
| Tasks        | Single per request | Queue-based        |
| Confirmation | Frontend driven    | FSM state driven   |
| Timeout      | None               | Per-state timeouts |
| Reset        | Manual             | Auto on failure    |
| AI Role      | Parser + Router    | Extractor only     |

---

## 🚀 Migration from v2

The v3 system is backward compatible. Old endpoints still work:

- `parse_prompt` → Routes to `process`
- `execute_task` → Legacy handler
- `query_info` → Query engine

To use v3 exclusively, change frontend to:

1. Use `action: "process"` for all messages
2. Handle `confirmation` response type
3. Use `action: "confirm"` for confirmations

---

## 🧪 Testing

### Test FSM Transitions

```bash
# Create customer (goes through full flow)
curl -X POST http://localhost/api/ai_assistant.php \
  -H "Content-Type: application/json" \
  -d '{"action":"process","message":"Create customer John Doe"}'

# Check state
curl -X POST http://localhost/api/ai_assistant.php \
  -H "Content-Type: application/json" \
  -d '{"action":"get_state"}'

# Confirm
curl -X POST http://localhost/api/ai_assistant.php \
  -H "Content-Type: application/json" \
  -d '{"action":"confirm","response":"confirm"}'
```

### Test Cancel

```bash
curl -X POST http://localhost/api/ai_assistant.php \
  -H "Content-Type: application/json" \
  -d '{"action":"process","message":"cancel"}'
```

---

## 📜 Golden Rules

1. **AI responses are stateless** - No memory between calls
2. **Code owns state** - FSM in database, not prompts
3. **One task per AI call** - Never batch
4. **One module per prompt** - Never combine
5. **Every state has an exit** - Timeouts + cancel
6. **Reset is always possible** - Cancel command
7. **FAILED always → IDLE** - No stuck states

---

## 👤 Author

FirmaFlow AI Assistant v3.0
Production-Grade Architecture
December 2024
