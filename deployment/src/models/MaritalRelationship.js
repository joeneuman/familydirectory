import pool from '../config/database.js';

export class MaritalRelationship {
  static async create(data) {
    const { person_a_id, person_b_id, marriage_date, divorce_date } = data;
    const result = await pool.query(
      `INSERT INTO marital_relationships (person_a_id, person_b_id, marriage_date, divorce_date)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [person_a_id, person_b_id, marriage_date, divorce_date]
    );
    return result.rows[0];
  }

  static async findByPerson(personId) {
    const result = await pool.query(
      `SELECT * FROM marital_relationships
       WHERE (person_a_id = $1 OR person_b_id = $1)
       AND divorce_date IS NULL
       LIMIT 1`,
      [personId]
    );
    return result.rows[0] || null;
  }
}


