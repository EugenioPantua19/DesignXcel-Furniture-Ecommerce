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
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
        localStorage.removeItem('lastValidation');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('loginTime');
        localStorage.removeItem('persistentAccount');
        this.stopSessionRefresh();
    }

    // Get session info
    getSessionInfo() {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const user = localStorage.getItem('user');
        const userData = localStorage.getItem('userData');
        const lastValidation = localStorage.getItem('lastValidation');

        return {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            hasToken: !!accessToken,
            hasUser: !!user || !!userData,
            lastValidation: lastValidation ? new Date(parseInt(lastValidation)) : null,
            needsValidation: this.needsValidation()
        };
    }
}

// Export singleton instance with lazy initialization
let sessionManagerInstance = null;

const getSessionManager = () => {
    if (!sessionManagerInstance) {
        sessionManagerInstance = new SessionManager();
    }
    return sessionManagerInstance;
};

export const sessionManager = getSessionManager();
export default getSessionManager();
