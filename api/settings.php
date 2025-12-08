<?php
// Start session first
session_start();
header('Content-Type: application/json');

// CORS headers
$allowed_origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../includes/db.php';

// Check authentication
if (!isset($_SESSION['company_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized - Please login']);
    exit;
}

$company_id = $_SESSION['company_id'];

try {
    // Handle different HTTP methods
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($method) {
        case 'GET':
            handleGet($pdo, $company_id);
            break;
        case 'POST':
            handlePost($pdo, $company_id, $input);
            break;
        case 'PUT':
            handlePut($pdo, $company_id, $input);
            break;
        case 'DELETE':
            handleDelete($pdo, $company_id, $input);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}

function handleGet($pdo, $company_id) {
    $type = $_GET['type'] ?? 'all';
    
    switch ($type) {
        case 'company':
            getCompanyData($pdo, $company_id);
            break;
        case 'settings':
            getCompanySettings($pdo, $company_id);
            break;
        case 'tags':
            getTags($pdo, $company_id);
            break;
        case 'templates':
            getTemplates($pdo, $company_id);
            break;
        case 'taxes':
            getTaxRates($pdo, $company_id);
            break;
        case 'all':
            getAllSettings($pdo, $company_id);
            break;
        default:
            echo json_encode(['error' => 'Invalid type']);
    }
}

function handlePost($pdo, $company_id, $input) {
    // Check if this is a file upload request
    if (isset($_FILES['company_logo'])) {
        uploadCompanyLogo($pdo, $company_id);
        return;
    }
    
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'save_setting':
            saveSetting($pdo, $company_id, $input);
            break;
        case 'create_tag':
            createTag($pdo, $company_id, $input);
            break;
        case 'save_template':
            saveTemplate($pdo, $company_id, $input);
            break;
        case 'delete_template':
            deleteTemplate($pdo, $company_id, $input);
            break;
        case 'update_company':
            updateCompany($pdo, $company_id, $input);
            break;
        case 'create_tax':
            createTaxRate($pdo, $company_id, $input);
            break;
        default:
            echo json_encode(['error' => 'Invalid action']);
    }
}

function handlePut($pdo, $company_id, $input) {
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'update_tag':
            updateTag($pdo, $company_id, $input);
            break;
        case 'toggle_tag':
            toggleTag($pdo, $company_id, $input);
            break;
        case 'update_tax':
            updateTaxRate($pdo, $company_id, $input);
            break;
        case 'toggle_tax':
            toggleTaxRate($pdo, $company_id, $input);
            break;
        case 'set_default_tax':
            setDefaultTaxRate($pdo, $company_id, $input);
            break;
        default:
            echo json_encode(['error' => 'Invalid action']);
    }
}

function handleDelete($pdo, $company_id, $input) {
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'delete_tag':
            deleteTag($pdo, $company_id, $input);
            break;
        case 'delete_tax':
            deleteTaxRate($pdo, $company_id, $input);
            break;
        default:
            echo json_encode(['error' => 'Invalid action']);
    }
}

