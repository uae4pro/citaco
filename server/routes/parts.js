import express from 'express';
import { SparePart } from '../models/index.js';
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth.js';
import { validate, sparePartSchemas } from '../middleware/validation.js';

const router = express.Router();

// Get all parts (public endpoint with optional auth for personalization)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      category, 
      brand, 
      search, 
      min_price, 
      max_price, 
      in_stock_only = 'true',
      sort = 'name',
      limit,
      offset = 0
    } = req.query;

    let filters = {};
    
    // Apply filters
    if (category) filters.category = category;
    if (brand) filters.brand = brand;
    if (in_stock_only === 'true') {
      filters.is_active = true;
    }

    let parts;
    
    if (search) {
      // Use search method for text search
      parts = await SparePart.search(search);
    } else {
      // Use filter method for other filters
      parts = await SparePart.filter(filters, sort);
    }

    // Apply price range filter (post-query for simplicity)
    if (min_price || max_price) {
      parts = parts.filter(part => {
        if (min_price && part.price < parseFloat(min_price)) return false;
        if (max_price && part.price > parseFloat(max_price)) return false;
        return true;
      });
    }

    // Apply stock filter (post-query)
    if (in_stock_only === 'true') {
      parts = parts.filter(part => part.stock_quantity > 0);
    }

    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = limit ? startIndex + parseInt(limit) : parts.length;
    const paginatedParts = parts.slice(startIndex, endIndex);

    res.json({
      parts: paginatedParts,
      total: parts.length,
      offset: startIndex,
      limit: limit ? parseInt(limit) : parts.length
    });
  } catch (error) {
    console.error('Get parts error:', error);
    res.status(500).json({ error: 'Failed to fetch parts' });
  }
});

// Get single part by ID
router.get('/:id', async (req, res) => {
  try {
    const part = await SparePart.get(req.params.id);
    res.json(part);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Part not found' });
    }
    console.error('Get part error:', error);
    res.status(500).json({ error: 'Failed to fetch part' });
  }
});

// Get parts by category
router.get('/category/:category', async (req, res) => {
  try {
    const parts = await SparePart.getByCategory(req.params.category);
    res.json(parts);
  } catch (error) {
    console.error('Get parts by category error:', error);
    res.status(500).json({ error: 'Failed to fetch parts by category' });
  }
});

// Search parts
router.get('/search/:term', async (req, res) => {
  try {
    const parts = await SparePart.search(req.params.term);
    res.json(parts);
  } catch (error) {
    console.error('Search parts error:', error);
    res.status(500).json({ error: 'Failed to search parts' });
  }
});

// Get low stock parts (admin only)
router.get('/admin/low-stock', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const threshold = req.query.threshold || 10;
    const parts = await SparePart.getLowStock(parseInt(threshold));
    res.json(parts);
  } catch (error) {
    console.error('Get low stock parts error:', error);
    res.status(500).json({ error: 'Failed to fetch low stock parts' });
  }
});

// Create new part (admin only)
router.post('/', authenticateToken, requireAdmin, validate(sparePartSchemas.create), async (req, res) => {
  try {
    const newPart = await SparePart.create(req.body);
    res.status(201).json({
      message: 'Part created successfully',
      part: newPart
    });
  } catch (error) {
    if (error.message.includes('duplicate key')) {
      return res.status(400).json({ error: 'Part number already exists' });
    }
    console.error('Create part error:', error);
    res.status(500).json({ error: 'Failed to create part' });
  }
});

// Update part (admin only)
router.put('/:id', authenticateToken, requireAdmin, validate(sparePartSchemas.update), async (req, res) => {
  try {
    const updatedPart = await SparePart.update(req.params.id, req.body);
    res.json({
      message: 'Part updated successfully',
      part: updatedPart
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Part not found' });
    }
    if (error.message.includes('duplicate key')) {
      return res.status(400).json({ error: 'Part number already exists' });
    }
    console.error('Update part error:', error);
    res.status(500).json({ error: 'Failed to update part' });
  }
});

// Update stock quantity (admin only)
router.patch('/:id/stock', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { quantity } = req.body;
    
    if (typeof quantity !== 'number') {
      return res.status(400).json({ error: 'Quantity must be a number' });
    }

    const updatedPart = await SparePart.updateStock(req.params.id, quantity);
    res.json({
      message: 'Stock updated successfully',
      part: updatedPart
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Part not found' });
    }
    console.error('Update stock error:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// Delete part (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await SparePart.delete(req.params.id);
    res.json({ message: 'Part deleted successfully' });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Part not found' });
    }
    console.error('Delete part error:', error);
    res.status(500).json({ error: 'Failed to delete part' });
  }
});

export default router;
