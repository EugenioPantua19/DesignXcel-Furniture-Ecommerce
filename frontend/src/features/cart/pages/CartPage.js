import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../../shared/contexts/CartContext';
import { useCurrency } from '../../../shared/contexts/CurrencyContext';
import CartItem from '../components/CartItem';
import AudioLoader from '../../../shared/components/ui/AudioLoader';
import ConfirmationModal from '../../../shared/components/ui/ConfirmationModal';
import PageHeader from '../../../shared/components/layout/PageHeader';
import { ChristmasHeaderDecoration, ChristmasFooterDecoration } from '../../../shared/components/christmas';
import '../components/cart.css';
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
    const { items, updateQuantity, removeFromCart, clearCart, getTotal, getSubtotal, getItemCount } = useCart();
    const { formatPrice } = useCurrency();
    const [showClearConfirmation, setShowClearConfirmation] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [itemToRemove, setItemToRemove] = useState(null);
    const [currentTheme, setCurrentTheme] = useState('default');

    // Track checked state for each cart item
    const [checkedItems, setCheckedItems] = useState(() =>
      Object.fromEntries(items.map(item => [item.id, true]))
    );

    // Update checked state when items change
    useEffect(() => {
        // Update checked state for new items
        setCheckedItems(prev => {
            const newChecked = { ...prev };
            items.forEach(item => {
                if (!(item.id in newChecked)) {
                    newChecked[item.id] = true;
                }
            });
            return newChecked;
        });
    }, [items]);

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
    const totalQuantity = checkedCartItems.reduce((sum, item) => sum + item.quantity, 0);

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
                                    Continue Shopping
                                </Link>
                                <Link to="/" className="btn btn-secondary">
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
                {currentTheme === 'christmas' && <ChristmasHeaderDecoration />}
                <PageHeader
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
                                Clear All
                            </button>
                        </div>

                        <div className="cart-table-header">
                            <div className="header-product">Product</div>
                            <div className="header-price">Price</div>
                            <div className="header-quantity">Quantity</div>
                            <div className="header-subtotal">Subtotal</div>
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
                                Continue Shopping
                            </Link>
                        </div>
                    </div>

                    <div className="cart-sidebar-summary">
                        <div className="cart-summary-card">
                            
                            <div className="summary-details">
                                <div className="summary-row total">
                                    <span>Total ({totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}):</span>
                                    <span>{formatPrice(total)}</span>
                                </div>
                            </div>

                            <div className="checkout-actions">
                                <button
                                    className="btn btn-primary btn-full btn-large"
                                    onClick={handleProceedToCheckout}
                                    disabled={items.filter(item => checkedItems[item.id]).length === 0}
                                >
                                    Proceed to Checkout
                                </button>

                                <div className="payment-methods">
                                    <p>We accept all major credit cards</p>
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
            {currentTheme === 'christmas' && <ChristmasFooterDecoration />}
        </div>
    );
};

export default Cart;
