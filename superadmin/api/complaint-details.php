<?php
header('Content-Type: application/json');
require_once '../includes/auth.php';

// Ensure only superadmin can access
requireSuperAdmin();

$pdo = getSuperAdminDB();

if (!isset($_GET['id'])) {
    echo json_encode(['success' => false, 'message' => 'Complaint ID is required']);
    exit;
}

$complaint_id = $_GET['id'];

try {
    // Get complaint details
    $stmt = $pdo->prepare("
        SELECT * FROM complaints 
        WHERE id = ?
    ");
    $stmt->execute([$complaint_id]);
    $complaint = $stmt->fetch();
    
    if (!$complaint) {
        echo json_encode(['success' => false, 'message' => 'Complaint not found']);
        exit;
    }
    
    // Get responses
    $responseStmt = $pdo->prepare("
        SELECT * FROM complaint_responses 
        WHERE complaint_id = ? 
        ORDER BY created_at ASC
    ");
    $responseStmt->execute([$complaint_id]);
    $responses = $responseStmt->fetchAll();
    
    // Get attachments
    $attachmentStmt = $pdo->prepare("
        SELECT * FROM complaint_attachments 
        WHERE complaint_id = ?
    ");
    $attachmentStmt->execute([$complaint_id]);
    $attachments = $attachmentStmt->fetchAll();
    
    // Build HTML for modal
    $html = '<div class="complaint-details">';
    
    // Complaint info
    $html .= '<div class="row mb-4">';
    $html .= '<div class="col-md-6">';
    $html .= '<h6 class="text-muted">Customer Information</h6>';
    $html .= '<p><strong>Name:</strong> ' . htmlspecialchars($complaint['name']) . '</p>';
    $html .= '<p><strong>Email:</strong> ' . htmlspecialchars($complaint['email']) . '</p>';
    if ($complaint['phone']) {
        $html .= '<p><strong>Phone:</strong> ' . htmlspecialchars($complaint['phone']) . '</p>';
    }
    $html .= '</div>';
    
    $html .= '<div class="col-md-6">';
    $html .= '<h6 class="text-muted">Complaint Details</h6>';
    $html .= '<p><strong>Category:</strong> <span class="badge bg-secondary">' . ucfirst(str_replace('_', ' ', $complaint['category'])) . '</span></p>';
    $html .= '<p><strong>Priority:</strong> <span class="badge ' . 
             ($complaint['priority'] === 'urgent' ? 'bg-danger' : 
              ($complaint['priority'] === 'high' ? 'bg-warning' : 
               ($complaint['priority'] === 'medium' ? 'bg-info' : 'bg-secondary'))) . '">' . 
             ucfirst($complaint['priority']) . '</span></p>';
    $html .= '<p><strong>Status:</strong> <span class="badge ' . 
             ($complaint['status'] === 'resolved' ? 'bg-success' : 
              ($complaint['status'] === 'in_progress' ? 'bg-primary' : 
               ($complaint['status'] === 'assigned' ? 'bg-info' : 'bg-warning'))) . '">' . 
             ucfirst(str_replace('_', ' ', $complaint['status'])) . '</span></p>';
    $html .= '<p><strong>Created:</strong> ' . date('M j, Y g:i A', strtotime($complaint['created_at'])) . '</p>';
    if ($complaint['assigned_to']) {
        $html .= '<p><strong>Assigned to:</strong> ' . htmlspecialchars($complaint['assigned_to']) . '</p>';
    }
    $html .= '</div>';
    $html .= '</div>';
    
    // Subject and message
    $html .= '<div class="mb-4">';
    $html .= '<h6 class="text-muted">Subject</h6>';
    $html .= '<p class="fw-medium">' . htmlspecialchars($complaint['subject']) . '</p>';
    $html .= '<h6 class="text-muted mt-3">Message</h6>';
    $html .= '<div class="border rounded p-3 bg-light">' . nl2br(htmlspecialchars($complaint['message'])) . '</div>';
    $html .= '</div>';
    
    // Attachments
    if (!empty($attachments)) {
        $html .= '<div class="mb-4">';
        $html .= '<h6 class="text-muted">Attachments</h6>';
        foreach ($attachments as $attachment) {
            $html .= '<div class="d-flex align-items-center mb-2">';
            $html .= '<i class="ti ti-paperclip me-2"></i>';
            $html .= '<a href="../uploads/complaints/' . htmlspecialchars($attachment['filename']) . '" target="_blank" class="text-decoration-none">';
            $html .= htmlspecialchars($attachment['original_name']);
            $html .= '</a>';
            $html .= '<small class="text-muted ms-2">(' . formatFileSize($attachment['file_size']) . ')</small>';
            $html .= '</div>';
        }
        $html .= '</div>';
    }
    
    // Resolution
    if ($complaint['resolution']) {
        $html .= '<div class="mb-4">';
        $html .= '<h6 class="text-muted">Resolution</h6>';
        $html .= '<div class="border rounded p-3 bg-success bg-opacity-10">' . nl2br(htmlspecialchars($complaint['resolution'])) . '</div>';
        if ($complaint['resolved_at']) {
            $html .= '<small class="text-muted">Resolved on ' . date('M j, Y g:i A', strtotime($complaint['resolved_at'])) . '</small>';
        }
        $html .= '</div>';
    }
    
    // Responses
    if (!empty($responses)) {
        $html .= '<div class="mb-4">';
        $html .= '<h6 class="text-muted">Response History</h6>';
        foreach ($responses as $response) {
            $isInternal = $response['is_internal'];
            $html .= '<div class="border rounded p-3 mb-3 ' . ($isInternal ? 'bg-warning bg-opacity-10' : 'bg-info bg-opacity-10') . '">';
            $html .= '<div class="d-flex justify-content-between align-items-start mb-2">';
            $html .= '<div>';
            $html .= '<strong>' . htmlspecialchars($response['responder_name']) . '</strong>';
            $html .= ' <span class="badge ' . ($response['responder_type'] === 'admin' ? 'bg-primary' : 'bg-secondary') . ' ms-2">' . ucfirst($response['responder_type']) . '</span>';
            if ($isInternal) {
                $html .= ' <span class="badge bg-warning ms-1">Internal</span>';
            }
            $html .= '</div>';
            $html .= '<small class="text-muted">' . date('M j, Y g:i A', strtotime($response['created_at'])) . '</small>';
            $html .= '</div>';
            $html .= '<div>' . nl2br(htmlspecialchars($response['message'])) . '</div>';
            $html .= '</div>';
        }
        $html .= '</div>';
    }
    
    $html .= '</div>';
    
    echo json_encode([
        'success' => true,
        'complaint' => $complaint,
        'responses' => $responses,
        'attachments' => $attachments,
        'html' => $html
    ]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error loading complaint: ' . $e->getMessage()]);
}

function formatFileSize($bytes) {
    if ($bytes >= 1073741824) {
        return number_format($bytes / 1073741824, 2) . ' GB';
    } elseif ($bytes >= 1048576) {
        return number_format($bytes / 1048576, 2) . ' MB';
    } elseif ($bytes >= 1024) {
        return number_format($bytes / 1024, 2) . ' KB';
    } else {
        return $bytes . ' bytes';
    }
}
?>