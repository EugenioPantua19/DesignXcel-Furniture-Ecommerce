import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Currency context
const CurrencyContext = createContext();

// Currency action types
const CURRENCY_ACTIONS = {
    SET_CURRENCY: 'SET_CURRENCY',
    SET_EXCHANGE_RATES: 'SET_EXCHANGE_RATES',
    LOAD_CURRENCY: 'LOAD_CURRENCY'
};

// Initial state
const initialState = {
    currentCurrency: 'PHP',
    exchangeRates: {
        PHP: 1,
        USD: 0.018 // Approximate PHP to USD rate (1 USD = ~55 PHP)
    },
    currencies: [
        { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
        { code: 'USD', name: 'US Dollar', symbol: '$' }
    ]
};

// Currency reducer
const currencyReducer = (state, action) => {
    switch (action.type) {
        case CURRENCY_ACTIONS.SET_CURRENCY:
            return {
                ...state,
                currentCurrency: action.payload
            };
        case CURRENCY_ACTIONS.SET_EXCHANGE_RATES:
            return {
                ...state,
                exchangeRates: action.payload
            };
        case CURRENCY_ACTIONS.LOAD_CURRENCY:
            return {
                ...state,
                currentCurrency: action.payload
            };
        default:
            return state;
    }
};

// Currency provider component
export const CurrencyProvider = ({ children }) => {
    const [state, dispatch] = useReducer(currencyReducer, initialState);

    // Load currency from localStorage on mount
    useEffect(() => {
        const savedCurrency = localStorage.getItem('selected-currency');
        if (savedCurrency && ['PHP', 'USD'].includes(savedCurrency)) {
            dispatch({ type: CURRENCY_ACTIONS.LOAD_CURRENCY, payload: savedCurrency });
        }
    }, []);

    // Save currency to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('selected-currency', state.currentCurrency);
    }, [state.currentCurrency]);

    // Set currency
    const setCurrency = (currencyCode) => {
        if (['PHP', 'USD'].includes(currencyCode)) {
            dispatch({ type: CURRENCY_ACTIONS.SET_CURRENCY, payload: currencyCode });
        }
    };

    // Convert price from PHP to selected currency
    const convertPrice = (priceInPHP) => {
        if (state.currentCurrency === 'PHP') {
            return priceInPHP;
        }
        const rate = state.exchangeRates[state.currentCurrency] || 1;
        return priceInPHP * rate;
    };

    // Format price with currency symbol
    const formatPrice = (priceInPHP) => {
        // Handle null, undefined, or invalid values
        if (priceInPHP === null || priceInPHP === undefined || isNaN(priceInPHP)) {
            return '₱0.00'; // Default to PHP 0.00
        }
        
        const convertedPrice = convertPrice(priceInPHP);
        const currency = getCurrentCurrency();
        
        if (currency.code === 'PHP') {
            return `₱${convertedPrice.toLocaleString('en-PH', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            })}`;
        } else if (currency.code === 'USD') {
            return `$${convertedPrice.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            })}`;
        }
        
        return `${currency.symbol}${convertedPrice.toLocaleString()}`;
    };

    // Get current currency info
    const getCurrentCurrency = () => {
        return state.currencies.find(c => c.code === state.currentCurrency) || state.currencies[0];
    };

    // Update exchange rates (could be called from an API)
    const updateExchangeRates = (rates) => {
        dispatch({ type: CURRENCY_ACTIONS.SET_EXCHANGE_RATES, payload: rates });
    };

    const value = {
        // State
        currentCurrency: state.currentCurrency,
        currencies: state.currencies,
        exchangeRates: state.exchangeRates,
        
        // Actions
        setCurrency,
        updateExchangeRates,
        
        // Utilities
        formatPrice,
        convertPrice,
        getCurrentCurrency
    };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};

// Custom hook to use currency context
export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};

export default CurrencyContext;
