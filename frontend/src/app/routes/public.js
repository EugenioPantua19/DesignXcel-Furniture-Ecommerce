// Public Routes - Accessible to all users
import React from 'react';

// App-level pages
import Home from '../Home';
import About from '../About';
import Projects from '../Projects';
import Contact from '../Contact';

// Feature pages
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { ForgotPasswordPage } from '../../features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../../features/auth/pages/ResetPasswordPage';
import { ProductCatalogPage, ProductDetailPage } from '../../features/products';
import { ThreeDProductsFurniturePage, ThreeDProductsPage } from '../../features/3d-products';
import { CartPage } from '../../features/cart';
import { WishlistPage } from '../../features/wishlist';

const publicRoutes = [
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/about',
    element: <About />
  },
  {
    path: '/projects',
    element: <Projects />
  },
  {
    path: '/contact',
    element: <Contact />
  },
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />
  },
  {
    path: '/products',
    element: <ProductCatalogPage />
  },
  {
    path: '/product/:slug',
    element: <ProductDetailPage />
  },
  {
    path: '/3d-products-furniture',
    element: <ThreeDProductsFurniturePage />
  },
  {
    path: '/3d-products/:slug',
    element: <ThreeDProductsPage />
  },
  {
    path: '/cart',
    element: <CartPage />
  },
  {
    path: '/wishlist',
    element: <WishlistPage />
  }
];

export default publicRoutes;
