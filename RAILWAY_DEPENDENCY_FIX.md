# Railway Build Error Fix: Three.js Dependency Conflict

## Problem
The Railway deployment was failing with an ERESOLVE dependency conflict:

```
npm error ERESOLVE could not resolve
npm error While resolving: @google/model-viewer@4.1.0
npm error Found: three@0.158.0
npm error Could not resolve dependency:
npm error peer three@"^0.172.0" from @google/model-viewer@4.1.0
```

## Root Cause
- `@google/model-viewer@4.1.0` requires `three@^0.172.0`
- The project was using `three@^0.158.0` (in frontend) and `three@^0.170.0` (in root)
- This caused an irreconcilable peer dependency conflict during `npm ci`
- Additionally, `cross-env@10.1.0` requires Node.js >=20, but the project was using Node 18

## Solution Applied

### 1. Updated Three.js Version
- Updated `package.json` and `frontend/package.json` to use `three@^0.172.0`
- Added missing dependencies:
  - `@google/model-viewer@^4.1.0`
  - `@react-three/xr@^6.6.27`
  - `qrcode.react@^4.2.0`
  - `uuid@^13.0.0`

### 2. Created .npmrc Configuration
Created `.npmrc` file in the root directory with:
```
legacy-peer-deps=true
```

### 3. Updated Build Configuration
Updated `nixpacks.toml` to use legacy peer deps during install:
```toml
[phases.install]
cmds = ["npm ci --legacy-peer-deps"]
```

### 4. Updated Start Script
Changed the start script in root `package.json` to serve the built application:
```json
"start": "cross-env PORT=3000 serve -s build -l 3000"
```

### 5. Regenerated package-lock.json
Ran `npm install --legacy-peer-deps` to regenerate the lock file with compatible versions.

### 6. Updated Node.js Version
Updated `.nvmrc` from Node 18 to Node 20 to satisfy `cross-env@10.1.0` requirements and updated `nixpacks.toml` accordingly.

## Verification
- Build completed successfully locally
- Three.js and dependencies are now using version 0.172.0
- No dependency conflicts in the dependency tree

## Files Changed
- `.npmrc` (new)
- `.nvmrc` (updated from 18 to 20)
- `package.json`
- `package-lock.json`
- `frontend/package.json`
- `nixpacks.toml` (updated for Node 20 and legacy peer deps)

## Next Steps
Commit and push these changes to trigger a new Railway deployment:
```bash
git add .npmrc .nvmrc package.json package-lock.json frontend/package.json nixpacks.toml
git commit -m "fix: resolve Three.js dependency conflict and Node.js version for Railway deployment"
git push origin master
```

The Railway deployment should now succeed with:
- Node.js 20 (required by cross-env@10.1.0)
- Three.js 0.172.0 (required by @google/model-viewer@4.1.0)
- Legacy peer deps enabled to handle any remaining conflicts

