// Checkout Session Manager
// Handles session validation specifically for checkout flow

import { authService } from '../../auth/services/authService';
import sessionManager from '../../../shared/utils/sessionManager';

class CheckoutSessionManager {
    constructor() {
        this.isValidating = false;
        this.validationPromise = null;
    }

    // Validate session before checkout operations
    async validateCheckoutSession() {
        // Prevent multiple simultaneous validations
        if (this.isValidating && this.validationPromise) {
            return this.validationPromise;
        }

        this.isValidating = true;
        this.validationPromise = this._performValidation();

        try {
            const result = await this.validationPromise;
            return result;
        } finally {
            this.isValidating = false;
            this.validationPromise = null;
        }
    }

    async _performValidation() {
        try {
            console.log('🛒 Validating session for checkout...');
            
            // Check if we have basic auth data
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');
            
            if (!token || !user) {
                console.log('🔒 No auth data found for checkout');
                return { 
                    valid: false, 
                    error: 'No authentication data found',
                    shouldRedirect: true 
                };
            }

            // Check if session needs validation
            if (!sessionManager.needsValidation()) {
                console.log('✅ Session recently validated, proceeding with checkout');
                return { 
                    valid: true, 
                    user: JSON.parse(user) 
                };
            }

            // Perform session validation
            console.log('🔄 Performing session validation for checkout...');
            const validation = await authService.validateSession();
            
            if (validation.success && validation.user) {
                console.log('✅ Checkout session validation successful');
                sessionManager.updateValidationTimestamp();
                return { 
                    valid: true, 
                    user: validation.user 
                };
            } else {
                console.log('❌ Checkout session validation failed');
                return { 
                    valid: false, 
                    error: validation.error || 'Session validation failed',
                    shouldRedirect: true 
                };
            }
        } catch (error) {
            console.error('🚨 Checkout session validation error:', error);
            
            // Don't redirect on network errors, just warn
            if (error.message && error.message.includes('Network')) {
                return { 
                    valid: true, // Allow checkout to continue
                    warning: 'Network error during validation, proceeding with cached session',
                    user: JSON.parse(localStorage.getItem('user') || '{}')
                };
            }
            
            return { 
                valid: false, 
                error: error.message || 'Session validation failed',
                shouldRedirect: error.message && error.message.includes('401')
            };
        }
    }

    // Pre-validate session before starting checkout
    async ensureValidSession() {
        const validation = await this.validateCheckoutSession();
        
        if (!validation.valid && validation.shouldRedirect) {
            // Clear invalid session data
            sessionManager.clearSession();
            
            // Redirect to login with return URL
            const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `/login?returnUrl=${returnUrl}`;
            return false;
        }
        
        if (validation.warning) {
            console.warn('⚠️ Checkout proceeding with warning:', validation.warning);
        }
        
        return validation.valid;
    }

    // Handle checkout-specific errors
    handleCheckoutError(error, endpoint) {
        console.error(`🚨 Checkout error on ${endpoint}:`, error);
        
        if (error.response && error.response.status === 401) {
            console.log('🔒 401 error during checkout - session expired');
            
            // Show user-friendly message
            const message = 'Your session has expired. Please log in again to continue with checkout.';
            
            // You can integrate with your notification system here
            if (window.showNotification) {
                window.showNotification(message, 'error');
            } else {
                alert(message);
            }
            
            // Clear session and redirect
            sessionManager.clearSession();
            const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `/login?returnUrl=${returnUrl}`;
            
            return true; // Handled
        }
        
        return false; // Not handled
    }

    // Get session info for debugging
    getSessionDebugInfo() {
        return {
            ...sessionManager.getSessionInfo(),
            isValidating: this.isValidating,
            hasValidationPromise: !!this.validationPromise
        };
    }
}

// Export singleton instance
export const checkoutSessionManager = new CheckoutSessionManager();
export default checkoutSessionManager;
