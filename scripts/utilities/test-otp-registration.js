// Test script for OTP-based registration
// This script tests the complete OTP registration flow

const axios = require('axios');

async function testOtpRegistration() {
    try {
        console.log('🧪 Testing OTP Registration Flow...');
        
        const testEmail = 'test.otp@designxcel.com';
        const testData = {
            fullName: 'Test OTP User',
            email: testEmail,
            phoneNumber: '09123456789',
            password: 'TestPassword123!',
            confirmPassword: 'TestPassword123!'
        };
        
        console.log('📧 Step 1: Sending OTP to email:', testEmail);
        
        // Step 1: Send OTP
        const otpResponse = await axios.post(
            'https://designexcellinventory-production.up.railway.app/api/auth/send-otp',
            { email: testEmail },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ OTP Response:', otpResponse.data);
        
        if (!otpResponse.data.success) {
            console.error('❌ Failed to send OTP:', otpResponse.data.message);
            return;
        }
        
        // In development, the OTP is included in the response
        const otp = otpResponse.data.otp;
        if (!otp) {
            console.log('⚠️  OTP not provided in response. Check email or logs for the OTP code.');
            console.log('   You can manually test the registration with the OTP from your email.');
            return;
        }
        
        console.log('🔐 Step 2: Registering with OTP:', otp);
        
        // Step 2: Register with OTP
        const registrationData = {
            ...testData,
            otp: otp
        };
        
        const registerResponse = await axios.post(
            'https://designexcellinventory-production.up.railway.app/api/auth/customer/register-with-otp',
            registrationData,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Registration Response:', registerResponse.data);
        
        if (registerResponse.data.success) {
            console.log('🎉 OTP Registration test successful!');
            console.log('   User created:', registerResponse.data.user);
        } else {
            console.error('❌ Registration failed:', registerResponse.data.message);
        }
        
    } catch (error) {
        console.error('❌ OTP Registration test failed:');
        
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
testOtpRegistration();
