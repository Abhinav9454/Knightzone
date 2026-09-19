import http from "k6/http";
import { sleep } from "k6";
import {
  authHeaders,
  checkApiResponse,
  env,
  getTokenOrFail,
  sleepRange,
} from "./common.js";

const problemId = Number(env("LOADTEST_PROBLEM_ID", "9"));
const language = env("LOADTEST_LANGUAGE", "cpp");
const submissionCode = env(
  "LOADTEST_CODE",
  `#include <iostream>
using namespace std;
int main() { cout << "ok"; return 0; }`
);

const routes = [
  { path: "/api/dashboard/summary", tag: "dashboard" },
  { path: "/api/contests", tag: "contests" },
  { path: "/api/tracker/summary", tag: "tracker" },
  { path: "/api/duels/leaderboard?game=all&limit=25", tag: "duels" },
];

export const options = {
  scenarios: {
    soak_read_heavy: {
      executor: "ramping-vus",
      startVUs: Number(env("SOAK_START_VUS", "20")),
      stages: [
        { duration: env("SOAK_RAMP_UP", "20m"), target: Number(env("SOAK_TARGET_VUS", "120")) },
        { duration: env("SOAK_STEADY", "60m"), target: Number(env("SOAK_TARGET_VUS", "120")) },
        { duration: env("SOAK_RAMP_DOWN", "10m"), target: 0 },
      ],
      gracefulRampDown: "1m",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<1400", "p(99)<3200"],
    failed_checks_total: ["count<120"],
  },
};

export function setup() {
  return getTokenOrFail();
}

export default function (data) {
  const headers = authHeaders(data.token);
  const route = routes[Math.floor(Math.random() * routes.length)];

  const readRes = http.get(`${data.baseUrl}${route.path}`, {
    headers,
    tags: { route: route.tag },
    timeout: env("REQUEST_TIMEOUT", "30s"),
  });
  checkApiResponse(readRes, route.tag);

  if (__ITER % Number(env("SOAK_SUBMISSION_EVERY", "12")) === 0) {
    const payload = JSON.stringify({
      problemId,
      language,
      code: submissionCode,
    });
    const submitRes = http.post(`${data.baseUrl}/api/submissions`, payload, {
      headers,
      tags: { route: "submission" },
      timeout: env("REQUEST_TIMEOUT", "45s"),
    });
    checkApiResponse(submitRes, "submission");
  }

  sleep(sleepRange(Number(env("SLEEP_MIN_SECONDS", "0.2")), Number(env("SLEEP_MAX_SECONDS", "0.8"))));
}
