<?php
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/db.php';

// Redirect if not superadmin
requireSuperAdmin();

$currentUser = getSuperAdminUser();
$currentPage = basename($_SERVER['PHP_SELF'], '.php');
?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $pageTitle ?? 'SuperAdmin Dashboard' ?> - Firmaflow</title>
    
    <!-- Bootstrap 5.3.0 -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Tabler Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons@2.44.0/tabler-icons.min.css">
    
    <!-- Custom SuperAdmin CSS -->
    <link rel="stylesheet" href="<?= (in_array($currentPage, ['index', 'global_messages'])) ? '' : '../' ?>css/superadmin.css">
    
    <!-- Chart.js for dashboard charts -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-light">

<div class="d-flex">
    <!-- Mobile sidebar overlay -->
    <div class="sidebar-overlay d-md-none" id="sidebarOverlay"></div>