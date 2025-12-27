import pool from '../config/database.js';

export class AppSettings {
  static async get(key) {
    try {
      const result = await pool.query(
        'SELECT setting_value FROM app_settings WHERE setting_key = $1',
        [key]
      );
      return result.rows[0]?.setting_value || null;
    } catch (error) {
      // If table doesn't exist yet, return null (will use default)
      if (error.code === '42P01') { // PostgreSQL error code for "relation does not exist"
        console.warn('app_settings table does not exist yet. Please run the migration.');
        return null;
      }
      throw error;
    }
  }

  static async set(key, value, updatedBy = null) {
    try {
      const valueString = typeof value === 'string' ? value : JSON.stringify(value);
      const result = await pool.query(
        `INSERT INTO app_settings (setting_key, setting_value, updated_by, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (setting_key)
         DO UPDATE SET setting_value = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [key, valueString, updatedBy]
      );
      return result.rows[0];
    } catch (error) {
      // If table doesn't exist yet, provide helpful error
      if (error.code === '42P01') { // PostgreSQL error code for "relation does not exist"
        console.error('app_settings table does not exist. Please run migration 005_add_app_settings.sql');
        throw new Error('Settings table does not exist. Please run the database migration.');
      }
      throw error;
    }
  }

  static async getAll() {
    const result = await pool.query(
      'SELECT setting_key, setting_value FROM app_settings'
    );
    const settings = {};
    result.rows.forEach(row => {
      try {
        settings[row.setting_key] = JSON.parse(row.setting_value);
      } catch (e) {
        settings[row.setting_key] = row.setting_value;
      }
    });
    return settings;
  }
}

