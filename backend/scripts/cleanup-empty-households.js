import pool from '../src/config/database.js';
import { Person } from '../src/models/Person.js';
import { Household } from '../src/models/Household.js';

/**
 * Remove households that have no members
 * 
 * Usage: node scripts/cleanup-empty-households.js
 */

async function cleanupEmptyHouseholds() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get all households
    const households = await Household.findAll();
    console.log(`Found ${households.length} households`);
    
    let deletedCount = 0;
    
    for (const household of households) {
      // Check if household has any members
      const members = await Person.findByHousehold(household.id);
      
      if (members.length === 0) {
        console.log(`Deleting empty household: ${household.name} (${household.id})`);
        
        // Delete the household
        await pool.query('DELETE FROM households WHERE id = $1', [household.id]);
        deletedCount++;
      }
    }
    
    await client.query('COMMIT');
    console.log(`✓ Cleaned up ${deletedCount} empty household(s)`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

cleanupEmptyHouseholds();






