import pool from '../src/config/database.js';

async function addAdminColumn() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Add is_admin column if it doesn't exist
    await client.query(`
      ALTER TABLE persons 
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE
    `);
    
    // Create index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_persons_is_admin 
      ON persons(is_admin) 
      WHERE is_admin = TRUE
    `);
    
    await client.query('COMMIT');
    console.log('✓ Added is_admin column to persons table');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addAdminColumn();






