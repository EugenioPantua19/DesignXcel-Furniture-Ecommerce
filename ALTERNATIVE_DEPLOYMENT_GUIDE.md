# Alternative Deployment Guide for DesignXcel

Since Railway is persistently ignoring our configuration and using `npm ci`, here are alternative deployment options that should work better.

## Option 1: Heroku (Recommended for Backend)

### 1.1 Deploy Backend to Heroku

1. **Install Heroku CLI**:
   ```bash
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login to Heroku**:
   ```bash
   heroku login
   ```

3. **Create Heroku App**:
   ```bash
   cd backend
   heroku create designxcel-backend
   ```

4. **Set Environment Variables**:
   ```bash
   heroku config:set DB_SERVER=your-azure-server.database.windows.net
   heroku config:set DB_USERNAME=designxcel_admin
   heroku config:set DB_PASSWORD=your-azure-password
   heroku config:set DB_DATABASE=designxcel-db
   heroku config:set SESSION_SECRET=your-super-secret-session-key
   heroku config:set STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
   heroku config:set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   heroku config:set OTP_EMAIL_USER=your-email@gmail.com
   heroku config:set OTP_EMAIL_PASS=your-app-password
   heroku config:set NODE_ENV=production
   ```

5. **Deploy**:
   ```bash
   git push heroku main
   ```

### 1.2 Deploy Frontend to Vercel

1. **Go to [Vercel](https://vercel.com)**
2. **Import your GitHub repository**
3. **Set Root Directory** to `frontend`
4. **Set Environment Variables**:
   - `REACT_APP_API_URL`: `https://designxcel-backend.herokuapp.com`
   - `REACT_APP_ENVIRONMENT`: `production`
   - `REACT_APP_STRIPE_PUBLISHABLE_KEY`: `pk_live_your_stripe_publishable_key`

## Option 2: Render.com (Alternative to Railway)

### 2.1 Deploy Backend to Render

1. **Go to [Render](https://render.com)**
2. **Connect your GitHub repository**
3. **Create a new Web Service**
4. **Configure**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: `18.17.0`

5. **Set Environment Variables** (same as Heroku)

### 2.2 Deploy Frontend to Render

1. **Create a new Static Site**
2. **Configure**:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`

## Option 3: DigitalOcean App Platform

### 3.1 Deploy Backend to DigitalOcean

1. **Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)**
2. **Create a new App**
3. **Connect GitHub repository**
4. **Configure Backend Service**:
   - **Source Directory**: `backend`
   - **Build Command**: `npm install`
   - **Run Command**: `npm start`

### 3.2 Deploy Frontend to DigitalOcean

1. **Add Static Site Component**
2. **Configure**:
   - **Source Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `build`

## Option 4: AWS (Most Scalable)

### 4.1 Deploy Backend to AWS Elastic Beanstalk

1. **Install AWS CLI**
2. **Create Elastic Beanstalk Application**:
   ```bash
   eb init designxcel-backend
   eb create production
   ```

3. **Deploy**:
   ```bash
   eb deploy
   ```

### 4.2 Deploy Frontend to AWS S3 + CloudFront

1. **Build the frontend**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Upload to S3** and configure CloudFront

## Recommended Approach: Heroku + Vercel

This is the most reliable combination:

### Backend (Heroku):
- ✅ Excellent Node.js support
- ✅ No npm ci issues
- ✅ Easy environment variable management
- ✅ Automatic deployments from GitHub
- ✅ Free tier available

### Frontend (Vercel):
- ✅ Optimized for React applications
- ✅ Automatic builds and deployments
- ✅ Global CDN
- ✅ Free tier available
- ✅ Easy custom domain setup

## Quick Start Commands

### For Heroku Backend:
```bash
cd backend
heroku create designxcel-backend
heroku config:set DB_SERVER=your-azure-server.database.windows.net
heroku config:set DB_USERNAME=designxcel_admin
heroku config:set DB_PASSWORD=your-azure-password
heroku config:set DB_DATABASE=designxcel-db
heroku config:set SESSION_SECRET=your-super-secret-session-key
heroku config:set STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
heroku config:set OTP_EMAIL_USER=your-email@gmail.com
heroku config:set OTP_EMAIL_PASS=your-app-password
git push heroku main
```

### For Vercel Frontend:
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set Root Directory to `frontend`
4. Set Environment Variables
5. Deploy

## Cost Comparison

| Platform | Backend | Frontend | Total/Month |
|----------|---------|----------|-------------|
| Heroku + Vercel | $7 (Basic) | Free | $7 |
| Render + Render | Free | Free | $0 |
| Railway + Railway | $5 | $5 | $10 |
| AWS | Variable | Variable | $5-20 |

## Next Steps

1. **Choose your preferred platform** (I recommend Heroku + Vercel)
2. **Follow the specific deployment steps** for your chosen platform
3. **Set up your Azure SQL database** (same for all platforms)
4. **Configure environment variables**
5. **Test your deployment**

The Heroku + Vercel combination is the most reliable and has the best documentation for Node.js and React applications.
