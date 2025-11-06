<?php
// Setup Team Chat Tables
require_once '../includes/db.php';

try {
    // Read and execute the chat system SQL
    $sql = file_get_contents('../database/create_chat_system.sql');
    
    // Split the SQL into individual statements
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (!empty($statement)) {
            $pdo->exec($statement);
            echo "Executed: " . substr($statement, 0, 50) . "...\n";
        }
    }
    
    echo "\nTeam chat tables setup completed successfully!\n";
    
} catch (Exception $e) {
    echo "Error setting up team chat tables: " . $e->getMessage() . "\n";
}
?>
