# SYSTEM PRO — TASK-01 Foundation

> TASK-01 only: runnable skeleton with guardrails. No auth, no business logic, no Redis.
> Monorepo: `apps/api` (NestJS) · `apps/web` (Next.js placeholder) · `packages/config` (Zod env) · `packages/ui` (brand tokens) · `packages/contracts` (shared schemas) · `infra/` · `docs/`.

## Prerequisites

- Node 24 LTS (`node --version` → v24.x), npm 10+.
- Git + GitHub repo `system-pro`, branch `main`, work on `task/*` (e.g. `task/01-project-init`).
- PostgreSQL 17 — either Path A or Path B below. Docker optional, never required.

## Path A — Local PostgreSQL (no Docker)

1. Install PostgreSQL 17 locally; create DB/user:
   `CREATE USER systempro WITH PASSWORD 'CHANGE_ME_DEV_ONLY'; CREATE DATABASE systempro_dev OWNER systempro;`
2. Enable extensions: `CREATE EXTENSION IF NOT EXISTS "citext"; CREATE EXTENSION IF NOT EXISTS "pg_trgm"; CREATE EXTENSION IF NOT EXISTS "pgcrypto";`
   (or run `infra/postgres/init.sql`)
3. `copy .env.example .env` and set `DATABASE_URL` + `POSTGRES_PASSWORD` (dev-only values).
4. `npm install`
5. `npm run dev:api` (the API loads the repository-root `.env` automatically; variables already present in the environment are never overridden) → `GET http://localhost:3001/health` → `{"status":"ok",...}`.

## Path B — Docker PostgreSQL (API still on host)

1. `copy .env.docker.example .env` and set `POSTGRES_PASSWORD` (dev-only, never prod).
2. `docker compose -f infra/docker-compose.yml up postgres --wait`
3. `npm install`
4. `npm run dev:api` → `GET http://localhost:3001/health` and `GET http://localhost:3001/ready` (expects `{"status":"ready","db":"up"}`).

If the API itself runs inside Compose later, use `DATABASE_URL=...@postgres:5432/...`.

## Scripts

| Command                                        | Purpose                                       |
| ---------------------------------------------- | --------------------------------------------- |
| `npm install`                                  | Install all workspaces                        |
| `npm run lint`                                 | ESLint (max-warnings 0)                       |
| `npm run format:check`                         | Prettier check                                |
| `npm run typecheck`                            | `tsc --noEmit` strict (all workspaces)        |
| `npm run test`                                 | Jest (api) + node:test (config/ui/contracts)  |
| `npm run prisma:validate --workspace=apps/api` | Validate Prisma schema (no tables in TASK-01) |
| `npm run build`                                | Build all workspaces                          |
| `npm audit --audit-level=high`                 | Dependency security check                     |

Validated env keys (see `packages/config/src/env.ts`): `DATABASE_URL` (required, postgresql://), `API_PORT` (default 3001), `WEB_PORT` (default 3000), `POSTGRES_PORT` (default 5432).

## Endpoints (TASK-01)

- `GET /health` → `{status:"ok", version, commit}` (no DB required).
- `GET /ready` → `{status:"ready", db:"up"}` or 503 `{status:"not-ready"}` (generic message; driver errors never leaked).

## Security notes

- `.env` never committed (see `.gitignore`); only `.env.example` files with placeholders.
- Env validated with Zod at boot; app exits non-zero on invalid config.
- CORS disabled by default; containers non-root in prod Dockerfiles (added with app images later).
- No TASK-02 code (auth/tenancy/RBAC/orders/...) in this task.

## Architecture boundaries for TASK-01

Included: workspace skeleton, strict TS + lint/format, Zod env, `GET /health`, `GET /ready` (pg connectivity), Compose PG-only infra, Prisma schema stub with zero models, CI gates.

Explicitly excluded (TASK-02+): auth, users, companies, memberships, roles/RBAC/permissions/entitlements, tenant isolation/RLS, orders, products, stores, delivery, YouCan/Shopify, commissions, notifications, billing, Redis/BullMQ, webhooks/workers, impersonation, platform admin, real business UI, K8s/Terraform.

## CI

GitHub Actions (`.github/workflows/ci.yml`): install → compose config validate → lint → format → typecheck → prisma validate → test → build → `/health`+`/ready` smoke → `npm audit`.
