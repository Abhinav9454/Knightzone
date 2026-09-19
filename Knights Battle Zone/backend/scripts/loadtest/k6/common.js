import http from "k6/http";
import { check } from "k6";
import { Counter, Trend } from "k6/metrics";

export const authLatency = new Trend("auth_latency_ms", true);
export const contestsLatency = new Trend("contests_latency_ms", true);
export const quizzesLatency = new Trend("quizzes_latency_ms", true);
export const duelsLatency = new Trend("duels_latency_ms", true);
export const trackerLatency = new Trend("tracker_latency_ms", true);
export const submissionLatency = new Trend("submission_latency_ms", true);
export const failedChecks = new Counter("failed_checks_total");

export function env(name, fallback = "") {
  const value = __ENV[name];
  return value === undefined || value === null || value === "" ? fallback : value;
}

export function parseJson(res) {
  try {
    return res.json();
  } catch (error) {
    return null;
  }
}

export function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function checkOrCount(res, assertions) {
  const ok = check(res, assertions);
  if (!ok) {
    failedChecks.add(1);
  }
  return ok;
}

function registerUser(baseUrl, email, password) {
  const registerBody = JSON.stringify({
    name: env("LOADTEST_NAME", "Load Test User"),
    email,
    password,
    role: env("LOADTEST_ROLE", "STUDENT"),
  });

  const registerRes = http.post(`${baseUrl}/api/auth/register`, registerBody, {
    headers: { "Content-Type": "application/json" },
    tags: { route: "register" },
  });

  authLatency.add(registerRes.timings.duration);

  checkOrCount(registerRes, {
    "register status is 200/201/409": (r) => [200, 201, 409].includes(r.status),
  });
}

function loginUser(baseUrl, email, password) {
  const loginBody = JSON.stringify({ email, password });
  const loginRes = http.post(`${baseUrl}/api/auth/login`, loginBody, {
    headers: { "Content-Type": "application/json" },
    tags: { route: "login" },
  });
  authLatency.add(loginRes.timings.duration);

  checkOrCount(loginRes, {
    "login status is 200": (r) => r.status === 200,
  });

  const payload = parseJson(loginRes);
  return payload?.token || payload?.accessToken || "";
}

export function getTokenOrFail() {
  const baseUrl = env("BASE_URL", "http://localhost:8080");
  const tokenFromEnv = env("LOADTEST_TOKEN");
  if (tokenFromEnv) {
    return { baseUrl, token: tokenFromEnv };
  }

  const email = env("LOADTEST_EMAIL", "");
  const password = env("LOADTEST_PASSWORD", "");
  if (!email || !password) {
    throw new Error(
      "No token available. Set LOADTEST_TOKEN or both LOADTEST_EMAIL and LOADTEST_PASSWORD."
    );
  }

  if (env("LOADTEST_AUTO_REGISTER", "false") === "true") {
    registerUser(baseUrl, email, password);
  }

  const token = loginUser(baseUrl, email, password);
  if (!token) {
    throw new Error("Login succeeded but token was empty. Check backend auth response contract.");
  }
  return { baseUrl, token };
}

export function sleepRange(minSeconds, maxSeconds) {
  const min = Number(minSeconds);
  const max = Number(maxSeconds);
  const duration = Math.random() * (max - min) + min;
  return duration;
}

export function isSuccessStatus(status) {
  return status >= 200 && status < 300;
}

export function trackLatency(route, durationMs) {
  if (route === "contests") contestsLatency.add(durationMs);
  if (route === "quizzes") quizzesLatency.add(durationMs);
  if (route === "duels") duelsLatency.add(durationMs);
  if (route === "tracker") trackerLatency.add(durationMs);
  if (route === "submission") submissionLatency.add(durationMs);
}

export function checkApiResponse(res, route) {
  const ok = checkOrCount(res, {
    [`${route} status is 2xx`]: (r) => isSuccessStatus(r.status),
  });
  trackLatency(route, res.timings.duration);
  return ok;
}
