import pool from '../src/config/database.js';
import { Person } from '../src/models/Person.js';
import { Household } from '../src/models/Household.js';

/**
 * Set head of household by finding the person by name and setting them as primary_contact_person_id
 * 
 * Usage: node scripts/set-head-of-household.js "Jane Smith" "Smith Household"
 */

async function setHeadOfHousehold(personFirstName, personLastName, householdName) {
  const client = await pool.connect();
  
  try {
    // Find the person
    const personResult = await pool.query(
      'SELECT id, first_name, last_name FROM persons WHERE first_name = $1 AND last_name = $2',
      [personFirstName, personLastName]
    );
    
    if (personResult.rows.length === 0) {
      console.error(`Person not found: ${personFirstName} ${personLastName}`);
      return;
    }
    
    const person = personResult.rows[0];
    console.log(`Found person: ${person.first_name} ${person.last_name} (${person.id})`);
    
    // Find the household
    const householdResult = await pool.query(
      'SELECT id, name FROM households WHERE name = $1',
      [householdName]
    );
    
    if (householdResult.rows.length === 0) {
      console.error(`Household not found: ${householdName}`);
      return;
    }
    
    const household = householdResult.rows[0];
    console.log(`Found household: ${household.name} (${household.id})`);
    
    // Update household
    await Household.update(household.id, {
      primary_contact_person_id: person.id
    });
    
    console.log(`✓ Set ${person.first_name} ${person.last_name} as head of ${household.name}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
const [,, firstName, lastName, householdName] = process.argv;

if (!firstName || !lastName || !householdName) {
  console.log('Usage: node scripts/set-head-of-household.js "First" "Last" "Household Name"');
  console.log('Example: node scripts/set-head-of-household.js "Jane" "Smith" "Smith Household"');
  process.exit(1);
}

setHeadOfHousehold(firstName, lastName, householdName);


