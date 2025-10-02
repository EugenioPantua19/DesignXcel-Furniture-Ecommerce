// Session Management Utility
// Handles automatic session refresh and validation

class SessionManager {
    constructor() {
        this.refreshInterval = null;
        this.validationInterval = 15 * 60 * 1000; // 15 minutes
        this.isRefreshing = false;
    }

    // Start automatic session refresh
    startSessionRefresh(validateSessionCallback) {
        if (this.refreshInterval) {
            this.stopSessionRefresh();
        }

        this.refreshInterval = setInterval(async () => {
            if (this.isRefreshing) return;

            try {
                this.isRefreshing = true;
                const lastValidation = localStorage.getItem('lastValidation');
                const now = Date.now();

                // Only validate if it's been more than 15 minutes since last validation
                if (!lastValidation || (now - parseInt(lastValidation)) > this.validationInterval) {
                    console.log('🔄 Performing automatic session validation');
                    await validateSessionCallback();
                }
            } catch (error) {
                console.error('Session refresh failed:', error);
            } finally {
                this.isRefreshing = false;
            }
        }, this.validationInterval);

        console.log('✅ Session refresh started');
    }

    // Stop automatic session refresh
    stopSessionRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
            console.log('🛑 Session refresh stopped');
        }
    }

    // Check if session needs validation
    needsValidation() {
        const lastValidation = localStorage.getItem('lastValidation');
        if (!lastValidation) return true;

        const now = Date.now();
        return (now - parseInt(lastValidation)) > this.validationInterval;
    }

    // Update last validation timestamp
    updateValidationTimestamp() {
        localStorage.setItem('lastValidation', Date.now().toString());
    }

    // Clear session data
    clearSession() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('lastValidation');
        this.stopSessionRefresh();
    }

    // Get session info
    getSessionInfo() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        const lastValidation = localStorage.getItem('lastValidation');

        return {
            hasToken: !!token,
            hasUser: !!user,
            lastValidation: lastValidation ? new Date(parseInt(lastValidation)) : null,
            needsValidation: this.needsValidation()
        };
    }
}

// Export singleton instance
export const sessionManager = new SessionManager();
export default sessionManager;
