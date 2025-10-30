# Railway Environment Variables Setup

## Required Environment Variables for Backend

You need to set these environment variables in your Railway backend project dashboard:

### Email Configuration (OTP)
```
OTP_EMAIL_USER=design.xcel01@gmail.com
OTP_EMAIL_PASS=mdvc ebdd axqj lhug
```

### Database Configuration
```
DB_CONNECTION_STRING=Server=tcp:designxcell-server.database.windows.net,1433;Initial Catalog=DesignXcellDB;Persist Security Info=False;User ID=designxcell;Password=Azwrath22@;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=True;Connection Timeout=30;
```

### Security Configuration
```
SESSION_SECRET=3dbe3c8c38fcdc1b784c8d3942e147555fc01d017d91875c9db08ee410f545a6c94b5314bb0ef9eb503df014d4c909bb7712ef12fb41c732f553e7649b5d6304
JWT_SECRET=7dd59ca84202f0949fa206bff6862e43314974250245f654f52f15d5e8a3b823a5ad93df348c91e6b309740bea3195518d2c11ddc341a7ca2a0d80341da17783
JWT_EXPIRES_IN=24h
```

### Stripe Configuration
```
STRIPE_SECRET_KEY=sk_test_51RCLlxPoc51pdmcaRdEOLr1oO3eIIuM3mry7cIkHFQuhukWXcE3ImEEcGz5NggwuFwpbLIRGhUOjkfM8uRJCrrlJ00snnxrsrb
STRIPE_WEBHOOK_SECRET=whsec_36c2b51ed69a2e0688d89394559a391ae1cc3812335ed0c2d1564a81c76a8dc8
```

### Frontend URL Configuration
```
FRONTEND_URL=https://designxcellwebsite-production.up.railway.app
CORS_ORIGIN=https://designxcellwebsite-production.up.railway.app
ALLOWED_ORIGINS=https://designxcellwebsite-production.up.railway.app,http://localhost:3000
```

### Production Settings
```
NODE_ENV=production
PORT=5000
DEBUG=false
LOG_LEVEL=info
FORCE_HTTPS=true
HELMET_ENABLED=true
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12
```

## How to Set Environment Variables in Railway:

1. Go to your Railway dashboard
2. Select your backend project (designexcellinventory-production)
3. Go to the "Variables" tab
4. Add each environment variable listed above
5. Click "Deploy" to apply the changes

## Testing the Setup:

After setting the environment variables, test the OTP functionality:

1. **Test OTP Endpoint:**
   ```bash
   curl -X POST https://designexcellinventory-production.up.railway.app/api/auth/test-otp \
   -H "Content-Type: application/json" \
   -d '{"email":"your-test-email@gmail.com"}'
   ```

2. **Test Customer Login:**
   - Try logging in with an existing customer account
   - Check the Railway logs for detailed error messages

## Troubleshooting:

### If OTP emails are not being sent:
1. Verify Gmail App Password is correct
2. Check Railway logs for email sending errors
3. Ensure Gmail account has 2FA enabled and app password is generated

### If customer login fails:
1. Check if the customer exists in the database
2. Verify the password is correct
3. Check if the account is active (IsActive = 1)

### If you need to create a test customer:
You can use the registration endpoint or manually insert into the database.
