import redisClient from '../db/redis';

const DEFAULT_CACHE_TTL = 3600; // 1 hour in seconds

interface CacheOptions {
  ttl?: number;
}

/**
 * Get value from cache
 */
export const getFromCache = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

/**
 * Set value in cache
 */
export const setInCache = async (
  key: string,
  value: any,
  options?: CacheOptions
): Promise<void> => {
  try {
    const ttl = options?.ttl || DEFAULT_CACHE_TTL;
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Cache set error:', error);
  }
};

/**
 * Delete value from cache
 */
export const deleteFromCache = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
};

/**
 * Clear cache by pattern
 */
export const clearCacheByPattern = async (pattern: string): Promise<void> => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Cache clear error:', error);
  }
};

/**
 * Cache keys
 */
export const CACHE_KEYS = {
  PRODUCTS: 'products',
  PRODUCT: (id: string) => `product:${id}`,
  ORDERS: 'orders',
  ORDER: (id: string) => `order:${id}`,
};