import pool from '../src/config/database.js';

async function checkData() {
  try {
    // Check persons
    const personsResult = await pool.query('SELECT id, first_name, last_name, email FROM persons LIMIT 10');
    console.log('\n=== PERSONS IN DATABASE ===');
    console.log(`Found ${personsResult.rows.length} persons:`);
    personsResult.rows.forEach(p => {
      console.log(`- ${p.first_name} ${p.last_name} (${p.email || 'no email'})`);
    });

    // Check households
    const householdsResult = await pool.query('SELECT id, name FROM households LIMIT 10');
    console.log('\n=== HOUSEHOLDS IN DATABASE ===');
    console.log(`Found ${householdsResult.rows.length} households:`);
    householdsResult.rows.forEach(h => {
      console.log(`- ${h.name}`);
    });

    // Check specific email
    const emailCheck = await pool.query("SELECT * FROM persons WHERE email = 'jane.smith@example.com'");
    console.log('\n=== CHECKING jane.smith@example.com ===');
    if (emailCheck.rows.length > 0) {
      console.log('Found:', emailCheck.rows[0]);
    } else {
      console.log('NOT FOUND - Email does not exist in database');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkData();





