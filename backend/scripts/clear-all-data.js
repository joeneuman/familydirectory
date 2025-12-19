import pool from '../src/config/database.js';

/**
 * Clear all data from the database
 * This removes all people, households, relationships, tokens, and preferences
 * 
 * Usage: node scripts/clear-all-data.js
 */

async function clearAllData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Clearing all data...');
    
    // Delete in order to respect foreign key constraints
    const tables = [
      'magic_link_tokens',
      'user_preferences',
      'marital_relationships',
      'relationships',
      'persons',
      'households'
    ];
    
    for (const table of tables) {
      const result = await client.query(`TRUNCATE TABLE ${table} CASCADE`);
      console.log(`✓ Cleared ${table}`);
    }
    
    await client.query('COMMIT');
    console.log('\n✓ All data cleared successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

clearAllData();


