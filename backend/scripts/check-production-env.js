#!/usr/bin/env node
/**
 * Check production environment variables
 * Run: node scripts/check-production-env.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const requiredVars = {
  'DB_HOST': 'Database host',
  'DB_PORT': 'Database port',
  'DB_NAME': 'Database name',
  'DB_USER': 'Database user',
  'DB_PASSWORD': 'Database password',
  'JWT_SECRET': 'JWT secret key',
  'FRONTEND_URL': 'Frontend URL (should be https://neumanfam.com in production)',
  'BASE_URL': 'Base URL (should be https://neumanfam.com in production)',
  'NODE_ENV': 'Node environment (should be "production" in production)',
};

const productionChecks = {
  'FRONTEND_URL': (val) => {
    if (val.includes('localhost')) {
      return { status: 'error', message: 'Should be https://neumanfam.com, not localhost' };
    }
    if (val !== 'https://neumanfam.com') {
      return { status: 'warning', message: `Expected https://neumanfam.com, got ${val}` };
    }
    return { status: 'ok', message: 'Correct' };
  },
  'BASE_URL': (val) => {
    if (val.includes('localhost')) {
      return { status: 'error', message: 'Should be https://neumanfam.com, not localhost' };
    }
    if (val !== 'https://neumanfam.com') {
      return { status: 'warning', message: `Expected https://neumanfam.com, got ${val}` };
    }
    return { status: 'ok', message: 'Correct' };
  },
  'NODE_ENV': (val) => {
    if (val !== 'production') {
      return { status: 'warning', message: `Should be "production", got "${val}"` };
    }
    return { status: 'ok', message: 'Correct' };
  },
};

console.log('🔍 Checking Production Environment Variables\n');
console.log('='.repeat(60));

let hasErrors = false;
let hasWarnings = false;

for (const [key, description] of Object.entries(requiredVars)) {
  const value = process.env[key];
  const displayValue = key === 'DB_PASSWORD' || key === 'JWT_SECRET' 
    ? (value ? '***' + value.slice(-4) : 'NOT SET')
    : (value || 'NOT SET');
  
  if (!value) {
    console.log(`❌ ${key}: NOT SET`);
    console.log(`   ${description}`);
    hasErrors = true;
  } else {
    // Check production-specific requirements
    if (productionChecks[key]) {
      const check = productionChecks[key](value);
      if (check.status === 'error') {
        console.log(`❌ ${key}: ${displayValue}`);
        console.log(`   ${check.message}`);
        hasErrors = true;
      } else if (check.status === 'warning') {
        console.log(`⚠️  ${key}: ${displayValue}`);
        console.log(`   ${check.message}`);
        hasWarnings = true;
      } else {
        console.log(`✅ ${key}: ${displayValue}`);
      }
    } else {
      console.log(`✅ ${key}: ${displayValue}`);
    }
  }
}

console.log('\n' + '='.repeat(60));

if (hasErrors) {
  console.log('\n❌ ERRORS FOUND - Fix these before deploying!');
  process.exit(1);
} else if (hasWarnings) {
  console.log('\n⚠️  WARNINGS FOUND - Review these settings');
  process.exit(0);
} else {
  console.log('\n✅ All environment variables are correctly configured!');
  process.exit(0);
}

