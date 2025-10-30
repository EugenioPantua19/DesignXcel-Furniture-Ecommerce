# Backend Railway Deployment Guide

This guide will help you deploy the DesignXcel backend to a separate Railway project.

## Prerequisites

1. **Railway CLI installed**: `npm install -g @railway/cli`
2. **Railway account**: Sign up at [railway.app](https://railway.app)
3. **Logged in**: Run `railway login`

## Deployment Steps

### 1. Create New Railway Project

```bash
# Navigate to backend directory
cd backend

# Create new Railway project
railway login
railway init
```

### 2. Deploy Backend

**Option A: Using the deployment script**
```bash
# From project root
./deploy-backend-railway.sh  # Linux/Mac
# OR
.\deploy-backend-railway.ps1  # Windows PowerShell
```

**Option B: Manual deployment**
```bash
cd backend
railway up
```

### 3. Set Environment Variables

In your Railway dashboard, add these environment variables:

#### Required Variables:
- `DB_SERVER` - Your SQL Server host
- `DB_DATABASE` - Database name
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - Random secret for JWT tokens
- `SESSION_SECRET` - Random secret for sessions
- `FRONTEND_URL` - Your frontend URL (https://designxcellwebsite-production.up.railway.app)

#### Optional Variables:
- `RESEND_API_KEY` - For email functionality
- `STRIPE_SECRET_KEY` - For payment processing
- `GOOGLE_CLIENT_ID` - For Google OAuth
- `GOOGLE_CLIENT_SECRET` - For Google OAuth

### 4. Update Frontend API Configuration

Once your backend is deployed, you'll get a Railway URL like:
`https://your-backend-name-production.up.railway.app`

Update your frontend API configuration to point to this URL.

## Backend URL Structure

Your backend will be available at:
- **API Base**: `https://your-backend-name-production.up.railway.app`
- **Health Check**: `https://your-backend-name-production.up.railway.app/api/health`
- **API Routes**: `https://your-backend-name-production.up.railway.app/api/*`

## Environment Variables Reference

See `backend/.env.railway.example` for a complete list of environment variables.

## Troubleshooting

### Common Issues:

1. **Database Connection**: Ensure your SQL Server allows external connections
2. **CORS Issues**: Make sure `FRONTEND_URL` is set correctly
3. **Port Issues**: Railway automatically sets the `PORT` environment variable
4. **Build Failures**: Check that all dependencies are in `package.json`

### Logs:
```bash
railway logs
```

### Status Check:
```bash
railway status
```

## Next Steps

After successful deployment:

1. ✅ Test backend health endpoint
2. ✅ Update frontend API URLs
3. ✅ Test full-stack integration
4. ✅ Set up custom domain (optional)

## Support

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
