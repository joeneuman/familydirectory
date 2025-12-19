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

  static async setSpouse(personId, spouseId) {
    // First, remove any existing spouse relationships for both people
    await pool.query(
      `UPDATE marital_relationships 
       SET divorce_date = CURRENT_DATE 
       WHERE (person_a_id = $1 OR person_b_id = $1) 
       AND divorce_date IS NULL`,
      [personId]
    );
    await pool.query(
      `UPDATE marital_relationships 
       SET divorce_date = CURRENT_DATE 
       WHERE (person_a_id = $1 OR person_b_id = $1) 
       AND divorce_date IS NULL`,
      [spouseId]
    );

    // Create new relationship (use lexicographically smaller ID first for consistency)
    const person1Id = personId.localeCompare(spouseId) < 0 ? personId : spouseId;
    const person2Id = personId.localeCompare(spouseId) < 0 ? spouseId : personId;
    
    const result = await pool.query(
      `INSERT INTO marital_relationships (person_a_id, person_b_id, marriage_date, divorce_date)
       VALUES ($1, $2, NULL, NULL)
       ON CONFLICT (person_a_id, person_b_id) 
       DO UPDATE SET divorce_date = NULL, marriage_date = NULL
       RETURNING *`,
      [person1Id, person2Id]
    );
    return result.rows[0];
  }

  static async removeSpouse(personId) {
    const result = await pool.query(
      `UPDATE marital_relationships 
       SET divorce_date = CURRENT_DATE 
       WHERE (person_a_id = $1 OR person_b_id = $1) 
       AND divorce_date IS NULL
       RETURNING *`,
      [personId]
    );
    return result.rows[0] || null;
  }
}



