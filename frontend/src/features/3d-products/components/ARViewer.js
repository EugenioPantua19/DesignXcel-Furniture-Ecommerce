import React, { useEffect, useRef, useState } from 'react';
import { getModel3dUrl } from '../../../shared/utils/imageUtils';
import './ARViewer.css';

// AR Viewer Modal Component using model-viewer
const ARViewer = ({ isOpen, onClose, product, modelPath }) => {
  const modelViewerRef = useRef(null);
  const [isARAvailable, setIsARAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [arError, setArError] = useState(null);

  // Check AR availability and initialize model-viewer
  useEffect(() => {
    if (!isOpen) return;

    // Check if model-viewer is supported
    const checkARSupport = async () => {
      try {
        // Wait for model-viewer to be defined
        if (typeof customElements !== 'undefined' && customElements.get('model-viewer')) {
          setIsARAvailable(true);
          setIsLoading(false);
          return;
        }

        // Skip npm import to avoid webpack bundling issues - use CDN only
        // This prevents the AgXToneMapping import error from Three.js version mismatch
        console.log('Model-viewer: Using CDN fallback (npm package excluded from bundle)');

        // Use CDN for model-viewer (avoids webpack bundling and version conflicts)
        if (!document.querySelector('script[src*="model-viewer"]')) {
          const script = document.createElement('script');
          script.type = 'module';
          script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.1.0/model-viewer.min.js';
          script.onload = () => {
            // Wait a bit for custom element to register
            setTimeout(() => {
              if (typeof customElements !== 'undefined' && customElements.get('model-viewer')) {
                setIsARAvailable(true);
                setIsLoading(false);
              } else {
                setArError('AR viewer loaded but not available. Please refresh the page.');
                setIsARAvailable(false);
                setIsLoading(false);
              }
            }, 500);
          };
          script.onerror = () => {
            setArError('Failed to load AR viewer. Please check your internet connection.');
            setIsARAvailable(false);
            setIsLoading(false);
          };
          document.head.appendChild(script);
        } else {
          // Script already loading, wait for it
          setTimeout(() => {
            if (typeof customElements !== 'undefined' && customElements.get('model-viewer')) {
              setIsARAvailable(true);
              setIsLoading(false);
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error checking AR support:', error);
        setArError('AR is not supported on this device/browser.');
        setIsARAvailable(false);
        setIsLoading(false);
      }
    };

    checkARSupport();
  }, [isOpen]);

  // Handle model loading
  useEffect(() => {
    if (modelViewerRef.current && isARAvailable) {
      const modelViewer = modelViewerRef.current;
      
      const handleLoad = () => {
        setIsLoading(false);
        setArError(null);
      };

      const handleError = (event) => {
        console.error('Model loading error:', event);
        setIsLoading(false);
        setArError('Failed to load 3D model. Please try again.');
      };

      modelViewer.addEventListener('load', handleLoad);
      modelViewer.addEventListener('error', handleError);

      // Set timeout for loading
      const timeout = setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
          setArError('Model loading timeout. Please check your connection.');
        }
      }, 30000);

      return () => {
        modelViewer.removeEventListener('load', handleLoad);
        modelViewer.removeEventListener('error', handleError);
        clearTimeout(timeout);
      };
    }
  }, [modelViewerRef.current, isARAvailable, isLoading]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const finalModelPath = modelPath || (product ? getModel3dUrl(product) : null);

  return (
    <div className="ar-viewer-overlay" onClick={onClose}>
      <div className="ar-viewer-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ar-viewer-header">
          <div className="ar-viewer-title">
            <svg className="ar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            <h2>AR View - {product?.name || 'Product'}</h2>
          </div>
          <button className="ar-close-btn" onClick={onClose} aria-label="Close AR view">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Instructions */}
        <div className="ar-instructions">
          <div className="ar-instruction-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
            <span>Point your camera at a flat surface to place the product</span>
          </div>
        </div>

        {/* AR Viewer Container */}
        <div className="ar-viewer-container">
          {isLoading && (
            <div className="ar-loading">
              <div className="ar-loading-spinner"></div>
              <p>Loading AR experience...</p>
            </div>
          )}

          {arError && (
            <div className="ar-error">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <h3>AR Unavailable</h3>
              <p>{arError}</p>
              <p className="ar-error-hint">
                AR works best on mobile devices with ARCore (Android) or ARKit (iOS). 
                Try opening this page on your phone for the best experience.
              </p>
            </div>
          )}

          {finalModelPath && isARAvailable && !arError ? (
            <model-viewer
              ref={modelViewerRef}
              src={finalModelPath}
              alt={product?.name || '3D Product'}
              ar
              ar-modes="webxr scene-viewer quick-look"
              camera-controls
              disable-zoom
              interaction-policy="allow-when-fixed"
              environment-image="neutral"
              shadow-intensity="1"
              exposure="1"
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#f0f0f0'
              }}
            >
              {/* AR Button */}
              <button
                slot="ar-button"
                className="ar-launch-btn"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
                View in AR
              </button>
            </model-viewer>
          ) : null}

          {!finalModelPath && !arError && (
            <div className="ar-error">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
              <h3>3D Model Not Available</h3>
              <p>This product doesn't have a 3D model for AR viewing.</p>
            </div>
          )}
        </div>

        {/* Footer with Tips */}
        <div className="ar-viewer-footer">
          <div className="ar-tips">
            <h4>AR Tips:</h4>
            <ul>
              <li>Make sure you're in a well-lit area</li>
              <li>Point your camera at a flat surface (floor, table)</li>
              <li>Move your device slowly to explore the product</li>
              <li>Tap the AR button to place the product in your space</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ARViewer;

