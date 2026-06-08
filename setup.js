const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Starting VNA Group Intern Group 2 Project Setup ===');

// Helper to copy file if it doesn't exist
function copyFileIfMissing(src, dest) {
  const srcPath = path.resolve(__dirname, src);
  const destPath = path.resolve(__dirname, dest);
  if (fs.existsSync(srcPath)) {
    if (!fs.existsSync(destPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`[Config] Copied ${src} to ${dest}`);
    } else {
      console.log(`[Config] ${dest} already exists. Skipping.`);
    }
  } else {
    console.warn(`[Warning] Source config ${src} not found.`);
  }
}

// 1. Copy environment template files
copyFileIfMissing('BE/.env.example', 'BE/.env');
copyFileIfMissing('BE/ormconfig.example.json', 'BE/ormconfig.json');
copyFileIfMissing('fe/.env.example', 'fe/.env.local');

// 2. Install dependencies
try {
  console.log('[Dependencies] Installing Backend (BE) dependencies...');
  execSync('npm install', { cwd: path.resolve(__dirname, 'BE'), stdio: 'inherit' });

  console.log('[Dependencies] Installing Frontend (fe) dependencies...');
  execSync('npm install', { cwd: path.resolve(__dirname, 'fe'), stdio: 'inherit' });

  console.log('=== Setup Completed Successfully! ===');
  console.log('You can now start both servers by running:');
  console.log('  npm run dev');
} catch (error) {
  console.error('[Error] Setup failed during dependency installation:', error.message);
  process.exit(1);
}
