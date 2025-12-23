<?php
/**
 * Code-Owned Router
 * 
 * PRODUCTION-GRADE INTENT ROUTING
 * 
 * This module OWNS routing. AI NEVER routes.
 * 
 * Responsibilities:
 * - Detect intent(s) from user message using patterns
 * - Map intents to modules
 * - Split multi-intent requests into ordered tasks
 * - Create task queue
 * - Control task order
 * 
 * The AI NEVER:
 * - Chooses a module
 * - Chooses the next task
 * - Skips tasks
 */

class Router {
    
    // Intent patterns (regex-based detection)
    // Format: pattern => ['module' => ..., 'action' => ..., 'priority' => ...]
    private static $intentPatterns = [
        // ============================================
        // CANCEL / RESET COMMANDS (Highest Priority)
        // ============================================
        '/^(cancel|reset|stop|start over|nevermind|abort|quit)$/i' => [
            'module' => 'system',
            'action' => 'cancel',
            'priority' => 0
        ],
        
        // ============================================
        // GENERAL CONVERSATION (Handle before business)
        // ============================================
        '/^(hi|hello|hey|good\s*(morning|afternoon|evening)|greetings)\b/i' => [
            'module' => 'general',
            'action' => 'greeting',
            'priority' => 0
        ],
        '/\bhow\s+(are|r)\s+(you|u)\b/i' => [
            'module' => 'general',
            'action' => 'chat',
            'priority' => 0
        ],
        '/\b(what\'?s\s+up|how\'?s\s+it\s+going|whats\s+good)\b/i' => [
            'module' => 'general',
            'action' => 'chat',
            'priority' => 0
        ],
        '/\b(thank\s*you|thanks|thx)\b/i' => [
            'module' => 'general',
            'action' => 'thanks',
            'priority' => 0
        ],
        '/\b(help|what\s+can\s+you\s+do|capabilities)\b/i' => [
            'module' => 'general',
            'action' => 'help',
            'priority' => 0
        ],
        
        // ============================================
        // CUSTOMERS MODULE (Highly Flexible)
        // ============================================
        // Customer word variations (handles typos)
        // customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr
        
        // CAPABILITY QUESTIONS - "can I...", "is it possible...", "how do I..."
        // These should trigger a conversational response, not direct action
        // PRIORITY -1 to ensure these are matched BEFORE action patterns
        '/\b(can|could|may)\s+i\s+(delete|remove|delet|deldt).*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)s?\b/i' => [
            'module' => 'customers',
            'action' => 'ask_delete_customer',
            'priority' => -1
        ],
        '/\b(can|could|may)\s+i\s+(edit|update|change|modify).*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)s?\b/i' => [
            'module' => 'customers',
            'action' => 'ask_update_customer',
            'priority' => -1
        ],
        '/\b(can|could|may)\s+i\s+(create|add|make|register).*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)s?\b/i' => [
            'module' => 'customers',
            'action' => 'ask_create_customer',
            'priority' => -1
        ],
        '/\b(can|could|may)\s+i\s+(view|see|show|list|get).*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)s?\b/i' => [
            'module' => 'customers',
            'action' => 'ask_view_customers',
            'priority' => -1
        ],
        '/\b(how|what)\b.*(do|can)\s+i\s+(delete|remove).*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)s?\b/i' => [
            'module' => 'customers',
            'action' => 'ask_delete_customer',
            'priority' => -1
        ],
        '/\b(how|what)\b.*(do|can)\s+i\s+(edit|update|change).*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)s?\b/i' => [
            'module' => 'customers',
            'action' => 'ask_update_customer',
            'priority' => -1
        ],
        '/\b(how|what)\b.*(do|can)\s+i\s+(create|add|make).*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)s?\b/i' => [
            'module' => 'customers',
            'action' => 'ask_create_customer',
            'priority' => -1
        ],
        '/\b(is\s+it\s+possible|able)\s+to\s+(delete|remove).*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)s?\b/i' => [
            'module' => 'customers',
            'action' => 'ask_delete_customer',
            'priority' => -1
        ],
        '/\b(is\s+it\s+possible|able)\s+to\s+(edit|update).*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)s?\b/i' => [
            'module' => 'customers',
            'action' => 'ask_update_customer',
            'priority' => -1
        ],
        '/\b(is\s+it\s+possible|able)\s+to\s+(create|add).*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)s?\b/i' => [
            'module' => 'customers',
            'action' => 'ask_create_customer',
            'priority' => -1
        ],
        
        // CREATE CUSTOMER (with typo tolerance for "customer")
        '/\b(create|creat|craete|add|ad|new|nwe|register|registr)\b.*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)\b/i' => [
            'module' => 'customers',
            'action' => 'create_customer',
            'priority' => 2
        ],
        '/\b(want|wnat|watn|need|nedd|like|liek)\s+to\s+(create|creat|craete|add|ad)\s+(my|a|an)?\s*(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)s?\b/i' => [
            'module' => 'customers',
            'action' => 'create_customer',
            'priority' => 1
        ],
        '/\b(create|creat|craete|add|ad|new|nwe|register|registr)\b.*\b(user|users)\b/i' => [
            'module' => 'customers',
            'action' => 'create_customer',
            'priority' => 2
        ],
        // Casual: "add john", "register alice", "new customer bob"
        '/^(add|create|register|new)\s+([a-z]+\s*)+$/i' => [
            'module' => 'customers',
            'action' => 'create_customer',
            'priority' => 3
        ],
        
        // EDIT/UPDATE CUSTOMER (with typo tolerance)
        '/\b(edit|edti|eidt|update|updat|updaet|change|chang|modify|modfy)\s+(my|a|an|the)?\s*(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)s?\b/i' => [
            'module' => 'customers',
            'action' => 'update_customer',
            'priority' => 0
        ],
        '/\b(want|wnat|watn|wnta|need|nedd|like|liek)\s+to\s+(edit|edti|eidt|update|updat|updaet|change|chang|modify|modfy)\s+(my|a|an|the)?\s*(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)s?\b/i' => [
            'module' => 'customers',
            'action' => 'update_customer',
            'priority' => 0
        ],
        '/\b(edit|edti|eidt)\b.*\b(my|a)?\s*(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)s?\b/i' => [
            'module' => 'customers',
            'action' => 'update_customer',
            'priority' => 1
        ],
        '/\b(update|edit|change|modify)\b.*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)\b(?!.*\b(type|status|active)\b)/i' => [
            'module' => 'customers',
            'action' => 'update_customer',
            'priority' => 1
        ],
        '/\b(want|need|like)\s+to\s+(update|edit|change|modify)\b.*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)/i' => [
            'module' => 'customers',
            'action' => 'update_customer',
            'priority' => 1
        ],
        
        // DELETE CUSTOMER (with typo tolerance)
        '/\b(delete|delet|deldt|deldta|remove|remov|rmove)\b.*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)s?\b/i' => [
            'module' => 'customers',
            'action' => 'delete_customer',
            'priority' => 1
        ],
        '/\b(want|wnat|watn|need|nedd|like|liek)\s+to\s+(delete|delet|deldt|remove|remov)\s+(my|a|an|the)?\s*(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)s?\b/i' => [
            'module' => 'customers',
            'action' => 'delete_customer',
            'priority' => 0
        ],
        // Casual: "delete john", "remove bob", "get rid of alice"
        '/^(delete|remove|delet|remov)\s+([a-z]+\s*)+$/i' => [
            'module' => 'customers',
            'action' => 'delete_customer',
            'priority' => 2
        ],
        '/\b(get\s+rid\s+of|dump)\b.*\b(customer|[A-Z][a-z]+)\b/i' => [
            'module' => 'customers',
            'action' => 'delete_customer',
            'priority' => 1
        ],
        
        // CUSTOMER DETAILS/INFO - "tell me about X", "info about X", "who is X"
        // This should fetch detailed customer profile with spending history
        '/\b(tell\s+me\s+about|info\s+about|information\s+about|details\s+about|details\s+of|about)\b.*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client|my customer)\b/i' => [
            'module' => 'customers',
            'action' => 'customer_details',
            'priority' => 0
        ],
        '/\b(tell\s+me\s+about|info\s+about|information\s+about|who\s+is|details\s+about)\b\s+(\w+)/i' => [
            'module' => 'customers',
            'action' => 'customer_details',
            'priority' => 1
        ],
        '/\bwho\s+is\b.*\b(customer|my customer)\b/i' => [
            'module' => 'customers',
            'action' => 'customer_details',
            'priority' => 1
        ],
        '/\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)\b.*\b(profile|details|info|information|stats|statistics|data)\b/i' => [
            'module' => 'customers',
            'action' => 'customer_details',
            'priority' => 1
        ],
        // Casual: "who is john", "tell me about alice", "what about bob"
        '/^(who\s+is|tell\s+me\s+about|what\s+about|info\s+on)\s+([a-z]+\s*)+$/i' => [
            'module' => 'customers',
            'action' => 'customer_details',
            'priority' => 2
        ],
        // "What's the profile of customer X" patterns
        '/\b(what\'?s|whats|what\s+is)\s+(the\s+)?(profile|details|info)\b.*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)\b/i' => [
            'module' => 'customers',
            'action' => 'customer_details',
            'priority' => 0
        ],
        '/\bprofile\b.*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)\b/i' => [
            'module' => 'customers',
            'action' => 'customer_details',
            'priority' => 1
        ],
        '/\b(what|how much|total)\b.*\b(spent|spending|purchases|bought)\b.*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)?\b/i' => [
            'module' => 'customers',
            'action' => 'customer_details',
            'priority' => 1
        ],
        
        // Customer transactions/history (with typo tolerance)
        '/\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)\b.*(transaction|history|purchase|order|invoice)s?\b/i' => [
            'module' => 'customers',
            'action' => 'customer_transactions',
            'priority' => 1
        ],
        '/\b(transaction|history|purchase|order|invoice)s?\b.*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)\b/i' => [
            'module' => 'customers',
            'action' => 'customer_transactions',
            'priority' => 1
        ],
        // Customer balance/outstanding (with typo tolerance)
        '/\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)\b.*(balance|outstanding|owe|owing|debt)\b/i' => [
            'module' => 'customers',
            'action' => 'customer_balance',
            'priority' => 1
        ],
        '/\b(balance|outstanding)\b.*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)\b/i' => [
            'module' => 'customers',
            'action' => 'customer_balance',
            'priority' => 1
        ],
        '/\bhow much\b.*\b(owe|owing)\b/i' => [
            'module' => 'customers',
            'action' => 'customer_balance',
            'priority' => 1
        ],
        // "What is X's balance" or "X's balance"
        '/\bwhat\b.*\b(\w+)\'?s?\b.*\bbalance\b/i' => [
            'module' => 'customers',
            'action' => 'customer_balance',
            'priority' => 1
        ],
        '/\b(\w+)\'s\s+balance\b/i' => [
            'module' => 'customers',
            'action' => 'customer_balance',
            'priority' => 1
        ],
        // Change customer type (with typo tolerance)
        '/\b(change|switch|convert|set)\b.*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)\b.*\b(type|to business|to individual)\b/i' => [
            'module' => 'customers',
            'action' => 'change_customer_type',
            'priority' => 3
        ],
        '/\b(make|mark)\b.*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)\b.*\b(business|individual)\b/i' => [
            'module' => 'customers',
            'action' => 'change_customer_type',
            'priority' => 3
        ],
        // Activate/Deactivate customer (with typo tolerance)
        '/\b(activate|enable|reactivate)\b.*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)\b/i' => [
            'module' => 'customers',
            'action' => 'activate_customer',
            'priority' => 3
        ],
        '/\b(deactivate|disable|suspend)\b.*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)\b/i' => [
            'module' => 'customers',
            'action' => 'deactivate_customer',
            'priority' => 3
        ],
        // View specific customer (with typo tolerance)
        '/\b(view|show|get|find|search|look up)\b.*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)\b(?!.*\b(all|list|how many|total|summary)\b)/i' => [
            'module' => 'customers',
            'action' => 'view_customer',
            'priority' => 1
        ],
        '/\b(list|all|show me my|how many|total|give me|names? of)\b.*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)s?\b/i' => [
            'module' => 'customers',
            'action' => 'customer_summary',
            'priority' => 1
        ],
        '/\bmy\s+(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)s?\b(?!.*\b(edit|update|delete|remove|change|modify)\b)/i' => [
            'module' => 'customers',
            'action' => 'customer_summary',
            'priority' => 5
        ],
        '/\b(top|best|highest|biggest)\b.*\b(customer|custmer|costomer|customar|customr|cusomer|cutomer|custoemr|client)s?\b/i' => [
            'module' => 'customers',
            'action' => 'top_customers',
            'priority' => 1
        ],
        '/\bwho\b.*(owe|owes|owing)\b.*\bmoney\b/i' => [
            'module' => 'payments',
            'action' => 'view_pending_invoices',
            'priority' => 1
        ],
        
        // ============================================
        // SUPPLIERS MODULE - FULL CRUD SUPPORT
        // ============================================
        
        // --- CREATE SUPPLIER ---
        // Casual: "i want to add a supplier", "need new vendor" - HIGHEST PRIORITY
        '/\b(i\s+(want|wnat|watn|wnta|need|nedd|wanna|would\s+like)|can\s+you|please).*(add|ad|create|creat|make|register|new).*\b(supplier|suppier|suplier|suppliar|supp|vendor|vendur)\b/i' => [
            'module' => 'suppliers',
            'action' => 'create_supplier',
            'priority' => 0
        ],
        '/\b(want|wnat|watn|wnta|need|nedd|wanna|would\s+like).*(add|ad|create|creat).*\b(supplier|suppier|suplier|suppliar|vendor|vendur)\b/i' => [
            'module' => 'suppliers',
            'action' => 'create_supplier',
            'priority' => 0
        ],
        '/\b(add|ad|create|creat|new|nwe|register|registr|save|make)\b.*\b(supplier|suppier|suplier|suppliar|supp|vendor|vendur)\b/i' => [
            'module' => 'suppliers',
            'action' => 'create_supplier',
            'priority' => 1
        ],
        // Possessive create: "add my supplier ABC"
        '/\b(add|ad|create|creat)\b\s+(my\s+)?(supplier|suppier|suplier|vendor|vendur)\s+\w+/i' => [
            'module' => 'suppliers',
            'action' => 'create_supplier',
            'priority' => 1
        ],
        
        // --- UPDATE SUPPLIER ---
        '/\b(edit|edti|eidt|update|updat|updaet|change|chang|modify|modfy|correct|fix)\b.*\b(supplier|suppier|suplier|suppliar|vendor|vendur)\b/i' => [
            'module' => 'suppliers',
            'action' => 'update_supplier',
            'priority' => 1
        ],
        // Casual: "i want to edit supplier", "need to update vendor"
        '/\b(i\s+(want|wnat|watn|wnta|need|nedd)|can\s+you|please)\b.*\b(update|updat|edit|edti|eidt|change|chang)\b.*\b(supplier|suppier|suplier|vendor|vendur)\b/i' => [
            'module' => 'suppliers',
            'action' => 'update_supplier',
            'priority' => 0
        ],
        '/\b(want|wnat|watn|wnta|need|nedd)\s+to\s+(edit|edti|eidt|update|updat)\s+(my|a|an|the)?\s*(supplier|suppier|suplier|vendor|vendur)s?\b/i' => [
            'module' => 'suppliers',
            'action' => 'update_supplier',
            'priority' => 0
        ],
        // Pattern: "change ABC's phone number"
        '/\b(change|update|edit)\b\s+\w+.*\b(phone|email|address|contact|name)\b/i' => [
            'module' => 'suppliers',
            'action' => 'update_supplier',
            'priority' => 3
        ],
        
        // --- DELETE SUPPLIER ---
        '/\b(delete|delet|deldt|deldta|remove|remov|rmove|erase|get rid of|drop)\b.*\b(supplier|suppier|suplier|suppliar|vendor|vendur)\b/i' => [
            'module' => 'suppliers',
            'action' => 'delete_supplier',
            'priority' => 1
        ],
        // Casual: "i want to delete supplier", "need to remove vendor"
        '/\b(i\s+(want|wnat|watn|wnta|need|nedd)|can\s+you|please)\b.*\b(delete|delet|deldt|remove|remov)\b.*\b(supplier|suppier|suplier|vendor|vendur)\b/i' => [
            'module' => 'suppliers',
            'action' => 'delete_supplier',
            'priority' => 0
        ],
        '/\b(want|wnat|watn|wnta|need|nedd)\s+to\s+(delete|delet|deldt|remove|remov)\s+(my|a|an|the)?\s*(supplier|suppier|suplier|vendor|vendur)s?\b/i' => [
            'module' => 'suppliers',
            'action' => 'delete_supplier',
            'priority' => 0
        ],
        // Pattern: "delete ABC from suppliers"
        '/\b(delete|delet|deldt|remove|remov)\b\s+\w+\s+(from\s+)?(supplier|suppier|suplier|vendor|vendur)s?\b/i' => [
            'module' => 'suppliers',
            'action' => 'delete_supplier',
            'priority' => 1
        ],
        
        // --- SUPPLIER DETAILS / INFO ---
        '/\b(info|information|details?|profile)\b.*\b(about|for|on)\b.*\b(supplier|vendor)\b/i' => [
            'module' => 'suppliers',
            'action' => 'supplier_details',
            'priority' => 1
        ],
        '/\b(tell\s+me\s+about|who\s+is|show\s+me)\b.*\b(supplier|vendor)\b/i' => [
            'module' => 'suppliers',
            'action' => 'supplier_details',
            'priority' => 1
        ],
        '/\bsupplier\b\s+\w+\s*(info|details?|profile)?$/i' => [
            'module' => 'suppliers',
            'action' => 'supplier_details',
            'priority' => 2
        ],
        
        // --- SUPPLIER BALANCE ---
        '/\b(what|how\s+much)\b.*(owe|owing|balance|outstanding).*\b(supplier|vendor)\b/i' => [
            'module' => 'suppliers',
            'action' => 'supplier_balance',
            'priority' => 1
        ],
        '/\bsupplier\b.*\b(balance|outstanding|owe|owing)\b/i' => [
            'module' => 'suppliers',
            'action' => 'supplier_balance',
            'priority' => 1
        ],
        
        // --- SUPPLIER TRANSACTIONS ---
        '/\b(supplier|vendor)\b.*\b(transaction|purchase|history|orders?)\b/i' => [
            'module' => 'suppliers',
            'action' => 'supplier_transactions',
            'priority' => 1
        ],
        '/\b(purchase|transaction)\s+history\b.*\b(supplier|vendor|from)\b/i' => [
            'module' => 'suppliers',
            'action' => 'supplier_transactions',
            'priority' => 1
        ],
        
        // --- VIEW SUPPLIERS LIST ---
        '/\b(view|show|list|get|display|see)\b.*\b(supplier|vendor|supplie|suplier)s?\b/i' => [
            'module' => 'suppliers',
            'action' => 'view_suppliers',
            'priority' => 2
        ],
        '/\bmy\s+(supplier|vendor)s?\b(?!.*\b(edit|update|delete|remove|change|modify)\b)/i' => [
            'module' => 'suppliers',
            'action' => 'view_suppliers',
            'priority' => 5
        ],
        '/\b(all|our)\s+(supplier|vendor)s?\b/i' => [
            'module' => 'suppliers',
            'action' => 'view_suppliers',
            'priority' => 3
        ],
        // GENERIC CATCH-ALL: Just "supplier" or "suppliers" alone
        '/^\s*(supplier|vendor|supplie|suplier)s?\s*$/i' => [
            'module' => 'suppliers',
            'action' => 'view_suppliers',
            'priority' => 10
        ],
        // Broad fallback: any mention of supplier/vendor without specific action verbs
        '/\b(supplier|vendor)s?\b(?!.*\b(add|create|edit|update|delete|remove|info|balance|transaction|owe)\b)/i' => [
            'module' => 'suppliers',
            'action' => 'view_suppliers',
            'priority' => 10
        ],
        
        // --- TOP SUPPLIERS ---
        '/\b(top|best|main|biggest|highest)\b.*\b(supplier|vendor)s?\b/i' => [
            'module' => 'suppliers',
            'action' => 'top_suppliers',
            'priority' => 1
        ],
        
        // --- SUPPLIER SUMMARY ---
        '/\bsupplier\b.*\b(summary|stats|statistics|overview)\b/i' => [
            'module' => 'suppliers',
            'action' => 'supplier_summary',
            'priority' => 1
        ],
        
        // --- ACTIVATE / DEACTIVATE ---
        '/\b(activate|enable|turn\s+on)\b.*\b(supplier|vendor)\b/i' => [
            'module' => 'suppliers',
            'action' => 'activate_supplier',
            'priority' => 1
        ],
        '/\b(deactivate|disable|turn\s+off)\b.*\b(supplier|vendor)\b/i' => [
            'module' => 'suppliers',
            'action' => 'deactivate_supplier',
            'priority' => 1
        ],
        
        // ============================================
        // INVENTORY MODULE
        // ============================================
        '/\b(add|create|new)\b.*\bproduct\b/i' => [
            'module' => 'inventory',
            'action' => 'add_product',
            'priority' => 2
        ],
        '/\b(add|import|create)\b.*\b(multiple|bulk|many)\b.*\bproducts?\b/i' => [
            'module' => 'inventory',
            'action' => 'add_multiple_products',
            'priority' => 2
        ],
        '/\b(update|edit|change|modify)\b.*\bproduct\b/i' => [
            'module' => 'inventory',
            'action' => 'update_product',
            'priority' => 3
        ],
        '/\b(adjust|change|update)\b.*\b(stock|quantity|inventory)\b/i' => [
            'module' => 'inventory',
            'action' => 'adjust_stock',
            'priority' => 3
        ],
        '/\b(view|show|list|check)\b.*\b(inventory|products?|stock)\b/i' => [
            'module' => 'inventory',
            'action' => 'view_inventory',
            'priority' => 1
        ],
        '/\b(low|running out|out of stock|reorder|shortage)\b.*\b(stock|inventory|product)?\b/i' => [
            'module' => 'inventory',
            'action' => 'inventory_analysis',
            'priority' => 1
        ],
        '/\b(inventory|stock)\b.*\b(analysis|analytics|insights?|report)\b/i' => [
            'module' => 'inventory',
            'action' => 'inventory_analysis',
            'priority' => 1
        ],
        '/\b(best|top|most)\b.*\bselling\b.*\bproducts?\b/i' => [
            'module' => 'inventory',
            'action' => 'product_analytics',
            'priority' => 1
        ],
        
        // ============================================
        // SALES MODULE
        // ============================================
        '/\b(create|generate|make|new)\b.*\binvoice\b/i' => [
            'module' => 'sales',
            'action' => 'create_invoice',
            'priority' => 2
        ],
        '/\b(update|edit|change|modify)\b.*\binvoice\b/i' => [
            'module' => 'sales',
            'action' => 'update_invoice',
            'priority' => 3
        ],
        '/\b(view|show|get|find|check)\b.*\binvoice\b/i' => [
            'module' => 'sales',
            'action' => 'view_invoice',
            'priority' => 1
        ],
        '/\b(record|add|receive|log)\b.*\b(customer\s+)?payment\b/i' => [
            'module' => 'sales',
            'action' => 'record_payment',
            'priority' => 4
        ],
        '/\b(sales?|revenue)\b.*\b(summary|report|stats|statistics|today|this week|this month)\b/i' => [
            'module' => 'sales',
            'action' => 'sales_summary',
            'priority' => 1
        ],
        '/\bhow much\b.*(made|earned|sold|sales?|revenue)\b/i' => [
            'module' => 'sales',
            'action' => 'sales_summary',
            'priority' => 1
        ],
        '/\b(sales?)\b.*\b(analytics?|analysis|trends?|insights?)\b/i' => [
            'module' => 'sales',
            'action' => 'sales_analytics',
            'priority' => 1
        ],
        
        // ============================================
        // PAYMENTS MODULE
        // ============================================
        '/\b(pending|unpaid|outstanding|overdue)\b.*\binvoices?\b/i' => [
            'module' => 'payments',
            'action' => 'view_pending_invoices',
            'priority' => 1
        ],
        '/\b(pending|unpaid|outstanding)\b.*\b(supplier|vendor)\b.*\bbills?\b/i' => [
            'module' => 'payments',
            'action' => 'view_pending_supplier_bills',
            'priority' => 1
        ],
        '/\bwhat\b.*\bowe\b/i' => [
            'module' => 'payments',
            'action' => 'view_pending_supplier_bills',
            'priority' => 1
        ],
        '/\b(approve|confirm|authorize|pay)\b.*\b(supplier|vendor)\b.*\bpayment\b/i' => [
            'module' => 'payments',
            'action' => 'approve_supplier_payment',
            'priority' => 4
        ],
        '/\b(payment|transaction)\b.*\bhistory\b/i' => [
            'module' => 'payments',
            'action' => 'view_transaction_history',
            'priority' => 1
        ],
        
        // ============================================
        // PURCHASES MODULE
        // ============================================
        '/\b(create|new|make)\b.*\b(purchase|po|purchase order)\b/i' => [
            'module' => 'purchases',
            'action' => 'create_purchase_order',
            'priority' => 2
        ],
        '/\b(update|edit|change)\b.*\b(purchase|po|purchase order)\b/i' => [
            'module' => 'purchases',
            'action' => 'update_purchase_order',
            'priority' => 3
        ],
        '/\b(receive|received|got)\b.*\bgoods\b/i' => [
            'module' => 'purchases',
            'action' => 'receive_goods',
            'priority' => 3
        ],
        '/\b(purchase|buying|procurement)\b.*\b(summary|report|stats)\b/i' => [
            'module' => 'purchases',
            'action' => 'purchase_summary',
            'priority' => 1
        ],
        
        // ============================================
        // EXPENSES MODULE
        // ============================================
        '/\b(add|record|create|log|new)\b.*\bexpense\b/i' => [
            'module' => 'expenses',
            'action' => 'add_expense',
            'priority' => 2
        ],
        '/\b(update|edit|change|modify)\b.*\bexpense\b/i' => [
            'module' => 'expenses',
            'action' => 'update_expense',
            'priority' => 3
        ],
        '/\b(view|show|list|check)\b.*\bexpenses?\b/i' => [
            'module' => 'expenses',
            'action' => 'view_expenses',
            'priority' => 1
        ],
        '/\bexpenses?\b.*\b(summary|report|stats|analytics?|breakdown)\b/i' => [
            'module' => 'expenses',
            'action' => 'expense_summary',
            'priority' => 1
        ],
        '/\bwhere\b.*(spend|spent)\b/i' => [
            'module' => 'expenses',
            'action' => 'expense_analytics',
            'priority' => 1
        ],
        
        // ============================================
        // REPORTS MODULE
        // ============================================
        '/\b(generate|create|make|show|give)\b.*\b(report|statement)\b/i' => [
            'module' => 'reports',
            'action' => 'generate_report',
            'priority' => 1
        ],
        '/\b(profit|loss|p&l|income|balance sheet|cash flow)\b.*\b(report|statement)?\b/i' => [
            'module' => 'reports',
            'action' => 'generate_report',
            'priority' => 1
        ],
        '/\b(business|financial)\b.*\b(overview|analysis|analytics?|summary)\b/i' => [
            'module' => 'reports',
            'action' => 'report_analysis',
            'priority' => 1
        ],
        
        // ============================================
        // SETTINGS MODULE
        // ============================================
        '/\b(view|show|list|get)\b.*\b(settings?|configuration)\b/i' => [
            'module' => 'settings',
            'action' => 'view_settings',
            'priority' => 1
        ],
        '/\b(view|show|list|what)\b.*\b(tax|taxes|tax rates?)\b/i' => [
            'module' => 'settings',
            'action' => 'view_tax_rates',
            'priority' => 1
        ],
        '/\b(create|add|new)\b.*\btax\b/i' => [
            'module' => 'settings',
            'action' => 'create_tax',
            'priority' => 2
        ],
        '/\b(update|edit|change)\b.*\btax\b/i' => [
            'module' => 'settings',
            'action' => 'update_tax',
            'priority' => 3
        ],
        '/\b(view|show|list)\b.*\btags?\b/i' => [
            'module' => 'settings',
            'action' => 'view_tags',
            'priority' => 1
        ],
        '/\b(create|add|new)\b.*\btag\b/i' => [
            'module' => 'settings',
            'action' => 'create_tag',
            'priority' => 2
        ],
        '/\b(company|business)\b.*\b(logo|information|info|details)\b/i' => [
            'module' => 'settings',
            'action' => 'update_company_info',
            'priority' => 3
        ],
        
        // ============================================
        // SUBSCRIPTION MODULE
        // ============================================
        '/\b(view|check|show|what)\b.*\b(subscription|plan|membership)\b/i' => [
            'module' => 'subscriptions',
            'action' => 'view_subscription',
            'priority' => 1
        ],
        '/\b(upgrade|change)\b.*\b(subscription|plan)\b/i' => [
            'module' => 'subscriptions',
            'action' => 'upgrade_guidance',
            'priority' => 3
        ],
        
        // ============================================
        // GENERAL / FALLBACK
        // ============================================
        '/^(hi|hello|hey|good morning|good afternoon|good evening)$/i' => [
            'module' => 'general',
            'action' => 'greeting',
            'priority' => 1
        ],
        '/\b(help|what can you do|capabilities|commands)\b/i' => [
            'module' => 'general',
            'action' => 'help',
            'priority' => 1
        ]
    ];
    
