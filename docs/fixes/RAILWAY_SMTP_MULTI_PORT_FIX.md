# Railway SMTP Multi-Port Connection Fix

## Issue

Railway environment was blocking SMTP connections, causing "Connection timeout" errors when trying to send OTP emails.

## Solution Implemented

**Multi-port fallback strategy**: Try port 465 (SSL) first, then fall back to port 587 (STARTTLS) if needed.

### Why This Works

Different cloud platforms block different SMTP ports:
- **Port 465 (SSL)**: Direct SSL/TLS connection - often works on Railway
- **Port 587 (STARTTLS)**: Starts plain, upgrades to TLS - standard but sometimes blocked

By trying both, we maximize chances of successful connection.

## Implementation

```javascript
// Try port 465 first (SSL)
const config465 = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,  // SSL from start
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 8000
};

// Fallback to port 587 (STARTTLS)
const config587 = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,  // STARTTLS upgrade
    auth: { user, pass },
    tls: { rejectUnauthorized: false, ciphers: 'SSLv3' },
    connectionTimeout: 8000
};

// Try 465 first, then 587
try {
    transporter = nodemailer.createTransport(config465);
    await transporter.verify();
    console.log('✅ Port 465 successful');
} catch (error465) {
    console.log('⚠️ Port 465 failed, trying 587...');
    transporter = nodemailer.createTransport(config587);
    await transporter.verify();
    console.log('✅ Port 587 successful');
}
```

## Expected Logs

### Success on Port 465
```
📧 Attempting SMTP connection on port 465 (SSL)...
✅ SMTP connection successful on port 465
📧 Sending email via port 465 (SSL)...
📧 Email sent successfully: <message-id>
```

### Fallback to Port 587
```
📧 Attempting SMTP connection on port 465 (SSL)...
⚠️ Port 465 failed: Connection timeout
📧 Attempting SMTP connection on port 587 (STARTTLS)...
✅ SMTP connection successful on port 587
📧 Sending email via port 587 (STARTTLS)...
📧 Email sent successfully: <message-id>
```

### Both Ports Blocked (Error Message)
```
❌ Both port 465 and 587 failed
Port 465 error: Connection timeout
Port 587 error: Connection timeout
Failed to send OTP: SMTP connection failed on both ports. Railway may be blocking SMTP. Consider using SendGrid or AWS SES instead.
```

## Testing

1. Visit: https://designxcellwebsite-production.up.railway.app/login
2. Click "Sign Up"
3. Fill form and complete captcha
4. Click "Send OTP"
5. Check Railway logs to see which port connected
6. Verify email received

## Alternative Solutions (If Still Failing)

If both SMTP ports are blocked, consider these Railway-friendly alternatives:

### Option 1: SendGrid (Recommended)
```bash
npm install @sendgrid/mail
```
- Free tier: 100 emails/day
- No SMTP, uses HTTP API
- Works reliably on all cloud platforms

### Option 2: AWS SES
```bash
npm install @aws-sdk/client-ses
```
- Very cheap ($0.10 per 1000 emails)
- Reliable AWS infrastructure
- HTTP API, no SMTP issues

### Option 3: Resend
```bash
npm install resend
```
- Modern email API
- Simple to use
- Great for transactional emails

## Files Modified

- `backend/routes.js` (lines 539-605): Multi-port SMTP connection logic

## Deployment

**Build Logs**: [Railway Deployment](https://railway.com/project/f5c6c515-6c34-42c7-9a17-192a9065ebf8/service/862c55c8-0482-49e4-8dad-bb8f5c1dc431?id=586eb3d2-676c-4200-82a0-2e1e1407c419)

**Status**: ✅ Deployed with multi-port fallback

---

**Implementation Date**: October 25, 2025  
**Status**: ✅ Deployed  
**Solution**: Multi-port SMTP with 465 → 587 fallback

