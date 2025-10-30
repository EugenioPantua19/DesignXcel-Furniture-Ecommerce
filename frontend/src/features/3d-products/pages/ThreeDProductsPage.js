import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  useGLTF, 
  PerspectiveCamera,
  Html,
  useLoader
} from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { LoadingManager } from 'three';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../../products/services/productService';
import { useCart } from '../../../shared/contexts/CartContext';
import { useCurrency } from '../../../shared/contexts/CurrencyContext';
import PageHeader from '../../../shared/components/layout/PageHeader';
import AudioLoader from '../../../shared/components/ui/AudioLoader';
import CartSuccessModal from '../../../shared/components/ui/CartSuccessModal';
import { getImageUrl, getModel3dUrl } from '../../../shared/utils/imageUtils';
import ARViewer from '../components/ARViewer';
import QRCodeModal from '../components/QRCodeModal';
import './3d-products.css';

// Safe OrbitControls wrapper to handle touch events properly
const SafeOrbitControls = React.forwardRef(({ isMobile, ...props }, ref) => {
  const internalRef = useRef();
  
  useEffect(() => {
    if (internalRef.current) {
      const controls = internalRef.current;
      
      // Add error handling for touch events
      const originalHandleTouchMoveDolly = controls.handleTouchMoveDolly;
      const originalHandleTouchMoveDollyPan = controls.handleTouchMoveDollyPan;
      const originalOnTouchMove = controls.domElement?.onTouchMove;
      
      // Wrap touch handlers with error handling
      controls.handleTouchMoveDolly = function(event) {
        try {
          if (event && event.touches && event.touches.length > 0 && event.touches[0]) {
            return originalHandleTouchMoveDolly.call(this, event);
          }
        } catch (error) {
          console.warn('Touch move dolly error:', error);
        }
      };
      
      controls.handleTouchMoveDollyPan = function(event) {
        try {
          if (event && event.touches && event.touches.length > 0 && event.touches[0]) {
            return originalHandleTouchMoveDollyPan.call(this, event);
          }
        } catch (error) {
          console.warn('Touch move dolly pan error:', error);
        }
      };
      
      // Add safe touch move handler to DOM element
      if (controls.domElement) {
        const safeTouchMoveHandler = (event) => {
          try {
            if (event.touches && event.touches.length > 0) {
              // Ensure all touches have valid properties
              for (let i = 0; i < event.touches.length; i++) {
                if (!event.touches[i] || typeof event.touches[i].clientX === 'undefined') {
                  return; // Skip invalid touch events
                }
              }
            }
          } catch (error) {
            console.warn('Touch move validation error:', error);
            event.preventDefault();
          }
        };
        
        controls.domElement.addEventListener('touchmove', safeTouchMoveHandler, { passive: false });
        
        // Cleanup function
        return () => {
          if (controls) {
            controls.handleTouchMoveDolly = originalHandleTouchMoveDolly;
            controls.handleTouchMoveDollyPan = originalHandleTouchMoveDollyPan;
            if (controls.domElement) {
              controls.domElement.removeEventListener('touchmove', safeTouchMoveHandler);
            }
          }
        };
      }
    }
  }, [isMobile]);
  
  // Forward the ref to both internal and external refs
  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(internalRef.current);
      } else {
        ref.current = internalRef.current;
      }
    }
  }, [ref]);

  return (
    <OrbitControls
      ref={internalRef}
      enablePan={!isMobile} // Disable pan on mobile to reduce touch conflicts
      enableZoom
      enableRotate
      maxPolarAngle={Math.PI}
      minPolarAngle={0}
      maxDistance={isMobile ? 12 : 15}
      minDistance={isMobile ? 1.5 : 1}
      enableDamping={true}
      dampingFactor={0.05}
      touches={{
        ONE: isMobile ? 0 : 1, // Disable single touch rotate on mobile
        TWO: 2 // Keep two-finger zoom and pan
      }}
      {...props}
    />
  );
});

// Self-contained Environment component that doesn't rely on external HDR files
const SafeEnvironment = () => {
  return (
    <>
      {/* Enhanced lighting setup for better model visibility */}
      <ambientLight intensity={1.5} color="#ffffff" />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={2.0}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight 
        position={[-5, 5, -5]} 
        intensity={1.5}
        color="#ffffff"
      />
      <directionalLight 
        position={[0, -5, 0]} 
        intensity={1.0}
        color="#ffffff"
      />
      <pointLight 
        position={[0, 8, 0]} 
        intensity={1.0}
        color="#ffffff"
      />
      <pointLight 
        position={[3, 3, 3]} 
        intensity={0.8}
        color="#ffffff"
      />
      <pointLight 
        position={[-3, 3, -3]} 
        intensity={0.8}
        color="#ffffff"
      />
    </>
  );
};

// Animated loading box component
const LoadingBox = () => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });
  
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#FCBD45" wireframe />
    </mesh>
  );
};

