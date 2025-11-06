// PWA Install functionality for FirmaFlow
class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.installButton = null;
        this.isInstalled = false;
        
        this.init();
    }
    
    init() {
        // Check if app is already installed
        this.checkIfInstalled();
        
        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('PWA: beforeinstallprompt event fired');
            
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            
            // Store the event so it can be triggered later
            this.deferredPrompt = e;
            
            // Show the install button
            this.showInstallButton();
        });
        
        // Listen for the appinstalled event
        window.addEventListener('appinstalled', (e) => {
            console.log('PWA: App was installed successfully');
            this.isInstalled = true;
            this.hideInstallButton();
            this.showInstalledMessage();
        });
        
        // Check if app is running in standalone mode
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
            console.log('PWA: App is running in standalone mode');
            this.isInstalled = true;
        }
        
        // Create install button
        this.createInstallButton();
        
        // Register service worker
        this.registerServiceWorker();
    }
    
    checkIfInstalled() {
        // Check if running in PWA mode
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
            return;
        }
        
        // Check for iOS PWA
        if (window.navigator.standalone === true) {
            this.isInstalled = true;
            return;
        }
        
        // Check localStorage for manual tracking
        if (localStorage.getItem('pwa-installed') === 'true') {
            this.isInstalled = true;
        }
    }
    
    createInstallButton() {
        // Create install button HTML
        const installButtonHTML = `
            <div id="pwa-install-container" class="pwa-install-container" style="display: none;">
                <div class="pwa-install-card">
                    <div class="pwa-install-icon">📱</div>
                    <div class="pwa-install-content">
                        <h3>Install FirmaFlow</h3>
                        <p>Install FirmaFlow on your device for quick access and offline features!</p>
                        <div class="pwa-install-benefits">
                            <div class="benefit">✓ Works offline</div>
                            <div class="benefit">✓ Faster loading</div>
                            <div class="benefit">✓ App-like experience</div>
                        </div>
                    </div>
                    <div class="pwa-install-actions">
                        <button id="pwa-install-btn" class="btn-install">Install App</button>
                        <button id="pwa-dismiss-btn" class="btn-dismiss">Maybe Later</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add CSS for install prompt
        const installCSS = `
            <style>
                .pwa-install-container {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 10000;
                    max-width: 350px;
                    animation: slideInUp 0.3s ease-out;
                }
                
                @media (max-width: 768px) {
                    .pwa-install-container {
                        bottom: 10px;
                        right: 10px;
                        left: 10px;
                        max-width: none;
                    }
                }
                
                .pwa-install-card {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .pwa-install-icon {
                    font-size: 2rem;
                    text-align: center;
                    margin-bottom: 15px;
                }
                
                .pwa-install-content h3 {
                    margin: 0 0 10px 0;
                    font-size: 1.2rem;
                    font-weight: 600;
                }
                
                .pwa-install-content p {
                    margin: 0 0 15px 0;
                    font-size: 0.9rem;
                    opacity: 0.9;
                    line-height: 1.4;
                }
                
                .pwa-install-benefits {
                    margin-bottom: 20px;
                }
                
                .benefit {
                    font-size: 0.8rem;
                    margin: 5px 0;
                    opacity: 0.8;
                }
                
                .pwa-install-actions {
                    display: flex;
                    gap: 10px;
                }
                
                .btn-install {
                    flex: 1;
                    background: rgba(255, 255, 255, 0.9);
                    color: #667eea;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .btn-install:hover {
                    background: white;
                    transform: translateY(-1px);
                }
                
                .btn-dismiss {
                    background: transparent;
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .btn-dismiss:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                
                @keyframes slideInUp {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                
                .pwa-success-message {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #10b981;
                    color: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                    z-index: 10001;
                    animation: slideInDown 0.3s ease-out;
                }
                
                @keyframes slideInDown {
                    from {
                        transform: translateY(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            </style>
        `;
        
        // Add CSS to head
        document.head.insertAdjacentHTML('beforeend', installCSS);
        
        // Add install prompt to body
        document.body.insertAdjacentHTML('beforeend', installButtonHTML);
        
        // Get button references
        this.installButton = document.getElementById('pwa-install-btn');
        this.dismissButton = document.getElementById('pwa-dismiss-btn');
        this.installContainer = document.getElementById('pwa-install-container');
        
        // Add event listeners
        if (this.installButton) {
            this.installButton.addEventListener('click', () => this.installApp());
        }
        
        if (this.dismissButton) {
            this.dismissButton.addEventListener('click', () => this.dismissInstallPrompt());
        }
    }
    
    showInstallButton() {
        if (!this.isInstalled && this.installContainer) {
            // Don't show if user dismissed recently
            const dismissed = localStorage.getItem('pwa-install-dismissed');
            const dismissedTime = dismissed ? parseInt(dismissed) : 0;
            const dayInMs = 24 * 60 * 60 * 1000;
            
            if (Date.now() - dismissedTime > dayInMs) {
                this.installContainer.style.display = 'block';
            }
        }
    }
    
    hideInstallButton() {
        if (this.installContainer) {
            this.installContainer.style.display = 'none';
        }
    }
    
    dismissInstallPrompt() {
        this.hideInstallButton();
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    }
    
    async installApp() {
        if (!this.deferredPrompt) {
            console.log('PWA: No deferred prompt available');
            return;
        }
        
        try {
            // Show the install prompt
            this.deferredPrompt.prompt();
            
            // Wait for the user to respond to the prompt
            const { outcome } = await this.deferredPrompt.userChoice;
            
            console.log(`PWA: User response: ${outcome}`);
            
            if (outcome === 'accepted') {
                console.log('PWA: User accepted the install prompt');
                localStorage.setItem('pwa-installed', 'true');
            } else {
                console.log('PWA: User dismissed the install prompt');
            }
            
            // Clear the deferred prompt
            this.deferredPrompt = null;
            
            // Hide the install button
            this.hideInstallButton();
            
        } catch (error) {
            console.error('PWA: Error during installation:', error);
        }
    }
    
    showInstalledMessage() {
        const messageHTML = `
            <div class="pwa-success-message" id="pwa-success">
                🎉 FirmaFlow installed successfully! You can now access it from your home screen.
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', messageHTML);
        
        // Remove message after 5 seconds
        setTimeout(() => {
            const message = document.getElementById('pwa-success');
            if (message) {
                message.remove();
            }
        }, 5000);
    }
    
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', async () => {
                try {
                    const registration = await navigator.serviceWorker.register('/service-worker.js');
                    console.log('PWA: Service Worker registered successfully:', registration);
                    
                    // Listen for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // New version available
                                    this.showUpdateAvailable();
                                }
                            });
                        }
                    });
                    
                } catch (error) {
                    console.log('PWA: Service Worker registration failed:', error);
                }
            });
        }
    }
    
    showUpdateAvailable() {
        const updateHTML = `
            <div class="pwa-update-banner" id="pwa-update-banner">
                <div class="update-content">
                    <span>📱 New version available!</span>
                    <button id="pwa-update-btn" class="update-btn">Update Now</button>
                </div>
            </div>
        `;
        
        const updateCSS = `
            <style>
                .pwa-update-banner {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: #667eea;
                    color: white;
                    padding: 10px;
                    text-align: center;
                    z-index: 10002;
                    animation: slideInDown 0.3s ease-out;
                }
                
                .update-content {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 15px;
                }
                
                .update-btn {
                    background: white;
                    color: #667eea;
                    border: none;
                    padding: 5px 15px;
                    border-radius: 4px;
                    font-weight: 600;
                    cursor: pointer;
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', updateCSS);
        document.body.insertAdjacentHTML('afterbegin', updateHTML);
        
        document.getElementById('pwa-update-btn').addEventListener('click', () => {
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
            }
        });
    }
}

// Initialize PWA installer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PWAInstaller();
});

// Export for potential external use
window.PWAInstaller = PWAInstaller;