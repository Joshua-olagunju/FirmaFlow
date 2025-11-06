<?php
// Chart Helper Functions for Advanced Reports
// This file contains utility functions for generating chart data and configurations

/**
 * Generate Chart.js configuration for Revenue vs Expenses Line Chart
 */
function getRevenueExpensesChartConfig($data) {
    return [
        'type' => 'line',
        'data' => [
            'labels' => $data['labels'] ?? [],
            'datasets' => [
                [
                    'label' => 'Revenue',
                    'data' => $data['revenue'] ?? [],
                    'borderColor' => '#667eea',
                    'backgroundColor' => 'rgba(102, 126, 234, 0.1)',
                    'tension' => 0.4,
                    'fill' => true,
                    'pointBackgroundColor' => '#667eea',
                    'pointBorderColor' => '#ffffff',
                    'pointBorderWidth' => 2,
                    'pointRadius' => 4,
                    'pointHoverRadius' => 6
                ],
                [
                    'label' => 'Expenses',
                    'data' => $data['expenses'] ?? [],
                    'borderColor' => '#f093fb',
                    'backgroundColor' => 'rgba(240, 147, 251, 0.1)',
                    'tension' => 0.4,
                    'fill' => true,
                    'pointBackgroundColor' => '#f093fb',
                    'pointBorderColor' => '#ffffff',
                    'pointBorderWidth' => 2,
                    'pointRadius' => 4,
                    'pointHoverRadius' => 6
                ]
            ]
        ],
        'options' => [
            'responsive' => true,
            'maintainAspectRatio' => false,
            'interaction' => [
                'intersect' => false,
                'mode' => 'index'
            ],
            'plugins' => [
                'legend' => [
                    'position' => 'top',
                    'labels' => [
                        'usePointStyle' => true,
                        'padding' => 20
                    ]
                ],
                'tooltip' => [
                    'backgroundColor' => 'rgba(255, 255, 255, 0.95)',
                    'titleColor' => '#333',
                    'bodyColor' => '#666',
                    'borderColor' => '#ddd',
                    'borderWidth' => 1,
                    'cornerRadius' => 8,
                    'displayColors' => true,
                    'callbacks' => [
                        'label' => 'function(context) {
                            return context.dataset.label + ": $" + context.parsed.y.toLocaleString();
                        }'
                    ]
                ]
            ],
            'scales' => [
                'x' => [
                    'grid' => [
                        'display' => false
                    ],
                    'ticks' => [
                        'color' => '#666'
                    ]
                ],
                'y' => [
                    'beginAtZero' => true,
                    'grid' => [
                        'color' => 'rgba(0, 0, 0, 0.1)'
                    ],
                    'ticks' => [
                        'color' => '#666',
                        'callback' => 'function(value) {
                            return "$" + value.toLocaleString();
                        }'
                    ]
                ]
            ]
        ]
    ];
}

/**
 * Generate Chart.js configuration for Revenue Sources Doughnut Chart
 */
function getRevenueSourcesChartConfig($data) {
    $colors = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c', 
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
    ];
    
    return [
        'type' => 'doughnut',
        'data' => [
            'labels' => $data['labels'] ?? [],
            'datasets' => [
                [
                    'data' => $data['data'] ?? [],
                    'backgroundColor' => array_slice($colors, 0, count($data['labels'] ?? [])),
                    'borderWidth' => 0,
                    'hoverBorderWidth' => 2,
                    'hoverBorderColor' => '#ffffff'
                ]
            ]
        ],
        'options' => [
            'responsive' => true,
            'maintainAspectRatio' => false,
            'cutout' => '60%',
            'plugins' => [
                'legend' => [
                    'position' => 'bottom',
                    'labels' => [
                        'padding' => 20,
                        'usePointStyle' => true,
                        'font' => [
                            'size' => 12
                        ]
                    ]
                ],
                'tooltip' => [
                    'backgroundColor' => 'rgba(255, 255, 255, 0.95)',
                    'titleColor' => '#333',
                    'bodyColor' => '#666',
                    'borderColor' => '#ddd',
                    'borderWidth' => 1,
                    'cornerRadius' => 8,
                    'callbacks' => [
                        'label' => 'function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed * 100) / total).toFixed(1);
                            return context.label + ": $" + context.parsed.toLocaleString() + " (" + percentage + "%)";
                        }'
                    ]
                ]
            ]
        ]
    ];
}

