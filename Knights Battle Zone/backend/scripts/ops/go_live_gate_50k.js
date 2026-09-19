#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith("--")) continue;
    const next = argv[i + 1];
    args[key.slice(2)] = !next || next.startsWith("--") ? true : next;
    if (next && !next.startsWith("--")) i += 1;
  }
  return args;
}

function toNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function latestSummaryFile(resultsDir, scenario) {
  if (!fs.existsSync(resultsDir)) return null;
  const prefix = `${scenario}-`;
  const candidates = fs
    .readdirSync(resultsDir)
    .filter((name) => name.startsWith(prefix) && name.endsWith("-summary.json"))
    .map((name) => ({
      name,
      fullPath: path.join(resultsDir, name),
      mtime: fs.statSync(path.join(resultsDir, name)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);
  return candidates[0] || null;
}

function metric(summary, metricName, stat) {
  return summary?.metrics?.[metricName]?.values?.[stat] ?? null;
}

function readSummary(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return null;
  }
}

function fail(message) {
  console.error(`[go-live-gate] FAIL: ${message}`);
}

const args = parseArgs(process.argv);
const resultsDir = path.resolve(args["results-dir"] || "backend/scripts/loadtest/results");
const requireAll = args["require-all"] !== "false";
const outFile = path.resolve(args.out || path.join(resultsDir, "go-live-gate-report.json"));

const checks = [
  { scenario: "platform_baseline", p95: 350, p99: 900, failRate: 0.005 },
  { scenario: "combined_mixed", p95: 600, p99: 1500, failRate: 0.01 },
  { scenario: "judge_spike", p95: 800, p99: 2000, failRate: 0.02 },
  { scenario: "long_soak", p95: 700, p99: 1800, failRate: 0.01 }
];

let hasFailure = false;
const report = {
  generatedAt: new Date().toISOString(),
  resultsDir,
  status: "PASS",
  scenarios: [],
};

console.log(`[go-live-gate] Using results dir: ${resultsDir}`);
for (const check of checks) {
  const latest = latestSummaryFile(resultsDir, check.scenario);
  if (!latest) {
    const message = `Missing summary for scenario '${check.scenario}'`;
    if (requireAll) {
      fail(message);
      hasFailure = true;
    } else {
      console.warn(`[go-live-gate] WARN: ${message}`);
    }
    continue;
  }

  const summary = readSummary(latest.fullPath);
  if (!summary) {
    fail(`Cannot parse summary file ${latest.fullPath}`);
    hasFailure = true;
    continue;
  }

  const p95 = toNumber(metric(summary, "http_req_duration", "p(95)"), NaN);
  const p99 = toNumber(metric(summary, "http_req_duration", "p(99)"), NaN);
  const failRate = toNumber(metric(summary, "http_req_failed", "rate"), NaN);

  const row = `[${check.scenario}] p95=${p95.toFixed(2)}ms p99=${p99.toFixed(2)}ms failed=${(failRate * 100).toFixed(3)}%`;
  console.log(`[go-live-gate] ${row}`);
  const scenarioReport = {
    scenario: check.scenario,
    thresholds: {
      p95: check.p95,
      p99: check.p99,
      failRate: check.failRate,
    },
    actual: {
      p95,
      p99,
      failRate,
    },
    passed: true,
    sourceFile: latest.fullPath,
  };

  if (!Number.isFinite(p95) || p95 > check.p95) {
    fail(`${check.scenario} p95 breach. limit=${check.p95} actual=${p95}`);
    hasFailure = true;
    scenarioReport.passed = false;
  }
  if (!Number.isFinite(p99) || p99 > check.p99) {
    fail(`${check.scenario} p99 breach. limit=${check.p99} actual=${p99}`);
    hasFailure = true;
    scenarioReport.passed = false;
  }
  if (!Number.isFinite(failRate) || failRate > check.failRate) {
    fail(`${check.scenario} failed-rate breach. limit=${check.failRate} actual=${failRate}`);
    hasFailure = true;
    scenarioReport.passed = false;
  }
  report.scenarios.push(scenarioReport);
}

if (hasFailure) {
  report.status = "FAIL";
}
try {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(`[go-live-gate] report written: ${outFile}`);
} catch (writeError) {
  fail(`Unable to write report file ${outFile}: ${writeError.message}`);
  hasFailure = true;
  report.status = "FAIL";
}

if (hasFailure) {
  console.error("[go-live-gate] Release gate failed.");
  process.exit(1);
}

console.log("[go-live-gate] PASS: all configured gates satisfied.");
