// Admin Routes - Require admin authentication
import React from 'react';
import AdminRoute from '../../features/auth/components/AdminRoute';

// Admin feature pages
import { AdminDashboardPage, AdminOrdersPage } from '../../features/admin';

const adminRoutes = [
  {
    path: '/admin',
    element: (
      <AdminRoute allowEmployee={true}>
        <AdminDashboardPage />
      </AdminRoute>
    )
  },
  {
    path: '/admin/dashboard',
    element: (
      <AdminRoute allowEmployee={true}>
        <AdminDashboardPage />
      </AdminRoute>
    )
  },
  {
    path: '/admin/orders',
    element: (
      <AdminRoute allowEmployee={true}>
        <AdminOrdersPage />
      </AdminRoute>
    )
  }
];

export default adminRoutes;
