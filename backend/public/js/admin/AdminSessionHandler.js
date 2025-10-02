/**
 * Admin Session Handler
 * Handles session validation and automatic logout prevention for admin pages
 */

class AdminSessionHandler {
    constructor() {
        this.isValidating = false;
        this.validationInterval = null;
        this.lastActivity = Date.now();
        
        // Start session monitoring
        this.startSessionMonitoring();
        
        // Track user activity
        this.trackUserActivity();
        
        // Override fetch to handle session errors
        this.setupFetchInterceptor();
    }

    /**
     * Start periodic session validation
     */
    startSessionMonitoring() {
        // Validate session every 5 minutes
        this.validationInterval = setInterval(() => {
            this.validateSession();
        }, 5 * 60 * 1000);

        // Also validate on page focus (when user returns to tab)
        window.addEventListener('focus', () => {
            if (Date.now() - this.lastActivity > 2 * 60 * 1000) { // 2 minutes since last activity
                this.validateSession();
            }
        });

        // Validate session on page load
        this.validateSession();
    }

    /**
     * Track user activity to determine when to validate session
     */
    trackUserActivity() {
        const events = ['click', 'keypress', 'scroll', 'mousemove'];
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.lastActivity = Date.now();
            }, { passive: true });
        });
    }

    /**
     * Validate current session with backend
     */
    async validateSession() {
        if (this.isValidating) return;
        
        this.isValidating = true;
        try {
            const response = await fetch('/api/auth/admin/validate-session', {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.handleSessionExpired();
                    return;
                }
                throw new Error('Session validation failed');
            }

            const data = await response.json();
            if (!data.success) {
                this.handleSessionExpired();
                return;
            }

            console.log('✅ Admin session validated successfully');
        } catch (error) {
            console.error('❌ Session validation error:', error);
            // Don't logout on network errors, only on auth errors
        } finally {
            this.isValidating = false;
        }
    }

    /**
     * Handle session expiration
     */
    handleSessionExpired() {
        console.log('🔒 Admin session expired, redirecting to login');
        
        // Clear validation interval
        if (this.validationInterval) {
            clearInterval(this.validationInterval);
        }

        // Show user-friendly message
        if (confirm('Your session has expired. You will be redirected to the login page.')) {
            window.location.href = '/login';
        } else {
            window.location.href = '/login';
        }
    }

    /**
     * Setup fetch interceptor to handle session errors automatically
     */
    setupFetchInterceptor() {
        const originalFetch = window.fetch;
        
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                
                // Check for session expiration in all requests
                if (response.status === 401) {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        try {
                            const errorData = await response.clone().json();
                            if (errorData.requiresLogin) {
                                this.handleSessionExpired();
                                return response;
                            }
                        } catch (e) {
                            // If we can't parse the JSON, just continue
                        }
                    }
                }
                
                return response;
            } catch (error) {
                console.error('Fetch error:', error);
                throw error;
            }
        };
    }

    /**
     * Destroy session handler (cleanup)
     */
    destroy() {
        if (this.validationInterval) {
            clearInterval(this.validationInterval);
        }
    }
}

// Auto-initialize when DOM is loaded
let adminSessionHandler = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        adminSessionHandler = new AdminSessionHandler();
    });
} else {
    adminSessionHandler = new AdminSessionHandler();
}

// Make it globally available
window.AdminSessionHandler = AdminSessionHandler;
window.adminSessionHandler = adminSessionHandler;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (adminSessionHandler) {
        adminSessionHandler.destroy();
    }
});
