<?php
/**
 * Pagination Helper Class
 * Provides pagination functionality for all tables in Firmaflow
 */

class PaginationHelper {
    private $itemsPerPage;
    private $currentPage;
    private $totalItems;
    private $totalPages;
    private $offset;
    
    public function __construct($totalItems, $currentPage = 1, $itemsPerPage = 20) {
        $this->itemsPerPage = max(1, (int)$itemsPerPage);
        $this->totalItems = max(0, (int)$totalItems);
        $this->currentPage = max(1, (int)$currentPage);
        $this->totalPages = ceil($this->totalItems / $this->itemsPerPage);
        
        // Ensure current page doesn't exceed total pages
        if ($this->currentPage > $this->totalPages && $this->totalPages > 0) {
            $this->currentPage = $this->totalPages;
        }
        
        $this->offset = ($this->currentPage - 1) * $this->itemsPerPage;
    }
    
    /**
     * Get SQL LIMIT clause
     */
    public function getLimitClause() {
        return "LIMIT {$this->itemsPerPage} OFFSET {$this->offset}";
    }
    
    /**
     * Get offset for SQL queries
     */
    public function getOffset() {
        return $this->offset;
    }
    
    /**
     * Get limit for SQL queries
     */
    public function getLimit() {
        return $this->itemsPerPage;
    }
    
    /**
     * Get current page
     */
    public function getCurrentPage() {
        return $this->currentPage;
    }
    
    /**
     * Get total pages
     */
    public function getTotalPages() {
        return $this->totalPages;
    }
    
    /**
     * Check if there's a next page
     */
    public function hasNextPage() {
        return $this->currentPage < $this->totalPages;
    }
    
    /**
     * Check if there's a previous page
     */
    public function hasPreviousPage() {
        return $this->currentPage > 1;
    }
    
    /**
     * Get pagination info array
     */
    public function getPaginationInfo() {
        $startItem = $this->totalItems > 0 ? $this->offset + 1 : 0;
        $endItem = min($this->offset + $this->itemsPerPage, $this->totalItems);
        
        return [
            'currentPage' => $this->currentPage,
            'totalPages' => $this->totalPages,
            'totalItems' => $this->totalItems,
            'itemsPerPage' => $this->itemsPerPage,
            'startItem' => $startItem,
            'endItem' => $endItem,
            'hasNext' => $this->hasNextPage(),
            'hasPrevious' => $this->hasPreviousPage(),
            'offset' => $this->offset,
            'limit' => $this->itemsPerPage
        ];
    }
    
    /**
     * Generate HTML pagination controls
     */
    public function generatePaginationHTML($baseUrl = '', $additionalParams = []) {
        if ($this->totalPages <= 1) {
            return '';
        }
        
        $html = '<nav aria-label="Page navigation" class="mt-4">';
        $html .= '<div class="d-flex justify-content-between align-items-center">';
        
        // Items info
        $startItem = $this->totalItems > 0 ? $this->offset + 1 : 0;
        $endItem = min($this->offset + $this->itemsPerPage, $this->totalItems);
        $html .= '<div class="pagination-info">';
        $html .= '<span class="text-muted">Showing ' . $startItem . ' to ' . $endItem . ' of ' . $this->totalItems . ' entries</span>';
        $html .= '</div>';
        
        // Pagination controls
        $html .= '<ul class="pagination pagination-sm mb-0">';
        
        // Previous button
        if ($this->hasPreviousPage()) {
            $prevUrl = $this->buildUrl($baseUrl, $this->currentPage - 1, $additionalParams);
            $html .= '<li class="page-item">';
            $html .= '<a class="page-link" href="' . $prevUrl . '" data-page="' . ($this->currentPage - 1) . '">Previous</a>';
            $html .= '</li>';
        } else {
            $html .= '<li class="page-item disabled">';
            $html .= '<span class="page-link">Previous</span>';
            $html .= '</li>';
        }
        
        // Page numbers
        $start = max(1, $this->currentPage - 2);
        $end = min($this->totalPages, $this->currentPage + 2);
        
        // First page
        if ($start > 1) {
            $firstUrl = $this->buildUrl($baseUrl, 1, $additionalParams);
            $html .= '<li class="page-item">';
            $html .= '<a class="page-link" href="' . $firstUrl . '" data-page="1">1</a>';
            $html .= '</li>';
            if ($start > 2) {
                $html .= '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }
        
        // Page range
        for ($i = $start; $i <= $end; $i++) {
            if ($i == $this->currentPage) {
                $html .= '<li class="page-item active">';
                $html .= '<span class="page-link">' . $i . '</span>';
                $html .= '</li>';
            } else {
                $pageUrl = $this->buildUrl($baseUrl, $i, $additionalParams);
                $html .= '<li class="page-item">';
                $html .= '<a class="page-link" href="' . $pageUrl . '" data-page="' . $i . '">' . $i . '</a>';
                $html .= '</li>';
            }
        }
        
        // Last page
        if ($end < $this->totalPages) {
            if ($end < $this->totalPages - 1) {
                $html .= '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
            $lastUrl = $this->buildUrl($baseUrl, $this->totalPages, $additionalParams);
            $html .= '<li class="page-item">';
            $html .= '<a class="page-link" href="' . $lastUrl . '" data-page="' . $this->totalPages . '">' . $this->totalPages . '</a>';
            $html .= '</li>';
        }
        
        // Next button
        if ($this->hasNextPage()) {
            $nextUrl = $this->buildUrl($baseUrl, $this->currentPage + 1, $additionalParams);
            $html .= '<li class="page-item">';
            $html .= '<a class="page-link" href="' . $nextUrl . '" data-page="' . ($this->currentPage + 1) . '">Next</a>';
            $html .= '</li>';
        } else {
            $html .= '<li class="page-item disabled">';
            $html .= '<span class="page-link">Next</span>';
            $html .= '</li>';
        }
        
        $html .= '</ul>';
        $html .= '</div>';
        $html .= '</nav>';
        
        return $html;
    }
    
    /**
     * Build URL for pagination links
     */
    private function buildUrl($baseUrl, $page, $additionalParams = []) {
        $params = array_merge($additionalParams, ['page' => $page]);
        
        if (empty($baseUrl)) {
            $baseUrl = $_SERVER['PHP_SELF'];
        }
        
        $queryString = http_build_query($params);
        return $baseUrl . ($queryString ? '?' . $queryString : '');
    }
    
    /**
     * Generate pagination for AJAX requests (returns array)
     */
    public function getAjaxPaginationData($baseUrl = '', $additionalParams = []) {
        return [
            'pagination' => $this->getPaginationInfo(),
            'html' => $this->generatePaginationHTML($baseUrl, $additionalParams)
        ];
    }
}

/**
 * Helper function to create pagination quickly
 */
function createPagination($totalItems, $currentPage = 1, $itemsPerPage = 20) {
    return new PaginationHelper($totalItems, $currentPage, $itemsPerPage);
}

/**
 * Get page parameter from request
 */
function getCurrentPageFromRequest() {
    return isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
}

/**
 * Get items per page from request (with validation)  
 */
function getItemsPerPageFromRequest($default = 20, $max = 100) {
    $itemsPerPage = isset($_GET['per_page']) ? (int)$_GET['per_page'] : $default;
    return max(1, min($itemsPerPage, $max));
}
?>