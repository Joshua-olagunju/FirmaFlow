<?php
// Suppress any output before JSON
ob_start();
error_reporting(E_ALL & ~E_WARNING & ~E_NOTICE);
ini_set('display_errors', 0);

header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db.php';

// Enable CORS if needed
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Only POST method allowed']);
    exit;
}

try {
    // Validate required fields
    $required_fields = ['name', 'email', 'subject', 'message', 'category'];
    $missing_fields = [];
    
    foreach ($required_fields as $field) {
        if (empty($_POST[$field])) {
            $missing_fields[] = $field;
        }
    }
    
    if (!empty($missing_fields)) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields: ' . implode(', ', $missing_fields)]);
        exit;
    }
    
    // Validate email
    if (!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email address']);
        exit;
    }
    
    // Sanitize input
    $name = trim($_POST['name']);
    $email = trim($_POST['email']);
    $phone = trim($_POST['phone'] ?? '');
    $subject = trim($_POST['subject']);
    $message = trim($_POST['message']);
    $category = $_POST['category'];
    $priority = $_POST['priority'] ?? 'medium';
    
    // Validate category and priority
    $valid_categories = ['bug', 'feature_request', 'billing', 'technical', 'general'];
    $valid_priorities = ['low', 'medium', 'high', 'urgent'];
    
    if (!in_array($category, $valid_categories)) {
        echo json_encode(['success' => false, 'message' => 'Invalid category']);
        exit;
    }
    
    if (!in_array($priority, $valid_priorities)) {
        echo json_encode(['success' => false, 'message' => 'Invalid priority']);
        exit;
    }
    
    // Get client info
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    
    // Insert complaint
    $stmt = $pdo->prepare("
        INSERT INTO complaints (name, email, phone, subject, message, category, priority, ip_address, user_agent, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    
    $stmt->execute([
        $name, $email, $phone, $subject, $message, $category, $priority, $ip_address, $user_agent
    ]);
    
    $complaint_id = $pdo->lastInsertId();
    
    // Handle file uploads
    $uploaded_files = [];
    if (!empty($_FILES['attachments']['name'][0])) {
        $upload_dir = '../uploads/complaints/';
        
        // Create upload directory if it doesn't exist
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }
        
        $allowed_types = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/zip',
            'application/x-rar-compressed'
        ];
        
        $max_file_size = 10 * 1024 * 1024; // 10MB
        
        foreach ($_FILES['attachments']['name'] as $index => $filename) {
            if (empty($filename)) continue;
            
            $file_tmp = $_FILES['attachments']['tmp_name'][$index];
            $file_size = $_FILES['attachments']['size'][$index];
            $file_type = $_FILES['attachments']['type'][$index];
            $file_error = $_FILES['attachments']['error'][$index];
            
            // Check for upload errors
            if ($file_error !== UPLOAD_ERR_OK) {
                continue; // Skip this file
            }
            
            // Validate file size
            if ($file_size > $max_file_size) {
                continue; // Skip large files
            }
            
            // Validate file type
            if (!in_array($file_type, $allowed_types)) {
                continue; // Skip invalid types
            }
            
            // Generate unique filename
            $file_extension = pathinfo($filename, PATHINFO_EXTENSION);
            $new_filename = 'complaint_' . $complaint_id . '_' . uniqid() . '.' . $file_extension;
            $file_path = $upload_dir . $new_filename;
            
            // Move uploaded file
            if (move_uploaded_file($file_tmp, $file_path)) {
                // Insert attachment record
                $attachStmt = $pdo->prepare("
                    INSERT INTO complaint_attachments (complaint_id, filename, original_name, file_path, file_size, mime_type) 
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $attachStmt->execute([
                    $complaint_id, $new_filename, $filename, $file_path, $file_size, $file_type
                ]);
                
                $uploaded_files[] = $filename;
            }
        }
    }
    
    // Send notification email to admin (optional)
    $admin_email = 'admin@firmaflow.com'; // Configure this
    $email_subject = "New Complaint Submitted: " . $subject;
    $email_body = "
        A new complaint has been submitted:
        
        Name: $name
        Email: $email
        Phone: $phone
        Category: " . ucfirst(str_replace('_', ' ', $category)) . "
        Priority: " . ucfirst($priority) . "
        Subject: $subject
        
        Message:
        $message
        
        " . (!empty($uploaded_files) ? "Attachments: " . implode(', ', $uploaded_files) : '') . "
        
        Please review this complaint in the SuperAdmin dashboard.
    ";
    
    // Uncomment to send email notification
    // mail($admin_email, $email_subject, $email_body, "From: noreply@firmaflow.com");
    
    // Send auto-reply to customer
    $customer_subject = "Thank you for your feedback - Complaint #$complaint_id";
    $customer_body = "
        Dear $name,
        
        Thank you for contacting us. We have received your complaint and assigned it ID #$complaint_id.
        
        Subject: $subject
        Priority: " . ucfirst($priority) . "
        
        Our team will review your submission and get back to you as soon as possible.
        
        Best regards,
        Firmaflow Support Team
    ";
    
    // Uncomment to send auto-reply
    // mail($email, $customer_subject, $customer_body, "From: support@firmaflow.com");
    
    // Clean output buffer and send JSON
    ob_clean();
    echo json_encode([
        'success' => true,
        'message' => 'Your feedback has been submitted successfully',
        'complaint_id' => $complaint_id,
        'uploaded_files' => count($uploaded_files)
    ]);
    
} catch (Exception $e) {
    error_log("Complaint submission error: " . $e->getMessage());
    ob_clean();
    echo json_encode(['success' => false, 'message' => 'An error occurred while submitting your feedback. Please try again.']);
}
exit;
?>
