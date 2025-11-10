class PaymentService {
    constructor() {
        this._apiClient = null;
        this._apiConfig = null;
        this._initialized = false;
    }

    async _initialize() {
        if (!this._initialized) {
            // Lazy load to avoid circular dependencies
            if (!this._apiConfig) {
                const apiConfigModule = await import('../../../shared/services/api/apiConfig.js');
                this._apiConfig = apiConfigModule.default || apiConfigModule;
            }
            if (!this._apiClient) {
                const apiClientModule = await import('../../../shared/services/api/apiClient');
                this._apiClient = apiClientModule.default || apiClientModule;
            }

            // Check if payment processing is enabled
            if (!this._apiConfig.isFeatureEnabled('paymentProcessing')) {
                console.warn('⚠️ Payment processing is disabled');
            }

            // Get payment configuration
            this.config = this._apiConfig.getPaymentConfig();

            if (this._apiConfig.debugMode) {
                console.log('💳 Payment Service initialized');
            }

            this._initialized = true;
        }
    }

    async _ensureInitialized() {
        if (!this._initialized) {
            await this._initialize();
        }
    }

    async getApiClient() {
        await this._ensureInitialized();
        return this._apiClient;
    }

    async getApiConfig() {
        await this._ensureInitialized();
        return this._apiConfig;
    }







    /**
     * Create an order
     * @param {Object} orderData - Order data
     * @returns {Promise<Object>} Created order data
     */
    async createOrder(orderData) {
        await this._ensureInitialized();
        try {
            const apiConfig = await this.getApiConfig();
            if (!apiConfig.isFeatureEnabled('paymentProcessing')) {
                throw new Error('Payment processing is disabled');
            }

            const apiClient = await this.getApiClient();
            const response = await apiClient.post(apiConfig.getEndpoint('orders'), orderData);
            return response;
        } catch (error) {
            console.error('Create order error:', error);
            throw error;
        }
    }

    /**
     * Get user addresses
     * @returns {Promise<Object>} User addresses
     */
    async getUserAddresses() {
        await this._ensureInitialized();
        try {
            const apiClient = await this.getApiClient();
            const response = await apiClient.get('/users/addresses');
            return response.data;
        } catch (error) {
            console.error('Get user addresses error:', error);
            throw new Error(error.response?.data?.error || 'Failed to get user addresses');
        }
    }

    /**
     * Create user address
     * @param {Object} addressData - Address data
     * @returns {Promise<Object>} Created address data
     */
    async createUserAddress(addressData) {
        await this._ensureInitialized();
        try {
            const apiClient = await this.getApiClient();
            const response = await apiClient.post('/users/addresses', addressData);
            return response.data;
        } catch (error) {
            console.error('Create user address error:', error);
            throw new Error(error.response?.data?.error || 'Failed to create address');
        }
    }

    /**
     * Format amount for display
     * @param {number} amount - Amount in PHP
     * @param {string} currency - Currency code
     * @returns {string} Formatted amount
     */
    formatAmount(amount, currency = 'PHP') {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }



    /**
     * Get payment method display name
     * @param {string} type - Payment method type
     * @returns {string} Display name
     */
    getPaymentMethodDisplayName(type) {
        const displayNames = {
            'card': 'Credit/Debit Card',
            'gcash': 'GCash',
            'grabpay': 'GrabPay',
            'paymaya': 'PayMaya',
            'stripe': 'E-Wallet',
            'E-Wallet': 'E-Wallet'
        };
        return displayNames[type] || type;
    }

    /**
     * Get payment method icon
     * @param {string} type - Payment method type
     * @returns {string} Icon class or emoji
     */
    getPaymentMethodIcon(type) {
        const icons = {
            'card': '💳',
            'gcash': '📱',
            'grabpay': '🚗',
            'paymaya': '💰',
            'bank_transfer': '🏦',
            'cod': '💵',
            'stripe': '💳'
        };
        return icons[type] || '💳';
    }

    /**
     * Validate card number (basic Luhn algorithm)
     * @param {string} cardNumber - Card number
     * @returns {boolean} Is valid
     */
    validateCardNumber(cardNumber) {
        const cleanNumber = cardNumber.replace(/\s/g, '');
        if (!/^\d{13,19}$/.test(cleanNumber)) return false;

        let sum = 0;
        let isEven = false;
        
        for (let i = cleanNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cleanNumber[i]);
            
            if (isEven) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            
            sum += digit;
            isEven = !isEven;
        }
        
        return sum % 10 === 0;
    }

    /**
     * Format card number for display
     * @param {string} cardNumber - Card number
     * @returns {string} Formatted card number
     */
    formatCardNumber(cardNumber) {
        const cleanNumber = cardNumber.replace(/\s/g, '');
        return cleanNumber.replace(/(.{4})/g, '$1 ').trim();
    }

    /**
     * Get card brand from number
     * @param {string} cardNumber - Card number
     * @returns {string} Card brand
     */
    getCardBrand(cardNumber) {
        const cleanNumber = cardNumber.replace(/\s/g, '');
        
        if (/^4/.test(cleanNumber)) return 'visa';
        if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
        if (/^3[47]/.test(cleanNumber)) return 'amex';
        if (/^6(?:011|5)/.test(cleanNumber)) return 'discover';
        
        return 'unknown';
    }
}

// Export singleton instance with lazy initialization
let paymentServiceInstance = null;

const getPaymentService = () => {
    if (!paymentServiceInstance) {
        paymentServiceInstance = new PaymentService();
    }
    return paymentServiceInstance;
};

export default {
    get instance() {
        return getPaymentService();
    },
    // Proxy methods for convenience
    async createOrder(orderData) {
        return getPaymentService().createOrder(orderData);
    },
    async getUserAddresses() {
        return getPaymentService().getUserAddresses();
    },
    async createUserAddress(addressData) {
        return getPaymentService().createUserAddress(addressData);
    },
    formatAmount(amount, currency) {
        return getPaymentService().formatAmount(amount, currency);
    },
    getPaymentMethodDisplayName(type) {
        return getPaymentService().getPaymentMethodDisplayName(type);
    },
    getPaymentMethodIcon(type) {
        return getPaymentService().getPaymentMethodIcon(type);
    },
    validateCardNumber(cardNumber) {
        return getPaymentService().validateCardNumber(cardNumber);
    },
    formatCardNumber(cardNumber) {
        return getPaymentService().formatCardNumber(cardNumber);
    },
    getCardBrand(cardNumber) {
        return getPaymentService().getCardBrand(cardNumber);
    }
};