// Inner component that uses useGLTF (must be called unconditionally)
const GLTFLoaderInner = ({ blobUrl, onLoadingChange, onErrorChange }) => {
  // useGLTF is called unconditionally - it will handle null/undefined gracefully or suspend
  const gltf = useGLTF(blobUrl);
  
  useEffect(() => {
    if (gltf && gltf.scene) {
      console.log('GLTFLoaderInner - GLTF loaded and processed successfully');
    }
  }, [gltf]);
  
  useEffect(() => {
    if (gltf && gltf.scene) {
      try {
        // Enhanced material processing for texture visibility
        gltf.scene.traverse((child) => {
          if (child.isMesh && child.material) {
            // Apply texture visibility fixes
            if (child.material.map) {
              // Force optimal material properties for texture visibility
              child.material.color.setHex(0xffffff); // White base color
              child.material.roughness = 0.5; // Moderate roughness
              child.material.metalness = 0.0; // Non-metallic
              child.material.emissive.setHex(0x000000); // No emission
              child.material.transparent = false;
              child.material.opacity = 1.0;
              child.material.side = 2; // THREE.FrontSide
              
              // Force texture updates
              child.material.map.needsUpdate = true;
              child.material.map.flipY = false;
              child.material.map.generateMipmaps = true;
              child.material.map.minFilter = 1006; // THREE.LinearMipmapLinearFilter
              child.material.map.magFilter = 1003; // THREE.LinearFilter
              child.material.map.wrapS = 1000; // THREE.RepeatWrapping
              child.material.map.wrapT = 1000; // THREE.RepeatWrapping
              
              child.material.needsUpdate = true;
            }
          }
        });
        
        if (onLoadingChange) onLoadingChange(false);
        if (onErrorChange) onErrorChange(null);
      } catch (processError) {
        console.error('Error processing model:', processError);
        if (onLoadingChange) onLoadingChange(false);
        if (onErrorChange) onErrorChange(processError.message || 'Failed to process 3D model');
      }
    }
  }, [gltf, onLoadingChange, onErrorChange]);

  // Notify parent component about loading state
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(!gltf || !gltf.scene);
    }
  }, [gltf, onLoadingChange]);

  if (!gltf || !gltf.scene) {
    return null;
  }
  
  return <primitive object={gltf.scene} />;
};

