import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Cart action types
const CART_ACTIONS = {
    ADD_ITEM: 'ADD_ITEM',
    REMOVE_ITEM: 'REMOVE_ITEM',
    UPDATE_QUANTITY: 'UPDATE_QUANTITY',
    CLEAR_CART: 'CLEAR_CART',
    LOAD_CART: 'LOAD_CART'
};

// Cart reducer
const cartReducer = (state, action) => {
    switch (action.type) {
        case CART_ACTIONS.ADD_ITEM: {
            const { product, quantity = 1, customization = {} } = action.payload;
            const existingItemIndex = state.items.findIndex(item => 
                item.product.id === product.id && 
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
                    id: `${product.id}-${Date.now()}`,
                    product,
                    quantity,
                    customization,
                    price: (product.hasDiscount && product.discountInfo) ? product.discountInfo.discountedPrice : product.price
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
                    item.id === itemId ? { ...item, quantity } : item
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
            return {
                ...state,
                items: action.payload.items || []
            };
        }

        default:
            return state;
    }
};

// Initial cart state
const initialState = {
    items: [],
    isOpen: false
};

// Create cart context
const CartContext = createContext();

// Cart provider component
export const CartProvider = ({ children, userId }) => {
    const [state, dispatch] = useReducer(cartReducer, initialState);

    // Load cart from localStorage on mount or when userId changes
    useEffect(() => {
        const savedCart = localStorage.getItem(`shopping-cart-${userId}`);
        if (savedCart) {
            try {
                const cartData = JSON.parse(savedCart);
                dispatch({ type: CART_ACTIONS.LOAD_CART, payload: cartData });
            } catch (error) {
                console.error('Error loading cart from localStorage:', error);
            }
        } else {
            dispatch({ type: CART_ACTIONS.LOAD_CART, payload: { items: [] } });
        }
    }, [userId]);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
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
        // Actions
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
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
