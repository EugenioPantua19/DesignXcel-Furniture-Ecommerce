import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { API_ENDPOINTS } from './config/api';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


// Theme loader
fetch(API_ENDPOINTS.THEME_ACTIVE)
  .then(res => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  })
  .then(data => {
    if (data.success && data.activeTheme && data.activeTheme !== 'default') {
      document.body.classList.add(`theme-${data.activeTheme}`);
      // Theme loaded successfully
    }
    // Using default theme if no specific theme is set
  })
  .catch(err => {
    // Could not load theme settings, using default theme - this is not a critical error
    // Continue with default theme
  });

// Optionally, listen for theme changes via a custom event
window.addEventListener('themeChanged', e => {
  document.body.classList.remove('theme-christmas');
  if (e.detail && e.detail.theme && e.detail.theme !== 'default') {
    document.body.classList.add(`theme-${e.detail.theme}`);
  }
  
  // Trigger background image update by dispatching a custom event
  window.dispatchEvent(new CustomEvent('backgroundImageUpdate', {
    detail: e.detail
  }));
});
