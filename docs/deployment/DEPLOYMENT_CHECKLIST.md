# 🚀 DesignXcel Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Code Quality & Testing
- [ ] All functionality tested locally
- [ ] No console errors in browser
- [ ] All routes working correctly
- [ ] Database connections tested
- [ ] Stripe integration tested
- [ ] Email functionality tested

### 2. Environment Variables
- [ ] Database credentials configured
- [ ] JWT secrets generated (32+ characters)
- [ ] Stripe keys configured (LIVE keys for production)
- [ ] Email service configured
- [ ] Encryption keys generated
- [ ] CORS origins set correctly

### 3. Database Setup
- [ ] Database server accessible
- [ ] All tables created
- [ ] Initial data seeded (if needed)
- [ ] Database user has proper permissions
- [ ] SSL connection configured (if required)

### 4. Security
- [ ] All sensitive data encrypted
- [ ] Strong passwords used
- [ ] HTTPS enabled (Railway default)
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Helmet security headers enabled

### 5. File Structure
- [ ] Unnecessary development files removed
- [ ] Build artifacts cleaned
- [ ] Upload directories created
- [ ] Static files properly configured

## 🚀 Deployment Steps

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway
```bash
railway login
```

### Step 3: Initialize Project
```bash
railway init
```

### Step 4: Set Environment Variables
```bash
# Copy from .env.production.example and set each variable
railway variables set NODE_ENV=production
railway variables set PORT=5000
railway variables set DB_SERVER=your-database-server
railway variables set DB_DATABASE=your-database-name
railway variables set DB_USERNAME=your-database-username
railway variables set DB_PASSWORD=your-database-password
railway variables set JWT_SECRET=your-jwt-secret
railway variables set JWT_REFRESH_SECRET=your-refresh-secret
railway variables set STRIPE_SECRET_KEY=your-stripe-secret
railway variables set STRIPE_PUBLISHABLE_KEY=your-stripe-publishable
railway variables set STRIPE_WEBHOOK_SECRET=your-webhook-secret
railway variables set EMAIL_SERVICE=resend
railway variables set RESEND_API_KEY=your-resend-key
railway variables set FROM_EMAIL=noreply@yourdomain.com
railway variables set ENCRYPTION_KEY=your-encryption-key
railway variables set ENCRYPTION_IV=your-encryption-iv
railway variables set SESSION_SECRET=your-session-secret
```

### Step 5: Deploy
```bash
railway up
```

### Step 6: Get Domain
```bash
railway domain
```

## ✅ Post-Deployment Verification

### 1. Health Check
- [ ] Visit: `https://your-app.railway.app/api/health`
- [ ] Response: `{"status": "healthy", ...}`

### 2. Frontend Access
- [ ] Visit: `https://your-app.railway.app`
- [ ] Page loads correctly
- [ ] No console errors

### 3. Authentication
- [ ] User registration works
- [ ] User login works
- [ ] JWT tokens generated correctly
- [ ] Protected routes accessible

### 4. Database Operations
- [ ] User data saved correctly
- [ ] Orders created successfully
- [ ] Data encrypted in database
- [ ] Data decrypted for display

### 5. Payment Integration
- [ ] Stripe checkout works
- [ ] Webhooks received
- [ ] Payment processing successful

### 6. Email Functionality
- [ ] Registration emails sent
- [ ] Password reset emails sent
- [ ] Order confirmation emails sent

### 7. Admin Panel
- [ ] Admin login works
- [ ] User management accessible
- [ ] Order management works
- [ ] All CRUD operations functional

### 8. File Uploads
- [ ] Profile image uploads work
- [ ] Product image uploads work
- [ ] Files stored correctly

## 🔧 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   railway logs --build
   ```

2. **Database Connection Issues**
   - Check database credentials
   - Verify firewall settings
   - Test connection string

3. **Environment Variable Issues**
   ```bash
   railway variables
   ```

4. **Port Issues**
   - Railway auto-assigns ports
   - Use `process.env.PORT`

5. **Static File Issues**
   - Check file paths
   - Verify build output

### Debug Commands

```bash
# View logs
railway logs

# View environment variables
railway variables

# Check deployment status
railway status

# Redeploy
railway redeploy
```

## 📊 Monitoring

### Railway Dashboard
- [ ] Monitor resource usage
- [ ] Check deployment logs
- [ ] Monitor error rates
- [ ] Track response times

### Application Monitoring
- [ ] Health check endpoint responding
- [ ] Database queries optimized
- [ ] Memory usage stable
- [ ] No memory leaks

## 🔄 Maintenance

### Regular Tasks
- [ ] Monitor logs for errors
- [ ] Check database performance
- [ ] Update dependencies
- [ ] Backup database
- [ ] Monitor resource usage

### Updates
- [ ] Test updates locally first
- [ ] Deploy during low traffic
- [ ] Monitor after deployment
- [ ] Rollback if issues occur

## 🆘 Support

### Railway Support
- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway GitHub](https://github.com/railwayapp)

### Application Support
- Check application logs
- Verify environment variables
- Test health endpoint
- Review error messages

## 📝 Notes

- Railway provides HTTPS by default
- Static files served from backend
- Database migrations run manually
- Monitor resource usage regularly
- Keep environment variables secure

---

**Deployment Status: ✅ Ready for Production**

**Last Updated: $(date)**

**Deployed By: [Your Name]**

**Deployment URL: https://your-app.railway.app**
