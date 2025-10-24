const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning up project for production deployment...');

// Files and directories to remove
const filesToRemove = [
    // Backend scripts (development only)
    'backend/scripts/add-archive-modal-final.js',
    'backend/scripts/add-customer-confirmation-modals.js',
    'backend/scripts/add-customer-delete-buttons.js',
    'backend/scripts/add-dearchive-endpoints.js',
    'backend/scripts/add-dearchive-frontend.js',
    'backend/scripts/add-missing-archive-modal.js',
    'backend/scripts/comprehensive-syntax-fix.js',
    'backend/scripts/convert-encryption-format.js',
    'backend/scripts/debug-dearchive-functionality.js',
    'backend/scripts/debug-google-oauth-error.js',
    'backend/scripts/debug-google-token-error.js',
    'backend/scripts/debug-google-token-verification.js',
    'backend/scripts/debug-oauth-callback.js',
    'backend/scripts/debug-oauth-flow.js',
    'backend/scripts/encrypt-database-migration.js',
    'backend/scripts/fix-dearchive-modal-event-listeners.js',
    'backend/scripts/fix-google-oauth.js',
    'backend/scripts/fix-javascript-errors.js',
    'backend/scripts/fix-modal-event-listeners.js',
    'backend/scripts/fix-modal-functionality.js',
    'backend/scripts/fix-template-literals.js',
    'backend/scripts/in-place-encryption-migration.js',
    'backend/scripts/in-place-encryption-rollback.js',
    'backend/scripts/move-modals-to-tab-content.js',
    'backend/scripts/place-modals-in-tab-content.js',
    'backend/scripts/run-encryption-migration.js',
    'backend/scripts/run-migration.js',
    'backend/scripts/test-backend-server.js',
    'backend/scripts/test-compact-encryption.js',
    'backend/scripts/test-customer-delete-endpoints.js',
    'backend/scripts/test-dearchive-endpoints.js',
    'backend/scripts/test-encryption.js',
    'backend/scripts/test-env-vars.js',
    'backend/scripts/test-google-auth-library.js',
    'backend/scripts/test-google-cloud-console.js',
    'backend/scripts/test-google-consent-screen.js',
    'backend/scripts/test-google-oauth-config.js',
    'backend/scripts/test-google-oauth-endpoint.js',
    'backend/scripts/test-google-oauth.js',
    'backend/scripts/test-google-token-verification.js',
    'backend/scripts/test-oauth-url.js',
    'backend/scripts/test-role-based-redirects.js',
    'backend/scripts/ultimate-syntax-fix.js',
    'backend/scripts/update-button-handlers-to-modals.js',
    'backend/scripts/update-custom-modals.js',
    'backend/scripts/update-dearchive-encryption.js',
    'backend/scripts/verify-dearchive-implementation.js',
    'backend/scripts/verify-google-oauth.js',
    
    // Development test files
    'backend/public/dark-mode-verification.html',
    'backend/public/dearchive-debug-test.html',
    'backend/public/dearchive-test.html',
    'backend/public/test-dark-mode.html',
    
    // Documentation files (keep main ones)
    'backend/docs/ARCHIVE_DEARCHIVE_SYSTEM_COMPLETE.md',
    'backend/docs/COMPLETE_SYNTAX_ERROR_RESOLUTION.md',
    'backend/docs/CUSTOM_DELETE_DEARCHIVE_MODALS_COMPLETE.md',
    'backend/docs/CUSTOMER_CONFIRMATION_MODALS_COMPLETE.md',
    'backend/docs/CUSTOMER_DELETE_BUTTONS_COMPLETE.md',
    'backend/docs/CUSTOMER_DELETE_IMPLEMENTATION.md',
    'backend/docs/CUSTOMER_MODALS_IN_TAB_CONTENT_COMPLETE.md',
    'backend/docs/DEARCHIVE_ALL_ROLES_COMPLETE.md',
    'backend/docs/DEARCHIVE_DEBUG_ANALYSIS.md',
    'backend/docs/DEARCHIVE_DEBUG_ENHANCED_LOGGING.md',
    'backend/docs/DEARCHIVE_ENCRYPTION_FIX.md',
    'backend/docs/DEARCHIVE_FUNCTIONALITY_FIX_COMPLETE.md',
    'backend/docs/DEARCHIVE_FUNCTIONALITY_GUIDE.md',
    'backend/docs/DEARCHIVE_MODAL_BUTTON_CSS_FIX_COMPLETE.md',
    'backend/docs/DEARCHIVE_MODAL_EVENT_LISTENERS_FIX_COMPLETE.md',
    'backend/docs/DEARCHIVE_MODAL_OVERLAY_FIX_COMPLETE.md',
    'backend/docs/DEARCHIVE_MODAL_PLACEMENT_FIX_COMPLETE.md',
    'backend/docs/DEARCHIVE_MODAL_VISIBILITY_TEST.md',
    'backend/docs/DEARCHIVE_NATIVE_CONFIRM_FIX.md',
    'backend/docs/FINAL_COMPLETE_JAVASCRIPT_ERROR_RESOLUTION.md',
    'backend/docs/FINAL_COMPLETE_SYNTAX_ERROR_RESOLUTION.md',
    'backend/docs/FINAL_JAVASCRIPT_ERROR_RESOLUTION.md',
    'backend/docs/FINAL_JAVASCRIPT_SYNTAX_RESOLUTION.md',
    'backend/docs/FINAL_SYNTAX_ERROR_RESOLUTION.md',
    'backend/docs/JAVASCRIPT_ERROR_FIXES.md',
    'backend/docs/JAVASCRIPT_SCOPE_ERROR_FIX.md',
    'backend/docs/JAVASCRIPT_SYNTAX_ERROR_FIX.md',
    'backend/docs/JAVASCRIPT_SYNTAX_ERRORS_FIXED.md',
    'backend/docs/MODAL_EVENT_LISTENER_FIX_COMPLETE.md',
    'backend/docs/MODAL_FUNCTIONALITY_FIX_COMPLETE.md',
    'backend/docs/MODAL_OVERLAY_VISIBILITY_FIX_COMPLETE.md',
    'backend/docs/ROLE_REDIRECT_FIX.md',
    'backend/docs/TEMPLATE_LITERAL_FIXES.md',
    
    // Database migration files (keep only essential ones)
    'backend/database/ENCRYPTION_IMPLEMENTATION_GUIDE.md',
    'backend/database/ENCRYPTION_SUMMARY.md',
    'backend/database/IN_PLACE_ENCRYPTION_SUMMARY.md',
    
    // Unused routes file
    'backend/routes-encrypted.js',
    
    // Development configuration
    'backend/environments/README.md',
    'backend/keys/key.info',
    
    // Frontend development files
    'frontend/docs/',
    'frontend/environments/',
    'frontend/scripts/',
    
    // Root development files
    'scripts/env-manager.js',
    'scripts/setup-google-oauth.js',
    'scripts/start-dev.js',
    
    // Documentation (keep main ones)
    'docs/api/',
    'docs/database/',
    'docs/deployment/',
    'docs/features/',
    'docs/fixes/',
    'docs/guides/',
    'docs/implementation/',
    'docs/setup/',
    'docs/troubleshooting/',
    'docs/encryption-test-report.json',
    'docs/ENCRYPTION_README.md',
    'docs/ENCRYPTION_SYSTEM_GUIDE.md',
    'docs/ORGANIZATION_SUMMARY.md',
    'docs/PROJECT_STRUCTURE.md',
    'docs/DOCUMENTATION_INDEX.md',
];

