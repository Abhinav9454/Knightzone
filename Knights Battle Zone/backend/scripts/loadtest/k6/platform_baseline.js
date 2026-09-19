import http from "k6/http";
import { sleep } from "k6";
import {
  authHeaders,
  checkApiResponse,
  env,
  getTokenOrFail,
  sleepRange,
} from "./common.js";

export const options = {
  scenarios: {
    authenticated_browse: {
      executor: "ramping-vus",
      startVUs: Number(env("BASELINE_START_VUS", "10")),
      stages: [
        { duration: env("BASELINE_STAGE_1_DURATION", "2m"), target: Number(env("BASELINE_STAGE_1_TARGET", "50")) },
        { duration: env("BASELINE_STAGE_2_DURATION", "3m"), target: Number(env("BASELINE_STAGE_2_TARGET", "150")) },
        { duration: env("BASELINE_STAGE_3_DURATION", "2m"), target: Number(env("BASELINE_STAGE_3_TARGET", "0")) },
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<900", "p(99)<1800"],
    failed_checks_total: ["count<20"],
  },
};

const browseRoutes = [
  { path: "/api/contests", tag: "contests" },
  { path: "/api/quizzes", tag: "quizzes" },
  { path: "/api/duels/leaderboard?game=all&limit=50", tag: "duels" },
  { path: "/api/tracker/summary", tag: "tracker" },
];

export function setup() {
  return getTokenOrFail();
}

export default function (data) {
  const headers = authHeaders(data.token);
  const baseUrl = data.baseUrl;

  for (const route of browseRoutes) {
    const res = http.get(`${baseUrl}${route.path}`, {
      headers,
      tags: { route: route.tag },
      timeout: env("REQUEST_TIMEOUT", "30s"),
    });
    checkApiResponse(res, route.tag);
  }

  sleep(sleepRange(Number(env("SLEEP_MIN_SECONDS", "0.3")), Number(env("SLEEP_MAX_SECONDS", "1.2"))));
}
