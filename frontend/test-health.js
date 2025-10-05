#!/usr/bin/env node

// Simple test script to verify health endpoint
const http = require('http');

const testHealthEndpoint = () => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/health',
    method: 'GET'
  };

  console.log('Testing health endpoint...');
  
  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response body:', data);
      try {
        const jsonData = JSON.parse(data);
        console.log('Parsed JSON:', jsonData);
        
        if (jsonData.status === 'ok') {
          console.log('✅ Health check passed!');
        } else {
          console.log('❌ Health check failed:', jsonData);
        }
      } catch (e) {
        console.log('❌ Failed to parse JSON response');
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Request failed:', err.message);
  });

  req.end();
};

// Test root endpoint too
const testRootEndpoint = () => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET'
  };

  console.log('\nTesting root endpoint...');
  
  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Root endpoint accessible');
      } else {
        console.log('❌ Root endpoint failed:', res.statusCode);
        console.log('Response:', data);
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Root request failed:', err.message);
  });

  req.end();
};

// Run tests
testHealthEndpoint();
setTimeout(testRootEndpoint, 1000);
