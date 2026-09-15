import { strict as assert } from "node:assert";
import { test } from "node:test";
import { SYSTEM_PRO_BRAND } from "./index.js";

test("brand tokens expose the approved green direction", () => {
  assert.equal(SYSTEM_PRO_BRAND.name, "SYSTEM PRO");
  assert.equal(SYSTEM_PRO_BRAND.primary, "#16A34A");
});
