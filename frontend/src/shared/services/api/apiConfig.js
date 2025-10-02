// Centralized API Configuration
// This service provides configuration for all API communications

class ApiConfig {
  constructor() {
    // Base API URL from environment variables
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    // Force direct backend connection in development
    if (this.environment === 'development') {
      this.baseURL = 'http://localhost:5000';
    }
    
    // Validate base URL
    if (!this.baseURL.startsWith('http')) {
      console.warn('⚠️ API URL should start with http:// or https://');
    }
    this.apiVersion = process.env.REACT_APP_API_VERSION || 'v1';
    this.websocketURL = process.env.REACT_APP_WEBSOCKET_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    // Environment settings
    this.environment = process.env.REACT_APP_ENVIRONMENT || 'development';
    this.debugMode = process.env.REACT_APP_DEBUG_MODE === 'true';
    this.logLevel = process.env.REACT_APP_LOG_LEVEL || 'info';
    
    // Feature flags
    this.features = {
      configurator3D: process.env.REACT_APP_ENABLE_3D_CONFIGURATOR === 'true',
      realTimeUpdates: process.env.REACT_APP_ENABLE_REAL_TIME_UPDATES === 'true',
      adminDashboard: process.env.REACT_APP_ENABLE_ADMIN_DASHBOARD === 'true',
      paymentProcessing: process.env.REACT_APP_ENABLE_PAYMENT_PROCESSING === 'true'
    };
    
    // Payment configuration
    this.payment = {
      // Payment configuration removed - using Stripe only
    };
    
    // Asset paths
    this.assets = {
      modelsPath: process.env.REACT_APP_MODELS_PATH || '/models',
      imagesPath: process.env.REACT_APP_IMAGES_PATH || '/images',
      assetsURL: process.env.REACT_APP_ASSETS_URL || '/'
    };
    
    // API endpoints
    this.endpoints = {
      auth: '/api/auth',
      products: '/api/products',
      inventory: '/api/inventory',
      orders: '/api/orders',
      suppliers: '/api/suppliers',
      admin: '/api/admin',
      payments: '/api/payments',
      health: '/health'
    };
  }

  // Get full API URL
  getApiUrl(endpoint = '') {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseURL}${cleanEndpoint}`;
  }

  // Get WebSocket URL
  getWebSocketUrl() {
    return this.websocketURL;
  }

  // Get endpoint URL
  getEndpoint(name) {
    const endpoint = this.endpoints[name];
    if (!endpoint) {
      throw new Error(`Unknown endpoint: ${name}`);
    }
    return this.getApiUrl(endpoint);
  }

  // Check if feature is enabled
  isFeatureEnabled(featureName) {
    return this.features[featureName] || false;
  }

  // Get asset URL
  getAssetUrl(path, type = 'assets') {
    const basePath = this.assets[`${type}Path`] || this.assets.assetsURL;
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${basePath}/${cleanPath}`;
  }

  // Get payment configuration
  getPaymentConfig() {
    return this.payment;
  }

  // Log configuration (for debugging)
  logConfig() {
    if (this.debugMode) {
      console.group('🔧 API Configuration');
      console.log('Base URL:', this.baseURL);
      console.log('WebSocket URL:', this.websocketURL);
      console.log('Environment:', this.environment);
      console.log('Features:', this.features);
      console.log('Endpoints:', this.endpoints);
      console.groupEnd();
    }
  }

  // Validate configuration
  validateConfig() {
    const errors = [];
    
    if (!this.baseURL) {
      errors.push('REACT_APP_API_URL is required');
    }
    
    // PayMongo validation removed - using Stripe only
    
    if (errors.length > 0) {
      console.error('❌ API Configuration Errors:', errors);
      return false;
    }
    
    return true;
  }
}

// Create singleton instance
const apiConfig = new ApiConfig();

// Validate configuration on startup
apiConfig.validateConfig();

// Log configuration in development
if (apiConfig.debugMode) {
  apiConfig.logConfig();
}

export default apiConfig;
