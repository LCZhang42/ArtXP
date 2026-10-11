# Frontend dependency audit disposition

Audit date: 2026-10-11
Runtime: Node.js 18.15.0 / npm 9.5.0

## Current result

- Full dependency tree: 25 findings — 7 moderate, 16 high, and 2 critical.
- The count increased after adding TypeScript, ESLint TypeScript support, TanStack Query, and the OpenAPI type generator; most findings remain in the Node 18-compatible development toolchain.
- No `npm audit fix --force` was run.
- `openapi-typescript` is pinned to `6.7.6`, the compatible line used with the current Node runtime.

## Disposition

React Router 6 and the legacy Vite/Vitest/Tailwind toolchain require breaking upgrades for the available fixes. Current navigation targets are application-owned, and development servers must not be exposed to untrusted networks, but these constraints do not remove the findings.

Before public production deployment:

- Upgrade the project runtime to a currently supported Node LTS release.
- Migrate and test Vite, Vitest, Tailwind, React Router, ESLint, TypeScript tooling, Playwright, and the OpenAPI generator as one isolated toolchain change.
- Re-run the Phase 0/1 unit, contract, browser, and production-build suites.
- Re-run `npm audit` and require zero critical/high production findings.

Do not use `npm audit fix --force` on the current branch; it would mix breaking toolchain changes into the persistence milestone.
