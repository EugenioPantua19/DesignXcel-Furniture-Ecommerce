// Protected Routes - Require authentication
import React from 'react';
import ProtectedRoute from '../../features/auth/components/ProtectedRoute';
import { CheckoutPage, PaymentPage, OrderSuccessPage } from '../../features/checkout';
import { OrdersPage } from '../../features/orders';
import { AccountPage } from '../../features/account';

const protectedRoutes = [
  {
    path: '/checkout',
    element: (
      <ProtectedRoute>
        <CheckoutPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/payment',
    element: (
      <ProtectedRoute>
        <PaymentPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/order-success/:orderId',
    element: (
      <ProtectedRoute>
        <OrderSuccessPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/order-success',
    element: (
      <ProtectedRoute>
        <OrderSuccessPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/orders',
    element: (
      <ProtectedRoute>
        <OrdersPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/account',
    element: (
      <ProtectedRoute>
        <AccountPage />
      </ProtectedRoute>
    )
  }
];

export default protectedRoutes;
