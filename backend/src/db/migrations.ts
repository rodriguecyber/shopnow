import pool from './connection';

const createTables = async () => {
  try {
    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image VARCHAR(500),
        category VARCHAR(100),
        stock_quantity INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create order_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL,
        product_id UUID NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);

    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
};

const seedProducts = async () => {
  try {
    const products = [
      {
        name: 'Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation and premium sound.',
        price: 99.99,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        category: 'Electronics',
        stock_quantity: 50,
      },
      {
        name: 'Smart Watch',
        description: 'Feature-packed smartwatch with health tracking and notifications.',
        price: 249.99,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
        category: 'Electronics',
        stock_quantity: 30,
      },
      {
        name: 'Running Shoes',
        description: 'Comfortable and durable running shoes for all terrains.',
        price: 129.99,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
        category: 'Sports',
        stock_quantity: 40,
      },
      {
        name: 'Coffee Maker',
        description: 'Automatic coffee maker with programmable settings.',
        price: 79.99,
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
        category: 'Home',
        stock_quantity: 25,
      },
      {
        name: 'Backpack',
        description: 'Stylish and functional backpack for daily use.',
        price: 59.99,
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
        category: 'Accessories',
        stock_quantity: 60,
      },
      {
        name: 'Desk Lamp',
        description: 'Adjustable LED desk lamp with multiple brightness levels.',
        price: 39.99,
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        category: 'Home',
        stock_quantity: 45,
      },
    ];

    // Check if products already exist
    const result = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(result.rows[0].count) === 0) {
      for (const product of products) {
        await pool.query(
          'INSERT INTO products (name, description, price, image, category, stock_quantity) VALUES ($1, $2, $3, $4, $5, $6)',
          [product.name, product.description, product.price, product.image, product.category, product.stock_quantity]
        );
      }
      console.log('✅ Products seeded successfully');
    } else {
      console.log('ℹ️ Products already exist, skipping seed');
    }
  } catch (error) {
    console.error('❌ Error seeding products:', error);
  }
};

const runMigrations = async () => {
  console.log('🚀 Running database migrations...');
  await createTables();
  await seedProducts();
  console.log('✅ Migrations completed');
  // process.exit(0);
};

export default runMigrations