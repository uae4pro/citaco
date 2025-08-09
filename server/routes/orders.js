import express from 'express';
import { Order, OrderItem, CartItem, SparePart, AppSettings } from '../models/index.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validate, orderSchemas } from '../middleware/validation.js';

const router = express.Router();

// Get user's orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.getUserOrders(req.user.id);
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get all orders (admin only)
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, limit, offset = 0 } = req.query;
    
    let filters = {};
    if (status) filters.status = status;

    const orders = await Order.filter(filters, '-created_date');
    
    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = limit ? startIndex + parseInt(limit) : orders.length;
    const paginatedOrders = orders.slice(startIndex, endIndex);

    res.json({
      orders: paginatedOrders,
      total: orders.length,
      offset: startIndex,
      limit: limit ? parseInt(limit) : orders.length
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.getOrderWithItems(req.params.id);
    
    // Check if user owns this order or is admin
    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Order not found' });
    }
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create order from cart
router.post('/create', authenticateToken, validate(orderSchemas.create), async (req, res) => {
  try {
    const { shipping_address, billing_address, payment_method, notes } = req.body;

    // Get user's cart
    const cartItems = await CartItem.getCartWithDetails(req.user.id);
    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Verify stock availability for all items
    for (const item of cartItems) {
      const part = await SparePart.get(item.spare_part_id);
      if (part.stock_quantity < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${part.name}`, 
          available: part.stock_quantity,
          requested: item.quantity
        });
      }
    }

    // Get app settings for tax and shipping calculation
    const settings = await AppSettings.getCurrent();
    const taxRate = settings?.tax_rate || 0.08;
    const shippingCost = settings?.shipping_cost || 9.99;
    const freeShippingThreshold = settings?.free_shipping_threshold || 100.00;

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = subtotal * taxRate;
    const finalShippingCost = subtotal >= freeShippingThreshold ? 0 : shippingCost;
    const totalAmount = subtotal + taxAmount + finalShippingCost;

    // Generate order number
    const orderNumber = await Order.generateOrderNumber();

    // Create order
    const order = await Order.create({
      user_id: req.user.id,
      user_email: req.user.email,
      order_number: orderNumber,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax_amount: parseFloat(taxAmount.toFixed(2)),
      shipping_cost: parseFloat(finalShippingCost.toFixed(2)),
      total_amount: parseFloat(totalAmount.toFixed(2)),
      status: 'pending',
      payment_status: 'pending',
      payment_method,
      shipping_address,
      billing_address: billing_address || shipping_address,
      notes
    });

    // Create order items and update stock
    for (const item of cartItems) {
      await OrderItem.create({
        order_id: order.id,
        spare_part_id: item.spare_part_id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: parseFloat((item.price * item.quantity).toFixed(2)),
        part_name: item.name,
        part_number: item.part_number
      });

      // Reduce stock quantity
      await SparePart.updateStock(item.spare_part_id, -item.quantity);
    }

    // Clear user's cart
    await CartItem.clearCart(req.user.id);

    // Get complete order with items
    const completeOrder = await Order.getOrderWithItems(order.id);

    res.status(201).json({
      message: 'Order created successfully',
      order: completeOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order status (admin only)
router.put('/:id/status', authenticateToken, requireAdmin, validate(orderSchemas.updateStatus), async (req, res) => {
  try {
    const { status, tracking_number, notes } = req.body;

    const updateData = { status };
    if (tracking_number) updateData.tracking_number = tracking_number;
    if (notes) updateData.notes = notes;

    const updatedOrder = await Order.update(req.params.id, updateData);

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Order not found' });
    }
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Cancel order
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const order = await Order.get(req.params.id);
    
    // Check if user owns this order or is admin
    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if order can be cancelled
    if (['shipped', 'delivered', 'cancelled', 'refunded'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be cancelled' });
    }

    // Get order items to restore stock
    const orderWithItems = await Order.getOrderWithItems(req.params.id);
    
    // Restore stock for each item
    for (const item of orderWithItems.items) {
      await SparePart.updateStock(item.spare_part_id, item.quantity);
    }

    // Update order status
    const updatedOrder = await Order.update(req.params.id, { 
      status: 'cancelled',
      notes: (order.notes || '') + '\nOrder cancelled by ' + (req.user.role === 'admin' ? 'admin' : 'customer')
    });

    res.json({
      message: 'Order cancelled successfully',
      order: updatedOrder
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Order not found' });
    }
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

export default router;
