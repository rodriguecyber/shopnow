# ShopNow Complete Setup Guide

## Overview

ShopNow is a full-stack e-commerce application with:
- **Frontend**: Next.js 16 with React 19 and Tailwind CSS
- **Backend**: Node.js/Express with TypeScript
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Containerization**: Docker & Docker Compose

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│              http://localhost:3000                       │
└────────────────────────┬────────────────────────────────┘
                         │
                    API Requests
                         │
┌────────────────────────▼────────────────────────────────┐
│              Backend API (Express)                       │
│              http://localhost:5000/api                  │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼─────┐   ┌────▼─────┐   ┌────▼─────┐
    │PostgreSQL│   │  Redis   │   │ Logging  │
    │:5432     │   │ :6379    │   │          │
    └──────────┘   └──────────┘   └──────────┘
```

## Prerequisites

- Docker and Docker Compose
- Or locally:
  - Node.js 20+
  - PostgreSQL 16
  - Redis 7
  - npm

## Quick Start with Docker

### 1. Start All Services

```bash
docker-compose up
```

This will start:
- PostgreSQL database
- Redis cache
- Backend API server
- Frontend development server

### 2. Initialize Database

```bash
docker-compose exec backend npm run migrate
```

This creates tables and seeds sample products.

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Database**: localhost:5432 (shopnow_user / shopnow_password)
- **Redis**: localhost:6379

## Local Development Setup

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3000`

### Database Setup (Local)

You'll need PostgreSQL running locally:

```bash
# On macOS with Homebrew
brew install postgresql@16
brew services start postgresql@16

# On Ubuntu
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database and user
psql -U postgres -c "CREATE DATABASE shopnow;"
psql -U postgres -c "CREATE USER shopnow_user WITH PASSWORD 'shopnow_password';"
psql -U postgres -c "ALTER ROLE shopnow_user WITH CREATEDB;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE shopnow TO shopnow_user;"
```

### Redis Setup (Local)

```bash
# On macOS with Homebrew
brew install redis
brew services start redis

# On Ubuntu
sudo apt-get install redis-server
sudo systemctl start redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

## User Workflows

### 1. Browsing Products

1. Go to http://localhost:3000
2. See featured products loaded from PostgreSQL
3. Click "Products" to view full catalog
4. Filter by category
5. Each product shows real-time data from database

### 2. Shopping Cart

1. Click "Add to Cart" on any product
2. Cart items stored locally in browser
3. Adjust quantities or remove items
4. Cart count updates in header

### 3. Checkout & Order Creation

1. Click cart icon or go to /cart
2. Enter email and name
3. Click "Proceed to Checkout"
4. Order is created in PostgreSQL database
5. Redirected to order confirmation page
6. Order details fetched from database

### 4. Order Confirmation

- View order ID
- See delivery information
- View all items in order
- See order status and total

## API Endpoints

### Products

```
GET    /api/products              # Get all products (cached)
GET    /api/products/:id          # Get product by ID (cached)
POST   /api/products              # Create product
PUT    /api/products/:id          # Update product
DELETE /api/products/:id          # Delete product
```

### Orders

```
POST   /api/orders                # Create new order
GET    /api/orders                # Get all orders
GET    /api/orders/:id            # Get order with items
PUT    /api/orders/:id/status     # Update order status
```

### Health Checks

```
GET    /health                    # Server health
GET    /api/health/db             # Database health
```

## Caching Strategy

Products are cached in Redis for 1 hour to improve performance:

- `products` - All products list
- `product:{id}` - Individual product

Cache is automatically invalidated when products are created, updated, or deleted.

## Database Schema

### Products Table

```
id              UUID PRIMARY KEY
name            VARCHAR(255)
description     TEXT
price           DECIMAL(10,2)
image           VARCHAR(500)
category        VARCHAR(100)
stock_quantity  INT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Users Table

```
id              UUID PRIMARY KEY
email           VARCHAR(255) UNIQUE
name            VARCHAR(255)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Orders Table

```
id              UUID PRIMARY KEY
user_id         UUID FOREIGN KEY
total_price     DECIMAL(10,2)
status          VARCHAR(50)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Order Items Table

```
id              UUID PRIMARY KEY
order_id        UUID FOREIGN KEY
product_id      UUID FOREIGN KEY
quantity        INT
price           DECIMAL(10,2)
created_at      TIMESTAMP
```

## Deployment

### Docker Production Build

```bash
docker-compose -f docker-compose.yml up -d
```

### Environment Variables for Production

**Backend** (.env):
```env
NODE_ENV=production
PORT=5000
DB_HOST=db
DB_PORT=5432
DB_NAME=shopnow
DB_USER=shopnow_user
DB_PASSWORD=shopnow_password
REDIS_HOST=redis
REDIS_PORT=6379
```

**Frontend** (.env.local):
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

## Troubleshooting

### Docker Issues

```bash
# View logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Restart services
docker-compose restart

# Clean rebuild
docker-compose down
docker-compose up --build
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps

# Check Redis is running
docker exec shopnow_redis redis-cli ping

# Verify database exists
docker-compose exec db psql -U shopnow_user -d shopnow -c "SELECT COUNT(*) FROM products;"
```

### Products Not Showing

1. Check backend logs: `docker-compose logs backend`
2. Verify migrations ran: `docker-compose logs backend | grep migrate`
3. Check database: `docker-compose exec db psql -U shopnow_user -d shopnow -c "SELECT * FROM products;"`

### API Not Responding

1. Check backend is running: `curl http://localhost:5000/health`
2. Check frontend .env.local has correct API URL
3. Check CORS errors in browser console
4. Verify backend port 5000 is available

## Development Tips

### Adding New Products

```bash
# SSH into backend
docker-compose exec backend npm run migrate

# Or add directly via API
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Product",
    "price": 99.99,
    "description": "Description",
    "image": "https://...",
    "category": "Electronics",
    "stock_quantity": 50
  }'
```

### Clearing Cache

```bash
docker-compose exec redis redis-cli FLUSHALL
```

### Running Tests

Backend:
```bash
cd backend
npm test
```

Frontend:
```bash
cd frontend
npm test
```

## Performance Optimization

1. **Caching**: Redis caches product data
2. **Image Optimization**: Next.js optimizes all images
3. **Database Indexing**: Indexes on frequently queried columns
4. **Connection Pooling**: PostgreSQL connection pooling enabled
5. **Lazy Loading**: Products load on-demand

## Security Considerations

- [ ] Add authentication (JWT tokens)
- [ ] Validate all user inputs
- [ ] Implement rate limiting
- [ ] Add SSL/TLS for production
- [ ] Sanitize database queries
- [ ] Use environment variables for secrets
- [ ] Add CSRF protection
- [ ] Implement order authorization checks

## Next Steps

1. Implement user authentication
2. Add payment gateway integration
3. Create admin dashboard
4. Add product reviews and ratings
5. Implement email notifications
6. Add inventory management
7. Setup CI/CD pipeline
8. Add unit and integration tests

## Support

For issues, check:
1. Docker logs: `docker-compose logs`
2. Browser console for frontend errors
3. Backend logs for API errors
4. Database connection status