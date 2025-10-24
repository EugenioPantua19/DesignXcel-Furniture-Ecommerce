/**
 * Image URL Utility
 * Handles construction of full image URLs for backend uploads
 */

// Get the backend API URL from environment variables
const getBackendUrl = () => {
    return process.env.REACT_APP_API_URL || 'http://localhost:5000';
  };
  
  /**
   * Construct full image URL from relative path
   * @param {string} imagePath - Relative or absolute image path
   * @returns {string} - Full image URL
   */
  export const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    
    // If already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If relative path starting with /, prepend backend URL
    if (imagePath.startsWith('/')) {
      return `${getBackendUrl()}${imagePath}`;
    }
    
    // If relative path without /, assume it's in uploads folder
    return `${getBackendUrl()}/uploads/${imagePath}`;
  };
  
  /**
   * Get image URL with fallback
   * @param {string} imagePath - Image path
   * @param {string} fallback - Fallback image path
   * @returns {string} - Image URL or fallback
   */
  export const getImageUrlWithFallback = (imagePath, fallback = '/logo192.png') => {
    if (!imagePath) return fallback;
    return getImageUrl(imagePath);
  };
  
  /**
   * Handle multiple images (for product galleries)
   * @param {Array} images - Array of image paths
   * @returns {Array} - Array of full image URLs
   */
  export const getImageUrls = (images) => {
    if (!Array.isArray(images)) return [];
    return images.map(img => getImageUrl(img)).filter(url => url);
  };
  
  /**
   * Get primary image from product data
   * @param {Object} product - Product object
   * @returns {string} - Primary image URL
   */
  export const getPrimaryImageUrl = (product) => {
    if (!product) return '/logo192.png';
    
    // Try different image fields
    const imageFields = [
      product.ImageURL,
      product.image,
      product.images?.[0],
      product.Images?.[0]
    ];
    
    for (const field of imageFields) {
      if (field) {
        return getImageUrl(field);
      }
    }
    
    return '/logo192.png';
  };

  /**
   * Get 3D model URL from product data
   * @param {Object} product - Product object
   * @returns {string} - 3D model URL
   */
  export const getModel3dUrl = (product) => {
    if (!product) return null;
    
    // Try different 3D model fields
    const modelFields = [
      product.model3d,
      product.Model3D,
      product.model3D,
      product.model_3d
    ];
    
    for (const field of modelFields) {
      if (field) {
        // Check if the field contains a valid model path
        if (field.includes('.glb') || field.includes('.gltf')) {
          const modelUrl = getImageUrl(field);
          console.log('3D Model URL constructed:', {
            originalField: field,
            constructedUrl: modelUrl,
            backendUrl: getBackendUrl()
          });
          return modelUrl;
        }
      }
    }
    
    return null;
  };

  /**
   * Check if 3D model URL is accessible
   * @param {string} modelUrl - 3D model URL to check
   * @returns {Promise<boolean>} - Whether the model is accessible
   */
  export const checkModel3dAccessibility = async (modelUrl) => {
    if (!modelUrl) return false;
    
    try {
      const response = await fetch(modelUrl, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.warn('3D model accessibility check failed:', error);
      return false;
    }
  };