# ArtXP Implementation Status

Last updated: 2026-10-11
Current milestone: Phase 1 — Backend foundation and durable user data
Overall state: implementation complete; external environment validation pending

## Phase 1 outcome

ArtXP now has an authenticated FastAPI boundary, durable profiles and practice entries, private direct-to-object-storage artwork uploads, typed frontend API integration, and an explicit legacy-browser-data migration path. The frontend no longer creates new `artxp_user` or `artxp_log` records and no longer stores new artwork as base64.

## Phase 1 checklist

- [x] Move the Vite application into `frontend/` while preserving behavior.
- [x] Create a FastAPI modular monolith with typed settings and generated OpenAPI.
- [x] Add request IDs, JSON logging, liveness, and dependency-aware readiness.
- [x] Add SQLAlchemy models and Alembic migrations for users, profiles, artworks, and practice entries.
- [x] Add a signed HTTP-only development session that is disabled outside development.
- [x] Add standards-based production OIDC login/callback support with Authorization Code + PKCE and fail-closed production configuration.
- [x] Implement authenticated profile and durable practice-entry APIs.
- [x] Implement private artwork upload-intent, completion, download, and deletion contracts.
- [x] Delete practice records and their owned objects when the user resets progress.
- [x] Add PostgreSQL/pgvector, Redis, MinIO, API, and MinIO CORS services to Docker Compose.
- [x] Add TanStack Query, incremental TypeScript, generated API types, and backend connection states.
- [x] Connect onboarding/profile reads and writes to the authenticated API.
- [x] Replace new practice-log base64 writes with direct object-storage uploads.
- [x] Add user-approved legacy profile import and credential-free JSON export.
- [x] Prove ownership isolation for artwork and practice records in API tests.
- [ ] Provision a production OIDC tenant and configure its credentials in a deployment environment.
- [ ] Run the full PostgreSQL/Redis/MinIO topology on a Docker-enabled machine.

The unchecked items are environment provisioning/validation, not unfinished application code.

## Verification log

| Date | Check | Result | Notes |
|---|---|---|---|
| 2026-10-11 | Backend Ruff | Passed | Application, migrations, scripts, and tests clean |
| 2026-10-11 | Backend Pytest | Passed | 12 tests covering health, readiness, auth/profile, artwork lifecycle, practice persistence/reset, authorization, and OpenAPI |
| 2026-10-11 | Frontend `npm run verify` | Passed | ESLint, TypeScript, 7 unit/contract tests, and production build |
| 2026-10-11 | Frontend `npm run test:e2e` | Passed | 6 Chromium routes, including deep-link authentication bootstrap |
| 2026-10-11 | Alembic `upgrade head` | Passed | Migrations `0001` and `0002` applied to a disposable empty SQLite database |
| 2026-10-11 | Compose YAML structure | Passed | Required services, public MinIO endpoint, and CORS bootstrap parsed |
| 2026-10-11 | Docker Compose runtime | Not run | Docker is not installed on this machine |
| 2026-10-11 | Live production OIDC | Not run | Requires a provisioned provider tenant and credentials |

## Credential/storage audit

- No real Gemini, Pixabay, OpenRouter, or OIDC credentials were found in tracked project files.
- `.env.example` files contain examples only; local `.env` files remain ignored.
- Legacy Gemini and Pixabay keys are stored together in browser `localStorage` under `artxp_settings` when the user saves them.
- The legacy JSON export explicitly excludes `artxp_settings`, and a unit test verifies secrets are absent.
- Provider-key migration and OpenRouter BYOK belong to Phase 2.

## Known risks carried forward

- Gemini/Pixabay browser keys remain readable by JavaScript until Phase 2 replaces the model path and designs encrypted BYOK handling.
- XP, streaks, plans, saved references, and mission completion are still legacy activity state in browser storage; they are not evidence-based skill progression.
- Compose contracts are present, but PostgreSQL/Redis/MinIO integration still needs a Docker-enabled verification environment.
- Upload completion validates declared size and MIME metadata; byte decoding, pixel limits, EXIF stripping, derivatives, malware policy, and abandoned-upload cleanup remain future hardening.
- The current Node 18-compatible frontend toolchain has documented audit findings and must be upgraded before public production deployment.
- Authlib/Starlette currently emit an upstream httpx-to-httpx2 deprecation warning during tests; it is non-failing but should be tracked during dependency upgrades.

## Next milestone

Phase 2 starts the OpenRouter model gateway and multimodal analysis slice: secure user-provided-key handling, model capability routing, upload-to-analysis flow, structured schemas, retries/timeouts, and quality/cost/latency telemetry.