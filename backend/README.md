# ShopNow Backend API

A Node.js/Express backend API for the ShopNow e-commerce platform with PostgreSQL database and Redis caching.

## Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 16
- Redis 7+
- npm

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
NODE_ENV=development
PORT=5000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shopnow
DB_USER=shopnow_user
DB_PASSWORD=shopnow_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Database Setup

Run migrations to create tables and seed sample data:

```bash
npm run migrate
```

## Running the Server

### Development

```bash
npm run dev
```

Server will be available at `http://localhost:5000`

### Production

```bash
npm run build
npm start
```

## API Endpoints

### Products

- **GET** `/api/products` - Get all products
- **GET** `/api/products/:id` - Get product by ID
- **POST** `/api/products` - Create new product
- **PUT** `/api/products/:id` - Update product
- **DELETE** `/api/products/:id` - Delete product

### Orders

- **POST** `/api/orders` - Create new order
  ```json
  {
    "email": "customer@example.com",
    "name": "Customer Name",
    "items": [
      {
        "productId": "uuid",
        "quantity": 2,
        "price": 99.99
      }
    ]
  }
  ```

- **GET** `/api/orders` - Get all orders
- **GET** `/api/orders/:id` - Get order by ID with items
- **PUT** `/api/orders/:id/status` - Update order status
  ```json
  {
    "status": "completed"
  }
  ```

### Health Checks

- **GET** `/health` - Server health check
- **GET** `/api/health/db` - Database connection check

## Caching Strategy

The API uses Redis for caching frequently accessed data to improve performance:

### Cached Endpoints

- **GET** `/api/products` - Cached for 1 hour
- **GET** `/api/products/:id` - Cached for 1 hour

### Cache Invalidation

Cache is automatically invalidated when:
- Creating a new product (clears products list cache)
- Updating a product (clears products list and individual product cache)
- Deleting a product (clears products list and individual product cache)

### Cache Keys

- `products` - All products list
- `product:{id}` - Individual product by ID

## Database Schema

### Products
- `id` (UUID)
- `name` (VARCHAR)
- `description` (TEXT)
- `price` (DECIMAL)
- `image` (VARCHAR)
- `category` (VARCHAR)
- `stock_quantity` (INT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Users
- `id` (UUID)
- `email` (VARCHAR, UNIQUE)
- `name` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Orders
- `id` (UUID)
- `user_id` (FK → Users)
- `total_price` (DECIMAL)
- `status` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Order Items
- `id` (UUID)
- `order_id` (FK → Orders)
- `product_id` (FK → Products)
- `quantity` (INT)
- `price` (DECIMAL)
- `created_at` (TIMESTAMP)

## Docker

Build and run with Docker:

```bash
docker-compose up
```

Services:
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`
- **PostgreSQL**: `localhost:5432` (shopnow_user / shopnow_password)
- **Redis**: `localhost:6379`

The docker-compose.yml includes:
- PostgreSQL with persistent storage
- Redis with persistent storage
- Backend API with dependencies on database and cache
- Frontend with API configuration