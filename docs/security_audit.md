# Security Audit Report — Fraude-Ary
**Date:** 2026-04-25
**Auditor:** Automated SAST + SCA + CI/CD + Docker Audit
**Scope:** Full codebase (backend, frontend, infra, CI/CD)

---

## Executive Summary

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 7 | FIXED |
| 🟠 High | 10 | FIXED |
| 🟡 Medium | 11 | FIXED |
| 🟢 Low | 6 | FIXED |
| **Total** | **34** | **ALL FIXED** |

---

## 🔴 CRITICAL Findings (7)

### C1 — CVE-2025-29927: Next.js Middleware Auth Bypass
- **File:** `apps/frontend/package.json`
- **CVE:** CVE-2025-29927 (CVSS 9.1)
- **Description:** `next@14.2.4` accepts `x-middleware-subrequest` header to bypass all middleware, including authentication guards.
- **Risk:** Complete auth bypass — any attacker can access protected pages without credentials.
- **Fix:** Upgrade `next` to `>=14.2.25`.

### C2 — CVE-2024-33663: python-jose Algorithm Confusion
- **File:** `apps/backend/requirements.txt`
- **CVE:** CVE-2024-33663 (CVSS 9.8)
- **Description:** `python-jose==3.3.0` accepts HMAC-signed tokens when expecting RSA, allowing JWT forgery. Package unmaintained since 2022.
- **Risk:** Attacker can forge valid JWTs for any user.
- **Fix:** Replace `python-jose` with `PyJWT`.

### C3 — Hardcoded Production Secrets in CI/CD
- **File:** `.github/workflows/deploy.yml:30-31`
- **Description:** `POSTGRES_PASSWORD=devpassword123` and `JWT_SECRET=prodsecretchange123` committed in plaintext.
- **Risk:** Anyone with repo access can access the database and forge authentication tokens.
- **Fix:** Move to GitHub Secrets, reference via `${{ secrets.* }}`.

### C4 — Hardcoded DB Credentials in alembic.ini
- **File:** `apps/backend/alembic.ini:6`
- **Description:** Database connection string with password in committed config file.
- **Risk:** Repo access = full DB access.
- **Fix:** Override via `env.py` from `settings.DATABASE_URL`.

### C5 — Unauthenticated Cache Admin Endpoints
- **File:** `apps/backend/app/routers/cache.py:8-21`
- **Description:** `/api/v1/cache/stats` and `/api/v1/cache/clear` have no authentication.
- **Risk:** Anonymous users can flush Redis cache (DoS) or read internal cache stats.
- **Fix:** Add `Depends(get_current_user)` to both endpoints.

### C6 — Backend Docker Container Runs as Root
- **File:** `apps/backend/Dockerfile`
- **Description:** No `USER` directive — container runs as root.
- **Risk:** Container compromise = root on host.
- **Fix:** Add non-root user, drop privileges after migration.

### C7 — Tracked cookies.txt in Repository
- **File:** `cookies.txt` (git-tracked)
- **Description:** Session cookies committed to repository.
- **Risk:** Session hijacking for anyone with repo access.
- **Fix:** Remove from git, add to .gitignore.

---

## 🟠 HIGH Findings (10)

### H1 — CVE-2024-51479: Next.js Server Actions Auth Bypass
- **File:** `apps/frontend/package.json`
- **CVE:** CVE-2024-51479
- **Fix:** Covered by C1 upgrade to `next>=14.2.25`.

### H2 — CVE-2024-46982: Next.js Cache Poisoning
- **File:** `apps/frontend/package.json`
- **CVE:** CVE-2024-46982
- **Fix:** Covered by C1 upgrade to `next>=14.2.25`.

### H3 — Unauthenticated System Info Leak
- **File:** `apps/backend/app/routers/monitoring.py:18`
- **Description:** `/api/v1/health/detailed` exposes load average, memory, uptime without auth.
- **Fix:** Add `Depends(get_current_user)`.

### H4 — Overly Permissive CORS
- **File:** `apps/backend/app/main.py:54-55`
- **Description:** `allow_methods=["*"]`, `allow_headers=["*"]`.
- **Fix:** Restrict to actual methods and headers used.

### H5 — No Password Strength Validation
- **File:** `apps/backend/app/schemas/auth.py:16`
- **Description:** Any string accepted as password, including single character.
- **Fix:** Add `min_length=8` to password field.

