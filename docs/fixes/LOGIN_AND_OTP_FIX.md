# Login and OTP Email Fix

## Issues Identified

### 1. Customer Login Error: "Invalid email or password"
**Root Cause**: The customer account doesn't exist in the database or the password is incorrect.

### 2. OTP Email Not Sending
**Root Cause**: Railway environment variables for email configuration may not be properly set.

## Solutions Implemented

### ✅ Solution 1: Railway Environment Variables Setup

**File Created**: `RAILWAY_ENV_SETUP.md`

**Action Required**: Set these environment variables in your Railway backend dashboard:

```bash
# Email Configuration (CRITICAL for OTP)
OTP_EMAIL_USER=design.xcel01@gmail.com
OTP_EMAIL_PASS=mdvc ebdd axqj lhug

# Database Configuration
DB_CONNECTION_STRING=Server=tcp:designxcell-server.database.windows.net,1433;Initial Catalog=DesignXcellDB;Persist Security Info=False;User ID=designxcel;Password=Azwrath22@;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=True;Connection Timeout=30;

# Security Configuration
SESSION_SECRET=3dbe3c8c38fcdc1b784c8d3942e147555fc01d017d91875c9db08ee410f545a6c94b5314bb0ef9eb503df014d4c909bb7712ef12fb41c732f553e7649b5d6304
JWT_SECRET=7dd59ca84202f0949fa206bff6862e43314974250245f654f52f15d5e8a3b823a5ad93df348c91e6b309740bea3195518d2c11ddc341a7ca2a0d80341da17783
JWT_EXPIRES_IN=24h

# Frontend URL Configuration
FRONTEND_URL=https://designxcellwebsite-production.up.railway.app
CORS_ORIGIN=https://designxcellwebsite-production.up.railway.app
ALLOWED_ORIGINS=https://designxcellwebsite-production.up.railway.app,http://localhost:3000

# Production Settings
NODE_ENV=production
PORT=5000
```

### ✅ Solution 2: Test Customer Account Creation

**File Created**: `backend/scripts/create-test-customer.js`

**Test Customer Credentials**:
- **Email**: `test@designxcel.com`
- **Password**: `TestPassword123!`
- **Full Name**: `Test Customer`

**How to Use**:
1. Run the script to create a test customer
2. Use the credentials above to test login functionality

### ✅ Solution 3: OTP Email Template Verified

**File**: `backend/templates/emails/auth/otp-email.html`
- ✅ Template is properly formatted
- ✅ Uses `{{OTP_CODE}}` placeholder correctly
- ✅ Professional design with security notices

## Step-by-Step Fix Instructions

### Step 1: Set Railway Environment Variables
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your backend project: `designexcellinventory-production`
3. Go to the **Variables** tab
4. Add all the environment variables listed in `RAILWAY_ENV_SETUP.md`
5. Click **Deploy** to apply changes

### Step 2: Create Test Customer Account
1. Run the test customer creation script:
   ```bash
   cd backend
   node scripts/create-test-customer.js
   ```
2. This will create a test customer with known credentials

### Step 3: Test the Fixes

#### Test OTP Functionality:
```bash
curl -X POST https://designexcellinventory-production.up.railway.app/api/auth/test-otp \
-H "Content-Type: application/json" \
-d '{"email":"your-email@gmail.com"}'
```

#### Test Customer Login:
Use the test credentials:
- Email: `test@designxcel.com`
- Password: `TestPassword123!`

### Step 4: Verify Email Configuration

**Gmail App Password Setup**:
1. Enable 2-Factor Authentication on `design.xcel01@gmail.com`
2. Generate an App Password: `mdvc ebdd axqj lhug`
3. Use this app password (not your regular Gmail password)

## Troubleshooting

### If OTP emails still don't send:
1. **Check Railway Logs**: Look for email sending errors
2. **Verify Gmail Settings**: Ensure 2FA is enabled and app password is correct
3. **Test Email Credentials**: Use the test endpoint to verify email configuration

### If customer login still fails:
1. **Check Database**: Verify the customer exists in the Customers table
2. **Check Account Status**: Ensure `IsActive = 1` in the database
3. **Verify Password**: Use the test customer script to reset password

### If you need to create a real customer account:
1. Use the registration endpoint: `POST /api/auth/customer/register`
2. Or manually insert into the database using the test script as a template

## Expected Results After Fix

✅ **OTP Emails**: Should be sent successfully to the provided email address
✅ **Customer Login**: Should work with the test credentials
✅ **Registration**: Should work with OTP verification
✅ **Password Reset**: Should work with email notifications

## Files Modified/Created

- ✅ `RAILWAY_ENV_SETUP.md` - Environment variables setup guide
- ✅ `backend/scripts/create-test-customer.js` - Test customer creation script
- ✅ `LOGIN_AND_OTP_FIX.md` - This comprehensive fix guide

## Next Steps

1. **Set Railway Environment Variables** (Critical)
2. **Create Test Customer Account**
3. **Test OTP Email Functionality**
4. **Test Customer Login**
5. **Deploy and Verify Everything Works**

The main issue is likely that the Railway environment variables are not properly set, especially the OTP email credentials. Once these are set correctly, both the OTP functionality and customer login should work properly.
