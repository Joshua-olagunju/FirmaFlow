<?php
// Verify Staff Tables Exist
require_once 'includes/db.php';

echo "<h3>Database Connection Test</h3>";
echo "<p><strong>Database:</strong> ledgerly</p>";

try {
    $pdo = getSuperAdminDB();
    
    echo "<h4>Checking Tables:</h4>";
    
    // Check staff_members table
    $stmt = $pdo->query("SHOW TABLES LIKE 'staff_members'");
    if ($stmt->rowCount() > 0) {
        echo "✅ staff_members table EXISTS<br>";
        
        // Count records
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM staff_members");
        $count = $stmt->fetch()['count'];
        echo "&nbsp;&nbsp;&nbsp;📊 Records: {$count}<br>";
        
        // Show sample data
        if ($count > 0) {
            $stmt = $pdo->query("SELECT id, username, full_name, status FROM staff_members LIMIT 3");
            $staff = $stmt->fetchAll();
            echo "&nbsp;&nbsp;&nbsp;📋 Sample data:<br>";
            foreach ($staff as $member) {
                echo "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- ID: {$member['id']}, Username: {$member['username']}, Name: {$member['full_name']}, Status: {$member['status']}<br>";
            }
        }
    } else {
        echo "❌ staff_members table NOT FOUND<br>";
    }
    
    // Check staff_sessions table
    $stmt = $pdo->query("SHOW TABLES LIKE 'staff_sessions'");
    if ($stmt->rowCount() > 0) {
        echo "✅ staff_sessions table EXISTS<br>";
    } else {
        echo "❌ staff_sessions table NOT FOUND<br>";
    }
    
    echo "<h4>All Tables in Database:</h4>";
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    foreach ($tables as $table) {
        echo "📋 {$table}<br>";
    }
    
    echo "<br><h4>Staff Management API Test:</h4>";
    
    // Test the API endpoint
    echo "<a href='api/staff_management.php?action=get_staff' target='_blank'>Test Staff API</a><br>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>";
}
?>

<hr>
<a href="pages/staff.php">Go to Staff Management</a> | 
<a href="index.php">Dashboard</a>