import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Language context
const LanguageContext = createContext();

// Language action types
const LANGUAGE_ACTIONS = {
    SET_LANGUAGE: 'SET_LANGUAGE',
    LOAD_LANGUAGE: 'LOAD_LANGUAGE'
};

// Translation data
const translations = {
    en: {
        // Navigation
        home: 'HOME',
        products: 'Products',
        customFurniture: '3D Custom Furniture',
        projects: 'Projects',
        about: 'About Us',
        contact: 'Contact Us',
        payments: 'Payments',
        
        // Common
        search: 'Search',
        searchProducts: 'Search products...',
        searchPlaceholder: 'Search for furniture, chairs, desks...',
        addToCart: 'Add to Cart',
        buyNow: 'Buy Now',
        viewDetails: 'View Details',
        quantity: 'Quantity',
        price: 'Price',
        total: 'Total',
        subtotal: 'Subtotal',
        tax: 'Tax',
        shipping: 'Shipping',
        
        // Product related
        featuredProducts: 'Featured Products',
        newArrivals: 'New Arrivals',
        bestSellers: 'Best Sellers',
        productCatalog: 'Product Catalog',
        allProducts: 'All Products',
        inStock: 'In Stock',
        outOfStock: 'Out of Stock',
        
        // Filters
        filters: 'Filters',
        category: 'Category',
        priceRange: 'Price Range',
        sortBy: 'Sort By',
        clearFilters: 'Clear All Filters',
        
        // Cart
        cart: 'Cart',
        emptyCart: 'Your cart is empty',
        removeFromCart: 'Remove from cart',
        updateQuantity: 'Update quantity',
        
        // Checkout
        checkout: 'Checkout',
        proceedToCheckout: 'Proceed to Checkout',
        orderSummary: 'Order Summary',
        
        // Messages
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        
        // Header
        specialOffer: 'SPECIAL OFFER',
        offerText: 'Get 25% off premium office furniture collections - Limited time offer ending soon!',
        shopNow: 'Shop Now',
        excellenceInDesign: 'EXCELLENCE IN DESIGN'
    },
    fil: {
        // Navigation
        home: 'TAHANAN',
        products: 'Mga Produkto',
        customFurniture: '3D Custom na Muwebles',
        projects: 'Mga Proyekto',
        about: 'Tungkol Sa Amin',
        contact: 'Makipag-ugnayan',
        payments: 'Mga Bayad',
        
        // Common
        search: 'Maghanap',
        searchProducts: 'Maghanap ng mga produkto...',
        searchPlaceholder: 'Maghanap ng muwebles, upuan, mesa...',
        addToCart: 'Idagdag sa Cart',
        buyNow: 'Bilhin Ngayon',
        viewDetails: 'Tingnan ang Detalye',
        quantity: 'Dami',
        price: 'Presyo',
        total: 'Kabuuan',
        subtotal: 'Subtotal',
        tax: 'Buwis',
        shipping: 'Pagpapadala',
        
        // Product related
        featuredProducts: 'Mga Tampok na Produkto',
        newArrivals: 'Mga Bagong Dating',
        bestSellers: 'Mga Pinakamabenta',
        productCatalog: 'Katalogo ng Produkto',
        allProducts: 'Lahat ng Produkto',
        inStock: 'May Stock',
        outOfStock: 'Walang Stock',
        
        // Filters
        filters: 'Mga Filter',
        category: 'Kategorya',
        priceRange: 'Saklaw ng Presyo',
        sortBy: 'Ayusin Ayon Sa',
        clearFilters: 'Burahin Lahat ng Filter',
        
        // Cart
        cart: 'Cart',
        emptyCart: 'Walang laman ang inyong cart',
        removeFromCart: 'Alisin sa cart',
        updateQuantity: 'I-update ang dami',
        
        // Checkout
        checkout: 'Checkout',
        proceedToCheckout: 'Magpatuloy sa Checkout',
        orderSummary: 'Buod ng Order',
        
        // Messages
        loading: 'Naglo-load...',
        error: 'May Mali',
        success: 'Tagumpay',
        
        // Header
        specialOffer: 'ESPESYAL NA ALOK',
        offerText: 'Makakuha ng 25% discount sa premium office furniture collections - Limitadong oras lamang!',
        shopNow: 'Mamili Ngayon',
        excellenceInDesign: 'KAHUSAYAN SA DISENYO'
    }
};

// Initial state
const initialState = {
    currentLanguage: 'en',
    languages: [
        { code: 'en', name: 'English' },
        { code: 'fil', name: 'Filipino' }
    ],
    translations
};

// Language reducer
const languageReducer = (state, action) => {
    switch (action.type) {
        case LANGUAGE_ACTIONS.SET_LANGUAGE:
            return {
                ...state,
                currentLanguage: action.payload
            };
        case LANGUAGE_ACTIONS.LOAD_LANGUAGE:
            return {
                ...state,
                currentLanguage: action.payload
            };
        default:
            return state;
    }
};

// Language provider component
export const LanguageProvider = ({ children }) => {
    const [state, dispatch] = useReducer(languageReducer, initialState);

    // Load language from localStorage on mount
    useEffect(() => {
        const savedLanguage = localStorage.getItem('selected-language');
        if (savedLanguage) {
            dispatch({ type: LANGUAGE_ACTIONS.LOAD_LANGUAGE, payload: savedLanguage });
        }
    }, []);

    // Save language to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('selected-language', state.currentLanguage);
    }, [state.currentLanguage]);

    // Set language
    const setLanguage = (languageCode) => {
        dispatch({ type: LANGUAGE_ACTIONS.SET_LANGUAGE, payload: languageCode });
    };

    // Get translation for a key
    const t = (key) => {
        return state.translations[state.currentLanguage][key] || key;
    };

    // Get current language info
    const getCurrentLanguage = () => {
        return state.languages.find(l => l.code === state.currentLanguage) || state.languages[0];
    };

    const value = {
        // State
        currentLanguage: state.currentLanguage,
        languages: state.languages,
        
        // Actions
        setLanguage,
        
        // Utilities
        t,
        getCurrentLanguage
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

// Custom hook to use language context
export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export default LanguageContext;
