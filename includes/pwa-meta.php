<?php
// PWA Meta Tags and Configuration
// Include this file in the <head> section of all your PHP pages
?>

<!-- PWA Configuration -->
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#667eea">

<!-- iOS PWA Configuration -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="FirmaFlow">
<link rel="apple-touch-icon" sizes="72x72" href="/assets/icons/icon-72x72.png">
<link rel="apple-touch-icon" sizes="96x96" href="/assets/icons/icon-96x96.png">
<link rel="apple-touch-icon" sizes="128x128" href="/assets/icons/icon-128x128.png">
<link rel="apple-touch-icon" sizes="144x144" href="/assets/icons/icon-144x144.png">
<link rel="apple-touch-icon" sizes="152x152" href="/assets/icons/icon-152x152.png">
<link rel="apple-touch-icon" sizes="192x192" href="/assets/icons/icon-192x192.png">
<link rel="apple-touch-icon" sizes="384x384" href="/assets/icons/icon-384x384.png">
<link rel="apple-touch-icon" sizes="512x512" href="/assets/icons/icon-512x512.png">

<!-- Windows PWA Configuration -->
<meta name="msapplication-TileColor" content="#667eea">
<meta name="msapplication-TileImage" content="/assets/icons/icon-144x144.png">
<meta name="msapplication-config" content="/browserconfig.xml">

<!-- Android PWA Configuration -->
<meta name="mobile-web-app-capable" content="yes">

<!-- Preload PWA JavaScript -->
<link rel="preload" href="/assets/js/pwa-install.js" as="script">