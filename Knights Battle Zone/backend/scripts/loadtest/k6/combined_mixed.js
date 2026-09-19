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

export const options = {
  scenarios: {
    mixed_browse: {
      executor: "constant-arrival-rate",
      rate: Number(env("COMBINED_BROWSE_RATE", "30")),
      timeUnit: "1s",
      duration: env("COMBINED_DURATION", "10m"),
      preAllocatedVUs: Number(env("COMBINED_BROWSE_VUS", "80")),
      maxVUs: Number(env("COMBINED_BROWSE_MAX_VUS", "300")),
      exec: "browseFlow",
    },
    mixed_submission: {
      executor: "constant-arrival-rate",
      rate: Number(env("COMBINED_SUBMIT_RATE", "4")),
      timeUnit: "1s",
      duration: env("COMBINED_DURATION", "10m"),
      preAllocatedVUs: Number(env("COMBINED_SUBMIT_VUS", "40")),
      maxVUs: Number(env("COMBINED_SUBMIT_MAX_VUS", "220")),
      exec: "submissionFlow",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.03"],
    http_req_duration: ["p(95)<1500", "p(99)<3500"],
    submission_latency_ms: ["p(95)<2500"],
    failed_checks_total: ["count<100"],
  },
};

const browseRoutes = [
  { path: "/api/contests", tag: "contests" },
  { path: "/api/leaderboard/global?limit=50", tag: "leaderboard" },
  { path: "/api/tracker/summary", tag: "tracker" },
  { path: "/api/quizzes", tag: "quizzes" },
];

export function setup() {
  return getTokenOrFail();
}

export function browseFlow(data) {
  const route = browseRoutes[Math.floor(Math.random() * browseRoutes.length)];
  const res = http.get(`${data.baseUrl}${route.path}`, {
    headers: authHeaders(data.token),
    tags: { route: route.tag },
    timeout: env("REQUEST_TIMEOUT", "30s"),
  });
  checkApiResponse(res, route.tag);
  sleep(sleepRange(Number(env("SLEEP_MIN_SECONDS", "0.1")), Number(env("SLEEP_MAX_SECONDS", "0.6"))));
}

export function submissionFlow(data) {
  const payload = JSON.stringify({
    problemId,
    language,
    code: submissionCode,
  });

  const res = http.post(`${data.baseUrl}/api/submissions`, payload, {
    headers: authHeaders(data.token),
    tags: { route: "submission" },
    timeout: env("REQUEST_TIMEOUT", "45s"),
  });
  checkApiResponse(res, "submission");
  sleep(sleepRange(Number(env("SLEEP_MIN_SECONDS", "0.05")), Number(env("SLEEP_MAX_SECONDS", "0.3"))));
}
