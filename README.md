# ArtXP

ArtXP is evolving from a browser-only art-practice prototype into a multimodal learning system. Phase 1 adds an authenticated FastAPI boundary, durable profiles and practice logs, and private direct-to-object-storage artwork uploads.

The production target is in [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md). Current progress is in [STATUS.md](./STATUS.md), and durable choices are in [DECISIONS.md](./DECISIONS.md).

## Run the Phase 1 app locally

The frontend now expects the API. Start the backend first:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. In development, the frontend creates a local-only signed session automatically. SQLite is used by default, so profile and note-only practice data can be tested without Docker. Artwork upload requires S3-compatible storage; use the Compose topology below.

Useful backend endpoints:

- API docs: `http://localhost:8000/docs`
- Liveness: `http://localhost:8000/api/v1/health`
- Readiness: `http://localhost:8000/api/v1/ready`

## Run the full infrastructure

Install Docker Desktop, copy `.env.example` to `.env` if overrides are needed, then run:

```powershell
docker compose up --build
```

This starts PostgreSQL 16 with pgvector, Redis, private MinIO storage, its CORS bootstrap job, and FastAPI. Run Vite separately from `frontend/`. The Compose topology has been structurally validated but has not been daemon-tested on this machine because Docker is unavailable here.

## Production identity

ArtXP supports a provider-neutral OpenID Connect Authorization Code + PKCE flow:

- `GET /api/v1/auth/login`
- `GET /api/v1/auth/callback`
- `POST /api/v1/auth/logout`

Configure `ARTXP_OIDC_ISSUER_URL`, client ID/secret, redirect URI, frontend URL, a strong session secret, and secure cookies. Production startup fails if the required identity/security settings are missing. The development-session endpoint is unavailable outside development.

## Verify

```powershell
cd backend
.\.venv\Scripts\python.exe -m ruff check .
.\.venv\Scripts\python.exe -m pytest
```

```powershell
cd frontend
npm run verify
npm run test:e2e
```

To refresh generated frontend API types after a backend contract change:

```powershell
cd backend
.\.venv\Scripts\python.exe scripts\export_openapi.py ..\frontend\src\api\openapi.json
cd ..\frontend
npm run generate:api
```

## Browser data and API keys

New profile and practice-log records are server-owned. Existing `artxp_user` data can be imported explicitly during onboarding, and users can download a legacy JSON backup. The backup deliberately excludes `artxp_settings`.

Gemini and Pixabay keys from the prototype still live only in that browser's `localStorage` key `artxp_settings`. Do not use valuable unrestricted keys. Phase 2 will replace the direct Gemini path with an OpenRouter gateway and a deliberate BYOK security design.

## Repository map

```text
frontend/                    React/Vite UI, typed API client, and browser tests
backend/app/                 FastAPI modular-monolith application
backend/migrations/          Alembic database migrations
backend/tests/               API, persistence, and authorization tests
infra/minio/                 Local object-storage CORS configuration
docs/architecture/adr/       Architecture decision records
docs/contracts/              Versioned AI output JSON Schemas
docs/current-state/          Baseline/migration inventories
docs/screenshots/            Browser-generated UI baseline
docker-compose.yml           PostgreSQL, Redis, MinIO, and API
IMPLEMENTATION_PLAN.md       Product and technical roadmap
STATUS.md                    Live milestone status and verification
DECISIONS.md                 Durable decision index
```

## Current limitations

- Production OIDC and the full Compose topology require external provider/Docker environments for live validation.
- Legacy XP, streak, plan, reference, and mission state remains browser-local pending later activity/skill-progression work.
- Gemini and Pixabay keys remain browser-local until Phase 2; they are never included in the migration export.
- XP represents activity, not evidence-based artistic skill.
- Dependency audit findings and upload hardening work are tracked in [STATUS.md](./STATUS.md).