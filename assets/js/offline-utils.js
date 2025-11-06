// offline-utils.js - Utility functions for offline functionality
class FirmaFlowOffline {
    constructor() {
        this.isOnline = navigator.onLine;
        this.pendingActions = [];
        this.init();
    }
    
    init() {
        // Listen for online/offline events
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Listen for service worker messages
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                this.handleServiceWorkerMessage(event);
            });
        }
        
        // Initialize UI indicators
        this.updateUIStatus();
        
        // Pre-cache important pages after a short delay
        setTimeout(() => {
            this.preCachePages();
        }, 2000);
    }
    
    handleOnline() {
        console.log('🟢 Back online - syncing data...');
        this.isOnline = true;
        this.updateUIStatus();
        this.syncPendingActions();
        this.showNotification('Connection restored! Syncing your data...', 'success');
    }
    
    handleOffline() {
        console.log('🔴 Gone offline - enabling offline mode...');
        this.isOnline = false;
        this.updateUIStatus();
        this.showNotification('Working offline. Your data will sync when reconnected.', 'info');
    }
    
    handleServiceWorkerMessage(event) {
        const { data } = event;
        
        if (data.type === 'SW_ACTIVATED') {
            console.log('✅ Service Worker ready - offline functionality enabled');
            this.showNotification('App ready for offline use!', 'success');
        }
    }
    
    updateUIStatus() {
        // Update any offline indicators in the UI
        const offlineIndicators = document.querySelectorAll('.offline-indicator');
        const onlineIndicators = document.querySelectorAll('.online-indicator');
        
        offlineIndicators.forEach(el => {
            el.style.display = this.isOnline ? 'none' : 'block';
        });
        
        onlineIndicators.forEach(el => {
            el.style.display = this.isOnline ? 'block' : 'none';
        });
        
        // Update any forms or buttons that should be disabled offline
        const onlineOnlyElements = document.querySelectorAll('[data-online-only]');
        onlineOnlyElements.forEach(el => {
            if (this.isOnline) {
                el.removeAttribute('disabled');
                el.classList.remove('disabled');
            } else {
                el.setAttribute('disabled', 'true');
                el.classList.add('disabled');
            }
        });
    }
    
    async storeActionForSync(action) {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            const messageChannel = new MessageChannel();
            
            return new Promise((resolve, reject) => {
                messageChannel.port1.onmessage = (event) => {
                    if (event.data.success) {
                        resolve();
                    } else {
                        reject(new Error(event.data.error));
                    }
                };
                
                navigator.serviceWorker.controller.postMessage({
                    type: 'STORE_OFFLINE_ACTION',
                    action: action
                }, [messageChannel.port2]);
            });
        } else {
            // Fallback to localStorage
            const pending = JSON.parse(localStorage.getItem('firmaflow_pending_actions') || '[]');
            pending.push({
                ...action,
                id: Date.now(),
                timestamp: Date.now()
            });
            localStorage.setItem('firmaflow_pending_actions', JSON.stringify(pending));
        }
    }
    
    async syncPendingActions() {
        if (!this.isOnline) return;
        
        // Try to sync actions stored in localStorage (fallback)
        const pending = JSON.parse(localStorage.getItem('firmaflow_pending_actions') || '[]');
        
        for (const action of pending) {
            try {
                const response = await fetch(action.endpoint, {
                    method: action.method || 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...action.headers
                    },
                    body: JSON.stringify(action.data)
                });
                
                if (response.ok) {
                    console.log('✅ Synced pending action:', action.type);
                } else {
                    console.warn('⚠️ Failed to sync action:', action.type, response.status);
                }
            } catch (error) {
                console.error('❌ Error syncing action:', action.type, error);
            }
        }
        
        // Clear synced actions
        localStorage.removeItem('firmaflow_pending_actions');
    }
    
    showNotification(message, type = 'info') {
        // Create or update notification
        let notification = document.getElementById('offline-notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'offline-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                max-width: 300px;
                font-size: 14px;
                opacity: 0;
                transform: translateY(-10px);
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            `;
            document.body.appendChild(notification);
        }
        
        // Set colors based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        notification.textContent = message;
        
        // Show notification
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 100);
        
        // Hide after 4 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
    
    // Enhanced navigation wrapper for better caching
    async safeNavigate(url) {
        // Try to pre-cache the page before navigation
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            try {
                await fetch(url, { method: 'HEAD' });
                console.log(`📱 Pre-cached page: ${url}`);
            } catch (error) {
                console.log(`📱 Could not pre-cache: ${url}`);
            }
        }
        
        // Navigate to the page
        window.location.href = url;
    }
    
    // Wrapper for fetch requests that handles offline scenarios
    async safeFetch(url, options = {}) {
        try {
            const response = await fetch(url, options);
            return response;
        } catch (error) {
            if (!this.isOnline) {
                // Store for later sync if it's a POST/PUT/DELETE request
                if (options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())) {
                    await this.storeActionForSync({
                        endpoint: url,
                        method: options.method,
                        headers: options.headers,
                        data: options.body ? JSON.parse(options.body) : null,
                        type: 'api_request'
                    });
                    
                    this.showNotification('Action saved for sync when online', 'info');
                    
                    // Return a mock success response
                    return new Response(JSON.stringify({
                        success: true,
                        offline: true,
                        message: 'Action will be synced when online'
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }
            throw error;
        }
    }
    
    // Pre-cache important pages for better offline experience
    preCachePages() {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            // List of important pages to pre-cache
            const importantPages = [
                '/public/user_dashboard.php',
                '/public/admin_dashboard.php', 
                '/public/customers.php',
                '/public/products.php',
                '/public/sales.php',
                '/public/reports.php',
                '/landing.php',
                '/index.php'
            ];
            
            // Pre-cache pages in background
            importantPages.forEach(page => {
                fetch(page, { method: 'HEAD' })
                    .then(() => {
                        console.log(`📱 Pre-cached: ${page}`);
                    })
                    .catch(() => {
                        // Silent fail for pre-caching
                    });
            });
        }
    }
    
    // Check if a feature is available offline
    isFeatureAvailableOffline(feature) {
        const offlineFeatures = [
            'view_dashboard',
            'view_customers',
            'view_products',
            'view_reports',
            'view_settings'
        ];
        
        return offlineFeatures.includes(feature);
    }
    
    // Debug function to check cached resources
    async debugCacheStatus() {
        if ('caches' in window) {
            try {
                const cacheNames = await caches.keys();
                console.log('📱 Available caches:', cacheNames);
                
                for (const cacheName of cacheNames) {
                    const cache = await caches.open(cacheName);
                    const requests = await cache.keys();
                    console.log(`📱 Cache "${cacheName}" contains:`, requests.map(r => r.url));
                }
            } catch (error) {
                console.error('📱 Error checking cache:', error);
            }
        }
    }
    
    // Get offline status
    getStatus() {
        return {
            online: this.isOnline,
            serviceWorkerReady: 'serviceWorker' in navigator && navigator.serviceWorker.controller,
            pendingActions: JSON.parse(localStorage.getItem('firmaflow_pending_actions') || '[]').length
        };
    }
}

// Initialize offline functionality
window.FirmaFlowOffline = new FirmaFlowOffline();

// Add some debugging helpers to window for easy testing
window.debugPWA = {
    checkCache: () => window.FirmaFlowOffline.debugCacheStatus(),
    getStatus: () => window.FirmaFlowOffline.getStatus(),
    simulateOffline: () => {
        // Simulate offline mode for testing
        window.dispatchEvent(new Event('offline'));
    },
    simulateOnline: () => {
        // Simulate online mode for testing  
        window.dispatchEvent(new Event('online'));
    },
    forceSync: () => window.FirmaFlowOffline.syncPendingActions()
};

// Add global offline indicator styles
const offlineStyles = document.createElement('style');
offlineStyles.textContent = `
    .offline-indicator {
        display: none;
        background: #f59e0b;
        color: white;
        padding: 8px 16px;
        text-align: center;
        font-size: 14px;
        font-weight: 500;
    }
    
    .online-indicator {
        display: block;
    }
    
    [data-online-only]:disabled,
    [data-online-only].disabled {
        opacity: 0.6;
        cursor: not-allowed;
        pointer-events: none;
    }
    
    .offline-badge {
        background: #f59e0b;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        margin-left: 8px;
    }
`;
document.head.appendChild(offlineStyles);

console.log('📱 FirmaFlow offline utilities loaded');