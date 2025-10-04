# DesignXcel Deployment Guide

This guide will help you deploy your DesignXcel e-commerce application using Railway for frontend/backend and Azure for the database.

## Prerequisites

- Azure account with active subscription
- Railway account (sign up at railway.app)
- GitHub repository with your code
- Stripe account for payments

## Step 1: Azure SQL Database Setup

### 1.1 Create Azure SQL Database

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource" → "Azure SQL"
3. Configure the database:
   - **Subscription**: Your Azure subscription
   - **Resource group**: Create new or use existing
   - **Database name**: `designxcel-db`
   - **Server**: Create new server
   - **Server name**: `designxcel-server` (must be globally unique)
   - **Location**: Choose closest to your users
   - **Authentication method**: SQL authentication
   - **Admin username**: `designxcel_admin`
   - **Password**: Create a strong password (save this!)
   - **Compute + storage**: Start with **Basic** tier (5 DTUs, 2GB storage)

4. **Configure networking**:
   - **Allow Azure services**: Yes
   - **Add current client IP address**: Yes
   - **Add firewall rules** for Railway IPs (we'll do this later)

5. **Review + Create**

### 1.2 Get Connection String

After creation, go to your database → **Connection strings** and copy the connection string.

### 1.3 Set up Database Schema

Run the database setup script:

```bash
cd backend
node scripts/setup-azure-database.js
```

## Step 2: Railway Backend Deployment

### 2.1 Deploy Backend to Railway

1. Go to [Railway](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Choose "Deploy Now"
5. Railway will detect it's a Node.js project

### 2.2 Configure Backend Environment Variables

In Railway dashboard, go to your backend service → **Variables** and add:

```
DB_SERVER=your-azure-server.database.windows.net
DB_USERNAME=designxcel_admin
DB_PASSWORD=your-azure-password
DB_DATABASE=designxcel-db
SESSION_SECRET=your-super-secret-session-key-here
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
OTP_EMAIL_USER=your-email@gmail.com
OTP_EMAIL_PASS=your-app-password
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.railway.app
```

### 2.3 Update Azure Firewall

1. Go to your Azure SQL Server → **Networking**
2. Add Railway's IP ranges (Railway will provide these)
3. Or temporarily allow all Azure services

## Step 3: Railway Frontend Deployment

### 3.1 Deploy Frontend to Railway

1. In Railway dashboard, click "New Service" → "GitHub Repo"
2. Select the same repository
3. Set **Root Directory** to `frontend`
4. Railway will detect it's a React project

### 3.2 Configure Frontend Environment Variables

In Railway dashboard, go to your frontend service → **Variables** and add:

```
REACT_APP_API_URL=https://your-backend-domain.railway.app
REACT_APP_ENVIRONMENT=production
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
GENERATE_SOURCEMAP=false
```

## Step 4: Configure Stripe Webhooks

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Click "Add endpoint"
4. **Endpoint URL**: `https://your-backend-domain.railway.app/api/stripe/webhook`
5. **Events to send**: Select `checkout.session.completed`
6. Copy the **Signing secret** and add it to your backend environment variables

## Step 5: Test Your Deployment

### 5.1 Test Backend

Visit: `https://your-backend-domain.railway.app/api/test/database`

Should return database connection status.

### 5.2 Test Frontend

Visit: `https://your-frontend-domain.railway.app`

Should load your React application.

### 5.3 Test Full Integration

1. Create a test account
2. Add products to cart
3. Complete a test purchase
4. Check if order appears in admin panel

## Step 6: Domain Configuration (Optional)

### 6.1 Custom Domain for Frontend

1. In Railway frontend service → **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed

### 6.2 Custom Domain for Backend

1. In Railway backend service → **Settings** → **Domains**
2. Add your custom domain
3. Update frontend environment variables with new backend URL

## Step 7: Monitoring and Maintenance

### 7.1 Railway Monitoring

- Check Railway dashboard for service health
- Monitor logs for errors
- Set up alerts for downtime

### 7.2 Azure Monitoring

- Monitor database performance in Azure Portal
- Set up alerts for high resource usage
- Regular backup verification

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check that `FRONTEND_URL` is set correctly in backend
2. **Database Connection**: Verify Azure firewall rules and connection string
3. **File Uploads**: Ensure upload directories exist and have proper permissions
4. **Session Issues**: Check that `SESSION_SECRET` is set and consistent

### Logs

- **Backend logs**: Railway dashboard → Service → **Deployments** → **View Logs**
- **Frontend logs**: Railway dashboard → Service → **Deployments** → **View Logs**
- **Database logs**: Azure Portal → SQL Database → **Query Performance Insights**

## Cost Optimization

### Railway
- Monitor usage in Railway dashboard
- Consider upgrading plans if needed
- Use Railway's free tier for development

### Azure
- Start with Basic tier (5 DTUs)
- Monitor usage and upgrade as needed
- Consider reserved capacity for production

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **Database**: Use strong passwords and limit access
3. **Stripe**: Use live keys only in production
4. **HTTPS**: Railway provides SSL certificates automatically
5. **CORS**: Configure properly for production domains

## Backup Strategy

1. **Database**: Azure provides automatic backups
2. **Code**: GitHub repository serves as backup
3. **Files**: Consider Azure Blob Storage for file uploads
4. **Environment**: Document all environment variables

## Scaling

### When to Scale

- High traffic periods
- Slow response times
- Database connection limits

### How to Scale

1. **Railway**: Upgrade service plan
2. **Azure**: Upgrade database tier
3. **CDN**: Consider Azure CDN for static assets
4. **Load Balancing**: Multiple Railway instances

## Support

- **Railway**: [Railway Documentation](https://docs.railway.app)
- **Azure**: [Azure SQL Documentation](https://docs.microsoft.com/en-us/azure/azure-sql/)
- **Stripe**: [Stripe Documentation](https://stripe.com/docs)

---

**Note**: This deployment guide assumes you have the necessary permissions and accounts. Some steps may require additional configuration based on your specific requirements.
