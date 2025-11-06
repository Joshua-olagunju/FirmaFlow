<?php
// PWA JavaScript Registration
// Include this file before the closing </body> tag of all your PHP pages
?>

<!-- PWA Install and Service Worker Registration -->
<script src="/assets/js/pwa-install.js"></script>
<script>
// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js')
            .then(function(registration) {
                console.log('PWA: Service Worker registered successfully:', registration);
                
                // Check for updates
                registration.addEventListener('updatefound', function() {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', function() {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New version available - show update notification
                                console.log('PWA: New version available');
                                if (window.PWAInstaller) {
                                    window.PWAInstaller.showUpdateAvailable();
                                }
                            }
                        });
                    }
                });
            })
            .catch(function(error) {
                console.log('PWA: Service Worker registration failed:', error);
            });
    });
}

// Handle online/offline status
window.addEventListener('online', function() {
    console.log('PWA: Back online');
    document.body.classList.remove('offline');
    
    // Show online notification
    const notification = document.createElement('div');
    notification.innerHTML = '🟢 Back online - data will sync automatically';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 10px 20px;
        border-radius: 6px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
});

window.addEventListener('offline', function() {
    console.log('PWA: Gone offline');
    document.body.classList.add('offline');
    
    // Show offline notification
    const notification = document.createElement('div');
    notification.innerHTML = '🔴 You are offline - some features may be limited';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 10px 20px;
        border-radius: 6px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
});

// Add offline styling
const offlineCSS = `
<style>
.offline {
    filter: grayscale(20%);
}

.offline::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #ef4444, #f97316);
    z-index: 9999;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', offlineCSS);
</script>