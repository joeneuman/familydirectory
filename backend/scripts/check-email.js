import pool from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const emailToCheck = process.argv[2];

if (!emailToCheck) {
  console.log('Usage: node scripts/check-email.js <email>');
  console.log('Example: node scripts/check-email.js joe@giddydigs.com');
  process.exit(1);
}

async function checkEmail() {
  try {
    console.log(`Checking for email: ${emailToCheck}`);
    
    // Exact match
    const exactResult = await pool.query(
      'SELECT id, first_name, last_name, email FROM persons WHERE email = $1',
      [emailToCheck]
    );
    
    if (exactResult.rows.length > 0) {
      console.log('\n✓ Found exact match:');
      exactResult.rows.forEach(person => {
        console.log(`  - ${person.first_name} ${person.last_name} (${person.email})`);
      });
    } else {
      console.log('\n✗ No exact match found');
    }
    
    // Case-insensitive search
    const caseInsensitiveResult = await pool.query(
      'SELECT id, first_name, last_name, email FROM persons WHERE LOWER(email) = LOWER($1)',
      [emailToCheck]
    );
    
    if (caseInsensitiveResult.rows.length > 0 && caseInsensitiveResult.rows.length !== exactResult.rows.length) {
      console.log('\n⚠ Found case-insensitive match:');
      caseInsensitiveResult.rows.forEach(person => {
        console.log(`  - ${person.first_name} ${person.last_name} (${person.email})`);
      });
    }
    
    // Partial match (contains the email domain or similar)
    const partialResult = await pool.query(
      `SELECT id, first_name, last_name, email FROM persons 
       WHERE email ILIKE $1 OR email ILIKE $2`,
      [`%${emailToCheck.split('@')[0]}%`, `%@${emailToCheck.split('@')[1]}%`]
    );
    
    if (partialResult.rows.length > 0) {
      console.log('\n📋 Similar emails found:');
      partialResult.rows.forEach(person => {
        console.log(`  - ${person.first_name} ${person.last_name} (${person.email})`);
      });
    }
    
    // List all emails if no matches
    if (exactResult.rows.length === 0 && caseInsensitiveResult.rows.length === 0) {
      console.log('\n📋 All emails in database:');
      const allEmails = await pool.query(
        'SELECT first_name, last_name, email FROM persons WHERE email IS NOT NULL AND email != \'\' ORDER BY email'
      );
      
      if (allEmails.rows.length === 0) {
        console.log('  (No emails found in database)');
      } else {
        allEmails.rows.forEach(person => {
          console.log(`  - ${person.email} (${person.first_name} ${person.last_name})`);
        });
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkEmail();




