import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../../shared/contexts/CartContext';
import './checkout.css';
import { useAuth } from '../../auth/hooks/useAuth';
import ConfirmationModal from '../../../shared/components/ui/ConfirmationModal';
import apiClient from '../../../shared/services/api/apiClient';
import checkoutSessionManager from '../utils/checkoutSessionManager';

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
    const { user } = useAuth();
    
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
    const [shippingCost] = useState(0); // No shipping cost
    const [showAddressModal, setShowAddressModal] = useState(false);
    
    // Fetch addresses from Address Book
    useEffect(() => {
        const fetchAddresses = async () => {
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
    }, []);

    // Fetch public Terms and Conditions for frontend display
    useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                const terms = await apiClient.get('/api/terms');
                if (isMounted && terms) {
                    setPublicTerms(terms);
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

    // No shipping cost updates needed
    
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

    const handleManageAddresses = () => {
        navigate('/account?tab=addresses');
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
                deliveryType: shippingMethod === 'pickup' ? 'pickup' : `rate_${shippingMethod}`,
                shippingAddressId: defaultAddress?.AddressID || null
            } 
        });
    };

    if (!items || items.length === 0) {
        return (
            <div className="checkout-page">
                <div className="empty-cart">
                    <h2>Your cart is empty</h2>
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
                    <div className="modal-content address-modal">
                        <h2>Select Shipping Address</h2>
                        <div className="address-list">
                            {addresses.map((address) => (
                                <div 
                                    key={address.AddressID}
                                    className={`address-option ${defaultAddress?.AddressID === address.AddressID ? 'selected' : ''}`}
                                    onClick={() => handleAddressSelect(address)}
                                >
                                    <div className="address-option-header">
                                        <div className="address-radio">
                                            {defaultAddress?.AddressID === address.AddressID && <div className="radio-selected"></div>}
                                        </div>
                                        <div className="address-info">
                                            <div className="address-label-row">
                                                {address.Label && <span className="label-badge">{address.Label}</span>}
                                                {address.IsDefault && <span className="default-badge">Default</span>}
                                            </div>
                                            <div className="address-details">
                                                <div className="address-name">
                                                    {[address.FirstName, address.LastName].filter(Boolean).join(' ')}
                                                </div>
                                                <div className="address-full">
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
                                                </div>
                                                {address.PhoneNumber && (
                                                    <div className="address-phone">{address.PhoneNumber}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="modal-actions">
                            <button 
                                onClick={() => setShowAddressModal(false)}
                                className="cancel-btn"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleManageAddresses}
                                className="btn-secondary"
                            >
                                Manage Addresses
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
                                className="cancel-btn"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleConfirmTerms}
                                className="confirm-btn"
                                disabled={!termsChecked}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="checkout-container">
                {/* Main Checkout Form */}
                <div className="checkout-form-area">
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
                            <div className="section-actions">
                                {addresses.length > 0 && (
                                    <button 
                                        className="btn-secondary-small"
                                        onClick={() => setShowAddressModal(true)}
                                    >
                                        Change Address
                                    </button>
                                )}
                                <button 
                                    className="btn-secondary-small"
                                    onClick={handleManageAddresses}
                                >
                                    Manage Addresses
                                </button>
                            </div>
                        </div>
                        <div className="section-content">
                            {addressLoading ? (
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    padding: '20px',
                                    color: '#666'
                                }}>
                                    <div style={{ 
                                        width: '20px', 
                                        height: '20px', 
                                        border: '2px solid #f3f3f3',
                                        borderTop: '2px solid #F0B21B',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite',
                                        marginRight: '10px'
                                    }}></div>
                                    Loading address...
                                </div>
                            ) : defaultAddress ? (
                                <div className="shipping-address-display">
                                    {defaultAddress.Label && (
                                        <div className="address-label">
                                            <span className="label-badge">{defaultAddress.Label}</span>
                                            {defaultAddress.IsDefault && <span className="default-badge">Default</span>}
                                        </div>
                                    )}
                                    <div className="info-row">
                                        <div className="info-icon" aria-hidden="true">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                                <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                        <div className="info-label">Name</div>
                                        <div className="info-value">{name}</div>
                                    </div>
                                    <div className="info-row">
                                        <div className="info-icon" aria-hidden="true">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M21 10.5C21 16.5 12 21 12 21C12 21 3 16.5 3 10.5C3 7.19 5.69 4.5 9 4.5C10.66 4.5 12 5.84 12 7.5C12 5.84 13.34 4.5 15 4.5C18.31 4.5 21 7.19 21 10.5Z" stroke="currentColor" strokeWidth="2"/>
                                                <circle cx="12" cy="10.5" r="2.5" stroke="currentColor" strokeWidth="2"/>
                                            </svg>
                                        </div>
                                        <div className="info-label">Email</div>
                                        <div className="info-value">{email}</div>
                                    </div>
                                    <div className="info-row">
                                        <div className="info-icon" aria-hidden="true">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M22 16.92V19A2 2 0 0 1 20 21H4A2 2 0 0 1 2 19V16.92A5 5 0 0 1 4.26 12.36L5.68 10.94A2 2 0 0 1 8.32 10.94L9.74 12.36A5 5 0 0 1 12 13.5A5 5 0 0 1 14.26 12.36L15.68 10.94A2 2 0 0 1 18.32 10.94L19.74 12.36A5 5 0 0 1 22 16.92Z" stroke="currentColor" strokeWidth="2"/>
                                                <circle cx="12" cy="17" r="1" stroke="currentColor" strokeWidth="2"/>
                                            </svg>
                                        </div>
                                        <div className="info-label">Phone</div>
                                        <div className="info-value">{phone}</div>
                                    </div>
                                    <div className="info-row info-address">
                                        <div className="info-icon" aria-hidden="true">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M4 4H20V20H4V4Z" stroke="currentColor" strokeWidth="2"/>
                                                <path d="M4 9H20" stroke="currentColor" strokeWidth="2"/>
                                                <path d="M9 20V9" stroke="currentColor" strokeWidth="2"/>
                                            </svg>
                                        </div>
                                        <div className="info-label">Address</div>
                                        <div className="info-value multiline">{addressParts.join(',\n')}</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="no-address-message">
                                    <div style={{textAlign: 'center', padding: '20px', color: '#666'}}>
                                        <svg width="48" height="48" fill="none" viewBox="0 0 24 24" style={{margin: '0 auto 16px', opacity: 0.5}}>
                                            <path d="M21 10.5C21 16.5 12 21 12 21C12 21 3 16.5 3 10.5C3 7.18629 5.68629 4.5 9 4.5C10.6569 4.5 12 5.84315 12 7.5C12 5.84315 13.3431 4.5 15 4.5C18.3137 4.5 21 7.18629 21 10.5Z" stroke="currentColor" strokeWidth="2"/>
                                            <circle cx="12" cy="10.5" r="2.5" stroke="currentColor" strokeWidth="2"/>
                                        </svg>
                                        <p style={{margin: '0 0 16px', fontSize: '16px'}}>No shipping address found</p>
                                        <p style={{margin: '0 0 20px', fontSize: '14px', color: '#888'}}>Please add an address to continue with your order</p>
                                        <button 
                                            className="btn-primary"
                                            onClick={handleManageAddresses}
                                        >
                                            Add Address
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Shipping Methods Section */}
                    <div className="checkout-section">
                        <div className="section-header">
                            <div className="section-number">2</div>
                            <TruckIcon />
                            <span>Shipping Methods</span>
                        </div>
                        <div className="section-content">
                            <div className="payment-methods">
                                {/* Pick up option (free) */}
                                <div
                                    className={`payment-method ${shippingMethod === 'pickup' ? 'selected' : ''}`}
                                    onClick={() => setShippingMethod('pickup')}
                                >
                                    <div className="payment-method-header">
                                        <div className="payment-method-radio"></div>
                                        <span className="payment-method-name">Pick up</span>
                                    </div>
                                    <div className="payment-method-description">
                                        Pick up your order at our store. This option is free of delivery charge.
                                    </div>
                                </div>

                                {/* Dynamic delivery types from DB */}
                                {deliveryRates.map(rate => (
                                    <div
                                        key={rate.RateID}
                                        className={`payment-method ${String(shippingMethod) === String(rate.RateID) ? 'selected' : ''}`}
                                        onClick={() => setShippingMethod(String(rate.RateID))}
                                    >
                                        <div className="payment-method-header">
                                            <div className="payment-method-radio"></div>
                                            <span className="payment-method-name">{rate.ServiceType}</span>
                                        </div>
                                        <div className="payment-method-description">
                                            {`Delivery charge: ${formatPrice(Number(rate.Price || 0))}`}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>


                </div>

                {/* Order Summary Sidebar */}
                <div className="order-summary">
                    <div className="order-summary-header">
                        <h3>
                            <span className="summary-icon">
                                <CartIcon />
                            </span>
                            ORDER SUMMARY
                        </h3>
                    </div>
                    <div className="order-summary-content">
                        {/* Cart Items */}
                        <div className="cart-items">
                            {items.map((item) => {
                                // Handle product images - support both single image and images array
                                const getImageUrl = () => {
                                    const product = item.product;
                                    if (!product) return '/logo192.png';
                                    
                                    // Prefer variation image if a variation is selected
                                    if (!item.useOriginalProduct && item.selectedVariation && item.selectedVariation.imageUrl) {
                                        return item.selectedVariation.imageUrl.startsWith('http')
                                            ? item.selectedVariation.imageUrl
                                            : `http://localhost:5000${item.selectedVariation.imageUrl}`;
                                    }
                                    
                                    // First try to get from images array (from API)
                                    if (product.images && product.images.length > 0) {
                                        const imageUrl = product.images[0];
                                        if (imageUrl.startsWith('/')) {
                                            return `http://localhost:5000${imageUrl}`;
                                        }
                                        return imageUrl;
                                    }
                                    
                                    // Fallback to single image field
                                    if (product.image) {
                                        if (product.image.startsWith('/')) {
                                            return `http://localhost:5000${product.image}`;
                                        }
                                        return product.image;
                                    }
                                    
                                    // Final fallback
                                    return '/logo192.png';
                                };

                                const imageUrl = getImageUrl();
                                
                                return (
                                    <div key={item.id} className="cart-item">
                                        <img 
                                            src={imageUrl}
                                            alt={item.product ? item.product.name : 'Product'}
                                            className="cart-item-image"
                                            onError={(e) => {
                                                e.target.src = '/logo192.png';
                                                e.target.onerror = null; // Prevent infinite loop
                                            }}
                                        />
                                        <div className="cart-item-details">
                                            <div className="cart-item-name">{item.product ? item.product.name : ''}</div>
                                            
                                            {/* Variation display in checkout */}
                                            {item.product && (item.product.useOriginalProduct || !item.product.selectedVariation) ? (
                                                <span className="variant-pill">Standard</span>
                                            ) : item.product && item.product.selectedVariation ? (
                                                <span className="variant-pill">
                                                    Variant: {item.product.selectedVariation.name}
                                                    {item.product.selectedVariation.color ? ` · ${item.product.selectedVariation.color}` : ''}
                                                </span>
                                            ) : null}
                                            
                                            <div className="cart-item-quantity">Qty: {item.quantity}</div>
                                            {item.product && item.product.hasDiscount && item.product.discountInfo && (
                                                <div className="cart-item-discount">
                                                    <span className="discount-badge-small">
                                                        {item.product.discountInfo.discountType === 'percentage' 
                                                            ? `-${item.product.discountInfo.discountValue}%` 
                                                            : `-${formatPrice(item.product.discountInfo.discountAmount)}`
                                                        }
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="cart-item-price">
                                            {formatPrice(item.price * item.quantity)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Order Totals */}
                        <div className="order-totals">
                            <div className="total-row final">
                                <span>Order Total:</span>
                                <span>{formatPrice(getTotal())}</span>
                            </div>
                        </div>
                        {/* Removed Payment Checkout section */}
                        <button 
                            className="place-order-btn" 
                            style={{width: '100%', marginTop: 16}}
                            onClick={() => {
                                // Preserve selection for payment page
                                setShowTermsModal(true);
                            }}
                        >
                            Pay Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
