# ShopNow

A full-stack e-commerce application built with Next.js, Node.js/Express, PostgreSQL, and Redis. Supports three deployment targets: Docker Compose (local), AWS ECS Fargate, and AWS EKS.

---

## Table of Contents

- [Architecture](#architecture)
- [Stack](#stack)
- [Quick Start — Docker](#quick-start--docker)
- [Local Development](#local-development)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Caching](#caching)
- [Frontend Pages](#frontend-pages)
- [AWS Deployment — ECS Fargate](#aws-deployment--ecs-fargate)
- [AWS Deployment — EKS](#aws-deployment--eks)
- [Troubleshooting](#troubleshooting)

---

## Architecture

### Local (Docker Compose)

```
Browser
  └── Frontend (Next.js :3000)
        └── Backend API (Express :5000)
              ├── PostgreSQL (:5432)
              └── Redis      (:6379)
```

### AWS ECS Fargate

```
Browser
  └── ALB (public, internet-facing)
        ├── /      → Frontend ECS Service (port 3000)
        └── /api   → Backend  ECS Service (port 5000)

Frontend ECS Task
  ├── SSR calls  → backend.shopnow.local:5000  (AWS Cloud Map, VPC-internal)
  └── CSR calls  → ALB public DNS /api         (browser fetch)

Backend ECS Task
  ├── RDS PostgreSQL  (private subnet)
  └── ElastiCache Redis (private subnet)
```

### AWS EKS

```
Browser
  └── ALB (AWS Load Balancer Controller, internet-facing)
        ├── /api  → shopnow-backend ClusterIP :80 → pod :5000
        └── /     → frontend-service ClusterIP :80 → pod :3000

All pods run in the shopnow namespace.
Backend pods connect to RDS (PostgreSQL) and ElastiCache (Redis) in private subnets.
```

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS, TypeScript |
| Backend | Node.js 20, Express, TypeScript |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Container registry | Amazon ECR |
| ECS | AWS Fargate, Cloud Map service discovery |
| EKS | Kubernetes 1.30, AWS Load Balancer Controller (Helm 1.7.1) |
| IaC | Terraform ≥ 1.5, AWS provider ~5.0 |

---

## Quick Start — Docker

```bash
docker-compose up
docker-compose exec backend npm run migrate   # first run only — seeds the database
```

| Service | URL / address |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

## Local Development

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run migrate   # create tables + seed sample data
npm run dev       # http://localhost:5000
```

**backend/.env**
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shopnow
DB_USER=shopnow_user
DB_PASSWORD=shopnow_password
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev   # http://localhost:3000
```

**frontend/.env.local**
```env
# SSR path — server-side fetch inside the same network
API_URL=http://localhost:5000/api

# Browser path — public-facing URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### PostgreSQL (without Docker)

```bash
psql -U postgres -c "CREATE DATABASE shopnow;"
psql -U postgres -c "CREATE USER shopnow_user WITH PASSWORD 'shopnow_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE shopnow TO shopnow_user;"
```

### Redis (without Docker)

```bash
# macOS
brew install redis && brew services start redis

# Ubuntu
sudo apt-get install redis-server && sudo systemctl start redis-server

redis-cli ping   # PONG
```

---

## API Reference

### Products

| Method | Path | Notes |
|---|---|---|
| GET | `/api/products` | Redis-cached 1 h |
| GET | `/api/products/:id` | Redis-cached 1 h |
| POST | `/api/products` | Clears list cache |
| PUT | `/api/products/:id` | Clears list + item cache |
| DELETE | `/api/products/:id` | Clears list + item cache |

### Orders

| Method | Path | Description |
|---|---|---|
| POST | `/api/orders` | Create order |
| GET | `/api/orders` | List all orders |
| GET | `/api/orders/:id` | Order with items |
| PUT | `/api/orders/:id/status` | Update status |

**POST /api/orders**
```json
{
  "email": "customer@example.com",
  "name": "Customer Name",
  "items": [{ "productId": "uuid", "quantity": 2, "price": 99.99 }]
}
```

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Server liveness |
| GET | `/api/health/db` | Database connectivity |

---

## Database Schema

**products** `id` UUID PK · `name` · `description` · `price` DECIMAL · `image` · `category` · `stock_quantity` INT · `created_at` · `updated_at`

**users** `id` UUID PK · `email` UNIQUE · `name` · `created_at` · `updated_at`

**orders** `id` UUID PK · `user_id` FK→users · `total_price` DECIMAL · `status` · `created_at` · `updated_at`

**order_items** `id` UUID PK · `order_id` FK→orders · `product_id` FK→products · `quantity` INT · `price` DECIMAL · `created_at`

---

## Caching

Redis caches product reads for 1 hour. Write operations invalidate affected keys automatically.

| Key | Content |
|---|---|
| `products` | Full product list |
| `product:{id}` | Single product |

---

## Frontend Pages

| Route | Rendering | Description |
|---|---|---|
| `/` | SSR | Home — featured products (revalidates every 60 s) |
| `/products` | SSR | Full product catalog (revalidates every 60 s) |
| `/cart` | CSR (`'use client'`) | Cart management + checkout form |
| `/orders/[id]` | SSR | Order confirmation (revalidates every 60 s) |

SSR pages call the backend via `API_URL` (server-side, VPC-internal or localhost).  
The cart page calls the backend via `NEXT_PUBLIC_API_URL` (browser fetch, public URL).  
`app/api/client.ts` selects between them using `typeof window === 'undefined'`.

---

## AWS Deployment — ECS Fargate

### Terraform modules

| Module | AWS resources |
|---|---|
| `vpc` | VPC, public/private subnets, NAT gateway |
| `ecr` | Two ECR repositories (backend, frontend) |
| `rds` | PostgreSQL 16 on RDS (private subnets, SSL enabled) |
| `elasticache` | Redis 7 on ElastiCache (private subnets) |
| `alb` | Internet-facing ALB, target groups, listeners |
| `ecs` | ECS cluster, task definitions, Fargate services, Cloud Map namespace + service records |

### Terraform variables (`.infra/terraform.tfvars`)

```hcl
cluster_name = "shopnow-ecs"
region       = "us-east-1"
db_name      = "shopnow"
db_username  = "shopnow"
db_password  = "<your-password>"
```

### Deploy

```bash
cd .infra

# 1. Push images to ECR
aws ecr get-login-password --region us-east-1 \
  | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker build -t <account-id>.dkr.ecr.us-east-1.amazonaws.com/shopnow-ecs/backend:latest ./backend
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/shopnow-ecs/backend:latest

docker build -t <account-id>.dkr.ecr.us-east-1.amazonaws.com/shopnow-ecs/frontend:latest ./frontend
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/shopnow-ecs/frontend:latest

# 2. Provision infrastructure
terraform init
terraform plan -var="db_password=<your-password>"
terraform apply -var="db_password=<your-password>"
```

### Terraform outputs

| Output | Description |
|---|---|
| `cluster_endpoint` | EKS cluster API endpoint |
| `cluster_name` | Cluster name |
| `backend_ecr_url` | ECR URL for backend image |
| `frontend_ecr_url` | ECR URL for frontend image |
| `rds_endpoint` | RDS PostgreSQL host |
| `redis_endpoint` | ElastiCache Redis host |

### ECS task environment variables

**Backend**
```
NODE_ENV=production
PORT=5000
DB_HOST=<rds-endpoint>
DB_PORT=5432
DB_NAME=shopnow
DB_USER=shopnow
DB_PASSWORD=<from tfvars>
REDIS_HOST=<elasticache-endpoint>
REDIS_PORT=6379
DB_SSL=true
```

**Frontend**
```
NODE_ENV=production
API_URL=http://backend.shopnow.local:5000/api     # SSR — Cloud Map DNS
NEXT_PUBLIC_API_URL=http://<alb-dns>/api           # browser — ALB
```

### Service Discovery (Cloud Map)

The ECS module creates a private DNS namespace `shopnow.local` in the VPC. Each ECS service registers its task IPs via a `service_registries` block:

- `backend.shopnow.local` — resolved by frontend SSR tasks; never leaves the VPC
- `frontend.shopnow.local` — internal reference

The tasks security group allows self-referential TCP traffic on all ports so frontend pods can dial backend pods directly.

---

## AWS Deployment — EKS

### Terraform (EKS module)

The `eks` module in `.infra/modules/eks/` provisions:

| Resource | Detail |
|---|---|
| EKS cluster | Kubernetes 1.30, public + private API endpoint |
| Node group | `t2.micro` / `t3.micro`, desired 4, min 1, max 4, private subnets |
| Node IAM role | `AmazonEKSWorkerNodePolicy`, `AmazonEKS_CNI_Policy`, `AmazonEC2ContainerRegistryReadOnly` |
| Node security group | Self-referential ingress (all ports), full egress |
| OIDC provider | Enables IRSA (IAM Roles for Service Accounts) |

The root `main.tf` also installs the **AWS Load Balancer Controller** via Helm (`aws-load-balancer-controller` chart v1.7.1, `kube-system` namespace) and creates its IRSA role using the OIDC provider ARN exported from the EKS module.

### Kubernetes manifests (`.k8s/`)

```
.k8s/
├── namespace.yaml           # shopnow namespace
├── ingress.yaml             # ALB Ingress (internet-facing, ip target mode)
├── backend/
│   ├── deployment.yaml      # 3 replicas, port 5000
│   └── service.yaml         # ClusterIP shopnow-backend :80 → :5000
├── frontend/
│   ├── deployment.yaml      # 1 replica, port 3000
│   └── service.yaml         # ClusterIP frontend-service :80 → :3000
└── data/
    ├── postgres.yaml        # PostgreSQL pod + ClusterIP service (dev/test only)
    └── redis.yaml           # Redis pod + ClusterIP service (dev/test only)
```

> **Note:** `data/postgres.yaml` and `data/redis.yaml` run database workloads as unmanaged pods without persistent volumes — suitable for development only. Production EKS deployments connect to RDS and ElastiCache using the endpoints from Terraform outputs.

### Ingress routing

```yaml
# .k8s/ingress.yaml
annotations:
  kubernetes.io/ingress.class: alb
  alb.ingress.kubernetes.io/scheme: internet-facing
  alb.ingress.kubernetes.io/target-type: ip

rules:
  - /api  →  shopnow-backend:80   (backend ClusterIP)
  - /     →  frontend-service:80  (frontend ClusterIP)
```

The ALB Ingress Controller (installed via Helm by Terraform) reads this resource and provisions an AWS ALB automatically.

### Services

| Name | Type | Port mapping | Selects |
|---|---|---|---|
| `shopnow-backend` | ClusterIP | 80 → 5000 | `app=shop-now, type=backend` |
| `frontend-service` | ClusterIP | 80 → 3000 | `app=shop-now, type=frontend` |
| `postgres-service` | ClusterIP | 5432 → 5432 | `app=postgres, type=database` |
| `redis-service` | ClusterIP | 6379 → 6379 | `app=redis, type=cache` |

### Environment variables in K8s

In Kubernetes, both SSR and browser env vars point to the ClusterIP service name because the Ingress routes `/api` through the ALB back to the same service — and SSR runs inside the cluster where CoreDNS resolves `shopnow-backend` directly.

**Backend deployment**
```
NODE_ENV=production
PORT=5000
DB_HOST=<rds-endpoint>
DB_PORT=5432
DB_NAME=shopnow
DB_USER=shopnow
DB_PASSWORD=<secret>
DB_SSL=true
REDIS_HOST=<elasticache-endpoint>
REDIS_PORT=6379
```

**Frontend deployment**
```
NODE_ENV=production
API_URL=http://shopnow-backend/api          # SSR — CoreDNS resolves ClusterIP
NEXT_PUBLIC_API_URL=http://shopnow-backend/api   # baked at build time — set to ALB URL for production builds
```

> **Important:** `NEXT_PUBLIC_*` variables are embedded into the JavaScript bundle at build time by Next.js. To expose the ALB URL to browsers, set `NEXT_PUBLIC_API_URL` to the ALB public DNS **during the Docker build** (`docker build --build-arg NEXT_PUBLIC_API_URL=http://<alb-dns>/api`), not at pod runtime.

### Apply manifests

`backend/deployment.yaml` and `frontend/deployment.yaml` reference `${BACKEND_IMAGE}`, `${FRONTEND_IMAGE}`, `${DB_HOST}`, `${REDIS_HOST}` and `${DB_SSL}` — no environment-specific values are committed. Resolve them with `envsubst` and keep the DB password in a Secret, never in the manifest.

```bash
# 1. Configure kubectl
aws eks update-kubeconfig --region us-east-1 --name shopnow-ecs

# 2. Provide the placeholder values (from `terraform output`, run inside .infra/)
cp .k8s/.env.example .k8s/.env   # then fill in BACKEND_IMAGE, FRONTEND_IMAGE, DB_HOST, REDIS_HOST
set -a && source .k8s/.env && set +a

# 3. Apply in order
kubectl apply -f .k8s/namespace.yaml
kubectl apply -f .k8s/data/          # only for dev; skip for production (use RDS + ElastiCache)

# create the DB password Secret once (never commit the plaintext value)
kubectl create secret generic backend-secret \
  --namespace shopnow \
  --from-literal=db-password='<your-db-password>'

envsubst < .k8s/backend/deployment.yaml  | kubectl apply -f -
kubectl apply -f .k8s/backend/service.yaml
envsubst < .k8s/frontend/deployment.yaml | kubectl apply -f -
kubectl apply -f .k8s/frontend/service.yaml
kubectl apply -f .k8s/ingress.yaml

# 3. Check status
kubectl get pods -n shopnow
kubectl get svc  -n shopnow
kubectl get ingress -n shopnow        # shows ALB DNS once provisioned (~2 min)
```

### Update a deployment (rolling restart)

```bash
# After pushing a new image to ECR:
kubectl rollout restart deployment/backend-deployment  -n shopnow
kubectl rollout restart deployment/frontend-deployment -n shopnow
kubectl rollout status  deployment/backend-deployment  -n shopnow
```

### Scale

```bash
kubectl scale deployment/backend-deployment  --replicas=5 -n shopnow
kubectl scale deployment/frontend-deployment --replicas=3 -n shopnow
```

---

## Troubleshooting

### Docker

```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose down && docker-compose up --build   # clean rebuild
```

### Database

```bash
docker-compose exec db psql -U shopnow_user -d shopnow -c "\dt"
docker-compose exec db psql -U shopnow_user -d shopnow -c "SELECT COUNT(*) FROM products;"
docker-compose exec backend npm run migrate   # re-run migrations
```

### Redis

```bash
docker exec shopnow_redis redis-cli ping       # PONG
docker exec shopnow_redis redis-cli FLUSHALL   # clear all cache
```

### API not responding

```bash
curl http://localhost:5000/health
curl http://localhost:5000/api/health/db
```

### ECS — service discovery not resolving

1. Verify `service_registries` block is present in both ECS service definitions (`backend.tf`, `frontend.tf`)
2. Open AWS Cloud Map console — task IPs must appear under `backend.shopnow.local`
3. Confirm the tasks security group has a self-referential TCP ingress rule (`self = true`, ports 0–65535)
4. Both services must be in the same VPC as the `shopnow.local` namespace

### EKS — pods not starting

```bash
kubectl describe pod <pod-name> -n shopnow    # check Events section
kubectl logs <pod-name> -n shopnow
```

### EKS — Ingress not getting an ALB address

```bash
kubectl get pods -n kube-system | grep aws-load-balancer-controller
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

Common causes: IRSA role ARN mismatch, missing ALB controller IAM policy, subnets not tagged with `kubernetes.io/role/elb=1`.

### EKS — backend unreachable from frontend pod

```bash
# Test DNS resolution and connectivity from a temporary pod
kubectl run test --image=busybox --rm -it --restart=Never -n shopnow -- \
  wget -qO- http://shopnow-backend/health
```
