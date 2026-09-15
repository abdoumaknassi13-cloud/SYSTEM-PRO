/**
 * SYSTEM PRO security gate: npm audit exception checker (TASK-01).
 *
 * Usage:
 *   npm audit --audit-level=high --json > audit-report.json || true
 *   node infra/security/check-audit.mjs audit-report.json
 *   (or pipe: npm audit ... --json | node infra/security/check-audit.mjs)
 *
 * Contract (fail-closed):
 * - Only HIGH/CRITICAL advisories gated; each must match an exception by
 *   EXACT package + advisoryId. Severity/package/range alone never match.
 * - Any undocumented HIGH/CRITICAL finding -> FAIL (exit 1).
 * - Any exception without a live HIGH/CRITICAL match -> FAIL as stale.
 * - Malformed input, malformed exceptions, unparseable advisories -> FAIL.
 * - This script NEVER returns success on error. No catch-and-pass anywhere.
 *
 * Node.js standard library only. No dependencies.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_RE = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
const ADVISORY_RE = /^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EXCEPTION_KEYS = [
  "package",
  "advisoryId",
  "affectedRange",
  "fixedIn",
  "reason",
  "reviewDate",
  "remediationTask",
];
const GATED = new Set(["high", "critical"]);

function print(line) {
  process.stdout.write(`${line}\n`);
}

function fail(lines) {
  for (const line of lines) print(line);
  print("SECURITY GATE: FAIL");
  process.exit(1);
}

function readStdin() {
  return fs.readFileSync(0, "utf8");
}

function parseJson(text, label) {
  // Tolerate a leading UTF-8 BOM only; anything else malformed -> FAIL.
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  let value;
  try {
    value = JSON.parse(clean);
  } catch {
    fail([
      `Cannot parse ${label} as JSON.`,
      "Undocumented findings: unknown",
      "Stale exceptions: unknown",
    ]);
  }
  return value;
}

function advisoryIdFromUrl(url) {
  if (typeof url !== "string") return null;
  const id = url.split("/").pop() || "";
  return ADVISORY_RE.test(id) ? id.toUpperCase() : null;
}

function isRealDate(text) {
  if (!DATE_RE.test(text)) return false;
  const [y, m, d] = text.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function loadExceptions(scriptDir) {
  const file = path.join(scriptDir, "audit-exceptions.json");
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    fail([
      `Cannot read exception file: ${file}.`,
      "Undocumented findings: unknown",
      "Stale exceptions: unknown",
    ]);
  }
  const doc = parseJson(text, "audit-exceptions.json");
  if (doc === null || typeof doc !== "object" || Array.isArray(doc)) {
    fail(["Exception file must be a JSON object with an 'exceptions' array."]);
  }
  const topKeys = Object.keys(doc);
  if (topKeys.length !== 1 || topKeys[0] !== "exceptions" || !Array.isArray(doc.exceptions)) {
    fail(["Exception file must contain exactly one top-level key: 'exceptions' (array)."]);
  }
  const seen = new Set();
  doc.exceptions.forEach((entry, index) => {
    const where = `exceptions[${index}]`;
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      fail([`${where} must be an object.`]);
    }
    const keys = Object.keys(entry).sort();
    const wanted = [...EXCEPTION_KEYS].sort();
    if (keys.length !== wanted.length || keys.some((k, i) => k !== wanted[i])) {
      fail([`${where} must contain exactly: ${EXCEPTION_KEYS.join(", ")}.`]);
    }
    for (const key of EXCEPTION_KEYS) {
      if (typeof entry[key] !== "string" || entry[key].length === 0) {
        fail([`${where}.${key} must be a non-empty string.`]);
      }
    }
    if (!PACKAGE_RE.test(entry.package))
      fail([`${where}.package is not a valid npm package name.`]);
    if (!ADVISORY_RE.test(entry.advisoryId))
      fail([`${where}.advisoryId is not a valid GHSA identifier.`]);
    entry.advisoryId = entry.advisoryId.toUpperCase();
    if (!isRealDate(entry.reviewDate))
      fail([`${where}.reviewDate must be a real YYYY-MM-DD date.`]);
    const dupKey = `${entry.package} ${entry.advisoryId}`;
    if (seen.has(dupKey)) fail([`Duplicate exception for ${dupKey}.`]);
    seen.add(dupKey);
  });
  return doc.exceptions;
}

function todayUtc() {
  // Calendar date only (YYYY-MM-DD); no timestamps involved.
  return new Date().toISOString().slice(0, 10);
}

function installedVersion(repoRoot, nodePath, packageName) {
  try {
    const dir = nodePath || `node_modules/${packageName}`;
    const text = fs.readFileSync(path.join(repoRoot, dir, "package.json"), "utf8");
    const version = JSON.parse(text).version;
    return typeof version === "string" && version.length > 0 ? version : "unknown";
  } catch {
    return "unknown";
  }
}

function main() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(scriptDir, "..", "..");
  const inputFile = process.argv[2];
  let raw;
  try {
    raw = inputFile ? fs.readFileSync(inputFile, "utf8") : readStdin();
  } catch {
    fail(["Cannot read npm audit input; refusing to pass an unreadable report."]);
  }
  const audit = parseJson(raw, "npm audit output");
  if (audit === null || typeof audit !== "object" || Array.isArray(audit)) {
    fail(["npm audit output must be a JSON object."]);
  }
  if (
    audit.vulnerabilities === null ||
    typeof audit.vulnerabilities !== "object" ||
    Array.isArray(audit.vulnerabilities)
  ) {
    fail([
      "npm audit output has no 'vulnerabilities' object; refusing to pass an unreadable report.",
    ]);
  }

  const exceptions = loadExceptions(scriptDir);
  const byKey = new Map(exceptions.map((e) => [`${e.package} ${e.advisoryId}`, e]));

  // Collect live HIGH/CRITICAL advisories keyed by exact package + advisoryId.
  const live = new Map();
  for (const [packageName, node] of Object.entries(audit.vulnerabilities)) {
    if (node === null || typeof node !== "object") {
      fail([`Malformed audit entry for package '${packageName}'.`]);
    }
    if (!Array.isArray(node.via)) {
      fail([`Malformed 'via' list for package '${packageName}'.`]);
    }
    for (const item of node.via) {
      if (typeof item === "string") continue; // dependency edge, not an advisory
      if (item === null || typeof item !== "object") {
        fail([`Malformed advisory entry under package '${packageName}'.`]);
      }
      if (!GATED.has(item.severity)) continue; // moderates/lows need no exception
      const advisoryId = advisoryIdFromUrl(item.url);
      if (advisoryId === null) {
        fail([
          `HIGH/CRITICAL advisory under '${packageName}' has no parseable GHSA identifier; it cannot be excepted, so the gate fails.`,
          `Title: ${typeof item.title === "string" ? item.title : "unknown"}`,
        ]);
      }
      const key = `${packageName} ${advisoryId}`;
      if (!live.has(key)) {
        live.set(key, {
          package: packageName,
          advisoryId,
          severity: item.severity,
          title: typeof item.title === "string" ? item.title : "unknown",
          version: installedVersion(
            repoRoot,
            Array.isArray(node.nodes) ? node.nodes[0] : null,
            packageName,
          ),
        });
      }
    }
  }

  const report = ["Live HIGH/CRITICAL findings:"];
  const undocumented = [];
  for (const finding of live.values()) {
    const match = byKey.get(`${finding.package} ${finding.advisoryId}`);
    if (match) {
      report.push(
        `  EXCEPTED  ${finding.package}@${finding.version} ${finding.advisoryId} [${finding.severity}]`,
      );
      report.push(`            ${finding.title}`);
      report.push(`            reason: ${match.reason}`);
      report.push(
        `            review: ${match.reviewDate} | remediation: ${match.remediationTask}`,
      );
    } else {
      undocumented.push(finding);
      report.push(
        `  UNDOCUMENTED  ${finding.package}@${finding.version} ${finding.advisoryId} [${finding.severity}]`,
      );
      report.push(`            ${finding.title}`);
    }
  }
  if (live.size === 0) report.push("  (none)");

  const stale = exceptions.filter((e) => !live.has(`${e.package} ${e.advisoryId}`));
  if (stale.length > 0) {
    report.push("Stale exceptions (no live HIGH/CRITICAL match; remove or re-justify):");
    for (const entry of stale) report.push(`  STALE  ${entry.package} ${entry.advisoryId}`);
  }

  const today = todayUtc();
  const expired = exceptions.filter((e) => e.reviewDate < today);
  if (expired.length > 0) {
    report.push("Expired exceptions (reviewDate is before today; renew or remediate):");
    for (const entry of expired) {
      report.push(`  EXPIRED  ${entry.package} ${entry.advisoryId} reviewDate=${entry.reviewDate}`);
    }
  }

  report.push(`Live high/critical findings: ${live.size}`);
  report.push(`Documented exceptions: ${live.size - undocumented.length}`);
  report.push(`Undocumented findings: ${undocumented.length}`);
  report.push(`Stale exceptions: ${stale.length}`);
  report.push(`Expired exceptions: ${expired.length}`);

  if (undocumented.length > 0 || stale.length > 0 || expired.length > 0) {
    if (undocumented.length > 0)
      report.push("Reason: NEW or undocumented HIGH/CRITICAL advisories are present.");
    if (stale.length > 0)
      report.push("Reason: exception entries no longer match live audit output.");
    if (expired.length > 0)
      report.push("Reason: exception reviewDate has passed; risk acceptance expired.");
    fail(report);
  }
  for (const line of report) print(line);
  print("SECURITY GATE: PASS");
}

try {
  main();
} catch (err) {
  // Fail closed on ANY unexpected error; never translate an exception into PASS.
  print(`Checker crashed unexpectedly: ${err instanceof Error ? err.message : String(err)}`);
  print("SECURITY GATE: FAIL");
  process.exit(1);
}
