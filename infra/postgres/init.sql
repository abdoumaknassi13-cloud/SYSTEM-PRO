-- TASK-01: required PostgreSQL extensions for SYSTEM PRO.
-- Runs once on first volume init (docker-entrypoint-initdb.d).
-- Local path: run these manually with psql if needed.
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
