import React from 'react';
import { Link } from 'react-router-dom';
import { useCurrency } from '../../contexts/CurrencyContext';
import { getImageUrl } from '../../utils/imageUtils';
import './cart-success-modal.css';

const CartSuccessModal = ({ 
  isOpen, 
  onClose, 
  product, 
  quantity, 
  onContinueShopping, 
  onViewCart 
}) => {
  const { formatPrice } = useCurrency();

  if (!isOpen || !product) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleContinueShopping = () => {
    onClose();
    if (onContinueShopping) {
      onContinueShopping();
    }
  };

  const handleViewCart = () => {
    onClose();
    if (onViewCart) {
      onViewCart();
    }
  };

  return (
    <div className="cart-success-modal-overlay" onClick={handleOverlayClick}>
      <div className="cart-success-modal">
        <button 
          className="cart-success-modal-close" 
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="cart-success-modal-content">
          {/* Success Icon */}
          <div className="cart-success-icon">
            <div className="success-icon-circle">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <div className="cart-success-message">
            <h2 className="cart-success-title">Added to Cart!</h2>
            <p className="cart-success-subtitle">
              {quantity} {quantity === 1 ? 'item' : 'items'} added successfully
            </p>
          </div>

          {/* Product Preview */}
          <div className="cart-success-product">
            <div className="product-preview-image">
              <img 
                src={getImageUrl(product.images?.[0])} 
                alt={product.name}
                onError={(e) => {
                  e.target.src = '/logo192.png';
                }}
              />
            </div>
            <div className="product-preview-details">
              <h3 className="product-preview-name">{product.name}</h3>
              <div className="product-preview-meta">
                <span className="product-preview-quantity">Qty: {quantity}</span>
                <span className="product-preview-price">
                  {formatPrice(product.price * quantity)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="cart-success-actions">
            <button 
              className="cart-success-btn cart-success-btn-secondary"
              onClick={handleContinueShopping}
            >
              Continue Shopping
            </button>
            <Link 
              to="/cart" 
              className="cart-success-btn cart-success-btn-primary"
              onClick={handleViewCart}
            >
              View Cart
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CartSuccessModal;
