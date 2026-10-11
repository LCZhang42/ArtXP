# ArtXP Implementation Status

Last updated: 2026-10-11
Current milestone: Phase 1 — Backend foundation and durable user data
Overall state: in progress

## Current objective

Introduce durable server-side identity, profiles, and private artwork storage without breaking the verified Phase 0 frontend. The first foundation increment is complete; frontend API integration and data migration remain.

## Phase 1 checklist

- [x] Move the existing Vite application into `frontend/` without changing behavior.
- [x] Create a FastAPI application with typed settings and generated OpenAPI.
- [x] Add JSON logging, request IDs, liveness, and dependency-aware readiness.
- [x] Add SQLAlchemy models and Alembic migration for users, profiles, and artworks.
- [x] Add a signed HTTP-only development session that is disabled outside development.
- [x] Implement `GET /me` and `PATCH /me/profile`.
- [x] Implement private artwork upload-intent, completion, metadata, and deletion endpoints.
- [x] Add PostgreSQL/pgvector, Redis, MinIO, and API services to Docker Compose.
- [x] Add backend linting and API tests.
- [ ] Select and integrate the production identity provider.
- [ ] Run the full Compose topology against Docker.
- [ ] Migrate the frontend incrementally to TypeScript, TanStack Query, and generated API types.
- [ ] Connect onboarding/profile reads and writes to the authenticated API.
- [ ] Replace new practice-log base64 writes with direct object-storage uploads.
- [ ] Add a user-approved migration/export path for existing browser-local data.
- [ ] Prove cross-session persistence and cross-user authorization against PostgreSQL/MinIO.

## Verification log

| Date | Check | Result | Notes |
|---|---|---|---|
| 2026-10-11 | Backend Ruff | Passed | All application, migration, and test files clean |
| 2026-10-11 | Backend Pytest | Passed | 7 API tests: health, request IDs, readiness, auth, profile, artwork lifecycle, limits, OpenAPI |
| 2026-10-11 | Frontend `npm run verify` | Passed | ESLint clean; 6 tests passed; production build succeeded after move |
| 2026-10-11 | Frontend `npm run test:e2e` | Passed | 6 Chromium route tests passed from `frontend/` |
| 2026-10-11 | Alembic `upgrade head` | Passed | Initial schema applied to a disposable SQLite database |
| 2026-10-11 | Compose YAML structure | Passed | Required services parsed; daemon execution unavailable |
| 2026-10-11 | Docker Compose runtime | Not run | Docker is not installed on this machine |

## Current known risks

- The frontend is not connected to the API yet; its current user data and images remain browser-local.
- The development session is deliberately not production authentication. A hosted identity provider or reviewed authentication library must replace it before deployment.
- Compose syntax and service contracts are present, but the PostgreSQL/Redis/MinIO integration needs a Docker-enabled verification environment.
- Upload completion verifies object size and declared MIME metadata; magic-byte decoding, pixel limits, EXIF stripping, derivatives, malware policy, and abandoned-upload cleanup remain.
- Gemini and Pixabay credentials remain in `localStorage` until Phase 2.
- Dependency audit findings remain documented in `docs/current-state/dependency-audit.md`; do not use `npm audit fix --force`.

## Next implementation increment

1. Choose the production identity provider and document the session contract.
2. Generate a typed frontend client from FastAPI OpenAPI.
3. Add TanStack Query and migrate onboarding/profile persistence to `/me`.
4. Integrate the practice-log upload flow with presigned object-storage URLs.
5. Add explicit browser-data import/export consent and cross-user integration tests.