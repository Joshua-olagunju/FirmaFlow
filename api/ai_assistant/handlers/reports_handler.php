<?php
/**
 * Report Handler
 * Handles all report-related intents
 */

function handleReportsIntent($intent, $data, $state, $pdo, $companyId, $userId) {
    switch ($intent) {
        case 'generate_report':
            return generateReportAction($data, $pdo, $companyId);
            
        case 'report_analysis':
            return reportAnalysisAction($data, $pdo, $companyId);
            
        default:
            return formatErrorResponse('Unknown report intent: ' . $intent);
    }
}

/**
 * Generate financial report
 */
function generateReportAction($data, $pdo, $companyId) {
    $reportType = $data['report_type'] ?? 'daily_summary';
    
    switch ($reportType) {
        case 'daily_summary':
        case 'today':
            return queryDailySummary($pdo, $companyId, $data);
            
        case 'sales_summary':
            return querySalesSummary($pdo, $companyId, $data);
            
        case 'expense_summary':
            return queryExpenseSummary($pdo, $companyId, $data);
            
        default:
            return formatErrorResponse('Report type not supported: ' . $reportType, 'VALIDATION_ERROR');
    }
}

/**
 * Analyze business data
 */
function reportAnalysisAction($data, $pdo, $companyId) {
    try {
        $dateRange = $data['date_range'] ?? 'this month';
        $range = parseDateRange($dateRange);
        
        // Currently only overview analysis is implemented
        // Future: Add specific analysis types (sales, expenses, profitability, customer)
        return businessOverviewAnalysis($pdo, $companyId, $range);
        
    } catch (Exception $e) {
        return formatErrorResponse('Failed to generate analysis: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}

/**
 * Business overview analysis
 */
function businessOverviewAnalysis($pdo, $companyId, $dateRange) {
    // Sales metrics
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(*) as total_invoices,
            COALESCE(SUM(total), 0) as total_revenue,
            COALESCE(AVG(total), 0) as avg_invoice_value,
            COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_invoices
        FROM sales_invoices
        WHERE company_id = ? 
        AND invoice_date >= ? 
        AND invoice_date <= ?
    ");
    $stmt->execute([$companyId, $dateRange['start'], $dateRange['end']]);
    $sales = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Expense metrics
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(*) as total_expenses,
            COALESCE(SUM(amount), 0) as total_spent
        FROM expenses
        WHERE company_id = ? 
        AND expense_date >= ? 
        AND expense_date <= ?
    ");
    $stmt->execute([$companyId, $dateRange['start'], $dateRange['end']]);
    $expenses = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Purchase metrics
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(*) as total_purchases,
            COALESCE(SUM(total), 0) as total_purchases_amount
        FROM purchases
        WHERE company_id = ? 
        AND purchase_date >= ? 
        AND purchase_date <= ?
    ");
    $stmt->execute([$companyId, $dateRange['start'], $dateRange['end']]);
    $purchases = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Calculate profit
    $grossProfit = $sales['total_revenue'] - $expenses['total_spent'] - $purchases['total_purchases_amount'];
    $profitMargin = $sales['total_revenue'] > 0 
        ? ($grossProfit / $sales['total_revenue']) * 100 
        : 0;
    
    // Customer metrics
    $stmt = $pdo->prepare("
        SELECT COUNT(DISTINCT customer_id) as active_customers
        FROM sales_invoices
        WHERE company_id = ? 
        AND invoice_date >= ? 
        AND invoice_date <= ?
    ");
    $stmt->execute([$companyId, $dateRange['start'], $dateRange['end']]);
    $customerMetrics = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Trends (compare with previous period)
    $periodDays = (strtotime($dateRange['end']) - strtotime($dateRange['start'])) / 86400;
    $prevStart = date('Y-m-d', strtotime($dateRange['start'] . " -{$periodDays} days"));
    $prevEnd = date('Y-m-d', strtotime($dateRange['end'] . " -{$periodDays} days"));
    
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(total), 0) as prev_revenue
        FROM sales_invoices
        WHERE company_id = ? 
        AND invoice_date >= ? 
        AND invoice_date <= ?
    ");
    $stmt->execute([$companyId, $prevStart, $prevEnd]);
    $prevPeriod = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $revenueGrowth = $prevPeriod['prev_revenue'] > 0
        ? (($sales['total_revenue'] - $prevPeriod['prev_revenue']) / $prevPeriod['prev_revenue']) * 100
        : 0;
    
    // Build response
    $answer = "📊 **Business Analysis Report**\n";
    $answer .= "📅 Period: {$dateRange['start']} to {$dateRange['end']}\n\n";
    
    $answer .= "💰 **Revenue & Sales:**\n";
    $answer .= "• Total Revenue: " . formatCurrency($sales['total_revenue']) . "\n";
    $answer .= "• Total Invoices: {$sales['total_invoices']}\n";
    $answer .= "• Avg Invoice Value: " . formatCurrency($sales['avg_invoice_value']) . "\n";
    $answer .= "• Paid: {$sales['paid_invoices']} | Pending: {$sales['pending_invoices']}\n";
    $growthIcon = $revenueGrowth >= 0 ? '📈' : '📉';
    $answer .= "• Growth: {$growthIcon} " . number_format($revenueGrowth, 1) . "% vs previous period\n\n";
    
    $answer .= "💸 **Expenses & Costs:**\n";
    $answer .= "• Operating Expenses: " . formatCurrency($expenses['total_spent']) . " ({$expenses['total_expenses']} items)\n";
    $answer .= "• Purchase Costs: " . formatCurrency($purchases['total_purchases_amount']) . " ({$purchases['total_purchases']} orders)\n";
    $answer .= "• Total Costs: " . formatCurrency($expenses['total_spent'] + $purchases['total_purchases_amount']) . "\n\n";
    
    $answer .= "📈 **Profitability:**\n";
    $profitIcon = $grossProfit >= 0 ? '✅' : '❌';
    $answer .= "• Gross Profit: {$profitIcon} " . formatCurrency($grossProfit) . "\n";
    $answer .= "• Profit Margin: " . number_format($profitMargin, 1) . "%\n\n";
    
    $answer .= "👥 **Customer Insights:**\n";
    $answer .= "• Active Customers: {$customerMetrics['active_customers']}\n";
    if ($customerMetrics['active_customers'] > 0) {
        $avgRevenuePerCustomer = $sales['total_revenue'] / $customerMetrics['active_customers'];
        $answer .= "• Avg Revenue per Customer: " . formatCurrency($avgRevenuePerCustomer) . "\n";
    }
    
    // Insights
    $answer .= "\n💡 **Key Insights:**\n";
    if ($profitMargin > 20) {
        $answer .= "✅ Strong profit margin - business is healthy\n";
    } elseif ($profitMargin > 10) {
        $answer .= "⚠️ Moderate profit margin - monitor costs\n";
    } else {
        $answer .= "❌ Low profit margin - review pricing & expenses\n";
    }
    
    if ($revenueGrowth > 10) {
        $answer .= "📈 Strong revenue growth - excellent trend\n";
    } elseif ($revenueGrowth < -10) {
        $answer .= "📉 Revenue declining - action needed\n";
    }
    
    if ($sales['pending_invoices'] > $sales['paid_invoices']) {
        $answer .= "⚠️ High pending invoices - focus on collections\n";
    }
    
    return formatSuccessResponse($answer, [
        'period' => $dateRange,
        'sales' => $sales,
        'expenses' => $expenses,
        'purchases' => $purchases,
        'profit' => [
            'gross_profit' => $grossProfit,
            'profit_margin' => $profitMargin
        ],
        'customers' => $customerMetrics,
        'trends' => [
            'revenue_growth' => $revenueGrowth
        ]
    ]);
}