// Model component that uses useLoader for better error handling
const ModelComponent = ({ modelPath, onLoadingChange, onErrorChange }) => {
  const [gltf, setGltf] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const loadingRef = useRef(false); // Track if we're currently loading
  const loadedPathRef = useRef(null); // Track which path we've loaded
  
  // Early return if no modelPath
  if (!modelPath) {
    if (onLoadingChange) onLoadingChange(false);
    return null;
  }
  
  // Load the model manually with timeout handling
  useEffect(() => {
    if (!modelPath) return;
    
    // If we already have this model loaded, don't reload
    if (gltf && gltf.scene && loadedPathRef.current === modelPath) {
      return;
    }
    
    // If we're already loading this path, don't start another load
    if (loadingRef.current && loadedPathRef.current === modelPath) {
      return;
    }
    
    // If the path changed, reset state
    if (loadedPathRef.current !== modelPath) {
      setLoadError(null);
      setGltf(null);
      loadingRef.current = false;
    }
    
    loadingRef.current = true;
    loadedPathRef.current = modelPath;
    
    if (onLoadingChange) onLoadingChange(true);
    
    let timeoutId;
    let loadingAborted = false;
    
    // First, verify the file is accessible
    const verifyAndLoad = async () => {
      try {
        // Quick HEAD check to verify file exists (with short timeout)
        const verifyController = new AbortController();
        const verifyTimeout = setTimeout(() => verifyController.abort(), 5000);
        
        const verifyResponse = await fetch(modelPath, {
          method: 'HEAD',
          signal: verifyController.signal
        });
        
        clearTimeout(verifyTimeout);
        
        if (!verifyResponse.ok) {
          throw new Error(`Model file not accessible: HTTP ${verifyResponse.status}`);
        }
      } catch (verifyError) {
        // Continue with load attempt even if verification fails
      }
      
      // Set up timeout (90 seconds)
      timeoutId = setTimeout(() => {
        if (!loadingAborted) {
          loadingAborted = true;
          loadingRef.current = false;
          const error = new Error(`Model loading timed out after 90 seconds. URL: ${modelPath}`);
          setLoadError(error.message);
          setGltf(null);
          if (onErrorChange) onErrorChange(error.message);
          if (onLoadingChange) onLoadingChange(false);
        }
      }, 90000);
      
      // Fetch the file and parse with GLTFLoader
      const fetchAndLoadModel = async () => {
        try {
          if (onLoadingChange) onLoadingChange(true);
          
          const fetchController = new AbortController();
          const fetchTimeout = setTimeout(() => {
            fetchController.abort();
          }, 85000);
          
          const response = await fetch(modelPath, {
            signal: fetchController.signal,
            headers: {
              'Accept': 'model/gltf-binary, application/octet-stream, */*'
            }
          });
          
          clearTimeout(fetchTimeout);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          
          const loadingManager = new LoadingManager();
          
          loadingManager.onError = (url) => {
            if (!loadingAborted) {
              loadingAborted = true;
              clearTimeout(timeoutId);
              const errorMsg = `Failed to parse 3D model: ${url}`;
              setLoadError(errorMsg);
              setGltf(null);
              if (onErrorChange) onErrorChange(errorMsg);
              if (onLoadingChange) onLoadingChange(false);
            }
          };
          
          const loader = new GLTFLoader(loadingManager);
          
          loader.parse(
            arrayBuffer,
            modelPath,
            (loadedGltf) => {
              if (loadingAborted) {
                return;
              }
              
              clearTimeout(timeoutId);
              loadingRef.current = false;
              setGltf(loadedGltf);
              setLoadError(null);
              if (onErrorChange) onErrorChange(null);
              if (onLoadingChange) onLoadingChange(false);
            },
            (error) => {
              if (loadingAborted) {
                return;
              }
              
              clearTimeout(timeoutId);
              
              let errorMsg = error.message || 'Failed to parse 3D model';
              if (error.message?.includes('CORS')) {
                errorMsg = 'CORS error: Model file blocked by cross-origin policy.';
              } else if (error.message?.includes('Invalid')) {
                errorMsg = 'Invalid 3D model file. Please check the file format.';
              }
              
              setLoadError(errorMsg);
              setGltf(null);
              if (onErrorChange) onErrorChange(errorMsg);
              if (onLoadingChange) onLoadingChange(false);
            }
          );
          
        } catch (fetchError) {
          if (loadingAborted) return;
          
          clearTimeout(timeoutId);
          loadingRef.current = false;
          
          let errorMsg = fetchError.message || 'Failed to download/parse 3D model';
          
          if (fetchError.name === 'AbortError' || fetchError.message?.includes('aborted')) {
            errorMsg = 'Download timed out: The model file took too long to download. The file may be too large or the connection is slow.';
          } else if (fetchError.message?.includes('Failed to fetch') || fetchError.message?.includes('network') || fetchError.message?.includes('ERR_')) {
            errorMsg = 'Network error: Cannot reach model file. Please check your connection and that the server is running.';
          } else if (fetchError.message?.includes('404') || fetchError.message?.includes('not found')) {
            errorMsg = 'File not found: The 3D model file does not exist on the server.';
          } else if (fetchError.message?.includes('CORS')) {
            errorMsg = 'CORS error: Model file blocked by cross-origin policy. Please check server CORS settings.';
          }
          
          setLoadError(errorMsg);
          setGltf(null);
          if (onErrorChange) onErrorChange(errorMsg);
          if (onLoadingChange) onLoadingChange(false);
        }
      };
      
      fetchAndLoadModel();
      
      // Cleanup function
      return () => {
        loadingRef.current = false;
      };
    };
    
    verifyAndLoad();
    
    return () => {
      loadingAborted = true;
      loadingRef.current = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [modelPath]); // Remove onLoadingChange and onErrorChange from dependencies to prevent re-runs
  
  // Process the loaded model
  useEffect(() => {
    if (gltf && gltf.scene) {
      try {
        gltf.scene.traverse((child) => {
          if (child.isMesh && child.material) {
            if (child.material.map) {
              child.material.color.setHex(0xffffff);
              child.material.roughness = 0.5;
              child.material.metalness = 0.0;
              child.material.emissive.setHex(0x000000);
              child.material.transparent = false;
              child.material.opacity = 1.0;
              child.material.side = 2;
              
              child.material.map.needsUpdate = true;
              child.material.map.flipY = false;
              child.material.map.generateMipmaps = true;
              child.material.map.minFilter = 1006;
              child.material.map.magFilter = 1003;
              child.material.map.wrapS = 1000;
              child.material.map.wrapT = 1000;
              
              child.material.needsUpdate = true;
            }
          }
        });
        
        if (onLoadingChange) onLoadingChange(false);
        if (onErrorChange) onErrorChange(null);
      } catch (processError) {
        if (onLoadingChange) onLoadingChange(false);
        if (onErrorChange) onErrorChange(processError.message || 'Failed to process 3D model');
      }
    }
  }, [gltf, modelPath, onLoadingChange, onErrorChange]);

  if (loadError) {
    return null;
  }

  if (!gltf || !gltf.scene) {
    return null;
  }
  
  return <primitive object={gltf.scene} />;
};


// 360-degree rotation component
const RotatingModel = ({ children, isRotating }) => {
  const groupRef = useRef();
  
  useFrame((state, delta) => {
    if (isRotating && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5; // Rotate 0.5 radians per second
    }
  });
  
  return (
    <group ref={groupRef}>
      {children}
    </group>
  );
};

// Enhanced 3D Model Component with Material Support and Dimension Scaling
const CustomizableModel = ({ modelPath, customizations, isRotating360 }) => {
  const [isMobile, setIsMobile] = useState(false);
  const meshRef = useRef();

  // Detect mobile for responsive scaling
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Model loading state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const loadingRef = useRef(true);
  
  // Sync ref with state
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);
  
  // Add extended timeout for model loading (allows time for download + useGLTF processing)
  useEffect(() => {
    if (!modelPath) {
      setLoading(false);
      loadingRef.current = false;
      return;
    }
    
    // Reset loading state when model path changes
    setLoading(true);
    loadingRef.current = true;
    setError(null);
    
    const timeoutId = setTimeout(() => {
      if (loadingRef.current) {
        setLoading(false);
        loadingRef.current = false;
        setError(`Model loading timed out after 120 seconds. The file may be too large or slow to load. URL: ${modelPath}`);
      }
    }, 120000);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [modelPath]);

  // Process materials when scene is loaded - preserve original materials
  useEffect(() => {
    // Materials are now handled in ModelComponent
  }, []);


  // Apply dimension scaling to the model (keeping original colors)
  useEffect(() => {
    if (meshRef.current && customizations?.dimensions) {
      const { width, depth, height1 } = customizations.dimensions;
      
      // Convert cm to a scale factor (assuming base dimensions are around 60x51x87 cm)
      const baseWidth = 60;
      const baseDepth = 51;
      const baseHeight = 87;
      
      const scaleX = width / baseWidth;
      const scaleY = height1 / baseHeight;
      const scaleZ = depth / baseDepth;
      
      // Apply the scaling to the model
      meshRef.current.scale.set(scaleX, scaleY, scaleZ);
    }
  }, [customizations?.dimensions]);



  // If no model path is provided, show a placeholder geometry
  if (!modelPath) {
    const { width, depth, height1 } = customizations?.dimensions || { width: 60, depth: 51, height1: 87 };
    
    // Convert cm to 3D units (scale down for display)
    const scaleX = width / 60;
    const scaleY = height1 / 87;
    const scaleZ = depth / 51;
    
    return (
      <group>
        {/* Fallback 3D geometry - simple cabinet representation */}
        <mesh position={[0, 0, 0]} scale={[scaleX, scaleY, scaleZ]}>
          <boxGeometry args={[2, 2.5, 1]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        <mesh position={[0, 1.2 * scaleY, 0.51 * scaleZ]} scale={[scaleX, scaleY, scaleZ]}>
          <boxGeometry args={[1.8, 0.1, 0.02]} />
          <meshStandardMaterial color="#D2691E" />
        </mesh>
        <mesh position={[0, -1.2 * scaleY, 0.51 * scaleZ]} scale={[scaleX, scaleY, scaleZ]}>
          <boxGeometry args={[1.8, 0.1, 0.02]} />
          <meshStandardMaterial color="#D2691E" />
        </mesh>
        <Html center position={[0, 3 * scaleY, 0]}>
          <div className="model-placeholder">
            <svg className="placeholder-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
            <h3>{error ? 'Loading Error' : 'Preview Mode'}</h3>
            <p className="placeholder-subtitle">
              {error ? `Failed to load 3D model: ${error}` : '3D model not available - showing placeholder'}
            </p>
            {modelPath && (
              <p className="placeholder-note">Model path: {modelPath}</p>
            )}
          </div>
        </Html>
      </group>
    );
  }

  // Show error message if there's an error
  if (error) {
    return (
      <Html center>
        <div className="model-placeholder">
          <svg className="placeholder-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <h3>Loading Error</h3>
          <p className="placeholder-subtitle">Failed to load 3D model: {error}</p>
          <p className="placeholder-note">Please try refreshing the page</p>
        </div>
      </Html>
    );
  }
  
  // Only render ModelComponent if we have a modelPath and no error
  if (!modelPath) {
    return null;
  }

  return (
    <>
      {/* Show loading overlay if still loading */}
      {loading && modelPath && (
        <Html center position={[0, 2, 0]}>
          <div className="model-placeholder" style={{ pointerEvents: 'none', zIndex: 1000 }}>
            <h3>Loading 3D Preview...</h3>
            <p className="placeholder-subtitle">Please wait while we load the 3D model</p>
            <p className="placeholder-note">Loading: {modelPath}</p>
          </div>
        </Html>
      )}
      
      <RotatingModel isRotating={isRotating360}>
        <group 
          ref={meshRef}
          position={[0, 0, 0]}
          scale={isMobile ? [1.1, 1.1, 1.1] : [1.2, 1.2, 1.2]} // Reduced scale for mobile (10%) vs desktop (20%)
        >
          {/* Always render ModelComponent so it can update loading state */}
          {modelPath && (
            <>
              {loading && <LoadingBox />}
              <ErrorBoundary onError={setError}>
                <ModelComponent 
                  modelPath={modelPath} 
                  onLoadingChange={setLoading}
                  onErrorChange={setError}
                />
              </ErrorBoundary>
            </>
          )}
        </group>
      </RotatingModel>
    </>
  );
};

// Error Boundary component for React Three Fiber
const ErrorBoundary = ({ children, onError }) => {
  useEffect(() => {
    const handleError = (event) => {
      console.error('Error in 3D model:', event.error);
      if (onError) {
        onError(event.error.message || 'Failed to load 3D model');
      }
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [onError]);
  
  return <>{children}</>;
};

// Model Error Catcher for Suspense errors
const ModelErrorCatcher = ({ children }) => {
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection in 3D model:', event.reason);
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);
  
  return <>{children}</>;
};

// Main 3D Products Component
const ThreeDProducts = () => {
  const { slug } = useParams(); // Changed from 'id' to 'slug' to match route param
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showCartSuccessModal, setShowCartSuccessModal] = useState(false);
  const [showARViewer, setShowARViewer] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCameraPanelVisible, setIsCameraPanelVisible] = useState(true);
  const [isCameraTransitioning, setIsCameraTransitioning] = useState(false);
  
  const { addToCart } = useCart();
  

  // Detect mobile device and update camera settings
  useEffect(() => {
    const checkMobile = () => {
      // More robust mobile detection
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isMobileWidth = window.innerWidth <= 768;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Consider it mobile if it's a mobile device OR (mobile width AND touch device)
      const mobile = isMobileDevice || (isMobileWidth && isTouchDevice);
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const { formatPrice } = useCurrency();

  // Add global error handler for touch events
  useEffect(() => {
    const handleGlobalError = (event) => {
      if (event.error && event.error.message && event.error.message.includes('reading \'x\'')) {
        console.warn('Touch event error caught and handled:', event.error);
        event.preventDefault();
        return false;
      }
    };
    
    window.addEventListener('error', handleGlobalError);
    return () => window.removeEventListener('error', handleGlobalError);
  }, []);

  // Add CSP violation listener
  useEffect(() => {
    const handleCSPViolation = (event) => {
      // Check if this is a non-critical violation from 3D libraries or blob URLs
      const isNonCritical = (
        // From 3D libraries
        (event.sourceFile && (
          event.sourceFile.includes('its-fine') ||
          event.sourceFile.includes('react-three-fiber') ||
          event.sourceFile.includes('three')
        )) ||
        // Blob URL violations (commonly used by Three.js for textures and assets)
        (event.blockedURI === 'blob' || event.blockedURI?.startsWith('blob:')) ||
        // Data URL violations (used for embedded assets)
        (event.blockedURI === 'data' || event.blockedURI?.startsWith('data:'))
      );
      
      if (isNonCritical) {
        // Log as info instead of warning for non-critical violations
        const violationType = event.blockedURI === 'blob' || event.blockedURI?.startsWith('blob:') 
          ? 'blob URL (used by Three.js for textures/assets)'
          : event.blockedURI === 'data' || event.blockedURI?.startsWith('data:')
          ? 'data URL (used for embedded assets)'
          : '3D library';
          
        console.info(`ℹ️ Non-critical CSP violation from ${violationType}:`, {
          sourceFile: event.sourceFile,
          violatedDirective: event.violatedDirective,
          blockedURI: event.blockedURI
        });
        return; // Don't show error to user for non-critical violations
      }
      
      // Log critical violations as warnings
      console.warn('🚨 Critical CSP Violation detected:', {
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        originalPolicy: event.originalPolicy,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber,
        effectiveDirective: event.effectiveDirective,
        statusCode: event.statusCode
      });
      
      // If it's related to 3D model loading, show a user-friendly message
      if (event.blockedURI && (event.blockedURI.includes('.glb') || event.blockedURI.includes('.gltf'))) {
        setError('3D model loading blocked by security policy. Please contact support.');
      }
    };

    document.addEventListener('securitypolicyviolation', handleCSPViolation);
    
    return () => {
      document.removeEventListener('securitypolicyviolation', handleCSPViolation);
    };
  }, []);
  const [customizations, setCustomizations] = useState({
    dimensions: {
      width: 60,
      depth: 51,
      height1: 87
    },
    colors: {
      body: 'Light Wood',
      front: 'Light Wood',
      plinth: 'Light Wood',
      back: 'White',
      handle: 'Silver',
      handlePosition: 'Right',
      doorOpening: 'Left',
      lastCabinet: 'No',
      fittings: 'Standard'
    }
  });

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const response = await getProductById(slug);
        setProduct(response.product);
      } catch (error) {
        console.error('Error loading product:', error);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadProduct();
    }
  }, [slug]);

  // Auto-open AR viewer if URL has ?ar=true and user is on mobile
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shouldOpenAR = urlParams.get('ar') === 'true';
    
    if (shouldOpenAR && isMobile && product) {
      // Small delay to ensure page is loaded
      setTimeout(() => {
        setShowARViewer(true);
        // Clean up URL to remove ?ar=true after opening
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }, 500);
    }
  }, [isMobile, product, slug]);

  const [priceAdjustment, setPriceAdjustment] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const [cameraAngle, setCameraAngle] = useState('front');
  const [isRotating360, setIsRotating360] = useState(false);
  const controlsRef = useRef();
  const cameraRef = useRef();
  const modelRef = useRef();

  // Use the uploaded 3D model from the product, or show placeholder
  const modelPath = getModel3dUrl(product);
  
  // Debug model path
  useEffect(() => {
    if (product) {
      console.log('Product data:', {
        model3d: product.model3d,
        has3dModel: product.has3dModel,
        modelPath: modelPath
      });
    }
  }, [product, modelPath]);

  // Calculate price adjustments
  useEffect(() => {
    let adjustment = 0;
    
    // Hardware adjustments
    if (customizations.colors.fittings === 'Premium') adjustment += 25;
    if (customizations.colors.fittings === 'Luxury') adjustment += 50;
    
    setPriceAdjustment(adjustment);
  }, [customizations]);

  const handleCustomizationChange = (section, key, value) => {
    setCustomizations(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  // Handle dimension changes with visual feedback
  const handleDimensionChange = (dimension, value) => {
    setIsResizing(true);
    handleCustomizationChange('dimensions', dimension, parseInt(value));
    
    // Reset resizing state after a short delay
    setTimeout(() => {
      setIsResizing(false);
    }, 100);
  };

  const handleResetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  // Handle 360-degree rotation
  const handle360Rotation = () => {
    setIsRotating360(!isRotating360);
  };

  // Camera angle configurations - Responsive for mobile and desktop
  const cameraAngles = {
    left: { 
      position: isMobile ? [-3, 1.5, 0] : [-3, 1.5, 0], 
      target: [0, 0, 0] 
    },
    right: { 
      position: isMobile ? [3, 1.5, 0] : [3, 1.5, 0], 
      target: [0, 0, 0] 
    },
    front: { 
      position: isMobile ? [0, 1.5, 4] : [0, 1.5, 3], 
      target: [0, 0, 0] 
    },
    back: { 
      position: isMobile ? [0, 1.5, -4] : [0, 1.5, -3], 
      target: [0, 0, 0] 
    },
    top: { 
      position: isMobile ? [0, 4, 0] : [0, 5, 0], 
      target: [0, 0, 0] 
    },
    topLeft: { 
      position: isMobile ? [-2.5, 3, 2.5] : [-2, 4, 2], 
      target: [0, 0, 0] 
    },
    topRight: { 
      position: isMobile ? [2.5, 3, 2.5] : [2, 4, 2], 
      target: [0, 0, 0] 
    }
  };

  const handleCameraAngleChange = (angle) => {
    setCameraAngle(angle);
    setIsCameraTransitioning(true);
    
    // Use a timeout to ensure the controls are ready
    setTimeout(() => {
      if (controlsRef.current) {
        const config = cameraAngles[angle];
        if (config) {
          // Smoothly animate camera to new position
          const controls = controlsRef.current;
          const camera = controls.object;
          
          // Set new position and target
          camera.position.set(...config.position);
          controls.target.set(...config.target);
          
          // Force update
          controls.update();
          
          // Also update the camera reference if it exists
          if (cameraRef.current) {
            cameraRef.current.position.set(...config.position);
            cameraRef.current.lookAt(...config.target);
          }
          
          // End transition after a short delay
          setTimeout(() => {
            setIsCameraTransitioning(false);
          }, 300);
        } else {
          setIsCameraTransitioning(false);
        }
      } else {
        setIsCameraTransitioning(false);
      }
    }, 100);
  };

  // Calculate pricing from real product data
  const basePrice = product?.price || 0;
  const hasDiscount = product?.hasDiscount && product?.discountInfo;
  const currentPrice = hasDiscount ? product.discountInfo.discountedPrice : basePrice;
  const originalPrice = hasDiscount ? basePrice : null;
  const discountPercentage = hasDiscount && product.discountInfo.discountType === 'percentage' 
    ? product.discountInfo.discountValue 
    : null;

  // Handle add to cart - exactly like product detail page
  const handleAddToCart = () => {
    if (product && quantity > 0) {
      // Create product object with customization data
      const productWithCustomization = {
        ...product,
        customizations: {
          width: customizations.width,
          height: customizations.height,
          depth: customizations.depth
        }
      };
      
      try {
        addToCart(productWithCustomization, quantity, {
          width: customizations.width,
          height: customizations.height,
          depth: customizations.depth
        });
        setShowCartSuccessModal(true);
      } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Failed to add item to cart. Please try again.');
      }
    } else {
      alert('Please select a valid quantity to add to cart.');
    }
  };

  if (loading) {
    return (
      <div className="three-d-customization">
        <div className="loading-container">
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '2rem',
            gap: '1rem'
          }}>
            <AudioLoader size="large" color="#F0B21B" />
            <p>Loading 3D Products...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="three-d-customization">
        <div className="error-container">
          <h2>Product Not Found</h2>
          <p>{error || 'The product you are looking for does not exist or is no longer available.'}</p>
          <Link to="/products" className="btn btn-primary">
            Browse All Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="three-d-customization">
      <PageHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: '3D Products Furniture', href: '/3d-products-furniture' },
          { label: 'Products', href: '/products' },
          { label: '3D Products' }
        ]}
        title="3D Products"
        subtitle="Design and customize your perfect furniture with our interactive 3D configurator"
      />

      <div className="customization-layout">
        {/* 3D Viewer - Left Side */}
        <div className="viewer-container">
          <div className="viewer-controls-top">
            <button 
              className={`btn-360 ${isRotating360 ? 'active' : ''}`}
              onClick={handle360Rotation}
              title={isRotating360 ? 'Stop 360° Rotation' : 'Start 360° Rotation'}
            >
              <svg className="icon-360" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                <path d="M12 3v9l4-4"/>
              </svg>
              <span>360°</span>
            </button>
            
            <button 
              className="btn-ar"
              onClick={() => {
                // Show QR code on desktop, AR viewer on mobile (like IKEA Place)
                if (isMobile) {
                  setShowARViewer(true);
                } else {
                  setShowQRCode(true);
                }
              }}
              title={isMobile ? "View in AR" : "View in AR (Scan QR code with phone)"}
            >
              <svg className="icon-ar" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
              <span>AR</span>
            </button>
            
            {isResizing && (
              <div className="resizing-indicator">
                <span>Resizing...</span>
              </div>
            )}
          </div>

          {/* Camera Angle Panel */}
          <div className={`camera-angle-panel ${!isCameraPanelVisible ? 'hidden' : ''}`}>
            <div className="camera-angle-header">
              <h3>Camera Angle</h3>
              {!isMobile && (
                <button 
                  className="camera-panel-toggle"
                  onClick={() => setIsCameraPanelVisible(!isCameraPanelVisible)}
                  title={isCameraPanelVisible ? 'Hide Camera Panel' : 'Show Camera Panel'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
            <div className="camera-angle-options">
              <button 
                className={`camera-angle-btn ${cameraAngle === 'left' ? 'active' : ''} ${isCameraTransitioning && cameraAngle === 'left' ? 'transitioning' : ''}`}
                onClick={() => handleCameraAngleChange('left')}
                title="Left View"
                disabled={isCameraTransitioning}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3h6l6 18 3-9h6"/>
                  <path d="M14 3h7v7"/>
                </svg>
                <span>LEFT</span>
              </button>
              
              <button 
                className={`camera-angle-btn ${cameraAngle === 'right' ? 'active' : ''} ${isCameraTransitioning && cameraAngle === 'right' ? 'transitioning' : ''}`}
                onClick={() => handleCameraAngleChange('right')}
                title="Right View"
                disabled={isCameraTransitioning}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3h6l6 18 3-9h6"/>
                  <path d="M14 3h7v7"/>
                </svg>
                <span>RIGHT</span>
              </button>
              
              <button 
                className={`camera-angle-btn ${cameraAngle === 'front' ? 'active' : ''} ${isCameraTransitioning && cameraAngle === 'front' ? 'transitioning' : ''}`}
                onClick={() => handleCameraAngleChange('front')}
                title="Front View"
                disabled={isCameraTransitioning}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                </svg>
                <span>FRONT</span>
              </button>
              
              <button 
                className={`camera-angle-btn ${cameraAngle === 'back' ? 'active' : ''} ${isCameraTransitioning && cameraAngle === 'back' ? 'transitioning' : ''}`}
                onClick={() => handleCameraAngleChange('back')}
                title="Back View"
                disabled={isCameraTransitioning}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                </svg>
                <span>BACK</span>
              </button>
              
              <button 
                className={`camera-angle-btn ${cameraAngle === 'top' ? 'active' : ''} ${isCameraTransitioning && cameraAngle === 'top' ? 'transitioning' : ''}`}
                onClick={() => handleCameraAngleChange('top')}
                title="Top View"
                disabled={isCameraTransitioning}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3h6l6 18 3-9h6"/>
                  <path d="M14 3h7v7"/>
                </svg>
                <span>TOP</span>
              </button>
              
              <button 
                className={`camera-angle-btn ${cameraAngle === 'topLeft' ? 'active' : ''} ${isCameraTransitioning && cameraAngle === 'topLeft' ? 'transitioning' : ''}`}
                onClick={() => handleCameraAngleChange('topLeft')}
                title="Top Left View"
                disabled={isCameraTransitioning}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3h6l6 18 3-9h6"/>
                  <path d="M14 3h7v7"/>
                </svg>
                <span>TOP LEFT</span>
              </button>
              
              <button 
                className={`camera-angle-btn ${cameraAngle === 'topRight' ? 'active' : ''} ${isCameraTransitioning && cameraAngle === 'topRight' ? 'transitioning' : ''}`}
                onClick={() => handleCameraAngleChange('topRight')}
                title="Top Right View"
                disabled={isCameraTransitioning}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3h6l6 18 3-9h6"/>
                  <path d="M14 3h7v7"/>
                </svg>
                <span>TOP RIGHT</span>
              </button>
            </div>
          </div>
          
          {/* Show Camera Panel Button (when hidden on desktop) */}
          {!isMobile && !isCameraPanelVisible && (
            <button 
              className="show-camera-panel-btn"
              onClick={() => setIsCameraPanelVisible(true)}
              title="Show Camera Panel"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
              <span>Camera</span>
            </button>
          )}
          
          <div className="canvas-container">
            <Canvas
              camera={{ 
                position: isMobile ? [0, 1.5, 4] : [0, 1.5, 3], 
                fov: isMobile ? 65 : 60 
              }}
              shadows
              gl={{ 
                antialias: true, 
                alpha: true,
                powerPreference: "high-performance",
                preserveDrawingBuffer: true,
                failIfMajorPerformanceCaveat: false
              }}
              onCreated={({ gl, scene, camera }) => {
                // Enhanced WebGL context loss handling
                let contextLostHandler = null;
                let contextRestoredHandler = null;
                
                contextLostHandler = (event) => {
                  console.warn('⚠️ WebGL context lost, attempting to restore...');
                  event.preventDefault();
                  
                  // Attempt to restore context after a short delay
                  setTimeout(() => {
                    try {
                      // Force a canvas resize to trigger context restoration
                      const canvas = gl.domElement;
                      const width = canvas.width;
                      const height = canvas.height;
                      canvas.width = width;
                      canvas.height = height;
                      console.log('🔄 Context restoration triggered');
                    } catch (error) {
                      console.error('Failed to trigger context restoration:', error);
                    }
                  }, 100);
                };
                
                contextRestoredHandler = () => {
                  console.log('✅ WebGL context restored successfully');
                  
                  // Re-render scene
                  try {
                    gl.render(scene, camera);
                  } catch (error) {
                    console.warn('Re-render after context restore failed:', error);
                  }
                };
                
                gl.domElement.addEventListener('webglcontextlost', contextLostHandler, false);
                gl.domElement.addEventListener('webglcontextrestored', contextRestoredHandler, false);
                
                // Cleanup
                return () => {
                  if (gl.domElement) {
                    gl.domElement.removeEventListener('webglcontextlost', contextLostHandler);
                    gl.domElement.removeEventListener('webglcontextrestored', contextRestoredHandler);
                  }
                };
              }}
            >
              <SafeEnvironment />
              
              <React.Suspense 
                fallback={
                  <Html center>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: '1rem'
                    }}>
                      <AudioLoader size="large" color="#F0B21B" />
                      <p>Loading 3D Model...</p>
                      {modelPath && (
                        <p style={{ fontSize: '0.8em', opacity: 0.7 }}>
                          Loading: {modelPath}
                        </p>
                      )}
                    </div>
                  </Html>
                }
              >
                <ModelErrorCatcher>
                  <CustomizableModel
                    modelPath={modelPath}
                    customizations={customizations}
                    isRotating360={isRotating360}
                  />
                </ModelErrorCatcher>
              </React.Suspense>
              
              <SafeOrbitControls
                isMobile={isMobile}
                ref={controlsRef}
              />
              
              <PerspectiveCamera 
                ref={cameraRef} 
                makeDefault 
                position={isMobile ? [0, 1.5, 4] : [0, 1.5, 3]} 
              />
            </Canvas>
          </div>
        </div>

        {/* Customization Panel - Right Side */}
        <div className="customization-panel">
          {/* Adjust Dimensions Section */}
          <div className="customization-section">
            <div className="section-header">
              <svg className="section-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h6l6 18 3-9h6"/>
                <path d="M14 3h7v7"/>
              </svg>
              <span className="section-title">Adjust dimensions</span>
            </div>
            
            <div className="dimension-controls">
              <div className="dimension-control">
                <label>WIDTH (50-80 cm)</label>
                <div className="slider-container">
                  <input
                    type="range"
                    min="50"
                    max="80"
                    step="1"
                    value={customizations.dimensions.width}
                    onChange={(e) => handleDimensionChange('width', e.target.value)}
                    className="dimension-slider"
                  />
                  <span className="dimension-value">{customizations.dimensions.width} cm ({Math.round(customizations.dimensions.width * 0.393701 * 100) / 100}")</span>
                </div>
              </div>

              <div className="dimension-control">
                <label>DEPTH (40-70 cm)</label>
                <div className="slider-container">
                  <input
                    type="range"
                    min="40"
                    max="70"
                    step="1"
                    value={customizations.dimensions.depth}
                    onChange={(e) => handleDimensionChange('depth', e.target.value)}
                    className="dimension-slider"
                  />
                  <span className="dimension-value">{customizations.dimensions.depth} cm ({Math.round(customizations.dimensions.depth * 0.393701 * 100) / 100}")</span>
                </div>
              </div>

              <div className="dimension-control">
                <label>HEIGHT (70-100 cm)</label>
                <div className="slider-container">
                  <input
                    type="range"
                    min="70"
                    max="100"
                    step="1"
                    value={customizations.dimensions.height1}
                    onChange={(e) => handleDimensionChange('height1', e.target.value)}
                    className="dimension-slider"
                  />
                  <span className="dimension-value">{customizations.dimensions.height1} cm ({Math.round(customizations.dimensions.height1 * 0.393701 * 100) / 100}")</span>
                </div>
              </div>

            </div>
          </div>

          {/* Adjust Colors and Options Section */}
          <div className="customization-section">
            <div className="section-header">
              <svg className="section-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
              </svg>
              <span className="section-title">Model Information</span>
            </div>
            
            <div className="info-section">
              <div className="info-content">
                <p>This 3D model displays with its original uploaded colors and materials. Use the dimension controls above to adjust the size of the model.</p>
              </div>
            </div>
            
            {/* Add to Cart Section - Now integrated into Model Information */}
            <div className="add-to-cart-section">
              <div className="quantity-price-row">
                <div className="quantity-input">
                  <label>Qty:</label>
                  <input 
                    type="number" 
                    value={quantity} 
                    min="1" 
                    max={product?.stockQuantity || 999}
                    className="quantity-field"
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
                
                <div className="price-display">
                  {originalPrice && (
                    <span className="original-price">{formatPrice(originalPrice)}</span>
                  )}
                  <span className="current-price">{formatPrice(currentPrice)}</span>
                </div>
              </div>
              
              <button 
                className="add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={!product || quantity <= 0 || (product?.stockQuantity && quantity > product.stockQuantity)}
              >
                ADD TO CART
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Cart Success Modal */}
      <CartSuccessModal
        isOpen={showCartSuccessModal}
        onClose={() => setShowCartSuccessModal(false)}
        product={product}
        quantity={quantity}
        onViewCart={() => navigate('/cart')}
        onContinueShopping={() => navigate('/products')}
      />

      {/* AR Viewer Modal - Only shown on mobile */}
      <ARViewer
        isOpen={showARViewer}
        onClose={() => setShowARViewer(false)}
        product={product}
        modelPath={modelPath}
      />

      {/* QR Code Modal - Only shown on desktop */}
      <QRCodeModal
        isOpen={showQRCode}
        onClose={() => setShowQRCode(false)}
        product={product}
        arUrl={`${window.location.origin}/3d-products/${product?.slug || slug}?ar=true`}
      />
      
    </div>
  );
};

export default ThreeDProducts;