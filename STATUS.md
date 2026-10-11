# ArtXP Implementation Status

Last updated: 2026-10-11
Current milestone: Phase 2 — OpenRouter BYOK gateway
Overall state: Phase 1 complete; Phase 2 in progress

## Phase 1 — Complete

ArtXP has an authenticated FastAPI boundary, SQLite-backed durable profiles and practice entries, private S3-compatible artwork contracts, generated frontend API types, and a user-approved legacy-data migration path.

Phase 1 implementation and local automated verification are complete. Docker/MinIO runtime validation is explicitly deferred and is not a Phase 1 blocker. When durable artwork storage becomes necessary, the project will evaluate a hosted S3-compatible free tier instead of requiring local Docker.

### Phase 1 verification

- Backend Ruff passed.
- 12 Phase 1 backend tests passed.
- Frontend lint, TypeScript, 7 tests, and production build passed.
- 6 Chromium route tests passed.
- Alembic migrations `0001` and `0002` applied from an empty SQLite database.
- Compose structure was validated; its runtime was not executed.

## Phase 2 — In progress

Phase 2 is starting on SQLite and does not require Redis, PostgreSQL, MinIO, or Docker.

### Completed first slice

- [x] Add a centralized backend OpenRouter client.
- [x] Add an authenticated, storage-independent vision test endpoint.
- [x] Accept JPEG, PNG, and WebP images up to 8 MB in memory for the isolated test.
- [x] Send private/local images to OpenRouter as base64 image inputs.
- [x] Request and validate a strict structured response.
- [x] Return model, token/cost usage when supplied, and end-to-end latency.
- [x] Keep the OpenRouter key, image, and result out of SQLite, object storage, API responses, logs, and `localStorage`.
- [x] Add a Settings UI for running the isolated vision test with a user-provided key.
- [x] Add API tests for authentication, MIME validation, ephemeral handling, key non-echo, and upstream errors.

### Phase 2 verification

- Backend Ruff passed.
- 17 backend tests passed, including 5 model-gateway tests.
- Frontend lint, TypeScript, 8 unit/contract tests, and production build passed.
- 6 Chromium route tests passed with the new Settings UI.
- A live OpenRouter request was not run because no user key was supplied; this remains the next manual check.
### Remaining Phase 2 work

- [ ] Test one real vision request with a user-provided OpenRouter key and image.
- [ ] Implement OpenRouter OAuth PKCE connection.
- [ ] Design encrypted manual-key persistence with a development key abstraction and production KMS; do not persist keys before this is ready.
- [ ] Add connect/status/disconnect APIs and UI.
- [ ] Add route policies, safe retries, fallbacks, redaction, and durable usage telemetry.
- [ ] Move daily missions and weekly plans from direct Gemini browser calls to backend structured endpoints.
- [ ] Remove Gemini keys from browser storage after migration/explicit user confirmation.
- [ ] Add user cost, privacy, and model preferences.

## Infrastructure/storage decision

- Default development database: SQLite.
- Local Docker stack: optional and deferred.
- Durable artwork storage: deferred until an analysis workflow needs it.
- Hosted shortlist: Cloudflare R2, Backblaze B2, and Supabase Storage.
- Preliminary fit: Cloudflare R2, because it is S3-compatible and currently includes 10 GB-month, 1 million Class A operations, 10 million Class B operations, and free internet egress on its Standard free tier. No provider has been selected or provisioned yet.
- Research record: `docs/research/hosted-object-storage.md`.

## Credential/storage audit

- No real Gemini, Pixabay, OpenRouter, or OIDC credentials are tracked in the repository.
- Legacy Gemini/Pixabay keys remain in browser `localStorage` under `artxp_settings` until their Phase 2 migration.
- The OpenRouter vision-test key exists only in React component memory and one request path through FastAPI to OpenRouter; ArtXP does not persist or echo it. Production must use HTTPS; plain HTTP is acceptable only on localhost during development.
- Legacy exports explicitly exclude `artxp_settings`.

## Known risks carried forward

- A real OpenRouter call can incur model charges; the test UI displays the chosen model and returns provider usage/cost data when available.
- The isolated endpoint temporarily base64-encodes the image in backend memory; it is deliberately limited to 8 MB and is not the production upload/analysis path.
- Legacy Gemini/Pixabay keys remain readable by same-origin JavaScript until migration.
- XP, streaks, plans, saved references, and mission completion remain browser-local activity state.
- Hosted storage terms and free-tier limits can change and must be rechecked before provisioning.
- The Node 18-compatible frontend toolchain retains documented audit findings.

## Next action

Run the app with SQLite, paste a limited OpenRouter key into the new Settings test, select a non-sensitive drawing, and make one real vision request. After connectivity and structured output are confirmed, implement OpenRouter OAuth PKCE and encrypted credential handling before routing product features through the gateway.
