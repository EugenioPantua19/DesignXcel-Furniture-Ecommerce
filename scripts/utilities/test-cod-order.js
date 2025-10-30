// Test script for COD order creation
// This script helps test the COD order endpoint

const axios = require('axios');

async function testCodOrder() {
    try {
        console.log('🧪 Testing COD Order Creation...');
        
        // Test data
        const testOrderData = {
            items: [
                {
                    id: 1, // Assuming product ID 1 exists
                    productId: 1,
                    name: 'Test Product',
                    price: 100.00,
                    quantity: 1
                }
            ],
            email: 'test@designxcel.com',
            subtotal: 100.00,
            shippingCost: 50.00,
            total: 150.00,
            deliveryType: 'pickup',
            shippingAddressId: null
        };
        
        console.log('📦 Test order data:', testOrderData);
        
        // Make request to COD endpoint
        const response = await axios.post(
            'https://designexcellinventory-production.up.railway.app/api/orders/cash-on-delivery',
            testOrderData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    // Note: This test will fail without proper session authentication
                    // In real usage, the session cookie would be included
                },
                withCredentials: true
            }
        );
        
        console.log('✅ COD Order test successful!');
        console.log('Response:', response.data);
        
    } catch (error) {
        console.error('❌ COD Order test failed:');
        
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response:', error.response.data);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error:', error.message);
        }
    }
}

// Run the test
testCodOrder();
