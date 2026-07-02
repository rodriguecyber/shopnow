import dotenv from 'dotenv';
import app from './app';
import { initializeRedis } from './db/redis';
import runMigrations from './db/migrations';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await initializeRedis();
    await runMigrations();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📦 Database: ${process.env.DB_NAME || 'shopnow'}`);
      console.log(`👤 User: ${process.env.DB_USER || 'shopnow_user'}`);
      console.log(`🔴 Redis: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
