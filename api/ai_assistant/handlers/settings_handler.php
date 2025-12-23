<?php
/**
 * Settings Handler
 * Handles all settings-related intents
 */

function handleSettingsIntent($intent, $data, $state, $pdo, $companyId, $userId) {
    switch ($intent) {
        case 'view_settings':
            return viewSettings($data, $pdo, $companyId);
        
        case 'view_tax_rates':
            return viewTaxRates($data, $pdo, $companyId);
        
        case 'view_tags':
            return viewTags($data, $pdo, $companyId);
        
        case 'update_company_info':
            return provideCompanyInfoGuidance($data);
        
        case 'create_tax':
            return createTaxRate($data, $pdo, $companyId, $userId);
        
        case 'update_tax':
            return updateTaxRate($data, $pdo, $companyId, $userId);
        
        case 'create_tag':
            return createTag($data, $pdo, $companyId, $userId);
        
        case 'update_tag':
            return updateTag($data, $pdo, $companyId, $userId);
        
        case 'create_template':
            return provideTemplateGuidance($data);
        
        case 'update_settings':
            return provideSettingsGuidance($data);
        
        default:
            return formatErrorResponse("Unknown settings intent: $intent");
    }
}

/**
 * View settings
 */
function viewSettings($data, $pdo, $companyId) {
    try {
        $settingType = $data['setting_type'] ?? 'all';
        
        $apiUrl = "http://localhost/FirmaFlow/api/settings.php?type=$settingType";
        
        $ch = curl_init($apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Cookie: ' . session_name() . '=' . session_id()
        ]);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        $settings = json_decode($response, true);
        
        return [
            'success' => true,
            'action' => 'view_settings',
            'result' => $settings,
            'message' => 'Settings retrieved successfully'
        ];
        
    } catch (Exception $e) {
        return formatErrorResponse('Error fetching settings: ' . $e->getMessage());
    }
}

/**
 * Provide guidance for updating company information
 */
