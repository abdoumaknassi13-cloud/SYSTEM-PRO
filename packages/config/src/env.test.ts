import { strict as assert } from "node:assert";
import { test } from "node:test";
import { loadEnv } from "./env.js";

test("loadEnv accepts a valid postgresql DATABASE_URL", () => {
  const env = loadEnv({
    DATABASE_URL: "postgresql://systempro:secret@localhost:5432/systempro_dev",
  });
  assert.equal(env.API_PORT, 3001);
  assert.equal(env.WEB_PORT, 3000);
  assert.equal(env.POSTGRES_PORT, 5432);
});

test("loadEnv throws when DATABASE_URL is missing", () => {
  assert.throws(() => loadEnv({}), /DATABASE_URL/);
});

test("loadEnv throws on non-postgres scheme (fail closed)", () => {
  assert.throws(() => loadEnv({ DATABASE_URL: "mysql://localhost/db" }), /postgresql/);
});