/**
 * Generate Chart.js configuration for Monthly Performance Bar Chart
 */
function getMonthlyPerformanceChartConfig($data) {
    // Determine colors based on positive/negative values
    $backgroundColors = [];
    $borderColors = [];
    
    foreach ($data['data'] ?? [] as $value) {
        if ($value >= 0) {
            $backgroundColors[] = 'rgba(67, 233, 123, 0.8)';
            $borderColors[] = '#43e97b';
        } else {
            $backgroundColors[] = 'rgba(245, 87, 108, 0.8)';
            $borderColors[] = '#f5576c';
        }
    }
    
    return [
        'type' => 'bar',
        'data' => [
            'labels' => $data['labels'] ?? [],
            'datasets' => [
                [
                    'label' => 'Net Income',
                    'data' => $data['data'] ?? [],
                    'backgroundColor' => $backgroundColors,
                    'borderColor' => $borderColors,
                    'borderWidth' => 1,
                    'borderRadius' => 4,
                    'borderSkipped' => false
                ]
            ]
        ],
        'options' => [
            'responsive' => true,
            'maintainAspectRatio' => false,
            'plugins' => [
                'legend' => [
                    'display' => false
                ],
                'tooltip' => [
                    'backgroundColor' => 'rgba(255, 255, 255, 0.95)',
                    'titleColor' => '#333',
                    'bodyColor' => '#666',
                    'borderColor' => '#ddd',
                    'borderWidth' => 1,
                    'cornerRadius' => 8,
                    'callbacks' => [
                        'label' => 'function(context) {
                            return "Net Income: $" + context.parsed.y.toLocaleString();
                        }'
                    ]
                ]
            ],
            'scales' => [
                'x' => [
                    'grid' => [
                        'display' => false
                    ],
                    'ticks' => [
                        'color' => '#666'
                    ]
                ],
                'y' => [
                    'beginAtZero' => true,
                    'grid' => [
                        'color' => 'rgba(0, 0, 0, 0.1)'
                    ],
                    'ticks' => [
                        'color' => '#666',
                        'callback' => 'function(value) {
                            return "$" + value.toLocaleString();
                        }'
                    ]
                ]
            ]
        ]
    ];
}

/**
 * Generate Chart.js configuration for Profit Margin Chart
 */
function getProfitMarginChartConfig($data) {
    return [
        'type' => 'line',
        'data' => [
            'labels' => $data['labels'] ?? [],
            'datasets' => [
                [
                    'label' => 'Gross Margin %',
                    'data' => $data['gross_margin'] ?? [],
                    'borderColor' => '#4facfe',
                    'backgroundColor' => 'rgba(79, 172, 254, 0.1)',
                    'tension' => 0.4,
                    'fill' => false,
                    'pointBackgroundColor' => '#4facfe',
                    'pointBorderColor' => '#ffffff',
                    'pointBorderWidth' => 2,
                    'pointRadius' => 4
                ],
                [
                    'label' => 'Net Margin %',
                    'data' => $data['net_margin'] ?? [],
                    'borderColor' => '#43e97b',
                    'backgroundColor' => 'rgba(67, 233, 123, 0.1)',
                    'tension' => 0.4,
                    'fill' => false,
                    'pointBackgroundColor' => '#43e97b',
                    'pointBorderColor' => '#ffffff',
                    'pointBorderWidth' => 2,
                    'pointRadius' => 4
                ]
            ]
        ],
        'options' => [
            'responsive' => true,
            'maintainAspectRatio' => false,
            'plugins' => [
                'legend' => [
                    'position' => 'top',
                    'labels' => [
                        'usePointStyle' => true,
                        'padding' => 20
                    ]
                ],
                'tooltip' => [
                    'callbacks' => [
                        'label' => 'function(context) {
                            return context.dataset.label + ": " + context.parsed.y.toFixed(1) + "%";
                        }'
                    ]
                ]
            ],
            'scales' => [
                'y' => [
                    'beginAtZero' => true,
                    'ticks' => [
                        'callback' => 'function(value) {
                            return value + "%";
                        }'
                    ]
                ]
            ]
        ]
    ];
}

