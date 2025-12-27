#!/usr/bin/env node
/**
 * Import production database into local Docker database
 * 
 * This script helps you copy data from production to local Docker.
 * 
 * Usage:
 *   1. Export from production first (see instructions below)
 *   2. Run: node scripts/import-production-db.js [path-to-export.sql]
 * 
 * OR use pg_dump directly:
 *   pg_dump -h production-host -U production-user -d production-db > production-export.sql
 *   Then: node scripts/import-production-db.js production-export.sql
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Docker database connection info
const DOCKER_DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'family_directory',
  user: 'postgres',
  password: 'postgres',
};

async function importSQLFile(sqlFilePath) {
  console.log('📥 Importing database from:', sqlFilePath);
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ File not found: ${sqlFilePath}`);
    process.exit(1);
  }

  // Use psql to import the SQL file
  const psqlCommand = `PGPASSWORD=${DOCKER_DB_CONFIG.password} psql -h ${DOCKER_DB_CONFIG.host} -p ${DOCKER_DB_CONFIG.port} -U ${DOCKER_DB_CONFIG.user} -d ${DOCKER_DB_CONFIG.database} -f "${sqlFilePath}"`;
  
  try {
    console.log('🔄 Executing SQL import...');
    execSync(psqlCommand, { stdio: 'inherit', shell: true });
    console.log('✅ Database import completed successfully!');
  } catch (error) {
    console.error('❌ Error importing database:', error.message);
    console.log('\n💡 Alternative: You can import manually using:');
    console.log(`   docker exec -i family-directory-db-dev psql -U postgres -d family_directory < "${sqlFilePath}"`);
    process.exit(1);
  }
}

// Main execution
const sqlFile = process.argv[2];

if (!sqlFile) {
  console.log(`
📋 Import Production Database to Docker

Usage:
  node scripts/import-production-db.js <path-to-export.sql>

Steps:
  1. Export from production database (see options below)
  2. Run this script with the path to the export file

Export Options:

Option A: Using pg_dump (recommended)
  pg_dump -h <production-host> -U <production-user> -d <production-db-name> > production-export.sql
  
  Example:
  pg_dump -h your-production-host.com -U your_user -d family_directory > production-export.sql

Option B: Using Hostinger Database Tool
  1. Log into Hostinger hPanel
  2. Go to Databases → PostgreSQL Databases
  3. Select your database
  4. Use the Export/Backup feature
  5. Download the SQL file

Option C: Using the export script (if you have SSH access)
  On production server:
  cd backend
  node scripts/export-database-sql.js --with-data
  
  Then download the database-export.sql file

After exporting, run:
  node scripts/import-production-db.js <path-to-export.sql>
`);
  process.exit(1);
}

importSQLFile(sqlFile);

