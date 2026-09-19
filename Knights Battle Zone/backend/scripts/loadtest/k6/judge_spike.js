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
const defaultCode = `#include <bits/stdc++.h>
using namespace std;
int main() {
  cout << "ok";
  return 0;
}`;

export const options = {
  scenarios: {
    submission_spike: {
      executor: "constant-arrival-rate",
      rate: Number(env("SUBMISSION_RATE", "8")),
      timeUnit: "1s",
      duration: env("SUBMISSION_DURATION", "5m"),
      preAllocatedVUs: Number(env("SUBMISSION_PREALLOCATED_VUS", "40")),
      maxVUs: Number(env("SUBMISSION_MAX_VUS", "250")),
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.03"],
    http_req_duration: ["p(95)<2200", "p(99)<5000"],
    submission_latency_ms: ["p(95)<2500"],
    failed_checks_total: ["count<50"],
  },
};

export function setup() {
  return getTokenOrFail();
}

export default function (data) {
  const payload = JSON.stringify({
    problemId,
    language,
    code: env("LOADTEST_CODE", defaultCode),
  });

  const res = http.post(`${data.baseUrl}/api/submissions`, payload, {
    headers: authHeaders(data.token),
    tags: { route: "submission" },
    timeout: env("REQUEST_TIMEOUT", "45s"),
  });

  checkApiResponse(res, "submission");
  sleep(sleepRange(Number(env("SLEEP_MIN_SECONDS", "0.1")), Number(env("SLEEP_MAX_SECONDS", "0.4"))));
}
