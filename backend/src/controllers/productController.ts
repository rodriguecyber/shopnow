import { Request, Response } from 'express';
import pool from '../db/connection';
import { getFromCache, setInCache, deleteFromCache, CACHE_KEYS } from '../utils/cache';

export const getProducts = async (req: Request, res: Response) => {
  try {
    // Try to get from cache first
    const cachedProducts = await getFromCache(CACHE_KEYS.PRODUCTS);
    if (cachedProducts) {
      return res.json(cachedProducts);
    }

    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    
    // Cache the result for 1 hour
    await setInCache(CACHE_KEYS.PRODUCTS, result.rows, { ttl: 3600 });
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Try to get from cache first
    const cachedProduct = await getFromCache(CACHE_KEYS.PRODUCT(id));
    if (cachedProduct) {
      return res.json(cachedProduct);
    }

    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Cache the result
    await setInCache(CACHE_KEYS.PRODUCT(id), result.rows[0], { ttl: 3600 });
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, image, category, stock_quantity } = req.body;
    
    const result = await pool.query(
      'INSERT INTO products (name, description, price, image, category, stock_quantity) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, description, price, image, category, stock_quantity || 0]
    );
    
    // Invalidate products cache
    await deleteFromCache(CACHE_KEYS.PRODUCTS);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, image, category, stock_quantity } = req.body;
    
    const result = await pool.query(
      'UPDATE products SET name = $1, description = $2, price = $3, image = $4, category = $5, stock_quantity = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [name, description, price, image, category, stock_quantity, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Invalidate caches
    await deleteFromCache(CACHE_KEYS.PRODUCTS);
    await deleteFromCache(CACHE_KEYS.PRODUCT(id));
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Invalidate caches
    await deleteFromCache(CACHE_KEYS.PRODUCTS);
    await deleteFromCache(CACHE_KEYS.PRODUCT(id));
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};
  
