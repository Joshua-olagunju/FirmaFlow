<?php
// Export utility functions for financial reports
require_once __DIR__ . '/vendor/autoload.php'; // For libraries like TCPDF, PhpSpreadsheet

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Writer\Csv;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

/**
 * Export financial reports to Excel format
 */
function exportToExcel($data, $reportType, $companyInfo, $dateRange) {
    $spreadsheet = new Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();
    
    // Set company header
    $sheet->setCellValue('A1', $companyInfo['name'] ?? 'Company Name');
    $sheet->setCellValue('A2', ucwords(str_replace('_', ' ', $reportType)) . ' Report');
    $sheet->setCellValue('A3', 'Period: ' . $dateRange['from'] . ' to ' . $dateRange['to']);
    $sheet->setCellValue('A4', 'Generated: ' . date('Y-m-d H:i:s'));
    
    // Style header
    $sheet->getStyle('A1:A4')->getFont()->setBold(true);
    $sheet->getStyle('A1')->getFont()->setSize(16);
    $sheet->getStyle('A2')->getFont()->setSize(14);
    
    $startRow = 6;
    
    switch ($reportType) {
        case 'profit_loss':
            $startRow = exportProfitLossToExcel($sheet, $data, $startRow);
            break;
            
        case 'balance_sheet':
            $startRow = exportBalanceSheetToExcel($sheet, $data, $startRow);
            break;
            
        case 'cash_flow':
            $startRow = exportCashFlowToExcel($sheet, $data, $startRow);
            break;
            
        case 'kpis':
            $startRow = exportKPIsToExcel($sheet, $data, $startRow);
            break;
            
        default:
            $startRow = exportGenericDataToExcel($sheet, $data, $startRow);
    }
    
    // Auto-size columns
    foreach (range('A', 'F') as $col) {
        $sheet->getColumnDimension($col)->setAutoSize(true);
    }
    
    // Create writer and return file content
    $writer = new Xlsx($spreadsheet);
    
    ob_start();
    $writer->save('php://output');
    $content = ob_get_contents();
    ob_end_clean();
    
    return $content;
}

/**
 * Export Profit & Loss statement to Excel
 */
function exportProfitLossToExcel($sheet, $data, $startRow) {
    // Headers
    $headers = ['Account', 'Current Period', 'Previous Period', 'Change', '% Change'];
    $col = 'A';
    foreach ($headers as $header) {
        $sheet->setCellValue($col . $startRow, $header);
        $col++;
    }
    
    // Style headers
    $sheet->getStyle('A' . $startRow . ':E' . $startRow)->getFont()->setBold(true);
    $sheet->getStyle('A' . $startRow . ':E' . $startRow)->getFill()
          ->setFillType(Fill::FILL_SOLID)
          ->getStartColor()->setRGB('E8F4FD');
    
    $row = $startRow + 1;
    
    foreach ($data['statement'] as $item) {
        $sheet->setCellValue('A' . $row, $item['account']);
        $sheet->setCellValue('B' . $row, number_format($item['current'], 2));
        $sheet->setCellValue('C' . $row, number_format($item['previous'], 2));
        $sheet->setCellValue('D' . $row, number_format($item['change'], 2));
        $sheet->setCellValue('E' . $row, $item['percent_change'] . '%');
        
        // Style total rows
        if ($item['is_total']) {
            $sheet->getStyle('A' . $row . ':E' . $row)->getFont()->setBold(true);
            $sheet->getStyle('A' . $row . ':E' . $row)->getFill()
                  ->setFillType(Fill::FILL_SOLID)
                  ->getStartColor()->setRGB('F8F9FA');
        }
        
        // Color code changes
        if ($item['change'] > 0) {
            $sheet->getStyle('D' . $row . ':E' . $row)->getFont()->getColor()->setRGB('28A745');
        } elseif ($item['change'] < 0) {
            $sheet->getStyle('D' . $row . ':E' . $row)->getFont()->getColor()->setRGB('DC3545');
        }
        
        $row++;
    }
    
    // Add borders
    $sheet->getStyle('A' . $startRow . ':E' . ($row - 1))
          ->getBorders()->getAllBorders()
          ->setBorderStyle(Border::BORDER_THIN);
    
    return $row + 2;
}

/**
 * Export Balance Sheet to Excel
 */
