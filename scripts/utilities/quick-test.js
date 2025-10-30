// Quick test for Railway endpoints
const axios = require('axios');

async function quickTest() {
    const baseUrl = 'https://designexcellinventory-production.up.railway.app';
    
    try {
        // Test 1: Environment variables
        console.log('🔍 Checking environment variables...');
        const envResponse = await axios.get(`${baseUrl}/api/debug/env-check`);
        console.log('Environment check:', JSON.stringify(envResponse.data, null, 2));
        
        // Test 2: OTP test
        console.log('\n📧 Testing OTP...');
        const otpResponse = await axios.post(`${baseUrl}/api/auth/test-otp`, {
            email: 'test@example.com'
        });
        console.log('OTP test result:', JSON.stringify(otpResponse.data, null, 2));
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

quickTest();
