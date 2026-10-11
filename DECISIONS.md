# ArtXP Decision Log

This file is the concise decision index. Detailed decisions live in `docs/architecture/adr/`. Add a new entry instead of rewriting history; if a decision changes, mark the old record superseded and link the replacement.

| ID | Date | Status | Decision | Rationale / record |
|---|---|---|---|---|
| ADR-0001 | 2026-10-10 | Accepted | Keep React/Vite; add a FastAPI modular monolith, PostgreSQL/pgvector, Redis, private object storage, and LangGraph workers | [Platform foundation](./docs/architecture/adr/0001-platform-foundation.md) |
| D-0002 | 2026-10-10 | Accepted | Preserve the current frontend behavior during Phase 0 | Establish tests and documentation before architecture migration |
| D-0003 | 2026-10-10 | Accepted | Treat XP/streaks as activity metrics and future skill estimates as separate evidence-based metrics | Avoid presenting task completion as measured artistic ability |
| D-0004 | 2026-10-10 | Accepted | Use versioned JSON Schema as the boundary for structured AI outputs | Enables validation, model interchangeability, regression tests, and auditable history |
| D-0005 | 2026-10-10 | Accepted | Keep the knowledge graph in PostgreSQL initially | Shallow prerequisites and related-concept traversal do not yet justify another database |
| D-0006 | 2026-10-11 | Accepted | Initialize Git in this directory and use `main` as the baseline branch | Project owner created `LCZhang42/ArtXP`; milestone commits and isolated worktrees can now be used |
| D-0007 | 2026-10-10 | Accepted | Do not force major dependency upgrades during the behavior-preserving baseline | Remaining audit findings are documented and block production until a tested Node/toolchain migration |
| D-0008 | 2026-10-11 | Accepted | Move the unchanged Vite app into `frontend/` before API integration | Keeps the mechanical repository change separate from TypeScript and persistence migrations |
| D-0009 | 2026-10-11 | Accepted | Use a signed HTTP-only development session only in local development | Enables end-to-end API work without inventing password security; production identity remains an explicit provider decision |
| D-0010 | 2026-10-11 | Accepted | Upload artwork bytes directly to private S3-compatible storage through short-lived presigned URLs | Keeps image bytes out of FastAPI, PostgreSQL, browser storage, and request logs |
| D-0011 | 2026-10-11 | Accepted | Use provider-neutral OIDC Authorization Code + PKCE for production identity | Avoid coupling the application to one vendor; production fails closed until issuer/client configuration and secure cookies are supplied |
| D-0012 | 2026-10-11 | Accepted | Generate frontend types from FastAPI OpenAPI and use TanStack Query for server state | Keeps the API contract reviewable and prevents browser-local profile/log data from becoming a second source of truth |
| D-0013 | 2026-10-11 | Accepted | Never include `artxp_settings` in legacy export/import | Gemini and Pixabay keys remain local until Phase 2; credentials must not be silently copied into backups or server records |
| D-0014 | 2026-10-11 | Accepted | Declare Phase 1 implementation complete without Docker runtime validation | SQLite and automated tests cover current development; Docker/MinIO is optional validation, not a milestone gate |
| D-0015 | 2026-10-11 | Accepted | Start Phase 2 on SQLite with an ephemeral OpenRouter vision test | Validates BYOK, multimodal input, schemas, latency, and usage without waiting for durable image storage |
| D-0016 | 2026-10-11 | Proposed | Prefer hosted S3-compatible object storage over local Docker when durable images become necessary | Cloudflare R2 is the preliminary fit; recheck R2, B2, and Supabase limits and privacy before provisioning |

## Decision rules

- Record choices that affect architecture, security, data ownership, external contracts, or migration cost.
- Include alternatives and consequences in an ADR for material decisions.
- Do not store credentials, provider keys, or private endpoints in decision records.
- Reference the decision ID in implementation pull requests or milestone notes.