function deleteTemplate($pdo, $company_id, $input) {
    $template_id = $input['template_id'] ?? null;
    
    if (!$template_id) {
        echo json_encode(['error' => 'Template ID is required']);
        return;
    }
    
    // Verify template belongs to company
    $checkStmt = $pdo->prepare("
        SELECT id FROM template_settings 
        WHERE id = ? AND company_id = ?
    ");
    $checkStmt->execute([$template_id, $company_id]);
    $template = $checkStmt->fetch();
    
    if (!$template) {
        echo json_encode(['error' => 'Template not found or unauthorized']);
        return;
    }
    
    // Delete template
    $stmt = $pdo->prepare("DELETE FROM template_settings WHERE id = ? AND company_id = ?");
    $stmt->execute([$template_id, $company_id]);
    
    echo json_encode(['success' => true, 'message' => 'Template deleted successfully']);
}

// Company Data Functions
function getCompanyData($pdo, $company_id) {
    $stmt = $pdo->prepare("SELECT * FROM companies WHERE id = ?");
    $stmt->execute([$company_id]);
    $company = $stmt->fetch();
    
    if ($company) {
        echo json_encode(['success' => true, 'data' => $company]);
    } else {
        echo json_encode(['error' => 'Company not found']);
    }
}

function updateCompany($pdo, $company_id, $input) {
    $fields = ['name', 'email', 'phone', 'website', 'tax_number', 'registration_number', 
               'billing_address', 'business_type', 'established_date', 'logo_path',
               'bank_name', 'account_number', 'account_name'];
    
    $updates = [];
    $params = [];
    
    foreach ($fields as $field) {
        if (isset($input[$field])) {
            $updates[] = "$field = ?";
            $params[] = $input[$field];
        }
    }
    
    if (empty($updates)) {
        echo json_encode(['error' => 'No fields to update']);
        return;
    }
    
    $params[] = $company_id;
    $sql = "UPDATE companies SET " . implode(', ', $updates) . " WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    echo json_encode(['success' => true, 'message' => 'Company updated successfully']);
}

// Settings Functions
function getCompanySettings($pdo, $company_id) {
    $stmt = $pdo->prepare("SELECT setting_key, setting_value, setting_type FROM company_settings WHERE company_id = ?");
    $stmt->execute([$company_id]);
    $settings = $stmt->fetchAll();
    
    $result = [];
    foreach ($settings as $setting) {
        $value = $setting['setting_value'];
        
        // Convert based on type
        switch ($setting['setting_type']) {
            case 'number':
                $value = (float)$value;
                break;
            case 'boolean':
                $value = (bool)$value;
                break;
            case 'json':
                $value = json_decode($value, true);
                break;
        }
        
        $result[$setting['setting_key']] = $value;
    }
    
    echo json_encode(['success' => true, 'data' => $result]);
}

function saveSetting($pdo, $company_id, $input) {
    $key = $input['key'] ?? '';
    $value = $input['value'] ?? '';
    $type = $input['type'] ?? 'string';
    
    if (empty($key)) {
        echo json_encode(['error' => 'Setting key is required']);
        return;
    }
    
    // Convert value based on type
    if ($type === 'boolean') {
        // Convert boolean to string for database storage
        $value = $value ? '1' : '0';
    } elseif ($type === 'json') {
        $value = json_encode($value);
    } elseif ($type === 'number' || $type === 'integer') {
        $value = (string)$value;
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, updated_at) 
        VALUES (?, ?, ?, ?, NOW()) 
        ON DUPLICATE KEY UPDATE 
            setting_value = VALUES(setting_value), 
            setting_type = VALUES(setting_type),
            updated_at = NOW()
    ");
    
    $stmt->execute([$company_id, $key, $value, $type]);
    
    echo json_encode(['success' => true, 'message' => 'Setting saved successfully']);
}

// Tags Functions
function getTags($pdo, $company_id) {
    $stmt = $pdo->prepare("SELECT * FROM tags WHERE company_id = ? ORDER BY name");
    $stmt->execute([$company_id]);
    $tags = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'data' => $tags]);
}