    // Module aliases/groupings
    private static $moduleAliases = [
        'customer' => 'customers',
        'supplier' => 'suppliers',
        'product' => 'inventory',
        'stock' => 'inventory',
        'invoice' => 'sales',
        'sale' => 'sales',
        'payment' => 'payments',
        'expense' => 'expenses',
        'purchase' => 'purchases',
        'report' => 'reports',
        'setting' => 'settings',
        'subscription' => 'subscriptions'
    ];
    
    /**
     * Detect intents from user message (CODE-OWNED)
     * 
     * @param string $message User's message
     * @return array Array of detected intents [{module, action, confidence, data}]
     */
    public static function detectIntents(string $message): array {
        $message = trim($message);
        $detectedIntents = [];
        
        error_log("Router::detectIntents - Input message: '{$message}'");
        
        // Check for cancel command first
        if (self::isCancelCommand($message)) {
            return [[
                'module' => 'system',
                'action' => 'cancel',
                'confidence' => 1.0,
                'data' => []
            ]];
        }
        
        // Match against patterns
        $matchCount = 0;
        foreach (self::$intentPatterns as $pattern => $intent) {
            if (preg_match($pattern, $message)) {
                $matchCount++;
                error_log("Router::detectIntents - Pattern matched: {$pattern} => {$intent['module']}.{$intent['action']}");
                $detectedIntents[] = [
                    'module' => $intent['module'],
                    'action' => $intent['action'],
                    'confidence' => 0.9, // Pattern match confidence
                    'priority' => $intent['priority'],
                    'data' => []
                ];
            }
        }
        
        error_log("Router::detectIntents - Total patterns matched: {$matchCount}");
        
        // Remove duplicates (same action)
        $detectedIntents = self::deduplicateIntents($detectedIntents);
        
        // Sort by priority
        usort($detectedIntents, fn($a, $b) => $a['priority'] - $b['priority']);
        
        // If no intents detected, try fuzzy keyword matching as fallback
        if (empty($detectedIntents)) {
            error_log("Router::detectIntents - No pattern matches, trying fuzzy matching");
            $fuzzyIntent = self::fuzzyMatchIntent($message);
            if ($fuzzyIntent) {
                error_log("Router::detectIntents - Fuzzy match found: {$fuzzyIntent['module']}.{$fuzzyIntent['action']}");
                return [$fuzzyIntent];
            }
            
            error_log("Router::detectIntents - No matches found, returning 'unknown'");
            return [[
                'module' => 'general',
                'action' => 'unknown',
                'confidence' => 0.3,
                'data' => []
            ]];
        }
        
        return $detectedIntents;
    }
    