function provideCompanyInfoGuidance($data) {
    // Detect what user wants to update
    $requestType = 'general';
    if (isset($data['password']) || stripos(json_encode($data), 'password') !== false) {
        $requestType = 'password';
    } elseif (isset($data['logo']) || stripos(json_encode($data), 'logo') !== false) {
        $requestType = 'logo';
    }
    
    if ($requestType === 'password') {
        $guidance = [
            'title' => 'Change Password',
            'location' => 'Settings → Account Security / Profile Settings',
            'steps' => [
                '1. Click on your profile icon (top right)',
                '2. Select "Account Settings" or "Profile"',
                '3. Look for "Security" or "Change Password" section',
                '4. Enter your current password',
                '5. Enter your new password (min. 8 characters)',
                '6. Confirm your new password',
                '7. Click "Update Password" or "Save Changes"'
            ],
            'security_tips' => [
                '🔐 Use at least 8 characters',
                '🔐 Mix uppercase, lowercase, numbers, and symbols',
                '🔐 Don\'t reuse passwords from other accounts',
                '🔐 Consider using a password manager',
                '🔐 Enable 2FA for extra security'
            ]
        ];
        
        $message = "🔒 **Change Your Password**\n\n";
        $message .= "For security reasons, I can't change your password directly. Here's how to do it:\n\n";
        $message .= "**Quick Steps:**\n";
        $message .= "1️⃣ Click your **profile icon** (top right)\n";
        $message .= "2️⃣ Go to **Account Settings**\n";
        $message .= "3️⃣ Find **Security** or **Change Password**\n";
        $message .= "4️⃣ Enter current and new password\n";
        $message .= "5️⃣ Click **Save Changes**\n\n";
        $message .= "**Security Tips:**\n";
        $message .= "• Use a strong, unique password\n";
        $message .= "• Enable 2FA if available\n";
        $message .= "• Never share your password\n";
        
    } elseif ($requestType === 'logo') {
        $guidance = [
            'title' => 'Update Company Logo',
            'location' => 'Settings → Company Information',
            'steps' => [
                '1. Go to Settings → Company Information',
                '2. Click "Edit" button',
                '3. Find the "Company Logo" section',
                '4. Click "Upload Logo" or "Change Logo"',
                '5. Select your logo file (PNG, JPG, or SVG)',
                '6. Crop/adjust if needed',
                '7. Click "Save"'
            ],
            'logo_requirements' => [
                '📐 Recommended size: 200x80px to 400x160px',
                '📁 Format: PNG (transparent) or JPG',
                '💾 Max file size: Usually 2MB',
                '🎨 High resolution for print quality',
                '⚪ Transparent background preferred'
            ]
        ];
        
        $message = "🖼️ **Update Company Logo**\n\n";
        $message .= "Logo uploads require file selection, so I'll guide you:\n\n";
        $message .= "**Quick Steps:**\n";
        $message .= "1️⃣ Go to **Settings → Company Information**\n";
        $message .= "2️⃣ Click **Edit** button\n";
        $message .= "3️⃣ Find **Company Logo** section\n";
        $message .= "4️⃣ Click **Upload Logo**\n";
        $message .= "5️⃣ Select your logo file\n";
        $message .= "6️⃣ Save changes\n\n";
        $message .= "**Logo Tips:**\n";
        $message .= "• Size: 200x80px to 400x160px\n";
        $message .= "• Format: PNG (transparent) preferred\n";
        $message .= "• Keep file under 2MB\n";
        
    } else {
        $guidance = [
            'title' => 'Update Company Information',
            'location' => 'Settings → Company Information',
            'steps' => [
                '1. Go to Settings → Company Information',
                '2. Click "Edit" button',
                '3. Update any of these fields:',
                '   • Company Name',
                '   • Email Address',
                '   • Phone Number',
                '   • Business Address',
                '   • Tax ID / Registration Number',
                '   • Website URL',
                '   • Bank Details (for invoices)',
                '4. Upload company logo if needed',
                '5. Click "Save Changes"'
            ],
            'what_you_can_update' => [
                '✏️ Company name and contact details',
                '✏️ Business address and registration',
                '✏️ Tax identification numbers',
                '✏️ Banking information for invoices',
                '✏️ Company logo and branding',
                '✏️ Website and social media links'
            ]
        ];
        
        $message = "🏢 **Update Company Information**\n\n";
        $message .= "Company info includes sensitive details that require manual updates. Here's how:\n\n";
        $message .= "**Quick Steps:**\n";
        $message .= "1️⃣ Go to **Settings → Company Information**\n";
        $message .= "2️⃣ Click **Edit** button\n";
        $message .= "3️⃣ Update your details\n";
        $message .= "4️⃣ Upload logo if needed\n";
        $message .= "5️⃣ Click **Save Changes**\n\n";
        
        if (!empty($data['company_name']) || !empty($data['email']) || !empty($data['phone'])) {
            $message .= "**You mentioned wanting to update:**\n";
            if (!empty($data['company_name'])) $message .= "• Company Name\n";
            if (!empty($data['email'])) $message .= "• Email\n";
            if (!empty($data['phone'])) $message .= "• Phone\n";
            if (!empty($data['address'])) $message .= "• Address\n";
            $message .= "\nJust follow the steps above! ✨";
        }
    }
    
    return [
        'success' => true,
        'action' => 'guidance',
        'result' => $guidance,
        'message' => $message,
        'requires_manual_action' => true
    ];
}

/**
 * Create tax rate
 */
