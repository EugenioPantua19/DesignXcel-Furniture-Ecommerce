import React, { useState, useEffect } from 'react';

/**
 * Theme Switcher Component
 * Allows users to switch between different themes
 */
const ThemeSwitcher = ({ className = '', showLabel = true }) => {
  const [currentTheme, setCurrentTheme] = useState('default');
  const [isLoading, setIsLoading] = useState(false);

  const themes = [
    { value: 'default', label: 'Default', icon: '🏠' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'christmas', label: 'Christmas', icon: '🎄' }
  ];

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

  const handleThemeChange = async (theme) => {
    if (theme === currentTheme) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/theme/public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ activeTheme: theme })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentTheme(theme);
          
          // Apply theme using theme manager if available
          if (window.themeManager) {
            window.themeManager.applyTheme(theme);
          } else {
            // Fallback: apply theme directly
            document.body.className = document.body.className
              .replace(/theme-\w+/g, '')
              .trim();
            if (theme !== 'default') {
              document.body.classList.add(`theme-${theme}`);
            }
          }
        }
      }
    } catch (error) {
      // Failed to switch theme - continue with current theme
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`theme-switcher ${className}`}>
      {showLabel && (
        <label htmlFor="theme-select" className="theme-switcher-label">
          Theme:
        </label>
      )}
      <select
        id="theme-select"
        value={currentTheme}
        onChange={(e) => handleThemeChange(e.target.value)}
        disabled={isLoading}
        className="theme-switcher-select"
      >
        {themes.map(theme => (
          <option key={theme.value} value={theme.value}>
            {theme.icon} {theme.label}
          </option>
        ))}
      </select>
      {isLoading && (
        <span className="theme-switcher-loading">Loading...</span>
      )}
    </div>
  );
};

export default ThemeSwitcher;
