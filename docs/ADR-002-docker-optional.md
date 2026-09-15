# ADR-002 — Docker Optional Strategy (TASK-01, FROZEN)

Status: Accepted.

## Decision

Docker is supported but NEVER required for local development.

- Path A (local): PostgreSQL 17 installed directly on Windows; API runs on host with `DATABASE_URL=...@localhost:5432/...`. Zero containers.
- Path B (Docker): `docker compose -f infra/docker-compose.yml up postgres --wait`; API on host uses published port, or inside Compose via `postgres` hostname.
- `infra/docker-compose.yml` ships PostgreSQL 17 only in TASK-01. No app services required, no Redis (TASK-14).
- App code reads only `DATABASE_URL` (+ ports); no Docker-specific paths/hosts in code.

## Security

- No hardcoded secrets; `POSTGRES_PASSWORD` required from env (`:?` guard); dev-only placeholder clearly marked, never reused in prod.
- DB port configurable (`POSTGRES_PORT`); prod must not publish DB publicly, must pin images by digest, use external secrets, run non-root.

## Consequences

- README documents both paths; CI uses service containers (equivalent to Path B).
- Do not auto-install or auto-start Docker/Postgres. Developer chooses path.
