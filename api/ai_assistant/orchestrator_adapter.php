<?php
/**
 * ORCHESTRATOR ADAPTER
 * 
 * This adapter provides a bridge between the old API entry point (index_v3.php)
 * and the new modular orchestrator.
 * 
 * It maintains backward compatibility while enabling the new JEPA-style architecture.
 * 
 * The adapter implements the same interface as the old Orchestrator class,
 * delegating to the new modular system.
 */

// Load the new modular orchestrator
require_once __DIR__ . '/orchestrator/index.php';

// Keep the old class name for compatibility
use FirmaFlow\AIOrchestrator\Orchestrator as ModularOrchestrator;

/**
 * Orchestrator Adapter Class
 * 
 * This class wraps the new modular orchestrator to maintain
 * compatibility with the existing entry point.
 */
class Orchestrator {
    
    private $modularOrchestrator;
    private $pdo;
    private $companyId;
    private $userId;
    
    public function __construct($pdo, $companyId, $userId, $apiKey, $conversationHistory = []) {
        $this->pdo = $pdo;
        $this->companyId = $companyId;
        $this->userId = $userId;
        
        // Create the new modular orchestrator
        $this->modularOrchestrator = new ModularOrchestrator(
            $pdo, 
            $companyId, 
            $userId, 
            $apiKey, 
            $conversationHistory
        );
    }
    
    /**
     * Process message - delegates to modular orchestrator
     */
    public function processMessage(string $message): array {
        $result = $this->modularOrchestrator->processMessage($message);
        
        // Ensure response format matches expected frontend format
        return $this->normalizeResponse($result);
    }
    
    /**
     * Get debug state - delegates to modular orchestrator
     */
    public function getDebugState(): array {
        return $this->modularOrchestrator->getDebugState();
    }
    
    /**
     * Normalize response to match expected frontend format
     * 
     * Frontend expects:
     * - type: success, error, assistant, confirmation, form, clarification, etc.
     * - message: string
     * - data: optional array
     */
    private function normalizeResponse(array $result): array {
        // Add success field based on type
        if (!isset($result['success'])) {
            $result['success'] = !in_array($result['type'] ?? '', ['error', 'cancelled']);
        }
        
        // Ensure message exists
        if (!isset($result['message'])) {
            $result['message'] = '';
        }
        
        // Handle special response types for frontend
        switch ($result['type'] ?? '') {
            case 'form':
                // Ensure formConfig is present
                if (!isset($result['formConfig'])) {
                    $result['formConfig'] = [];
                }
                break;
                
            case 'confirmation':
                // Ensure actions are present
                if (!isset($result['actions'])) {
                    $result['actions'] = [
                        ['label' => 'Confirm', 'value' => 'yes', 'style' => 'primary'],
                        ['label' => 'Cancel', 'value' => 'no', 'style' => 'secondary']
                    ];
                }
                break;
                
            case 'selection':
                // Ensure items are present
                if (!isset($result['items'])) {
                    $result['items'] = [];
                }
                break;
                
            case 'capability_offer':
                // Ensure capabilities are present
                if (!isset($result['capabilities'])) {
                    $result['capabilities'] = [];
                }
                break;
        }
        
        return $result;
    }
}
