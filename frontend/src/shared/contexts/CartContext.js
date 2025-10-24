import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';

// Cart action types
const CART_ACTIONS = {
    ADD_ITEM: 'ADD_ITEM',
    REMOVE_ITEM: 'REMOVE_ITEM',
    UPDATE_QUANTITY: 'UPDATE_QUANTITY',
    CLEAR_CART: 'CLEAR_CART',
    LOAD_CART: 'LOAD_CART',
    SET_LOADING: 'SET_LOADING'
};

// Cart reducer
const cartReducer = (state, action) => {
    switch (action.type) {
        case CART_ACTIONS.ADD_ITEM: {
            const { product, quantity = 1, customization = {} } = action.payload;
            
            // Extract variation data from product
            const variationId = product.selectedVariation?.id;
            const variationName = product.selectedVariation?.name;
            const useOriginalProduct = product.useOriginalProduct;
            const selectedVariation = product.selectedVariation;
            
            // Create a unique identifier that includes variation data
            const itemKey = `${product.id}-${variationId || 'original'}-${JSON.stringify(customization)}`;
            
            const existingItemIndex = state.items.findIndex(item => 
                item.product.id === product.id && 
                item.variationId === variationId &&
                JSON.stringify(item.customization) === JSON.stringify(customization)
            );

            if (existingItemIndex >= 0) {
                // Update existing item quantity
                const updatedItems = [...state.items];
                updatedItems[existingItemIndex].quantity += quantity;
                return {
                    ...state,
                    items: updatedItems
                };
            } else {
                // Add new item
                const newItem = {
                    id: itemKey,
                    product,
                    quantity,
                    customization,
                    price: (product.hasDiscount && product.discountInfo) ? product.discountInfo.discountedPrice : product.price,
                    variationId,
                    variationName,
                    useOriginalProduct,
                    selectedVariation
                };
                return {
                    ...state,
                    items: [...state.items, newItem]
                };
            }
        }

        case CART_ACTIONS.REMOVE_ITEM: {
            return {
                ...state,
                items: state.items.filter(item => item.id !== action.payload.itemId)
            };
        }

        case CART_ACTIONS.UPDATE_QUANTITY: {
            const { itemId, quantity } = action.payload;
            if (quantity <= 0) {
                return {
                    ...state,
                    items: state.items.filter(item => item.id !== itemId)
                };
            }
            return {
                ...state,
                items: state.items.map(item =>
                    item.id === itemId ? { 
                        ...item, 
                        quantity,
                        // Preserve variation data
                        variationId: item.variationId,
                        variationName: item.variationName,
                        useOriginalProduct: item.useOriginalProduct,
                        selectedVariation: item.selectedVariation
                    } : item
                )
            };
        }

        case CART_ACTIONS.CLEAR_CART: {
            return {
                ...state,
                items: []
            };
        }

        case CART_ACTIONS.LOAD_CART: {
            // Only load if we have items to load, or if current state is empty
            const shouldLoadItems = (action.payload.items && action.payload.items.length > 0) || state.items.length === 0;
            return {
                ...state,
                items: shouldLoadItems ? (action.payload.items || []) : state.items,
                isLoading: false
            };
        }

        case CART_ACTIONS.SET_LOADING: {
            return {
                ...state,
                isLoading: action.payload
            };
        }

        default:
            return state;
    }
};

// Initial cart state
const initialState = {
    items: [],
    isOpen: false,
    isLoading: true
};

// Create cart context
const CartContext = createContext();

