import pool from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const email = process.argv[2] || 'joe@giddydigs.com';

async function getUserPreferences() {
  try {
    console.log(`Looking up preferences for: ${email}`);
    
    // First, find the user by email
    const userResult = await pool.query(
      'SELECT id, first_name, last_name, email FROM persons WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      console.log('User not found');
      process.exit(1);
    }
    
    const user = userResult.rows[0];
    console.log(`Found user: ${user.first_name} ${user.last_name} (${user.email})`);
    console.log(`User ID: ${user.id}\n`);
    
    // Get all preferences for this user
    const prefsResult = await pool.query(
      'SELECT preference_key, preference_value FROM user_preferences WHERE user_id = $1 ORDER BY preference_key',
      [user.id]
    );
    
    if (prefsResult.rows.length === 0) {
      console.log('No preferences found for this user');
      process.exit(0);
    }
    
    console.log('Saved preferences:');
    console.log('==================\n');
    
    const filterPrefs = {};
    
    prefsResult.rows.forEach(row => {
      try {
        const value = JSON.parse(row.preference_value);
        console.log(`${row.preference_key}:`);
        console.log(JSON.stringify(value, null, 2));
        console.log('');
        
        // Extract filter preferences
        if (row.preference_key.startsWith('directoryDisplayFilters_')) {
          const viewType = row.preference_key.replace('directoryDisplayFilters_', '');
          filterPrefs[viewType] = value;
        }
      } catch (e) {
        console.log(`${row.preference_key}: ${row.preference_value}`);
        console.log('');
      }
    });
    
    // Show filter preferences summary
    if (Object.keys(filterPrefs).length > 0) {
      console.log('\nFilter Preferences by View:');
      console.log('===========================\n');
      Object.keys(filterPrefs).forEach(viewType => {
        console.log(`View: ${viewType}`);
        console.log(JSON.stringify(filterPrefs[viewType], null, 2));
        console.log('');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getUserPreferences();



