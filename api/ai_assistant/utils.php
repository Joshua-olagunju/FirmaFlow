<?php
/**
 * Utilities Module
 * Helper functions, confidence scoring, risk assessment, and common operations
 */

/**
 * Enhance parsed data with metadata (confidence, risk, validation)
 */
function enhanceWithMetadata($parsed, $pdo, $companyId) {
    $intent = $parsed['intent'] ?? 'unknown';
    $extractedData = $parsed['extracted_data'] ?? [];
    
    // Validate data against intent requirements
    $validation = validateIntentData($intent, $extractedData);
    
    // Get intent metadata
    $metadata = $validation['metadata'];
    
    // Calculate confidence if not provided by AI
    if (!isset($parsed['confidence']) || $parsed['confidence'] === 0) {
        $parsed['confidence'] = calculateConfidence($parsed, $validation);
    } else {
        // Recalculate with our multi-factor algorithm
        $parsed['confidence'] = calculateConfidence($parsed, $validation);
    }
    
    // Add confidence level label
    $parsed['confidence_level'] = getConfidenceLevel($parsed['confidence']);
    
    // Perform comprehensive risk assessment
    $riskAssessment = assessRiskLevel($intent, $extractedData, $metadata);
    $parsed['risk_level'] = $riskAssessment['level'];
    $parsed['risk_score'] = $riskAssessment['score'];
    $parsed['risk_factors'] = $riskAssessment['factors'];
    
    // Determine if confirmation is required (multi-factor decision)
    $requiresConfirmation = 
        $metadata['requires_confirmation'] 
        || !$validation['is_valid'] 
        || $parsed['confidence'] < 0.7
        || $riskAssessment['requires_confirmation']
        || $riskAssessment['level'] === 'high';
    
    $parsed['requires_confirmation'] = $requiresConfirmation;
    
    // Add missing fields if any
    if (!empty($validation['missing_fields'])) {
        $parsed['missing_fields'] = $validation['missing_fields'];
        $parsed['requires_confirmation'] = true;
    }
    
    // Add has_all_required field for frontend compatibility
    $parsed['has_all_required'] = $validation['is_valid'];
    
    // Add task_type field for frontend compatibility (maps to intent)
    $parsed['task_type'] = $parsed['intent'];
    
    // Add metadata
    $parsed['metadata'] = $metadata;
    $parsed['category'] = getIntentCategory($intent);
    
    // Add execution recommendation
    $parsed['can_auto_execute'] = 
        $metadata['can_auto_execute'] 
        && $validation['is_valid'] 
        && $parsed['confidence'] >= 0.8
        && $riskAssessment['level'] !== 'high'
        && !$requiresConfirmation;
    
    return $parsed;
}

/**
 * Calculate confidence score based on completeness and clarity
 * Multi-factor confidence algorithm (0.0 - 1.0)
 */
function calculateConfidence($parsed, $validation) {
    $factors = [];
    
    // Factor 1: AI Confidence (if provided by Groq)
    $aiConfidence = $parsed['confidence'] ?? 0.8;
    $factors['ai_confidence'] = $aiConfidence * 0.3; // 30% weight
    
    // Factor 2: Data Completeness (required fields present)
    $requiredFields = $validation['metadata']['required_fields'] ?? [];
    $missingCount = count($validation['missing_fields']);
    $totalRequired = count($requiredFields);
    
    if ($totalRequired > 0) {
        $completeness = ($totalRequired - $missingCount) / $totalRequired;
    } else {
        $completeness = 1.0;
    }
    $factors['data_completeness'] = $completeness * 0.3; // 30% weight
    
    // Factor 3: Intent Clarity (no unknown or ambiguous intents)
    if ($parsed['intent'] === 'unknown') {
        $factors['intent_clarity'] = 0.0;
    } elseif (!empty($parsed['clarification_message'])) {
        $factors['intent_clarity'] = 0.5 * 0.2; // Ambiguous but identifiable
    } else {
        $factors['intent_clarity'] = 1.0 * 0.2; // 20% weight
    }
    
    // Factor 4: Entity Validation (if entities like customer/product are referenced)
    $entityScore = 1.0;
    if (isset($parsed['extracted_data']['customer_name']) && empty($parsed['customer_id'])) {
        $entityScore -= 0.3; // Customer referenced but not found
    }
    if (isset($parsed['extracted_data']['product_name']) && empty($parsed['product_id'])) {
        $entityScore -= 0.3; // Product referenced but not found
    }
    $factors['entity_validation'] = max(0, $entityScore) * 0.2; // 20% weight
    
    // Calculate weighted confidence
    $totalConfidence = array_sum($factors);
    
    // Store breakdown for debugging
    $parsed['confidence_breakdown'] = $factors;
    
    return max(0.0, min(1.0, $totalConfidence));
}