// Cart provider component
export const CartProvider = ({ children, userId }) => {
    const [state, dispatch] = useReducer(cartReducer, initialState);
    const [previousUserId, setPreviousUserId] = useState(userId);

    // Force cart refresh (useful after login)
    const refreshCart = () => {
        console.log('[CartContext] Force refreshing cart for userId:', userId);
        const savedCart = localStorage.getItem(`shopping-cart-${userId}`);
        const guestCart = localStorage.getItem('shopping-cart-guest');
        
        if (savedCart) {
            try {
                const cartData = JSON.parse(savedCart);
                dispatch({ type: CART_ACTIONS.LOAD_CART, payload: cartData });
            } catch (error) {
                console.error('Error refreshing cart:', error);
            }
        } else if (guestCart && userId !== 'guest') {
            try {
                const guestCartData = JSON.parse(guestCart);
                if (guestCartData.items && guestCartData.items.length > 0) {
                    dispatch({ type: CART_ACTIONS.LOAD_CART, payload: guestCartData });
                    localStorage.removeItem('shopping-cart-guest');
                }
            } catch (error) {
                console.error('Error refreshing guest cart:', error);
            }
        }
    };

    // Listen for login success events to refresh cart
    useEffect(() => {
        const handleLoginSuccess = () => {
            console.log('[CartContext] Login success event received, refreshing cart');
            // Small delay to ensure user state is updated
            setTimeout(() => {
                refreshCart();
            }, 200);
        };

        window.addEventListener('loginSuccess', handleLoginSuccess);
        
        return () => {
            window.removeEventListener('loginSuccess', handleLoginSuccess);
        };
    }, [userId]);

    // Load cart from localStorage on mount or when userId changes
    useEffect(() => {
        // Skip loading if userId is still loading
        if (userId === 'loading') {
            dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
            return;
        }
        
        // Set loading to false when we start loading cart data
        dispatch({ type: CART_ACTIONS.SET_LOADING, payload: false });
        
        const savedCart = localStorage.getItem(`shopping-cart-${userId}`);
        const guestCart = localStorage.getItem('shopping-cart-guest');
        
        // Check if this is a login transition (guest -> user)
        const isLoginTransition = previousUserId === 'guest' && userId !== 'guest';
        
        if (savedCart) {
            try {
                const cartData = JSON.parse(savedCart);
                
                // If this is a login transition and we have guest cart, merge them
                if (isLoginTransition && guestCart) {
                    try {
                        const guestCartData = JSON.parse(guestCart);
                        if (guestCartData.items && guestCartData.items.length > 0) {
                            const mergedItems = [...(cartData.items || [])];
                            
                            guestCartData.items.forEach(guestItem => {
                                const existingItemIndex = mergedItems.findIndex(item => 
                                    item.product.id === guestItem.product.id && 
                                    item.variationId === guestItem.variationId &&
                                    JSON.stringify(item.customization) === JSON.stringify(guestItem.customization)
                                );
                                
                                if (existingItemIndex >= 0) {
                                    mergedItems[existingItemIndex].quantity += guestItem.quantity;
                                } else {
                                    mergedItems.push(guestItem);
                                }
                            });
                            
                            const mergedCart = { ...cartData, items: mergedItems };
                            dispatch({ type: CART_ACTIONS.LOAD_CART, payload: mergedCart });
                            localStorage.removeItem('shopping-cart-guest');
                            return;
                        }
                    } catch (error) {
                        console.error('Error merging carts during login transition:', error);
                    }
                }
                
                // Only load cart data if it has items or if current state is empty
                if (cartData.items && cartData.items.length > 0) {
                    dispatch({ type: CART_ACTIONS.LOAD_CART, payload: cartData });
                } else if (state.items.length === 0) {
                    dispatch({ type: CART_ACTIONS.LOAD_CART, payload: cartData });
                } else {
                    dispatch({ type: CART_ACTIONS.SET_LOADING, payload: false });
                }
            } catch (error) {
                console.error('Error loading cart from localStorage:', error);
                dispatch({ type: CART_ACTIONS.LOAD_CART, payload: { items: [] } });
            }
        } else if (guestCart && userId !== 'guest') {
            // If user just logged in and has no saved cart, but has guest cart items
            try {
                const guestCartData = JSON.parse(guestCart);
                
                if (guestCartData.items && guestCartData.items.length > 0) {
                    // Merge guest cart with user cart
                    dispatch({ type: CART_ACTIONS.LOAD_CART, payload: guestCartData });
                    // Clear guest cart after merging
                    localStorage.removeItem('shopping-cart-guest');
                } else {
                    dispatch({ type: CART_ACTIONS.LOAD_CART, payload: { items: [] } });
                }
            } catch (error) {
                console.error('Error merging guest cart:', error);
                dispatch({ type: CART_ACTIONS.LOAD_CART, payload: { items: [] } });
            }
        } else if (savedCart && guestCart && userId !== 'guest') {
            // If user has both saved cart and guest cart, merge them
            try {
                const savedCartData = JSON.parse(savedCart);
                const guestCartData = JSON.parse(guestCart);
                
                if (guestCartData.items && guestCartData.items.length > 0) {
                    // Merge guest cart items with saved cart
                    const mergedItems = [...(savedCartData.items || [])];
                    
                    guestCartData.items.forEach(guestItem => {
                        // Check if item already exists in saved cart
                        const existingItemIndex = mergedItems.findIndex(item => 
                            item.product.id === guestItem.product.id && 
                            item.variationId === guestItem.variationId &&
                            JSON.stringify(item.customization) === JSON.stringify(guestItem.customization)
                        );
                        
                        if (existingItemIndex >= 0) {
                            // Update quantity if item exists
                            mergedItems[existingItemIndex].quantity += guestItem.quantity;
                        } else {
                            // Add new item
                            mergedItems.push(guestItem);
                        }
                    });
                    
                    const mergedCart = { ...savedCartData, items: mergedItems };
                    dispatch({ type: CART_ACTIONS.LOAD_CART, payload: mergedCart });
                    // Clear guest cart after merging
                    localStorage.removeItem('shopping-cart-guest');
                } else {
                    dispatch({ type: CART_ACTIONS.LOAD_CART, payload: savedCartData });
                }
            } catch (error) {
                console.error('Error merging carts:', error);
                dispatch({ type: CART_ACTIONS.LOAD_CART, payload: { items: [] } });
            }
        } else {
            dispatch({ type: CART_ACTIONS.LOAD_CART, payload: { items: [] } });
        }
        
        // Update previous userId
        setPreviousUserId(userId);
    }, [userId, previousUserId]);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        // Skip saving if userId is still loading
        if (userId === 'loading') {
            return;
        }
        localStorage.setItem(`shopping-cart-${userId}`, JSON.stringify(state));
    }, [state, userId]);

    // Cart actions
    const addToCart = (product, quantity = 1, customization = {}) => {
        dispatch({
            type: CART_ACTIONS.ADD_ITEM,
            payload: { product, quantity, customization }
        });
    };

    const removeFromCart = (itemId) => {
        dispatch({
            type: CART_ACTIONS.REMOVE_ITEM,
            payload: { itemId }
        });
    };

    const updateQuantity = (itemId, quantity) => {
        console.log('[CartContext] updateQuantity called:', { itemId, quantity });
        dispatch({
            type: CART_ACTIONS.UPDATE_QUANTITY,
            payload: { itemId, quantity }
        });
    };

    const clearCart = () => {
        dispatch({ type: CART_ACTIONS.CLEAR_CART });
    };

    // Cart calculations
    const getItemCount = () => {
        return state.items.reduce((total, item) => total + item.quantity, 0);
    };

    const getSubtotal = () => {
        return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getTotal = () => {
        return getSubtotal();
    };


    const value = {
        // State
        items: state.items,
        isOpen: state.isOpen,
        isLoading: state.isLoading,
        // Actions
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart,
        // Calculations
        getItemCount,
        getSubtotal,
        getTotal
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

// Custom hook to use cart context
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export default CartContext;
