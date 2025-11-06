<?php
/**
 * Create Super Admin Users Table
 * This allows creating multiple super admin users with different roles
 */

require_once __DIR__ . '/../includes/db.php';

try {
    echo "Creating super admin users system...\n";

    // Create super_admins table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS super_admins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            role ENUM('superadmin', 'support', 'manager', 'analyst') DEFAULT 'support',
            permissions JSON,
            is_active TINYINT(1) DEFAULT 1,
            last_login TIMESTAMP NULL,
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX(username),
            INDEX(email),
            INDEX(role),
            INDEX(is_active)
        )
    ");
    echo "✓ Created super_admins table\n";

    // Check if there's already a master super admin
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM super_admins WHERE role = 'superadmin'");
    $stmt->execute();
    $count = $stmt->fetchColumn();

    if ($count == 0) {
        echo "Creating master super admin account...\n";
        
        // Create default super admin
        $password = password_hash('admin123', PASSWORD_DEFAULT);
        $permissions = json_encode([
            'create_users' => true,
            'manage_users' => true,
            'delete_users' => true,
            'view_all_data' => true,
            'system_settings' => true,
            'global_messages' => true,
            'full_access' => true
        ]);
        
        $stmt = $pdo->prepare("
            INSERT INTO super_admins (
                username, email, password, first_name, last_name, 
                role, permissions, is_active, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())
        ");
        
        $stmt->execute([
            'superadmin',
            'admin@firmaflow.com',
            $password,
            'Super',
            'Administrator',
            'superadmin',
            $permissions
        ]);
        
        echo "✓ Created master super admin:\n";
        echo "   Username: superadmin\n";
        echo "   Password: admin123\n";
        echo "   Email: admin@firmaflow.com\n";
        echo "   ⚠️  Please change the password after first login!\n";
    } else {
        echo "✓ Master super admin already exists\n";
    }

    echo "\n✅ Super admin users system setup completed!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>