/**
 * Generate Chart.js configuration for Cash Flow Chart
 */
function getCashFlowChartConfig($data) {
    return [
        'type' => 'bar',
        'data' => [
            'labels' => $data['labels'] ?? [],
            'datasets' => [
                [
                    'label' => 'Operating Cash Flow',
                    'data' => $data['operating'] ?? [],
                    'backgroundColor' => 'rgba(102, 126, 234, 0.8)',
                    'borderColor' => '#667eea',
                    'borderWidth' => 1
                ],
                [
                    'label' => 'Investing Cash Flow',
                    'data' => $data['investing'] ?? [],
                    'backgroundColor' => 'rgba(240, 147, 251, 0.8)',
                    'borderColor' => '#f093fb',
                    'borderWidth' => 1
                ],
                [
                    'label' => 'Financing Cash Flow',
                    'data' => $data['financing'] ?? [],
                    'backgroundColor' => 'rgba(79, 172, 254, 0.8)',
                    'borderColor' => '#4facfe',
                    'borderWidth' => 1
                ]
            ]
        ],
        'options' => [
            'responsive' => true,
            'maintainAspectRatio' => false,
            'plugins' => [
                'legend' => [
                    'position' => 'top'
                ],
                'tooltip' => [
                    'callbacks' => [
                        'label' => 'function(context) {
                            return context.dataset.label + ": $" + context.parsed.y.toLocaleString();
                        }'
                    ]
                ]
            ],
            'scales' => [
                'y' => [
                    'beginAtZero' => true,
                    'ticks' => [
                        'callback' => 'function(value) {
                            return "$" + value.toLocaleString();
                        }'
                    ]
                ]
            ]
        ]
    ];
}

/**
 * Generate Chart.js configuration for Expense Breakdown Pie Chart
 */
function getExpenseBreakdownChartConfig($data) {
    $colors = [
        '#f093fb', '#f5576c', '#667eea', '#764ba2',
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
    ];
    
    return [
        'type' => 'pie',
        'data' => [
            'labels' => $data['labels'] ?? [],
            'datasets' => [
                [
                    'data' => $data['data'] ?? [],
                    'backgroundColor' => array_slice($colors, 0, count($data['labels'] ?? [])),
                    'borderWidth' => 2,
                    'borderColor' => '#ffffff',
                    'hoverBorderWidth' => 3
                ]
            ]
        ],
        'options' => [
            'responsive' => true,
            'maintainAspectRatio' => false,
            'plugins' => [
                'legend' => [
                    'position' => 'right',
                    'labels' => [
                        'padding' => 20,
                        'usePointStyle' => true
                    ]
                ],
                'tooltip' => [
                    'callbacks' => [
                        'label' => 'function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed * 100) / total).toFixed(1);
                            return context.label + ": $" + context.parsed.toLocaleString() + " (" + percentage + "%)";
                        }'
                    ]
                ]
            ]
        ]
    ];
}

/**
 * Format chart data for time series
 */
function formatTimeSeriesData($rawData, $dateField, $valueField, $from_date, $to_date) {
    $formatted = [];
    $current = new DateTime($from_date);
    $end = new DateTime($to_date);
    
    // Create data map for quick lookup
    $dataMap = [];
    foreach ($rawData as $row) {
        $date = date('Y-m-d', strtotime($row[$dateField]));
        $dataMap[$date] = $row[$valueField];
    }
    
    // Fill in missing dates with zero values
    while ($current <= $end) {
        $dateStr = $current->format('Y-m-d');
        $formatted[] = [
            'date' => $dateStr,
            'value' => $dataMap[$dateStr] ?? 0
        ];
        $current->add(new DateInterval('P1D'));
    }
    
    return $formatted;
}

/**
 * Calculate moving averages for trend analysis
 */
