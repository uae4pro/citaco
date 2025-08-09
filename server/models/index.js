import BaseModel from './BaseModel.js';
import { query } from '../config/database.js';
import bcrypt from 'bcrypt';

// Spare Parts Model
class SparePartModel extends BaseModel {
  constructor() {
    super('spare_parts');
  }

  // Get parts with low stock
  async getLowStock(threshold = 10) {
    const queryText = `
      SELECT * FROM ${this.tableName} 
      WHERE stock_quantity < $1 AND is_active = true
      ORDER BY stock_quantity ASC
    `;
    const result = await query(queryText, [threshold]);
    return result.rows;
  }

  // Search parts by name or description
  async search(searchTerm) {
    const queryText = `
      SELECT * FROM ${this.tableName}
      WHERE (name ILIKE $1 OR description ILIKE $1 OR part_number ILIKE $1)
      AND is_active = true
      ORDER BY name ASC
    `;
    const result = await query(queryText, [`%${searchTerm}%`]);
    return result.rows;
  }

  // Get parts by category
  async getByCategory(category) {
    return this.filter({ category, is_active: true }, 'name');
  }

  // Update stock quantity
  async updateStock(id, quantity) {
    const queryText = `
      UPDATE ${this.tableName}
      SET stock_quantity = stock_quantity + $2, updated_date = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await query(queryText, [id, quantity]);
    return result.rows[0];
  }
}

// Cart Items Model
class CartItemModel extends BaseModel {
  constructor() {
    super('cart_items');
  }

  // Get cart items with part details
  async getCartWithDetails(userId) {
    const queryText = `
      SELECT 
        ci.*,
        sp.name,
        sp.price,
        sp.image_urls,
        sp.stock_quantity,
        sp.part_number
      FROM ${this.tableName} ci
      JOIN spare_parts sp ON ci.spare_part_id = sp.id
      WHERE ci.user_id = $1
      ORDER BY ci.added_date DESC
    `;
    const result = await query(queryText, [userId]);
    return result.rows;
  }

  // Clear user's cart
  async clearCart(userId) {
    const queryText = `DELETE FROM ${this.tableName} WHERE user_id = $1`;
    await query(queryText, [userId]);
  }
}

// Orders Model
class OrderModel extends BaseModel {
  constructor() {
    super('orders');
  }

  // Get orders with items
  async getOrderWithItems(orderId) {
    const orderQuery = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const itemsQuery = `
      SELECT 
        oi.*,
        sp.name as current_name,
        sp.image_urls
      FROM order_items oi
      LEFT JOIN spare_parts sp ON oi.spare_part_id = sp.id
      WHERE oi.order_id = $1
    `;
    
    const [orderResult, itemsResult] = await Promise.all([
      query(orderQuery, [orderId]),
      query(itemsQuery, [orderId])
    ]);

    if (orderResult.rows.length === 0) {
      throw new Error(`Order with id ${orderId} not found`);
    }

    return {
      ...orderResult.rows[0],
      items: itemsResult.rows
    };
  }

  // Get user's orders
  async getUserOrders(userId) {
    const queryText = `
      SELECT 
        o.*,
        COUNT(oi.id) as item_count,
        SUM(oi.quantity) as total_quantity
      FROM ${this.tableName} o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_date DESC
    `;
    const result = await query(queryText, [userId]);
    return result.rows;
  }

  // Generate order number
  async generateOrderNumber() {
    const year = new Date().getFullYear();
    const queryText = `
      SELECT COUNT(*) as count 
      FROM ${this.tableName} 
      WHERE order_number LIKE $1
    `;
    const result = await query(queryText, [`ORD-${year}-%`]);
    const count = parseInt(result.rows[0].count) + 1;
    return `ORD-${year}-${count.toString().padStart(3, '0')}`;
  }
}

// Order Items Model
class OrderItemModel extends BaseModel {
  constructor() {
    super('order_items');
  }
}

// Users Model
class UserModel extends BaseModel {
  constructor() {
    super('users');
  }

  // Create user with hashed password
  async createUser(userData) {
    const { password, ...otherData } = userData;
    const password_hash = await bcrypt.hash(password, 10);
    
    return this.create({
      ...otherData,
      password_hash
    });
  }

  // Verify user password
  async verifyPassword(email, password) {
    const queryText = `SELECT * FROM ${this.tableName} WHERE email = $1`;
    const result = await query(queryText, [email]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (isValid) {
      // Remove password hash from returned user
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    
    return null;
  }

  // Get user by email
  async getByEmail(email) {
    const result = await this.filter({ email });
    return result.length > 0 ? result[0] : null;
  }

  // Get user by Clerk ID
  async getByClerkId(clerkUserId) {
    const result = await this.filter({ clerk_user_id: clerkUserId });
    return result.length > 0 ? result[0] : null;
  }

  // Update last login
  async updateLastLogin(id) {
    const queryText = `
      UPDATE ${this.tableName}
      SET last_login = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await query(queryText, [id]);
    return result.rows[0];
  }
}

// App Settings Model
class AppSettingsModel extends BaseModel {
  constructor() {
    super('app_settings');
  }

  // Get current settings (should only be one record)
  async getCurrent() {
    const result = await this.list();
    return result.length > 0 ? result[0] : null;
  }
}

// Export model instances
export const SparePart = new SparePartModel();
export const CartItem = new CartItemModel();
export const Order = new OrderModel();
export const OrderItem = new OrderItemModel();
export const User = new UserModel();
export const AppSettings = new AppSettingsModel();
