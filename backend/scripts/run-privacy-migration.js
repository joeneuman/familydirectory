import pool from '../src/config/database.js';

async function runPrivacyMigration() {
  const client = await pool.connect();
  
  try {
    // Check if column already exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'persons' AND column_name = 'privacy_settings'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('privacy_settings column already exists. Skipping migration.');
      return;
    }
    
    console.log('Running privacy_settings migration...');
    await client.query('BEGIN');
    
    // Add privacy_settings column
    await client.query(`
      ALTER TABLE persons ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{}'::jsonb;
    `);
    
    // Create index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_persons_privacy_settings ON persons USING GIN (privacy_settings);
    `);
    
    await client.query('COMMIT');
    console.log('Privacy settings migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runPrivacyMigration().catch(console.error);



