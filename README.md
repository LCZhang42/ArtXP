# ArtXP

ArtXP is a React/Vite prototype for personalized art practice. The current app supports onboarding, daily AI missions, weekly plans, Pixabay reference discovery, practice uploads, XP, streaks, and local progress tracking.

The production upgrade is specified in [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md). Current milestone progress is recorded in [STATUS.md](./STATUS.md), and durable architectural choices are recorded in [DECISIONS.md](./DECISIONS.md).

## Current architecture

- React 18 and React Router
- Vite 5
- Tailwind CSS 3
- Direct browser calls to Gemini and Pixabay
- Browser `localStorage` for all user data and settings

This is the Phase 0 baseline, not the intended production architecture. In later phases, FastAPI, PostgreSQL/pgvector, Redis, private object storage, and an OpenRouter model gateway will replace browser-only persistence and direct model calls.

## Prerequisites

- Node.js 18.15 or later in the Node 18 line
- npm 9 or later
- Chromium installed through Playwright for end-to-end tests

## Setup

```powershell
npm install
npx playwright install chromium
Copy-Item .env.example .env
npm run dev
```

Open `http://localhost:5173`.

No environment variables are required in Phase 0. The prototype currently asks users to enter Gemini and Pixabay keys in Settings. Those keys are stored in browser storage; use only development keys with limited quota. Phase 2 removes this legacy credential path.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production frontend build |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint over JavaScript and JSX |
| `npm run test` | Run Vitest component and contract tests once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:e2e` | Run Playwright route smoke tests and refresh screenshots |
| `npm run verify` | Run lint, unit tests, and production build |

## Browser smoke tests and screenshots

Playwright covers onboarding and all five existing-user routes. It seeds only the minimum local user fixture and does not call Gemini or Pixabay. Passing runs write baseline images to [`docs/screenshots`](./docs/screenshots/README.md).

## Repository map

```text
src/                         React application
e2e/                         Playwright browser smoke tests
docs/architecture/adr/       Architecture decision records
docs/contracts/              Versioned AI output JSON Schemas
docs/current-state/          Phase 0 implementation inventory
docs/screenshots/            Browser-generated UI baseline
IMPLEMENTATION_PLAN.md       Product and technical roadmap
STATUS.md                    Live milestone status and verification
DECISIONS.md                 Durable decision index
```

## Current limitations

- There is no real account authentication.
- All durable data is browser-local.
- Uploaded practice images are stored as base64 in `localStorage`.
- Gemini and Pixabay keys are stored in `localStorage` and used directly by browser code.
- AI JSON is prompt-shaped rather than schema-enforced by an API boundary.
- XP represents activity and is not yet evidence-based skill progression.

See [the local storage inventory](./docs/current-state/local-storage.md) for migration details.

## Working agreement

Implement one milestone at a time. Treat `IMPLEMENTATION_PLAN.md` as the target, `STATUS.md` as the current truth, and `DECISIONS.md`/ADRs as the record of choices. Run `npm run verify` after each frontend milestone and repair failures before moving on.
