import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const savedToken = localStorage.getItem('token');
                const savedUser = localStorage.getItem('user');
                
                if (savedToken && savedUser) {
                    try {
                        const userData = JSON.parse(savedUser);
                        setUser(userData);
                        setToken(savedToken);
                        
                        // Validate the session with backend
                        try {
                            const validation = await authService.validateSession();
                            if (!validation.success) {
                                console.log('Session invalid, clearing auth data');
                                localStorage.removeItem('token');
                                localStorage.removeItem('user');
                                setUser(null);
                                setToken(null);
                            } else if (validation.user) {
                                // Update user data from validation response
                                setUser(validation.user);
                                localStorage.setItem('user', JSON.stringify(validation.user));
                            }
                        } catch (validationError) {
                            console.error('Session validation failed:', validationError);
                            // Don't clear auth on network errors during startup
                            // Only clear if it's explicitly an authentication error
                            if (validationError.message && validationError.message.includes('401')) {
                                localStorage.removeItem('token');
                                localStorage.removeItem('user');
                                setUser(null);
                                setToken(null);
                            }
                        }
                    } catch (error) {
                        console.error('Failed to parse saved user data:', error);
                        localStorage.clear();
                        setUser(null);
                        setToken(null);
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
            } finally {
                setLoading(false);
            }
        };
        
        initializeAuth();

        // Listen for session restoration events
        const handleSessionRestored = (event) => {
            const { user } = event.detail;
            setUser(user);
            setToken('customer-token');
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', 'customer-token');
        };

        window.addEventListener('sessionRestored', handleSessionRestored);

        // Cleanup listener on unmount
        return () => {
            window.removeEventListener('sessionRestored', handleSessionRestored);
        };
    }, []);

    const login = async (email, password, rememberMe = false) => {
        try {
            const response = await authService.login(email, password, rememberMe);
            
            if (response.success) {
                const userData = response.user;
                
                // Store authentication data
                localStorage.setItem('token', response.token || 'customer-token');
                localStorage.setItem('user', JSON.stringify(userData));
                
                setToken(response.token || 'customer-token');
                setUser(userData);

                return { success: true, user: userData };
            } else {
                return {
                    success: false,
                    error: response.message || 'Login failed'
                };
            }
        } catch (error) {
            console.error('Login failed:', error);
            return {
                success: false,
                error: error.message || 'Login failed'
            };
        }
    };

    const register = async (userData) => {
        try {
            const response = await authService.register(userData);
            
            if (response.success) {
                const newUser = response.user;
                
                localStorage.setItem('token', response.token || 'customer-token');
                localStorage.setItem('user', JSON.stringify(newUser));
                setToken(response.token || 'customer-token');
                setUser(newUser);
                
                return { success: true, user: newUser };
            } else {
                return { 
                    success: false, 
                    error: response.message || 'Registration failed' 
                };
            }
        } catch (error) {
            console.error('Registration failed:', error);
            return { 
                success: false, 
                error: error.message || 'Registration failed' 
            };
        }
    };

    const logout = async () => {
        try {
            // Call backend logout endpoint
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
            
            // Redirect to login page
            window.location.href = '/login';
        }
    };

    const updateProfile = async (profileData) => {
        try {
            const response = await authService.updateProfile(profileData);
            
            if (response.success) {
                setUser(response.data);
                localStorage.setItem('user', JSON.stringify(response.data));
                return { success: true, user: response.data };
            } else {
                return { 
                    success: false, 
                    error: response.message || 'Profile update failed' 
                };
            }
        } catch (error) {
            console.error('Profile update failed:', error);
            return { 
                success: false, 
                error: error.message || 'Profile update failed' 
            };
        }
    };

    const validateSession = async () => {
        try {
            const response = await authService.validateSession();
            if (response.success && response.user) {
                setUser(response.user);
                localStorage.setItem('user', JSON.stringify(response.user));
                return { success: true, user: response.user };
            } else {
                // Session invalid, clear auth
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
                setToken(null);
                return { success: false, error: response.message };
            }
        } catch (error) {
            console.error('Session validation error:', error);
            return { success: false, error: error.message };
        }
    };

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateProfile,
        validateSession,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
