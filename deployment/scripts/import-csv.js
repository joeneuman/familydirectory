import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import pool from '../src/config/database.js';
import { Person } from '../src/models/Person.js';
import { Household } from '../src/models/Household.js';
import { Relationship } from '../src/models/Relationship.js';
import { MaritalRelationship } from '../src/models/MaritalRelationship.js';
import { differenceInYears, parseISO } from 'date-fns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * CSV Import Script
 * 
 * Expected CSV columns:
 * - first_name
 * - last_name
 * - email (optional)
 * - phone (optional)
 * - address_line1 (optional)
 * - address_line2 (optional)
 * - city (optional)
 * - state (optional)
 * - postal_code (optional)
 * - country (optional, defaults to USA)
 * - date_of_birth (YYYY-MM-DD format, optional)
 * - wedding_anniversary_date (YYYY-MM-DD format, optional)
 * - generation (G1, G2, G3, etc.)
 * - household_name
 * - mother_name (first_name last_name, optional)
 * - father_name (first_name last_name, optional)
 * - spouse_name (first_name last_name, optional)
 * - is_deceased (true/false, optional)
 * - photo_url (optional)
 */

async function importCSV(filePath) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Read CSV file
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`Importing ${records.length} records...`);

    // Create maps for lookups
    const personMap = new Map(); // name -> person object
    const householdMap = new Map(); // household_name -> household object

    // First pass: Create households and persons
    for (const record of records) {
      // Create or get household
      let household = householdMap.get(record.household_name);
      if (!household && record.household_name) {
        household = await Household.create({
          name: record.household_name,
        });
        householdMap.set(record.household_name, household);
        console.log(`Created household: ${household.name}`);
      }

      // Calculate age and years_married
      let age = null;
      if (record.date_of_birth) {
        try {
          const dob = parseISO(record.date_of_birth);
          age = differenceInYears(new Date(), dob);
        } catch (e) {
          console.warn(`Invalid date_of_birth for ${record.first_name} ${record.last_name}: ${record.date_of_birth}`);
        }
      }

      let years_married = null;
      if (record.wedding_anniversary_date) {
        try {
          const annDate = parseISO(record.wedding_anniversary_date);
          years_married = differenceInYears(new Date(), annDate);
        } catch (e) {
          console.warn(`Invalid wedding_anniversary_date for ${record.first_name} ${record.last_name}: ${record.wedding_anniversary_date}`);
        }
      }

      // Create person
      const person = await Person.create({
        first_name: record.first_name,
        last_name: record.last_name,
        full_name: record.full_name || `${record.first_name} ${record.last_name}`,
        email: record.email || null,
        phone: record.phone || null,
        address_line1: record.address_line1 || null,
        address_line2: record.address_line2 || null,
        city: record.city || null,
        state: record.state || null,
        postal_code: record.postal_code || null,
        country: record.country || 'USA',
        date_of_birth: record.date_of_birth || null,
        age: age,
        wedding_anniversary_date: record.wedding_anniversary_date || null,
        years_married: years_married,
        generation: record.generation || null,
        photo_url: record.photo_url || null,
        is_deceased: record.is_deceased === 'true' || record.is_deceased === true,
        primary_household_id: household?.id || null,
      });

      // Store in map for relationship lookup
      const fullName = `${record.first_name} ${record.last_name}`.toLowerCase();
      personMap.set(fullName, person);
      console.log(`Created person: ${person.first_name} ${person.last_name}`);
    }

    // Second pass: Create relationships
    for (const record of records) {
      const personName = `${record.first_name} ${record.last_name}`.toLowerCase();
      const person = personMap.get(personName);

      if (!person) continue;

      // Create parent-child relationships
      if (record.mother_name) {
        const motherName = record.mother_name.toLowerCase();
        const mother = personMap.get(motherName);
        if (mother) {
          try {
            await Relationship.create({
              parent_id: mother.id,
              child_id: person.id,
              relationship_type: 'biological',
            });
            console.log(`Created relationship: ${mother.first_name} ${mother.last_name} -> ${person.first_name} ${person.last_name}`);
          } catch (e) {
            // Relationship might already exist
            console.warn(`Could not create relationship: ${e.message}`);
          }
        } else {
          console.warn(`Mother not found: ${record.mother_name}`);
        }
      }

      if (record.father_name) {
        const fatherName = record.father_name.toLowerCase();
        const father = personMap.get(fatherName);
        if (father) {
          try {
            await Relationship.create({
              parent_id: father.id,
              child_id: person.id,
              relationship_type: 'biological',
            });
            console.log(`Created relationship: ${father.first_name} ${father.last_name} -> ${person.first_name} ${person.last_name}`);
          } catch (e) {
            console.warn(`Could not create relationship: ${e.message}`);
          }
        } else {
          console.warn(`Father not found: ${record.father_name}`);
        }
      }

      // Create marital relationships
      if (record.spouse_name) {
        const spouseName = record.spouse_name.toLowerCase();
        const spouse = personMap.get(spouseName);
        if (spouse) {
          try {
            // Check if relationship already exists (might be created from other direction)
            const existing = await MaritalRelationship.findByPerson(person.id);
            if (!existing || existing.person_a_id !== spouse.id && existing.person_b_id !== spouse.id) {
              await MaritalRelationship.create({
                person_a_id: person.id,
                person_b_id: spouse.id,
                marriage_date: record.wedding_anniversary_date || null,
                divorce_date: null,
              });
              console.log(`Created marital relationship: ${person.first_name} ${person.last_name} <-> ${spouse.first_name} ${spouse.last_name}`);
            }
          } catch (e) {
            console.warn(`Could not create marital relationship: ${e.message}`);
          }
        } else {
          console.warn(`Spouse not found: ${record.spouse_name}`);
        }
      }
    }

    // Update household primary contacts (first adult in each household)
    for (const [householdName, household] of householdMap.entries()) {
      const members = await Person.findByHousehold(household.id);
      if (members.length > 0) {
        // Find first non-deceased adult (or just first person)
        const primaryContact = members.find(m => !m.is_deceased) || members[0];
        await Household.update(household.id, {
          primary_contact_person_id: primaryContact.id,
        });
      }
    }

    await client.query('COMMIT');
    console.log('Import completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Import failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run import if called directly
const csvPath = process.argv[2] || path.join(__dirname, '..', 'sample-data.csv');

// Check if file exists
if (!fs.existsSync(csvPath)) {
  console.error(`Error: CSV file not found at: ${csvPath}`);
  console.error('Please provide the path to your CSV file:');
  console.error('  node scripts/import-csv.js path/to/your/file.csv');
  process.exit(1);
}

console.log(`Importing from: ${csvPath}`);
importCSV(csvPath).catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});

export { importCSV };

