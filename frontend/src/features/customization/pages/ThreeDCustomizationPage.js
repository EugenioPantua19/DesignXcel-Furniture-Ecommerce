import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  useGLTF, 
  PerspectiveCamera,
  Html
} from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';
import { Link, useParams } from 'react-router-dom';
import { getProductById } from '../../products/services/productService';
import { useCart } from '../../../shared/contexts/CartContext';
import { useCurrency } from '../../../shared/contexts/CurrencyContext';
import ModernPageHeader from '../../../shared/components/layout/ModernPageHeader';
import { ContactSection } from '../../../shared/components/layout';
import CartSuccessModal from '../../../shared/components/ui/CartSuccessModal';
import './3d-customization.css';

// Self-contained Environment component that doesn't rely on external HDR files
const SafeEnvironment = () => {
  return (
    <>
      {/* Neutral lighting setup to preserve original model colors */}
      <ambientLight intensity={0.6} color="#ffffff" />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={0.8}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight 
        position={[-5, 5, -5]} 
        intensity={0.4}
        color="#ffffff"
      />
      <pointLight 
        position={[0, 10, 0]} 
        intensity={0.3}
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

// Custom hook for loading 3D models with proper error handling
const useModelLoader = (modelPath) => {
  const [scene, setScene] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!modelPath) {
      setScene(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Use GLTFLoader directly for better control
    const loader = new GLTFLoader();
    
    // Add timeout for loading
    const timeoutId = setTimeout(() => {
      setError('Loading timeout - model took too long to load');
      setLoading(false);
    }, 30000); // 30 second timeout
    
    // Add error handling for CSP violations
    const handleCSPError = (error) => {
      if (error.message && error.message.includes('CSP')) {
        console.warn('CSP violation detected, trying alternative loading method');
        setError('Content Security Policy violation - model loading restricted');
        setLoading(false);
        return;
      }
    };
    
    loader.load(
      modelPath,
      (gltf) => {
        clearTimeout(timeoutId);
        
        // Log material information for debugging
        console.log('GLTF loaded:', gltf);
        console.log('Scene:', gltf.scene);
        
        // Traverse and log material information
        gltf.scene.traverse((child) => {
          if (child.isMesh && child.material) {
            console.log('Mesh found:', child.name, 'Material:', child.material);
            console.log('Material type:', child.material.type);
            console.log('Material color:', child.material.color);
            console.log('Material map:', child.material.map);
            console.log('Material roughness:', child.material.roughness);
            console.log('Material metalness:', child.material.metalness);
          }
        });
        
        setScene(gltf.scene);
        setLoading(false);
        setError(null);
        console.log('3D model loaded successfully:', modelPath);
      },
      (progress) => {
        if (progress.total > 0) {
          const percent = (progress.loaded / progress.total) * 100;
          console.log('Loading progress:', percent.toFixed(1) + '%');
        }
      },
      (err) => {
        clearTimeout(timeoutId);
        console.error('Failed to load 3D model:', err);
        
        // Check for CSP violations
        if (err.message && (err.message.includes('CSP') || err.message.includes('Content Security Policy'))) {
          setError('Content Security Policy violation - model loading restricted. Please check CSP settings.');
        } else {
          setError(`Failed to load model: ${err.message || 'Unknown error'}`);
        }
        
        setLoading(false);
        setScene(null);
      }
    );

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
    };
  }, [modelPath]);

  return { scene, loading, error };
};


