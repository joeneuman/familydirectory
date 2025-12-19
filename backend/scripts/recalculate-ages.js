import pool from '../src/config/database.js';
import { parseISO, differenceInYears } from 'date-fns';

/**
 * Recalculate ages and years_married for all persons in the database
 * This updates the database with calculated values from date_of_birth and wedding_anniversary_date
 * 
 * Usage: node scripts/recalculate-ages.js
 */

async function recalculateAges() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Fetching all persons...');
    const result = await client.query('SELECT id, first_name, last_name, date_of_birth, wedding_anniversary_date, age, years_married FROM persons');
    const persons = result.rows;
    
    console.log(`Found ${persons.length} persons`);
    
    let updatedCount = 0;
    let ageUpdatedCount = 0;
    let yearsMarriedUpdatedCount = 0;
    
    for (const person of persons) {
      let needsUpdate = false;
      const updates = [];
      const values = [];
      let paramCount = 1;
      
      // Calculate age if date_of_birth exists
      if (person.date_of_birth) {
        try {
          // Handle both Date objects and ISO strings
          let dob;
          if (person.date_of_birth instanceof Date) {
            dob = person.date_of_birth;
          } else {
            dob = parseISO(person.date_of_birth);
          }
          
          const calculatedAge = differenceInYears(new Date(), dob);
          
          // Only update if age is valid (not NaN) and different from current
          if (!isNaN(calculatedAge) && calculatedAge !== null && calculatedAge !== undefined) {
            // Always update if current age is null/undefined, or if it's different
            if (person.age === null || person.age === undefined || person.age !== calculatedAge) {
              updates.push(`age = $${paramCount}`);
              values.push(calculatedAge);
              paramCount++;
              needsUpdate = true;
              ageUpdatedCount++;
              console.log(`  ${person.first_name} ${person.last_name}: Age ${person.age || 'null'} -> ${calculatedAge}`);
            }
          } else {
            console.warn(`  ${person.first_name} ${person.last_name}: Invalid age calculation (NaN) from date: ${person.date_of_birth}`);
          }
        } catch (e) {
          console.warn(`  ${person.first_name} ${person.last_name}: Error parsing date_of_birth: ${person.date_of_birth} - ${e.message}`);
        }
      } else if (person.age !== null && person.age !== undefined) {
        // If no date_of_birth but age exists, set age to null
        updates.push(`age = $${paramCount}`);
        values.push(null);
        paramCount++;
        needsUpdate = true;
        console.log(`  ${person.first_name} ${person.last_name}: No date_of_birth, setting age to null`);
      }
      
      // Calculate years_married if wedding_anniversary_date exists
      if (person.wedding_anniversary_date) {
        try {
          // Handle both Date objects and ISO strings
          let annDate;
          if (person.wedding_anniversary_date instanceof Date) {
            annDate = person.wedding_anniversary_date;
          } else {
            annDate = parseISO(person.wedding_anniversary_date);
          }
          
          const calculatedYears = differenceInYears(new Date(), annDate);
          
          // Only update if years_married is valid (not NaN) and different from current
          if (!isNaN(calculatedYears) && calculatedYears !== null && calculatedYears !== undefined) {
            // Always update if current years_married is null/undefined, or if it's different
            if (person.years_married === null || person.years_married === undefined || person.years_married !== calculatedYears) {
              updates.push(`years_married = $${paramCount}`);
              values.push(calculatedYears);
              paramCount++;
              needsUpdate = true;
              yearsMarriedUpdatedCount++;
              console.log(`  ${person.first_name} ${person.last_name}: Years Married ${person.years_married || 'null'} -> ${calculatedYears}`);
            }
          } else {
            console.warn(`  ${person.first_name} ${person.last_name}: Invalid years_married calculation (NaN) from date: ${person.wedding_anniversary_date}`);
          }
        } catch (e) {
          console.warn(`  ${person.first_name} ${person.last_name}: Error parsing wedding_anniversary_date: ${person.wedding_anniversary_date} - ${e.message}`);
        }
      } else if (person.years_married !== null && person.years_married !== undefined) {
        // If no wedding_anniversary_date but years_married exists, set to null
        updates.push(`years_married = $${paramCount}`);
        values.push(null);
        paramCount++;
        needsUpdate = true;
        console.log(`  ${person.first_name} ${person.last_name}: No wedding_anniversary_date, setting years_married to null`);
      }
      
      if (needsUpdate) {
        values.push(person.id);
        await client.query(
          `UPDATE persons SET ${updates.join(', ')} WHERE id = $${paramCount}`,
          values
        );
        updatedCount++;
      }
    }
    
    await client.query('COMMIT');
    console.log(`\n✓ Recalculation complete!`);
    console.log(`  Total persons: ${persons.length}`);
    console.log(`  Persons updated: ${updatedCount}`);
    console.log(`  Ages updated: ${ageUpdatedCount}`);
    console.log(`  Years married updated: ${yearsMarriedUpdatedCount}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

recalculateAges();

