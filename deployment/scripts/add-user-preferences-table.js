import pool from '../src/config/database.js';

async function addUserPreferencesTable() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create user preferences table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        preference_key VARCHAR(100) NOT NULL,
        preference_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, preference_key)
      )
    `);
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id 
      ON user_preferences(user_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_preferences_key 
      ON user_preferences(preference_key)
    `);
    
    await client.query('COMMIT');
    console.log('✓ Created user_preferences table');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addUserPreferencesTable();


