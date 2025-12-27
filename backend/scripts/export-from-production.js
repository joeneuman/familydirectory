#!/usr/bin/env node
/**
 * Export database from production server
 * 
 * This script connects to your production database and exports it.
 * You'll need to set production database credentials as environment variables
 * or in a .env.production file.
 * 
 * Usage:
 *   PROD_DB_HOST=your-host PROD_DB_USER=your-user PROD_DB_PASSWORD=your-pass PROD_DB_NAME=family_directory node scripts/export-from-production.js
 * 
 * OR create a .env.production file with:
 *   PROD_DB_HOST=your-production-host
 *   PROD_DB_PORT=5432
 *   PROD_DB_NAME=family_directory
 *   PROD_DB_USER=your-username
 *   PROD_DB_PASSWORD=your-password
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load production env vars
dotenv.config({ path: path.join(__dirname, '..', '.env.production') });

const PROD_DB_CONFIG = {
  host: process.env.PROD_DB_HOST || process.env.DB_HOST,
  port: parseInt(process.env.PROD_DB_PORT || process.env.DB_PORT || '5432'),
  database: process.env.PROD_DB_NAME || process.env.DB_NAME || 'family_directory',
  user: process.env.PROD_DB_USER || process.env.DB_USER,
  password: process.env.PROD_DB_PASSWORD || process.env.DB_PASSWORD,
};

const outputFile = path.join(__dirname, '..', 'production-export.sql');

// Validate config
if (!PROD_DB_CONFIG.host || !PROD_DB_CONFIG.user || !PROD_DB_CONFIG.password) {
  console.error(`
❌ Missing production database credentials!

Set these environment variables:
  PROD_DB_HOST=your-production-host
  PROD_DB_PORT=5432 (optional, defaults to 5432)
  PROD_DB_NAME=family_directory (optional, defaults to family_directory)
  PROD_DB_USER=your-username
  PROD_DB_PASSWORD=your-password

OR create a .env.production file in the backend directory with these values.

Example:
  PROD_DB_HOST=your-production-host.com
  PROD_DB_USER=your_user
  PROD_DB_PASSWORD=your_password
  PROD_DB_NAME=family_directory
`);
  process.exit(1);
}

console.log('📦 Exporting from production database...');
console.log(`Host: ${PROD_DB_CONFIG.host}`);
console.log(`Database: ${PROD_DB_CONFIG.database}`);
console.log(`User: ${PROD_DB_CONFIG.user}\n`);

const pool = new Pool(PROD_DB_CONFIG);

let sqlContent = `-- Production Database Export
-- Generated: ${new Date().toISOString()}
-- Source: ${PROD_DB_CONFIG.host}/${PROD_DB_CONFIG.database}

-- ============================================
-- DATABASE SCHEMA
-- ============================================

`;

try {
  // Export schema for all tables
  const tables = [
    'households',
    'persons',
    'relationships',
    'marital_relationships',
    'magic_link_tokens',
    'user_preferences',
    'app_settings'
  ];

  for (const table of tables) {
    try {
      // Get table schema
      const schemaResult = await pool.query(`
        SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);

      if (schemaResult.rows.length > 0) {
        sqlContent += `-- Table: ${table}\n`;
        sqlContent += `CREATE TABLE IF NOT EXISTS ${table} (\n`;
        
        const columns = schemaResult.rows.map(col => {
          let def = `  ${col.column_name} ${col.data_type}`;
          if (col.character_maximum_length) {
            def += `(${col.character_maximum_length})`;
          }
          if (col.is_nullable === 'NO') {
            def += ' NOT NULL';
          }
          if (col.column_default) {
            def += ` DEFAULT ${col.column_default}`;
          }
          return def;
        }).join(',\n');
        
        sqlContent += columns;
        sqlContent += '\n);\n\n';
      }
    } catch (error) {
      console.log(`   ⚠️  Skipping schema for ${table}: ${error.message}`);
    }
  }

  sqlContent += `-- ============================================
-- DATABASE DATA
-- ============================================

`;

  // Export data from each table
  for (const table of tables) {
    try {
      const result = await pool.query(`SELECT * FROM ${table}`);
      
      if (result.rows.length > 0) {
        sqlContent += `-- Data for table: ${table} (${result.rows.length} rows)\n`;
        sqlContent += `TRUNCATE TABLE ${table} CASCADE;\n\n`;
        
        for (const row of result.rows) {
          const columns = Object.keys(row).join(', ');
          const values = Object.values(row).map(val => {
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
            if (val instanceof Date) return `'${val.toISOString()}'`;
            return val;
          }).join(', ');
          
          sqlContent += `INSERT INTO ${table} (${columns}) VALUES (${values});\n`;
        }
        sqlContent += '\n';
        console.log(`   ✅ Exported ${result.rows.length} rows from ${table}`);
      }
    } catch (error) {
      console.log(`   ⚠️  Skipping data for ${table}: ${error.message}`);
    }
  }

  // Write to file
  fs.writeFileSync(outputFile, sqlContent, 'utf8');

  const fileSize = (fs.statSync(outputFile).size / 1024).toFixed(2);
  console.log(`\n✅ Production database export created successfully!`);
  console.log(`\n📁 File: production-export.sql`);
  console.log(`📊 Size: ${fileSize} KB`);
  console.log(`📍 Location: ${outputFile}`);
  console.log(`\n🚀 Next step: Import into Docker:`);
  console.log(`   node scripts/import-production-db.js ${outputFile}\n`);

} catch (error) {
  console.error('❌ Error exporting database:', error);
  process.exit(1);
} finally {
  await pool.end();
}

