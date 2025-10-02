import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';

const RoleBasedRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated, loading } = useAuth();
  
  // Show loading while authentication is being checked
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has the required role
  const userRole = user?.role?.toLowerCase();
  const requiredRoleLower = requiredRole?.toLowerCase();
  
  return userRole === requiredRoleLower ? children : <Navigate to="/" replace />;
};

export default RoleBasedRoute; 