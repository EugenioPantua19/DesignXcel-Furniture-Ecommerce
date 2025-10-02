import { loadStripe } from '@stripe/stripe-js';
import apiClient from '../../../shared/services/api/apiClient';

// Initialize Stripe with your publishable key
const stripePromise = (() => {
    const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey || publishableKey === 'pk_test_placeholder_key_replace_with_actual_stripe_key') {
        console.warn('⚠️ Stripe publishable key not configured. Payment functionality will be limited.');
        return Promise.resolve(null);
    }
    
    try {
        return loadStripe(publishableKey);
    } catch (error) {
        console.error('❌ Failed to initialize Stripe:', error);
        return Promise.resolve(null);
    }
})();

export const stripeService = {
    // Check if Stripe is properly configured
    async isStripeAvailable() {
        const stripe = await stripePromise;
        return stripe !== null;
    },
    // Create a checkout session and redirect to Stripe Checkout
    // Added delivery information so backend can save delivery vs pickup and pickup date
    async createCheckoutSession(items, email, paymentMethod = 'E-Wallet', options = {}) {
        try {
            console.log('Creating Stripe checkout session with items:', items);
            
            // Check if Stripe is configured before proceeding
            const stripe = await stripePromise;
            if (!stripe) {
                throw new Error('Payment system is not configured. Please contact support or try a different payment method.');
            }
            
            // Validate items before sending
            if (!items || !Array.isArray(items) || items.length === 0) {
                throw new Error('No items provided for checkout');
            }
            
            // Validate each item
            for (const item of items) {
                if (!item.name || !item.quantity || !item.price) {
                    throw new Error('Invalid item structure. Each item must have name, quantity, and price.');
                }
                if (item.quantity <= 0 || item.price <= 0) {
                    throw new Error('Item quantity and price must be greater than 0.');
                }
            }
            
            const result = await apiClient.post('/api/create-checkout-session', {
                items: items,
                email: email,
                paymentMethod: paymentMethod,
                deliveryType: options.deliveryType || 'pickup',
                pickupDate: options.pickupDate || null,
                shippingCost: typeof options.shippingCost === 'number' ? options.shippingCost : 0,
                shippingAddressId: options.shippingAddressId || null
            });

            if (!result.sessionId) {
                throw new Error('Failed to create checkout session: ' + (result.error || 'Unknown error'));
            }

            if (result.sessionId) {
                console.log('Stripe checkout session created successfully! SessionID:', result.sessionId);
                
                // Redirect to Stripe Checkout
                const { error } = await stripe.redirectToCheckout({
                    sessionId: result.sessionId,
                });
                
                if (error) {
                    console.error('Stripe redirect error:', error);
                    throw new Error(error.message);
                }
            } else {
                throw new Error(result.error || 'Failed to create checkout session');
            }
        } catch (error) {
            console.error('Stripe checkout error:', error);
            throw error;
        }
    },

    // Retrieve checkout session details
    async getCheckoutSession(sessionId) {
        try {
            return await apiClient.get(`/api/checkout-session/${sessionId}`);
        } catch (error) {
            console.error('Error retrieving checkout session:', error);
            throw error;
        }
    }
};

export default stripeService;
