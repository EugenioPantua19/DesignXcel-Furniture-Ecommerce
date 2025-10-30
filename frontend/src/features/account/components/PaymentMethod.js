import React from 'react';
import { CreditCardIcon, TruckIcon, CheckCircleIcon } from '../../../shared/components/ui/SvgIcons';

const PaymentMethod = () => {
  return (
    <div className="tab-container">
      {/* Header */}
      <div className="tab-header">
        <div className="tab-header-content">
          <div className="tab-header-icon">
            <CreditCardIcon size={24} />
          </div>
          <div className="tab-header-text">
            <h1 className="tab-title">Payment Methods</h1>
            <p className="tab-subtitle">Manage your payment options and preferences</p>
          </div>
        </div>
      </div>

      {/* Payment Methods Grid */}
      <div className="payment-methods-grid">
        {/* Cash on Delivery */}
        <div className="payment-method-card">
          <div className="payment-method-header">
            <div className="payment-method-icon cod">
              <TruckIcon size={24} />
            </div>
            <div className="payment-method-info">
              <h3 className="payment-method-title">Cash on Delivery</h3>
              <p className="payment-method-description">Pay when your order is delivered</p>
            </div>
            <div className="payment-method-status">
              <span className="status-badge available">Available</span>
            </div>
          </div>
        </div>

        {/* E-Wallet (Stripe) */}
        <div className="payment-method-card">
          <div className="payment-method-header">
            <div className="payment-method-icon ewallet">
              <CreditCardIcon size={24} />
            </div>
            <div className="payment-method-info">
              <h3 className="payment-method-title">E-Wallet</h3>
              <p className="payment-method-description">Secure online payment processing</p>
            </div>
            <div className="payment-method-status">
              <span className="status-badge available">Available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="payment-info-section">
        <div className="section-header">
          <div className="section-title-wrapper">
            <div className="section-icon">
              <CheckCircleIcon size={20} />
            </div>
            <h2 className="section-title">Payment Information</h2>
          </div>
        </div>
        <div className="info-grid">
          <div className="info-card">
            <h4>Cash on Delivery</h4>
            <ul>
              <li>Pay with cash when your order arrives</li>
              <li>No need for online payment setup</li>
              <li>Perfect for customers who prefer cash transactions</li>
              <li>Driver will provide receipt upon payment</li>
            </ul>
          </div>
          <div className="info-card">
            <h4>E-Wallet (Stripe)</h4>
            <ul>
              <li>Secure payment processing via Stripe</li>
              <li>Supports major credit/debit cards</li>
              <li>Instant payment confirmation</li>
              <li>PCI DSS compliant for maximum security</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethod;
