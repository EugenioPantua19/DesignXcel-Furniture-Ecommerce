import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminRoute = ({ children, allowEmployee = false }) => {
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
  
  // Check if user has admin or employee role
  const isAdmin = user?.role === 'Admin';
  const isEmployee = allowEmployee && (user?.role === 'Employee' || user?.role === 'Admin');
  
  if (isAdmin || isEmployee) {
    return children;
  }
  
  // Redirect to home if not authorized
  return <Navigate to="/" replace />;
};

export default AdminRoute; 