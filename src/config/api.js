// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// API endpoints
export const API_ENDPOINTS = {
  // Theme endpoints
  THEME_ACTIVE: `${API_BASE_URL}/api/theme/public`,
  THEME_UPDATE: `${API_BASE_URL}/api/theme/public`,
  
  // Background image endpoints
  BACKGROUND_IMAGE: `${API_BASE_URL}/api/background-image`,
  
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  PROFILE: `${API_BASE_URL}/api/auth/profile`,
  
  // Product endpoints
  PRODUCTS: `${API_BASE_URL}/api/products`,
  PRODUCT_BY_ID: (id) => `${API_BASE_URL}/api/products/${id}`,
  
  // Cart endpoints
  CART: `${API_BASE_URL}/api/cart`,
  CART_ADD: `${API_BASE_URL}/api/cart/add`,
  CART_REMOVE: `${API_BASE_URL}/api/cart/remove`,
  CART_UPDATE: `${API_BASE_URL}/api/cart/update`,
  
  // Order endpoints
  ORDERS: `${API_BASE_URL}/api/orders`,
  ORDER_BY_ID: (id) => `${API_BASE_URL}/api/orders/${id}`,
  
  // User endpoints
  USERS: `${API_BASE_URL}/api/users`,
  USER_BY_ID: (id) => `${API_BASE_URL}/api/users/${id}`,
  
  // WebSocket endpoint
  WEBSOCKET_URL: process.env.REACT_APP_WEBSOCKET_URL || API_BASE_URL,
};

export default API_BASE_URL;
