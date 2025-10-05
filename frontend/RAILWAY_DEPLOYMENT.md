# Railway Deployment Guide for DesignXcel Frontend

## Prerequisites
- Railway account (https://railway.app)
- Railway CLI installed (`npm install -g @railway/cli`)
- Your backend deployed on Railway

## Deployment Steps

### Option 1: Deploy via Railway CLI

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

4. **Initialize Railway project:**
   ```bash
   railway init
   ```

5. **Set environment variables:**
   ```bash
   railway variables set REACT_APP_API_URL=https://designxcelinventory-production.up.railway.app
   railway variables set REACT_APP_ENVIRONMENT=production
   railway variables set REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51RCLlxPoc51pdmcaSH32LZIiLHJjHEmEkm3csrujxIKBcNa6gb6DG1KblYrBsRqtmWS5syIj9mT5P4UgWsprmQv500cFgYV6Sw
   railway variables set REACT_APP_APP_NAME=DesignXcel
   railway variables set REACT_APP_VERSION=1.0.0
   railway variables set CI=false
   railway variables set DISABLE_ESLINT_PLUGIN=true
   railway variables set GENERATE_SOURCEMAP=false
   railway variables set NODE_ENV=production
   ```

6. **Deploy:**
   ```bash
   railway up
   ```

### Option 2: Deploy via Railway Dashboard

1. **Go to [Railway.app](https://railway.app)**
2. **Create a new project**
3. **Connect your GitHub repository**
4. **Select the `frontend` folder as the root directory**
5. **Set environment variables in Railway dashboard:**
   - `REACT_APP_API_URL`: Your backend Railway URL
   - `REACT_APP_ENVIRONMENT`: `production`
   - `REACT_APP_STRIPE_PUBLISHABLE_KEY`: Your Stripe key
   - `REACT_APP_APP_NAME`: `DesignXcel`
   - `REACT_APP_VERSION`: `1.0.0`
   - `GENERATE_SOURCEMAP`: `false`
   - `NODE_ENV`: `production`

## Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `https://designxcelinventory-production.up.railway.app` |
| `REACT_APP_ENVIRONMENT` | Environment | `production` |
| `REACT_APP_STRIPE_PUBLISHABLE_KEY` | Stripe public key | `pk_test_...` |
| `REACT_APP_APP_NAME` | Application name | `DesignXcel` |
| `REACT_APP_VERSION` | App version | `1.0.0` |
| `CI` | CI environment flag | `false` |
| `DISABLE_ESLINT_PLUGIN` | Disable ESLint during build | `true` |
| `GENERATE_SOURCEMAP` | Source map generation | `false` |
| `NODE_ENV` | Node environment | `production` |

## Build Process

Railway will automatically:
1. Install dependencies (`npm install`)
2. Build the React app (`npm run build`)
3. Serve the built files (`npm run serve:prod`)

## Troubleshooting

### Common Issues:

1. **Build Failures:**
   - Check that all dependencies are in `package.json`
   - Verify Node.js version compatibility

2. **API Connection Issues:**
   - Verify `REACT_APP_API_URL` is correct
   - Ensure backend is deployed and accessible
   - Check CORS settings on backend

3. **Static Assets Not Loading:**
   - Ensure all assets are in the `public` folder
   - Check asset paths in your code

4. **Environment Variables Not Working:**
   - Make sure variables start with `REACT_APP_`
   - Redeploy after setting new variables

### Debug Commands:

```bash
# Check Railway logs
railway logs

# Check Railway status
railway status

# Connect to Railway shell
railway shell
```

## Post-Deployment

1. **Test the deployed application**
2. **Verify API connections**
3. **Check all features work correctly**
4. **Update domain settings if using custom domain**

## Custom Domain (Optional)

1. **In Railway dashboard, go to your project**
2. **Click on "Settings"**
3. **Go to "Domains"**
4. **Add your custom domain**
5. **Update DNS settings as instructed**
