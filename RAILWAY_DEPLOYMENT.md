# 🚀 Railway Deployment Guide for DesignXcel

This guide will help you deploy the DesignXcel e-commerce platform to Railway using the CLI.

## 📋 Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Railway CLI**: Install the Railway CLI
   ```bash
   npm install -g @railway/cli
   ```
3. **Git Repository**: Ensure your code is in a Git repository
4. **Database**: Set up a SQL Server database (Azure SQL, AWS RDS, or Railway PostgreSQL)

## 🔧 Environment Variables Setup

### Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
DB_SERVER=your-database-server.database.windows.net
DB_DATABASE=your-database-name
DB_USERNAME=your-database-username
DB_PASSWORD=your-database-password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email Configuration (Optional)
EMAIL_SERVICE=resend
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com

# Encryption Keys (Generate new ones for production)
ENCRYPTION_KEY=your-32-character-encryption-key
ENCRYPTION_IV=your-16-character-iv-key
```

### Database Setup

1. **Create Database Tables**: Run the SQL scripts in `backend/database/` to set up your database
2. **Update Connection String**: Ensure your database connection string is correct
3. **Test Connection**: Verify the database connection works

## 🚀 Deployment Steps

### Step 1: Login to Railway

```bash
railway login
```

### Step 2: Initialize Railway Project

```bash
# Navigate to your project directory
cd /path/to/DesignXcel01

# Initialize Railway project
railway init
```

### Step 3: Set Environment Variables

```bash
# Set each environment variable
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
```

### Step 4: Deploy to Railway

```bash
# Deploy the application
railway up
```

### Step 5: Get Deployment URL

```bash
# Get the deployment URL
railway domain
```

## 🔍 Post-Deployment Verification

### 1. Health Check

Visit: `https://your-app.railway.app/api/health`

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production"
}
```

### 2. Frontend Access

Visit: `https://your-app.railway.app`

### 3. Admin Panel

Visit: `https://your-app.railway.app/Employee/Admin/ManageUsers`

## 🛠️ Railway CLI Commands

### Useful Commands

```bash
# View logs
railway logs

# View environment variables
railway variables

# Connect to database (if using Railway PostgreSQL)
railway connect

# View deployment status
railway status

# Redeploy
railway redeploy

# View metrics
railway metrics
```

## 🔧 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs
   railway logs --build
   ```

2. **Database Connection Issues**
   - Verify database credentials
   - Check firewall settings
   - Ensure database server allows connections

3. **Environment Variable Issues**
   ```bash
   # List all variables
   railway variables
   
   # Set missing variables
   railway variables set VARIABLE_NAME=value
   ```

4. **Port Issues**
   - Railway automatically assigns ports
   - Use `process.env.PORT` in your application

### Debug Mode

```bash
# Enable debug logging
railway variables set DEBUG=*

# View detailed logs
railway logs --follow
```

## 📊 Monitoring

### Railway Dashboard

1. Visit [railway.app](https://railway.app)
2. Select your project
3. Monitor:
   - Deployments
   - Logs
   - Metrics
   - Environment variables

### Health Monitoring

The application includes a health check endpoint at `/api/health` that Railway uses for monitoring.

## 🔄 Updates and Maintenance

### Deploying Updates

```bash
# Pull latest changes
git pull origin main

# Deploy updates
railway up
```

### Database Migrations

```bash
# Run database migrations (if needed)
railway run npm run migrate
```

## 🚨 Security Considerations

1. **Environment Variables**: Never commit sensitive data to Git
2. **Database Security**: Use strong passwords and enable SSL
3. **JWT Secrets**: Use cryptographically secure random strings
4. **Stripe Keys**: Use live keys only in production
5. **HTTPS**: Railway provides HTTPS by default

## 📈 Scaling

### Railway Scaling Options

1. **Vertical Scaling**: Increase memory/CPU in Railway dashboard
2. **Horizontal Scaling**: Add more instances
3. **Database Scaling**: Upgrade database plan

### Performance Optimization

1. **Enable Caching**: Use Redis for session storage
2. **CDN**: Use Railway's CDN for static assets
3. **Database Indexing**: Optimize database queries

## 🆘 Support

### Railway Support

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway GitHub](https://github.com/railwayapp)

### Application Support

- Check application logs: `railway logs`
- Verify environment variables: `railway variables`
- Test health endpoint: `https://your-app.railway.app/api/health`

## 📝 Notes

- Railway automatically handles HTTPS certificates
- The application uses port 5000 by default
- Static files are served from the backend
- Database migrations should be run manually after deployment
- Monitor resource usage in the Railway dashboard

---

**Happy Deploying! 🎉**