// Directories to remove
const directoriesToRemove = [
    'backend/scripts',
    'backend/docs',
    'backend/environments',
    'backend/keys',
    'frontend/docs',
    'frontend/environments',
    'frontend/scripts',
    'docs/api',
    'docs/database',
    'docs/deployment',
    'docs/features',
    'docs/fixes',
    'docs/guides',
    'docs/implementation',
    'docs/setup',
    'docs/troubleshooting',
    'scripts',
];

// Function to remove file
function removeFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`✅ Removed: ${filePath}`);
        }
    } catch (error) {
        console.error(`❌ Error removing ${filePath}:`, error.message);
    }
}

// Function to remove directory
function removeDirectory(dirPath) {
    try {
        if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true });
            console.log(`✅ Removed directory: ${dirPath}`);
        }
    } catch (error) {
        console.error(`❌ Error removing directory ${dirPath}:`, error.message);
    }
}

// Remove files
console.log('\n📁 Removing development files...');
filesToRemove.forEach(removeFile);

// Remove directories
console.log('\n📂 Removing development directories...');
directoriesToRemove.forEach(removeDirectory);

// Create production-ready package.json scripts
console.log('\n📝 Updating package.json for production...');
const packageJsonPath = 'package.json';
try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Update scripts for production
    packageJson.scripts = {
        "start": "npm run start:production",
        "start:production": "npm run build && cd backend && npm start",
        "build": "cd frontend && npm ci && npm run build && cd ../backend && npm ci",
        "build:frontend": "cd frontend && npm ci && npm run build",
        "build:backend": "cd backend && npm ci",
        "install:all": "npm install && cd frontend && npm install && cd ../backend && npm install",
        "clean": "rimraf node_modules frontend/node_modules backend/node_modules frontend/build",
        "clean:install": "npm run clean && npm run install:all"
    };
    
    // Remove development dependencies
    delete packageJson.devDependencies;
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json for production');
} catch (error) {
    console.error('❌ Error updating package.json:', error.message);
}

console.log('\n🎉 Project cleanup completed!');
console.log('\n📋 Next steps:');
console.log('1. Set up your production environment variables');
console.log('2. Configure your database');
console.log('3. Deploy to Railway using: railway up');
console.log('\n🚀 Your project is now ready for production deployment!');
