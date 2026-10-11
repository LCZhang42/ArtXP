# ArtXP

ArtXP is evolving from a browser-only art-practice prototype into a multimodal learning system. The current UI supports onboarding, daily missions, weekly plans, Pixabay reference discovery, practice uploads, XP, streaks, and local progress tracking. Phase 1 adds a durable FastAPI boundary, profile persistence, and private object-storage upload contracts.

The production target is specified in [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md). Current progress is in [STATUS.md](./STATUS.md), and durable choices are in [DECISIONS.md](./DECISIONS.md).

## View the current app

The frontend works now; the backend is not required to explore the existing prototype.

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The prototype asks for Gemini and Pixabay keys in Settings for its legacy AI/reference features. Use only development keys with limited quota because those legacy keys remain in browser storage until Phase 2.

## Test the frontend

```powershell
cd frontend
npm run verify
npm run test:e2e
```

`verify` runs ESLint, six unit/contract tests, and a production build. The Playwright suite checks onboarding and all five existing-user routes.

## Run the backend without Docker

Python 3.12–3.14 is supported. This mode uses a local SQLite database and does not require Redis or object storage for health/profile testing.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Open:

- API documentation: `http://localhost:8000/docs`
- Liveness: `http://localhost:8000/api/v1/health`
- Readiness: `http://localhost:8000/api/v1/ready`

Create the local-only signed development session with `POST /api/v1/auth/dev-session`. That endpoint returns an HTTP-only cookie and is disabled when `ARTXP_ENVIRONMENT` is not `development`.

Run backend checks with:

```powershell
cd backend
.\.venv\Scripts\python.exe -m ruff check .
.\.venv\Scripts\python.exe -m pytest
```

## Run the Phase 1 infrastructure

Install Docker Desktop first, then run:

```powershell
docker compose up --build
```

This starts:

- PostgreSQL 16 with pgvector on port 5432
- Redis on port 6379
- private MinIO object storage on ports 9000/9001
- FastAPI on port 8000

Run the Vite frontend separately from `frontend/` for fast refresh. The Compose topology is defined but has not been daemon-tested on this machine because Docker is not installed.

## Repository map

```text
frontend/                    React/Vite application and browser tests
backend/app/                 FastAPI modular-monolith application
backend/migrations/          Alembic database migrations
backend/tests/               API and persistence tests
docs/architecture/adr/       Architecture decision records
docs/contracts/              Versioned AI output JSON Schemas
docs/current-state/          Baseline implementation inventory
docs/screenshots/            Browser-generated UI baseline
docker-compose.yml           PostgreSQL, Redis, MinIO, and API
IMPLEMENTATION_PLAN.md       Product and technical roadmap
STATUS.md                    Live milestone status and verification
DECISIONS.md                 Durable decision index
```

## Current limitations

- The frontend still uses browser-local state and has not yet been connected to the Phase 1 API.
- The signed development session is only a local bootstrap mechanism, not production identity.
- New practice-log images still use base64 browser storage until the upload API is integrated.
- Gemini and Pixabay keys still use browser storage until the OpenRouter gateway work in Phase 2.
- XP represents activity and is not yet evidence-based skill progression.
- Production infrastructure and access-control integration still require Docker-backed verification.

See [the local storage inventory](./docs/current-state/local-storage.md) for migration details.