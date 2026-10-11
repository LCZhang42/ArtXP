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

## Decision rules

- Record choices that affect architecture, security, data ownership, external contracts, or migration cost.
- Include alternatives and consequences in an ADR for material decisions.
- Do not store credentials, provider keys, or private endpoints in decision records.
- Reference the decision ID in implementation pull requests or milestone notes once Git is available.
