#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith("--")) continue;
    const next = argv[i + 1];
    out[key.slice(2)] = !next || next.startsWith("--") ? true : next;
    if (next && !next.startsWith("--")) i += 1;
  }
  return out;
}

function safeReadJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function metricValue(summary, metricName, statKey) {
  return summary?.metrics?.[metricName]?.values?.[statKey] ?? null;
}

function toFixed(value, digits = 2) {
  if (typeof value !== "number" || Number.isNaN(value)) return "n/a";
  return value.toFixed(digits);
}

function scenarioFromFile(fileName) {
  return fileName.replace(/-\d{8}-\d{6}-summary\.json$/, "");
}

function collectLatestByScenario(resultsDir) {
  if (!fs.existsSync(resultsDir)) return new Map();
  const files = fs
    .readdirSync(resultsDir)
    .filter((name) => name.endsWith("-summary.json"))
    .map((name) => ({
      name,
      fullPath: path.join(resultsDir, name),
      mtime: fs.statSync(path.join(resultsDir, name)).mtimeMs,
    }));

  files.sort((a, b) => a.mtime - b.mtime);
  const latest = new Map();
  for (const file of files) {
    latest.set(scenarioFromFile(file.name), file);
  }
  return latest;
}

function buildReportRow(scenario, summary) {
  return {
    scenario,
    p95: metricValue(summary, "http_req_duration", "p(95)"),
    p99: metricValue(summary, "http_req_duration", "p(99)"),
    failed: metricValue(summary, "http_req_failed", "rate"),
    reqRate: metricValue(summary, "http_reqs", "rate"),
    checks: metricValue(summary, "checks", "passes"),
  };
}

function markdownTable(rows) {
  const header =
    "| Scenario | req/s | p95 ms | p99 ms | failed rate | checks(pass) |\n|---|---:|---:|---:|---:|---:|";
  const body = rows
    .map(
      (r) =>
        `| ${r.scenario} | ${toFixed(r.reqRate)} | ${toFixed(r.p95)} | ${toFixed(
          r.p99
        )} | ${toFixed((r.failed ?? 0) * 100, 3)}% | ${toFixed(r.checks, 0)} |`
    )
    .join("\n");
  return `${header}\n${body}\n`;
}

const args = parseArgs(process.argv);
const resultsDir = path.resolve(args["results-dir"] || "backend/scripts/loadtest/results");
const output = path.resolve(
  args["output"] || path.join(resultsDir, `phase7-summary-${Date.now()}.md`)
);

const latest = collectLatestByScenario(resultsDir);
const rows = [];
for (const [scenario, file] of latest.entries()) {
  const summary = safeReadJson(file.fullPath);
  if (!summary) continue;
  rows.push(buildReportRow(scenario, summary));
}

if (rows.length === 0) {
  console.error("No k6 summary files found to aggregate.");
  process.exit(1);
}

rows.sort((a, b) => a.scenario.localeCompare(b.scenario));
const report = [
  "# Phase-7 Load Summary",
  "",
  `Generated at: ${new Date().toISOString()}`,
  "",
  markdownTable(rows),
].join("\n");

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, report, "utf8");
console.log(`Saved load summary: ${output}`);