function createTaxRate($data, $pdo, $companyId, $userId) {
    try {
        // Validate required fields
        if (empty($data['name']) || !isset($data['rate'])) {
            return formatErrorResponse('Tax name and rate are required');
        }
        
        // Validate rate range (0-100%)
        $rate = floatval($data['rate']);
        if ($rate < 0 || $rate > 100) {
            return formatErrorResponse('Tax rate must be between 0 and 100');
        }
        
        // Use direct database insert instead of internal API call
        // Check if this is the first tax rate for the company
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM tax_rates WHERE company_id = ?");
        $stmt->execute([$companyId]);
        $count = $stmt->fetch()['count'];
        
        // First tax rate automatically becomes default
        $autoDefault = ($count == 0);
        
        // If manually setting as default and not the first one, unset other defaults
        $isDefault = $data['is_default'] ?? false;
        if ($isDefault && !$autoDefault) {
            $stmt = $pdo->prepare("UPDATE tax_rates SET is_default = 0 WHERE company_id = ?");
            $stmt->execute([$companyId]);
        }
        
        $finalIsDefault = $autoDefault || $isDefault;
        
        // Insert new tax rate
        $stmt = $pdo->prepare("
            INSERT INTO tax_rates (company_id, name, rate, description, is_active, is_default) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $companyId, 
            $data['name'], 
            $rate, 
            $data['description'] ?? '', 
            1, // is_active = true
            $finalIsDefault ? 1 : 0
        ]);
        
        $taxId = $pdo->lastInsertId();
        
        return [
            'success' => true,
            'action' => 'create_tax',
            'result' => [
                'tax_id' => $taxId,
                'name' => $data['name'],
                'rate' => $rate . '%'
            ],
            'message' => "✅ Tax rate '{$data['name']}' ({$rate}%) created successfully"
        ];
        
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // Duplicate entry
            return formatErrorResponse('Tax name already exists');
        }
        return formatErrorResponse('Database error: ' . $e->getMessage());
    } catch (Exception $e) {
        return formatErrorResponse('Error creating tax rate: ' . $e->getMessage());
    }
}

/**
 * Update tax rate
 */
function updateTaxRate($data, $pdo, $companyId, $userId) {
    try {
        if (empty($data['tax_id'])) {
            return formatErrorResponse('Tax ID is required');
        }
        
        // Prepare update data
        $updateData = [
            'action' => 'update_tax',
            'id' => $data['tax_id']
        ];
        
        if (isset($data['name'])) {
            $updateData['name'] = $data['name'];
        }
        if (isset($data['rate'])) {
            $rate = floatval($data['rate']);
            if ($rate < 0 || $rate > 100) {
                return formatErrorResponse('Tax rate must be between 0 and 100');
            }
            $updateData['rate'] = $rate;
        }
        if (isset($data['description'])) {
            $updateData['description'] = $data['description'];
        }
        if (isset($data['is_active'])) {
            $updateData['is_active'] = $data['is_active'];
        }
        if (isset($data['is_default'])) {
            $updateData['is_default'] = $data['is_default'];
        }
        
        $apiUrl = "http://localhost/FirmaFlow/api/settings.php";
        
        $ch = curl_init($apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($updateData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Cookie: ' . session_name() . '=' . session_id()
        ]);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return [
            'success' => true,
            'action' => 'update_tax',
            'result' => ['tax_id' => $data['tax_id']],
            'message' => 'Tax rate updated successfully'
        ];
        
    } catch (Exception $e) {
        return formatErrorResponse('Error updating tax rate: ' . $e->getMessage());
    }
}

/**
 * Create tag
 */
function createTag($data, $pdo, $companyId, $userId) {
    try {
        if (empty($data['name'])) {
            return formatErrorResponse('Tag name is required');
        }
        
        $tagData = [
            'action' => 'create_tag',
            'name' => $data['name'],
            'color' => $data['color'] ?? '#3B82F6'
        ];
        
        $apiUrl = "http://localhost/FirmaFlow/api/settings.php";
        
        $ch = curl_init($apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($tagData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Cookie: ' . session_name() . '=' . session_id()
        ]);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        $result = json_decode($response, true);
        
        return [
            'success' => true,
            'action' => 'create_tag',
            'result' => [
                'tag_id' => $result['tag_id'] ?? null,
                'name' => $data['name']
            ],
            'message' => "Tag '{$data['name']}' created successfully"
        ];
        
    } catch (Exception $e) {
        return formatErrorResponse('Error creating tag: ' . $e->getMessage());
    }
}

/**
 * Update tag
 */
function updateTag($data, $pdo, $companyId, $userId) {
    try {
        if (empty($data['tag_id'])) {
            return formatErrorResponse('Tag ID is required');
        }
        
        $updateData = [
            'action' => 'update_tag',
            'id' => $data['tag_id']
        ];
        
        if (isset($data['name'])) {
            $updateData['name'] = $data['name'];
        }
        if (isset($data['color'])) {
            $updateData['color'] = $data['color'];
        }
        
        $apiUrl = "http://localhost/FirmaFlow/api/settings.php";
        
        $ch = curl_init($apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($updateData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Cookie: ' . session_name() . '=' . session_id()
        ]);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return [
            'success' => true,
            'action' => 'update_tag',
            'result' => ['tag_id' => $data['tag_id']],
            'message' => 'Tag updated successfully'
        ];
        
    } catch (Exception $e) {
        return formatErrorResponse('Error updating tag: ' . $e->getMessage());
    }
}

