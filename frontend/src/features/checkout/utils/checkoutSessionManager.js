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
            const accessToken = localStorage.getItem('accessToken');
            const authToken = localStorage.getItem('authToken');
            const userData = localStorage.getItem('userData');
            const user = localStorage.getItem('user');
            
            // Use either userData or user (for compatibility)
            const userInfo = userData || user;
            
            
            const token = accessToken || authToken;
            
            // Check if JWT token is expired
            if (token) {
                try {
                    const parts = token.split('.');
                    if (parts.length === 3) {
                        const payload = JSON.parse(atob(parts[1]));
                        const currentTime = Math.floor(Date.now() / 1000);
                        const isExpired = payload.exp < currentTime;
                        
                        if (isExpired) {
                            sessionManager.clearSession();
                            return { 
                                valid: false, 
                                error: 'JWT token expired',
                                shouldRedirect: true 
                            };
                        }
                    }
                } catch (error) {
                    // Token format error - continue with validation
                }
            }
            
            if (!token || !userInfo) {
                return { 
                    valid: false, 
                    error: 'No authentication data found',
                    shouldRedirect: true 
                };
            }

            // Check if session needs validation
            if (!sessionManager.needsValidation()) {
                return { 
                    valid: true, 
                    user: JSON.parse(userInfo) 
                };
            }

            // Skip session validation if we have valid user data
            if (userInfo) {
                try {
                    const parsedUserData = JSON.parse(userInfo);
                    if (parsedUserData && parsedUserData.id && parsedUserData.email) {
                        return { 
                            valid: true, 
                            user: parsedUserData 
                        };
                    }
                } catch (parseError) {
                    // Continue to session validation
                }
            }

            // Perform session validation
            const validation = await authService.validateSession();
            
            if (validation.success && validation.user) {
                sessionManager.updateValidationTimestamp();
                return { 
                    valid: true, 
                    user: validation.user 
                };
            } else {
                return { 
                    valid: false, 
                    error: validation.error || validation.message || 'Session validation failed',
                    shouldRedirect: true 
                };
            }
        } catch (error) {
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
        
        
        return validation.valid;
    }

    // Handle checkout-specific errors
    handleCheckoutError(error, endpoint) {
        if (error.response && error.response.status === 401) {
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