    /**
     * Fuzzy match intent based on keyword similarity (handles typos)
     */
    private static function fuzzyMatchIntent(string $message): ?array {
        $message = strtolower($message);
        $words = preg_split('/\s+/', $message);
        
        // Keywords for each action with their variations
        $actionKeywords = [
            'update_customer' => [
                'keywords' => ['edit', 'update', 'change', 'modify'],
                'context' => ['customer', 'customers', 'client', 'clients'],
                'module' => 'customers'
            ],
            'create_customer' => [
                'keywords' => ['create', 'add', 'new', 'register', 'make'],
                'context' => ['customer', 'customers', 'client', 'clients'],
                'module' => 'customers'
            ],
            'delete_customer' => [
                'keywords' => ['delete', 'remove', 'erase'],
                'context' => ['customer', 'customers', 'client', 'clients'],
                'module' => 'customers'
            ],
            'customer_summary' => [
                'keywords' => ['list', 'show', 'view', 'all', 'get', 'see'],
                'context' => ['customer', 'customers', 'client', 'clients'],
                'module' => 'customers'
            ],
            // Question patterns - "can I..."
            'ask_delete_customer' => [
                'keywords' => ['can', 'could', 'may', 'possible', 'how'],
                'action_keywords' => ['delete', 'remove'],
                'context' => ['customer', 'customers', 'client', 'clients'],
                'module' => 'customers'
            ],
            'ask_update_customer' => [
                'keywords' => ['can', 'could', 'may', 'possible', 'how'],
                'action_keywords' => ['edit', 'update', 'change', 'modify'],
                'context' => ['customer', 'customers', 'client', 'clients'],
                'module' => 'customers'
            ],
            'ask_create_customer' => [
                'keywords' => ['can', 'could', 'may', 'possible', 'how'],
                'action_keywords' => ['create', 'add', 'make', 'register'],
                'context' => ['customer', 'customers', 'client', 'clients'],
                'module' => 'customers'
            ],
            // Supplier actions
            'create_supplier' => [
                'keywords' => ['create', 'add', 'new', 'register', 'make'],
                'context' => ['supplier', 'suppliers', 'vendor', 'vendors'],
                'module' => 'suppliers'
            ],
            'update_supplier' => [
                'keywords' => ['edit', 'update', 'change', 'modify'],
                'context' => ['supplier', 'suppliers', 'vendor', 'vendors'],
                'module' => 'suppliers'
            ],
            'delete_supplier' => [
                'keywords' => ['delete', 'remove', 'erase'],
                'context' => ['supplier', 'suppliers', 'vendor', 'vendors'],
                'module' => 'suppliers'
            ],
            'view_suppliers' => [
                'keywords' => ['list', 'show', 'view', 'all', 'get', 'see'],
                'context' => ['supplier', 'suppliers', 'vendor', 'vendors'],
                'module' => 'suppliers'
            ],
        ];
        
        foreach ($actionKeywords as $action => $config) {
            $hasKeyword = false;
            $hasContext = false;
            $hasActionKeyword = true; // Default true if no action_keywords defined
            
            // For question patterns, need to match question word + action + context
            if (isset($config['action_keywords'])) {
                $hasActionKeyword = false;
            }
            
            foreach ($words as $word) {
                // Check for keyword match (with typo tolerance - levenshtein)
                foreach ($config['keywords'] as $keyword) {
                    if (self::isSimilar($word, $keyword, 2)) {
                        $hasKeyword = true;
                        break;
                    }
                }
                
                // Check for action keyword match (for question patterns)
                if (isset($config['action_keywords'])) {
                    foreach ($config['action_keywords'] as $actionKw) {
                        if (self::isSimilar($word, $actionKw, 2)) {
                            $hasActionKeyword = true;
                            break;
                        }
                    }
                }
                
                // Check for context match (customer with typo tolerance)
                foreach ($config['context'] as $context) {
                    if (self::isSimilar($word, $context, 3)) { // Allow more variance for "customer" typos
                        $hasContext = true;
                        break;
                    }
                }
                
                if ($hasKeyword && $hasContext && $hasActionKeyword) {
                    error_log("Fuzzy matched intent: {$action} from message: {$message}");
                    return [
                        'module' => $config['module'],
                        'action' => $action,
                        'confidence' => 0.7,
                        'priority' => 2,
                        'data' => []
                    ];
                }
            }
        }
        
        return null;
    }
    
