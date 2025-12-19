#!/usr/bin/env node
/**
 * Export database schema and data to SQL file
 * Run: node scripts/export-database-sql.js [--with-data]
 * 
 * Options:
 *   --with-data  Include data from tables (default: schema only)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const includeData = process.argv.includes('--with-data');
const outputFile = path.join(__dirname, '..', 'database-export.sql');

console.log('📦 Exporting database...');
console.log(`Mode: ${includeData ? 'Schema + Data' : 'Schema only'}\n`);

let sqlContent = '';

// Add header
sqlContent += `-- Family Directory Database Export
-- Generated: ${new Date().toISOString()}
-- Mode: ${includeData ? 'Schema + Data' : 'Schema only'}

-- ============================================
-- DATABASE SCHEMA
-- ============================================

`;

// Read and combine all migration files
const migrationsDir = path.join(__dirname, '..', 'migrations');
const migrationFiles = [
  '001_initial_schema.sql',
  '002_add_admin_field.sql',
  '003_add_user_preferences.sql'
];

migrationFiles.forEach(file => {
  const filePath = path.join(migrationsDir, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    sqlContent += `-- Migration: ${file}\n`;
    sqlContent += content;
    sqlContent += '\n\n';
  }
});

if (includeData) {
  sqlContent += `-- ============================================
-- DATABASE DATA
-- ============================================

`;

  try {
    // Export data from each table
    const tables = [
      'persons',
      'households',
      'relationships',
      'marital_relationships',
      'magic_link_tokens',
      'user_preferences'
    ];

    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT * FROM ${table}`);
      
      if (result.rows.length > 0) {
          sqlContent += `-- Data for table: ${table}\n`;
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
        }
      } catch (error) {
        console.log(`   ⚠️  Skipping ${table}: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('Error exporting data:', error);
  }
}

// Write to file
fs.writeFileSync(outputFile, sqlContent, 'utf8');

const fileSize = (fs.statSync(outputFile).size / 1024).toFixed(2);
console.log(`✅ Database export created successfully!`);
console.log(`\n📁 File: database-export.sql`);
console.log(`📊 Size: ${fileSize} KB`);
console.log(`📍 Location: ${outputFile}`);
console.log(`\n🚀 Ready to upload to Hostinger database!\n`);

await pool.end();