/**
 * Get confidence level label
 */
function getConfidenceLevel($confidence) {
    if ($confidence >= 0.9) return 'very_high';
    if ($confidence >= 0.75) return 'high';
    if ($confidence >= 0.6) return 'medium';
    if ($confidence >= 0.4) return 'low';
    return 'very_low';
}

/**
 * Assess risk level for an intent with multi-dimensional analysis
 */
function assessRiskLevel($intent, $data, $metadata) {
    $riskFactors = [];
    
    // Base risk from metadata
    $baseRisk = $metadata['default_risk'] ?? 'medium';
    $riskScore = ['low' => 1, 'medium' => 2, 'high' => 3][$baseRisk];
    $riskFactors['base_risk'] = $baseRisk;
    
    // Financial Impact Assessment
    $financialImpact = 0;
    if (isset($data['amount']) || isset($data['total'])) {
        $amount = $data['amount'] ?? $data['total'] ?? 0;
        if ($amount > 1000000) {
            $financialImpact = 3; // High impact
        } elseif ($amount > 100000) {
            $financialImpact = 2; // Medium impact
        } elseif ($amount > 0) {
            $financialImpact = 1; // Low impact
        }
    }
    $riskFactors['financial_impact'] = $financialImpact;
    
    // Data Modification Risk
    $modificationRisk = 0;
    $writeIntents = ['create_', 'update_', 'delete_', 'approve_', 'adjust_', 'record_'];
    foreach ($writeIntents as $prefix) {
        if (strpos($intent, $prefix) === 0) {
            $modificationRisk = 2;
            break;
        }
    }
    $riskFactors['modification_risk'] = $modificationRisk;
    
    // Bulk Operation Risk
    $bulkRisk = 0;
    if (isset($data['items']) && is_array($data['items']) && count($data['items']) > 5) {
        $bulkRisk = 1;
    }
    if (strpos($intent, 'multiple') !== false || strpos($intent, 'bulk') !== false) {
        $bulkRisk = 2;
    }
    $riskFactors['bulk_operation'] = $bulkRisk;
    
    // Irreversibility Risk
    $irreversibleIntents = ['delete_', 'approve_payment', 'void_', 'cancel_'];
    $irreversibilityRisk = 0;
    foreach ($irreversibleIntents as $keyword) {
        if (strpos($intent, $keyword) !== false) {
            $irreversibilityRisk = 3;
            break;
        }
    }
    $riskFactors['irreversibility'] = $irreversibilityRisk;
    
    // Calculate composite risk score
    $totalRiskScore = $riskScore + $financialImpact + $modificationRisk + $bulkRisk + $irreversibilityRisk;
    
    // Determine final risk level
    if ($totalRiskScore >= 8) {
        $finalRisk = 'high';
    } elseif ($totalRiskScore >= 4) {
        $finalRisk = 'medium';
    } else {
        $finalRisk = 'low';
    }
    
    return [
        'level' => $finalRisk,
        'score' => $totalRiskScore,
        'factors' => $riskFactors,
        'requires_confirmation' => $finalRisk === 'high' || $totalRiskScore >= 5
    ];
}

/**
 * Format success response with structured data
 */
function formatSuccessResponse($message, $data = [], $additionalInfo = []) {
    return array_merge([
        'success' => true,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('Y-m-d H:i:s')
    ], $additionalInfo);
}

/**
 * Format error response with categorization
 */
