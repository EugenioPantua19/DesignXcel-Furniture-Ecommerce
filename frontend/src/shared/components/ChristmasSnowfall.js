import React, { useEffect, useRef } from 'react';

/**
 * Simple Christmas Snowfall Component
 * Creates falling snowflakes for Christmas theme
 */
const ChristmasSnowfall = ({ isActive = false }) => {
  const containerRef = useRef(null);
  const intervalRef = useRef(null);

  // Snowflake symbols - Christmas themed
  const snowflakes = ['❄', '❅', '❆', '🎄', '⭐', '🌟'];

  // Create a single snowflake
  const createSnowflake = () => {
    if (!containerRef.current) return;

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
    
    containerRef.current.appendChild(snowflake);
    
    // Remove snowflake after animation
    setTimeout(() => {
      if (snowflake.parentNode) {
        snowflake.parentNode.removeChild(snowflake);
      }
    }, 12000);
  };

  // Create Christmas lights - REMOVED

  // Start snowfall
  const startSnowfall = () => {
    if (intervalRef.current) return;
    
    // Check for reduced motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    
    // Create Christmas lights - REMOVED
    
    // Create initial snowflakes
    for (let i = 0; i < 15; i++) {
      setTimeout(() => createSnowflake(), i * 200);
    }
    
    // Continue creating snowflakes
    intervalRef.current = setInterval(() => {
      createSnowflake();
    }, 1000);
  };

  // Stop snowfall
  const stopSnowfall = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Remove all snowflakes
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    
    // Remove Christmas lights - REMOVED
  };

  useEffect(() => {
    if (isActive) {
      startSnowfall();
    } else {
      stopSnowfall();
    }

    return () => {
      stopSnowfall();
    };
  }, [isActive]);

  if (!isActive) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="christmas-snowfall"
      aria-hidden="true"
    />
  );
};

export default ChristmasSnowfall;
