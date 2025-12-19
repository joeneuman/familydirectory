import pool from '../src/config/database.js';
import { Person } from '../src/models/Person.js';

/**
 * Set a person as administrator by email
 * 
 * Usage: node scripts/set-admin-by-email.js "email@example.com" true
 */

async function setAdminByEmail(email, isAdmin) {
  const client = await pool.connect();
  
  try {
    // Find the person by email
    const personResult = await pool.query(
      'SELECT id, first_name, last_name, email, is_admin FROM persons WHERE email = $1',
      [email]
    );
    
    if (personResult.rows.length === 0) {
      console.error(`Person not found with email: ${email}`);
      return;
    }
    
    const person = personResult.rows[0];
    console.log(`Found person: ${person.first_name} ${person.last_name} (${person.email})`);
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
const [,, email, isAdmin] = process.argv;

if (!email || isAdmin === undefined) {
  console.log('Usage: node scripts/set-admin-by-email.js "email@example.com" true|false');
  console.log('Example: node scripts/set-admin-by-email.js "joe@example.com" true');
  process.exit(1);
}

setAdminByEmail(email, isAdmin);

