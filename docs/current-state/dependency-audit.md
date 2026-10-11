# Phase 0 dependency audit disposition

Audit date: 2026-10-10  
Runtime: Node.js 18.15.0 / npm 9.5.0

## Results after non-breaking fixes

- Full dependency tree: 15 findings — 7 moderate, 6 high, and 2 critical.
- Production dependencies only: 2 moderate findings, both in the React Router 6 dependency chain.
- No `npm audit fix --force` was run.

## Remaining production findings

React Router 6 is affected by open-redirect/XSS and SSR hydration advisories according to the npm audit result. The current application does not use React Router's SSR hydration APIs or navigate to user-controlled destinations, which limits exposure, but does not remove the dependency finding. npm proposes React Router 7 as a breaking fix.

Disposition: migrate and test React Router 7 before any public production deployment. Keep all navigation destinations application-owned until then.

## Remaining development-tool findings

The critical/high findings are transitive through the Node 18-compatible Vite 5, Vitest 2, and Tailwind 3 toolchain. The available npm fixes require breaking upgrades such as Vite 8, Vitest 5, and Tailwind 4; those releases also require a newer Node runtime in this environment.

Disposition:

- Do not expose Vite, Vitest UI, or other development servers to untrusted networks.
- Run tests only against trusted repository code and fixtures.
- Upgrade the project runtime to a supported Node 20+ LTS release before Phase 1 is deployed.
- Perform Vite/Vitest/Tailwind/React Router upgrades as an isolated migration with the Phase 0 smoke suite as the safety net.
- Re-run `npm audit` after that migration and require zero critical/high production findings before release.

## Non-breaking updates applied

`npm audit fix` updated packages allowed by existing semver ranges. Playwright was then pinned to `1.55.1`, the earliest patched release for its reported browser-download advisory and one that supports Node 18, because the newest automatically selected release required Node 20.
