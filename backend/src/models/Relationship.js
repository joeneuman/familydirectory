import pool from '../config/database.js';

export class Relationship {
  static async create(data) {
    const { parent_id, child_id, relationship_type = 'biological' } = data;
    const result = await pool.query(
      'INSERT INTO relationships (parent_id, child_id, relationship_type) VALUES ($1, $2, $3) RETURNING *',
      [parent_id, child_id, relationship_type]
    );
    return result.rows[0];
  }

  static async getAncestors(personId) {
    // Recursive query to get all ancestors
    const result = await pool.query(
      `WITH RECURSIVE ancestors AS (
        SELECT parent_id, child_id, 1 as level
        FROM relationships
        WHERE child_id = $1
        UNION ALL
        SELECT r.parent_id, r.child_id, a.level + 1
        FROM relationships r
        INNER JOIN ancestors a ON r.child_id = a.parent_id
      )
      SELECT DISTINCT a.parent_id as ancestor_id
      FROM ancestors a
      WHERE a.parent_id IS NOT NULL`,
      [personId]
    );
    return result.rows.map(row => row.ancestor_id);
  }

  static async isAncestor(ancestorId, descendantId) {
    if (ancestorId === descendantId) {
      return true;
    }
    const ancestors = await this.getAncestors(descendantId);
    return ancestors.includes(ancestorId);
  }
}


