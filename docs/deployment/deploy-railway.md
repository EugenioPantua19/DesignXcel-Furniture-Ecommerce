# Railway Deployment Guide - CRA Static Site with Caddy

This guide outlines the steps to deploy the DesignXcel frontend to Railway using Nixpacks with CRA (Create React App) static site deployment and Caddy web server.

## Prerequisites

1.  **Railway CLI**: Ensure you have the Railway CLI installed and configured.
           ```bash
           npm i -g @railway/cli
           railway login
           ```

## Deployment Steps

1.  **Navigate to Frontend Directory**:
           Open your terminal and navigate to the frontend directory of your DesignXcel project:
           ```bash
           cd C:\Final\DesignXcel01\frontend
           ```

2.  **Verify Configuration Files**:
           Ensure that your configuration files are correctly set up:
           -   `nixpacks.toml`: Configured for CRA static site deployment
           -   `Caddyfile`: Configured for serving static files
           -   `package.json`: Has proper build script (`npm run build`)

3.  **Deploy to Railway**:
           Use the Railway CLI to deploy your frontend. Railway will automatically detect the CRA configuration and deploy as a static site.
           ```bash
           railway up
           ```

4.  **Alternative: Use Deployment Script**:
           You can also use the provided deployment script:
           ```bash
           # From root directory
           chmod +x deploy-frontend.sh
           ./deploy-frontend.sh
           ```

5.  **Monitor Deployment**:
           After running `railway up`, the CLI will provide a link to your deployment logs. Monitor these logs for any build errors or runtime issues.

6.  **Access Your Application**:
           Once the deployment is successful, Railway will provide you with a public URL for your application.

## Configuration Details

### Nixpacks Configuration (`nixpacks.toml`)
- **Setup**: Uses Node.js 18 (npm comes bundled)
- **Install**: Runs `npm ci` to install dependencies
- **Build**: Runs `npm run build` to create production build
- **Start**: Uses Caddy to serve static files

### Caddy Configuration (`Caddyfile`)
- **Static File Serving**: Serves files from `/app/build` directory (frontend) or `/app/frontend/build` (root)
- **SPA Routing**: Handles client-side routing with `try_files`
- **Security Headers**: Includes HSTS, XSS protection, and CSP
- **Caching**: Optimizes static asset caching
- **Compression**: Enables gzip compression

## Expected Deployment Process

Based on your successful deployment, Railway will:

1. ✅ **Detect Node.js**: Automatically detect Node.js 18 from `.nvmrc`
2. ✅ **Install Dependencies**: Run `npm ci` to install all dependencies
3. ✅ **Build Application**: Run `npm run build` to create production build
4. ✅ **Setup Caddy**: Configure Caddy web server for static file serving
5. ✅ **Deploy**: Serve the built React application as a static site

## Troubleshooting

-   **Build Failures**: If the build fails, check the Railway deployment logs for specific error messages. Common issues include:
           -   **Missing Dependencies**: Ensure all dependencies are properly installed
           -   **Build Script Issues**: Verify the build script in `package.json`
           -   **ESLint Errors**: The build process should handle ESLint automatically
-   **Application Not Starting**: Verify the Caddyfile configuration and that the build directory exists
-   **Environment Variables**: Ensure all necessary environment variables are set in your Railway project settings

## Alternative: Deploy from Root Directory

If you prefer to deploy from the root directory, you can also:

```bash
# From root directory
cd C:\Final\DesignXcel01
railway up
```

Railway will automatically detect the frontend structure and deploy accordingly.

This guide should help you successfully deploy your DesignXcel frontend to Railway using the CRA static site deployment method.