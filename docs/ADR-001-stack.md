# ADR-001 — Technology Stack (TASK-01, FROZEN)

Status: Accepted (Master Plan frozen).

## Decision

Monorepo `system-pro` with npm workspaces:

- `apps/api`: NestJS 10 + TypeScript (strict) on Node 24 LTS.
- `apps/web`: Next.js 14 placeholder (TASK-01 only, no business logic).
- `packages/config`: Zod-validated environment (`DATABASE_URL`, `API_PORT`, ...), fail-fast.
- ORM (from TASK-02): Prisma. Database: PostgreSQL 17 (`citext`, `pg_trgm`, `pgcrypto`).
- No Redis/BullMQ in TASK-01 (deferred to TASK-14).

## Why

- One language (TS) end-to-end for a small AI-assisted team.
- NestJS modules map 1:1 to future domains; Guards centralize auth/tenant/RBAC.
- Prisma + Postgres enforce FK/unique/check/transactional invariants; RLS defense-in-depth from TASK-02.
- Next.js App Router separates marketing/auth/app/platform shells later; server components keep secrets server-side.

## Alternatives considered

- FastAPI/Django: strong backends but split-language maintenance; weaker batteries for Nest-style tenancy guards.
- Supabase/Firebase: fast start but RLS-only tenancy + lock-in; wrong fit for outbox/commissions/audit.
- K8s day one: overkill; Compose + managed Postgres first.

## Security / scale / maintenance

- Parameterized DB access, strict validation, fail-closed env, non-root containers, pinned Node.
- Stateless API; shared-schema `company_id` tenancy scales to thousands of companies.
- Small reviewable tasks with STOP gates prevent sprawl.