    /**
     * Check if two words are similar using levenshtein distance
     */
    private static function isSimilar(string $word1, string $word2, int $maxDistance = 2): bool {
        // Exact match
        if ($word1 === $word2) return true;
        
        // If word starts with the target (partial typing)
        if (strlen($word1) >= 3 && strpos($word2, $word1) === 0) return true;
        if (strlen($word2) >= 3 && strpos($word1, $word2) === 0) return true;
        
        // Levenshtein distance for typos
        $distance = levenshtein($word1, $word2);
        return $distance <= $maxDistance;
    }
    
    /**
     * Check if message is a cancel/reset command
     */
    public static function isCancelCommand(string $message): bool {
        $cancelPatterns = [
            '/^cancel$/i',
            '/^reset$/i',
            '/^stop$/i',
            '/^start over$/i',
            '/^nevermind$/i',
            '/^never mind$/i',
            '/^abort$/i',
            '/^quit$/i',
            '/^exit$/i'
        ];
        
        foreach ($cancelPatterns as $pattern) {
            if (preg_match($pattern, trim($message))) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Check if message is a confirmation response
     */
    public static function isConfirmationResponse(string $message): ?string {
        $message = strtolower(trim($message));
        
        // Approval patterns
        $approvePatterns = ['yes', 'y', 'confirm', 'approve', 'ok', 'okay', 'proceed', 'do it', 'go ahead'];
        if (in_array($message, $approvePatterns)) {
            return 'approve';
        }
        
        // Rejection patterns
        $rejectPatterns = ['no', 'n', 'reject', 'decline', 'stop', 'cancel', 'dont', "don't"];
        if (in_array($message, $rejectPatterns)) {
            return 'reject';
        }
        
        // Modification request
        if (preg_match('/\b(change|modify|update|edit)\b/i', $message)) {
            return 'modify';
        }
        
        return null;
    }
    
    /**
     * Check if message looks like data input (name, number, email) rather than a command
     * Used when system is waiting for user to provide missing data
     */
    public static function looksLikeDataInput(string $message): bool {
        $message = trim($message);
        $wordCount = str_word_count($message);
        
        // Patterns that indicate user is providing data
        $dataIndicators = [
            // "his name is X", "her name is X", "the name is X", "name is X"
            '/\b(his|her|the|my)?\s*name\s+(is|:|=)\s*(.+)/i',
            // "id 35", "id: 35", "id is 35", "customer id 35"
            '/\bid\s*(is|:|\s)\s*(\d+)/i',
            // "it's X", "its X"  
            '/^it\'?s?\s+(.+)/i',
            // Just a number (like "35")
            '/^\d+$/',
            // Email pattern
            '/^[\w\.\-]+@[\w\.\-]+\.\w+$/',
            // Phone number pattern
            '/^[\d\s\-\+\(\)]{7,}$/'
        ];
        
        foreach ($dataIndicators as $pattern) {
            if (preg_match($pattern, $message)) {
                return true;
            }
        }
        
        // Single word or short phrase that looks like data
        if ($wordCount <= 5) {
            // Definite commands - NOT data
            $commandPatterns = [
                '/^(create|add|new|delete|remove|update|edit|show|list|view|cancel|help)\s+(a|an|the)?\s*(customer|product|invoice|expense|supplier|payment)/i',
                '/^(hi|hello|hey)$/i'
            ];
            
            foreach ($commandPatterns as $pattern) {
                if (preg_match($pattern, $message)) {
                    return false;
                }
            }
            
            // Looks like a name (capitalized words or all lowercase short response)
            if (preg_match('/^[A-Z][a-z]+(\s+[A-Z]?[a-z]+)*$/u', $message)) {
                return true;
            }
            
            // Just lowercase words (like "john doe")
            if (preg_match('/^[a-z]+(\s+[a-z]+)*$/i', $message) && $wordCount <= 3) {
                return true;
            }
            
            // Looks like an email
            if (filter_var($message, FILTER_VALIDATE_EMAIL)) {
                return true;
            }
            
            // Short response that's not a known command - likely data
            if ($wordCount <= 3 && strlen($message) > 2) {
                // Double check it doesn't contain command words at the start
                if (!preg_match('/^(show|list|view|create|add|delete|remove|help|hi|hello)/i', $message)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Extract actual data from data-like input
     * E.g., "his name is john doe" => "john doe"
     */
    public static function extractDataFromInput(string $message): string {
        $message = trim($message);
        
        // Extract name from "his name is X", "name is X", etc.
        if (preg_match('/\b(?:his|her|the|my)?\s*name\s+(?:is|:|=)\s*(.+)/i', $message, $matches)) {
            return trim($matches[1]);
        }
        
        // Extract ID from "id 35", "id: 35", "id is 35"
        if (preg_match('/\bid\s*(?:is|:|\s)\s*(\d+)/i', $message, $matches)) {
            return trim($matches[1]);
        }
        
        // Extract from "it's X"
        if (preg_match('/^it\'?s?\s+(.+)/i', $message, $matches)) {
            return trim($matches[1]);
        }
        
        // Return as-is
        return $message;
    }
    
    /**
     * Remove duplicate intents (same action)
     */
    private static function deduplicateIntents(array $intents): array {
        $unique = [];
        $seenActions = [];
        
        foreach ($intents as $intent) {
            $key = $intent['module'] . ':' . $intent['action'];
            if (!in_array($key, $seenActions)) {
                $seenActions[] = $key;
                $unique[] = $intent;
            }
        }
        
        return $unique;
    }
    
    /**
     * Map intent to module
     */
    public static function getModule(string $intent): string {
        foreach (self::$intentPatterns as $pattern => $data) {
            if ($data['action'] === $intent) {
                return $data['module'];
            }
        }
        return 'general';
    }
    
    /**
     * Check if intent exists
     */
    public static function isValidIntent(string $module, string $action): bool {
        foreach (self::$intentPatterns as $pattern => $data) {
            if ($data['module'] === $module && $data['action'] === $action) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Get all intents for a module
     */
    public static function getModuleIntents(string $module): array {
        $intents = [];
        foreach (self::$intentPatterns as $pattern => $data) {
            if ($data['module'] === $module) {
                $intents[] = $data['action'];
            }
        }
        return array_unique($intents);
    }
    
    /**
     * Get all available modules
     */
    public static function getAllModules(): array {
        return [
            'customers',
            'suppliers', 
            'inventory',
            'sales',
            'payments',
            'purchases',
            'expenses',
            'reports',
            'settings',
            'subscriptions',
            'general'
        ];
    }
    
    /**
     * Check if action requires AI for data extraction
     */
    public static function requiresAIExtraction(string $action): bool {
        // Actions that need AI to extract data from natural language
        $aiActions = [
            'create_customer', 'update_customer', 'delete_customer',
            'view_customer', 'customer_balance', 'customer_transactions',
            'customer_details',  // Needs AI to extract customer name from message
            'change_customer_type', 'activate_customer', 'deactivate_customer',
            'create_supplier', 'update_supplier', 'delete_supplier',
            'view_supplier', 'supplier_balance', 'supplier_transactions',
            'supplier_details',  // Needs AI to extract supplier name from message
            'activate_supplier', 'deactivate_supplier',
            'add_product', 'add_multiple_products', 'update_product', 'adjust_stock',
            'create_invoice', 'update_invoice', 'record_payment',
            'create_purchase_order', 'update_purchase_order',
            'add_expense', 'update_expense',
            'create_tax', 'update_tax', 'create_tag',
            'approve_supplier_payment'
        ];
        
        return in_array($action, $aiActions);
    }
    
    /**
     * Check if action is read-only (safe to auto-execute without data)
     * These actions don't modify data AND don't need specific entity info
     */
    public static function isReadOnlyAction(string $action): bool {
        // Actions that just query aggregated/summary data
        $readOnlyActions = [
            'greeting', 'help', 'unknown',
            'top_customers', 'top_suppliers', 'top_products',
            'customer_summary', 'supplier_summary', 'inventory_summary',
            'sales_summary', 'expense_summary', 'purchase_summary',
            'dashboard_stats', 'financial_summary'
        ];
        
        return preg_match('/^(list_|get_all_|show_all_|.*_summary|.*_stats)/', $action) ||
               in_array($action, $readOnlyActions);
    }
}
