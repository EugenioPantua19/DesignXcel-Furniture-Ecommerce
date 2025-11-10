// Cross-platform script to copy .env.railway to .env.production
const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '..', '.env.railway');
const dest = path.join(__dirname, '..', '.env.production');

try {
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, dest);
    console.log('✅ Copied .env.railway to .env.production');
  } else {
    console.log('⚠️ .env.railway not found, skipping copy');
  }
} catch (error) {
  console.error('❌ Error copying .env.railway:', error.message);
  // Don't fail the build if env copy fails
  process.exit(0);
}