function formatErrorResponse($error, $code = 'ERROR', $additionalInfo = []) {
    $errorCategories = [
        'NOT_FOUND' => 'The requested resource was not found',
        'VALIDATION_ERROR' => 'Input validation failed',
        'PERMISSION_DENIED' => 'You do not have permission for this action',
        'DUPLICATE' => 'This record already exists',
        'INSUFFICIENT_DATA' => 'Missing required information',
        'SYSTEM_ERROR' => 'An internal error occurred',
        'NOT_IMPLEMENTED' => 'This feature is not yet available',
        'CONFLICT' => 'Operation conflicts with existing data'
    ];
    
    return array_merge([
        'success' => false,
        'error' => $error,
        'error_code' => $code,
        'error_category' => $errorCategories[$code] ?? 'General Error',
        'timestamp' => date('Y-m-d H:i:s'),
        'can_retry' => in_array($code, ['SYSTEM_ERROR', 'TIMEOUT'])
    ], $additionalInfo);
}

/**
 * Format validation error with specific field feedback
 */
function formatValidationError($missingFields, $invalidFields = []) {
    $message = 'Please provide the following information: ';
    $message .= implode(', ', $missingFields);
    
    if (!empty($invalidFields)) {
        $message .= '. Invalid values for: ' . implode(', ', array_keys($invalidFields));
    }
    
    return formatErrorResponse($message, 'VALIDATION_ERROR', [
        'missing_fields' => $missingFields,
        'invalid_fields' => $invalidFields,
        'action_required' => 'provide_missing_data'
    ]);
}

/**
 * Generate next invoice number
 */
