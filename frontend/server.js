const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Build paths
const buildPath = path.join(__dirname, 'build');
const indexPath = path.join(buildPath, 'index.html');

console.log('🚀 Starting DesignXcel Frontend Server...');
console.log('📁 Build path:', buildPath);
console.log('📄 Index file:', indexPath);
console.log('🔍 Build exists:', fs.existsSync(buildPath));
console.log('📄 Index exists:', fs.existsSync(indexPath));

// Simple health check endpoint - always returns 200
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: port
  });
});

// Serve static files if build exists
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  console.log('✅ Serving static files from build directory');
} else {
  console.log('⚠️ Build directory not found, serving fallback');
}

// Root endpoint
app.get('/', (req, res) => {
  console.log('🏠 Root endpoint requested');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).json({
      message: 'DesignXcel Frontend Server',
      status: 'running',
      timestamp: new Date().toISOString(),
      note: 'Build files not found, but server is running'
    });
  }
});

// Catch-all handler for React routing
app.get('*', (req, res) => {
  console.log('🔄 Catch-all route:', req.path);
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).json({
      message: 'DesignXcel Frontend Server',
      status: 'running',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ DesignXcel Frontend server running on port ${port}`);
  console.log(`🏥 Health check: http://localhost:${port}/health`);
  console.log(`🌐 Main app: http://localhost:${port}/`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});