/**
 * Provide guidance for creating templates
 */
function provideTemplateGuidance($data) {
    $templateType = $data['template_type'] ?? 'invoice';
    $templateName = ucfirst($templateType);
    
    // Template-specific guidance
    $templateInfo = [
        'invoice' => [
            'location' => 'Settings → Invoice Templates',
            'description' => 'Create professional invoice templates with your branding',
            'features' => [
                '• Multiple template styles (Modern, Classic, Minimal)',
                '• Custom header and footer sections',
                '• Company logo placement',
                '• Payment terms and bank details',
                '• Tax calculation fields',
                '• Multi-currency support'
            ]
        ],
        'receipt' => [
            'location' => 'Settings → Receipt Templates',
            'description' => 'Design receipt templates for customer payments',
            'features' => [
                '• Compact receipt layouts',
                '• Transaction details section',
                '• Company branding',
                '• Payment method display',
                '• Digital signature area'
            ]
        ],
        'purchase_order' => [
            'location' => 'Settings → Purchase Order Templates',
            'description' => 'Create PO templates for supplier orders',
            'features' => [
                '• Order details table',
                '• Supplier information',
                '• Delivery address section',
                '• Terms and conditions',
                '• Approval workflow fields'
            ]
        ],
        'quotation' => [
            'location' => 'Settings → Quotation Templates',
            'description' => 'Design quotation templates for customer proposals',
            'features' => [
                '• Item pricing tables',
                '• Validity period',
                '• Terms and conditions',
                '• Company credentials',
                '• Acceptance signature area'
            ]
        ]
    ];
    
    $info = $templateInfo[$templateType] ?? $templateInfo['invoice'];
    
    $guidance = [
        'title' => "Create {$templateName} Template",
        'description' => $info['description'],
        'location' => $info['location'],
        'steps' => [
            "1. Navigate to: {$info['location']}",
            '2. Click "+ Create New Template" or "Add Template" button',
            '3. Choose from pre-designed template styles',
            '4. Customize colors to match your brand',
            '5. Upload your company logo (recommended: 200x80px PNG)',
            '6. Configure header and footer content',
            '7. Adjust font styles and sizes',
            '8. Preview your template with sample data',
            '9. Save with a descriptive name (e.g., "Modern Blue Invoice")',
            '10. Set as default template (optional)'
        ],
        'features' => $info['features'],
        'tips' => [
            '💡 Use your brand colors for consistency',
            '💡 Keep templates clean and professional',
            '💡 Test with actual data before finalizing',
            '💡 Create multiple templates for different purposes',
            '💡 Export templates as PDF to share with clients'
        ]
    ];
    
    $message = "📄 **Creating {$templateName} Template**\n\n";
    $message .= "I can guide you through creating your {$templateType} template, but you'll need to use the visual editor for customization.\n\n";
    $message .= "**Quick Steps:**\n\n";
    $message .= "1️⃣ Go to: **{$info['location']}**\n";
    $message .= "2️⃣ Click **'+ Create New Template'**\n";
    $message .= "3️⃣ Choose a template style\n";
    $message .= "4️⃣ Upload your logo\n";
    $message .= "5️⃣ Customize colors and fonts\n";
    $message .= "6️⃣ Preview and save\n\n";
    $message .= "**Why manual?** Templates require:\n";
    $message .= "• Visual design choices (colors, layout)\n";
    $message .= "• Logo and image uploads\n";
    $message .= "• Brand-specific customization\n";
    $message .= "• Live preview to ensure it looks right\n\n";
    $message .= "The visual editor makes it easy - just drag, drop, and customize! 🎨";
    
    return [
        'success' => true,
        'action' => 'guidance',
        'result' => $guidance,
        'message' => $message,
        'requires_manual_action' => true
    ];
}

/**
 * Provide guidance for updating general settings
 */
