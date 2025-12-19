#!/usr/bin/env node
/**
 * Create a production-ready zip file for Hostinger deployment
 * Run: node create-production-zip.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = __dirname;
const outputDir = path.join(projectRoot, 'deployment');
const zipFileName = 'family-directory-production.zip';

console.log('🚀 Creating production deployment package...\n');

// Clean up old deployment folder
if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir, { recursive: true });

// Copy backend files to root (Hostinger expects Node.js app in root)
const backendDest = outputDir;

// Copy backend files (excluding node_modules, .env, etc.)
const backendFilesToCopy = [
  'src',
  'migrations',
  'scripts',
  'package.json',
  'env.example',
];

console.log('📦 Copying backend files...');
backendFilesToCopy.forEach(file => {
  const src = path.join(projectRoot, 'backend', file);
  const dest = path.join(backendDest, file);
  
  if (fs.existsSync(src)) {
    if (fs.statSync(src).isDirectory()) {
      copyDirectory(src, dest);
    } else {
      fs.copyFileSync(src, dest);
    }
    console.log(`   ✓ ${file}`);
  }
});

// Check if frontend dist exists
const frontendDist = path.join(projectRoot, 'frontend', 'dist');
if (!fs.existsSync(frontendDist)) {
  console.log('\n⚠️  Frontend dist folder not found!');
  console.log('   Building frontend...\n');
  try {
    process.chdir(path.join(projectRoot, 'frontend'));
    execSync('npm run build', { stdio: 'inherit' });
    process.chdir(projectRoot);
  } catch (error) {
    console.error('❌ Failed to build frontend!');
    console.error('   Please run: cd frontend && npm run build');
    process.exit(1);
  }
}

// Copy frontend dist to public folder (for serving static files)
console.log('\n📦 Copying frontend build files...');
const frontendDest = path.join(outputDir, 'public');
copyDirectory(frontendDist, frontendDest);
console.log('   ✓ Frontend dist files');

// Create .htaccess for Apache (if needed) - in public folder
const htaccessContent = `# API Proxy
RewriteEngine On

# Proxy API requests to Node.js backend
RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^api/(.*)$ http://localhost:3001/api/$1 [P,L]

# Serve static files
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# SPA routing - serve index.html for all non-API routes
RewriteRule ^(?!api).*$ /index.html [L]
`;

fs.writeFileSync(path.join(frontendDest, '.htaccess'), htaccessContent);
console.log('   ✓ .htaccess file created');

// Create package.json in root with dependencies from backend
const backendPackageJsonPath = path.join(projectRoot, 'backend', 'package.json');
const backendPackageJson = JSON.parse(fs.readFileSync(backendPackageJsonPath, 'utf8'));

const rootPackageJson = {
  "name": "family-directory",
  "version": "1.0.0",
  "description": "Family Directory Application",
  "main": "src/server.js",
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "migrate": "node migrations/run-migrations.js",
    "export:db": "node scripts/export-database-sql.js",
    "export:db:with-data": "node scripts/export-database-sql.js --with-data"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": backendPackageJson.dependencies,
  "devDependencies": backendPackageJson.devDependencies
};

fs.writeFileSync(path.join(outputDir, 'package.json'), JSON.stringify(rootPackageJson, null, 2));
console.log('   ✓ Root package.json created with dependencies');

// Create README for deployment
const readmeContent = `# Family Directory - Production Deployment

## File Structure

- \`src/\` - Backend API source files
- \`migrations/\` - Database migration files
- \`scripts/\` - Utility scripts
- \`public/\` - Frontend static files
- \`package.json\` - Node.js application configuration
- \`env.example\` - Environment variables template

## Setup Instructions

1. Upload and extract this zip file to your Hostinger hosting
2. In Hostinger's Node.js manager, set:
   - Application root: (where you extracted the files)
   - Application startup file: src/server.js
   - Node version: 18.x or 20.x
3. Create \`.env\` file in the root directory (copy from env.example)
4. Fill in your environment variables:
   - Database credentials
   - JWT_SECRET (generate with: node scripts/generate-jwt-secret.js)
   - FRONTEND_URL (your domain, e.g., https://yourdomain.com)
   - BASE_URL (your domain)
5. Install dependencies: npm install --production
6. Run database migrations: node migrations/run-migrations.js
7. Start the application (usually automatic in Hostinger Node.js manager)

## Important Notes

- The backend serves the frontend files from the \`public/\` folder
- Make sure your domain points to where you extracted the files
- The application runs on the port specified in your Node.js app settings
- Check Hostinger's documentation for Node.js app configuration

## Environment Variables

Required in \`.env\` file:
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- JWT_SECRET (strong random string)
- FRONTEND_URL (your production domain)
- BASE_URL (your production domain)
- NODE_ENV=production

See PRODUCTION_DEPLOYMENT.md for detailed instructions.
`;

fs.writeFileSync(path.join(outputDir, 'README.txt'), readmeContent);
console.log('   ✓ README.txt created');

// Create zip file
console.log('\n📦 Creating zip file...');
try {
  // Use PowerShell's Compress-Archive on Windows
  const zipPath = path.join(projectRoot, zipFileName);
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }
  
  process.chdir(outputDir);
  execSync(`powershell -Command "Compress-Archive -Path * -DestinationPath '${zipPath}' -Force"`, { stdio: 'inherit' });
  process.chdir(projectRoot);
  
  const zipSize = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(2);
  console.log(`\n✅ Production package created successfully!`);
  console.log(`\n📁 File: ${zipFileName}`);
  console.log(`📊 Size: ${zipSize} MB`);
  console.log(`\n📍 Location: ${zipPath}`);
  console.log(`\n🚀 Ready to upload to Hostinger!\n`);
} catch (error) {
  console.error('❌ Failed to create zip file');
  console.error('   You can manually zip the deployment folder');
  console.error(`   Folder location: ${outputDir}`);
}

// Helper function to copy directory
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    // Skip node_modules, .env, and other excluded files
    if (entry.name === 'node_modules' || 
        entry.name === '.env' || 
        entry.name === '.git' ||
        entry.name === 'dist' ||
        entry.name.startsWith('.')) {
      continue;
    }
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

