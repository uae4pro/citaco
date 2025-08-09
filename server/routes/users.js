import express from 'express';
import { User } from '../models/index.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role, limit, offset = 0 } = req.query;
    
    let filters = {};
    if (role) filters.role = role;

    const users = await User.filter(filters, '-created_date');
    
    // Remove password hashes from response
    const safeUsers = users.map(user => {
      const { password_hash, ...safeUser } = user;
      return safeUser;
    });

    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = limit ? startIndex + parseInt(limit) : safeUsers.length;
    const paginatedUsers = safeUsers.slice(startIndex, endIndex);

    res.json({
      users: paginatedUsers,
      total: safeUsers.length,
      offset: startIndex,
      limit: limit ? parseInt(limit) : safeUsers.length
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user (admin only or own profile)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is accessing their own profile or is admin
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await User.get(req.params.id);
    
    // Remove password hash from response
    const { password_hash, ...safeUser } = user;
    
    res.json(safeUser);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'User not found' });
    }
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user role (admin only)
router.put('/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !['customer', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required (customer or admin)' });
    }

    // Prevent admin from changing their own role
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const updatedUser = await User.update(req.params.id, { role });
    
    // Remove password hash from response
    const { password_hash, ...safeUser } = updatedUser;
    
    res.json({
      message: 'User role updated successfully',
      user: safeUser
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'User not found' });
    }
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Activate/deactivate user (admin only)
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be a boolean' });
    }

    // Prevent admin from deactivating themselves
    if (req.params.id === req.user.id && !is_active) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const updatedUser = await User.update(req.params.id, { is_active });
    
    // Remove password hash from response
    const { password_hash, ...safeUser } = updatedUser;
    
    res.json({
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
      user: safeUser
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'User not found' });
    }
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await User.delete(req.params.id);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'User not found' });
    }
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user statistics (admin only)
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ is_active: true });
    const adminUsers = await User.count({ role: 'admin' });
    const customerUsers = await User.count({ role: 'customer' });

    res.json({
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      admins: adminUsers,
      customers: customerUsers
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

export default router;