function exportBalanceSheetToExcel($sheet, $data, $startRow) {
    // Headers
    $headers = ['Account', 'Current Period', 'Previous Period', 'Change', '% Change'];
    $col = 'A';
    foreach ($headers as $header) {
        $sheet->setCellValue($col . $startRow, $header);
        $col++;
    }
    
    // Style headers
    $sheet->getStyle('A' . $startRow . ':E' . $startRow)->getFont()->setBold(true);
    $sheet->getStyle('A' . $startRow . ':E' . $startRow)->getFill()
          ->setFillType(Fill::FILL_SOLID)
          ->getStartColor()->setRGB('E8F4FD');
    
    $row = $startRow + 1;
    
    foreach ($data['statement'] as $item) {
        $sheet->setCellValue('A' . $row, $item['account']);
        $sheet->setCellValue('B' . $row, number_format($item['current'], 2));
        $sheet->setCellValue('C' . $row, number_format($item['previous'], 2));
        $sheet->setCellValue('D' . $row, number_format($item['change'], 2));
        $sheet->setCellValue('E' . $row, $item['percent_change'] . '%');
        
        // Style total rows
        if ($item['is_total']) {
            $sheet->getStyle('A' . $row . ':E' . $row)->getFont()->setBold(true);
            $sheet->getStyle('A' . $row . ':E' . $row)->getFill()
                  ->setFillType(Fill::FILL_SOLID)
                  ->getStartColor()->setRGB('F8F9FA');
        }
        
        $row++;
    }
    
    // Add borders
    $sheet->getStyle('A' . $startRow . ':E' . ($row - 1))
          ->getBorders()->getAllBorders()
          ->setBorderStyle(Border::BORDER_THIN);
    
    return $row + 2;
}

/**
 * Export Cash Flow statement to Excel
 */
function exportCashFlowToExcel($sheet, $data, $startRow) {
    // Headers
    $headers = ['Activity', 'Current Period', 'Previous Period', 'Change', '% Change'];
    $col = 'A';
    foreach ($headers as $header) {
        $sheet->setCellValue($col . $startRow, $header);
        $col++;
    }
    
    // Style headers
    $sheet->getStyle('A' . $startRow . ':E' . $startRow)->getFont()->setBold(true);
    $sheet->getStyle('A' . $startRow . ':E' . $startRow)->getFill()
          ->setFillType(Fill::FILL_SOLID)
          ->getStartColor()->setRGB('E8F4FD');
    
    $row = $startRow + 1;
    
    foreach ($data['statement'] as $item) {
        $sheet->setCellValue('A' . $row, $item['activity']);
        $sheet->setCellValue('B' . $row, number_format($item['current'], 2));
        $sheet->setCellValue('C' . $row, number_format($item['previous'], 2));
        $sheet->setCellValue('D' . $row, number_format($item['change'], 2));
        $sheet->setCellValue('E' . $row, $item['percent_change'] . '%');
        
        // Style total rows
        if ($item['is_total']) {
            $sheet->getStyle('A' . $row . ':E' . $row)->getFont()->setBold(true);
            $sheet->getStyle('A' . $row . ':E' . $row)->getFill()
                  ->setFillType(Fill::FILL_SOLID)
                  ->getStartColor()->setRGB('F8F9FA');
        }
        
        $row++;
    }
    
    // Add borders
    $sheet->getStyle('A' . $startRow . ':E' . ($row - 1))
          ->getBorders()->getAllBorders()
          ->setBorderStyle(Border::BORDER_THIN);
    
    return $row + 2;
}

/**
 * Export KPIs to Excel
 */
