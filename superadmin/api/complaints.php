<?php
/**
 * SuperAdmin Complaints Management API
 * Handles support tickets, complaints, and customer service operations
 */

require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';

// Security headers
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

// Require superadmin authentication
requireSuperAdmin();

$action = $_GET['action'] ?? $_POST['action'] ?? 'list';

switch ($action) {
    case 'list':
        listComplaints();
        break;
    case 'details':
        getComplaintDetails();
        break;
    case 'create':
        createComplaint();
        break;
    case 'update':
        updateComplaint();
        break;
    case 'assign':
        assignComplaint();
        break;
    case 'update_status':
        updateStatus();
        break;
    case 'add_note':
        addAdminNote();
        break;
    case 'delete':
        deleteComplaint();
        break;
    case 'bulk_action':
        bulkAction();
        break;
    case 'export':
        exportComplaints();
        break;
    case 'stats':
        getComplaintStats();
        break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}

function listComplaints() {
    global $pdo;
    
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = max(1, min(100, intval($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;
    
    $search = trim($_GET['search'] ?? '');
    $status = $_GET['status'] ?? '';
    $priority = $_GET['priority'] ?? '';
    $assignedTo = $_GET['assigned_to'] ?? '';
    $companyId = intval($_GET['company_id'] ?? 0);
    $sortBy = $_GET['sort_by'] ?? 'created_at';
    $sortOrder = strtoupper($_GET['sort_order'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';
    
    $whereConditions = [];
    $params = [];
    
    if (!empty($search)) {
        $whereConditions[] = "(comp.subject LIKE ? OR comp.message LIKE ? OR c.name LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }
    
    if (!empty($status)) {
        $whereConditions[] = "comp.status = ?";
        $params[] = $status;
    }
    
    if (!empty($priority)) {
        $whereConditions[] = "comp.priority = ?";
        $params[] = $priority;
    }
    
    if (!empty($assignedTo)) {
        $whereConditions[] = "comp.assigned_to = ?";
        $params[] = $assignedTo;
    }
    
    if ($companyId > 0) {
        $whereConditions[] = "comp.company_id = ?";
        $params[] = $companyId;
    }
    
    $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
    
    try {
        // Get total count
        $countSql = "
            SELECT COUNT(*) 
            FROM complaints comp
            LEFT JOIN companies c ON comp.company_id = c.id
            $whereClause
        ";
        $countStmt = $pdo->prepare($countSql);
        $countStmt->execute($params);
        $totalCount = $countStmt->fetchColumn();
        
        // Get complaints
        $sql = "
            SELECT 
                comp.*,
                c.name as company_name,
                c.email as company_email,
                u.username as user_username,
                u.email as user_email,
                TIMESTAMPDIFF(HOUR, comp.created_at, NOW()) as hours_ago
            FROM complaints comp
            LEFT JOIN companies c ON comp.company_id = c.id
            LEFT JOIN users u ON comp.user_id = u.id
            $whereClause
            ORDER BY comp.$sortBy $sortOrder
            LIMIT $limit OFFSET $offset
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $complaints = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format the data
        foreach ($complaints as &$complaint) {
            $complaint['id'] = (int)$complaint['id'];
            $complaint['company_id'] = (int)$complaint['company_id'];
            $complaint['user_id'] = (int)$complaint['user_id'];
            $complaint['hours_ago'] = (int)$complaint['hours_ago'];
            $complaint['is_overdue'] = $complaint['status'] === 'open' && $complaint['hours_ago'] > 24;
            $complaint['is_urgent'] = $complaint['priority'] === 'urgent';
        }
        
        echo json_encode([
            'success' => true,
            'complaints' => $complaints,
            'pagination' => [
                'current_page' => $page,
                'total_pages' => ceil($totalCount / $limit),
                'total_count' => (int)$totalCount,
                'per_page' => $limit
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("List complaints error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to fetch complaints']);
    }
}

function getComplaintDetails() {
    global $pdo;
    
    $complaintId = intval($_GET['id'] ?? 0);
    
    if (!$complaintId) {
        echo json_encode(['success' => false, 'message' => 'Complaint ID is required']);
        return;
    }
    
    try {
        // Get complaint details
        $stmt = $pdo->prepare("
            SELECT 
                comp.*,
                c.name as company_name,
                c.email as company_email,
                c.phone as company_phone,
                u.username as user_username,
                u.email as user_email,
                u.first_name as user_first_name,
                u.last_name as user_last_name
            FROM complaints comp
            LEFT JOIN companies c ON comp.company_id = c.id
            LEFT JOIN users u ON comp.user_id = u.id
            WHERE comp.id = ?
        ");
        $stmt->execute([$complaintId]);
        $complaint = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$complaint) {
            echo json_encode(['success' => false, 'message' => 'Complaint not found']);
            return;
        }
        
        // Get related tickets for this company
        $stmt = $pdo->prepare("
            SELECT id, subject, status, priority, created_at
            FROM complaints 
            WHERE company_id = ? AND id != ?
            ORDER BY created_at DESC
            LIMIT 5
        ");
        $stmt->execute([$complaint['company_id'], $complaintId]);
        $relatedComplaints = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get audit trail from superadmin logs
        $stmt = $pdo->prepare("
            SELECT username, action, details, created_at
            FROM superadmin_logs 
            WHERE target_type = 'complaint' AND target_id = ?
            ORDER BY created_at DESC
        ");
        $stmt->execute([$complaintId]);
        $auditTrail = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'complaint' => $complaint,
            'related_complaints' => $relatedComplaints,
            'audit_trail' => $auditTrail
        ]);
        
    } catch (Exception $e) {
        error_log("Get complaint details error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to fetch complaint details']);
    }
}

function createComplaint() {
    global $pdo;
    
    $companyId = intval($_POST['company_id'] ?? 0);
    $userId = intval($_POST['user_id'] ?? 0);
    $subject = trim($_POST['subject'] ?? '');
    $message = trim($_POST['message'] ?? '');
    $priority = $_POST['priority'] ?? 'medium';
    $assignedTo = trim($_POST['assigned_to'] ?? '');
    
    if (!$companyId || empty($subject) || empty($message)) {
        echo json_encode(['success' => false, 'message' => 'Company ID, subject, and message are required']);
        return;
    }
    
    if (!in_array($priority, ['low', 'medium', 'high', 'urgent'])) {
        $priority = 'medium';
    }
    
    try {
        // Verify company exists
        $stmt = $pdo->prepare("SELECT name FROM companies WHERE id = ?");
        $stmt->execute([$companyId]);
        $companyName = $stmt->fetchColumn();
        
        if (!$companyName) {
            echo json_encode(['success' => false, 'message' => 'Company not found']);
            return;
        }
        
        // Create complaint
        $stmt = $pdo->prepare("
            INSERT INTO complaints (
                company_id, user_id, subject, message, priority, status, assigned_to, created_at
            ) VALUES (?, ?, ?, ?, ?, 'open', ?, NOW())
        ");
        
        $stmt->execute([$companyId, $userId ?: null, $subject, $message, $priority, $assignedTo ?: null]);
        $complaintId = $pdo->lastInsertId();
        
        // Log action
        $user = getSuperAdminUser();
        logSuperAdminAction($user['username'], 'COMPLAINT_CREATED', "Created complaint for $companyName: $subject", 'complaint', $complaintId);
        
        echo json_encode([
            'success' => true,
            'message' => 'Complaint created successfully',
            'complaint_id' => $complaintId
        ]);
        
    } catch (Exception $e) {
        error_log("Create complaint error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to create complaint']);
    }
}

function updateComplaint() {
    global $pdo;
    
    $complaintId = intval($_POST['id'] ?? 0);
    $subject = trim($_POST['subject'] ?? '');
    $message = trim($_POST['message'] ?? '');
    $priority = $_POST['priority'] ?? '';
    
    if (!$complaintId || empty($subject) || empty($message)) {
        echo json_encode(['success' => false, 'message' => 'Complaint ID, subject, and message are required']);
        return;
    }
    
    if (!in_array($priority, ['low', 'medium', 'high', 'urgent'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid priority level']);
        return;
    }
    
    try {
        // Check if complaint exists
        $stmt = $pdo->prepare("SELECT subject FROM complaints WHERE id = ?");
        $stmt->execute([$complaintId]);
        $currentSubject = $stmt->fetchColumn();
        
        if (!$currentSubject) {
            echo json_encode(['success' => false, 'message' => 'Complaint not found']);
            return;
        }
        
        // Update complaint
        $stmt = $pdo->prepare("
            UPDATE complaints 
            SET subject = ?, message = ?, priority = ?, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$subject, $message, $priority, $complaintId]);
        
        // Log action
        $user = getSuperAdminUser();
        logSuperAdminAction($user['username'], 'COMPLAINT_UPDATED', "Updated complaint: $subject", 'complaint', $complaintId);
        
        echo json_encode([
            'success' => true,
            'message' => 'Complaint updated successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Update complaint error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to update complaint']);
    }
}

function assignComplaint() {
    global $pdo;
    
    $complaintId = intval($_POST['id'] ?? 0);
    $assignedTo = trim($_POST['assigned_to'] ?? '');
    
    if (!$complaintId) {
        echo json_encode(['success' => false, 'message' => 'Complaint ID is required']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("
            UPDATE complaints 
            SET assigned_to = ?, status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$assignedTo ?: null, $complaintId]);
        
        if ($stmt->rowCount() === 0) {
            echo json_encode(['success' => false, 'message' => 'Complaint not found']);
            return;
        }
        
        // Log action
        $user = getSuperAdminUser();
        $action = $assignedTo ? "Assigned complaint to $assignedTo" : "Unassigned complaint";
        logSuperAdminAction($user['username'], 'COMPLAINT_ASSIGNED', $action, 'complaint', $complaintId);
        
        echo json_encode([
            'success' => true,
            'message' => $assignedTo ? 'Complaint assigned successfully' : 'Complaint unassigned successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Assign complaint error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to assign complaint']);
    }
}

function updateStatus() {
    global $pdo;
    
    $complaintId = intval($_POST['id'] ?? 0);
    $status = $_POST['status'] ?? '';
    
    if (!$complaintId || empty($status)) {
        echo json_encode(['success' => false, 'message' => 'Complaint ID and status are required']);
        return;
    }
    
    if (!in_array($status, ['open', 'in_progress', 'resolved', 'closed'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid status']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("
            UPDATE complaints 
            SET status = ?, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$status, $complaintId]);
        
        if ($stmt->rowCount() === 0) {
            echo json_encode(['success' => false, 'message' => 'Complaint not found']);
            return;
        }
        
        // Log action
        $user = getSuperAdminUser();
        logSuperAdminAction($user['username'], 'COMPLAINT_STATUS_UPDATED', "Changed status to: $status", 'complaint', $complaintId);
        
        echo json_encode([
            'success' => true,
            'message' => 'Status updated successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Update status error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to update status']);
    }
}

function addAdminNote() {
    global $pdo;
    
    $complaintId = intval($_POST['id'] ?? 0);
    $note = trim($_POST['note'] ?? '');
    
    if (!$complaintId || empty($note)) {
        echo json_encode(['success' => false, 'message' => 'Complaint ID and note are required']);
        return;
    }
    
    try {
        // Get current admin notes
        $stmt = $pdo->prepare("SELECT admin_notes FROM complaints WHERE id = ?");
        $stmt->execute([$complaintId]);
        $currentNotes = $stmt->fetchColumn();
        
        if ($currentNotes === false) {
            echo json_encode(['success' => false, 'message' => 'Complaint not found']);
            return;
        }
        
        // Add new note with timestamp and user
        $user = getSuperAdminUser();
        $timestamp = date('Y-m-d H:i:s');
        $newNote = "[{$timestamp}] {$user['username']}: $note";
        
        $updatedNotes = $currentNotes ? $currentNotes . "\n\n" . $newNote : $newNote;
        
        $stmt = $pdo->prepare("
            UPDATE complaints 
            SET admin_notes = ?, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$updatedNotes, $complaintId]);
        
        // Log action
        logSuperAdminAction($user['username'], 'COMPLAINT_NOTE_ADDED', "Added admin note", 'complaint', $complaintId);
        
        echo json_encode([
            'success' => true,
            'message' => 'Admin note added successfully',
            'notes' => $updatedNotes
        ]);
        
    } catch (Exception $e) {
        error_log("Add admin note error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to add admin note']);
    }
}

function deleteComplaint() {
    global $pdo;
    
    $complaintId = intval($_POST['id'] ?? 0);
    
    if (!$complaintId) {
        echo json_encode(['success' => false, 'message' => 'Complaint ID is required']);
        return;
    }
    
    try {
        // Get complaint subject for logging
        $stmt = $pdo->prepare("SELECT subject FROM complaints WHERE id = ?");
        $stmt->execute([$complaintId]);
        $subject = $stmt->fetchColumn();
        
        if (!$subject) {
            echo json_encode(['success' => false, 'message' => 'Complaint not found']);
            return;
        }
        
        // Delete complaint
        $stmt = $pdo->prepare("DELETE FROM complaints WHERE id = ?");
        $stmt->execute([$complaintId]);
        
        // Log action
        $user = getSuperAdminUser();
        logSuperAdminAction($user['username'], 'COMPLAINT_DELETED', "Deleted complaint: $subject", 'complaint', $complaintId);
        
        echo json_encode([
            'success' => true,
            'message' => 'Complaint deleted successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Delete complaint error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to delete complaint']);
    }
}

function bulkAction() {
    global $pdo;
    
    $action = $_POST['bulk_action'] ?? '';
    $ids = json_decode($_POST['ids'] ?? '[]', true);
    
    if (empty($action) || empty($ids) || !is_array($ids)) {
        echo json_encode(['success' => false, 'message' => 'Action and complaint IDs are required']);
        return;
    }
    
    $validActions = ['assign', 'update_status', 'delete'];
    if (!in_array($action, $validActions)) {
        echo json_encode(['success' => false, 'message' => 'Invalid bulk action']);
        return;
    }
    
    try {
        $successCount = 0;
        $user = getSuperAdminUser();
        
        foreach ($ids as $id) {
            $complaintId = intval($id);
            if ($complaintId <= 0) continue;
            
            switch ($action) {
                case 'assign':
                    $assignedTo = $_POST['assigned_to'] ?? '';
                    $stmt = $pdo->prepare("UPDATE complaints SET assigned_to = ?, updated_at = NOW() WHERE id = ?");
                    if ($stmt->execute([$assignedTo ?: null, $complaintId])) {
                        $successCount++;
                        logSuperAdminAction($user['username'], 'COMPLAINT_BULK_ASSIGNED', "Bulk assigned to: $assignedTo", 'complaint', $complaintId);
                    }
                    break;
                    
                case 'update_status':
                    $status = $_POST['status'] ?? '';
                    if (in_array($status, ['open', 'in_progress', 'resolved', 'closed'])) {
                        $stmt = $pdo->prepare("UPDATE complaints SET status = ?, updated_at = NOW() WHERE id = ?");
                        if ($stmt->execute([$status, $complaintId])) {
                            $successCount++;
                            logSuperAdminAction($user['username'], 'COMPLAINT_BULK_STATUS', "Bulk status changed to: $status", 'complaint', $complaintId);
                        }
                    }
                    break;
                    
                case 'delete':
                    $stmt = $pdo->prepare("DELETE FROM complaints WHERE id = ?");
                    if ($stmt->execute([$complaintId])) {
                        $successCount++;
                        logSuperAdminAction($user['username'], 'COMPLAINT_BULK_DELETED', "Bulk deleted complaint", 'complaint', $complaintId);
                    }
                    break;
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => "Bulk action completed successfully on $successCount complaints"
        ]);
        
    } catch (Exception $e) {
        error_log("Bulk action error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to perform bulk action']);
    }
}

function exportComplaints() {
    global $pdo;
    
    $format = $_GET['format'] ?? 'csv';
    $status = $_GET['status'] ?? '';
    
    try {
        $whereClause = $status ? "WHERE comp.status = ?" : "";
        $params = $status ? [$status] : [];
        
        $stmt = $pdo->prepare("
            SELECT 
                comp.id,
                comp.subject,
                comp.message,
                comp.priority,
                comp.status,
                comp.assigned_to,
                comp.created_at,
                comp.updated_at,
                c.name as company_name,
                c.email as company_email,
                u.username as user_username
            FROM complaints comp
            LEFT JOIN companies c ON comp.company_id = c.id
            LEFT JOIN users u ON comp.user_id = u.id
            $whereClause
            ORDER BY comp.created_at DESC
        ");
        $stmt->execute($params);
        $complaints = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if ($format === 'json') {
            header('Content-Type: application/json');
            header('Content-Disposition: attachment; filename="complaints_' . date('Y-m-d') . '.json"');
            echo json_encode(['complaints' => $complaints]);
        } else {
            // CSV format
            header('Content-Type: text/csv');
            header('Content-Disposition: attachment; filename="complaints_' . date('Y-m-d') . '.csv"');
            
            $output = fopen('php://output', 'w');
            
            // CSV headers
            fputcsv($output, [
                'ID', 'Subject', 'Message', 'Priority', 'Status', 'Assigned To',
                'Company Name', 'Company Email', 'User', 'Created At', 'Updated At'
            ]);
            
            // CSV data
            foreach ($complaints as $complaint) {
                fputcsv($output, [
                    $complaint['id'],
                    $complaint['subject'],
                    $complaint['message'],
                    $complaint['priority'],
                    $complaint['status'],
                    $complaint['assigned_to'],
                    $complaint['company_name'],
                    $complaint['company_email'],
                    $complaint['user_username'],
                    $complaint['created_at'],
                    $complaint['updated_at']
                ]);
            }
            
            fclose($output);
        }
        
        $user = getSuperAdminUser();
        logSuperAdminAction($user['username'], 'COMPLAINTS_EXPORTED', "Exported complaints in $format format");
        
    } catch (Exception $e) {
        error_log("Export complaints error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to export complaints']);
    }
}

function getComplaintStats() {
    global $pdo;
    
    try {
        // Status breakdown
        $stmt = $pdo->query("
            SELECT status, COUNT(*) as count
            FROM complaints 
            GROUP BY status
        ");
        $statusStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Priority breakdown
        $stmt = $pdo->query("
            SELECT priority, COUNT(*) as count
            FROM complaints 
            GROUP BY priority
        ");
        $priorityStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Resolution time average
        $stmt = $pdo->query("
            SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avg_resolution_hours
            FROM complaints 
            WHERE status IN ('resolved', 'closed')
        ");
        $avgResolutionTime = $stmt->fetchColumn();
        
        // Today's stats
        $stmt = $pdo->query("
            SELECT 
                COUNT(*) as total_today,
                COUNT(CASE WHEN status = 'open' THEN 1 END) as open_today,
                COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_today
            FROM complaints 
            WHERE DATE(created_at) = CURDATE()
        ");
        $todayStats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'stats' => [
                'status_breakdown' => $statusStats,
                'priority_breakdown' => $priorityStats,
                'avg_resolution_hours' => round($avgResolutionTime, 2),
                'today' => $todayStats
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Complaint stats error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to fetch complaint statistics']);
    }
}

function logSuperAdminAction($username, $action, $details, $targetType = null, $targetId = null) {
    global $pdo;
    try {
        $stmt = $pdo->prepare("
            INSERT INTO superadmin_logs (username, action, target_type, target_id, details, ip_address, user_agent) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $username,
            $action,
            $targetType,
            $targetId,
            $details,
            $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ]);
    } catch (Exception $e) {
        error_log("Failed to log superadmin action: " . $e->getMessage());
    }
}
?>