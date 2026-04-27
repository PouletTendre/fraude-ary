# CONTEXT.md — Fraude-Ary

## Stack technique
- **Frontend** : Next.js 14 (App Router), React 18, TypeScript 5.4, Tailwind CSS 3.4, TanStack Query v5, Recharts, Lucide React
- **Backend** : FastAPI 0.111 (async), SQLAlchemy 2.0 (async ORM), Alembic, Pydantic v2, python-jose (JWT), passlib (bcrypt), httpx, APScheduler, slowapi
- **Données** : PostgreSQL 16, Redis 7 (cache)
- **Déploiement** : Docker + Docker Compose, Nginx (reverse proxy), GitHub Actions (self-hosted runner)

## Architecture
- **17 routeurs backend** : alerts, analytics, assets, auth, cache, demo, dividends, exchange_rates, monitoring, news, notifications, portfolio, prices, simulator, technical, transactions, valuation
- **Proxy** : Nginx (port 80) → `/api/*` et `/auth/*` → backend:8000, reste → frontend:3000
- **Cache** : Redis — stocks 5min, crypto 1min, exchange rates 1h
- **Prix** : Yahoo Finance (stocks), CryptoCompare (crypto), prix fixes au m² (immobilier)
- **Auth** : JWT 24h, `OAuth2PasswordRequestForm`, token stocké dans `localStorage`

## État actuel (main — 5 derniers commits)
| Hash | Message | Auteur |
|------|---------|--------|
| `44e169f` | chore: remove auto-generated CONTEXT.md | root |
| `a2b8ac5` | fix: Pydantic ValidationError — date/purchase_date returned as date objects from DB but schemas expect str | root |
| `7d1e27a` | fix: increase backend auth rate limit 5/min→30/min for register+login, add login delay in E2E | root |
| `0fa56cd` | fix: rate limit 30→60r/m, add auth cooldown after invalid login test | root |
| `c6eb50d` | fix: increase auth rate limit 5r/m→30r/m, add waitForLoadState in login helper | root |

## Conventions
- **Langue** : code et commits en français (conventional commits : `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`)
- **Frontend** : TypeScript strict, API via `fetchApi()` wrapper, TanStack Query pour état serveur, dark mode `bg-white dark:bg-gray-800`
- **Backend** : async/await obligatoire, Pydantic v2 strict, routes minces / logique dans `services/`, `Enum` avec `values_callable`
- **Tests** : Playwright E2E, `curl` health check, pas de fake data pour les prix
- **Git** : branche feature → PR → merge, jamais push direct sur main (sauf chore minime)

## Points d'attention
- **CONTEXT.md** maintenu manuellement — pas de génération automatique
- **Pydantic v2 strict mode** — `date`/`purchase_date` doivent être `str` dans les schémas, pas `date` Python
- **Prix réels uniquement** — pas de simulation, pas de fallback aléatoire
- **CI/CD** : ne pas lancer `docker compose build` manuellement quand le runner CI tourne
- **Symboles** : regex `^[A-Z0-9.\-]{1,20}$` (supporte `AIR.PA`, `BRK.B`)
- **Devise** : jamais hardcoder `$`, utiliser `formatCurrency(value, currency)`
- **Alembic** : migrations numérotées séquentiellement, `down_revision` doit pointer exactement sur l'ID précédent
- **Rate limit auth** : 30 req/min pour login/register
