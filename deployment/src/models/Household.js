import pool from '../config/database.js';

export class Household {
  static async findAll() {
    const result = await pool.query(
      `SELECT h.*, 
              p.first_name as primary_contact_first_name,
              p.last_name as primary_contact_last_name
       FROM households h
       LEFT JOIN persons p ON h.primary_contact_person_id = p.id
       ORDER BY h.name`
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM households WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(data) {
    const { name, primary_contact_person_id, notes } = data;
    const result = await pool.query(
      'INSERT INTO households (name, primary_contact_person_id, notes) VALUES ($1, $2, $3) RETURNING *',
      [name, primary_contact_person_id, notes]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = ['name', 'primary_contact_person_id', 'notes'];
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

    values.push(id);
    const result = await pool.query(
      `UPDATE households SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }
}


