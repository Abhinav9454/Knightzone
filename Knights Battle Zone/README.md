# Knights Battle Zone

## Overview

Knights Battle Zone is a full-stack college coding and career platform with a React frontend and a Spring Boot backend. The local Docker stack now runs in a unified app mode where code execution is embedded inside the backend container, and resume parsing gracefully falls back to in-process validation when an external parser is not configured.

## Project Structure

- `frontend/`: React + TypeScript app built with Vite and Tailwind
- `backend/`: main Spring Boot API
- `backend/judge-service/`: legacy judge source retained for embedded backend builds
- `backend/resume-parser-service/`: optional legacy parser service source, not required for local Docker run
- `backend/mysql-init/`: MySQL bootstrap SQL
- `backend/infra/`: Kubernetes and observability manifests
- `backend/scripts/`: backend, integration, verification, rebuild, load-test, and ops helpers
- `docker-compose.yml`: local orchestration entry point

## Core Flow

1. `frontend` calls backend APIs under `/api`.
2. `backend` handles auth, contests, quizzes, submissions, leaderboard, typing, placement, clubs, marketplace, and related modules.
3. Submission requests are executed by the backend's embedded judge runtime in Docker mode.
4. Judge results are persisted back in backend and surfaced to users through API plus realtime updates.
5. Placement workflows use local validation by default and can optionally call an external parser if configured.

## Main Features

- Coding contests, problem solving, submissions, leaderboard, and realtime verdict updates
- Placement features for students, companies, and TPO workflows
- Resume parsing and placement dashboard support
- Clubs, community, rankings, and engagement modules
- Marketplace passage publishing, rating, bookmarking, and moderation
- Typing, tracker, duel, quiz, and adaptive-learning style modules already present in backend/frontend code

## Data and Infra

- Primary database: MySQL
- Cache and hot-path storage: Redis
- Queue and messaging: RabbitMQ
- Local stack orchestration: Docker Compose
- Scale-out baseline: Kubernetes manifests under `backend/infra/k8s`
- Observability baseline: `backend/infra/observability`

## Local Run

### Docker Compose

Run the full stack from the repo root:

```bash
docker compose up --build
```

Important compose paths:

- backend build context: `./backend`
- mysql init mount: `./backend/mysql-init`
- frontend build context: `./frontend`

### Frontend Only

```bash
cd frontend
npm ci
npm run dev
```

### Backend Only

```bash
cd backend
mvn test
```

## Build and Rebuild Scripts

Useful scripts from repo root:

- `frontend/scripts/build-frontend.ps1`
- `frontend/scripts/build-frontend.sh`
- `backend/scripts/clean-artifacts.ps1`
- `backend/scripts/clean-artifacts.sh`
- `backend/scripts/clean-and-rebuild.ps1`
- `backend/scripts/clean-and-rebuild.sh`
- `backend/scripts/check_connections.ps1`
- `backend/scripts/check_connections.sh`
- `backend/scripts/check_git_health.ps1`
- `backend/scripts/check_git_health.sh`
- `backend/scripts/run-integration-tests.ps1`
- `backend/scripts/run-integration-tests.sh`

## Testing

### Frontend

```bash
cd frontend
npm run test
```

### Backend Unit Tests

```bash
cd backend
mvn test
```

### Backend Integration Tests

PowerShell:

```powershell
./backend/scripts/run-integration-tests.ps1 -Suite all
./backend/scripts/run-integration-tests.ps1 -Suite smoke
./backend/scripts/run-integration-tests.ps1 -Suite marketplace
./backend/scripts/run-integration-tests.ps1 -Suite placement
./backend/scripts/run-integration-tests.ps1 -Suite stream
./backend/scripts/run-integration-tests.ps1 -Suite security
./backend/scripts/run-integration-tests.ps1 -Suite clubs
./backend/scripts/run-integration-tests.ps1 -Suite core
```

Bash:

```bash
./backend/scripts/run-integration-tests.sh all
./backend/scripts/run-integration-tests.sh smoke
./backend/scripts/run-integration-tests.sh marketplace
./backend/scripts/run-integration-tests.sh placement
./backend/scripts/run-integration-tests.sh stream
./backend/scripts/run-integration-tests.sh security
./backend/scripts/run-integration-tests.sh clubs
./backend/scripts/run-integration-tests.sh core
```

Notes:

- Docker is required for integration tests using Testcontainers and local stack validation.
- Cleanup helpers remove generated outputs such as `frontend/dist`, `backend/target`, and legacy judge build artifacts.

## Frontend Build and Deployment

### Development

```bash
cd frontend
npm ci
npm run dev
```

### Production Build

Recommended:

```bash
./frontend/scripts/build-frontend.sh
```

or on PowerShell:

```powershell
.\frontend\scripts\build-frontend.ps1
```

Manual:

```bash
cd frontend
npm ci --no-audit
npm run build
npm run preview
```

### Frontend Deployment Notes

- Local or CI deployment can use Docker Compose.
- Production frontend image can be built from `frontend/Dockerfile.prod`.
- `frontend/nginx.conf` and `frontend/nginx-site.conf` contain runtime web-server settings.
- Main envs:
  - `API_UPSTREAM_URL`
  - `VITE_API_BASE_URL`
  - `VITE_API_PROXY_TARGET`

## Security and Runtime Notes

- Auth uses JWT access and refresh flow.
- Authorization is role-based.
- Judge service is isolated and runs with restricted container settings.
- Backend supports centralized error responses and rate limiting on selected flows.
- Realtime updates use WebSocket/STOMP with reconnect and polling fallback behavior.

## Marketplace Notes

- APIs under `/api/passages/*`
- Supports creation, discovery, rating, bookmarking, and moderation
- Includes featured, trending, and new style discovery
- Moderation workflow supports reporting and admin review

## Placement Notes

- APIs under `/api/placement/*`
- Student, company, and TPO support
- Resume parsing works without a parser microservice; `RESUME_PARSER_URL` is optional
- Student dashboard and placement-readiness related backend/frontend flows are already present

## Load Testing and Scale

Load-test utilities are under `backend/scripts/loadtest/`:

- k6 scenarios
- wrapper scripts for PowerShell and Bash
- aggregation and capacity model helpers

Production-scale notes:

- Kubernetes manifests live in `backend/infra/k8s`
- Observability manifests live in `backend/infra/observability`
- Existing repo materials reference 50K-scale readiness, canary verification, queue scaling, judge autoscaling, alerts, and go-live gate flows

## Operational Commands

Examples:

```bash
docker compose up --build
docker compose down -v --remove-orphans
```

```powershell
./backend/scripts/clean-and-rebuild.ps1
./backend/scripts/check_connections.ps1
./backend/scripts/check_git_health.ps1
```

```bash
./backend/scripts/clean-and-rebuild.sh
./backend/scripts/check_connections.sh
./backend/scripts/check_git_health.sh
```

## Contributing Guidance

- Prefer keeping frontend API calls centralized in `frontend/src/lib/api.ts`
- Keep shared frontend contracts in `frontend/src/lib/types.ts`
- Follow the repo structure already present under `frontend/src` and `backend/src`
- Use the existing scripts for cleanup, rebuilds, verification, and integration testing

## Documentation Policy

This repository now keeps documentation consolidated in this single `README.md`. Older scattered markdown docs were intentionally removed to keep maintenance simple.

