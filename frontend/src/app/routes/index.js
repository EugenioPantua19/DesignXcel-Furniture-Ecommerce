// Main Router Configuration
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Route configurations
import publicRoutes from './public';
import protectedRoutes from './protected';
import adminRoutes from './admin';

// Route renderer helper
const renderRoutes = (routes) => {
  return routes.map((route, index) => (
    <Route key={index} path={route.path} element={route.element} />
  ));
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      {renderRoutes(publicRoutes)}
      
      {/* Protected Routes */}
      {renderRoutes(protectedRoutes)}
      
      {/* Admin Routes */}
      {renderRoutes(adminRoutes)}
      
      {/* Catch all route - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
