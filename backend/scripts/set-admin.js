import pool from '../src/config/database.js';
import { Person } from '../src/models/Person.js';

/**
 * Set a person as administrator
 * 
 * Usage: node scripts/set-admin.js "Jane" "Smith" true
 */

async function setAdmin(firstName, lastName, isAdmin) {
  const client = await pool.connect();
  
  try {
    // Find the person
    const personResult = await pool.query(
      'SELECT id, first_name, last_name, is_admin FROM persons WHERE first_name = $1 AND last_name = $2',
      [firstName, lastName]
    );
    
    if (personResult.rows.length === 0) {
      console.error(`Person not found: ${firstName} ${lastName}`);
      return;
    }
    
    const person = personResult.rows[0];
    console.log(`Found person: ${person.first_name} ${person.last_name} (${person.id})`);
    console.log(`Current admin status: ${person.is_admin || false}`);
    
    // Update admin status
    await Person.update(person.id, {
      is_admin: isAdmin === 'true' || isAdmin === true
    });
    
    const status = (isAdmin === 'true' || isAdmin === true) ? 'admin' : 'not admin';
    console.log(`✓ Set ${person.first_name} ${person.last_name} as ${status}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
const [,, firstName, lastName, isAdmin] = process.argv;

if (!firstName || !lastName || isAdmin === undefined) {
  console.log('Usage: node scripts/set-admin.js "First" "Last" true|false');
  console.log('Example: node scripts/set-admin.js "Jane" "Smith" true');
  process.exit(1);
}

setAdmin(firstName, lastName, isAdmin);



