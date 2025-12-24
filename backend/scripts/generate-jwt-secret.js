#!/usr/bin/env node
/**
 * Generate a secure JWT secret for production use
 * Run: node scripts/generate-jwt-secret.js
 */

import crypto from 'crypto';

const secret = crypto.randomBytes(64).toString('hex');
console.log('\n=== JWT Secret Generated ===');
console.log(secret);
console.log('\nAdd this to your .env file as:');
console.log(`JWT_SECRET=${secret}`);
console.log('\n⚠️  Keep this secret secure and never commit it to git!\n');





