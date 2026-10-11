# Browser storage inventory after Phase 1

Last verified: 2026-10-11

Phase 1 moved identity/profile data, practice entries, and new artwork bytes behind the authenticated API. The remaining `artxp_` keys are legacy or client-only state; they are not all long-term contracts.

## Keys

| Key | Phase 1 behavior | Destination / next action |
|---|---|---|
| `artxp_user` | Legacy read/import only; no new writes. Removed only after a successful user-approved profile import. | `users` + `user_profiles` |
| `artxp_log` | Legacy export only; no new writes. New practice entries use the API and object storage. | `practice_entries` + `artworks` |
| `artxp_skills` | Still read/written locally as activity XP. | Activity ledger; future skill estimates remain separate |
| `artxp_streak` | Still read/written locally. | Server activity events using user timezone |
| `artxp_plan` / `artxp_plan_done` | Still local. | Versioned learning plans and completion events |
| `artxp_saved_refs` | Still local. | Saved reference records |
| `artxp_missions` / `artxp_completed` | Still local. | Daily assignments and completion events |
| `artxp_settings` | Still local and contains `{ geminiKey, pixabayKey }`. Explicitly excluded from legacy export. | Phase 2 OpenRouter/BYOK design; never migrate silently |

## Credential audit

The Settings form writes Gemini and Pixabay keys together as JSON under `artxp_settings` for the current browser origin. The keys are not in the repository, backend database, generated OpenAPI document, or legacy backup. Because any same-origin JavaScript can read `localStorage`, users should use limited development keys until Phase 2 replaces this design.

## Reset behavior

“Reset all progress” now deletes the authenticated user's durable practice entries and their uploaded objects, clears the server profile, invalidates the relevant query caches, and clears `artxp_` browser state. Other users' data is excluded by ownership filters.

## Migration rules

- Never upload stored provider keys during data migration.
- Ask for explicit permission before importing browser-local profile or artwork data.
- Hash image bytes to deduplicate retries, but never treat hashes as authorization.
- Preserve original timestamps when parseable and mark ambiguous dates approximate.
- Map legacy XP to activity history only, not artistic ability.
- Offer a credential-free JSON export when automatic migration is unsafe.

## Remaining limitations

- `localStorage` is synchronous, quota-limited, and readable by any same-origin script.
- Remaining local activity objects have no schema version, ownership, concurrency control, or server backup.
- Locale-derived dates and index-based completion IDs are not durable identifiers.