function createTag($pdo, $company_id, $input) {
    $name = trim($input['name'] ?? '');
    $color = $input['color'] ?? '#2563eb';
    $description = $input['description'] ?? '';
    
    if (empty($name)) {
        echo json_encode(['error' => 'Tag name is required']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("INSERT INTO tags (company_id, name, color, description) VALUES (?, ?, ?, ?)");
        $stmt->execute([$company_id, $name, $color, $description]);
        
        $tag_id = $pdo->lastInsertId();
        echo json_encode(['success' => true, 'message' => 'Tag created successfully', 'id' => $tag_id]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // Duplicate entry
            echo json_encode(['error' => 'Tag name already exists']);
        } else {
            throw $e;
        }
    }
}

function updateTag($pdo, $company_id, $input) {
    $id = $input['id'] ?? 0;
    $name = trim($input['name'] ?? '');
    $color = $input['color'] ?? '#2563eb';
    $description = $input['description'] ?? '';
    
    if (empty($name)) {
        echo json_encode(['error' => 'Tag name is required']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("UPDATE tags SET name = ?, color = ?, description = ? WHERE id = ? AND company_id = ?");
        $stmt->execute([$name, $color, $description, $id, $company_id]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Tag updated successfully']);
        } else {
            echo json_encode(['error' => 'Tag not found or no changes made']);
        }
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // Duplicate entry
            echo json_encode(['error' => 'Tag name already exists']);
        } else {
            throw $e;
        }
    }
}

function toggleTag($pdo, $company_id, $input) {
    $id = $input['id'] ?? 0;
    $is_active = $input['is_active'] ?? true;
    
    $stmt = $pdo->prepare("UPDATE tags SET is_active = ? WHERE id = ? AND company_id = ?");
    $stmt->execute([$is_active ? 1 : 0, $id, $company_id]);
    
    if ($stmt->rowCount() > 0) {
        $status = $is_active ? 'activated' : 'deactivated';
        echo json_encode(['success' => true, 'message' => "Tag $status successfully"]);
    } else {
        echo json_encode(['error' => 'Tag not found']);
    }
}

function deleteTag($pdo, $company_id, $input) {
    $id = $input['id'] ?? 0;
    
    $stmt = $pdo->prepare("DELETE FROM tags WHERE id = ? AND company_id = ?");
    $stmt->execute([$id, $company_id]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Tag deleted successfully']);
    } else {
        echo json_encode(['error' => 'Tag not found']);
    }
}

// Template Functions
function getTemplates($pdo, $company_id) {
    $stmt = $pdo->prepare("SELECT * FROM template_settings WHERE company_id = ? ORDER BY template_type, template_name");
    $stmt->execute([$company_id]);
    $templates = $stmt->fetchAll();
    
    // Parse JSON data
    foreach ($templates as &$template) {
        $template['template_data'] = json_decode($template['template_data'], true);
    }
    
    echo json_encode(['success' => true, 'data' => $templates]);
}

function saveTemplate($pdo, $company_id, $input) {
    $type = $input['type'] ?? '';
    $name = $input['name'] ?? '';
    $data = $input['data'] ?? [];
    $is_default = $input['is_default'] ?? false;
    
    if (empty($type) || empty($name)) {
        echo json_encode(['error' => 'Template type and name are required']);
        return;
    }
    
    // Check if template already exists
    $checkStmt = $pdo->prepare("
        SELECT id FROM template_settings 
        WHERE company_id = ? AND template_type = ? AND template_name = ?
    ");
    $checkStmt->execute([$company_id, $type, $name]);
    $existingTemplate = $checkStmt->fetch();
    
    // If setting as default, unset other defaults
    if ($is_default) {
        $stmt = $pdo->prepare("UPDATE template_settings SET is_default = 0 WHERE company_id = ? AND template_type = ?");
        $stmt->execute([$company_id, $type]);
    }
    
    if ($existingTemplate) {
        // Update existing template
        $stmt = $pdo->prepare("
            UPDATE template_settings 
            SET template_data = ?, is_default = ? 
            WHERE id = ?
        ");
        $stmt->execute([json_encode($data), $is_default ? 1 : 0, $existingTemplate['id']]);
    } else {
        // Insert new template
        $stmt = $pdo->prepare("
            INSERT INTO template_settings (company_id, template_type, template_name, template_data, is_default) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$company_id, $type, $name, json_encode($data), $is_default ? 1 : 0]);
    }
    
    echo json_encode(['success' => true, 'message' => 'Template saved successfully']);
}

// Get All Settings
function getAllSettings($pdo, $company_id) {
    // Get company data
    $companyStmt = $pdo->prepare("SELECT * FROM companies WHERE id = ?");
    $companyStmt->execute([$company_id]);
    $company = $companyStmt->fetch();
    
    // Get settings
    $settingsStmt = $pdo->prepare("SELECT setting_key, setting_value, setting_type FROM company_settings WHERE company_id = ?");
    $settingsStmt->execute([$company_id]);
    $settingsRaw = $settingsStmt->fetchAll();
    
    $settings = [];
    foreach ($settingsRaw as $setting) {
        $value = $setting['setting_value'];
        switch ($setting['setting_type']) {
            case 'number': $value = (float)$value; break;
            case 'boolean': $value = (bool)$value; break;
            case 'json': $value = json_decode($value, true); break;
        }
        $settings[$setting['setting_key']] = $value;
    }
    
    // Get tags
    $tagsStmt = $pdo->prepare("SELECT * FROM tags WHERE company_id = ? ORDER BY name");
    $tagsStmt->execute([$company_id]);
    $tags = $tagsStmt->fetchAll();
    
    // Get templates
    $templatesStmt = $pdo->prepare("SELECT * FROM template_settings WHERE company_id = ? ORDER BY template_type, template_name");
    $templatesStmt->execute([$company_id]);
    $templates = $templatesStmt->fetchAll();
    
    foreach ($templates as &$template) {
        $template['template_data'] = json_decode($template['template_data'], true);
    }
    
    // Get tax rates
    $taxStmt = $pdo->prepare("SELECT * FROM tax_rates WHERE company_id = ? ORDER BY name");
    $taxStmt->execute([$company_id]);
    $taxes = $taxStmt->fetchAll();
    
    echo json_encode([
        'success' => true, 
        'data' => [
            'company' => $company,
            'settings' => $settings,
            'tags' => $tags,
            'templates' => $templates,
            'taxes' => $taxes
        ]
    ]);
}

// Tax Management Functions
function getTaxRates($pdo, $company_id) {
    $stmt = $pdo->prepare("SELECT * FROM tax_rates WHERE company_id = ? ORDER BY name");
    $stmt->execute([$company_id]);
    $taxes = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'data' => $taxes]);
}

