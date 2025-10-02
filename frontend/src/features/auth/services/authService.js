import apiClient from '../../../shared/services/api/apiClient';

export const authService = {
    async login(email, password, rememberMe = false) {
        const response = await apiClient.post('/api/auth/customer/login', { 
            email, 
            password 
        });
        return response;
    },

    async register(userData) {
        const response = await apiClient.post('/api/auth/customer/register', userData);
        return response;
    },

    async getProfile() {
        const response = await apiClient.get('/api/customer/profile');
        return response;
    },

    async updateProfile(profileData) {
        const response = await apiClient.put('/api/customer/profile', profileData);
        return response;
    },

    async logout() {
        try {
            await apiClient.post('/logout');
            return { success: true };
        } catch (error) {
            console.error('Backend logout failed:', error);
            return { success: true }; // Return success to allow local cleanup
        }
    },

    async validateSession() {
        try {
            const response = await apiClient.get('/api/auth/validate-session');
            return response;
        } catch (error) {
            console.error('Session validation failed:', error);
            return { success: false, message: error.message };
        }
    }
};
