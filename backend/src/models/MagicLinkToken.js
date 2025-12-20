import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export class MagicLinkToken {
  static async create(email) {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + parseInt(process.env.MAGIC_LINK_EXPIRY_MINUTES || 15));

    const result = await pool.query(
      'INSERT INTO magic_link_tokens (email, token, expires_at) VALUES ($1, $2, $3) RETURNING *',
      [email, token, expiresAt]
    );
    return result.rows[0];
  }

  static async findByToken(token) {
    const result = await pool.query(
      'SELECT * FROM magic_link_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );
    return result.rows[0] || null;
  }

  static async cleanupExpired() {
    await pool.query(
      'DELETE FROM magic_link_tokens WHERE expires_at < NOW()'
    );
  }
}





