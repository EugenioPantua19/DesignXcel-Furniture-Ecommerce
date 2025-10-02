// Public Routes - Accessible to all users
import React from 'react';
import { Route } from 'react-router-dom';

// App-level pages
import Home from '../Home';
import About from '../About';
import Projects from '../Projects';
import Contact from '../Contact';

// Feature pages
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { ProductCatalogPage, ProductDetailPage } from '../../features/products';
import { CustomFurniturePage, ThreeDCustomizationPage } from '../../features/customization';

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
    path: '/products',
    element: <ProductCatalogPage />
  },
  {
    path: '/product/:id',
    element: <ProductDetailPage />
  },
  {
    path: '/products/:id',
    element: <ProductDetailPage />
  },
  {
    path: '/custom-furniture',
    element: <CustomFurniturePage />
  },
  {
    path: '/3d-customization/:id',
    element: <ThreeDCustomizationPage />
  }
];

export default publicRoutes;
