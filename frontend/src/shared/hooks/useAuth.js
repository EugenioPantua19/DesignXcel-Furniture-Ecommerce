/**
 * Authentication Hook
 * Provides authentication state management and operations
 * Supports both customer and employee authentication
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import apiClient from '../services/api/apiClient';

// Create Auth Context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

/**
 * Authentication Provider Component
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);
    const [permissions, setPermissions] = useState({});
    const [sessionId, setSessionId] = useState(null);

    /**
     * Initialize authentication state
     */
    const initializeAuth = useCallback(async () => {
        try {
            setLoading(true);
            
            // Check for stored token
            const savedToken = localStorage.getItem('authToken');
            const savedUser = localStorage.getItem('userData');
            
            if (savedToken && savedUser) {
                const userData = JSON.parse(savedUser);
                setUser(userData);
                setToken(savedToken);
                
                // Verify token with server
                await checkAuthStatus();
            } else {
                // Check session-based auth
                await checkAuthStatus();
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
            clearAuthData();
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Check authentication status with server
     */
    const checkAuthStatus = useCallback(async () => {
        try {
            const response = await apiClient.get('/api/auth/status');
            
            if (response.data.success && response.data.authenticated) {
                const { user: userData, permissions: userPermissions, sessionId: userSessionId } = response.data;
                
                setUser(userData);
                setPermissions(userPermissions || {});
                setSessionId(userSessionId);
                
                // Update localStorage if we have user data
                if (userData) {
                    localStorage.setItem('userData', JSON.stringify(userData));
                }
                
                return true;
            } else {
                clearAuthData();
                return false;
            }
        } catch (error) {
            console.error('Auth status check error:', error);
            
            // If it's a 401, clear auth data
            if (error.response?.status === 401) {
                clearAuthData();
            }
            
            return false;
        }
    }, []);

    /**
     * Customer login
     */
    const loginCustomer = useCallback(async (email, password, rememberMe = false) => {
        try {
            setLoading(true);
            
            const response = await apiClient.post('/api/auth/customer/login', {
                email,
                password,
                rememberMe
            });

            if (response.data.success) {
                const { user: userData, token: authToken, sessionId: userSessionId } = response.data;
                
                setUser(userData);
                setSessionId(userSessionId);
                
                if (authToken) {
                    setToken(authToken);
                    localStorage.setItem('authToken', authToken);
                }
                
                localStorage.setItem('userData', JSON.stringify(userData));
                
                return {
                    success: true,
                    user: userData
                };
            }
            
            return {
                success: false,
                error: response.data.message || 'Login failed'
            };
            
        } catch (error) {
            console.error('Customer login error:', error);
            
            const errorMessage = error.response?.data?.message || error.message || 'Login failed';
            const errorCode = error.response?.data?.code;
            
            return {
                success: false,
                error: errorMessage,
                code: errorCode,
                isAccountInactive: errorCode === 'ACCOUNT_INACTIVE'
            };
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Customer registration
     */
    const registerCustomer = useCallback(async (userData) => {
        try {
            setLoading(true);
            
            const response = await apiClient.post('/api/auth/customer/register', userData);
            
            if (response.data.success) {
                const { user: newUser, token: authToken } = response.data;
                
                setUser(newUser);
                
                if (authToken) {
                    setToken(authToken);
                    localStorage.setItem('authToken', authToken);
                }
                
                localStorage.setItem('userData', JSON.stringify(newUser));
                
                return {
                    success: true,
                    user: newUser
                };
            }
            
            return {
                success: false,
                error: response.data.message || 'Registration failed'
            };
            
        } catch (error) {
            console.error('Customer registration error:', error);
            
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Registration failed',
                code: error.response?.data?.code
            };
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Logout user
     */
    const logout = useCallback(async () => {
        try {
            // Call logout endpoint
            await apiClient.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
            // Continue with local logout even if server call fails
        } finally {
            clearAuthData();
        }
    }, []);

    /**
     * Clear authentication data
     */
    const clearAuthData = useCallback(() => {
        setUser(null);
        setToken(null);
        setPermissions({});
        setSessionId(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
    }, []);

    /**
     * Update user profile
     */
    const updateProfile = useCallback(async (profileData) => {
        try {
            const response = await apiClient.put('/api/auth/profile', profileData);
            
            if (response.data.success) {
                const updatedUser = { ...user, ...response.data.user };
                setUser(updatedUser);
                localStorage.setItem('userData', JSON.stringify(updatedUser));
                
                return {
                    success: true,
                    user: updatedUser
                };
            }
            
            return {
                success: false,
                error: response.data.message || 'Profile update failed'
            };
            
        } catch (error) {
            console.error('Profile update error:', error);
            
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Profile update failed'
            };
        }
    }, [user]);

    /**
     * Change password
     */
    const changePassword = useCallback(async (currentPassword, newPassword, confirmPassword) => {
        try {
            const response = await apiClient.post('/api/auth/change-password', {
                currentPassword,
                newPassword,
                confirmPassword
            });
            
            if (response.data.success) {
                return {
                    success: true,
                    message: response.data.message
                };
            }
            
            return {
                success: false,
                error: response.data.message || 'Password change failed'
            };
            
        } catch (error) {
            console.error('Password change error:', error);
            
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Password change failed'
            };
        }
    }, []);

    /**
     * Refresh authentication token
     */
    const refreshToken = useCallback(async () => {
        try {
            const response = await apiClient.post('/api/auth/refresh-token');
            
            if (response.data.success) {
                const newToken = response.data.token;
                setToken(newToken);
                localStorage.setItem('authToken', newToken);
                
                return {
                    success: true,
                    token: newToken
                };
            }
            
            return {
                success: false,
                error: response.data.message || 'Token refresh failed'
            };
            
        } catch (error) {
            console.error('Token refresh error:', error);
            
            // If refresh fails, logout user
            if (error.response?.status === 401) {
                clearAuthData();
            }
            
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Token refresh failed'
            };
        }
    }, [clearAuthData]);

    /**
     * Check if user is authenticated
     */
    const isAuthenticated = Boolean(user);

    /**
     * Check if user is a customer
     */
    const isCustomer = user?.role === 'Customer' || user?.type === 'customer';

    /**
     * Check if user is an employee
     */
    const isEmployee = user?.type === 'employee' || (user?.role && user.role !== 'Customer');

    /**
     * Check if user is admin
     */
    const isAdmin = user?.role === 'Admin';

    /**
     * Get user's role
     */
    const getUserRole = () => user?.role || null;

    /**
     * Get user's permissions
     */
    const getUserPermissions = () => permissions;

    // Initialize auth on mount
    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    // Setup axios interceptors for token management
    useEffect(() => {
        const requestInterceptor = apiClient.interceptors.request.use(
            (config) => {
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        const responseInterceptor = apiClient.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (error.response?.status === 401 && !error.config._retry) {
                    error.config._retry = true;
                    
                    // Try to refresh token
                    const refreshResult = await refreshToken();
                    
                    if (refreshResult.success) {
                        // Retry the original request with new token
                        error.config.headers.Authorization = `Bearer ${refreshResult.token}`;
                        return apiClient.request(error.config);
                    } else {
                        // Refresh failed, logout user
                        clearAuthData();
                    }
                }
                
                return Promise.reject(error);
            }
        );

        // Cleanup interceptors
        return () => {
            apiClient.interceptors.request.eject(requestInterceptor);
            apiClient.interceptors.response.eject(responseInterceptor);
        };
    }, [token, refreshToken, clearAuthData]);

    // Context value
    const value = {
        // State
        user,
        token,
        loading,
        permissions,
        sessionId,
        
        // Actions
        loginCustomer,
        registerCustomer,
        logout,
        updateProfile,
        changePassword,
        refreshToken,
        checkAuthStatus,
        
        // Utilities
        isAuthenticated,
        isCustomer,
        isEmployee,
        isAdmin,
        getUserRole,
        getUserPermissions
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default useAuth;
