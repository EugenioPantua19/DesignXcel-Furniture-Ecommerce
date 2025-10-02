#!/usr/bin/env node

// Development Startup Script
// This script starts both frontend and backend servers for development

const { spawn } = require('child_process');
const path = require('path');
const chalk = require('chalk');

// Configuration
const BACKEND_DIR = path.join(__dirname, 'backend');
const FRONTEND_DIR = path.join(__dirname, 'frontend');

// Colors for console output
const colors = {
  backend: chalk.blue,
  frontend: chalk.green,
  error: chalk.red,
  info: chalk.yellow,
  success: chalk.green.bold
};

// Process management
let backendProcess = null;
let frontendProcess = null;

// Cleanup function
function cleanup() {
  console.log(colors.info('\n🛑 Shutting down servers...'));
  
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
  }
  
  if (frontendProcess) {
    frontendProcess.kill('SIGTERM');
  }
  
  setTimeout(() => {
    process.exit(0);
  }, 2000);
}

// Handle process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start backend server
function startBackend() {
  return new Promise((resolve, reject) => {
    console.log(colors.backend('🚀 Starting backend server...'));
    
    backendProcess = spawn('npm', ['start'], {
      cwd: BACKEND_DIR,
      stdio: 'pipe',
      shell: true
    });

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(colors.backend(`[Backend] ${output}`));
        
        // Check if server started successfully
        if (output.includes('Server running on port') || output.includes('listening on port')) {
          resolve();
        }
      }
    });

    backendProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(colors.error(`[Backend Error] ${output}`));
      }
    });

    backendProcess.on('error', (error) => {
      console.error(colors.error(`Backend process error: ${error.message}`));
      reject(error);
    });

    backendProcess.on('exit', (code) => {
      if (code !== 0) {
        console.error(colors.error(`Backend process exited with code ${code}`));
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      resolve(); // Continue even if we don't see the success message
    }, 30000);
  });
}

// Start frontend server
function startFrontend() {
  return new Promise((resolve, reject) => {
    console.log(colors.frontend('🚀 Starting frontend server...'));
    
    frontendProcess = spawn('npm', ['start'], {
      cwd: FRONTEND_DIR,
      stdio: 'pipe',
      shell: true
    });

    frontendProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(colors.frontend(`[Frontend] ${output}`));
        
        // Check if server started successfully
        if (output.includes('webpack compiled') || output.includes('Local:')) {
          resolve();
        }
      }
    });

    frontendProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(colors.error(`[Frontend Error] ${output}`));
      }
    });

    frontendProcess.on('error', (error) => {
      console.error(colors.error(`Frontend process error: ${error.message}`));
      reject(error);
    });

    frontendProcess.on('exit', (code) => {
      if (code !== 0) {
        console.error(colors.error(`Frontend process exited with code ${code}`));
      }
    });

    // Timeout after 60 seconds
    setTimeout(() => {
      resolve(); // Continue even if we don't see the success message
    }, 60000);
  });
}

// Main function
async function main() {
  console.log(colors.success('🏢 Office E-commerce Development Server Startup\n'));
  
  try {
    // Start backend first
    await startBackend();
    console.log(colors.success('✅ Backend server started\n'));
    
    // Wait a moment for backend to fully initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Start frontend
    await startFrontend();
    console.log(colors.success('✅ Frontend server started\n'));
    
    console.log(colors.success('🎉 Both servers are running!'));
    console.log(colors.info('📱 Frontend: http://localhost:3000'));
    console.log(colors.info('🔧 Backend:  http://localhost:5000'));
    console.log(colors.info('💾 Admin:    http://localhost:3000/admin'));
    console.log(colors.info('\n💡 Press Ctrl+C to stop both servers\n'));
    
    // Keep the script running
    process.stdin.resume();
    
  } catch (error) {
    console.error(colors.error('❌ Failed to start servers:'), error.message);
    cleanup();
  }
}

// Run the script
if (require.main === module) {
  main();
}
