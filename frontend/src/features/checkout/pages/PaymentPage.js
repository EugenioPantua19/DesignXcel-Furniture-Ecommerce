import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import stripeService from '../services/stripeService';
import apiClient from '../../../shared/services/api/apiClient';
import checkoutSessionManager from '../utils/checkoutSessionManager';
import './payment.css';

const Payment = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('e_wallets');
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
    const shippingCost = 0; // No shipping cost
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
            const itemsForStripe = checkedItems.map(item => ({
                name: item.product?.name || item.name || 'Product',
                quantity: item.quantity,
                price: item.price,
                id: item.product?.id || item.product?.ProductID || item.id,
                variationId: item.product?.selectedVariation?.id || null,
                variationName: item.product?.selectedVariation?.name || null,
                useOriginalProduct: item.product?.useOriginalProduct || false
            }));
            
            // No shipping cost added
            
            console.log('Creating Stripe checkout session:', { 
                items: itemsForStripe, 
                email: customerEmail,
                deliveryType: deliveryType,
                shippingCost: shippingCost
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
                {/* Order Summary for Checked Items */}
                <div className="payment-order-summary">
                    <div className="payment-summary-header">
                        <h2>Order Summary</h2>
                    </div>
                    <div className="payment-summary-content">
                        {checkedItems.length === 0 ? (
                            <div className="no-items">No items selected for payment.</div>
                        ) : (
                            <>
                                {checkedItems.map(item => (
                                    <div key={item.id} className="payment-summary-item">
                                        <div className="payment-item-details">
                                            <div className="payment-item-name">{item.product?.name || 'Product'}</div>
                                            <div className="payment-item-quantity">x{item.quantity}</div>
                                            <div className="payment-item-price">{formatPrice(item.price * item.quantity)}</div>
                                        </div>
                                    
                                        {/* Variation display in payment */}
                                        {item.product && (item.product.useOriginalProduct || !item.product.selectedVariation) ? (
                                            <span className="payment-variation-badge">Standard</span>
                                        ) : item.product && item.product.selectedVariation ? (
                                            <span className="payment-variation-badge">
                                                Variant: {item.product.selectedVariation.name}
                                                {item.product.selectedVariation.color ? ` · ${item.product.selectedVariation.color}` : ''}
                                            </span>
                                        ) : null}
                                    </div>
                                ))}
                                <div className="payment-total-section">
                                    <div className="payment-total">
                                        <span>Total:</span>
                                        <span>{formatPrice(checkedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0))}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="payment-error-message">
                        {error}
                    </div>
                )}

                {/* Main Payment Content */}
                <div className="payment-main-content">
                    <div className="payment-header">
                        <h1>Payment Methods</h1>
                        <p>Choose from our wide range of secure payment options for a seamless shopping experience</p>
                    </div>

                    {/* Payment Tabs */}
                    <div className="payment-tabs">
                        <button
                            className={`payment-tab ${activeTab === 'e_wallets' ? 'active' : ''}`}
                            onClick={() => setActiveTab('e_wallets')}
                        >
                            E-Wallets
                        </button>
                    </div>

                    {/* Payment Content */}
                    <div className="payment-content">

                    {activeTab === 'e_wallets' && (
                        <div className="payment-section">
                            <div className="payment-main">
                                <h2>E-Wallets</h2>
                                <p>Pay quickly and securely using your preferred digital wallet. Fast, convenient, and secure transactions.</p>
                                
                                {/* Stripe Configuration Warning */}
                                {error && error.includes('not configured') && (
                                    <div className="payment-warning-message">
                                        <strong>⚠️ Payment System Notice:</strong> The payment system is currently not configured. 
                                        Please contact support for alternative payment methods or try again later.
                                    </div>
                                )}

                                <div className="payment-features">
                                    <div className="feature-item">
                                        <span className="feature-icon"></span>
                                        <span>Instant payments</span>
                                    </div>
                                    <div className="feature-item">
                                        <span className="feature-icon"></span>
                                        <span>Mobile-friendly</span>
                                    </div>
                                    <div className="feature-item">
                                        <span className="feature-icon"></span>
                                        <span>Encrypted transactions</span>
                                    </div>
                                    <div className="feature-item">
                                        <span className="feature-icon"></span>
                                        <span>No additional fees</span>
                                    </div>
                                </div>
                            </div>

                            <div className="security-features">
                                <h3>Security Features</h3>

                                <div className="security-item">
                                    <div className="security-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" fill="#F0B21B"/>
                                            <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <div className="security-info">
                                        <h4>Secure Authentication</h4>
                                        <p>Multi-factor authentication for enhanced account security</p>
                                    </div>
                                </div>

                                <div className="security-item">
                                    <div className="security-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="12" cy="12" r="10" fill="#F0B21B"/>
                                            <path d="M12 6V12L16 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <div className="security-info">
                                        <h4>Real-time Protection</h4>
                                        <p>Advanced fraud detection and prevention systems</p>
                                    </div>
                                </div>
                            </div>
                            {/* Proceed Button for E-Wallets */}
                            <div style={{ textAlign: 'right', marginTop: 24 }}>
                                <button 
                                    className="btn-primary" 
                                    style={{ minWidth: 140, padding: '12px 32px', fontWeight: 600, fontSize: 16 }} 
                                    onClick={handleEWalletPayment}
                                    disabled={loading || checkedItems.length === 0}
                                >
                                    {loading ? 'Processing...' : 'Proceed to Payment'}
                                </button>
                            </div>
                        </div>
                    )}

                    </div>
                </div>
            </div>

        </div>
    );
};

export default Payment;
