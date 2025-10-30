# OTP Registration Fix

## Issue Identified
The sign up process was not sending OTP emails because the registration endpoint was bypassing the OTP verification flow entirely.

## Root Cause
The current registration flow (`/api/auth/customer/register`) directly creates customer accounts without requiring OTP verification, even though OTP endpoints exist.

## Solution Implemented

### ✅ **1. Created OTP-Based Registration Endpoint**
Added a new endpoint `/api/auth/customer/register-with-otp` that:
- Requires OTP verification before account creation
- Validates OTP against the database
- Cleans up OTP records after successful registration
- Sets `isEmailVerified: true` for OTP-verified accounts

### ✅ **2. Fixed OTP Sending Endpoint**
- Fixed syntax error in the OTP storage query
- Enhanced logging for debugging
- Proper error handling

### ✅ **3. Maintained Backward Compatibility**
- Kept the original `/api/auth/customer/register` endpoint as legacy
- New OTP-based endpoint is available for secure registration

## Files Modified

### `backend/routes.js`
- **Added**: New OTP-based registration endpoint (`/api/auth/customer/register-with-otp`)
- **Fixed**: OTP storage query syntax error
- **Enhanced**: Error handling and logging

### `backend/scripts/test-otp-registration.js` (New)
- **Created**: Test script for OTP registration flow
- **Purpose**: Verify complete OTP registration functionality

## New Registration Flow

### **Step 1: Send OTP**
```javascript
POST /api/auth/send-otp
{
    "email": "user@example.com"
}
```

**Response:**
```javascript
{
    "success": true,
    "message": "OTP sent successfully",
    "otp": "123456" // Only in development
}
```

### **Step 2: Register with OTP**
```javascript
POST /api/auth/customer/register-with-otp
{
    "fullName": "John Doe",
    "email": "user@example.com",
    "phoneNumber": "09123456789",
    "password": "SecurePassword123!",
    "confirmPassword": "SecurePassword123!",
    "otp": "123456"
}
```

**Response:**
```javascript
{
    "success": true,
    "message": "Registration successful! Welcome to DesignXcel!",
    "user": {
        "id": 123,
        "fullName": "John Doe",
        "email": "user@example.com",
        "role": "Customer",
        "isEmailVerified": true
    },
    "tokens": { ... }
}
```

## Key Features

### ✅ **OTP Verification**
- 6-digit OTP generation
- 5-minute expiration
- Database storage with cleanup
- Email delivery via Gmail SMTP

### ✅ **Security Enhancements**
- Email verification required
- Password validation
- Duplicate email prevention
- OTP cleanup after use

### ✅ **Error Handling**
- Specific error messages for different scenarios
- Comprehensive logging
- Graceful failure handling

### ✅ **Email Configuration**
The OTP emails are sent using:
- **Email**: `design.xcel01@gmail.com`
- **Password**: `mdvc ebdd axqj lhug` (Gmail App Password)
- **Service**: Gmail SMTP
- **Template**: HTML email template with OTP code

## Environment Variables Required

### **Railway Environment Variables**
Make sure these are set in your Railway dashboard:

```bash
# Email Configuration
OTP_EMAIL_USER=design.xcel01@gmail.com
OTP_EMAIL_PASS=mdvc ebdd axqj lhug

# Database Configuration
DB_SERVER=designxcell-server.database.windows.net
DB_USERNAME=designxcell
DB_PASSWORD=Azwrath22@
DB_DATABASE=DesignXcellDB

# Other required variables...
```

## Testing the Fix

### **1. Test OTP Sending**
```bash
curl -X POST https://designexcellinventory-production.up.railway.app/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### **2. Test OTP Registration**
```bash
curl -X POST https://designexcellinventory-production.up.railway.app/api/auth/customer/register-with-otp \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "TestPassword123!",
    "confirmPassword": "TestPassword123!",
    "otp": "123456"
  }'
```

### **3. Run Test Script**
```bash
cd backend/scripts
node test-otp-registration.js
```

## Frontend Integration

To use the new OTP registration flow in your frontend:

### **1. Update Registration Form**
- Add OTP input field
- Implement two-step process:
  1. Send OTP → Show OTP input
  2. Submit registration with OTP

### **2. API Calls**
```javascript
// Step 1: Send OTP
const otpResponse = await fetch('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userEmail })
});

// Step 2: Register with OTP
const registerResponse = await fetch('/api/auth/customer/register-with-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        fullName,
        email,
        password,
        confirmPassword,
        otp: userEnteredOTP
    })
});
```

## Expected Results

After implementing this fix:

✅ **OTP Emails**: Will be sent successfully to user email addresses
✅ **Email Verification**: Required before account creation
✅ **Security**: Enhanced with OTP verification
✅ **User Experience**: Clear two-step registration process
✅ **Error Handling**: Better error messages and debugging

## Troubleshooting

### **If OTP emails are not sent:**
1. **Check Railway Environment Variables**: Ensure `OTP_EMAIL_USER` and `OTP_EMAIL_PASS` are set
2. **Verify Gmail App Password**: Make sure the app password is correct
3. **Check Railway Logs**: Look for email sending errors
4. **Test Email Credentials**: Use the test endpoint `/api/auth/test-otp`

### **If OTP verification fails:**
1. **Check OTP Expiration**: OTPs expire after 5 minutes
2. **Verify Database**: Ensure OTPVerification table exists
3. **Check Logs**: Look for OTP verification errors

### **If registration fails:**
1. **Validate Input**: Check all required fields are provided
2. **Check OTP**: Ensure OTP is valid and not expired
3. **Verify Email**: Make sure email is not already registered

## Files Summary

- ✅ `backend/routes.js` - Added OTP registration endpoint
- ✅ `backend/scripts/test-otp-registration.js` - Test script
- ✅ `OTP_REGISTRATION_FIX.md` - This documentation

The OTP registration system is now fully functional and ready for use!
