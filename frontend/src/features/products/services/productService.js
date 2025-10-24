import api from '../../../shared/services/api/api';
import apiClient from '../../../shared/services/api/apiClient';

// Helper function for delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// No mock data - using real data from backend API only

export const productService = {
    async getAllProducts(params = {}) {
        try {
            // Fetch from backend API
            const response = await apiClient.get('/api/products');
            if (response.success && Array.isArray(response.products)) {
                return {
                    products: response.products,
                    total: response.products.length,
                    page: 1,
                    totalPages: 1
                };
            } else {
                throw new Error('Invalid response from backend API');
            }
        } catch (error) {
            console.error('Failed to fetch products from backend:', error);
            throw new Error('Unable to load products. Please check your connection and try again.');
        }
    },

    async getProductById(id) {
        try {
            // Fetch from backend API
            const response = await apiClient.get(`/api/products/${id}`);
            if (response.success && response.product) {
                console.log('Fetched product data from backend:', response.product);
                return { product: response.product };
            } else {
                throw new Error('Product not found');
            }
        } catch (error) {
            console.error('Failed to fetch product from backend:', error);
            throw new Error('Unable to load product details. Please check your connection and try again.');
        }
    },

    async searchProducts(query) {
        try {
            const response = await apiClient.get(`/api/products/search?q=${encodeURIComponent(query)}`);
            if (response.success && Array.isArray(response.products)) {
                return response.products;
            } else {
                return [];
            }
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    },

    async getFeaturedProducts(limit = 8) {
        try {
            // Fetch from backend API
            const response = await apiClient.get('/api/products');
            if (response.success && Array.isArray(response.products)) {
                const featuredProducts = response.products.filter(p => p.featured).slice(0, limit);
                return { products: featuredProducts };
            } else {
                throw new Error('Invalid response from backend API');
            }
        } catch (error) {
            console.error('Failed to fetch featured products from backend:', error);
            throw new Error('Unable to load featured products. Please check your connection and try again.');
        }
    },

    async getCategories() {
        try {
            // Fetch from backend API
            const response = await apiClient.get('/api/public/categories');
            if (response.success && Array.isArray(response.categories)) {
                return { categories: response.categories };
            } else {
                throw new Error('Invalid response from backend API');
            }
        } catch (error) {
            console.error('Failed to fetch categories from backend:', error);
            throw new Error('Unable to load categories. Please check your connection and try again.');
        }
    },

    async getCategoriesWithCounts() {
        try {
            // Fetch from backend API
            const response = await apiClient.get('/api/public/categories');
            if (response.success && Array.isArray(response.categories)) {
                // Transform the response to include both name and count
                return response.categories.map(category => ({
                    name: category.name || category,
                    count: category.count || 0,
                    categoryName: category.name || category
                }));
            } else {
                throw new Error('Invalid response from backend API');
            }
        } catch (error) {
            console.error('Failed to fetch categories with counts from backend:', error);
            throw new Error('Unable to load categories. Please check your connection and try again.');
        }
    },

    async getMaterials() {
        try {
            // Fetch from backend API
            const response = await apiClient.get('/api/public/materials');
            if (response.success && Array.isArray(response.materials)) {
                return { materials: response.materials };
            } else {
                throw new Error('Invalid response from backend API');
            }
        } catch (error) {
            console.error('Failed to fetch materials from backend:', error);
            throw new Error('Unable to load materials. Please check your connection and try again.');
        }
    },

    async getProductVariations(productId) {
        try {
            // Try to fetch from backend first
            const response = await apiClient.get(`/api/products/${productId}/variations`);
            if (response.success && Array.isArray(response.variations)) {
                return { variations: response.variations };
            }
        } catch (error) {
            console.log('Backend not available for variations, returning empty array');
        }

        // Fallback to empty array
        await delay(200);
        return { variations: [] };
    },

    async checkout({ productId, quantity, variationId }) {
        const payload = { productId, quantity, variationId };
        try {
            const response = await apiClient.post('/api/checkout', payload);
            return response;
        } catch (error) {
            console.error('Checkout failed:', error.message);
            throw error;
        }
    }
};

// Export individual functions for easier imports
export const getAllProducts = productService.getAllProducts;
export const getProductById = productService.getProductById;
export const searchProducts = productService.searchProducts;
export const getFeaturedProducts = productService.getFeaturedProducts;
export const getCategories = productService.getCategories;
export const getMaterials = productService.getMaterials;
export const getProductVariations = productService.getProductVariations;
