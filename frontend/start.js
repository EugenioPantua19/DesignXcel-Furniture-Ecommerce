#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Get port from environment or default to 3000
const port = process.env.PORT || 3000;

console.log(`Starting DesignXcel Frontend on port ${port}`);

// Start the serve command
const serveProcess = spawn('serve', ['-s', 'build', '-l', port.toString()], {
  stdio: 'inherit',
  shell: true
});

serveProcess.on('error', (error) => {
  console.error('Failed to start serve:', error);
  process.exit(1);
});

serveProcess.on('exit', (code) => {
  console.log(`Serve process exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  serveProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  serveProcess.kill('SIGINT');
});
