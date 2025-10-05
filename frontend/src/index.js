import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


// Theme loader
import { API_ENDPOINTS } from './config/api';

fetch(API_ENDPOINTS.THEME_ACTIVE)
  .then(res => res.json())
  .then(data => {
    if (data.activeTheme && data.activeTheme !== 'default') {
      document.body.classList.add(`theme-${data.activeTheme}`);
    }
  })
  .catch(err => {
    console.error('Error loading theme settings:', err);
  });

// Optionally, listen for theme changes via a custom event
window.addEventListener('themeChanged', e => {
  document.body.classList.remove('theme-dark', 'theme-modern', 'theme-christmas');
  if (e.detail && e.detail.theme && e.detail.theme !== 'default') {
    document.body.classList.add(`theme-${e.detail.theme}`);
  }
  
  // Trigger background image update by dispatching a custom event
  window.dispatchEvent(new CustomEvent('backgroundImageUpdate', {
    detail: e.detail
  }));
});
