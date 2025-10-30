/**
 * Theme Manager - Handles theme switching and persistence
 */

class ThemeManager {
  constructor() {
    this.currentTheme = 'default';
    this.backendTheme = 'default'; // Store backend theme
    this.customerOverride = null; // Store customer override
    this.themeClasses = {
      'default': '',
      'dark': 'theme-dark',
      'christmas': 'theme-christmas'
    };
    this.init();
  }

  /**
   * Initialize theme manager
   */
  async init() {
    try {
      // Load theme from backend
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/theme/public`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.backendTheme = data.activeTheme || 'default';
          
          // Check for customer override in session storage
          const override = sessionStorage.getItem('designxcel-theme-override');
          
          if (override && this.themeClasses[override]) {
            // Customer has an override - use it temporarily (will reset on refresh)
            this.customerOverride = override;
            this.currentTheme = override;
          } else {
            // Use backend theme (always reverts to this on refresh)
            this.currentTheme = this.backendTheme;
            this.customerOverride = null;
          }
          
          this.applyTheme(this.currentTheme);
        }
      } else {
        this.applyTheme('default');
      }
    } catch (error) {
      this.applyTheme('default');
    }
  }

  /**
   * Apply theme to the document
   * @param {string} theme - Theme name
   */
  applyTheme(theme) {
    // Remove all theme classes
    Object.values(this.themeClasses).forEach(className => {
      if (className) {
        document.body.classList.remove(className);
      }
    });

    // Apply new theme
    if (this.themeClasses[theme]) {
      document.body.classList.add(this.themeClasses[theme]);
    }

    this.currentTheme = theme;
    
    // Store theme in localStorage as fallback
    localStorage.setItem('designxcel-theme', theme);
    
    // Update theme indicator if exists
    this.updateThemeIndicator(theme);
    
    // Handle Christmas snowfall effect
    this.handleChristmasEffects(theme);
    
    // Dispatch theme change event
    this.dispatchThemeChangeEvent(theme);
  }

  /**
   * Switch to a specific theme
   * @param {string} theme - Theme name
   */
  async switchTheme(theme) {
    if (!this.themeClasses[theme]) {
      console.error(`Invalid theme: ${theme}`);
      return false;
    }

    // Customer can switch between any themes (default, dark, christmas)
    // If backend has a theme set, save the customer's choice as override in sessionStorage
    // On refresh, it will revert to backend theme
    
    if (this.backendTheme && theme !== this.backendTheme) {
      // Customer is overriding backend theme
      this.customerOverride = theme;
      sessionStorage.setItem('designxcel-theme-override', theme);
    } else if (theme === this.backendTheme) {
      // Customer switched back to backend theme, clear override
      this.customerOverride = null;
      sessionStorage.removeItem('designxcel-theme-override');
    }

    this.applyTheme(theme);
    return true;
  }

  /**
   * Get current theme
   * @returns {string} Current theme name
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Get available themes
   * @returns {Array} Array of available theme names
   */
  getAvailableThemes() {
    return Object.keys(this.themeClasses);
  }

  /**
   * Update theme indicator in UI
   * @param {string} theme - Theme name
   */
  updateThemeIndicator(theme) {
    const indicator = document.getElementById('current-theme');
    if (indicator) {
      indicator.textContent = theme;
    }

    // Update theme selector if exists
    const selector = document.getElementById('theme-select');
    if (selector) {
      selector.value = theme;
    }
  }

  /**
   * Load theme from localStorage as fallback
   */
  loadFromStorage() {
    const storedTheme = localStorage.getItem('designxcel-theme');
    if (storedTheme && this.themeClasses[storedTheme]) {
      this.applyTheme(storedTheme);
    }
  }

  /**
   * Force refresh theme from backend
   */
  async refreshTheme() {
    await this.init();
  }

  /**
   * Dispatch theme change event
   * @param {string} theme - Theme name
   */
  dispatchThemeChangeEvent(theme) {
    const event = new CustomEvent('themeChanged', {
      detail: { theme: theme }
    });
    document.dispatchEvent(event);
  }

  /**
   * Handle Christmas theme effects
   * @param {string} theme - Theme name
   */
  handleChristmasEffects(theme) {
    if (theme === 'christmas') {
      this.startChristmasSnowfall();
    } else {
      this.stopChristmasSnowfall();
    }
  }

  /**
   * Start Christmas snowfall effect
   */
  startChristmasSnowfall() {
    // Remove existing snowfall if any
    this.stopChristmasSnowfall();
    
    // Create snowfall container
    const snowfallContainer = document.createElement('div');
    snowfallContainer.className = 'christmas-snowfall';
    snowfallContainer.id = 'christmas-snowfall';
    document.body.appendChild(snowfallContainer);
    
    // Create Christmas lights - REMOVED
    
    // Start creating snowflakes
    this.createChristmasSnowflakes();
  }

  /**
   * Stop Christmas snowfall effect
   */
  stopChristmasSnowfall() {
    const existingContainer = document.getElementById('christmas-snowfall');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    // Clear any existing intervals
    if (this.christmasSnowfallInterval) {
      clearInterval(this.christmasSnowfallInterval);
      this.christmasSnowfallInterval = null;
    }
    
    // Remove Christmas lights - REMOVED
  }

  /**
   * Create Christmas lights in header - REMOVED
   */

  /**
   * Create Christmas snowflakes
   */
  createChristmasSnowflakes() {
    const snowflakes = ['❄']; // Single snow style
    const container = document.getElementById('christmas-snowfall');
    
    if (!container) return;
    
    // Check for reduced motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    
    // Create initial snowflakes
    for (let i = 0; i < 15; i++) {
      setTimeout(() => this.createSingleChristmasSnowflake(container, snowflakes), i * 200);
    }
    
    // Continue creating snowflakes
    this.christmasSnowfallInterval = setInterval(() => {
      this.createSingleChristmasSnowflake(container, snowflakes);
    }, 1000);
  }

  /**
   * Create a single Christmas snowflake
   * @param {HTMLElement} container - Container element
   * @param {Array} snowflakes - Array of snowflake symbols
   */
  createSingleChristmasSnowflake(container, snowflakes) {
    if (!container) return;
    
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';
    
    // Random snowflake symbol
    snowflake.textContent = snowflakes[Math.floor(Math.random() * snowflakes.length)];
    
    // Random position
    snowflake.style.left = Math.random() * 100 + '%';
    
    // Position to start from header-main
    const headerMain = document.querySelector('.header-main');
    if (headerMain) {
      const headerRect = headerMain.getBoundingClientRect();
      snowflake.style.top = headerRect.top + 'px';
    } else {
      snowflake.style.top = '0px';
    }
    
    // Random size
    const sizes = ['small', 'medium', 'large'];
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    snowflake.classList.add(size);
    
    // Random animation delay
    snowflake.style.animationDelay = Math.random() * 2 + 's';
    
    container.appendChild(snowflake);
    
    // Remove snowflake after animation
    setTimeout(() => {
      if (snowflake.parentNode) {
        snowflake.parentNode.removeChild(snowflake);
      }
    }, 12000);
  }


  /**
   * Handle theme change events
   */
  setupThemeListeners() {
    // Listen for theme selector changes
    const themeSelector = document.getElementById('theme-select');
    if (themeSelector) {
      themeSelector.addEventListener('change', (e) => {
        this.switchTheme(e.target.value);
      });
    }

    // Listen for theme form submissions
    const themeForm = document.getElementById('theme-form');
    if (themeForm) {
      themeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const theme = formData.get('theme');
        if (theme) {
          await this.switchTheme(theme);
        }
      });
    }
  }
}

// Create global theme manager instance
window.themeManager = new ThemeManager();

// Add global functions for testing
window.testTheme = (theme) => {
  if (window.themeManager) {
    window.themeManager.applyTheme(theme);
  }
};

window.refreshTheme = () => {
  if (window.themeManager) {
    window.themeManager.refreshTheme();
  }
};

// Export for module usage
export default ThemeManager;