function exportKPIsToExcel($sheet, $data, $startRow) {
    // Headers
    $headers = ['Metric', 'Amount', 'Change %'];
    $col = 'A';
    foreach ($headers as $header) {
        $sheet->setCellValue($col . $startRow, $header);
        $col++;
    }
    
    // Style headers
    $sheet->getStyle('A' . $startRow . ':C' . $startRow)->getFont()->setBold(true);
    $sheet->getStyle('A' . $startRow . ':C' . $startRow)->getFill()
          ->setFillType(Fill::FILL_SOLID)
          ->getStartColor()->setRGB('E8F4FD');
    
    $row = $startRow + 1;
    
    $kpis = [
        ['metric' => 'Total Revenue', 'amount' => $data['revenue'], 'change' => $data['revenueChange']],
        ['metric' => 'Total Expenses', 'amount' => $data['expenses'], 'change' => $data['expensesChange']],
        ['metric' => 'Net Profit', 'amount' => $data['profit'], 'change' => $data['profitChange']],
        ['metric' => 'Cash Flow', 'amount' => $data['cashFlow'], 'change' => $data['cashFlowChange']]
    ];
    
    foreach ($kpis as $kpi) {
        $sheet->setCellValue('A' . $row, $kpi['metric']);
        $sheet->setCellValue('B' . $row, '$' . number_format($kpi['amount'], 2));
        $sheet->setCellValue('C' . $row, number_format($kpi['change'], 1) . '%');
        
        // Color code changes
        if ($kpi['change'] > 0) {
            $sheet->getStyle('C' . $row)->getFont()->getColor()->setRGB('28A745');
        } elseif ($kpi['change'] < 0) {
            $sheet->getStyle('C' . $row)->getFont()->getColor()->setRGB('DC3545');
        }
        
        $row++;
    }
    
    // Add borders
    $sheet->getStyle('A' . $startRow . ':C' . ($row - 1))
          ->getBorders()->getAllBorders()
          ->setBorderStyle(Border::BORDER_THIN);
    
    return $row + 2;
}

/**
 * Export generic data to Excel
 */
function exportGenericDataToExcel($sheet, $data, $startRow) {
    if (empty($data) || !is_array($data)) {
        $sheet->setCellValue('A' . $startRow, 'No data available');
        return $startRow + 1;
    }
    
    // Get headers from first row
    $firstRow = reset($data);
    $headers = is_array($firstRow) ? array_keys($firstRow) : ['Data'];
    
    $col = 'A';
    foreach ($headers as $header) {
        $sheet->setCellValue($col . $startRow, ucwords(str_replace('_', ' ', $header)));
        $col++;
    }
    
    // Style headers
    $lastCol = chr(ord('A') + count($headers) - 1);
    $sheet->getStyle('A' . $startRow . ':' . $lastCol . $startRow)->getFont()->setBold(true);
    $sheet->getStyle('A' . $startRow . ':' . $lastCol . $startRow)->getFill()
          ->setFillType(Fill::FILL_SOLID)
          ->getStartColor()->setRGB('E8F4FD');
    
    $row = $startRow + 1;
    
    foreach ($data as $item) {
        $col = 'A';
        if (is_array($item)) {
            foreach ($item as $value) {
                $sheet->setCellValue($col . $row, $value);
                $col++;
            }
        } else {
            $sheet->setCellValue('A' . $row, $item);
        }
        $row++;
    }
    
    // Add borders
    $sheet->getStyle('A' . $startRow . ':' . $lastCol . ($row - 1))
          ->getBorders()->getAllBorders()
          ->setBorderStyle(Border::BORDER_THIN);
    
    return $row + 2;
}

/**
 * Export to CSV format
 */
function exportToCSV($data, $reportType, $companyInfo, $dateRange) {
    $output = [];
    
    // Add header information
    $output[] = [$companyInfo['name'] ?? 'Company Name'];
    $output[] = [ucwords(str_replace('_', ' ', $reportType)) . ' Report'];
    $output[] = ['Period: ' . $dateRange['from'] . ' to ' . $dateRange['to']];
    $output[] = ['Generated: ' . date('Y-m-d H:i:s')];
    $output[] = []; // Empty row
    
    switch ($reportType) {
        case 'profit_loss':
            $output[] = ['Account', 'Current Period', 'Previous Period', 'Change', '% Change'];
            foreach ($data['statement'] as $item) {
                $output[] = [
                    $item['account'],
                    number_format($item['current'], 2),
                    number_format($item['previous'], 2),
                    number_format($item['change'], 2),
                    $item['percent_change'] . '%'
                ];
            }
            break;
            
        case 'balance_sheet':
            $output[] = ['Account', 'Current Period', 'Previous Period', 'Change', '% Change'];
            foreach ($data['statement'] as $item) {
                $output[] = [
                    $item['account'],
                    number_format($item['current'], 2),
                    number_format($item['previous'], 2),
                    number_format($item['change'], 2),
                    $item['percent_change'] . '%'
                ];
            }
            break;
            
        case 'cash_flow':
            $output[] = ['Activity', 'Current Period', 'Previous Period', 'Change', '% Change'];
            foreach ($data['statement'] as $item) {
                $output[] = [
                    $item['activity'],
                    number_format($item['current'], 2),
                    number_format($item['previous'], 2),
                    number_format($item['change'], 2),
                    $item['percent_change'] . '%'
                ];
            }
            break;
            
        case 'kpis':
            $output[] = ['Metric', 'Amount', 'Change %'];
            $kpis = [
                ['Total Revenue', '$' . number_format($data['revenue'], 2), number_format($data['revenueChange'], 1) . '%'],
                ['Total Expenses', '$' . number_format($data['expenses'], 2), number_format($data['expensesChange'], 1) . '%'],
                ['Net Profit', '$' . number_format($data['profit'], 2), number_format($data['profitChange'], 1) . '%'],
                ['Cash Flow', '$' . number_format($data['cashFlow'], 2), number_format($data['cashFlowChange'], 1) . '%']
            ];
            foreach ($kpis as $kpi) {
                $output[] = $kpi;
            }
            break;
    }
    
    // Convert to CSV string
    $csvContent = '';
    foreach ($output as $row) {
        $csvContent .= implode(',', array_map(function($field) {
            return '"' . str_replace('"', '""', $field) . '"';
        }, $row)) . "\n";
    }
    
    return $csvContent;
}

