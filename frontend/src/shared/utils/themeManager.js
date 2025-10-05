/**
 * Theme Manager - Handles theme switching and persistence
 */

class ThemeManager {
  constructor() {
    this.currentTheme = 'default';
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
      const response = await fetch('/api/theme/active');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.currentTheme = data.activeTheme || 'default';
          this.applyTheme(this.currentTheme);
        }
      }
    } catch (error) {
      console.log('Theme manager: Using default theme');
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

    try {
      // Save theme to backend
      const response = await fetch('/api/theme/active', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ activeTheme: theme })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.applyTheme(theme);
          return true;
        }
      }
    } catch (error) {
      console.error('Failed to save theme to backend:', error);
      // Still apply theme locally
      this.applyTheme(theme);
      return false;
    }
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
   * Add Christmas decorations
   */
  addChristmasDecorations() {
    if (this.currentTheme === 'christmas') {
      // Add Christmas emojis to navigation
      const navLinks = document.querySelectorAll('.header-nav-link');
      navLinks.forEach((link, index) => {
        if (!link.querySelector('.christmas-emoji')) {
          const emoji = ['🎄', '❄️', '🎁', '🎅', '🌟'][index % 5];
          const emojiSpan = document.createElement('span');
          emojiSpan.className = 'christmas-emoji';
          emojiSpan.textContent = emoji;
          emojiSpan.style.marginRight = '8px';
          emojiSpan.style.animation = 'christmas-sparkle 2s ease-in-out infinite';
          link.insertBefore(emojiSpan, link.firstChild);
        }
      });

      // Add Christmas effects to buttons
      const buttons = document.querySelectorAll('.btn, .cta-button');
      buttons.forEach(button => {
        if (!button.querySelector('.christmas-effect')) {
          const effect = document.createElement('span');
          effect.className = 'christmas-effect';
          effect.style.position = 'absolute';
          effect.style.top = '0';
          effect.style.left = '0';
          effect.style.right = '0';
          effect.style.bottom = '0';
          effect.style.background = 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)';
          effect.style.animation = 'christmas-glow 3s ease-in-out infinite alternate';
          effect.style.pointerEvents = 'none';
          button.style.position = 'relative';
          button.style.overflow = 'hidden';
          button.appendChild(effect);
        }
      });
    }
  }

  /**
   * Remove Christmas decorations
   */
  removeChristmasDecorations() {
    // Remove Christmas emojis
    const christmasEmojis = document.querySelectorAll('.christmas-emoji');
    christmasEmojis.forEach(emoji => emoji.remove());

    // Remove Christmas effects
    const christmasEffects = document.querySelectorAll('.christmas-effect');
    christmasEffects.forEach(effect => effect.remove());
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

// Export for module usage
export default ThemeManager;
