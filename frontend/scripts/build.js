#!/usr/bin/env node

// Build script that handles CI environment properly
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Set environment variables for build
process.env.CI = 'false';
process.env.DISABLE_ESLINT_PLUGIN = 'true';
process.env.GENERATE_SOURCEMAP = 'false';
process.env.NODE_ENV = 'production';

console.log('Building React app with production settings...');
console.log('CI:', process.env.CI);
console.log('DISABLE_ESLINT_PLUGIN:', process.env.DISABLE_ESLINT_PLUGIN);
console.log('GENERATE_SOURCEMAP:', process.env.GENERATE_SOURCEMAP);

try {
  // Run the build
  execSync('react-scripts build', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