function createTaxRate($pdo, $company_id, $input) {
    $name = trim($input['name'] ?? '');
    $rate = $input['rate'] ?? 0;
    $description = $input['description'] ?? '';
    $is_active = $input['is_active'] ?? true;
    $is_default = $input['is_default'] ?? false;
    
    if (empty($name)) {
        echo json_encode(['error' => 'Tax name is required']);
        return;
    }
    
    if (!is_numeric($rate) || $rate < 0 || $rate > 100) {
        echo json_encode(['error' => 'Tax rate must be a number between 0 and 100']);
        return;
    }
    
    try {
        // Check if this is the first tax rate for the company
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM tax_rates WHERE company_id = ?");
        $stmt->execute([$company_id]);
        $count = $stmt->fetch()['count'];
        
        // First tax rate automatically becomes default, ignore is_default input for subsequent ones
        $auto_default = ($count == 0);
        
        // If manually setting as default and not the first one, unset other defaults
        if ($is_default && !$auto_default) {
            $stmt = $pdo->prepare("UPDATE tax_rates SET is_default = 0 WHERE company_id = ?");
            $stmt->execute([$company_id]);
        }
        
        $final_is_default = $auto_default || $is_default;
        
        $stmt = $pdo->prepare("INSERT INTO tax_rates (company_id, name, rate, description, is_active, is_default) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$company_id, $name, $rate, $description, $is_active ? 1 : 0, $final_is_default ? 1 : 0]);
        
        $tax_id = $pdo->lastInsertId();
        echo json_encode(['success' => true, 'message' => 'Tax rate created successfully', 'id' => $tax_id]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // Duplicate entry
            echo json_encode(['error' => 'Tax name already exists']);
        } else {
            throw $e;
        }
    }
}

function updateTaxRate($pdo, $company_id, $input) {
    $id = $input['id'] ?? 0;
    $name = trim($input['name'] ?? '');
    $rate = $input['rate'] ?? 0;
    $description = $input['description'] ?? '';
    $is_active = $input['is_active'] ?? true;
    $is_default = $input['is_default'] ?? false;
    
    if (empty($name)) {
        echo json_encode(['error' => 'Tax name is required']);
        return;
    }
    
    if (!is_numeric($rate) || $rate < 0 || $rate > 100) {
        echo json_encode(['error' => 'Tax rate must be a number between 0 and 100']);
        return;
    }
    
    try {
        // If setting as default, unset other defaults
        if ($is_default) {
            $stmt = $pdo->prepare("UPDATE tax_rates SET is_default = 0 WHERE company_id = ? AND id != ?");
            $stmt->execute([$company_id, $id]);
        }
        
        $stmt = $pdo->prepare("UPDATE tax_rates SET name = ?, rate = ?, description = ?, is_active = ?, is_default = ? WHERE id = ? AND company_id = ?");
        $stmt->execute([$name, $rate, $description, $is_active ? 1 : 0, $is_default ? 1 : 0, $id, $company_id]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Tax rate updated successfully']);
        } else {
            echo json_encode(['error' => 'Tax rate not found or no changes made']);
        }
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // Duplicate entry
            echo json_encode(['error' => 'Tax name already exists']);
        } else {
            throw $e;
        }
    }
}

function toggleTaxRate($pdo, $company_id, $input) {
    $id = $input['id'] ?? 0;
    $is_active = $input['is_active'] ?? true;
    
    $stmt = $pdo->prepare("UPDATE tax_rates SET is_active = ? WHERE id = ? AND company_id = ?");
    $stmt->execute([$is_active ? 1 : 0, $id, $company_id]);
    
    if ($stmt->rowCount() > 0) {
        $status = $is_active ? 'activated' : 'deactivated';
        echo json_encode(['success' => true, 'message' => "Tax rate $status successfully"]);
    } else {
        echo json_encode(['error' => 'Tax rate not found']);
    }
}

