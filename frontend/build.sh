#!/bin/bash
echo "Building frontend with npm install (not npm ci)"
rm -f package-lock.json
npm install --no-package-lock
npm run build
echo "Build completed successfully"
