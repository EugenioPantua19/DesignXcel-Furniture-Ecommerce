# Azure Deployment Guide for DesignXcel

This comprehensive guide explains how to deploy the DesignXcel furniture e-commerce platform to Microsoft Azure.

## 🏗️ Architecture Overview

The DesignXcel project consists of:
- **Frontend**: React application (port 3000)
- **Backend**: Node.js/Express API server (port 5000)  
- **Database**: SQL Server (currently local MSSQL)
- **File Storage**: Local file uploads (needs Azure Blob Storage)
- **Payment**: Stripe integration

## 📋 Prerequisites

Before starting the deployment, ensure you have:

1. **Azure Account**: Active Azure subscription
2. **Azure CLI**: Installed and configured
3. **Node.js**: Version 16+ installed locally
4. **Git**: For code deployment
5. **Domain Name**: (Optional) For custom domain setup

## 🚀 Deployment Steps

### Step 1: Create Azure Resources

#### 1.1 Create Resource Group

```bash
# Login to Azure
az login

# Create resource group
az group create --name designxcel-rg --location "East US"
```

#### 1.2 Create Azure SQL Database

```bash
# Create SQL Server
az sql server create \
  --name designxcel-sql-server \
  --resource-group designxcel-rg \
  --location "East US" \
  --admin-user designxceladmin \
  --admin-password "YourSecurePassword123!"

# Create SQL Database
az sql db create \
  --resource-group designxcel-rg \
  --server designxcel-sql-server \
  --name DesignXcelDB \
  --service-objective Basic

# Configure firewall to allow Azure services
az sql server firewall-rule create \
  --resource-group designxcel-rg \
  --server designxcel-sql-server \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

#### 1.3 Create Storage Account for File Uploads

```bash
# Create storage account
az storage account create \
  --name designxcelstorage \
  --resource-group designxcel-rg \
  --location "East US" \
  --sku Standard_LRS

# Create blob container for uploads
az storage container create \
  --name uploads \
  --account-name designxcelstorage \
  --public-access blob
```

#### 1.4 Create App Service Plan

```bash
# Create App Service Plan
az appservice plan create \
  --name designxcel-plan \
  --resource-group designxcel-rg \
  --location "East US" \
  --sku B1 \
  --is-linux
```

### Step 2: Deploy Backend API

#### 2.1 Create Backend App Service

```bash
# Create App Service for backend
az webapp create \
  --resource-group designxcel-rg \
  --plan designxcel-plan \
  --name designxcel-api \
  --runtime "NODE|18-lts"
```

#### 2.2 Configure Backend Environment Variables

```bash
# Set environment variables for backend
az webapp config appsettings set \
  --resource-group designxcel-rg \
  --name designxcel-api \
  --settings \
    NODE_ENV=production \
    PORT=8000 \
    DB_SERVER="designxcel-sql-server.database.windows.net" \
    DB_USERNAME="designxceladmin" \
    DB_PASSWORD="YourSecurePassword123!" \
    DB_DATABASE="DesignXcelDB" \
    SESSION_SECRET="your-super-secure-session-secret-key-here" \
    STRIPE_SECRET_KEY="your-stripe-secret-key" \
    STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret" \
    OTP_EMAIL_USER="your-gmail-email@gmail.com" \
    OTP_EMAIL_PASS="your-gmail-app-password" \
    AZURE_STORAGE_ACCOUNT_NAME="designxcelstorage" \
    AZURE_STORAGE_ACCOUNT_KEY="your-storage-account-key" \
    FRONTEND_URL="https://designxcel-frontend.azurestaticapps.net"
```

#### 2.3 Deploy Backend Code

```bash
# Navigate to backend directory
cd backend

# Create deployment package
zip -r ../backend-deploy.zip . -x "node_modules/*" "*.log"

# Deploy to Azure
az webapp deployment source config-zip \
  --resource-group designxcel-rg \
  --name designxcel-api \
  --src ../backend-deploy.zip
