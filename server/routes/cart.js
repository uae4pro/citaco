import express from 'express';
import { CartItem, SparePart } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, cartItemSchemas } from '../middleware/validation.js';

const router = express.Router();

// Get user's cart
router.get('/', authenticateToken, async (req, res) => {
  try {
    const cartItems = await CartItem.getCartWithDetails(req.user.id);
    
    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      items: cartItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      totalItems,
      itemCount: cartItems.length
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// Add item to cart
router.post('/add', authenticateToken, validate(cartItemSchemas.add), async (req, res) => {
  try {
    const { spare_part_id, quantity } = req.body;

    // Check if part exists and is active
    const part = await SparePart.get(spare_part_id);
    if (!part.is_active) {
      return res.status(400).json({ error: 'Part is not available' });
    }

    // Check stock availability
    if (part.stock_quantity < quantity) {
      return res.status(400).json({ 
        error: 'Insufficient stock', 
        available: part.stock_quantity 
      });
    }

    // Check if item already exists in cart
    const existingItems = await CartItem.filter({ 
      user_id: req.user.id, 
      spare_part_id 
    });

    let cartItem;
    if (existingItems.length > 0) {
      // Update existing item
      const existingItem = existingItems[0];
      const newQuantity = existingItem.quantity + quantity;
      
      // Check total quantity against stock
      if (part.stock_quantity < newQuantity) {
        return res.status(400).json({ 
          error: 'Insufficient stock for total quantity', 
          available: part.stock_quantity,
          currentInCart: existingItem.quantity
        });
      }

      cartItem = await CartItem.update(existingItem.id, { quantity: newQuantity });
    } else {
      // Create new cart item
      cartItem = await CartItem.create({
        user_id: req.user.id,
        user_email: req.user.email,
        spare_part_id,
        quantity
      });
    }

    res.status(201).json({
      message: 'Item added to cart successfully',
      cartItem
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Part not found' });
    }
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// Update cart item quantity
router.put('/:id', authenticateToken, validate(cartItemSchemas.update), async (req, res) => {
  try {
    const { quantity } = req.body;

    // Get cart item and verify ownership
    const cartItem = await CartItem.get(req.params.id);
    if (cartItem.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check part stock
    const part = await SparePart.get(cartItem.spare_part_id);
    if (part.stock_quantity < quantity) {
      return res.status(400).json({ 
        error: 'Insufficient stock', 
        available: part.stock_quantity 
      });
    }

    const updatedItem = await CartItem.update(req.params.id, { quantity });
    
    res.json({
      message: 'Cart item updated successfully',
      cartItem: updatedItem
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    console.error('Update cart item error:', error);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

// Remove item from cart
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Get cart item and verify ownership
    const cartItem = await CartItem.get(req.params.id);
    if (cartItem.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await CartItem.delete(req.params.id);
    
    res.json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    console.error('Remove cart item error:', error);
    res.status(500).json({ error: 'Failed to remove cart item' });
  }
});

// Clear entire cart
router.delete('/', authenticateToken, async (req, res) => {
  try {
    await CartItem.clearCart(req.user.id);
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

// Get cart item count
router.get('/count', authenticateToken, async (req, res) => {
  try {
    const cartItems = await CartItem.filter({ user_id: req.user.id });
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    res.json({ 
      itemCount: cartItems.length,
      totalItems 
    });
  } catch (error) {
    console.error('Get cart count error:', error);
    res.status(500).json({ error: 'Failed to get cart count' });
  }
});

export default router;
