# Phase 0 UI baseline screenshots

The Playwright smoke suite writes one full-page screenshot for onboarding and each existing-user route:

- `onboarding.png`
- `dashboard.png`
- `planner.png`
- `references.png`
- `practice-log.png`
- `settings.png`

Regenerate them with:

```powershell
cd frontend
npm run test:e2e
```

The tests use a fixed local user fixture and do not use real Gemini or Pixabay credentials. Screenshots are a review aid, not pixel-diff golden files; route visibility assertions are the Phase 0 browser gate.