```

### Step 3: Deploy Frontend

#### 3.1 Create Static Web App

```bash
# Create Static Web App
az staticwebapp create \
  --name designxcel-frontend \
  --resource-group designxcel-rg \
  --location "East US2" \
  --source https://github.com/yourusername/DesignXcel \
  --branch main \
  --app-location "/frontend" \
  --output-location "build"
```

#### 3.2 Configure Frontend Environment Variables

Create `frontend/.env.production`:

```env
# API Configuration
REACT_APP_API_URL=https://designxcel-api.azurewebsites.net
REACT_APP_WEBSOCKET_URL=https://designxcel-api.azurewebsites.net

# Feature Flags
REACT_APP_ENABLE_3D_CONFIGURATOR=true
REACT_APP_ENABLE_REAL_TIME_UPDATES=true
REACT_APP_ENABLE_ADMIN_DASHBOARD=true
REACT_APP_ENABLE_PAYMENT_PROCESSING=true

# Environment
REACT_APP_ENVIRONMENT=production
```

#### 3.3 Build and Deploy Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Build for production
npm run build:prod

# Deploy to Static Web App (automatic via GitHub Actions)
# Or manual deployment:
az staticwebapp environment set \
  --name designxcel-frontend \
  --environment-name default \
  --source ./build
```

### Step 4: Database Migration

#### 4.1 Connect to Azure SQL Database

Use SQL Server Management Studio (SSMS) or Azure Data Studio:

```
Server: designxcel-sql-server.database.windows.net
Database: DesignXcelDB
Authentication: SQL Server Authentication
Login: designxceladmin
Password: YourSecurePassword123!
```

#### 4.2 Run Database Schema Scripts

Execute all SQL scripts from the `database-schemas/` folder in order:

1. Run core table creation scripts
2. Run migration scripts
3. Insert initial data (if any)

```sql
-- Example: Run this first to create basic tables
-- Execute each .sql file in the database-schemas folder
```

### Step 5: Configure File Storage

#### 5.1 Update Backend for Azure Blob Storage

Create `backend/utils/azureStorage.js`:

```javascript
const { BlobServiceClient } = require('@azure/storage-blob');

const blobServiceClient = BlobServiceClient.fromConnectionString(
  `DefaultEndpointsProtocol=https;AccountName=${process.env.AZURE_STORAGE_ACCOUNT_NAME};AccountKey=${process.env.AZURE_STORAGE_ACCOUNT_KEY};EndpointSuffix=core.windows.net`
);

const uploadToBlob = async (file, containerName = 'uploads') => {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobName = `${Date.now()}-${file.originalname}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
  await blockBlobClient.upload(file.buffer, file.buffer.length);
  
  return {
    url: blockBlobClient.url,
    blobName: blobName
  };
};

module.exports = { uploadToBlob };
```

#### 5.2 Update Multer Configuration

Update `backend/server.js` multer configuration:

```javascript
const multer = require('multer');
const { uploadToBlob } = require('./utils/azureStorage');

// Use memory storage for Azure Blob upload
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Update profile image upload endpoint
app.post('/api/customer/upload-profile-image', upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'Customer') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    // Upload to Azure Blob Storage
    const uploadResult = await uploadToBlob(req.file, 'profile-images');
    const imageUrl = uploadResult.url;

    const customerId = req.session.user.id;

    await poolConnect;
    await pool.request()
      .input('customerId', sql.Int, customerId)
      .input('profileImage', sql.NVarChar, imageUrl)
      .query('UPDATE Customers SET ProfileImage = @profileImage WHERE CustomerID = @customerId');

    res.json({ success: true, imageUrl });
  } catch (err) {
    console.error('Profile image upload error:', err);
    res.status(500).json({ success: false, message: 'Failed to upload profile image', error: err.message });
  }
});
```

### Step 6: Configure Custom Domain and SSL

#### 6.1 Configure Custom Domain for Frontend

```bash
# Add custom domain to Static Web App
az staticwebapp hostname set \
  --name designxcel-frontend \
  --hostname www.yourdesignxcel.com
```

#### 6.2 Configure Custom Domain for Backend API

```bash
# Add custom domain to App Service
az webapp config hostname add \
  --webapp-name designxcel-api \
  --resource-group designxcel-rg \
  --hostname api.yourdesignxcel.com

