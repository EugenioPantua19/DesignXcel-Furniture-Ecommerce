import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../../shared/contexts/CartContext';
import { useCurrency } from '../../../shared/contexts/CurrencyContext';
import CartItem from '../components/CartItem';
import ConfirmationModal from '../../../shared/components/ui/ConfirmationModal';
import ModernPageHeader from '../../../shared/components/layout/ModernPageHeader';
import { 
  ShoppingCartIcon, 
  TrashIcon, 
  PlusIcon, 
  MinusIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ArrowLeftIcon
} from '../../../shared/components/ui/SvgIcons';
import '../components/cart-discounts.css';

const Cart = () => {
    const navigate = useNavigate();
    const { items, updateQuantity, removeFromCart, clearCart, getCartTotal } = useCart();
    const { formatPrice } = useCurrency();
    const [showClearConfirmation, setShowClearConfirmation] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [itemToRemove, setItemToRemove] = useState(null);

    // Track checked state for each cart item
    const [checkedItems, setCheckedItems] = useState(() =>
      Object.fromEntries(items.map(item => [item.id, true]))
    );

    // Update checked state if items change (e.g., add/remove)
    React.useEffect(() => {
      setCheckedItems(prev => {
        const newChecked = { ...prev };
        items.forEach(item => {
          if (!(item.id in newChecked)) newChecked[item.id] = true;
        });
        // Remove unchecked items that no longer exist
        Object.keys(newChecked).forEach(id => {
          if (!items.find(item => item.id === id)) delete newChecked[id];
        });
        return newChecked;
      });
    }, [items]);

    const handleCheck = (id, checked) => {
      setCheckedItems(prev => ({ ...prev, [id]: checked }));
    };

    const handleQuantityChange = (itemId, newQuantity) => {
        if (newQuantity <= 0) {
            setItemToRemove(itemId);
            setShowRemoveModal(true);
        } else {
            updateQuantity(itemId, newQuantity);
        }
    };

    const handleRemoveItem = () => {
        if (itemToRemove) {
            removeFromCart(itemToRemove);
            setItemToRemove(null);
        }
        setShowRemoveModal(false);
    };

    const handleClearCart = () => {
        clearCart();
        setShowClearConfirmation(false);
    };

    // Calculate values for only checked items
    const checkedCartItems = items.filter(item => checkedItems[item.id]);
    const subtotal = checkedCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal;

    // Handler for checkout button
    const handleProceedToCheckout = () => {
      const checked = items.filter(item => checkedItems[item.id]);
      navigate('/checkout', { state: { items: checked } });
    };

    if (items.length === 0) {
        return (
            <div className="cart-page">
                <div className="container">
                    <div className="cart-empty-page">
                        <div className="empty-cart-content">
                            <div className="empty-cart-icon">
                                <ShoppingCartIcon size={64} color="#9ca3af" />
                            </div>
                            <h1>Your Cart is Empty</h1>
                            <p>Looks like you haven't added any items to your cart yet.</p>
                            <div className="empty-cart-actions">
                                <Link to="/products" className="btn btn-primary btn-large">
                                    <PlusIcon size={16} color="#ffffff" style={{ marginRight: '8px' }} />
                                    Continue Shopping
                                </Link>
                                <Link to="/" className="btn btn-secondary">
                                    <ArrowLeftIcon size={16} color="#6b7280" style={{ marginRight: '8px' }} />
                                    Back to Home
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <div className="container">
                <ModernPageHeader
                    breadcrumbs={[
                        { label: 'Home', href: '/' },
                        { label: 'Shopping Cart' }
                    ]}
                    title="Shopping Cart"
                    subtitle={`${items.length} ${items.length === 1 ? 'item' : 'items'} in your cart`}
                />

                <div className="cart-layout">
                    <div className="cart-main">
                        <div className="cart-items-header">
                            <h2>Items in Your Cart</h2>
                            <button
                                className="clear-cart-btn"
                                onClick={() => setShowClearConfirmation(true)}
                            >
                                <TrashIcon size={16} color="#ef4444" style={{ marginRight: '6px' }} />
                                Clear All
                            </button>
                        </div>

                        <div className="cart-items-list">
                            {items.map(item => (
                                <div key={item.id} className="cart-item-wrapper">
                                    <CartItem 
                                      item={item} 
                                      checked={checkedItems[item.id] ?? true}
                                      onCheck={handleCheck}
                                      onUpdateQuantity={handleQuantityChange}
                                      onRemove={(itemId) => {
                                          setItemToRemove(itemId);
                                          setShowRemoveModal(true);
                                      }}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="cart-actions-bottom">
                            <Link to="/products" className="btn btn-secondary">
                                <ArrowLeftIcon size={16} color="#6b7280" style={{ marginRight: '8px' }} />
                                Continue Shopping
                            </Link>
                        </div>
                    </div>

                    <div className="cart-sidebar-summary">
                        <div className="cart-summary-card">
                            <h3>Order Summary</h3>
                            
                            <div className="summary-details">
                                <div className="summary-row total">
                                    <span>Total ({checkedCartItems.length} items):</span>
                                    <span>{formatPrice(total)}</span>
                                </div>
                            </div>

                            <div className="checkout-actions">
                                <button
                                    className="btn btn-primary btn-full btn-large"
                                    onClick={handleProceedToCheckout}
                                    disabled={items.filter(item => checkedItems[item.id]).length === 0}
                                >
                                    <CheckCircleIcon size={16} color="#ffffff" style={{ marginRight: '8px' }} />
                                    Proceed to Checkout
                                </button>

                                <div className="payment-methods">
                                    <p>We accept:</p>
                                    <div className="payment-icons">
                                        <CreditCardIcon size={20} color="#6b7280" />
                                        <CreditCardIcon size={20} color="#6b7280" />
                                        <CreditCardIcon size={20} color="#6b7280" />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Clear Cart Confirmation Modal */}
            <ConfirmationModal
                isOpen={showClearConfirmation}
                onClose={() => setShowClearConfirmation(false)}
                onConfirm={handleClearCart}
                title="Clear Shopping Cart"
                message="Are you sure you want to remove all items from your cart? This action cannot be undone."
                confirmText="Clear Cart"
                cancelText="Keep Items"
                type="warning"
            />

            {/* Remove Item Confirmation Modal */}
            <ConfirmationModal
                isOpen={showRemoveModal}
                onClose={() => setShowRemoveModal(false)}
                onConfirm={handleRemoveItem}
                title="Remove Item"
                message={`Are you sure you want to remove this item from your cart?`}
                confirmText="Remove"
                cancelText="Cancel"
                type="warning"
            />
        </div>
    );
};

export default Cart;
