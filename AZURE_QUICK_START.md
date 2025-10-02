# DesignXcel Azure Quick Start Guide

Get your DesignXcel furniture e-commerce platform deployed to Azure in under 30 minutes!

## 🚀 Prerequisites (5 minutes)

1. **Azure Account**: [Create free account](https://azure.microsoft.com/free/) (get $200 credit)
2. **Azure CLI**: [Install Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
3. **Git**: Ensure Git is installed
4. **Stripe Account**: [Create Stripe account](https://stripe.com) for payments

## ⚡ Quick Deployment (15 minutes)

### Step 1: Login to Azure (1 minute)

```bash
az login
```

### Step 2: Run Automated Setup Script (10 minutes)

**Windows (PowerShell):**
```powershell
cd scripts
.\azure-setup.ps1
```

**Linux/Mac:**
```bash
cd scripts
chmod +x azure-setup.sh
./azure-setup.sh
```

The script will:
- ✅ Create Resource Group
- ✅ Set up Azure SQL Database
- ✅ Configure Storage Account
- ✅ Create App Service Plan
- ✅ Deploy Backend API
- ✅ Configure environment variables

### Step 3: Deploy Database Schema (2 minutes)

1. Connect to your Azure SQL Database using:
   - **Server**: `designxcel-sql-server.database.windows.net`
   - **Database**: `DesignXcelDB`
   - **Username**: `designxceladmin`
   - **Password**: [The password you set during setup]

2. Run the migration script:
   ```sql
   -- Copy and paste the contents of database-schemas/azure_migration_script.sql
   ```

### Step 4: Configure Stripe (2 minutes)

Add your Stripe keys to the backend App Service:

```bash
az webapp config appsettings set \
  --resource-group designxcel-rg \
  --name designxcel-api \
  --settings \
    STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key" \
    STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
```

## 🌐 Frontend Deployment (10 minutes)

### Option A: Azure Static Web Apps (Recommended)

1. **Fork the repository** to your GitHub account
2. **Create Static Web App** in Azure Portal:
   - Resource Group: `designxcel-rg`
   - Name: `designxcel-frontend`
   - Source: GitHub
   - Repository: Your forked repo
   - Branch: `main`
   - App location: `/frontend`
   - Output location: `build`

3. **Configure environment variables** in Static Web App settings:
   ```
   REACT_APP_API_URL=https://designxcel-api.azurewebsites.net
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   ```

### Option B: Manual Build & Deploy

```bash
# Build frontend
cd frontend
npm install
npm run build:prod

# Deploy to storage account as static website
az storage blob upload-batch \
  --account-name designxcelstorage \
  --destination '$web' \
  --source build/
```

## 🧪 Test Your Deployment (5 minutes)

### 1. Test Backend API
```bash
curl https://designxcel-api.azurewebsites.net/health
```

### 2. Test Database Connection
```bash
curl https://designxcel-api.azurewebsites.net/health/database
```

### 3. Test Frontend
Visit your Static Web App URL or storage account static website URL.

### 4. Test Full Flow
1. Register a new customer account
2. Browse products
3. Add items to cart
4. Complete checkout with Stripe test card: `4242 4242 4242 4242`

## 🔧 Post-Deployment Configuration

### 1. Configure Email (Optional)
```bash
az webapp config appsettings set \
  --resource-group designxcel-rg \
  --name designxcel-api \
  --settings \
    OTP_EMAIL_USER="your-gmail@gmail.com" \
    OTP_EMAIL_PASS="your-app-password"
```

### 2. Set Up Custom Domain (Optional)
```bash
# For backend API
az webapp config hostname add \
  --webapp-name designxcel-api \
  --resource-group designxcel-rg \
  --hostname api.yourdomain.com

# For frontend (in Static Web App settings)
az staticwebapp hostname set \
  --name designxcel-frontend \
  --hostname www.yourdomain.com
```

### 3. Enable SSL (Automatic)
SSL certificates are automatically provisioned for both App Service and Static Web Apps.

## 📊 Monitor Your Application

### Application Insights (Optional)
```bash
# Create Application Insights
az monitor app-insights component create \
  --app designxcel-insights \
  --location "East US" \
  --resource-group designxcel-rg

# Get instrumentation key and add to app settings
```

### View Logs
```bash
# Stream backend logs
az webapp log tail --name designxcel-api --resource-group designxcel-rg

# Download logs
az webapp log download --name designxcel-api --resource-group designxcel-rg
```

## 💰 Cost Estimation

**Monthly costs (USD):**
- App Service (B1): ~$13
- Azure SQL Database (Basic): ~$5
- Storage Account: ~$2
- Static Web Apps: Free
- **Total: ~$20/month**

## 🆘 Troubleshooting

### Common Issues

**1. Database Connection Failed**
```bash
# Check firewall rules
az sql server firewall-rule list \
  --server designxcel-sql-server \
  --resource-group designxcel-rg
```

**2. App Service Not Starting**
```bash
# Check app settings
az webapp config appsettings list \
  --name designxcel-api \
  --resource-group designxcel-rg
```

**3. CORS Errors**
- Ensure `FRONTEND_URL` is set correctly in backend app settings
- Check that frontend is using correct API URL

**4. File Upload Issues**
- Verify Azure Storage account key is correct
- Check blob container permissions

### Get Help

1. **Check logs**: Use Azure Portal or CLI to view application logs
2. **Health endpoints**: 
   - Backend: `https://designxcel-api.azurewebsites.net/health`
   - Database: `https://designxcel-api.azurewebsites.net/health/database`
3. **Azure Support**: Use Azure Portal support chat

## 🎉 Success!

Your DesignXcel application is now live on Azure! 

**Your URLs:**
- **Backend API**: `https://designxcel-api.azurewebsites.net`
- **Frontend**: `https://designxcel-frontend.azurestaticapps.net`
- **Admin Panel**: `https://designxcel-api.azurewebsites.net/login`

## 🔄 Continuous Deployment

The GitHub Actions workflows in `.github/workflows/` will automatically deploy your changes when you push to the main branch.

**Next Steps:**
1. 📝 Add your products to the database
2. 🎨 Customize the frontend branding
3. 💳 Configure production Stripe keys
4. 🌐 Set up your custom domain
5. 📈 Monitor performance and usage

---

**Need the full deployment guide?** See [AZURE_DEPLOYMENT_GUIDE.md](docs/AZURE_DEPLOYMENT_GUIDE.md) for detailed instructions and advanced configuration options.
