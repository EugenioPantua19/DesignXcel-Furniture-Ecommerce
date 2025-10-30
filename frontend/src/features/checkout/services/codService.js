import apiClient from '../../../shared/services/api/apiClient';

class CodService {
    constructor() {
        console.log('💵 COD Service initialized');
    }

    /**
     * Create a Cash on Delivery order
     * @param {Object} orderData - Order data including items, customer info, etc.
     * @returns {Promise<Object>} Created order response
     */
    async createCodOrder(orderData) {
        try {
            console.log('Creating COD order:', orderData);
            
            const response = await apiClient.post('/api/orders/cash-on-delivery', orderData);
            
            if (response.success) {
                console.log('COD order created successfully:', response.orderId);
                return {
                    success: true,
                    orderId: response.orderId,
                    message: response.message || 'Order placed successfully! You will pay when your order arrives.'
                };
            } else {
                throw new Error(response.message || 'Failed to create COD order');
            }
        } catch (error) {
            console.error('COD order creation error:', error);
            throw error;
        }
    }

    /**
     * Validate COD order data
     * @param {Object} orderData - Order data to validate
     * @returns {Object} Validation result
     */
    validateOrderData(orderData) {
        const errors = [];

        if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
            errors.push('No items provided for order');
        }

        if (!orderData.email || !orderData.email.includes('@')) {
            errors.push('Valid email address is required');
        }

        if (orderData.total <= 0) {
            errors.push('Invalid order total');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get COD payment method display info
     * @returns {Object} Display information
     */
    getPaymentMethodInfo() {
        return {
            name: 'Cash on Delivery',
            description: 'Pay when your order arrives',
            icon: '💵',
            processingTime: 'Order will be processed immediately',
            deliveryNote: 'Payment will be collected upon delivery'
        };
    }
}

export default new CodService();
