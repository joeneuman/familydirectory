import pool from '../src/config/database.js';

/**
 * Remove all relationship data from the database
 * This includes:
 * - All entries in the relationships table (parent-child)
 * - All entries in the marital_relationships table
 * 
 * Usage: node scripts/remove-relationships.js
 */

async function removeRelationships() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Delete all marital relationships
    const maritalResult = await client.query('DELETE FROM marital_relationships RETURNING id');
    console.log(`Deleted ${maritalResult.rowCount} marital relationship(s)`);
    
    // Delete all parent-child relationships
    const relationshipResult = await client.query('DELETE FROM relationships RETURNING id');
    console.log(`Deleted ${relationshipResult.rowCount} relationship(s)`);
    
    await client.query('COMMIT');
    console.log('✓ All relationship data removed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

removeRelationships();



