import { query } from '../config/database.js';

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
  }

  // Get all records with optional sorting and limiting
  async list(sortBy = null, limit = null) {
    let queryText = `SELECT * FROM ${this.tableName}`;
    const params = [];
    
    if (sortBy) {
      const isDescending = sortBy.startsWith('-');
      const field = isDescending ? sortBy.substring(1) : sortBy;
      queryText += ` ORDER BY ${field} ${isDescending ? 'DESC' : 'ASC'}`;
    }
    
    if (limit) {
      queryText += ` LIMIT $${params.length + 1}`;
      params.push(limit);
    }
    
    const result = await query(queryText, params);
    return result.rows;
  }

  // Get a single record by ID
  async get(id) {
    const queryText = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await query(queryText, [id]);
    
    if (result.rows.length === 0) {
      throw new Error(`${this.tableName} with id ${id} not found`);
    }
    
    return result.rows[0];
  }

  // Filter records with conditions
  async filter(filters = {}, sortBy = null) {
    let queryText = `SELECT * FROM ${this.tableName}`;
    const params = [];
    const conditions = [];

    // Build WHERE conditions
    Object.keys(filters).forEach((key, index) => {
      const value = filters[key];
      if (value !== undefined && value !== null) {
        if (typeof value === 'string' && key.includes('email')) {
          // Exact match for email fields
          conditions.push(`${key} = $${index + 1}`);
          params.push(value);
        } else if (typeof value === 'string') {
          // Partial match for string fields
          conditions.push(`${key} ILIKE $${index + 1}`);
          params.push(`%${value}%`);
        } else {
          // Exact match for other types
          conditions.push(`${key} = $${index + 1}`);
          params.push(value);
        }
      }
    });

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Add sorting
    if (sortBy) {
      const isDescending = sortBy.startsWith('-');
      const field = isDescending ? sortBy.substring(1) : sortBy;
      queryText += ` ORDER BY ${field} ${isDescending ? 'DESC' : 'ASC'}`;
    }

    const result = await query(queryText, params);
    return result.rows;
  }

  // Create a new record
  async create(itemData) {
    const fields = Object.keys(itemData);
    const values = Object.values(itemData);
    const placeholders = values.map((_, index) => `$${index + 1}`);

    const queryText = `
      INSERT INTO ${this.tableName} (${fields.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    const result = await query(queryText, values);
    return result.rows[0];
  }

  // Update a record by ID
  async update(id, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`);

    const queryText = `
      UPDATE ${this.tableName}
      SET ${setClause.join(', ')}, updated_date = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await query(queryText, [id, ...values]);
    
    if (result.rows.length === 0) {
      throw new Error(`${this.tableName} with id ${id} not found`);
    }
    
    return result.rows[0];
  }

  // Delete a record by ID
  async delete(id) {
    const queryText = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
    const result = await query(queryText, [id]);
    
    if (result.rows.length === 0) {
      throw new Error(`${this.tableName} with id ${id} not found`);
    }
    
    return result.rows[0];
  }

  // Count records with optional filters
  async count(filters = {}) {
    let queryText = `SELECT COUNT(*) FROM ${this.tableName}`;
    const params = [];
    const conditions = [];

    Object.keys(filters).forEach((key, index) => {
      const value = filters[key];
      if (value !== undefined && value !== null) {
        conditions.push(`${key} = $${index + 1}`);
        params.push(value);
      }
    });

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = await query(queryText, params);
    return parseInt(result.rows[0].count);
  }

  // Check if record exists
  async exists(id) {
    const queryText = `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE id = $1)`;
    const result = await query(queryText, [id]);
    return result.rows[0].exists;
  }
}

export default BaseModel;
