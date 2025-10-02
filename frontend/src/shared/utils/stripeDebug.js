// Stripe Debug Utilities for Development
// This file provides debugging tools for Stripe integration

if (process.env.NODE_ENV === 'development') {
    console.log('Stripe Debug utilities loaded');
    
    // Add any Stripe debugging utilities here
    window.stripeDebug = {
        // Debug functions can be added here
        log: (message, data) => {
            console.log(`[Stripe Debug] ${message}`, data);
        }
    };
}
