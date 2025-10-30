// Test script to check Railway endpoints
// This script tests both OTP and COD functionality

const axios = require('axios');

const BASE_URL = 'https://designexcellinventory-production.up.railway.app';

async function testRailwayEndpoints() {
    console.log('🚀 Testing Railway Endpoints...\n');
    
    // Test 1: Check if server is running
    try {
        console.log('1️⃣ Testing server health...');
        const healthResponse = await axios.get(`${BASE_URL}/api/health`);
        console.log('✅ Server is running:', healthResponse.data);
    } catch (error) {
        console.log('❌ Server health check failed:', error.response?.status || error.message);
    }
    
    // Test 2: Test OTP email functionality
    try {
        console.log('\n2️⃣ Testing OTP email functionality...');
        const otpResponse = await axios.post(`${BASE_URL}/api/auth/test-otp`, {
            email: 'test@example.com'
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('✅ OTP Test Response:', otpResponse.data);
    } catch (error) {
        console.log('❌ OTP Test Failed:', error.response?.data || error.message);
    }
    
    // Test 3: Test OTP sending
    try {
        console.log('\n3️⃣ Testing OTP sending...');
        const sendOtpResponse = await axios.post(`${BASE_URL}/api/auth/send-otp`, {
            email: 'test.railway@designxcel.com'
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('✅ Send OTP Response:', sendOtpResponse.data);
    } catch (error) {
        console.log('❌ Send OTP Failed:', error.response?.data || error.message);
    }
    
    // Test 4: Test COD order endpoint (without authentication - should fail with 401)
    try {
        console.log('\n4️⃣ Testing COD order endpoint (expecting 401)...');
        const codResponse = await axios.post(`${BASE_URL}/api/orders/cash-on-delivery`, {
            items: [{ id: 1, quantity: 1, price: 100 }],
            total: 100
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('✅ COD Response (unexpected):', codResponse.data);
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ COD endpoint is working (401 Unauthorized as expected)');
        } else {
            console.log('❌ COD endpoint error:', error.response?.status, error.response?.data || error.message);
        }
    }
    
    // Test 5: Check environment variables
    try {
        console.log('\n5️⃣ Testing environment variables...');
        const envResponse = await axios.get(`${BASE_URL}/api/debug/env-check`);
        console.log('✅ Environment check:', envResponse.data);
    } catch (error) {
        console.log('❌ Environment check failed:', error.response?.data || error.message);
    }
    
    console.log('\n🏁 Railway endpoint testing completed!');
}

// Run the tests
testRailwayEndpoints().catch(console.error);