function setDefaultTaxRate($pdo, $company_id, $input) {
    $id = $input['id'] ?? 0;
    
    // First, unset all defaults
    $stmt = $pdo->prepare("UPDATE tax_rates SET is_default = 0 WHERE company_id = ?");
    $stmt->execute([$company_id]);
    
    // Then set the selected one as default
    $stmt = $pdo->prepare("UPDATE tax_rates SET is_default = 1 WHERE id = ? AND company_id = ?");
    $stmt->execute([$id, $company_id]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Default tax rate set successfully']);
    } else {
        echo json_encode(['error' => 'Tax rate not found']);
    }
}

function deleteTaxRate($pdo, $company_id, $input) {
    $id = $input['id'] ?? 0;
    
    // Check if tax rate is being used by this company
    $checkStmt = $pdo->prepare("
        SELECT COUNT(*) as count FROM (
            SELECT id FROM sales_invoices WHERE tax_rate_id = ? AND company_id = ?
            UNION ALL
            SELECT id FROM sales_invoice_lines sil 
            JOIN sales_invoices si ON sil.invoice_id = si.id 
            WHERE sil.tax_rate_id = ? AND si.company_id = ?
            UNION ALL
            SELECT id FROM purchase_bills WHERE tax_rate_id = ? AND company_id = ?
            UNION ALL
            SELECT id FROM purchase_lines pl 
            JOIN purchase_bills pb ON pl.bill_id = pb.id 
            WHERE pl.tax_rate_id = ? AND pb.company_id = ?
            UNION ALL
            SELECT id FROM products WHERE default_tax_rate_id = ? AND company_id = ?
        ) as used_tax
    ");
    $checkStmt->execute([$id, $company_id, $id, $company_id, $id, $company_id, $id, $company_id, $id, $company_id]);
    $usage = $checkStmt->fetch();
    
    if ($usage['count'] > 0) {
        echo json_encode(['error' => 'Cannot delete tax rate that is being used in transactions or products']);
        return;
    }
    
    $stmt = $pdo->prepare("DELETE FROM tax_rates WHERE id = ? AND company_id = ?");
    $stmt->execute([$id, $company_id]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Tax rate deleted successfully']);
    } else {
        echo json_encode(['error' => 'Tax rate not found']);
    }
}

function uploadCompanyLogo($pdo, $company_id) {
    try {
        // Check if file was uploaded
        if (!isset($_FILES['company_logo']) || $_FILES['company_logo']['error'] !== UPLOAD_ERR_OK) {
            echo json_encode(['error' => 'No file uploaded or upload error occurred']);
            return;
        }
        
        $file = $_FILES['company_logo'];
        
        // Validate file type
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        $fileType = $file['type'];
        
        if (!in_array($fileType, $allowedTypes)) {
            echo json_encode(['error' => 'Invalid file type. Only JPG, PNG, and GIF files are allowed.']);
            return;
        }
        
        // Validate file size (max 2MB)
        $maxSize = 2 * 1024 * 1024; // 2MB in bytes
        if ($file['size'] > $maxSize) {
            echo json_encode(['error' => 'File size too large. Maximum size is 2MB.']);
            return;
        }
        
        // Create unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'logo_' . $company_id . '_' . time() . '.' . $extension;
        $uploadDir = __DIR__ . '/../uploads/logos/';
        $uploadPath = $uploadDir . $filename;
        
        // Ensure upload directory exists
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Delete old logo if exists
        $stmt = $pdo->prepare("SELECT logo_path FROM companies WHERE id = ?");
        $stmt->execute([$company_id]);
        $oldLogo = $stmt->fetchColumn();
        
        if ($oldLogo && file_exists(__DIR__ . '/../' . $oldLogo)) {
            unlink(__DIR__ . '/../' . $oldLogo);
        }
        
        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
            $relativePath = 'uploads/logos/' . $filename;
            
            // Save to companies table
            $stmt = $pdo->prepare("UPDATE companies SET logo_path = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$relativePath, $company_id]);
            
            echo json_encode([
                'success' => true, 
                'message' => 'Logo uploaded successfully',
                'logo_path' => $relativePath
            ]);
        } else {
            echo json_encode(['error' => 'Failed to upload file']);
        }
        
    } catch (Exception $e) {
        echo json_encode(['error' => 'Upload failed: ' . $e->getMessage()]);
    }
}
?>
