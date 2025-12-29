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

  static async getExSpouses(personId) {
    const result = await pool.query(
      `SELECT p.* FROM persons p
       INNER JOIN marital_relationships mr ON (
         (mr.person_a_id = p.id AND mr.person_b_id = $1) OR
         (mr.person_b_id = p.id AND mr.person_a_id = $1)
       )
       WHERE mr.divorce_date IS NOT NULL
       ORDER BY mr.divorce_date DESC`,
      [personId]
    );
    return result.rows;
  }

  static async setExSpouses(personId, exSpouseIds) {
    // First, get all current ex-spouse relationships for this person
    const currentExSpouses = await pool.query(
      `SELECT 
         CASE WHEN person_a_id = $1 THEN person_b_id ELSE person_a_id END as ex_spouse_id
       FROM marital_relationships
       WHERE (person_a_id = $1 OR person_b_id = $1)
       AND divorce_date IS NOT NULL`,
      [personId]
    );
    const currentExSpouseIds = currentExSpouses.rows.map(r => r.ex_spouse_id);

    // Remove ex-spouse relationships that are no longer in the list
    const toRemove = currentExSpouseIds.filter(id => !exSpouseIds.includes(id));
    for (const exSpouseId of toRemove) {
      // Delete the relationship entirely (not just set divorce_date)
      const person1Id = personId.localeCompare(exSpouseId) < 0 ? personId : exSpouseId;
      const person2Id = personId.localeCompare(exSpouseId) < 0 ? exSpouseId : personId;
      await pool.query(
        `DELETE FROM marital_relationships 
         WHERE person_a_id = $1 AND person_b_id = $2`,
        [person1Id, person2Id]
      );
    }

    // Add new ex-spouse relationships
    const toAdd = exSpouseIds.filter(id => !currentExSpouseIds.includes(id));
    for (const exSpouseId of toAdd) {
      // Ensure this person is not the current spouse
      const currentSpouse = await this.findByPerson(personId);
      if (currentSpouse && (currentSpouse.person_a_id === exSpouseId || currentSpouse.person_b_id === exSpouseId)) {
        // This is the current spouse, skip adding as ex-spouse
        continue;
      }

      // Create or update relationship with divorce_date set
      const person1Id = personId.localeCompare(exSpouseId) < 0 ? personId : exSpouseId;
      const person2Id = personId.localeCompare(exSpouseId) < 0 ? exSpouseId : personId;
      
      await pool.query(
        `INSERT INTO marital_relationships (person_a_id, person_b_id, marriage_date, divorce_date)
         VALUES ($1, $2, NULL, CURRENT_DATE)
         ON CONFLICT (person_a_id, person_b_id) 
         DO UPDATE SET divorce_date = CURRENT_DATE
         RETURNING *`,
        [person1Id, person2Id]
      );
    }

    return true;
  }
}



