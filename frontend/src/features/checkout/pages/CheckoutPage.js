import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../../shared/contexts/CartContext';
import './checkout.css';
import { useAuth } from '../../../shared/hooks/useAuth';
import AudioLoader from '../../../shared/components/ui/AudioLoader';
import ConfirmationModal from '../../../shared/components/ui/ConfirmationModal';
import apiClient from '../../../shared/services/api/apiClient';
import checkoutSessionManager from '../utils/checkoutSessionManager';
import { getImageUrl } from '../../../shared/utils/imageUtils';

// Modern SVG Icons
const ShippingIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V10H17L15 7H3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 7L5 5H13L15 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="7.5" cy="15.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
        <circle cx="16.5" cy="15.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
    </svg>
);

const TruckIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 3H1V16H16V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 8H20L23 11V16H16V8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="2"/>
        <circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="2"/>
    </svg>
);

const InfoIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const CartIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="21" r="1" stroke="currentColor" strokeWidth="2"/>
        <circle cx="19" cy="21" r="1" stroke="currentColor" strokeWidth="2"/>
        <path d="M2.05 2.05H4L6.2 12.2C6.37 13.37 7.39 14.2 8.6 14.2H19.4C20.61 14.2 21.63 13.37 21.8 12.2L23 6H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const CheckoutPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { items: cartItems, getSubtotal, getTotal, clearCart } = useCart();
    const { user, loading: authLoading } = useAuth();
    const [currentTheme, setCurrentTheme] = useState('default');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [termsChecked, setTermsChecked] = useState(false);
    const [defaultAddress, setDefaultAddress] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [addressLoading, setAddressLoading] = useState(true);
    const [publicTerms, setPublicTerms] = useState(null);
    const [deliveryRates, setDeliveryRates] = useState([]);
    const [shippingMethod, setShippingMethod] = useState('pickup'); // 'pickup' or RateID
    const [shippingCost, setShippingCost] = useState(0);
    const [showAddressModal, setShowAddressModal] = useState(false);
    
    // Fetch addresses from Address Book
    useEffect(() => {
        const fetchAddresses = async () => {
            // Wait for authentication to complete before proceeding
            if (authLoading) {
                return;
            }
            
            setAddressLoading(true);
            try {
                // Validate session before fetching addresses
                const sessionValid = await checkoutSessionManager.ensureValidSession();
                if (!sessionValid) {
                    return; // Session manager will handle redirect
                }

                const res = await apiClient.get('/api/customer/addresses');
                if (res.success && Array.isArray(res.addresses) && res.addresses.length > 0) {
                    setAddresses(res.addresses);
                    // Find the default address, or use the first one if no default is set
                    const defaultAddr = res.addresses.find(addr => addr.IsDefault) || res.addresses[0];
                    setDefaultAddress(defaultAddr);
                } else {
                    setAddresses([]);
                    setDefaultAddress(null);
                }
            } catch (err) {
                console.error('Failed to fetch addresses:', err);
                
                // Handle checkout-specific errors
                const handled = checkoutSessionManager.handleCheckoutError(err, '/api/customer/addresses');
                if (!handled) {
                    setAddresses([]);
                    setDefaultAddress(null);
                }
            } finally {
                setAddressLoading(false);
            }
        };
        
        fetchAddresses();
    }, [authLoading]);

    // Detect current theme from body class
    useEffect(() => {
        const detectTheme = () => {
            const bodyClasses = document.body.className;
            if (bodyClasses.includes('theme-christmas')) {
                setCurrentTheme('christmas');
            } else if (bodyClasses.includes('theme-dark')) {
                setCurrentTheme('dark');
            } else {
                setCurrentTheme('default');
            }
        };

        // Initial detection
        detectTheme();

        // Listen for theme changes
        const observer = new MutationObserver(detectTheme);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    // Fetch public Terms and Conditions for frontend display
    useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                const response = await apiClient.get('/api/terms');
                if (isMounted && response && response.success) {
                    setPublicTerms(response);
                }
            } catch (e) {
                // Silent fallback; frontend has default text
                console.warn('Unable to load public terms, using defaults');
            }
        })();
        return () => { isMounted = false; };
    }, []);

    // Fetch active delivery rates for checkout (public)
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await apiClient.get('/api/public/delivery-rates');
                if (mounted && res && res.success) {
                    setDeliveryRates(Array.isArray(res.deliveryRates) ? res.deliveryRates : []);
                }
            } catch (err) {
                console.warn('Failed to load delivery rates');
            }
        })();
        return () => { mounted = false; };
    }, []);

    // Calculate shipping cost based on selected delivery method
    const calculateShippingCost = () => {
        if (shippingMethod === 'pickup') {
            return 0;
        }
        
        const selectedRate = deliveryRates.find(rate => String(rate.RateID) === String(shippingMethod));
        return selectedRate ? Number(selectedRate.Price || 0) : 0;
    };

    // Update shipping cost when delivery method changes
    useEffect(() => {
        const newShippingCost = calculateShippingCost();
        setShippingCost(newShippingCost);
    }, [shippingMethod, deliveryRates]);

    // Calculate total including shipping
    const getTotalWithShipping = () => {
        return getTotal() + shippingCost;
    };
    
    // Get address from default address or fallbacks
    const address = defaultAddress || (user && user.address) || {};
    const profile = user || {};
    
    // Compose name
    const name = profile.fullName || [address.FirstName, address.LastName].filter(Boolean).join(' ') || '';
    
    // Compose full address as multi-line (like AddressBook)
    const addressParts = [
        address.HouseNumber,
        address.Street,
        address.Barangay,
        address.City,
        address.Province,
        address.Region,
        address.PostalCode,
        address.Country || 'Philippines'
    ].filter(Boolean);
    
    // If no address parts found, show a message
    const fullAddressBlock = addressParts.length > 0 ? addressParts.join(',\n') : 'No address set. Please update your profile.';
    
    // Compose city/province/region
    const city = address.City || '';
    const province = address.Province || '';
    const region = address.Region || '';
    const barangay = address.Barangay || '';
    const postalCode = address.PostalCode || '';
    const country = address.Country || 'Philippines';
    const email = profile.email || address.Email || '';
    const phone = profile.phoneNumber || address.PhoneNumber || '';

    // Use only checked items if passed from Cart.js, otherwise use all cart items
    const items = location.state && Array.isArray(location.state.items) && location.state.items.length > 0
        ? location.state.items
        : cartItems;

    useEffect(() => {
        // Redirect if cart is empty
        if (!items || items.length === 0) {
            navigate('/cart');
        }
    }, [items, navigate]);

    const handleInputChange = (section, field, value) => {
        if (section === 'shipping') {
            // setShippingAddress(prev => ({ ...prev, [field]: value })); // Removed
        } else if (section === 'billing') {
            // setBillingAddress(prev => ({ ...prev, [field]: value })); // Removed
        }
    };

    const handlePaymentSuccess = (paymentData) => {
        console.log('Payment successful:', paymentData);
        clearCart();
        navigate('/order-confirmation', { state: { paymentData } });
    };

    const handlePaymentError = (error) => {
        console.error('Payment error:', error);
        setError('Payment failed. Please try again.');
    };

    const handleAddressSelect = (address) => {
        setDefaultAddress(address);
        setShowAddressModal(false);
    };


    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(price);
    };

    const handlePayNow = () => {
        setShowTermsModal(true);
    };
    const handleConfirmTerms = () => {
        setShowTermsModal(false);
        // Redirect to payment page after confirming terms, passing items and shipping info
        navigate('/payment', { 
            state: { 
                items,
                shippingMethod,
                shippingCost,
                subtotal: getTotal(),
                total: getTotalWithShipping(),
                deliveryType: shippingMethod === 'pickup' ? 'pickup' : `rate_${shippingMethod}`,
                shippingAddressId: defaultAddress?.AddressID || null
            } 
        });
    };

    // Show loading state while authentication is loading
    if (authLoading) {
        return (
            <div className="checkout-page">
                <div className="empty-cart">
                    <AudioLoader size="large" color="#F0B21B" />
                    <h2>Loading checkout...</h2>
                    <p className="text-gray-500">Please wait while we verify your authentication.</p>
                </div>
            </div>
        );
    }

    if (!items || items.length === 0) {
        return (
            <div className="checkout-page">
                <div className="empty-cart">
                    <h2>Your cart is empty</h2>
                    <p className="text-gray-500 mb-4">Add some items to your cart to proceed with checkout.</p>
                    <button onClick={() => navigate('/products')} className="btn btn-primary">
                        Continue Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            {/* Address Selection Modal */}
            {showAddressModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Select Shipping Address</h2>
                        <div className="shipping-options">
                            {addresses.map((address) => (
                                <div 
                                    key={address.AddressID}
                                    className={`shipping-option ${defaultAddress?.AddressID === address.AddressID ? 'selected' : ''}`}
                                    onClick={() => handleAddressSelect(address)}
                                >
                                    <div className="shipping-option-header">
                                        <div className="shipping-radio">
                                            {defaultAddress?.AddressID === address.AddressID && <div></div>}
                                        </div>
                                        <div className="shipping-name">
                                            {[address.FirstName, address.LastName].filter(Boolean).join(' ')}
                                            {address.IsDefault && <span className="badge badge-default ml-2">Default</span>}
                                        </div>
                                    </div>
                                    <div className="shipping-description">
                                        {[
                                            address.HouseNumber,
                                            address.Street,
                                            address.Barangay,
                                            address.City,
                                            address.Province,
                                            address.Region,
                                            address.PostalCode,
                                            address.Country || 'Philippines'
                                        ].filter(Boolean).join(', ')}
                                        {address.PhoneNumber && ` • ${address.PhoneNumber}`}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="modal-actions">
                            <button 
                                onClick={() => setShowAddressModal(false)}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showTermsModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{publicTerms?.checkoutTerms?.title || 'Terms and Conditions'}</h2>
                        <div style={{maxHeight: 200, overflowY: 'auto', whiteSpace: 'pre-line'}}>
                            {publicTerms?.checkoutTerms?.content || (
                                <>
                                    <p>By proceeding with this payment, you agree to our Terms and Conditions. Please read them carefully before confirming your order.</p>
                                    <ul>
                                        <li>All sales are final unless otherwise stated.</li>
                                        <li>Shipping and delivery times are estimates and may vary.</li>
                                        <li>You are responsible for providing accurate shipping information.</li>
                                        <li>For full details, please visit our Terms and Conditions page.</li>
                                    </ul>
                                </>
                            )}
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', marginBottom: '1rem'}}>
                            <input
                                type="checkbox"
                                id="termsCheckbox"
                                checked={termsChecked}
                                onChange={e => setTermsChecked(e.target.checked)}
                                style={{marginRight: 8}}
                            />
                            <label htmlFor="termsCheckbox">{publicTerms?.checkoutTerms?.checkboxText || 'I have read and agree to the Terms and Conditions'}</label>
                        </div>
                        <div className="modal-actions">
                            <button 
                                onClick={() => { setShowTermsModal(false); setTermsChecked(false); }}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleConfirmTerms}
                                className="btn btn-primary"
                                disabled={!termsChecked}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="checkout-container">
                {/* Main Checkout Content */}
                <div className="checkout-main">
                    <div className="checkout-header">
                        <h1>Checkout</h1>
                        <p>Complete your order with secure checkout</p>
                    </div>
                    
                    {error && (
                        <div className="error-alert">
                            <span className="error-icon">⚠️</span>
                            <span className="error-text">{error}</span>
                        </div>
                    )}

                    {/* Shipping Address Section */}
                    <div className="checkout-section">
                        <div className="section-header">
                            <div className="section-number">1</div>
                            <ShippingIcon />
                            <span>Shipping Address</span>
                        </div>
                        {addressLoading ? (
                            <div className="text-center" style={{ padding: '2rem' }}>
                                <AudioLoader size="medium" color="#F0B21B" />
                                <p className="text-gray-500">Loading address...</p>
                            </div>
                        ) : defaultAddress ? (
                            <div className="address-display">
                                <div className="address-info">
                                    <div className="address-row">
                                        <span className="address-label">Name:</span>
                                        <span className="address-value">{name}</span>
                                    </div>
                                    <div className="address-row">
                                        <span className="address-label">Email:</span>
                                        <span className="address-value">{email}</span>
                                    </div>
                                    <div className="address-row">
                                        <span className="address-label">Phone:</span>
                                        <span className="address-value">{phone}</span>
                                    </div>
                                    <div className="address-row">
                                        <span className="address-label">Address:</span>
                                        <span className="address-value">{addressParts.join(', ')}</span>
                                    </div>
                                </div>
                                <div className="address-actions">
                                    {addresses.length > 0 && (
                                        <button 
                                            className="btn btn-secondary"
                                            onClick={() => setShowAddressModal(true)}
                                        >
                                            Change Address
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="empty-address-state">
                                <div className="empty-icon">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M8 9L12 13L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <p className="empty-title">No shipping address found</p>
                                <p className="empty-description">Please add an address to continue with your order</p>
                                <button 
                                    className="btn btn-primary add-address-btn"
                                    onClick={() => navigate('/account?tab=addresses&returnTo=checkout')}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        margin: '0 auto'
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Add Address
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Shipping Methods Section */}
                    <div className="checkout-section">
                        <div className="section-header">
                            <div className="section-number">2</div>
                            <TruckIcon />
                            <span>Shipping Methods</span>
                        </div>
                        <div className="shipping-options">
                            {/* Pick up option (free) */}
                            <div
                                className={`shipping-option ${shippingMethod === 'pickup' ? 'selected' : ''}`}
                                onClick={() => setShippingMethod('pickup')}
                            >
                                <div className="shipping-option-header">
                                    <div className="shipping-radio">
                                        {shippingMethod === 'pickup' && <div></div>}
                                    </div>
                                    <div className="shipping-name">Pick up</div>
                                </div>
                                <div className="shipping-description">
                                    Pick up your order at our store. This option is free of delivery charge.
                                </div>
                            </div>

                            {/* Dynamic delivery types from DB */}
                            {deliveryRates.map(rate => (
                                <div
                                    key={rate.RateID}
                                    className={`shipping-option ${String(shippingMethod) === String(rate.RateID) ? 'selected' : ''}`}
                                    onClick={() => setShippingMethod(String(rate.RateID))}
                                >
                                    <div className="shipping-option-header">
                                        <div className="shipping-radio">
                                            {String(shippingMethod) === String(rate.RateID) && <div></div>}
                                        </div>
                                        <div className="shipping-name">{rate.ServiceType}</div>
                                    </div>
                                    <div className="shipping-description">
                                        {`Delivery charge: ${formatPrice(Number(rate.Price || 0))}`}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Order Summary Sidebar */}
                <div className="order-summary">
                    <div className="order-summary-header">
                        <div className="summary-icon">
                            <CartIcon />
                        </div>
                        <h3>Order Summary</h3>
                    </div>
                    
                    <div className="cart-items">
                        {items.map((item) => {
                            const imageUrl = getImageUrl(item.selectedVariation?.imageUrl || item.product?.images?.[0] || item.product?.image);
                            
                            return (
                                <div key={item.id} className="cart-item">
                                    <img 
                                        src={imageUrl}
                                        alt={item.product ? item.product.name : 'Product'}
                                        className="cart-item-image"
                                        onError={(e) => {
                                            e.target.src = '/logo192.png';
                                            e.target.onerror = null;
                                        }}
                                    />
                                    <div className="cart-item-info">
                                        <div className="cart-item-name">{item.product ? item.product.name : ''}</div>
                                        
                                        {item.product && (item.product.useOriginalProduct || !item.product.selectedVariation) ? (
                                            <div className="cart-item-variant">Standard</div>
                                        ) : item.product && item.product.selectedVariation ? (
                                            <div className="cart-item-variant">
                                                Variant: {item.product.selectedVariation.name}
                                                {item.product.selectedVariation.color ? ` • ${item.product.selectedVariation.color}` : ''}
                                            </div>
                                        ) : null}
                                        
                                        <div className="cart-item-quantity">Qty: {item.quantity}</div>
                                        {item.product && item.product.hasDiscount && item.product.discountInfo && (
                                            <div className="discount-badge-small">
                                                {item.product.discountInfo.discountType === 'percentage' 
                                                    ? `-${item.product.discountInfo.discountValue}%` 
                                                    : `-${formatPrice(item.product.discountInfo.discountAmount)}`
                                                }
                                            </div>
                                        )}
                                    </div>
                                    <div className="cart-item-price-section">
                                        <div className="cart-item-price">
                                            {formatPrice(item.price * item.quantity)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="order-totals">
                        <div className="total-row">
                            <span>Subtotal:</span>
                            <span>{formatPrice(getTotal())}</span>
                        </div>
                        <div className="total-row">
                            <span>Shipping:</span>
                            <span>{formatPrice(shippingCost)}</span>
                        </div>
                        <div className="total-row final">
                            <span>Total:</span>
                            <span className="total-amount">{formatPrice(getTotalWithShipping())}</span>
                        </div>
                    </div>
                    
                    <button 
                        className="btn btn-primary place-order-btn"
                        onClick={() => setShowTermsModal(true)}
                    >
                        Pay Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
