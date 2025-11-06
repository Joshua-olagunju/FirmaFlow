// Theme Management System
// Handles dark/light mode switching with localStorage persistence

class ThemeManager {
  constructor() {
    this.currentTheme = this.getStoredTheme() || this.getPreferredTheme();
    this.init();
  }

  // Get theme from localStorage
  getStoredTheme() {
    return localStorage.getItem('firmaflow-theme');
  }

  // Get system preference
  getPreferredTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  // Set theme
  setTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('firmaflow-theme', theme);
    this.updateThemeToggleIcon();
    this.updateSettingsToggle();
    
    // Dispatch custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('themechange', { 
      detail: { theme: theme } 
    }));
  }

  // Toggle between light and dark
  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  // Initialize theme system
  init() {
    // Set initial theme
    this.setTheme(this.currentTheme);
    
    // Create floating theme toggle button
    this.createFloatingToggle();
    
    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        if (!this.getStoredTheme()) {
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  // Create floating theme toggle button
  createFloatingToggle() {
    const existingToggle = document.getElementById('theme-toggle');
    if (existingToggle) {
      existingToggle.remove();
    }

    const toggle = document.createElement('button');
    toggle.id = 'theme-toggle';
    toggle.className = 'theme-toggle';
    toggle.title = 'Toggle dark/light mode';
    toggle.setAttribute('aria-label', 'Toggle theme');
    
    this.updateThemeToggleIcon(toggle);
    
    toggle.addEventListener('click', () => {
      this.toggleTheme();
    });

    document.body.appendChild(toggle);
  }

  // Update theme toggle icon
  updateThemeToggleIcon(toggleElement = null) {
    const toggle = toggleElement || document.getElementById('theme-toggle');
    if (!toggle) return;

    if (this.currentTheme === 'dark') {
      toggle.innerHTML = '<i class="ti ti-sun"></i>';
      toggle.title = 'Switch to light mode';
    } else {
      toggle.innerHTML = '<i class="ti ti-moon"></i>';
      toggle.title = 'Switch to dark mode';
    }
  }

  // Update settings page toggle if it exists
  updateSettingsToggle() {
    const settingsToggle = document.getElementById('theme-setting');
    if (settingsToggle) {
      settingsToggle.checked = this.currentTheme === 'dark';
    }
  }

  // Get current theme
  getCurrentTheme() {
    return this.currentTheme;
  }

  // Check if dark mode is active
  isDarkMode() {
    return this.currentTheme === 'dark';
  }

  // Force refresh theme (useful after dynamic content loads)
  refreshTheme() {
    this.setTheme(this.currentTheme);
  }
}

// Global theme manager instance
window.themeManager = new ThemeManager();

// Global functions for backward compatibility
window.toggleTheme = () => window.themeManager.toggleTheme();
window.setTheme = (theme) => window.themeManager.setTheme(theme);
window.getCurrentTheme = () => window.themeManager.getCurrentTheme();

// Initialize theme management when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Ensure theme is applied immediately
  window.themeManager.refreshTheme();
  
  // Update any existing theme controls
  const themeControls = document.querySelectorAll('[data-theme-toggle]');
  themeControls.forEach(control => {
    control.addEventListener('click', () => {
      window.themeManager.toggleTheme();
    });
  });
});

// Export for ES6 modules if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}