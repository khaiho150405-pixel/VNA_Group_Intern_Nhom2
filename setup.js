const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Starting VNA Group Intern Group 2 Project Setup ===');

/**
 * Configuration for different Node versions
 * You can customize these versions based on your requirements.
 */
const CONFIG = {
  BE: {
    path: 'BE',
    nodeVersion: '16.20.2', // Legacy NestJS usually prefers Node 14-16
    envFile: '.env.example',
    envDest: '.env'
  },
  FE: {
    path: 'fe',
    nodeVersion: '20.20.2', // Next.js 14+ usually prefers Node 18-20
    envFile: '.env.example',
    envDest: '.env.local'
  }
};

// Helper to copy file if it doesn't exist
function copyFileIfMissing(src, dest, baseDir) {
  const srcPath = path.resolve(__dirname, baseDir, src);
  const destPath = path.resolve(__dirname, baseDir, dest);
  if (fs.existsSync(srcPath)) {
    if (!fs.existsSync(destPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`[Config] Copied ${src} to ${dest} in ${baseDir}`);
    } else {
      console.log(`[Config] ${dest} already exists in ${baseDir}. Skipping.`);
    }
  } else {
    console.warn(`[Warning] Source config ${src} not found in ${baseDir}.`);
  }
}

/**
 * Executes a command using a specific node version via its absolute path in NVM
 */
function execWithNode(command, cwd, version) {
  console.log(`[Dependencies] Setting up ${cwd} with Node ${version}...`);
  
  const nvmHome = process.env.NVM_HOME || path.join(process.env.APPDATA, '..', 'Local', 'nvm');
  const nodePath = path.join(nvmHome, `v${version}`, 'node.exe');
  const npmCliPath = path.join(nvmHome, `v${version}`, 'node_modules', 'npm', 'bin', 'npm-cli.js');

  let finalCommand = command;
  let options = { 
    cwd: path.resolve(__dirname, cwd), 
    stdio: 'inherit',
    shell: true
  };

  if (fs.existsSync(nodePath) && fs.existsSync(npmCliPath)) {
    console.log(`[Info] Using specific node and npm-cli at: ${nodePath}`);
    // Replace 'npm' with 'node.exe npm-cli.js' for better reliability
    finalCommand = command.replace(/^npm/, `"${nodePath}" "${npmCliPath}"`);
    
    // We also need to ensure the correct node.exe is in the path for this execution
    const versionBinPath = path.join(nvmHome, `v${version}`);
    options.env = { 
      ...process.env, 
      PATH: `${versionBinPath};${process.env.PATH}` 
    };
  } else {
    console.warn(`[Warning] Node ${version} or npm-cli not found in NVM. Falling back to default npm.`);
    console.warn(`To fix this, run: nvm install ${version}`);
  }

  try {
    execSync(finalCommand, options);
  } catch (error) {
    console.error(`[Error] Failed to execute "${finalCommand}" in ${cwd}.`);
    throw error;
  }
}

// 1. Setup Config Files
copyFileIfMissing(CONFIG.BE.envFile, CONFIG.BE.envDest, CONFIG.BE.path);
copyFileIfMissing('ormconfig.example.json', 'ormconfig.json', CONFIG.BE.path);
copyFileIfMissing(CONFIG.FE.envFile, CONFIG.FE.envDest, CONFIG.FE.path);

// 2. Install dependencies with specific node versions
try {
  execWithNode('npm install --legacy-peer-deps', CONFIG.BE.path, CONFIG.BE.nodeVersion);
  execWithNode('npm install --legacy-peer-deps', CONFIG.FE.path, CONFIG.FE.nodeVersion);

  console.log('=== Setup Completed Successfully! ===');
  console.log('\nProject Versions Used:');
  console.log(`  Backend (BE):  Node ${CONFIG.BE.nodeVersion}`);
  console.log(`  Frontend (FE): Node ${CONFIG.FE.nodeVersion}`);
  
  console.log('\nTo start the project:');
  console.log('1. Open a new terminal for BE:');
  console.log(`   cd BE && nvm use ${CONFIG.BE.nodeVersion} && npm run dev`);
  console.log('2. Open a new terminal for FE:');
  console.log(`   cd fe && nvm use ${CONFIG.FE.nodeVersion} && npm run dev`);
} catch (error) {
  console.error('\n[Error] Setup failed. Please check the logs above.');
  process.exit(1);
}
