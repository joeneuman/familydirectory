import pool from '../src/config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSettingsMigration() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/005_add_app_settings.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await client.query(migrationSQL);
    
    await client.query('COMMIT');
    console.log('✓ Successfully ran app_settings migration');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error running migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runSettingsMigration().catch(console.error);


