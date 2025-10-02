// Centralized API Client
// This service provides a configured axios instance for all API calls

import axios from 'axios';
import apiConfig from './apiConfig';

class ApiClient {
  constructor() {
    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL: apiConfig.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: true // <-- ensure cookies are sent
    });

    // Setup request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        // Only add Bearer token for admin endpoints, not customer endpoints
        // Customer endpoints use session-based authentication (cookies)
        const isCustomerEndpoint = config.url && (
          config.url.includes('/api/customer/') || 
          config.url.includes('/api/auth/customer/') ||
          config.url.includes('/api/auth/validate-session')
        );
        
        if (!isCustomerEndpoint) {
          const token = this.getAuthToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        // If sending FormData, remove default JSON content-type so the browser can set multipart boundary
        try {
          const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
          if (isFormData) {
            if (config.headers) {
              delete config.headers['Content-Type'];
              delete config.headers['content-type'];
            }
          }
        } catch (e) {
          // no-op if FormData is not available
        }

        // Add request timestamp for debugging
        if (apiConfig.debugMode) {
          config.metadata = { startTime: new Date() };
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        
        // Always log API requests in development
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        console.log(`🚀 Full URL: ${config.baseURL}${config.url}`);

        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Setup response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        // Log response time in debug mode
        if (apiConfig.debugMode && response.config.metadata) {
          const duration = new Date() - response.config.metadata.startTime;
          console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`);
        }

        return response;
      },
      (error) => {
        // Handle different error types
        if (error.response) {
          // Server responded with error status
          const { status, data } = error.response;
          
          if (status === 401) {
            // Unauthorized - handle differently for customer vs admin endpoints
            const isCustomerEndpoint = error.config?.url && (
              error.config.url.includes('/api/customer/') || 
              error.config.url.includes('/api/auth/customer/') ||
              error.config.url.includes('/api/auth/validate-session')
            );
            
            if (isCustomerEndpoint) {
              // For customer endpoints, redirect to login since they use session-based auth
              console.log('🔒 401 error for customer endpoint - redirecting to login');
              if (window.location.pathname !== '/login') {
                window.location.href = '/login';
              }
            } else if (!error.config?.url?.includes('/validate-session')) {
              // Check if this is a critical endpoint that requires immediate logout
              const criticalEndpoints = ['/api/customer/profile', '/api/auth/customer/login'];
              const isCriticalEndpoint = criticalEndpoints.some(endpoint => 
                error.config?.url?.includes(endpoint)
              );
              
              if (isCriticalEndpoint) {
                console.log('🔒 401 error on critical endpoint - clearing auth');
                this.clearAuthToken();
                localStorage.removeItem('lastValidation');
                if (window.location.pathname !== '/login') {
                  window.location.href = '/login';
                }
              } else {
                // For non-critical endpoints, just log the error but don't logout
                console.log('🔒 401 error on non-critical endpoint - continuing with cached auth');
              }
            }
          } else if (status === 403) {
            // Forbidden - check if it's an invalid token issue
            if (data.message && (data.message.includes('token') || data.message.includes('expired') || data.message.includes('invalid'))) {
              // Invalid/expired token - clear auth and redirect to login
              this.clearAuthToken();
              if (window.location.pathname !== '/login') {
                window.location.href = '/login';
              }
            } else {
              // Insufficient permissions - show access denied message
              console.error('❌ Access Denied:', data.message || 'Insufficient permissions');
            }
          } else if (status >= 500) {
            // Server error
            console.error('❌ Server Error:', data.message || 'Internal server error');
          }

          // Log error details in debug mode
          if (apiConfig.debugMode) {
            console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
              status,
              data,
              headers: error.response.headers
            });
          }
        } else if (error.request) {
          // Network error
          console.error('❌ Network Error:', error.message);
        } else {
          // Other error
          console.error('❌ Request Setup Error:', error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  // Get authentication token from localStorage
  getAuthToken() {
    return localStorage.getItem('token') || localStorage.getItem('authToken');
  }

  // Clear authentication token
  clearAuthToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('persistentAccount');
  }

  // Attempt session restoration for persistent accounts
  async attemptSessionRestoration(email) {
    try {
      console.log('🔒 Attempting session restoration for:', email);
      const response = await this.post('/api/auth/restore-session', { email });
      
      if (response.success) {
        console.log('✅ Session restored successfully');
        // Update localStorage with restored session data
        localStorage.setItem('token', 'session-token');
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('persistentAccount', 'true');
        
        // Dispatch a custom event to notify components of session restoration
        window.dispatchEvent(new CustomEvent('sessionRestored', { 
          detail: { user: response.user } 
        }));
        
        return { success: true, user: response.user };
      } else {
        console.log('❌ Session restoration failed:', response.message);
        // If restoration fails, clear auth and redirect to login
        this.clearAuthToken();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error('❌ Session restoration error:', error);
      // If restoration fails, clear auth and redirect to login
      this.clearAuthToken();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return { success: false, error: error.message };
    }
  }

  // Generic GET request
  async get(url, config = {}) {
    try {
      const response = await this.client.get(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic POST request
  async post(url, data = {}, config = {}) {
    try {
      const response = await this.client.post(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic PUT request
  async put(url, data = {}, config = {}) {
    try {
      const response = await this.client.put(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic PATCH request
  async patch(url, data = {}, config = {}) {
    try {
      const response = await this.client.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic DELETE request
  async delete(url, config = {}) {
    try {
      const response = await this.client.delete(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Handle and format errors
  handleError(error) {
    console.error('❌ API Error Details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      baseURL: error.config?.baseURL
    });
    
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.message || error.response.data?.error || 'Server error occurred';
      return new Error(message);
    } else if (error.request) {
      // Network error
      console.error('❌ Network Error - No response received:', error.request);
      return new Error('Network error - please check your connection');
    } else {
      // Other error
      console.error('❌ Other Error:', error.message);
      return new Error(error.message || 'An unexpected error occurred');
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.get('/health');
      return response;
    } catch (error) {
      console.error('❌ Backend health check failed:', error.message);
      return null;
    }
  }

  // Test connection to backend
  async testConnection() {
    try {
      const health = await this.healthCheck();
      if (health) {
        console.log('✅ Backend connection successful');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Backend connection failed:', error.message);
      return false;
    }
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;
