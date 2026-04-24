# CI/CD & Deployment

## Overview

The project uses GitHub Actions with a self-hosted runner for continuous deployment. Every push to `main` triggers an automatic build and deployment.

## GitHub Actions Workflow

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to VM
on:
  push:
    branches: [main]
```

### Workflow Steps

1. **Checkout** — Pull latest code
2. **Wait for previous deployment** — Prevents concurrent deployments
3. **Set environment variables** — Inject secrets and config
4. **Clean up old containers** — Remove orphaned containers to avoid name conflicts
5. **Build & start containers** — Build fresh images and start services
6. **Verify deployment** — Health check on backend

### Concurrency Protection

```yaml
concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: false
```

This ensures only one deployment runs at a time per branch.

### Container Cleanup

Before each build, the workflow runs:
```bash
docker compose down --remove-orphans
docker ps -aq --filter "name=infra-" | xargs -r docker rm -f
docker system prune -f
```

This prevents the "container name already in use" error.

## Docker Configuration

### Services

| Service | Image | Port | Description |
|---------|-------|------|-------------|
| nginx | nginx:alpine | 80 | Reverse proxy |
| frontend | infra-frontend | 3000 | Next.js app |
| backend | infra-backend | 8000 | FastAPI app |
| postgres | postgres:16-alpine | 5432 | Database |
| redis | redis:7-alpine | 6379 | Cache |

### Nginx Routing

```
location /api/  →  proxy_pass http://backend:8000/api/
location /auth/ →  proxy_pass http://backend:8000/auth/
location /      →  proxy_pass http://frontend:3000/
```

### Dockerfiles

**Backend Dockerfile:**
- Base: Python 3.12-slim
- Installs dependencies from requirements.txt
- Exposes port 8000
- CMD: Run migrations then start uvicorn

**Frontend Dockerfile:**
- Base: Node 20-alpine
- Installs npm dependencies
- Builds Next.js app
- Exposes port 3000
- CMD: Start Next.js in production mode

## Deployment Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Change `POSTGRES_PASSWORD` to a strong password
- [ ] Set `ALLOWED_ORIGINS` to your domain (not `*`)
- [ ] Configure firewall rules (ports 80, 443)
- [ ] Set up HTTPS with Let's Encrypt or Cloudflare
- [ ] Configure backups for PostgreSQL
- [ ] Set up log rotation for Docker containers

## Manual Deployment

If CI/CD is unavailable, deploy manually:

```bash
cd /path/to/fraude-ary/infra
docker compose down --remove-orphans
docker compose build --no-cache
docker compose up -d

# Verify
curl -s http://localhost:8000/health
docker compose ps
```

## Rollback

To rollback to a previous version:

```bash
cd /path/to/fraude-ary
git log --oneline -10
git checkout <commit-hash>
cd infra
docker compose up -d --build
```

## Monitoring

### Container Health

```bash
# Check all services
docker compose ps

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Resource usage
docker stats
```

### Application Health

```bash
# Backend health
curl -s http://localhost:8000/health

# Detailed health (DB + Redis)
curl -s http://localhost:8000/api/v1/health/detailed

# Request metrics
curl -s http://localhost:8000/api/v1/health/metrics
```