function calculateMovingAverage($data, $periods = 7) {
    $movingAvg = [];
    
    for ($i = 0; $i < count($data); $i++) {
        if ($i < $periods - 1) {
            $movingAvg[] = null;
        } else {
            $sum = 0;
            for ($j = $i - $periods + 1; $j <= $i; $j++) {
                $sum += $data[$j];
            }
            $movingAvg[] = $sum / $periods;
        }
    }
    
    return $movingAvg;
}

/**
 * Generate color palette based on data values
 */
function generateDataColors($data, $positiveColor = '#43e97b', $negativeColor = '#f5576c') {
    $colors = [];
    
    foreach ($data as $value) {
        $colors[] = $value >= 0 ? $positiveColor : $negativeColor;
    }
    
    return $colors;
}

/**
 * Calculate percentage changes for comparison charts
 */
function calculatePercentageChanges($current, $previous) {
    $changes = [];
    
    for ($i = 0; $i < count($current); $i++) {
        $prev = $previous[$i] ?? 0;
        $curr = $current[$i] ?? 0;
        
        if ($prev == 0) {
            $changes[] = $curr > 0 ? 100 : 0;
        } else {
            $changes[] = (($curr - $prev) / abs($prev)) * 100;
        }
    }
    
    return $changes;
}

/**
 * Generate trend indicators (up, down, stable)
 */
function generateTrendIndicators($data, $threshold = 5) {
    $trends = [];
    
    for ($i = 1; $i < count($data); $i++) {
        $change = $data[$i] - $data[$i-1];
        $percentChange = $data[$i-1] != 0 ? ($change / abs($data[$i-1])) * 100 : 0;
        
        if ($percentChange > $threshold) {
            $trends[] = 'up';
        } elseif ($percentChange < -$threshold) {
            $trends[] = 'down';
        } else {
            $trends[] = 'stable';
        }
    }
    
    return $trends;
}

/**
 * Format currency values for chart display
 */
function formatChartCurrency($value, $decimals = 0) {
    if ($value >= 1000000) {
        return '$' . number_format($value / 1000000, 1) . 'M';
    } elseif ($value >= 1000) {
        return '$' . number_format($value / 1000, 1) . 'K';
    } else {
        return '$' . number_format($value, $decimals);
    }
}

/**
 * Generate responsive chart options
 */
function getResponsiveChartOptions($chartType = 'line') {
    $baseOptions = [
        'responsive' => true,
        'maintainAspectRatio' => false,
        'plugins' => [
            'legend' => [
                'position' => 'top',
                'labels' => [
                    'usePointStyle' => true,
                    'padding' => 20,
                    'font' => [
                        'size' => 12
                    ]
                ]
            ],
            'tooltip' => [
                'backgroundColor' => 'rgba(255, 255, 255, 0.95)',
                'titleColor' => '#333',
                'bodyColor' => '#666',
                'borderColor' => '#ddd',
                'borderWidth' => 1,
                'cornerRadius' => 8,
                'displayColors' => true,
                'padding' => 12
            ]
        ]
    ];
    
    // Add specific options based on chart type
    switch ($chartType) {
        case 'line':
            $baseOptions['interaction'] = [
                'intersect' => false,
                'mode' => 'index'
            ];
            break;
            
        case 'bar':
            $baseOptions['plugins']['legend']['display'] = false;
            break;
            
        case 'doughnut':
        case 'pie':
            $baseOptions['cutout'] = $chartType === 'doughnut' ? '60%' : '0%';
            $baseOptions['plugins']['legend']['position'] = 'bottom';
            break;
    }
    
    return $baseOptions;
}

/**
 * Export chart data to CSV format
 */
function exportChartDataToCSV($chartData, $filename = 'chart_data.csv') {
    $output = [];
    $output[] = array_merge(['Period'], array_keys($chartData['datasets'][0]));
    
    for ($i = 0; $i < count($chartData['labels']); $i++) {
        $row = [$chartData['labels'][$i]];
        foreach ($chartData['datasets'] as $dataset) {
            $row[] = $dataset['data'][$i] ?? 0;
        }
        $output[] = $row;
    }
    
    return $output;
}
?>