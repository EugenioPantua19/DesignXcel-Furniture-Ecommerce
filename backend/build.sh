#!/bin/bash
echo "Building backend with npm install (not npm ci)"
rm -f package-lock.json
npm install --production --no-package-lock
echo "Build completed successfully"