/**
 * Export to PDF format using TCPDF
 */
function exportToPDF($data, $reportType, $companyInfo, $dateRange) {
    require_once __DIR__ . '/tcpdf/tcpdf.php';
    
    // Create new PDF document
    $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
    
    // Set document information
    $pdf->SetCreator('Firmaflow');
    $pdf->SetAuthor($companyInfo['name'] ?? 'Company');
    $pdf->SetTitle(ucwords(str_replace('_', ' ', $reportType)) . ' Report');
    
    // Set default header data
    $pdf->SetHeaderData('', 0, $companyInfo['name'] ?? 'Company Name', 
                       ucwords(str_replace('_', ' ', $reportType)) . ' Report' . "\n" .
                       'Period: ' . $dateRange['from'] . ' to ' . $dateRange['to']);
    
    // Set header and footer fonts
    $pdf->setHeaderFont(['helvetica', '', 12]);
    $pdf->setFooterFont(['helvetica', '', 8]);
    
    // Set default monospaced font
    $pdf->SetDefaultMonospacedFont(PDF_FONT_MONOSPACED);
    
    // Set margins
    $pdf->SetMargins(PDF_MARGIN_LEFT, PDF_MARGIN_TOP, PDF_MARGIN_RIGHT);
    $pdf->SetHeaderMargin(PDF_MARGIN_HEADER);
    $pdf->SetFooterMargin(PDF_MARGIN_FOOTER);
    
    // Set auto page breaks
    $pdf->SetAutoPageBreak(TRUE, PDF_MARGIN_BOTTOM);
    
    // Add a page
    $pdf->AddPage();
    
    // Set font
    $pdf->SetFont('helvetica', '', 10);
    
    $html = generatePDFContent($data, $reportType);
    
    // Output the HTML content
    $pdf->writeHTML($html, true, false, true, false, '');
    
    // Return PDF content
    return $pdf->Output('', 'S');
}

/**
 * Generate HTML content for PDF
 */
