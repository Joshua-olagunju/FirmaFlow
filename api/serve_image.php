<?php
/**
 * Image Serving Endpoint with CORS Support
 * This endpoint serves images from the uploads folder with proper CORS headers
 * to allow PDF generation in the frontend
 */

// Set CORS headers first - before any output
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get the requested image path
$path = $_GET['path'] ?? '';

if (empty($path)) {
    http_response_code(400);
    echo json_encode(['error' => 'No path specified']);
    exit;
}

// Security: Only allow uploads directory
$allowedPaths = ['uploads/logos/', 'uploads/'];
$isAllowed = false;

foreach ($allowedPaths as $allowedPath) {
    if (strpos($path, $allowedPath) === 0) {
        $isAllowed = true;
        break;
    }
}

if (!$isAllowed) {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied']);
    exit;
}

// Prevent directory traversal
$path = str_replace(['../', '..\\'], '', $path);

$fullPath = __DIR__ . '/../' . $path;

if (!file_exists($fullPath)) {
    http_response_code(404);
    echo json_encode(['error' => 'File not found']);
    exit;
}

// Get mime type
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $fullPath);
finfo_close($finfo);

// Only allow image types
$allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

if (!in_array($mimeType, $allowedMimes)) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid file type']);
    exit;
}

// Send proper headers
header('Content-Type: ' . $mimeType);
header('Content-Length: ' . filesize($fullPath));
header('Cache-Control: public, max-age=86400'); // Cache for 1 day

// Output the file
readfile($fullPath);
exit;