// Enhanced 3D Model Component with Material Support and Dimension Scaling
const CustomizableModel = ({ modelPath, customizations }) => {
  const [materials, setMaterials] = useState({});
  const [originalMaterials, setOriginalMaterials] = useState({});
  const meshRef = useRef();
  
  // Use the custom model loader hook
  const { scene, loading, error } = useModelLoader(modelPath);

  // Process materials when scene is loaded - preserve original materials
  useEffect(() => {
    if (scene) {
      const materialMap = {};
      const originalMap = {};
      
      scene.traverse((child) => {
        if (child.isMesh && child.material) {
          const materialId = child.name || 'default';
          
          // Clone the original material to preserve it
          const originalMaterial = child.material.clone();
          originalMap[materialId] = originalMaterial;
          
          // Keep reference to current material
          materialMap[materialId] = child.material;
          
          // Ensure material properties are preserved
          if (child.material.map) {
            child.material.map.needsUpdate = true;
          }
          if (child.material.normalMap) {
            child.material.normalMap.needsUpdate = true;
          }
          if (child.material.roughnessMap) {
            child.material.roughnessMap.needsUpdate = true;
          }
          if (child.material.metalnessMap) {
            child.material.metalnessMap.needsUpdate = true;
          }
          
          // Force material update
          child.material.needsUpdate = true;
        }
      });
      
      setMaterials(materialMap);
      setOriginalMaterials(originalMap);
      
      console.log('Materials processed:', Object.keys(materialMap));
      console.log('Original materials preserved:', Object.keys(originalMap));
    }
  }, [scene]);

  // Function to restore original materials
  const restoreOriginalMaterials = () => {
    if (scene && Object.keys(originalMaterials).length > 0) {
      scene.traverse((child) => {
        if (child.isMesh && child.material) {
          const materialId = child.name || 'default';
          if (originalMaterials[materialId]) {
            // Restore the original material
            child.material = originalMaterials[materialId].clone();
            child.material.needsUpdate = true;
            console.log('Restored original material for:', materialId);
          }
        }
      });
    }
  };

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

  // Restore original materials when scene changes
  useEffect(() => {
    if (scene && Object.keys(originalMaterials).length > 0) {
      restoreOriginalMaterials();
    }
  }, [scene, originalMaterials]);


  // If no model path is provided or there's an error, show a placeholder geometry
  if (!modelPath || error) {
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

  // If no scene is loaded and still loading, show a loading placeholder
  if (!scene && loading && modelPath) {
    return (
      <group>
        {/* Animated loading geometry */}
        <LoadingBox />
        <Html center position={[0, 2, 0]}>
          <div className="model-placeholder">
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
            <h3>Loading 3D Preview...</h3>
            <p className="placeholder-subtitle">Please wait while we load the 3D model</p>
            <p className="placeholder-note">Loading: {modelPath}</p>
          </div>
        </Html>
      </group>
    );
  }

  // If no scene is loaded and not loading, show the no preview message
  if (!scene) {
    return (
      <Html center>
        <div className="model-placeholder">
          <svg className="placeholder-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21,15 16,10 5,21"/>
          </svg>
          <h3>No Preview 3D</h3>
          <p className="placeholder-subtitle">3D model preview is not available for this product</p>
          <p className="placeholder-note">You can still customize dimensions and options below</p>
        </div>
      </Html>
    );
  }

  return (
    <>
      {scene && (
        <primitive 
          ref={meshRef}
          object={scene} 
          position={[0, 0, 0]}
        />
      )}
    </>
  );
};

// Main 3D Customization Component
const ThreeDCustomization = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showCartSuccessModal, setShowCartSuccessModal] = useState(false);
  
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();

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
        const response = await getProductById(id);
        console.log('3D Customization - Product data loaded:', response.product);
        console.log('3D Customization - Model data:', {
          model3d: response.product?.model3d,
          has3dModel: response.product?.has3dModel,
          modelPath: response.product?.model3d ? 
            (response.product.model3d.startsWith('/') ? `http://localhost:5000${response.product.model3d}` : response.product.model3d) :
            null
        });
        setProduct(response.product);
      } catch (error) {
        console.error('Error loading product:', error);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProduct();
    }
  }, [id]);

  const [priceAdjustment, setPriceAdjustment] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const [cameraAngle, setCameraAngle] = useState('front');
  const controlsRef = useRef();
  const cameraRef = useRef();

  // Use the uploaded 3D model from the product, or show placeholder
  const modelPath = product?.model3d ? 
    (product.model3d.startsWith('/') ? `http://localhost:5000${product.model3d}` : product.model3d) :
    null; // No fallback model, will show placeholder

  // Debug logging
  useEffect(() => {
    console.log('3D Customization Debug:', {
      product: product,
      modelPath: modelPath,
      hasModel3d: !!product?.model3d,
      has3dModel: product?.has3dModel,
      modelPathValid: !!modelPath,
      modelPathType: typeof modelPath
    });
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

  // Camera angle configurations
  const cameraAngles = {
    left: { position: [-5, 2, 0], target: [0, 0, 0] },
    right: { position: [5, 2, 0], target: [0, 0, 0] },
    front: { position: [0, 2, 5], target: [0, 0, 0] },
    back: { position: [0, 2, -5], target: [0, 0, 0] },
    top: { position: [0, 8, 0], target: [0, 0, 0] },
    topLeft: { position: [-3, 6, 3], target: [0, 0, 0] },
    topRight: { position: [3, 6, 3], target: [0, 0, 0] }
  };

  const handleCameraAngleChange = (angle) => {
    setCameraAngle(angle);
    if (controlsRef.current && cameraRef.current) {
      const config = cameraAngles[angle];
      if (config) {
        // Animate camera to new position
        controlsRef.current.object.position.set(...config.position);
        controlsRef.current.target.set(...config.target);
        controlsRef.current.update();
      }
    }
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
      addToCart(productWithCustomization, quantity);
      setShowCartSuccessModal(true);
    }
  };

  if (loading) {
    return (
      <div className="three-d-customization">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading 3D Customization...</p>
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
      <ModernPageHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Custom Furniture', href: '/custom-furniture' },
          { label: 'Products', href: '/products' },
          { label: '3D Customization' }
        ]}
        title="3D Customization"
        subtitle="Design and customize your perfect furniture with our interactive 3D configurator"
      />

      <div className="customization-layout">
        {/* 3D Viewer - Left Side */}
        <div className="viewer-container">
          <div className="viewer-controls-top">
            <button className="btn-360">
              <svg className="icon-360" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                <path d="M12 3v9l4-4"/>
              </svg>
              <span>360°</span>
            </button>
            
            {isResizing && (
              <div className="resizing-indicator">
                <div className="resizing-spinner"></div>
                <span>Resizing...</span>
              </div>
            )}
          </div>

          {/* Camera Angle Panel */}
          <div className="camera-angle-panel">
            <div className="camera-angle-header">
              <h3>Camera Angle</h3>
            </div>
            <div className="camera-angle-options">
              <button 
                className={`camera-angle-btn ${cameraAngle === 'left' ? 'active' : ''}`}
                onClick={() => handleCameraAngleChange('left')}
                title="Left View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3h6l6 18 3-9h6"/>
                  <path d="M14 3h7v7"/>
                </svg>
                <span>LEFT</span>
              </button>
              
              <button 
                className={`camera-angle-btn ${cameraAngle === 'right' ? 'active' : ''}`}
                onClick={() => handleCameraAngleChange('right')}
                title="Right View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3h6l6 18 3-9h6"/>
                  <path d="M14 3h7v7"/>
                </svg>
                <span>RIGHT</span>
              </button>
              
              <button 
                className={`camera-angle-btn ${cameraAngle === 'front' ? 'active' : ''}`}
                onClick={() => handleCameraAngleChange('front')}
                title="Front View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                </svg>
                <span>FRONT</span>
              </button>
              
              <button 
                className={`camera-angle-btn ${cameraAngle === 'back' ? 'active' : ''}`}
                onClick={() => handleCameraAngleChange('back')}
                title="Back View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                </svg>
                <span>BACK</span>
              </button>
              
              <button 
                className={`camera-angle-btn ${cameraAngle === 'top' ? 'active' : ''}`}
                onClick={() => handleCameraAngleChange('top')}
                title="Top View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3h6l6 18 3-9h6"/>
                  <path d="M14 3h7v7"/>
                </svg>
                <span>TOP</span>
              </button>
              
              <button 
                className={`camera-angle-btn ${cameraAngle === 'topLeft' ? 'active' : ''}`}
                onClick={() => handleCameraAngleChange('topLeft')}
                title="Top Left View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3h6l6 18 3-9h6"/>
                  <path d="M14 3h7v7"/>
                </svg>
                <span>TOP LEFT</span>
              </button>
              
              <button 
                className={`camera-angle-btn ${cameraAngle === 'topRight' ? 'active' : ''}`}
                onClick={() => handleCameraAngleChange('topRight')}
                title="Top Right View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3h6l6 18 3-9h6"/>
                  <path d="M14 3h7v7"/>
                </svg>
                <span>TOP RIGHT</span>
              </button>
            </div>
          </div>
          
          <div className="canvas-container">
            <Canvas
              camera={{ position: [0, 2, 5], fov: 50 }}
              shadows
              gl={{ antialias: true, alpha: true }}
            >
              <SafeEnvironment />
              
              <React.Suspense fallback={
                <Html center>
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading 3D Model...</p>
                  </div>
                </Html>
              }>
                <CustomizableModel
                  modelPath={modelPath}
                  customizations={customizations}
                />
              </React.Suspense>
              
              <OrbitControls
                ref={controlsRef}
                enablePan
                enableZoom
                enableRotate
                maxPolarAngle={Math.PI}
                minPolarAngle={0}
                maxDistance={20}
                minDistance={2}
              />
              
              <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 2, 5]} />
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
                <label>WIDTH</label>
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
                <label>DEPTH</label>
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
                <label>HEIGHT </label>
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
        open={showCartSuccessModal}
        onClose={() => setShowCartSuccessModal(false)}
        product={product}
        quantity={quantity}
      />
      
      {/* Contact Section with Map */}
      <ContactSection />
    </div>
  );
};

export default ThreeDCustomization;