function generatePDFContent($data, $reportType) {
    $html = '<style>
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .total-row { background-color: #f8f9fa; font-weight: bold; }
        .positive { color: #28a745; }
        .negative { color: #dc3545; }
        .text-right { text-align: right; }
    </style>';
    
    switch ($reportType) {
        case 'profit_loss':
            $html .= '<h2>Profit & Loss Statement</h2>';
            $html .= '<table>';
            $html .= '<tr><th>Account</th><th>Current Period</th><th>Previous Period</th><th>Change</th><th>% Change</th></tr>';
            
            foreach ($data['statement'] as $item) {
                $rowClass = $item['is_total'] ? 'total-row' : '';
                $changeClass = $item['change'] >= 0 ? 'positive' : 'negative';
                
                $html .= '<tr class="' . $rowClass . '">';
                $html .= '<td>' . htmlspecialchars($item['account']) . '</td>';
                $html .= '<td class="text-right">$' . number_format($item['current'], 2) . '</td>';
                $html .= '<td class="text-right">$' . number_format($item['previous'], 2) . '</td>';
                $html .= '<td class="text-right ' . $changeClass . '">$' . number_format($item['change'], 2) . '</td>';
                $html .= '<td class="text-right ' . $changeClass . '">' . $item['percent_change'] . '%</td>';
                $html .= '</tr>';
            }
            
            $html .= '</table>';
            break;
            
        case 'balance_sheet':
            $html .= '<h2>Balance Sheet</h2>';
            $html .= '<table>';
            $html .= '<tr><th>Account</th><th>Current Period</th><th>Previous Period</th><th>Change</th><th>% Change</th></tr>';
            
            foreach ($data['statement'] as $item) {
                $rowClass = $item['is_total'] ? 'total-row' : '';
                $changeClass = $item['change'] >= 0 ? 'positive' : 'negative';
                
                $html .= '<tr class="' . $rowClass . '">';
                $html .= '<td>' . htmlspecialchars($item['account']) . '</td>';
                $html .= '<td class="text-right">$' . number_format($item['current'], 2) . '</td>';
                $html .= '<td class="text-right">$' . number_format($item['previous'], 2) . '</td>';
                $html .= '<td class="text-right ' . $changeClass . '">$' . number_format($item['change'], 2) . '</td>';
                $html .= '<td class="text-right ' . $changeClass . '">' . $item['percent_change'] . '%</td>';
                $html .= '</tr>';
            }
            
            $html .= '</table>';
            break;
            
        case 'cash_flow':
            $html .= '<h2>Cash Flow Statement</h2>';
            $html .= '<table>';
            $html .= '<tr><th>Activity</th><th>Current Period</th><th>Previous Period</th><th>Change</th><th>% Change</th></tr>';
            
            foreach ($data['statement'] as $item) {
                $rowClass = $item['is_total'] ? 'total-row' : '';
                $changeClass = $item['change'] >= 0 ? 'positive' : 'negative';
                
                $html .= '<tr class="' . $rowClass . '">';
                $html .= '<td>' . htmlspecialchars($item['activity']) . '</td>';
                $html .= '<td class="text-right">$' . number_format($item['current'], 2) . '</td>';
                $html .= '<td class="text-right">$' . number_format($item['previous'], 2) . '</td>';
                $html .= '<td class="text-right ' . $changeClass . '">$' . number_format($item['change'], 2) . '</td>';
                $html .= '<td class="text-right ' . $changeClass . '">' . $item['percent_change'] . '%</td>';
                $html .= '</tr>';
            }
            
            $html .= '</table>';
            break;
            
        case 'kpis':
            $html .= '<h2>Key Performance Indicators</h2>';
            $html .= '<table>';
            $html .= '<tr><th>Metric</th><th>Amount</th><th>Change %</th></tr>';
            
            $kpis = [
                ['metric' => 'Total Revenue', 'amount' => $data['revenue'], 'change' => $data['revenueChange']],
                ['metric' => 'Total Expenses', 'amount' => $data['expenses'], 'change' => $data['expensesChange']],
                ['metric' => 'Net Profit', 'amount' => $data['profit'], 'change' => $data['profitChange']],
                ['metric' => 'Cash Flow', 'amount' => $data['cashFlow'], 'change' => $data['cashFlowChange']]
            ];
            
            foreach ($kpis as $kpi) {
                $changeClass = $kpi['change'] >= 0 ? 'positive' : 'negative';
                
                $html .= '<tr>';
                $html .= '<td>' . htmlspecialchars($kpi['metric']) . '</td>';
                $html .= '<td class="text-right">$' . number_format($kpi['amount'], 2) . '</td>';
                $html .= '<td class="text-right ' . $changeClass . '">' . number_format($kpi['change'], 1) . '%</td>';
                $html .= '</tr>';
            }
            
            $html .= '</table>';
            break;
    }
    
    return $html;
}

/**
 * Get appropriate MIME type for export format
 */
function getExportMimeType($format) {
    switch ($format) {
        case 'xlsx':
        case 'excel':
            return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        case 'csv':
            return 'text/csv';
        case 'pdf':
            return 'application/pdf';
        default:
            return 'application/octet-stream';
    }
}

/**
 * Get appropriate file extension for export format
 */
function getExportFileExtension($format) {
    switch ($format) {
        case 'xlsx':
        case 'excel':
            return 'xlsx';
        case 'csv':
            return 'csv';
        case 'pdf':
            return 'pdf';
        default:
            return 'txt';
    }
}
?>