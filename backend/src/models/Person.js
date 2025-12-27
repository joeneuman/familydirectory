import pool from '../config/database.js';
import { deleteImageFile } from '../utils/imageCleanup.js';

export class Person {
  static async findByEmail(email) {
    // Email lookups should be case-insensitive (RFC 5321)
    const result = await pool.query(
      'SELECT * FROM persons WHERE LOWER(email) = LOWER($1)',
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
      primary_household_id,
      mother_id,
      father_id,
      gender
    } = data;

    // Validate: gender is required
    if (!gender || (gender !== 'Male' && gender !== 'Female')) {
      throw new Error('Gender is required and must be either "Male" or "Female"');
    }

    // Validate: mother_id and father_id are required except for G1
    // Note: Both can be null if explicitly set to "Not listed here" (handled by frontend validation)
    // Backend allows null values - frontend ensures at least one is selected OR both are "Not listed here"
    if (generation && generation !== 'G1') {
      // Allow null values - frontend validation ensures proper selection
      // This allows cases where parents are not in the directory
    }

    const result = await pool.query(
      `INSERT INTO persons (
        first_name, last_name, full_name, email, phone,
        address_line1, address_line2, city, state, postal_code, country,
        date_of_birth, age, wedding_anniversary_date, years_married,
        generation, photo_url, is_deceased, primary_household_id,
        mother_id, father_id, gender
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *`,
      [
        first_name, last_name, full_name, email, phone,
        address_line1, address_line2, city, state, postal_code, country || 'USA',
        date_of_birth, age, wedding_anniversary_date, years_married,
        generation, photo_url, is_deceased || false, primary_household_id,
        mother_id || null, father_id || null, gender
      ]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    // Validate: mother_id and father_id are required for non-G1
    // Note: Both can be null if explicitly set to "Not listed here" (handled by frontend validation)
    // Backend allows null values - frontend ensures at least one is selected OR both are "Not listed here"
    const currentPerson = await this.findById(id);
    const generation = data.generation !== undefined ? data.generation : currentPerson?.generation;
    
    if (generation && generation !== 'G1') {
      // Allow null values - frontend validation ensures proper selection
      // This allows cases where parents are not in the directory
    }

    // If photo_url is being updated (including being cleared), get the old photo_url first to delete it
    let oldPhotoUrl = null;
    if (data.photo_url !== undefined) {
      if (currentPerson && currentPerson.photo_url) {
        oldPhotoUrl = currentPerson.photo_url;
      }
      // If photo_url is being set to null or empty string, we still want to delete the old photo
      // Convert empty string to null for consistency
      if (data.photo_url === '') {
        data.photo_url = null;
      }
    }

    const fields = [];
    const values = [];
    let paramCount = 1;

    // Validate: gender is required if being updated
    // Treat empty strings as undefined (don't update gender if it's empty)
    if (data.gender === '') {
      delete data.gender;
    }
    if (data.gender !== undefined && data.gender !== null && data.gender !== 'Male' && data.gender !== 'Female') {
      throw new Error('Gender must be either "Male" or "Female"');
    }

    // Build dynamic update query
    const allowedFields = [
      'first_name', 'last_name', 'full_name', 'email', 'phone',
      'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country',
      'date_of_birth', 'age', 'wedding_anniversary_date', 'years_married',
      'generation', 'photo_url', 'is_deceased', 'primary_household_id', 'is_admin',
      'privacy_settings', 'mother_id', 'father_id'
    ];
    
    // Only include gender if it's actually being updated (and migration has been run)
    // This prevents errors if the gender column doesn't exist yet
    if (data.gender !== undefined && data.gender !== null && data.gender !== '') {
      allowedFields.push('gender');
    }

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (field === 'privacy_settings') {
          // Handle JSONB field
          fields.push(`${field} = $${paramCount}::jsonb`);
          values.push(JSON.stringify(data[field]));
        } else {
          fields.push(`${field} = $${paramCount}`);
          values.push(data[field]);
        }
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

    // Delete old photo file if photo_url was changed
    // This handles: replacing with new photo, clearing photo (null), or changing to different photo
    if (oldPhotoUrl && oldPhotoUrl !== data.photo_url) {
      await deleteImageFile(oldPhotoUrl);
    }

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

  static async delete(personId) {
    // Get the person's photo_url before deleting (so we can delete the image file)
    const person = await this.findById(personId);
    const photoUrl = person?.photo_url || null;

    // Delete relationships first (cascade should handle this, but being explicit)
    await pool.query('DELETE FROM relationships WHERE parent_id = $1 OR child_id = $1', [personId]);
    await pool.query('DELETE FROM marital_relationships WHERE person_a_id = $1 OR person_b_id = $1', [personId]);
    
    // Delete the person
    const result = await pool.query('DELETE FROM persons WHERE id = $1 RETURNING *', [personId]);

    // Delete the associated image file if it exists
    if (photoUrl) {
      await deleteImageFile(photoUrl);
    }

    return result.rows[0];
  }
}

