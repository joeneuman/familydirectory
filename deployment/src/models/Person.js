import pool from '../config/database.js';

export class Person {
  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM persons WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM persons WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findAll() {
    const result = await pool.query(
      'SELECT * FROM persons ORDER BY last_name, first_name'
    );
    return result.rows;
  }

  static async findByHousehold(householdId) {
    const result = await pool.query(
      'SELECT * FROM persons WHERE primary_household_id = $1 ORDER BY last_name, first_name',
      [householdId]
    );
    return result.rows;
  }

  static async create(data) {
    const {
      first_name,
      last_name,
      full_name,
      email,
      phone,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      date_of_birth,
      age,
      wedding_anniversary_date,
      years_married,
      generation,
      photo_url,
      is_deceased,
      primary_household_id
    } = data;

    const result = await pool.query(
      `INSERT INTO persons (
        first_name, last_name, full_name, email, phone,
        address_line1, address_line2, city, state, postal_code, country,
        date_of_birth, age, wedding_anniversary_date, years_married,
        generation, photo_url, is_deceased, primary_household_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        first_name, last_name, full_name, email, phone,
        address_line1, address_line2, city, state, postal_code, country || 'USA',
        date_of_birth, age, wedding_anniversary_date, years_married,
        generation, photo_url, is_deceased || false, primary_household_id
      ]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic update query
    const allowedFields = [
      'first_name', 'last_name', 'full_name', 'email', 'phone',
      'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country',
      'date_of_birth', 'age', 'wedding_anniversary_date', 'years_married',
      'generation', 'photo_url', 'is_deceased', 'primary_household_id', 'is_admin'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramCount}`);
        values.push(data[field]);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    // Update last_modified_at
    fields.push(`last_modified_at = $${paramCount}`);
    values.push(new Date());
    paramCount++;

    // Update field-level timestamps for changed fields
    const timestampFields = [
      'phone', 'address_line1', 'address_line2', 'city', 'state',
      'postal_code', 'country', 'date_of_birth', 'wedding_anniversary_date', 'photo_url'
    ];

    for (const field of timestampFields) {
      if (data[field] !== undefined) {
        fields.push(`${field}_last_modified_at = $${paramCount}`);
        values.push(new Date());
        paramCount++;
      }
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE persons SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async getSpouse(personId) {
    const result = await pool.query(
      `SELECT p.* FROM persons p
       INNER JOIN marital_relationships mr ON (
         (mr.person_a_id = p.id AND mr.person_b_id = $1) OR
         (mr.person_b_id = p.id AND mr.person_a_id = $1)
       )
       WHERE mr.divorce_date IS NULL
       LIMIT 1`,
      [personId]
    );
    return result.rows[0] || null;
  }

  static async getParents(personId) {
    const result = await pool.query(
      `SELECT p.* FROM persons p
       INNER JOIN relationships r ON r.parent_id = p.id
       WHERE r.child_id = $1`,
      [personId]
    );
    return result.rows;
  }

  static async getChildren(personId) {
    const result = await pool.query(
      `SELECT p.* FROM persons p
       INNER JOIN relationships r ON r.child_id = p.id
       WHERE r.parent_id = $1`,
      [personId]
    );
    return result.rows;
  }
}

