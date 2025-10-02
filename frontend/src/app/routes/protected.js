// Protected Routes - Require authentication
import React from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '../../features/auth/components/ProtectedRoute';

// Feature pages
import { CartPage } from '../../features/cart';
import { CheckoutPage, PaymentPage, OrderSuccessPage } from '../../features/checkout';
import { OrdersPage } from '../../features/orders';
import { AccountPage } from '../../features/account';

const protectedRoutes = [
  {
    path: '/cart',
    element: (
      <ProtectedRoute>
        <CartPage />
      </ProtectedRoute>
    )
  },
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