function provideSettingsGuidance($data) {
    $guidance = [
        'title' => 'Update System Settings',
        'available_settings' => [
            'General Settings' => 'Business hours, fiscal year, date format, currency',
            'Security Settings' => 'Password policies, 2FA, session timeout, login attempts',
            'Email Settings' => 'SMTP configuration, email templates, notifications',
            'Accounting Settings' => 'Chart of accounts, accounting method, financial year',
            'User Management' => 'User roles, permissions, access control',
            'Invoice Settings' => 'Numbering format, payment terms, late fees',
        ],
        'steps' => [
            '1. Go to Settings from the sidebar',
            '2. Choose the specific settings category you want to update',
            '3. Make your changes carefully',
            '4. Review the changes',
            '5. Click "Save" to apply'
        ],
        'note' => 'Settings include sensitive configurations like security policies, email credentials, and accounting rules that require careful manual review.',
        'location' => 'Settings > [Category]'
    ];
    
    $message = "I can't update general settings directly as they include sensitive configurations like security policies, email credentials, and accounting rules. ";
    $message .= "\n\nTo update your settings:\n\n";
    $message .= "📍 Go to: Settings\n";
    $message .= "📂 Choose the category you want (General, Security, Email, Accounting, etc.)\n";
    $message .= "✏️ Make your changes carefully\n";
    $message .= "✅ Review and save\n\n";
    $message .= "⚠️ Important: Some settings affect security and system behavior, so they require manual review.\n\n";
    $message .= "Available settings categories:\n";
    foreach ($guidance['available_settings'] as $category => $description) {
        $message .= "• {$category}: {$description}\n";
    }
    
    return [
        'success' => true,
        'action' => 'guidance',
        'result' => $guidance,
        'message' => $message,
        'requires_manual_action' => true
    ];
}

/**
 * View tax rates
 */
function viewTaxRates($data, $pdo, $companyId) {
    try {
        $query = "SELECT * FROM tax_rates WHERE company_id = ?";
        $params = [$companyId];
        
        // Filter by status if provided
        if (isset($data['status'])) {
            if ($data['status'] === 'active') {
                $query .= " AND is_active = 1";
            } elseif ($data['status'] === 'inactive') {
                $query .= " AND is_active = 0";
            }
        }
        
        $query .= " ORDER BY name ASC";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $taxRates = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($taxRates)) {
            return formatSuccessResponse(
                "You don't have any tax rates set up yet. Would you like to create one?",
                []
            );
        }
        
        return formatSuccessResponse(
            sprintf("📊 Found %d tax rate%s", count($taxRates), count($taxRates) !== 1 ? 's' : ''),
            [
                'tax_rates' => $taxRates,
                'count' => count($taxRates)
            ]
        );
        
    } catch (Exception $e) {
        error_log("Error viewing tax rates: " . $e->getMessage());
        return formatErrorResponse('Failed to retrieve tax rates: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}

/**
 * View tags
 */
function viewTags($data, $pdo, $companyId) {
    try {
        $query = "SELECT t.*, 
                  (SELECT COUNT(*) FROM customer_tags WHERE tag_id = t.id) as customer_count,
                  (SELECT COUNT(*) FROM supplier_tags WHERE tag_id = t.id) as supplier_count,
                  (SELECT COUNT(*) FROM product_tags WHERE tag_id = t.id) as product_count
                  FROM tags t
                  WHERE t.company_id = ?";
        $params = [$companyId];
        
        // Filter by type if provided
        if (isset($data['tag_type'])) {
            $query .= " AND t.tag_type = ?";
            $params[] = $data['tag_type'];
        }
        
        $query .= " ORDER BY t.name ASC";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $tags = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($tags)) {
            return formatSuccessResponse(
                "You don't have any tags set up yet. Would you like to create one?",
                []
            );
        }
        
        return formatSuccessResponse(
            sprintf("🏷️ Found %d tag%s", count($tags), count($tags) !== 1 ? 's' : ''),
            [
                'tags' => $tags,
                'count' => count($tags)
            ]
        );
        
    } catch (Exception $e) {
        error_log("Error viewing tags: " . $e->getMessage());
        return formatErrorResponse('Failed to retrieve tags: ' . $e->getMessage(), 'DATABASE_ERROR');
    }
}
