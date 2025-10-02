// Admin Session Manager for Backend Pages
// Handles session validation and auto-refresh for admin dashboard

class AdminSessionManager {
    constructor() {
        this.validationInterval = null;
        this.checkInterval = 10 * 60 * 1000; // Check every 10 minutes
        this.isValidating = false;
    }

    // Start session monitoring
    start() {
        if (this.validationInterval) {
            this.stop();
        }

        this.validationInterval = setInterval(() => {
            this.validateSession();
        }, this.checkInterval);

        console.log('✅ Admin session monitoring started');
    }

    // Stop session monitoring
    stop() {
        if (this.validationInterval) {
            clearInterval(this.validationInterval);
            this.validationInterval = null;
            console.log('🛑 Admin session monitoring stopped');
        }
    }

    // Validate current session
    async validateSession() {
        if (this.isValidating) return;

        try {
            this.isValidating = true;
            
            const response = await fetch('/api/auth/admin/validate-session', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.log('🔒 Admin session expired - redirecting to login');
                    this.redirectToLogin();
                } else {
                    console.warn('Session validation failed with status:', response.status);
                }
            } else {
                const data = await response.json();
                if (!data.success) {
                    console.log('🔒 Admin session invalid - redirecting to login');
                    this.redirectToLogin();
                } else {
                    console.log('✅ Admin session validated successfully');
                }
            }
        } catch (error) {
            console.error('Session validation error:', error);
            // Don't redirect on network errors, just log
        } finally {
            this.isValidating = false;
        }
    }

    // Redirect to login page
    redirectToLogin() {
        this.stop();
        window.location.href = '/login';
    }

    // Show session warning
    showSessionWarning(minutesLeft) {
        const warningDiv = document.createElement('div');
        warningDiv.id = 'session-warning';
        warningDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff9800;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            font-family: Arial, sans-serif;
        `;
        warningDiv.innerHTML = `
            <strong>Session Warning</strong><br>
            Your session will expire in ${minutesLeft} minutes.<br>
            <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 10px; background: white; color: #ff9800; border: none; border-radius: 3px; cursor: pointer;">
                Refresh Session
            </button>
        `;

        // Remove existing warning
        const existing = document.getElementById('session-warning');
        if (existing) {
            existing.remove();
        }

        document.body.appendChild(warningDiv);

        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (document.getElementById('session-warning')) {
                warningDiv.remove();
            }
        }, 30000);
    }
}

// Initialize admin session manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only start on admin pages
    if (window.location.pathname.includes('/admin') || 
        window.location.pathname.includes('/dashboard')) {
        
        const adminSessionManager = new AdminSessionManager();
        adminSessionManager.start();

        // Make it globally available for debugging
        window.adminSessionManager = adminSessionManager;
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminSessionManager;
}
