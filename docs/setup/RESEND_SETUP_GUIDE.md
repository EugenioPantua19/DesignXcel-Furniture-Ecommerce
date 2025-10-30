# Resend Email Service Setup Guide

## Why Resend?

Railway **blocks all SMTP ports** (465 and 587) for security reasons. Resend uses HTTP API instead of SMTP, so it works perfectly on Railway and other cloud platforms.

**Benefits:**
- ✅ Works on Railway (HTTP API, not SMTP)
- ✅ Free tier: 3,000 emails/month, 100 emails/day
- ✅ Modern, simple API
- ✅ No credit card required
- ✅ Fast and reliable

---

## Setup Steps

### 1. Create Resend Account

Visit: [https://resend.com/signup](https://resend.com/signup)

1. Sign up with your email
2. Verify your email address
3. Complete account setup

### 2. Get API Key

1. Go to [https://resend.com/api-keys](https://resend.com/api-keys)
2. Click "Create API Key"
3. Name it: "DesignXcel Production"
4. Permission: "Sending access"
5. Click "Add"
6. **Copy the API key** (starts with `re_`)

**Important:** Save this key! You can't see it again.

Example: `re_123abc456def789ghi012jkl345mno678`

### 3. Add Domain (Optional but Recommended)

**Free Tier:** Can send from `onboarding@resend.dev`
**Custom Domain:** Send from `noreply@yourdomain.com`

To add custom domain:
1. Go to [https://resend.com/domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain: `designexcellencee.me`
4. Add DNS records (TXT, MX, CNAME)
5. Wait for verification (5-30 minutes)

---

## Configuration

### Local Development (.env)

Add to `backend/.env`:
```env
# Resend Email Service (Railway-compatible, no SMTP)
RESEND_API_KEY=re_your_api_key_here
OTP_EMAIL_USER=onboarding@resend.dev
```

### Production (.env.railway)

Add to `backend/.env.railway`:
```env
# Resend Email Service
RESEND_API_KEY=re_your_api_key_here
OTP_EMAIL_USER=onboarding@resend.dev
```

### Railway Platform

Set variables via CLI:
```bash
cd backend
railway variables --set RESEND_API_KEY=re_your_api_key_here
railway variables --set OTP_EMAIL_USER=onboarding@resend.dev
```

Or via Railway Dashboard:
1. Go to [Railway Dashboard](https://railway.app)
2. Select DesignExcellInventory service
3. Click "Variables"
4. Add:
   - `RESEND_API_KEY` = `re_your_api_key_here`
   - `OTP_EMAIL_USER` = `onboarding@resend.dev`
5. Redeploy

---

## Email Sender Options

### Option 1: Free Resend Domain (Quick Start)
```env
OTP_EMAIL_USER=onboarding@resend.dev
```
- ✅ Works immediately
- ✅ No domain setup needed
- ⚠️ Shows "onboarding@resend.dev" in emails

### Option 2: Your Custom Domain (Professional)
```env
OTP_EMAIL_USER=noreply@designexcellencee.me
```
- ✅ Professional appearance
- ✅ Custom branding
- ⚠️ Requires DNS setup (5-30 minutes)

---

## Testing

### 1. Deploy with Resend

```bash
cd backend
railway up --detach
```

### 2. Test OTP Email

Visit: [https://designxcellwebsite-production.up.railway.app/login](https://designxcellwebsite-production.up.railway.app/login)

1. Click "Sign Up"
2. Fill form and complete captcha
3. Click "Send OTP"
4. Check email inbox

### 3. Expected Logs

```
📧 OTP Request received for email: customer@example.com
📧 Email config check:
  - RESEND_API_KEY: Set ✅
  - OTP_EMAIL_USER: Set ✅
  - NODE_ENV: production
📧 Using Resend API for email delivery...
📧 Sending email via Resend API...
  - From: onboarding@resend.dev
  - To: customer@example.com
  - Subject: Your Design Excellence OTP Code
✅ Email sent successfully via Resend
  - Email ID: abc123-def456-ghi789
OTP sent to customer@example.com: 123456
```

---

## Troubleshooting

### Issue: "RESEND_API_KEY not set"

**Check Railway Variables:**
```bash
railway variables | grep RESEND
```

Should show:
```
RESEND_API_KEY | re_123abc...
OTP_EMAIL_USER | onboarding@resend.dev
```

**Solution:** Set the variable and redeploy
```bash
railway variables --set RESEND_API_KEY=re_your_key
railway up --detach
```

### Issue: "Invalid API key"

**Check:**
1. API key starts with `re_`
2. No extra spaces or quotes
3. Key is still valid in Resend dashboard

**Solution:** Create new API key and update

### Issue: "Domain not verified"

If using custom domain:
1. Check DNS records in domain registrar
2. Wait 5-30 minutes for propagation
3. Or use `onboarding@resend.dev` temporarily

### Issue: Email not received

**Check:**
1. Spam/junk folder
2. Resend dashboard → Emails (see delivery status)
3. Railway logs for Resend errors

---

## Resend vs SMTP Comparison

| Feature | SMTP (Gmail) | Resend |
|---------|-------------|---------|
| Works on Railway | ❌ Blocked | ✅ Yes |
| Free Tier | ✅ Unlimited | ✅ 3000/month |
| Setup Time | Fast | Fast |
| Reliability | High* | Very High |
| Professional | ✅ Gmail address | ✅ Custom domain |
| Rate Limiting | 500/day | 100/day free |
| Tracking | ❌ No | ✅ Yes |

*When SMTP ports aren't blocked

---

## Files Modified

1. **backend/routes.js** - Replaced SMTP with Resend API
2. **backend/package.json** - Added `resend` dependency
3. **backend/.env** - Need to add RESEND_API_KEY
4. **backend/.env.railway** - Need to add RESEND_API_KEY

---

## Next Steps

1. **Get Resend API Key:** [https://resend.com/api-keys](https://resend.com/api-keys)
2. **Add to .env files:**
   ```env
   RESEND_API_KEY=re_your_api_key_here
   OTP_EMAIL_USER=onboarding@resend.dev
   ```
3. **Set Railway variable:**
   ```bash
   railway variables --set RESEND_API_KEY=re_your_key
   ```
4. **Redeploy:**
   ```bash
   railway up --detach
   ```
5. **Test OTP email** on production site

---

## Quick Commands

```bash
# Get Resend API key
# Visit: https://resend.com/api-keys

# Set Railway variables
cd backend
railway variables --set RESEND_API_KEY=re_your_key_here
railway variables --set OTP_EMAIL_USER=onboarding@resend.dev

# Deploy
railway up --detach

# View logs
railway logs --tail | grep "📧"
```

---

**Status:** ✅ Code Ready - Needs RESEND_API_KEY  
**Free Tier:** 3,000 emails/month, 100/day  
**Signup:** [https://resend.com/signup](https://resend.com/signup)  
**API Keys:** [https://resend.com/api-keys](https://resend.com/api-keys)