function generateInvoiceNumber($pdo, $companyId) {
    $stmt = $pdo->prepare("
        SELECT invoice_no FROM sales_invoices 
        WHERE company_id = ? 
        ORDER BY id DESC 
        LIMIT 1
    ");
    $stmt->execute([$companyId]);
    $lastInvoice = $stmt->fetch();
    
    if ($lastInvoice && !empty($lastInvoice['invoice_no'])) {
        // Extract number from format like "INV-2024-001"
        preg_match('/(\d+)$/', $lastInvoice['invoice_no'], $matches);
        $lastNumber = isset($matches[1]) ? intval($matches[1]) : 0;
        $nextNumber = $lastNumber + 1;
    } else {
        $nextNumber = 1;
    }
    
    return 'INV-' . date('Y') . '-' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
}

/**
 * Generate expense number
 */
function generateExpenseNumber($pdo, $companyId) {
    $stmt = $pdo->prepare("
        SELECT reference FROM expenses 
        WHERE company_id = ? 
        ORDER BY id DESC 
        LIMIT 1
    ");
    $stmt->execute([$companyId]);
    $lastExpense = $stmt->fetch();
    
    if ($lastExpense && !empty($lastExpense['reference'])) {
        preg_match('/(\d+)$/', $lastExpense['reference'], $matches);
        $lastNumber = isset($matches[1]) ? intval($matches[1]) : 0;
        $nextNumber = $lastNumber + 1;
    } else {
        $nextNumber = 1;
    }
    
    return 'EXP-' . date('Y') . '-' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
}

/**
 * Generate purchase order number
 */
function generatePurchaseNumber($pdo, $companyId) {
    $stmt = $pdo->prepare("
        SELECT purchase_number FROM purchases 
        WHERE company_id = ? 
        ORDER BY id DESC 
        LIMIT 1
    ");
    $stmt->execute([$companyId]);
    $lastPurchase = $stmt->fetch();
    
    if ($lastPurchase && !empty($lastPurchase['purchase_number'])) {
        preg_match('/(\d+)$/', $lastPurchase['purchase_number'], $matches);
        $lastNumber = isset($matches[1]) ? intval($matches[1]) : 0;
        $nextNumber = $lastNumber + 1;
    } else {
        $nextNumber = 1;
    }
    
    return 'PO-' . date('Y') . '-' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
}

/**
 * Auto-generate SKU for products
 */
function generateProductSKU($name) {
    if (empty($name)) return '';
    
    $words = array_filter(explode(' ', $name), function($w) { return !empty($w); });
    
    if (count($words) >= 2) {
        $first = strtoupper(substr($words[0], 0, 3));
        $second = strtoupper(substr($words[1], 0, 3));
        return $first . '-' . $second;
    } else {
        $single = strtoupper(substr($words[0], 0, 6));
        return $single . '-' . rand(100, 999);
    }
}

/**
 * Find customer by name or email
 */
function findCustomer($pdo, $companyId, $nameOrEmail) {
    $stmt = $pdo->prepare("
        SELECT * FROM customers 
        WHERE company_id = ? 
        AND (name = ? OR email = ?)
        LIMIT 1
    ");
    $stmt->execute([$companyId, $nameOrEmail, $nameOrEmail]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

/**
 * Find product by name or SKU
 */
function findProduct($pdo, $companyId, $nameOrSku) {
    $stmt = $pdo->prepare("
        SELECT * FROM products 
        WHERE company_id = ? 
        AND (name = ? OR sku = ?)
        LIMIT 1
    ");
    $stmt->execute([$companyId, $nameOrSku, $nameOrSku]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

/**
 * Check user permissions for action
 */
function checkUserPermission($userRole, $intent, $riskLevel) {
    // Admin can do everything
    if ($userRole === 'admin' || $userRole === 'owner') {
        return true;
    }
    
    // High-risk actions require admin
    if ($riskLevel === 'high' && $userRole !== 'admin') {
        return false;
    }
    
    // Manager can do most things except high-risk
    if ($userRole === 'manager' && $riskLevel !== 'high') {
        return true;
    }
    
    // Regular users have limited access
    $allowedForUsers = [
        'view_customer',
        'view_inventory',
        'view_invoice',
        'view_expenses',
        'generate_report',
        'view_subscription',
        'general_chat'
    ];
    
    return in_array($intent, $allowedForUsers);
}

/**
 * Log AI assistant action
 */
function logAIAction($pdo, $companyId, $userId, $intent, $data, $result) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO ai_assistant_logs 
            (company_id, user_id, intent, input_data, output_result, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $companyId,
            $userId,
            $intent,
            json_encode($data),
            json_encode($result)
        ]);
    } catch (Exception $e) {
        // Log silently, don't break flow
        error_log("Failed to log AI action: " . $e->getMessage());
    }
}

/**
 * Format currency
 */
function formatCurrency($amount, $currency = 'NGN') {
    $symbol = $currency === 'NGN' ? '₦' : '$';
    return $symbol . number_format($amount, 2);
}

/**
 * Parse date range from natural language
 */
function parseDateRange($dateRange) {
    $today = date('Y-m-d');
    $start = $today;
    $end = $today;
    
    // Normalize input
    $range = strtolower(trim($dateRange));
    
    switch ($range) {
        case 'today':
            $start = $today;
            $end = $today;
            break;
            
        case 'yesterday':
            $start = date('Y-m-d', strtotime('-1 day'));
            $end = $start;
            break;
            
        case 'this week':
        case 'week':
            $start = date('Y-m-d', strtotime('monday this week'));
            $end = date('Y-m-d', strtotime('sunday this week'));
            break;
            
        case 'last week':
            $start = date('Y-m-d', strtotime('monday last week'));
            $end = date('Y-m-d', strtotime('sunday last week'));
            break;
            
        case 'this month':
        case 'month':
            $start = date('Y-m-01');
            $end = date('Y-m-t');
            break;
            
        case 'last month':
            $start = date('Y-m-01', strtotime('first day of last month'));
            $end = date('Y-m-t', strtotime('last day of last month'));
            break;
            
        case 'this year':
        case 'year':
            $start = date('Y-01-01');
            $end = date('Y-12-31');
            break;
            
        case 'last year':
            $start = date('Y-01-01', strtotime('last year'));
            $end = date('Y-12-31', strtotime('last year'));
            break;
            
        case 'last 7 days':
        case '7 days':
            $start = date('Y-m-d', strtotime('-7 days'));
            $end = $today;
            break;
            
        case 'last 30 days':
        case '30 days':
            $start = date('Y-m-d', strtotime('-30 days'));
            $end = $today;
            break;
            
        case 'last 90 days':
        case '90 days':
            $start = date('Y-m-d', strtotime('-90 days'));
            $end = $today;
            break;
            
        default:
            // Try to parse as date range (e.g., "2024-01-01 to 2024-12-31")
            if (preg_match('/(\d{4}-\d{2}-\d{2})\s*to\s*(\d{4}-\d{2}-\d{2})/i', $range, $matches)) {
                $start = $matches[1];
                $end = $matches[2];
            }
            break;
    }
    
    return [
        'start' => $start,
        'end' => $end
    ];
}
