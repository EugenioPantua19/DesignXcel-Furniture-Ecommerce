import React from 'react';
import { useAuth } from '../../auth/hooks/useAuth';

const CheckoutModal = ({ isOpen, onClose, onConfirm, ...props }) => {
  const { user } = useAuth();

  if (!isOpen) return null;

  // Example: assuming user.address contains the shipping address object
  const shipping = user && user.address ? user.address : {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Checkout</h2>
        
        <div className="space-y-4">
          <div className="checkout-shipping-section">
            <h3>Shipping Address</h3>
            <div className="shipping-address-display">
              <div><strong>Name:</strong> {shipping.firstName} {shipping.lastName}</div>
              <div><strong>Address:</strong> {shipping.address}</div>
              <div><strong>City:</strong> {shipping.city}</div>
              <div><strong>Province:</strong> {shipping.province}</div>
              <div><strong>Postal Code:</strong> {shipping.postalCode}</div>
              <div><strong>Country:</strong> {shipping.country}</div>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Phone:</strong> {shipping.phoneNumber}</div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="credit">Credit Card</option>
              <option value="debit">Debit Card</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal; 