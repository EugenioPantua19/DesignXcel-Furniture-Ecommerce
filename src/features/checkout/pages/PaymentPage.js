import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';
import stripeService from '../services/stripeService';
import apiClient from '../../../shared/services/api/apiClient';
import checkoutSessionManager from '../utils/checkoutSessionManager';
import './payment.css';

// Cart Icon Component
const CartIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="21" r="1" stroke="currentColor" strokeWidth="2"/>
        <circle cx="19" cy="21" r="1" stroke="currentColor" strokeWidth="2"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const Payment = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('stripe');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Check for cancellation parameter and validate session
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        if (urlParams.get('cancelled') === 'true') {
            setError('Payment was cancelled. You can try again or choose a different payment method.');
        }
        
        // Check if Stripe is available
        const checkStripeAvailability = async () => {
            const isAvailable = await stripeService.isStripeAvailable();
            if (!isAvailable) {
                setError('Payment system is currently unavailable. Please contact support for alternative payment methods.');
            }
        };
        
        checkStripeAvailability();
        
        // Validate session for persistent accounts
        const validateSession = async () => {
            if (user?.email) {
                const persistentAccounts = ['augmentdoe@gmail.com', 'andreijumaw@gmail.com'];
                if (persistentAccounts.includes(user.email)) {
                    try {
                        const response = await apiClient.get('/api/auth/validate-session');
                        if (response.success && response.persistentLogin) {
                            console.log('🔒 Session validated for persistent account');
                        }
                    } catch (error) {
                        console.error('Session validation failed:', error);
                    }
                }
            }
        };
        
        validateSession();
    }, [location.search, user]);

    // Get checked items and shipping info from location.state (from CheckoutPage.js), fallback to all cart items
    const checkedItems = (location.state && Array.isArray(location.state.items) && location.state.items.length > 0)
        ? location.state.items
        : JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Get shipping information from checkout
    const shippingMethod = location.state?.shippingMethod || 'pickup';
    const shippingCost = location.state?.shippingCost || 0;
    const subtotal = location.state?.subtotal || 0;
    const total = location.state?.total || 0;
    const deliveryType = location.state?.deliveryType || 'pickup';

    // Format price in PHP
    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(price);
    };


    const handleEWalletPayment = async () => {
        setLoading(true);
        setError('');
        
        try {
            // Validate session before processing payment
            const sessionValid = await checkoutSessionManager.ensureValidSession();
            if (!sessionValid) {
                setLoading(false);
                return; // Session manager will handle redirect
            }

            // Get customer email from user context or localStorage
            const customerEmail = user?.email || JSON.parse(localStorage.getItem('user') || '{}').email;
            
            if (!customerEmail) {
                setError('Please log in to proceed with payment.');
                navigate('/login');
                return;
            }

            // Validate items
            if (!checkedItems || checkedItems.length === 0) {
                setError('No items found in your cart. Please add items before proceeding to payment.');
                return;
            }

            // Prepare items for Stripe checkout with enhanced product information
            const itemsForStripe = checkedItems.map(item => {
                const variationId = item.product?.selectedVariation?.id || null;
                const variationName = item.product?.selectedVariation?.name || null;
                const useOriginalProduct = item.product?.useOriginalProduct || false;
                
                console.log('PaymentPage: Processing cart item:', {
                    itemName: item.product?.name || item.name,
                    productId: item.product?.id || item.product?.ProductID || item.id,
                    variationId: variationId,
                    variationName: variationName,
                    useOriginalProduct: useOriginalProduct,
                    selectedVariation: item.product?.selectedVariation,
                    hasVariation: !!variationId
                });
                
                return {
                    name: item.product?.name || item.name || 'Product',
                    quantity: item.quantity,
                    price: item.price,
                    id: item.product?.id || item.product?.ProductID || item.id,
                    variationId: variationId,
                    variationName: variationName,
                    useOriginalProduct: useOriginalProduct
                };
            });
            
            // No shipping cost added
            
            console.log('Creating Stripe checkout session:', { 
                items: itemsForStripe, 
                email: customerEmail,
                deliveryType: deliveryType,
                shippingCost: shippingCost
            });
            
            // Debug: Log each item's variation data
            itemsForStripe.forEach((item, index) => {
                console.log(`PaymentPage: Item ${index + 1} variation data:`, {
                    name: item.name,
                    id: item.id,
                    variationId: item.variationId,
                    variationName: item.variationName,
                    useOriginalProduct: item.useOriginalProduct,
                    hasVariation: !!item.variationId
                });
            });
            
            // Clear the cart before redirecting to Stripe (cart will be cleared by webhook after successful payment)
            localStorage.removeItem(`shopping-cart-${user?.id || 'guest'}`);
            
            // Use Stripe service to create checkout session and redirect
            await stripeService.createCheckoutSession(
                itemsForStripe, 
                customerEmail,
                'E-Wallet',
                { 
                    deliveryType: deliveryType, 
                    pickupDate: null, // TODO: Add pickup date functionality if needed
                    shippingCost: shippingCost,
                    shippingAddressId: location.state?.shippingAddressId || null
                }
            );
            
            // Note: Cart will be cleared by webhook after successful payment
            // Don't clear it here in case payment fails
            
        } catch (error) {
            console.error('E-Wallet payment error:', error);

            // Handle checkout-specific errors first
            const handled = checkoutSessionManager.handleCheckoutError(error, 'stripe-checkout');
            if (!handled) {
                // Provide more specific error messages based on error type
                let errorMessage = 'Payment setup failed: ';
                if (error.message.includes('checkout session')) {
                    errorMessage += 'Unable to create payment session. Please try again.';
                } else if (error.message.includes('not configured') || error.message.includes('not properly configured')) {
                    errorMessage += 'Payment system is not configured. Please contact support for alternative payment methods.';
                } else if (error.message.includes('Stripe')) {
                    errorMessage += 'Payment service temporarily unavailable. Please try again later.';
                } else if (error.message.includes('network') || error.message.includes('fetch')) {
                    errorMessage += 'Network error. Please check your connection and try again.';
                } else {
                    errorMessage += error.message;
                }

                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="payment-page">
            <div className="payment-container">
                {/* Error Display */}
                {error && (
                    <div className="payment-error-message">
                        {error}
                    </div>
                )}

                {/* Payment Methods Section */}
                <div className="payment-methods-section">
                    <h2 className="section-title">Select Payment Method</h2>
                    
                    <div className="payment-methods-list">
                        {/* Stripe */}
                        <div 
                            className={`payment-method-option ${selectedPaymentMethod === 'stripe' ? 'selected' : ''}`}
                            onClick={() => setSelectedPaymentMethod('stripe')}
                        >
                            <div className="payment-method-radio">
                                <div className={`radio-button ${selectedPaymentMethod === 'stripe' ? 'checked' : ''}`}>
                                    {selectedPaymentMethod === 'stripe' && <div className="radio-dot"></div>}
                                </div>
                            </div>
                            <div className="payment-method-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <rect x="2" y="8" width="20" height="8" rx="2" fill="#F0B21B"/>
                                    <rect x="2" y="14" width="20" height="2" fill="#1A1F71"/>
                                    <text x="12" y="13" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">STRIPE</text>
                                </svg>
                            </div>
                            <span className="payment-method-name">Stripe</span>
                            <span className="payment-method-details">Secure payment processing</span>
                        </div>
                    </div>
                </div>

                {/* Order Summary Section */}
                <div className="order-summary-section">
                    <div className="order-summary-header">
                        <div className="summary-icon">
                            <CartIcon />
                        </div>
                        <h2 className="section-title">Order Summary</h2>
                    </div>
                    
                    <div className="order-summary-content">
                        <div className="summary-item">
                            <span className="summary-label">Items</span>
                            <span className="summary-value">{checkedItems.length}</span>
                        </div>
                        
                        <div className="summary-item">
                            <span className="summary-label">Sub Total</span>
                            <span className="summary-value">{formatPrice(subtotal)}</span>
                        </div>
                        
                        <div className="summary-item">
                            <span className="summary-label">Shipping</span>
                            <span className="summary-value">{formatPrice(shippingCost)}</span>
                        </div>
                        
                        <div className="summary-item">
                            <span className="summary-label">Taxes</span>
                            <span className="summary-value">₱0.00</span>
                        </div>
                        
                        <div className="summary-item discount">
                            <span className="summary-label">Coupon Discount</span>
                            <span className="summary-value">-₱100.00</span>
                        </div>
                        
                        <div className="summary-item total">
                            <span className="summary-label">Total</span>
                            <span className="summary-value">{formatPrice(total)}</span>
                        </div>
                    </div>

                    <button 
                        className="confirm-payment-btn"
                        onClick={handleEWalletPayment}
                        disabled={loading || checkedItems.length === 0}
                    >
                        {loading ? 'Processing...' : 'Confirm Payment'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Payment;
