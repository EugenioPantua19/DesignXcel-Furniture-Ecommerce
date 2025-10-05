#!/usr/bin/env node

// Simple Railway start script
console.log('🚀 Starting DesignXcel Frontend for Railway...');

const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Health check - simple and always works
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  const buildPath = path.join(__dirname, 'build', 'index.html');
  const fs = require('fs');
  
  if (fs.existsSync(buildPath)) {
    res.sendFile(buildPath);
  } else {
    res.status(200).json({
      message: 'DesignXcel Frontend Server',
      status: 'running',
      timestamp: new Date().toISOString()
    });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'build')));

// Catch-all for React routing
app.get('*', (req, res) => {
  const buildPath = path.join(__dirname, 'build', 'index.html');
  const fs = require('fs');
  
  if (fs.existsSync(buildPath)) {
    res.sendFile(buildPath);
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
  console.log(`✅ Server running on port ${port}`);
  console.log(`🏥 Health: http://localhost:${port}/health`);
});
