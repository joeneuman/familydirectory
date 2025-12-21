import pool from '../config/database.js';

export class UserPreferences {
  static async get(userId, key) {
    const result = await pool.query(
      'SELECT preference_value FROM user_preferences WHERE user_id = $1 AND preference_key = $2',
      [userId, key]
    );
    return result.rows[0]?.preference_value || null;
  }

  static async set(userId, key, value) {
    const valueString = typeof value === 'string' ? value : JSON.stringify(value);
    const result = await pool.query(
      `INSERT INTO user_preferences (user_id, preference_key, preference_value, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, preference_key)
       DO UPDATE SET preference_value = $3, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, key, valueString]
    );
    return result.rows[0];
  }

  static async getAll(userId) {
    const result = await pool.query(
      'SELECT preference_key, preference_value FROM user_preferences WHERE user_id = $1',
      [userId]
    );
    const preferences = {};
    result.rows.forEach(row => {
      try {
        preferences[row.preference_key] = JSON.parse(row.preference_value);
      } catch (e) {
        preferences[row.preference_key] = row.preference_value;
      }
    });
    return preferences;
  }
}





