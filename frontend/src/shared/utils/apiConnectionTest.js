// API Connection Test Utility
// This utility helps test the connection between frontend and backend

import apiClient from '../services/api/apiClient';

class ApiConnectionTest {
    constructor() {
        this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        console.log('🔗 API Connection Test initialized with URL:', this.apiUrl);
    }

    /**
     * Test basic API connectivity
     */
    async testConnection() {
        try {
            console.log('🧪 Testing API connection...');
            
            // Test 1: Direct fetch to health endpoint
            const healthResponse = await fetch(`${this.apiUrl}/api/health`);
            const healthData = await healthResponse.json();
            
            console.log('✅ Health check response:', healthData);
            
            // Test 2: Using apiClient
            const clientResponse = await apiClient.get('/api/health');
            console.log('✅ API Client response:', clientResponse);
            
            return {
                success: true,
                healthCheck: healthData,
                apiClient: clientResponse,
                apiUrl: this.apiUrl
            };
            
        } catch (error) {
            console.error('❌ API Connection test failed:', error);
            return {
                success: false,
                error: error.message,
                apiUrl: this.apiUrl
            };
        }
    }

    /**
     * Test specific API endpoints
     */
    async testEndpoints() {
        const endpoints = [
            '/api/health',
            '/api/products',
            '/api/theme/public'
        ];

        const results = {};

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${this.apiUrl}${endpoint}`);
                results[endpoint] = {
                    status: response.status,
                    ok: response.ok,
                    statusText: response.statusText
                };
                console.log(`✅ ${endpoint}: ${response.status} ${response.statusText}`);
            } catch (error) {
                results[endpoint] = {
                    error: error.message
                };
                console.error(`❌ ${endpoint}: ${error.message}`);
            }
        }

        return results;
    }

    /**
     * Get current configuration
     */
    getConfig() {
        return {
            apiUrl: this.apiUrl,
            environment: process.env.REACT_APP_ENVIRONMENT || 'development',
            nodeEnv: process.env.NODE_ENV || 'development',
            allEnvVars: {
                REACT_APP_API_URL: process.env.REACT_APP_API_URL,
                REACT_APP_ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT,
                NODE_ENV: process.env.NODE_ENV
            }
        };
    }
}

export default new ApiConnectionTest();
