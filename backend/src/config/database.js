import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool, types } = pg;

// Configure pg to return DATE fields as strings (YYYY-MM-DD) instead of Date objects
// This prevents timezone issues when dates are serialized to JSON
// PostgreSQL DATE type OID is 1082
types.setTypeParser(1082, (value) => {
  // Return the date as-is (already in YYYY-MM-DD format)
  return value;
});

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'family_directory',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;





