# Phase 0 browser storage inventory

Last verified: 2026-10-10

All current durable application state is stored under the `artxp_` prefix in browser `localStorage`. This document freezes the current contract so later phases can migrate data intentionally.

## Keys

| Key | Writer/readers | Shape | Migration destination |
|---|---|---|---|
| `artxp_user` | `AppContext`, onboarding, all authenticated routes | `{ goal, goalId, goalEmoji, skillLevel, dailyMinutes, createdAt }` | `users` + `user_profiles` |
| `artxp_skills` | `AppContext`, dashboard, skill cards | Map keyed by skill: `{ name, level, xp }` | activity ledger plus future skill estimates |
| `artxp_streak` | `AppContext`, dashboard, practice log | `{ count, lastDate }` using `Date.toDateString()` | immutable streak/activity events using user timezone |
| `artxp_log` | `AppContext`, practice log | Array of `{ id, date, note, exercise, skill, image }`; `image` is a base64 data URL | `artworks`, `submissions`, and private object storage |
| `artxp_plan` | `AppContext`, practice planner | Generated `{ goal, days[] }` object | exercises/learning plans with prompt and schema versions |
| `artxp_settings` | `AppContext`, settings, model/reference callers | `{ geminiKey, pixabayKey }` | encrypted external credentials; never migrate silently |
| `artxp_saved_refs` | `AppContext`, planner, reference finder | Array of Pixabay photo metadata plus `context` and `savedAt` | saved reference records |
| `artxp_missions` | dashboard | `{ date, data[] }`, where date uses `Date.toDateString()` | daily exercise assignments |
| `artxp_completed` | dashboard | `{ date, data: number[] }` containing mission indexes | immutable completion/XP events |
| `artxp_plan_done` | practice planner | Object keyed by `"{dayIndex}-{exerciseIndex}"` with truthy values | exercise completion events |

## Reset behavior

`resetProgress()` removes all keys beginning with `artxp_`, resets the in-memory user, skills, streak, log, and plan, but does not explicitly reset the in-memory saved references before navigation. Later phases should replace this broad prefix deletion with an authenticated deletion workflow and clear client caches after server confirmation.

## Migration rules

- Never upload stored provider keys during data migration. Ask users to reconnect OpenRouter and Pixabay through the new credential flow.
- Ask for explicit permission before uploading browser-local artwork to the server.
- Hash image bytes to deduplicate retries, but do not treat hashes as authorization.
- Preserve original timestamps when they are parseable; mark ambiguous locale-derived dates as approximate.
- Map existing XP to activity history only. Do not use it as evidence of skill ability.
- Offer JSON export when an automatic migration cannot safely interpret a record.

## Known limitations

- `localStorage` is synchronous and quota-limited.
- Any script executing on the same origin can read stored credentials and artwork.
- Image data URLs cause significant storage expansion.
- Index-based completion IDs become unstable if generated missions/plans are replaced.
- Date strings depend on the browser locale/timezone and are not durable identifiers.
- State has no schema version, ownership, concurrency control, or server backup.
