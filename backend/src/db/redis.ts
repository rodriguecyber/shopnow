import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('✅ Redis connected'));
redisClient.on('ready', () => console.log('✅ Redis ready'));
redisClient.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));

export const initializeRedis = async () => {
  try {
    await redisClient.connect();
    console.log('🔴 Redis initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error);
  }
};

export default redisClient;