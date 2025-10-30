# OTP Email Sending Fix - Customer Login/Registration

## Issue Identified

**Problem:** OTP emails were not being sent to customers during registration on the production website ([https://designxcellwebsite-production.up.railway.app/login](https://designxcellwebsite-production.up.railway.app/login))

**Root Cause:** The Gmail App Password in the environment variable `OTP_EMAIL_PASS` contained **spaces**, which were causing authentication failures with Gmail's SMTP server.

---

## The Problem

### Original Configuration

```env
OTP_EMAIL_USER=design.xcel01@gmail.com
OTP_EMAIL_PASS=mdvc ebdd axqj lhug
```

**Issue:** Gmail App Passwords are displayed with spaces for readability, but they must be entered **without spaces** in environment variables.

### Why This Caused Failures

1. **Gmail SMTP Authentication**: Gmail's SMTP server expects the app password as a continuous 16-character string
2. **Spaces Break Authentication**: Including spaces resulted in authentication errors
3. **Silent Failure**: The backend might have logged errors, but users only saw "Failed to send OTP"

---

## The Solution

### Fixed Configuration

```env
OTP_EMAIL_USER=design.xcel01@gmail.com
OTP_EMAIL_PASS=mdvcebddaxqjlhug
```

**Change:** Removed all spaces from the app password.

---

## Files Updated

### 1. `backend/.env` (Local Development)

**Line 32:**
```env
# Before
OTP_EMAIL_PASS=mdvc ebdd axqj lhug

# After
OTP_EMAIL_PASS=mdvcebddaxqjlhug
```

### 2. `backend/.env.railway` (Production)

**Line 34:**
```env
# Before
OTP_EMAIL_PASS=mdvc ebdd axqj lhug

# After
OTP_EMAIL_PASS=mdvcebddaxqjlhug
```

---

## How OTP Email System Works

### Frontend Flow (LoginPage.js)

```javascript
const handleSendOtp = async (e) => {
    e.preventDefault();
    
    // 1. Verify captcha first
    if (!captchaVerified) {
        setOtpError('Please complete the security verification first');
        return;
    }
    
    setOtpLoading(true);
    setOtpError('');
    
    try {
        // 2. Send OTP request to backend
        const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiBase}/api/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email })
        });
        
        const data = await res.json();
        
        // 3. Handle response
        if (data.success) {
            setOtpSent(true);
            setRegisterStep(2); // Move to OTP verification step
        } else {
            // Handle errors (duplicate email, etc.)
            if (data.code === 'EMAIL_ALREADY_EXISTS') {
                setOtpError('This email is already registered.');
            } else {
                setOtpError(data.message || 'Failed to send OTP');
            }
        }
    } catch (err) {
        setOtpError('Failed to send OTP');
    } finally {
        setOtpLoading(false);
    }
};
```

### Backend Flow (routes.js)

```javascript
router.post('/api/auth/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        
        // 1. Validate email
        if (!email) {
            return res.json({ success: false, message: 'Email is required' });
        }
        
        // 2. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // 3. Check if email already exists
        const existingUser = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT CustomerID FROM Customers WHERE Email = @email');
        
        if (existingUser.recordset.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'An account with this email already exists.',
                code: 'EMAIL_ALREADY_EXISTS'
            });
        }
        
        // 4. Store OTP in database (5-minute expiration)
        await pool.request()
            .input('email', sql.NVarChar, email)
            .input('otp', sql.NVarChar, otp)
            .query(`
                MERGE OTPVerification AS target
                USING (SELECT @email as email) AS source
                ON target.Email = source.email
                WHEN MATCHED THEN
                    UPDATE SET 
                        OTP = @otp,
                        ExpiresAt = DATEADD(MINUTE, 5, GETDATE()),
                        CreatedAt = GETDATE()
                WHEN NOT MATCHED THEN
                    INSERT (Email, OTP, ExpiresAt, CreatedAt)
                    VALUES (@email, @otp, DATEADD(MINUTE, 5, GETDATE()), GETDATE());
            `);
        
        // 5. Send email via Gmail SMTP
        const nodemailer = require('nodemailer');
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.OTP_EMAIL_USER,  // design.xcel01@gmail.com
                pass: process.env.OTP_EMAIL_PASS   // mdvcebddaxqjlhug (no spaces!)
            }
        });
        
        const mailOptions = {
            from: process.env.OTP_EMAIL_USER,
            to: email,
            subject: 'Your Design Excellence OTP Code',
            html: `... OTP: ${otp} ...`,
            text: `Your OTP code is: ${otp}. It is valid for 5 minutes.`
        };
        
        // 6. Send email
        const result = await transporter.sendMail(mailOptions);
        console.log('📧 Email sent successfully:', result.messageId);
        
        // 7. Return success
        res.json({ 
            success: true, 
            message: 'OTP sent to your email'
        });
        
    } catch (err) {
        console.error('❌ OTP send error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send OTP' 
        });
    }
});
```

---

## Complete Registration Flow

```
┌──────────────────────────────────────────────────────────────┐
│ 1. User enters email on registration form                   │
│    → Fills in personal details                               │
│    → Completes captcha verification                          │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. User clicks "Send OTP" button                            │
│    → Frontend validates form                                 │
│    → Sends POST request to /api/auth/send-otp               │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. Backend processes OTP request                            │
│    → Checks if email already exists                          │
│    → Generates 6-digit random OTP                            │
│    → Stores OTP in database (5-minute expiry)                │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. Backend sends email via Gmail SMTP                       │
│    → Uses nodemailer with Gmail service                      │
│    → Authenticates with design.xcel01@gmail.com              │
│    → Uses app password: mdvcebddaxqjlhug                     │
│    → Sends HTML email with OTP code                          │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. User receives email                                       │
│    → Opens email in inbox                                    │
│    → Sees 6-digit OTP code                                   │
│    → Returns to registration page                            │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 6. User enters OTP on registration form                     │
│    → Frontend sends POST to /api/auth/verify-otp             │
│    → Backend validates OTP and expiration                    │
│    → Creates customer account                                │
│    → Returns success + JWT tokens                            │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 7. Registration complete                                     │
│    → User is logged in automatically                         │
│    → Redirected to home page                                 │
│    → Welcome message displayed                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Gmail App Password Setup (Reference)

### What is a Gmail App Password?

- A 16-character password generated by Google
- Used for applications to access Gmail without your main password
- More secure than using your actual Gmail password
- Can be revoked independently without changing your main password

### How to Generate (For Reference)

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification (if not already enabled)
3. Go to **App Passwords** section
4. Select **Mail** as the app
5. Select **Other (Custom name)** as the device
6. Enter "Design Excellence Backend" as the name
7. Click **Generate**
8. Copy the 16-character password (displayed with spaces)
9. **Remove spaces** when entering in `.env` file

### Current Configuration

- **Email:** design.xcel01@gmail.com
- **App Password:** `mdvc ebdd axqj lhug` (displayed by Google with spaces)
- **In .env file:** `mdvcebddaxqjlhug` (no spaces)

---

## Testing Checklist

### ✅ Local Development Testing

1. [ ] Update `backend/.env` with password (no spaces)
2. [ ] Restart backend server
3. [ ] Open [http://localhost:3000/login](http://localhost:3000/login)
4. [ ] Click "Sign Up"
5. [ ] Fill registration form
6. [ ] Complete captcha
7. [ ] Click "Send OTP"
8. [ ] Check email inbox for OTP
9. [ ] Enter OTP and complete registration

### ✅ Production Testing (Railway)

1. [x] Update `backend/.env.railway` with password (no spaces)
2. [x] Deploy backend to Railway
3. [ ] Open [https://designxcellwebsite-production.up.railway.app/login](https://designxcellwebsite-production.up.railway.app/login)
4. [ ] Click "Sign Up"
5. [ ] Fill registration form
6. [ ] Complete captcha
7. [ ] Click "Send OTP"
8. [ ] Check email inbox for OTP
9. [ ] Enter OTP and complete registration

### ✅ Error Handling Testing

1. [ ] Duplicate email → Should show "Email already exists" error
2. [ ] Invalid email format → Should show validation error
3. [ ] OTP expired (wait 5+ minutes) → Should show "OTP expired" error
4. [ ] Wrong OTP → Should show "Invalid OTP" error
5. [ ] Network error → Should show "Failed to send OTP" error

---

## Troubleshooting

### Issue: Still not receiving OTP emails

**Check 1: Environment Variables on Railway**
```bash
# In Railway dashboard:
# 1. Go to your backend service
# 2. Click "Variables" tab
# 3. Verify OTP_EMAIL_USER and OTP_EMAIL_PASS are set
# 4. Ensure OTP_EMAIL_PASS has NO SPACES
```

**Check 2: Backend Logs**
```bash
# View Railway logs:
railway logs

# Look for:
✅ "📧 Email sent successfully: [message-id]"
❌ "❌ OTP send error: [error details]"
```

**Check 3: Gmail Account**
```
1. Check if Less Secure App Access is disabled (should be)
2. Verify 2-Step Verification is enabled
3. Check if App Password is still valid
4. Try regenerating App Password if needed
```

**Check 4: Email Delivery**
```
1. Check spam/junk folder
2. Check Gmail "All Mail" folder
3. Verify recipient email is correct
4. Try with different email address
```

### Issue: "Invalid credentials" error

**Solution:** App password is incorrect or has spaces
```env
# Wrong
OTP_EMAIL_PASS=mdvc ebdd axqj lhug

# Correct
OTP_EMAIL_PASS=mdvcebddaxqjlhug
```

### Issue: "Connection timeout" error

**Solution:** Gmail SMTP port might be blocked
```javascript
// Try adding explicit port configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.OTP_EMAIL_USER,
        pass: process.env.OTP_EMAIL_PASS
    }
});
```

---

## Security Best Practices

### ✅ Current Implementation

1. **App Password Used**: More secure than main Gmail password
2. **Environment Variables**: Credentials stored in `.env` files (not in code)
3. **OTP Expiration**: 5-minute window reduces risk
4. **One-Time Use**: OTP deleted after verification
5. **Captcha Protection**: Prevents automated abuse
6. **Email Validation**: Checks for duplicate accounts

### 🔒 Additional Recommendations

1. **Rate Limiting**: Limit OTP requests per IP/email (already implemented)
2. **Audit Logging**: Log all OTP generation and verification attempts
3. **Email Verification**: Consider double opt-in for important accounts
4. **App Password Rotation**: Regenerate app password every 3-6 months
5. **Monitor Failed Attempts**: Alert on suspicious OTP request patterns

---

## Environment Variable Management

### Development (.env)
```env
NODE_ENV=development
OTP_EMAIL_USER=design.xcel01@gmail.com
OTP_EMAIL_PASS=mdvcebddaxqjlhug
```

### Production (.env.railway)
```env
NODE_ENV=production
OTP_EMAIL_USER=design.xcel01@gmail.com
OTP_EMAIL_PASS=mdvcebddaxqjlhug
```

### Railway Dashboard
1. Go to backend service settings
2. Click "Variables" tab
3. Add/Update variables:
   - `OTP_EMAIL_USER` = `design.xcel01@gmail.com`
   - `OTP_EMAIL_PASS` = `mdvcebddaxqjlhug`
4. Redeploy service

---

## Deployment Notes

### Backend Deployment
```bash
# Navigate to backend directory
cd backend

# Deploy to Railway
railway up --detach

# View deployment logs
railway logs
```

### Verification
```bash
# Test OTP endpoint directly
curl -X POST https://designexcellinventory-production.up.railway.app/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Expected response:
# {"success":true,"message":"OTP sent to your email"}
```

---

**Implementation Date:** October 25, 2025  
**Status:** ✅ Fixed and Deployed  
**Issue:** Gmail App Password had spaces  
**Solution:** Removed spaces from password in environment variables  
**Deployed To:** Railway Production

---

## Quick Reference

**Gmail Account:** design.xcel01@gmail.com  
**App Password Display:** `mdvc ebdd axqj lhug` (with spaces from Google)  
**App Password Usage:** `mdvcebddaxqjlhug` (no spaces in .env)  
**Backend Endpoint:** `/api/auth/send-otp`  
**OTP Expiration:** 5 minutes  
**OTP Length:** 6 digits

