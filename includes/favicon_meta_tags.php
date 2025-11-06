<?php
/**
 * FAVICON AND META TAGS INCLUDE
 * Include this file in the <head> section of all your pages
 * Usage: <?php include 'path/to/favicon_meta_tags.php'; ?>
 */

// Determine the correct path to assets based on current file location
$currentDir = dirname($_SERVER['SCRIPT_NAME']);
$assetPath = '';

// Calculate relative path to assets folder
if (strpos($currentDir, '/public') !== false) {
    $assetPath = '../assets/firmaflow-logo.jpg';
} elseif (strpos($currentDir, '/superadmin') !== false) {
    $assetPath = '../assets/firmaflow-logo.jpg';
} elseif (strpos($currentDir, '/api') !== false) {
    $assetPath = '../../assets/firmaflow-logo.jpg';
} else {
    $assetPath = 'assets/firmaflow-logo.jpg';
}
?>

<!-- Favicon and App Icons -->
<link rel="icon" type="image/x-icon" href="<?php echo $assetPath; ?>">
<link rel="shortcut icon" type="image/x-icon" href="<?php echo $assetPath; ?>">
<link rel="apple-touch-icon" sizes="180x180" href="<?php echo $assetPath; ?>">
<link rel="icon" type="image/png" sizes="32x32" href="<?php echo $assetPath; ?>">
<link rel="icon" type="image/png" sizes="16x16" href="<?php echo $assetPath; ?>">

<!-- Meta Tags for Social Media and SEO -->
<meta name="theme-color" content="#667eea">
<meta name="msapplication-TileColor" content="#667eea">
<meta name="msapplication-TileImage" content="<?php echo $assetPath; ?>">
<meta property="og:type" content="website">
<meta property="og:image" content="<?php echo $assetPath; ?>">
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:image" content="<?php echo $assetPath; ?>">