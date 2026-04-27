# Projet Fraude-Ary — Context

## Stack technique
- **Frontend** : Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, TanStack Query v5, Recharts
- **Backend** : FastAPI 0.115, SQLAlchemy 2.0 (async), Alembic, Pydantic v2, python-jose, passlib, slowapi, apscheduler, yfinance
- **BDD** : PostgreSQL 16 (Docker) + Redis 7 (cache)
- **Proxy** : Nginx 1.27 (Docker)
- **Infra** : Docker + Docker Compose, GitHub Actions (self-hosted runner sur la VM)
- **Agents IA** : OpenCode (/tmp/opencode sur VM) — configuré avec `.opencode/` dans le projet

## Architecture
- **Structure** : monorepo `/root/fraude-ary/` avec `apps/frontend/` + `apps/backend/` + `infra/`
- **Points d'entrée** :
  - Frontend : `apps/frontend/` (Next.js 14, port 3000)
  - Backend : `apps/backend/app/main.py` (FastAPI, port 8000, 16 routers)
  - Proxy : `infra/nginx.conf`
- **Flux** : Nginx(80) → Frontend(3000) + Backend(8000) → PostgreSQL(5432) + Redis(6379)
- **Services externes** : Yahoo Finance (stocks), CryptoCompare (crypto), yfinance (financial data)

## Services Docker (PROD - tous UP)
| Service | Status | Ports |
|---------|--------|-------|
| infra-postgres-1 | UP healthy | 5432/tcp |
| infra-redis-1 | UP healthy | 6379/tcp |
| infra-frontend-1 | UP healthy | 3000/tcp |
| infra-backend-1 | UP healthy | 8000/tcp |
| infra-nginx-1 | UP | 80/tcp |

## État actuel
- **Branche active** : `main` (7d1e27a — auth rate limit)
- **Derniers commits** (5 derniers) :
  - `7d1e27a` fix: increase backend auth rate limit →30/min, add login delay in E2E
  - `0fa56cd` fix: rate limit 30→60r/m, add auth cooldown after invalid login test
  - `55f374f` feat: Phase 4 — API pagination, health check enrichi, ErrorBoundary React, E2E coverage
  - `fee4a50` fix: revert HTTPS config to HTTP-only (cert files missing in CI/CD)
  - `8dba082` fix: codebase optimization audit — FK constraints, N+1 queries, security, i18n
- **Working tree** : clean (aucune modification non commitées)
- **API status** : `/health` répond 200 OK, mais plusieurs endpoints return 500 (assets, transactions, portfolio/summary)

## ⚠️ Points d'attention — ERRORS ACTIVES
1. **API 500 errors** : Les endpoints `/api/v1/assets`, `/api/v1/transactions`, `/api/v1/portfolio/summary` retournent tous HTTP 500. Le backend est "healthy" mais les routers sont cassés.
2. **JWT_SECRET** : Validé au démarrage (≥32 chars), n'est plus un blocker — mais les 500 viennent d'ailleurs.
3. **Pas de .env.prod** sur la VM — les secrets tournent avec les valeurs par défaut du docker-compose.yml (JWT_SECRET=prodsecretchange123-must-be-at-least-32chars).

## Conventions
- **Langue du code** : anglais (code, commits, docs)
- **Style de commits** : Conventional Commits (`feat:`, `fix:`, `perf:`, `docs:`)
- **Stratégie de branches** :
  - `main` = production
  - `develop` = intégration
  - Feature branches : `feat/`, `fix/`, `refactor/`, `perf/`
- **Auth** : JWT HS256, 24h expiry, demo@fraude-ary.com / demo1234
- **CI/CD** : GitHub Actions avec self-hosted runner (service actif sur la VM)
- **Rate limiting** : 60 req/min (auth: register+login 30/min avec cooldown)
- **MemPalace** : fichier `mempalace.yaml` à la racine — wings/rooms configurés pour le projet

## Points d'entrée pour les agents
- **AGENTS.md** : Source of truth pour les sub-agents (caveman mode, conventions, archi)
- **DESIGN.md** : Design system tokens, palette, principes UI/UX
- **README.md** : Quick start pour humains
- **docs/** : Documentation complète (architecture, API, dev, troubleshooting)
- **infra/docker-compose.yml** : Stack de production
- **infra/docker-compose.dev.yml** : Stack de développement

## Commandes utiles (PTY sudo)
```bash
# Logs
docker logs --tail 50 infra-backend-1
docker logs --tail 20 infra-nginx-1

# Redémarrer un service
docker compose -f /root/fraude-ary/infra/docker-compose.yml restart backend

# Rebuild
cd /root/fraude-ary/infra && docker compose up -d --build

# Tailing logs temps réel
docker logs -f infra-backend-1
```

