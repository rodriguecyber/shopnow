import { Request, Response } from 'express';
import pool from '../db/connection';
import { v4 as uuidv4 } from 'uuid';

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { email, name, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get or create user
      let userResult = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      let userId: string;

      if (userResult.rows.length === 0) {
        userResult = await client.query(
          'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING id',
          [email, name]
        );
        userId = userResult.rows[0].id;
      } else {
        userId = userResult.rows[0].id;
      }

      // Calculate total price
      const totalPrice = items.reduce(
        (sum: number, item: CartItem) => sum + item.price * item.quantity,
        0
      );

      // Create order
      const orderResult = await client.query(
        'INSERT INTO orders (user_id, total_price, status) VALUES ($1, $2, $3) RETURNING id',
        [userId, totalPrice, 'pending']
      );
      const orderId = orderResult.rows[0].id;

      // Create order items
      for (const item of items) {
        await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
          [orderId, item.productId, item.quantity, item.price]
        );

        // Update stock
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
          [item.quantity, item.productId]
        );
      }

      await client.query('COMMIT');

      const fullOrder = await pool.query(
        'SELECT * FROM orders WHERE id = $1',
        [orderId]
      );

      res.status(201).json(fullOrder.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT o.*, u.email, u.name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const orderResult = await pool.query(
      'SELECT o.*, u.email, u.name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = $1',
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const itemsResult = await pool.query(
      'SELECT oi.*, p.name, p.image FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1',
      [id]
    );

    res.json({
      ...orderResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
};