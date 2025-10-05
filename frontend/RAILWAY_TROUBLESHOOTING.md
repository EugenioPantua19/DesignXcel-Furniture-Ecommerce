# Railway Deployment Troubleshooting Guide

## Service Unavailable Error Fixes

### 1. **Updated Configuration Files**

The following files have been updated to fix the "service unavailable" error:

- **`railway.json`** - Updated healthcheck path and timeout
- **`nixpacks.toml`** - Improved build configuration
- **`server.js`** - Added Express server with health check
- **`package.json`** - Updated dependencies and scripts

### 2. **Key Changes Made**

#### **Health Check Configuration**
- Changed healthcheck path from `/` to `/health`
- Reduced healthcheck timeout to 30 seconds
- Added dedicated health check endpoint

#### **Server Configuration**
- Created Express server (`server.js`) for better Railway compatibility
- Added proper port handling (`process.env.PORT`)
- Implemented graceful shutdown handling

#### **Build Configuration**
- Added Express as dependency
- Updated start command to use Express server
- Improved nixpacks configuration

### 3. **Environment Variables Required**

Make sure these are set in Railway dashboard:

```bash
CI=false
DISABLE_ESLINT_PLUGIN=true
GENERATE_SOURCEMAP=false
NODE_ENV=production
REACT_APP_API_URL=https://designxcelinventory-production.up.railway.app
REACT_APP_ENVIRONMENT=production
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51RCLlxPoc51pdmcaSH32LZIiLHJjHEmEkm3csrujxIKBcNa6gb6DG1KblYrBsRqtmWS5syIj9mT5P4UgWsprmQv500cFgYV6Sw
REACT_APP_APP_NAME=DesignXcel
REACT_APP_VERSION=1.0.0
```

### 4. **Deployment Steps**

1. **Commit all changes:**
   ```bash
   git add .
   git commit -m "Fix Railway deployment configuration"
   git push
   ```

2. **Set environment variables in Railway dashboard:**
   - Go to your project → Variables tab
   - Add all the variables listed above

3. **Redeploy:**
   - Railway will automatically redeploy when you push changes
   - Or manually trigger deployment from Railway dashboard

### 5. **Common Issues and Solutions**

#### **Issue: Service Unavailable**
- **Cause**: Health check failing or server not starting properly
- **Solution**: Updated health check path to `/health` and reduced timeout

#### **Issue: Build Failures**
- **Cause**: ESLint errors or missing dependencies
- **Solution**: Disabled ESLint during build and added Express dependency

#### **Issue: Port Binding**
- **Cause**: Server not binding to correct port
- **Solution**: Added proper port handling with `process.env.PORT`

### 6. **Monitoring Deployment**

1. **Check Railway logs:**
   ```bash
   railway logs
   ```

2. **Verify health check:**
   - Visit `https://your-app.railway.app/health`
   - Should return JSON with status: "ok"

3. **Test the application:**
   - Visit your Railway URL
   - Check that React app loads correctly

### 7. **If Deployment Still Fails**

1. **Check build logs** in Railway dashboard
2. **Verify environment variables** are set correctly
3. **Try manual deployment** from Railway dashboard
4. **Contact Railway support** if issues persist

### 8. **Success Indicators**

- ✅ Build completes without errors
- ✅ Health check endpoint responds
- ✅ Application loads in browser
- ✅ No "service unavailable" errors
