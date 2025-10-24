/**
 * 3D Model Debugging Utilities
 * Helps debug 3D model loading issues
 */

import { getModel3dUrl, getImageUrl } from './imageUtils';

/**
 * Test 3D model URL accessibility
 * @param {string} modelUrl - The 3D model URL to test
 * @returns {Promise<Object>} - Test results
 */
export const testModelUrl = async (modelUrl) => {
  if (!modelUrl) {
    return {
      success: false,
      error: 'No model URL provided',
      url: modelUrl
    };
  }

  try {
    console.log('Testing 3D model URL:', modelUrl);
    
    const response = await fetch(modelUrl, { 
      method: 'HEAD',
      mode: 'cors'
    });
    
    const result = {
      success: response.ok,
      status: response.status,
      url: modelUrl,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
      accessible: response.ok
    };
    
    console.log('3D Model URL test result:', result);
    return result;
    
  } catch (error) {
    const result = {
      success: false,
      error: error.message,
      url: modelUrl,
      accessible: false
    };
    
    console.error('3D Model URL test failed:', result);
    return result;
  }
};

/**
 * Debug product 3D model data
 * @param {Object} product - Product object
 * @returns {Object} - Debug information
 */
export const debugProduct3dModel = (product) => {
  if (!product) {
    return {
      hasProduct: false,
      error: 'No product provided'
    };
  }

  const debug = {
    hasProduct: true,
    productId: product.id,
    productName: product.name,
    modelFields: {
      model3d: product.model3d,
      Model3D: product.Model3D,
      model3D: product.model3D,
      model_3d: product.model_3d
    },
    has3dModel: product.has3dModel,
    has3DModel: product.has3DModel,
    constructedUrl: getModel3dUrl(product),
    backendUrl: process.env.REACT_APP_API_URL
  };

  console.log('3D Model Debug Info:', debug);
  return debug;
};

/**
 * Test all 3D model URLs for a product
 * @param {Object} product - Product object
 * @returns {Promise<Object>} - Test results
 */
export const testProduct3dModel = async (product) => {
  const debug = debugProduct3dModel(product);
  const modelUrl = getModel3dUrl(product);
  
  if (!modelUrl) {
    return {
      ...debug,
      testResult: {
        success: false,
        error: 'No 3D model URL found'
      }
    };
  }

  const testResult = await testModelUrl(modelUrl);
  
  return {
    ...debug,
    testResult
  };
};

/**
 * List all possible 3D model field variations
 * @param {Object} product - Product object
 * @returns {Array} - Array of possible model URLs
 */
export const getAllPossibleModelUrls = (product) => {
  if (!product) return [];
  
  const possibleFields = [
    'model3d', 'Model3D', 'model3D', 'model_3d',
    'Model3d', 'MODEL3D', 'model_3D'
  ];
  
  const urls = [];
  
  possibleFields.forEach(field => {
    if (product[field]) {
      urls.push({
        field,
        value: product[field],
        constructedUrl: getImageUrl(product[field])
      });
    }
  });
  
  return urls;
};