# Enable HTTPS redirect
az webapp update \
  --name designxcel-api \
  --resource-group designxcel-rg \
  --https-only true
```

### Step 7: Configure CI/CD Pipeline

#### 7.1 GitHub Actions for Backend

Create `.github/workflows/backend-deploy.yml`:

```yaml
name: Deploy Backend to Azure

on:
  push:
    branches: [ main ]
    paths: [ 'backend/**' ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd backend
        npm install --production
        
    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'designxcel-api'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: './backend'
```

#### 7.2 GitHub Actions for Frontend

Create `.github/workflows/frontend-deploy.yml`:

```yaml
name: Deploy Frontend to Azure Static Web Apps

on:
  push:
    branches: [ main ]
    paths: [ 'frontend/**' ]

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
      with:
        submodules: true
        
    - name: Build And Deploy
      uses: Azure/static-web-apps-deploy@v1
      with:
        azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
        repo_token: ${{ secrets.GITHUB_TOKEN }}
        action: "upload"
        app_location: "/frontend"
        output_location: "build"
```

## 🔧 Environment Configuration

### Backend Environment Variables

Required environment variables for Azure App Service:

```env
NODE_ENV=production
PORT=8000
DB_SERVER=designxcel-sql-server.database.windows.net
DB_USERNAME=designxceladmin
DB_PASSWORD=YourSecurePassword123!
DB_DATABASE=DesignXcelDB
SESSION_SECRET=your-super-secure-session-secret-key-here
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
OTP_EMAIL_USER=your-gmail-email@gmail.com
OTP_EMAIL_PASS=your-gmail-app-password
AZURE_STORAGE_ACCOUNT_NAME=designxcelstorage
AZURE_STORAGE_ACCOUNT_KEY=your-storage-account-key
FRONTEND_URL=https://designxcel-frontend.azurestaticapps.net
```

### Frontend Environment Variables

Configure in Azure Static Web Apps:

```env
REACT_APP_API_URL=https://designxcel-api.azurewebsites.net
REACT_APP_WEBSOCKET_URL=https://designxcel-api.azurewebsites.net
REACT_APP_ENABLE_3D_CONFIGURATOR=true
REACT_APP_ENABLE_REAL_TIME_UPDATES=true
REACT_APP_ENABLE_ADMIN_DASHBOARD=true
REACT_APP_ENABLE_PAYMENT_PROCESSING=true
REACT_APP_ENVIRONMENT=production
```

## 🔒 Security Configuration

### 1. Configure CORS for Production

Update `backend/server.js`:

```javascript
app.use(cors({
    origin: [
        'https://designxcel-frontend.azurestaticapps.net',
        'https://www.yourdesignxcel.com',
        'https://yourdesignxcel.com'
    ],
    credentials: true
}));
```

### 2. Configure Database Firewall

```bash
# Add your IP to SQL Server firewall
az sql server firewall-rule create \
  --resource-group designxcel-rg \
  --server designxcel-sql-server \
  --name AllowMyIP \
  --start-ip-address YOUR_IP_ADDRESS \
  --end-ip-address YOUR_IP_ADDRESS
```

### 3. Enable Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app designxcel-insights \
  --location "East US" \
  --resource-group designxcel-rg

# Configure App Service to use Application Insights
az webapp config appsettings set \
  --resource-group designxcel-rg \
  --name designxcel-api \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY="your-instrumentation-key"
```

## 📊 Monitoring and Logging

### 1. Enable Diagnostic Logging

```bash
# Enable application logging
az webapp log config \
  --name designxcel-api \
  --resource-group designxcel-rg \
  --application-logging filesystem \
  --level information

# Enable web server logging
az webapp log config \
  --name designxcel-api \
  --resource-group designxcel-rg \
  --web-server-logging filesystem
```

### 2. View Logs

```bash
# Stream logs in real-time
az webapp log tail \
  --name designxcel-api \
  --resource-group designxcel-rg

# Download log files
az webapp log download \
  --name designxcel-api \
  --resource-group designxcel-rg
```

## 🚀 Performance Optimization

### 1. Enable Compression

```bash
# Enable gzip compression
az webapp config set \
  --name designxcel-api \
  --resource-group designxcel-rg \
  --use-32bit-worker-process false \
  --web-sockets-enabled true
```

### 2. Configure CDN for Static Assets

```bash
# Create CDN profile
az cdn profile create \
  --name designxcel-cdn \
  --resource-group designxcel-rg \
  --sku Standard_Microsoft

# Create CDN endpoint
az cdn endpoint create \
  --name designxcel-static \
  --profile-name designxcel-cdn \
  --resource-group designxcel-rg \
  --origin designxcelstorage.blob.core.windows.net
```

## 🔄 Backup and Recovery

### 1. Database Backup

```bash
# Export database
az sql db export \
  --resource-group designxcel-rg \
  --server designxcel-sql-server \
  --name DesignXcelDB \
  --storage-key-type StorageAccessKey \
  --storage-key "your-storage-key" \
  --storage-uri "https://designxcelstorage.blob.core.windows.net/backups/designxcel-backup.bacpac" \
  --admin-user designxceladmin \
  --admin-password "YourSecurePassword123!"
```

### 2. App Service Backup

```bash
# Create backup
az webapp config backup create \
  --resource-group designxcel-rg \
  --webapp-name designxcel-api \
  --backup-name "designxcel-backup-$(date +%Y%m%d)" \
  --storage-account-url "https://designxcelstorage.blob.core.windows.net/backups" \
  --container-name backups
```

## 🧪 Testing Deployment

### 1. Health Check Endpoints

Add to `backend/server.js`:

```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Database health check
app.get('/health/database', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query('SELECT 1 as test');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

### 2. Test URLs

After deployment, test these URLs:

- **Frontend**: `https://designxcel-frontend.azurestaticapps.net`
- **Backend Health**: `https://designxcel-api.azurewebsites.net/health`
- **Database Health**: `https://designxcel-api.azurewebsites.net/health/database`
- **API Products**: `https://designxcel-api.azurewebsites.net/api/products`

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check firewall rules
   - Verify connection string
   - Ensure SQL Server is running

2. **CORS Errors**
   - Update CORS configuration
   - Check frontend URL in backend settings

3. **File Upload Issues**
   - Verify Azure Storage configuration
   - Check storage account keys
   - Ensure blob container exists

4. **Environment Variables**
   - Verify all required variables are set
   - Check for typos in variable names
   - Restart App Service after changes

### Useful Commands

```bash
# Check App Service status
az webapp show --name designxcel-api --resource-group designxcel-rg

# Restart App Service
az webapp restart --name designxcel-api --resource-group designxcel-rg

# Check database status
az sql db show --name DesignXcelDB --server designxcel-sql-server --resource-group designxcel-rg

# View App Service logs
az webapp log tail --name designxcel-api --resource-group designxcel-rg
```

## 💰 Cost Optimization

### Recommended Azure Pricing Tiers

- **App Service Plan**: B1 Basic ($13.14/month)
- **Azure SQL Database**: Basic ($4.90/month)
- **Storage Account**: Standard LRS (~$2/month for 100GB)
- **Static Web Apps**: Free tier (sufficient for most cases)

### Cost-Saving Tips

1. Use Basic tier for development/staging
2. Scale up only when needed
3. Enable auto-scaling based on metrics
4. Use Azure Cost Management to monitor spending
5. Consider reserved instances for production

## 📚 Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Azure SQL Database Documentation](https://docs.microsoft.com/en-us/azure/azure-sql/)
- [Azure Static Web Apps Documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [Azure Storage Documentation](https://docs.microsoft.com/en-us/azure/storage/)

---

## 🎉 Deployment Complete!

After following this guide, your DesignXcel application should be fully deployed on Azure with:

✅ Frontend hosted on Azure Static Web Apps  
✅ Backend API running on Azure App Service  
✅ Database hosted on Azure SQL Database  
✅ File storage using Azure Blob Storage  
✅ Custom domain and SSL configured  
✅ CI/CD pipeline set up  
✅ Monitoring and logging enabled  

Your application is now ready for production use!
