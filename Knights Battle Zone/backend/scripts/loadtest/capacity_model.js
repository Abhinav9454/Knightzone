#!/usr/bin/env node

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
}

function ceilSafe(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }
  return Math.ceil(value);
}

const args = parseArgs(process.argv);

const peakRps = toNumber(args["peak-rps"], 1000);
const avgCpuMs = toNumber(args["avg-cpu-ms"], 20);
const apiTargetUtil = toNumber(args["api-util"], 0.65);
const peakSubmissionsPerSec = toNumber(args["subs-per-sec"], 50);
const avgExecutionSeconds = toNumber(args["avg-exec-sec"], 2.5);
const judgeTargetUtil = toNumber(args["judge-util"], 0.75);
const dbMaxConnections = toNumber(args["db-max-connections"], 400);

const apiReplicas = ceilSafe((peakRps * avgCpuMs) / (1000 * apiTargetUtil));
const judgeWorkers = ceilSafe((peakSubmissionsPerSec * avgExecutionSeconds) / judgeTargetUtil);
const dbPoolTotal = Math.floor(dbMaxConnections * 0.7);

console.log("=== 50K Capacity Model ===");
console.log(`peak_rps: ${peakRps}`);
console.log(`avg_cpu_ms_per_req: ${avgCpuMs}`);
console.log(`api_target_utilization: ${apiTargetUtil}`);
console.log(`peak_submissions_per_sec: ${peakSubmissionsPerSec}`);
console.log(`avg_execution_seconds: ${avgExecutionSeconds}`);
console.log(`judge_target_utilization: ${judgeTargetUtil}`);
console.log("");
console.log(`recommended_api_replicas: ${apiReplicas}`);
console.log(`recommended_judge_workers: ${judgeWorkers}`);
console.log(`recommended_db_pool_total_max: ${dbPoolTotal}`);
console.log(
  "note: final sizing must be validated with p95/p99 latency + queue lag from real benchmark runs."
);
