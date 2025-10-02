# Office E-commerce Deployment Guide

This guide explains how to run the frontend and backend independently for development and production deployment.

## 🏗️ Architecture Overview

The project has been restructured for **decoupled architecture**:
- **Frontend**: React application (port 3000)
- **Backend**: Node.js/Express API server (port 5000)
- **Database**: SQL Server Express
- **Real-time**: WebSocket communication between frontend and backend

## 📁 Project Structure

```
office-ecommerce/
├── frontend/           # React application
│   ├── src/
│   ├── public/
│   ├── .env           # Development environment variables
│   ├── .env.production # Production environment variables
│   └── package.json
├── backend/            # Node.js API server
│   ├── src/
│   ├── .env           # Backend environment variables
│   └── package.json
└── DEPLOYMENT_GUIDE.md # This file
```

## 🚀 Quick Start (Development)

### 1. Start Backend Server

```bash
cd backend
npm install
npm start
```

The backend will run on `http://localhost:5000`

### 2. Start Frontend Server

```bash
cd frontend
npm install
npm start
```

The frontend will run on `http://localhost:3000`

### 3. Verify Connectivity

```bash
cd frontend
npm run check-backend
```

## 🔧 Environment Configuration

### Frontend Environment Variables

Create/update `frontend/.env`:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WEBSOCKET_URL=http://localhost:5000

# Feature Flags
REACT_APP_ENABLE_3D_CONFIGURATOR=true
REACT_APP_ENABLE_REAL_TIME_UPDATES=true
REACT_APP_ENABLE_ADMIN_DASHBOARD=true
REACT_APP_ENABLE_PAYMENT_PROCESSING=true

# Payment Configuration (Stripe only)
# PayMongo integration removed
```

### Backend Environment Variables

Create/update `backend/.env`:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_SERVER=DESKTOP-F4OI6BT\SQLEXPRESS
DB_USER=DesignXcel
DB_PASSWORD=Azwrathfrozen22@
DB_NAME=OfficeEcommerce

# Payment Configuration (Stripe only)
# PayMongo integration removed
```

## 🏭 Production Deployment

### Frontend (Static Site)

1. **Build for production:**
```bash
cd frontend
npm run build:prod
```

2. **Serve static files:**
```bash
npm run serve
# OR use any static file server
npx serve -s build -l 3000
```

3. **Deploy to hosting service:**
   - Upload `build/` folder to your hosting provider
   - Configure environment variables for production
   - Update `REACT_APP_API_URL` to your production backend URL

### Backend (API Server)

1. **Prepare for production:**
```bash
cd backend
npm install --production
```

2. **Set production environment:**
```bash
export NODE_ENV=production
export PORT=5000
export FRONTEND_URL=https://your-frontend-domain.com
```

3. **Start production server:**
```bash
npm start
# OR use PM2 for process management
pm2 start server.js --name "office-ecommerce-api"
```

## 🔗 API Communication

The frontend communicates with the backend through:

1. **REST API**: HTTP requests for CRUD operations
2. **WebSocket**: Real-time updates for inventory, orders, etc.
3. **Authentication**: JWT tokens for secure access

### API Endpoints

- `GET /health` - Health check
- `POST /api/auth/login` - User authentication
- `GET /api/products` - Product catalog
- `GET /api/inventory` - Inventory management
- `POST /api/orders` - Order creation
- `POST /api/payments` - Payment processing

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm test
```

### Frontend Testing

```bash
cd frontend
npm test
npm run test:coverage
```

### Integration Testing

```bash
# Start both servers
cd backend && npm start &
cd frontend && npm start &

# Run connectivity check
cd frontend && npm run check-backend
```

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Verify `FRONTEND_URL` in backend `.env`
   - Check browser console for specific CORS messages

2. **API Connection Failed**
   - Ensure backend is running on correct port
   - Verify `REACT_APP_API_URL` in frontend `.env`
   - Run connectivity check: `npm run check-backend`

3. **WebSocket Connection Failed**
   - Check `REACT_APP_WEBSOCKET_URL` configuration
   - Verify backend WebSocket service is running

4. **Database Connection Issues**
   - Verify SQL Server Express is running
   - Check database credentials in backend `.env`

### Debug Mode

Enable debug mode in frontend:

```env
REACT_APP_DEBUG_MODE=true
REACT_APP_LOG_LEVEL=debug
```

## 📊 Monitoring

### Health Checks

- Backend: `GET http://localhost:5000/health`
- Frontend: Use browser developer tools
- Database: Check SQL Server Management Studio

### Logs

- Backend logs: Console output or log files
- Frontend logs: Browser developer console
- Database logs: SQL Server logs

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` files with sensitive data
2. **CORS Configuration**: Restrict origins in production
3. **Authentication**: Use secure JWT tokens
4. **HTTPS**: Use HTTPS in production for both frontend and backend

## 📈 Performance Optimization

1. **Frontend**: 
   - Use `npm run build:prod` for optimized builds
   - Enable gzip compression on hosting server
   - Use CDN for static assets

2. **Backend**:
   - Use PM2 for process management
   - Enable database connection pooling
   - Implement API rate limiting

## 🆘 Support

For issues or questions:
1. Check this deployment guide
2. Review environment variable configuration
3. Run connectivity checks
4. Check application logs
5. Verify database connectivity
