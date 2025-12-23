<?php
/**
 * Expense Handler
 * Handles all expense-related intents
 */

function handleExpensesIntent($intent, $data, $state, $pdo, $companyId, $userId) {
    switch ($intent) {
        case 'add_expense':
            return addExpenseAction($data, $pdo, $companyId, $userId);
            
        case 'view_expenses':
            return queryExpenses($pdo, $companyId, $data);
            
        case 'expense_summary':
            return queryExpenseSummary($pdo, $companyId, $data);
            
        case 'expense_analytics':
            return expenseAnalyticsAction($data, $pdo, $companyId);
            
        default:
            return formatErrorResponse('Unknown expense intent: ' . $intent);
    }
}

/**
 * Add expense
 */
function addExpenseAction($data, $pdo, $companyId, $userId) {
    try {
        // Validate required fields
        if (empty($data['description'])) {
            return formatErrorResponse('Expense description is required', 'VALIDATION_ERROR');
        }
        
        if (!isset($data['amount']) || $data['amount'] <= 0) {
            return formatErrorResponse('Valid expense amount is required', 'VALIDATION_ERROR');
        }
        
        $description = $data['description'];
        $amount = $data['amount'];
        $category = $data['category'] ?? 'General';
        $expenseDate = $data['date'] ?? date('Y-m-d');
        $paymentMethod = $data['payment_method'] ?? 'Cash';
        $reference = generateExpenseNumber($pdo, $companyId);
        
        // Insert expense
        $stmt = $pdo->prepare("
            INSERT INTO expenses 
            (company_id, reference, description, amount, category, expense_date, payment_method, created_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        $stmt->execute([
            $companyId,
            $reference,
            $description,
            $amount,
            $category,
            $expenseDate,
            $paymentMethod,
            $userId
        ]);
        
        $expenseId = $pdo->lastInsertId();
        
        return formatSuccessResponse(
            "✅ Expense recorded!\n📝 **{$description}**\n💸 Amount: " . formatCurrency($amount) . "\n📂 Category: {$category}\n🔖 Ref: {$reference}",
            [
                'expense_id' => $expenseId,
                'reference' => $reference,
                'amount' => $amount
            ]
        );
        
    } catch (Exception $e) {
        return formatErrorResponse('Failed to record expense: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}

/**
 * Query expense summary
 */
function queryExpenseSummary($pdo, $companyId, $filters) {
    try {
        $period = $filters['period'] ?? 'month';
        $dateCondition = "DATE(expense_date) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
        
        if ($period === 'week') {
            $dateCondition = "DATE(expense_date) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
        } elseif ($period === 'year') {
            $dateCondition = "YEAR(expense_date) = YEAR(CURDATE())";
        }
        
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as expense_count,
                SUM(amount) as total_expenses,
                AVG(amount) as avg_expense,
                category,
                SUM(amount) as category_total
            FROM expenses
            WHERE company_id = ? AND {$dateCondition}
            GROUP BY category
            ORDER BY category_total DESC
        ");
        $stmt->execute([$companyId]);
        $byCategory = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $totalExpenses = array_sum(array_column($byCategory, 'category_total'));
        $totalCount = array_sum(array_column($byCategory, 'expense_count'));
        
        $answer = "💸 **Expense Summary (Last {$period}):**\n\n";
        $answer .= "• Total Expenses: " . formatCurrency($totalExpenses) . "\n";
        $answer .= "• Count: {$totalCount}\n\n";
        
        if (!empty($byCategory)) {
            $answer .= "**By Category:**\n";
            foreach ($byCategory as $cat) {
                $answer .= "• {$cat['category']}: " . formatCurrency($cat['category_total']) . "\n";
            }
        }
        
        return formatSuccessResponse($answer, ['by_category' => $byCategory, 'total' => $totalExpenses]);
        
    } catch (Exception $e) {
        return formatErrorResponse('Failed to get expense summary: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}

/**
 * Expense Analytics - Advanced expense metrics and trends
 */
function expenseAnalyticsAction($data, $pdo, $companyId) {
    try {
        $metric = $data['metric'] ?? 'overview';
        
        // Build date filter
        $dateFilter = "";
        $params = [$companyId];
        
        if (isset($data['date_range'])) {
            if ($data['date_range'] === 'this_month') {
                $dateFilter = "AND expense_date >= DATE_FORMAT(NOW(), '%Y-%m-01')";
            } elseif ($data['date_range'] === 'last_month') {
                $dateFilter = "AND expense_date >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01') 
                              AND expense_date < DATE_FORMAT(NOW(), '%Y-%m-01')";
            } elseif ($data['date_range'] === 'this_year') {
                $dateFilter = "AND YEAR(expense_date) = YEAR(NOW())";
            } elseif ($data['date_range'] === 'last_year') {
                $dateFilter = "AND YEAR(expense_date) = YEAR(NOW()) - 1";
            }
        }
        
        // Filter by category if provided
        if (isset($data['category'])) {
            $dateFilter .= " AND category = ?";
            $params[] = $data['category'];
        }
        
        if ($metric === 'overview' || $metric === 'summary') {
            $stmt = $pdo->prepare("
                SELECT 
                    COUNT(*) as total_expenses,
                    SUM(amount) as total_amount,
                    AVG(amount) as avg_expense,
                    MIN(amount) as min_expense,
                    MAX(amount) as max_expense,
                    COUNT(DISTINCT category) as unique_categories
                FROM expenses
                WHERE company_id = ? $dateFilter
            ");
            $stmt->execute($params);
            $overview = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return formatSuccessResponse(
                "💸 **Expense Overview**",
                [
                    'overview' => $overview,
                    'date_range' => $data['date_range'] ?? 'all_time',
                    'category' => $data['category'] ?? 'all'
                ]
            );
            
        } elseif ($metric === 'trend' || $metric === 'monthly') {
            $stmt = $pdo->prepare("
                SELECT 
                    DATE_FORMAT(expense_date, '%Y-%m') as month,
                    COUNT(*) as expense_count,
                    SUM(amount) as total_amount,
                    AVG(amount) as avg_expense
                FROM expenses
                WHERE company_id = ? $dateFilter
                GROUP BY DATE_FORMAT(expense_date, '%Y-%m')
                ORDER BY month DESC
                LIMIT 12
            ");
            $stmt->execute($params);
            $trend = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return formatSuccessResponse(
                "📉 **Expense Trend Analysis**",
                [
                    'trend' => $trend,
                    'date_range' => $data['date_range'] ?? 'all_time'
                ]
            );
            
        } elseif ($metric === 'by_category') {
            $stmt = $pdo->prepare("
                SELECT 
                    category,
                    COUNT(*) as expense_count,
                    SUM(amount) as total_amount,
                    AVG(amount) as avg_expense,
                    MIN(amount) as min_expense,
                    MAX(amount) as max_expense
                FROM expenses
                WHERE company_id = ? $dateFilter
                GROUP BY category
                ORDER BY total_amount DESC
            ");
            $stmt->execute($params);
            $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return formatSuccessResponse(
                "📊 **Expenses by Category**",
                [
                    'categories' => $categories,
                    'count' => count($categories),
                    'date_range' => $data['date_range'] ?? 'all_time'
                ]
            );
            
        } elseif ($metric === 'top_expenses') {
            $limit = isset($data['limit']) ? intval($data['limit']) : 10;
            $stmt = $pdo->prepare("
                SELECT reference, description, amount, category, expense_date, payment_method
                FROM expenses
                WHERE company_id = ? $dateFilter
                ORDER BY amount DESC
                LIMIT $limit
            ");
            $stmt->execute($params);
            $expenses = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return formatSuccessResponse(
                "💰 **Top Expenses**",
                [
                    'expenses' => $expenses,
                    'count' => count($expenses),
                    'date_range' => $data['date_range'] ?? 'all_time'
                ]
            );
        }
        
        return formatErrorResponse("Unknown metric: $metric", 'VALIDATION_ERROR');
        
    } catch (Exception $e) {
        error_log("Error getting expense analytics: " . $e->getMessage());
        return formatErrorResponse('Failed to retrieve expense analytics: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}
