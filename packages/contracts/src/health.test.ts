import { strict as assert } from "node:assert";
import { test } from "node:test";
import { HealthResponseSchema, NotReadyResponseSchema, ReadyResponseSchema } from "./index.js";

test("health contract accepts the TASK-01 payload", () => {
  const parsed = HealthResponseSchema.safeParse({
    status: "ok",
    version: "0.1.0",
    commit: "unknown",
  });
  assert.equal(parsed.success, true);
});

test("ready contracts distinguish up from down without leaking details", () => {
  assert.equal(ReadyResponseSchema.safeParse({ status: "ready", db: "up" }).success, true);
  const down = NotReadyResponseSchema.safeParse({
    status: "not-ready",
    db: "down",
    message: "Database unavailable",
  });
  assert.equal(down.success, true);
  assert.equal(ReadyResponseSchema.safeParse({ status: "ready", db: "down" }).success, false);
});