### H6 — No Rate Limiting on Auth Endpoints
- **File:** `apps/backend/app/routers/auth.py:55,72`
- **Description:** Login/register have no per-endpoint rate limiting.
- **Fix:** Add `@limiter.limit("5/minute")` to login, `"3/minute"` to register.

### H7 — No Audit Logging for Security Events
- **File:** `apps/backend/app/routers/auth.py`
- **Description:** No logging for login success/failure, registration events.
- **Fix:** Add logging calls for all auth events.

### H8 — CI/CD Token Has Default Wide-Open Permissions
- **File:** `.github/workflows/deploy.yml`
- **Description:** No `permissions:` block — GITHUB_TOKEN gets write to all scopes.
- **Fix:** Add `permissions: contents: read`.

### H9 — CI/CD Actions Pinned to Tags, Not SHA
- **File:** `.github/workflows/deploy.yml:16`
- **Description:** `actions/checkout@v4` — mutable tag vulnerable to supply chain attack.
- **Fix:** Pin to commit SHA.

### H10 — No TLS — All Traffic in Plaintext
- **File:** `infra/nginx.conf:15`
- **Description:** Only listens on port 80 (HTTP). JWT, passwords, financial data transmitted in clear text.
- **Fix:** Add TLS configuration (Let's Encrypt / self-signed for dev).

---

## 🟡 MEDIUM Findings (11)

### M1 — SQL Echo Enabled by Default
- **File:** `apps/backend/app/database.py:10`
- **Fix:** Default `PYTHON_ENV` to `"production"`.

### M2 — No Symbol Input Validation
- **File:** `apps/backend/app/schemas/assets.py:8`
- **Fix:** Add regex `^[A-Z0-9.\-]{1,20}$` to symbol fields.

### M3 — Unbounded CSV File Upload
- **File:** `apps/backend/app/routers/assets.py:452`
- **Fix:** Add 5MB size limit.

### M4 — Exchange Rates Endpoint Triggers DB Writes Without Auth
- **File:** `apps/backend/app/routers/exchange_rates.py:86`
- **Fix:** Add authentication.

### M5 — Client-Supplied total_invested Trusted
- **File:** `apps/backend/app/schemas/transactions.py:15`
- **Fix:** Make `total_invested` Optional, compute server-side.

### M6 — No Security Headers in Nginx
- **File:** `infra/nginx.conf`
- **Fix:** Add X-Frame-Options, X-Content-Type-Options, CSP, HSTS.

### M7 — Backend/Frontend Ports Exposed to Host
- **File:** `infra/docker-compose.yml:30,38`
- **Fix:** Use `expose` instead of `ports` for internal services.

### M8 — No Network Segmentation in Docker
- **File:** `infra/docker-compose.yml`
- **Fix:** Add frontend-net, backend-net, db-net networks.

### M9 — Redis Has No Authentication
- **File:** `infra/docker-compose.yml:14`
- **Fix:** Add `--requirepass`.

### M10 — Docker Images Not Pinned to Digest
- **File:** All Dockerfiles and compose
- **Fix:** Pin to SHA256 digests.

### M11 — No .dockerignore Files
- **File:** Both apps
- **Fix:** Create `.dockerignore` files.

---

## 🟢 LOW Findings (6)

### L1 — JWT Secret Validation Too Weak
- **File:** `apps/backend/app/config.py:20`
- **Fix:** Add `len() < 32` check.

### L2 — Email Field Not Validated as Email
- **File:** `apps/backend/app/schemas/auth.py:15`
- **Fix:** Use `EmailStr` type.

### L3 — Outdated Python Dependencies
- **File:** `apps/backend/requirements.txt`
- **Fix:** Update all to latest compatible versions.

### L4 — No Container Resource Limits
- **File:** `infra/docker-compose.yml`
- **Fix:** Add `deploy.resources.limits`.

### L5 — No Health Checks for Backend/Frontend
- **File:** `infra/docker-compose.yml`
- **Fix:** Add healthcheck directives.

### L6 — Nginx Version Disclosure
- **File:** `infra/nginx.conf`
- **Fix:** Add `server_tokens off`.

---

## Positive Findings

- ✅ No SQL injection — all queries use SQLAlchemy ORM
- ✅ No XSS — pure JSON API, no HTML rendering
- ✅ No SSRF — fixed base URLs for external calls
- ✅ No insecure deserialization — no pickle/yaml
- ✅ bcrypt password hashing correctly implemented
- ✅ JWT expiry 24h is reasonable
- ✅ Global rate limiting exists (slowapi 100/min)
- ✅ Frontend Dockerfile uses non-root user
