import React, { useState, useEffect } from 'react';

/**
 * Modern Theme Switcher Component with SVG Icons
 * Toggle between default and dark themes with beautiful icons
 */
const ModernThemeSwitcher = ({ className = '', size = 'medium' }) => {
  const [currentTheme, setCurrentTheme] = useState('default');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // SVG Icons
  const SunIcon = () => (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );

  const DarkIcon = () => (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );



  useEffect(() => {
    // Load current theme
    const loadCurrentTheme = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/theme/public`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCurrentTheme(data.activeTheme || 'default');
          }
        }
      } catch (error) {
        setCurrentTheme('default');
      }
    };

    loadCurrentTheme();
  }, []);

  const handleThemeToggle = async () => {
    if (isLoading) return;
    
    // Toggle between default and dark themes only
    const newTheme = currentTheme === 'default' ? 'dark' : 'default';
    
    setIsLoading(true);
    setIsAnimating(true);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/theme/public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ activeTheme: newTheme })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentTheme(newTheme);
          
          // Apply theme using theme manager if available
          if (window.themeManager) {
            window.themeManager.applyTheme(newTheme);
          } else {
            // Fallback: apply theme directly
            document.body.className = document.body.className
              .replace(/theme-\w+/g, '')
              .trim();
            if (newTheme !== 'default') {
              document.body.classList.add(`theme-${newTheme}`);
            }
          }
        }
      }
    } catch (error) {
      // Failed to switch theme - continue with current theme
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setIsAnimating(false);
      }, 300);
    }
  };

  const sizeClasses = {
    small: 'theme-switcher-small',
    medium: 'theme-switcher-medium',
    large: 'theme-switcher-large'
  };

  return (
    <div className={`modern-theme-switcher ${className} ${sizeClasses[size]}`}>
      <div className="theme-toggle-container">
        {/* Single Toggle Switch */}
        <div className="theme-toggle-wrapper">
          <div 
            className={`theme-toggle-switch ${currentTheme === 'dark' ? 'dark-mode' : 'default-mode'}`}
            onClick={handleThemeToggle}
          >
            <div className="theme-toggle-thumb">
              {currentTheme === 'dark' ? <DarkIcon /> : <SunIcon />}
            </div>
          </div>
        </div>

        {/* Hidden toggle button for accessibility */}
        <button
          onClick={handleThemeToggle}
          disabled={isLoading}
          className="theme-toggle-hidden-btn"
          title={`Switch to ${currentTheme === 'default' ? 'dark' : 'default'} theme`}
          aria-label={`Switch to ${currentTheme === 'default' ? 'dark' : 'default'} theme`}
        >
          {isLoading && (
            <div className="theme-loading">
              <div className="loading-spinner"></div>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default ModernThemeSwitcher;
