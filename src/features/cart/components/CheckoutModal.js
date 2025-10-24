import React from 'react';
import { useAuth } from '../../../shared/hooks/useAuth';

const CheckoutModal = ({ isOpen, onClose, onConfirm, ...props }) => {
  const { user } = useAuth();

  if (!isOpen) return null;

  // Example: assuming user.address contains the shipping address object
  const shipping = user && user.address ? user.address : {};

  return (
    <div className="checkout-modal-overlay" onClick={onClose}>
      <div className="checkout-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="checkout-modal-close" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div className="checkout-modal-header">
          <h2 className="checkout-modal-title">Checkout</h2>
        </div>
        
        <div className="checkout-modal-body">
          <div className="checkout-shipping-section">
            <h3 className="checkout-section-title">Shipping Address</h3>
            <div className="shipping-address-display">
              <div className="address-item">
                <strong>Name:</strong> {shipping.firstName} {shipping.lastName}
              </div>
              <div className="address-item">
                <strong>Address:</strong> {shipping.address}
              </div>
              <div className="address-item">
                <strong>City:</strong> {shipping.city}
              </div>
              <div className="address-item">
                <strong>Province:</strong> {shipping.province}
              </div>
              <div className="address-item">
                <strong>Postal Code:</strong> {shipping.postalCode}
              </div>
              <div className="address-item">
                <strong>Country:</strong> {shipping.country}
              </div>
              <div className="address-item">
                <strong>Email:</strong> {user.email}
              </div>
              <div className="address-item">
                <strong>Phone:</strong> {shipping.phoneNumber}
              </div>
            </div>
          </div>
          
          <div className="checkout-payment-section">
            <label className="checkout-label">
              Payment Method
            </label>
            <select className="checkout-select">
              <option value="credit">Credit Card</option>
              <option value="debit">Debit Card</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>
        </div>
        
        <div className="checkout-modal-footer">
          <button 
            onClick={onClose}
            className="checkout-btn checkout-btn-secondary"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="checkout-btn checkout-btn-primary"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal; 