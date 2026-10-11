# ArtXP Multimodal Agent System — Implementation Plan

Status: proposed  
Last updated: 2026-10-04  
Scope: evolve the current ArtXP Vite prototype into a production-grade, multimodal art-learning system powered through OpenRouter, with user-supplied API credentials.

## 1. Executive summary

ArtXP already demonstrates the shell of an art-learning product: onboarding, daily missions, weekly plans, reference discovery, practice uploads, XP, streaks, and progress cards. The next version should connect those pieces into one evidence-based learning loop:

```text
user profile + original artwork
            |
            v
multimodal baseline analysis
            |
            v
anatomy / composition / lighting / color specialist analyses
            |
            v
coach selects the single highest-leverage focus
            |
            v
hybrid retrieval from the art knowledge base
            |
            v
personalized exercise + rubric
            |
            v
user uploads a revision
            |
            v
blind before/after evaluation
            |
            v
skill evidence, progression, and the next recommendation
```

The recommended production architecture is:

```text
React/Vite web app
        |
        | HTTPS + SSE
        v
FastAPI API and auth boundary
        |
        +----------------------+-----------------------+
        |                      |                       |
        v                      v                       v
LangGraph workflow       OpenRouter gateway      Upload service
        |                      |                       |
        v                      v                       v
Worker queue/Redis       vision/text models      object storage
        |
        +----------------------+-----------------------+
                               |
                               v
                     PostgreSQL + pgvector
                   domain data, graph edges,
                    embeddings, checkpoints
                               |
                               v
                 OpenTelemetry + trace/eval store
```

Do not begin with every infrastructure component at once. Build a vertical slice that proves the complete learning loop, then add model comparison, durable jobs, retrieval quality, observability, and scaling. This produces a useful product sooner and creates meaningful production-engineering evidence instead of a large amount of unused scaffolding.

## 2. Current implementation assessment

### 2.1 What exists today

The repository is a small Vite/React single-page application:

- `src/App.jsx` defines onboarding and five authenticated-by-local-state screens.
- `src/context/AppContext.jsx` owns the entire application domain state and persists it in browser `localStorage`.
- `src/pages/Onboarding.jsx` captures goal, self-reported level, and daily practice time.
- `src/pages/Dashboard.jsx` generates three daily missions and displays XP, streaks, and skill cards.
- `src/pages/PracticePlanner.jsx` generates a seven-day plan and attaches Pixabay references to exercises.
- `src/pages/PracticeLog.jsx` accepts an artwork image, exercise name, skill label, and reflection.
- `src/pages/ReferenceFinder.jsx` searches and bookmarks Pixabay images.
- `src/pages/Settings.jsx` stores Gemini and Pixabay keys.
- `src/utils/gemini.js` calls Gemini directly from the browser and parses free-form JSON text.
- `src/utils/unsplash.js` calls Pixabay directly from the browser; despite the filename, it does not call Unsplash.
- Styling is Tailwind CSS. There is no test suite, backend, authentication system, database, upload storage, telemetry, or CI/CD configuration.

### 2.2 Assets worth preserving

- The onboarding fields already provide useful personalization inputs.
- The six-skill display gives the progression system a usable visual foundation.
- Daily missions and the weekly planner are natural destinations for generated exercises.
- The practice log is the right entry point for before/after artwork.
- Saved references can later become exercise resources and retrieval feedback signals.
- The current dark visual system and compact navigation are suitable for an MVP.

### 2.3 Gaps that block the proposed product

| Area | Current state | Why it blocks the upgrade |
|---|---|---|
| Identity | A truthy `user` object in `localStorage` | No account ownership, cross-device data, access control, or deletion workflow |
| Credentials | Gemini and Pixabay keys stored in `localStorage` | Browser scripts and extensions can read them; there is no revocation/status model or server-side policy |
| Artwork storage | Images converted to base64 and stored with log entries | `localStorage` is small, synchronous, and unsuitable for original art or version history |
| AI boundary | Browser calls one Gemini model directly | No model routing, retries, fallbacks, budgets, tracing, policy, or secret isolation |
| Output contracts | Prompt asks for JSON and manually parses it | No schema enforcement, versioning, repair path, or compatibility tests |
| Coaching | Plan is based only on goal and self-reported level | It does not inspect artwork or choose priorities from demonstrated weaknesses |
| Progress | XP increments when a task is checked | XP is activity, not skill evidence; unchecking does not reverse awarded XP, so it is not a valid learning metric |
| Evaluation | No before/after relationship | The app cannot measure whether an exercise helped |
| Retrieval | Pixabay keyword lookup only | No curated art knowledge, citations, pedagogy metadata, hybrid search, or retrieval evaluation |
| Reliability | Component-local loading/error state | Long multimodal runs cannot resume after refresh or worker failure |
| Observability | None | No latency, cost, provider, quality, or failure-rate evidence |

### 2.4 Recommended frontend decision

Keep React + Vite for the first production version. A Next.js migration would add risk without solving the core multimodal, data, and evaluation problems because FastAPI is already the proposed backend. Reconsider Next.js only when ArtXP has a concrete need for server rendering, a public content/SEO surface, or React-server-specific features.

## 3. Product scope and success definition

### 3.1 Version-one user journey

1. A user creates an ArtXP account and finishes the existing goal/level/time onboarding.
2. They connect OpenRouter through OAuth PKCE, or manually enter an OpenRouter API key as a fallback.
3. They upload an original artwork and optionally specify intent, medium, reference image, time spent, and what they found difficult.
4. ArtXP validates and stores the image, then starts a durable analysis job.
5. The UI streams stage-level progress: preparing image, baseline analysis, specialist reviews, coaching priority, retrieving lessons, and creating exercise.
6. The user receives:
   - a concise overall reading;
   - anatomy, composition, perspective, lighting, and color scorecards;
   - evidence tied to visible regions or features;
   - one primary improvement target for today;
   - a personalized, time-boxed exercise;
   - a small set of cited knowledge resources;
   - a rubric explaining what improvement looks like.
7. The user completes the exercise and uploads a revision linked to the original.
8. ArtXP evaluates the pair using the same rubric, presents confidence-aware improvements/regressions, and asks for self-reflection.
9. Confirmed evidence updates the skill timeline and informs the next exercise.

### 3.2 Explicit non-goals for the first release

- Autonomous web browsing by agents.
- Fine-tuning a custom vision model.
- Real-time collaborative drawing or canvas editing.
- Diagnosing medical conditions from artwork or reference photos.
- A dedicated Neo4j cluster before graph traversal requirements are demonstrated.
- Fully automatic high-stakes scoring with no user feedback or confidence display.
- Supporting every image, document, animation, and 3D format at launch.

### 3.3 MVP success criteria

The first usable vertical slice is complete when a user can connect an OpenRouter key, upload one artwork, receive a schema-valid specialist analysis plus one cited exercise, upload a revision, see a before/after comparison, and find the resulting evidence in their skill history.

Initial release targets:

- At least 95% of accepted uploads complete the workflow without manual intervention.
- At least 98% of model responses pass the application schema after at most one bounded repair attempt.
- P50 end-to-end analysis latency below 20 seconds and P95 below 60 seconds for the configured default route.
- The cost estimate shown before a run differs from recorded cost by no more than 20% on at least 90% of runs where providers return cost metadata.
- At least 80% agreement between expert labels and the system's top improvement priority on the initial benchmark set.
- At least 70% of pilot users rate the recommended exercise as relevant (4 or 5 on a five-point scale).
- No raw OpenRouter key, image bytes, prompt content, or signed image URL appears in application logs.

These are launch hypotheses, not permanent SLOs. Recalibrate them after collecting a representative staging dataset.

## 4. Core architectural decisions

### 4.1 Separate deterministic workflow from agent judgment

Use LangGraph as a typed state machine, not as an unconstrained group chat between agents. The graph should decide which stages run, what each stage receives, which schema it must produce, how retries work, and when the workflow ends. Models make bounded judgments inside nodes.

This gives the system:

- explicit control flow;
- node-level retry and timeout policies;
- persistent checkpoints;
- stage-by-stage streaming;
- model and prompt versioning per node;
- clear attribution of latency, cost, and failures;
- the ability to rerun only a failed or changed stage.

### 4.2 Use one normalized visual baseline, then specialist agents

Do not send an unprepared image and the entire user history independently to four agents. The first vision node should produce a shared, factual baseline: canvas dimensions, medium/style guess, major subjects, framing, palette summary, light direction, pose/landmarks when applicable, and regions of interest. Each specialist then receives the image, relevant baseline fields, user profile, and a narrow rubric.

This reduces repeated reasoning, makes disagreements visible, and keeps specialist prompts focused. Specialists may run in parallel after the baseline is available.

### 4.3 Store progression as evidence, not only XP

Keep XP and streaks as motivation features, but introduce a separate evidence-based skill model. Every skill update should point to the analysis/evaluation that caused it. A visible skill estimate should therefore be explainable:

```text
color score 58/100
  = prior estimate 53
  + evaluation evidence from attempt 8 (+6, medium confidence)
  - recency/uncertainty adjustment (-1)
```

Do not silently convert one model score into a permanent truth. Preserve raw scores, calibrated scores, confidence, rubric version, judge model, and user/expert feedback.

### 4.4 Begin with PostgreSQL as the system of record

Use PostgreSQL for users, artwork, jobs, exercises, runs, rubrics, scores, and knowledge metadata. Enable `pgvector` for embeddings. Model the knowledge graph as relational nodes and directed edges in PostgreSQL first. This satisfies the product's prerequisite/related-skill traversal requirements without operating another database.

Adopt a dedicated graph store only if measured query patterns require deep traversals that PostgreSQL cannot meet. A likely trigger would be multi-hop personalized curriculum generation over a large, frequently changing ontology with unacceptable query latency.

### 4.5 Use object storage for image bytes

Store original and derived images in S3-compatible object storage. PostgreSQL stores metadata and object keys, never base64 image bodies. Generate short-lived signed URLs after an authorization check. Strip metadata from derived analysis images and preserve originals only according to the declared retention policy.

### 4.6 Make model selection configuration-driven

OpenRouter model availability, pricing, endpoints, and capabilities change. Store route policies in configuration or a database rather than source code. Each role declares required capabilities and constraints; the router resolves a compatible primary and ordered fallbacks.

Example roles:

| Role | Required capabilities | Optimization objective |
|---|---|---|
| `visual_baseline` | image input, structured output, high visual fidelity | quality first, bounded latency |
| `anatomy_specialist` | image input, structured output | landmark/form accuracy |
| `composition_specialist` | image input, structured output | spatial reasoning |
| `lighting_specialist` | image input, structured output | value/light consistency |
| `color_specialist` | image input, structured output | palette and temperature reasoning |
| `coach` | structured output, long enough context | pedagogical prioritization |
| `exercise_generator` | structured output | actionable constraints and adaptation |
| `pair_evaluator` | two-image input, structured output | stable comparative judgment |
| `embedding` | text embeddings | retrieval quality per dollar |

## 5. Proposed service architecture

### 5.1 Frontend

Keep the existing Vite application and introduce:

- TypeScript before expanding the domain model.
- TanStack Query for server state, retries, invalidation, and request status.
- A small typed API client generated from FastAPI's OpenAPI schema.
- SSE for graph progress events; reserve WebSockets for a future truly bidirectional feature.
- Direct-to-object-storage uploads through presigned URLs.
- Route-level error boundaries and accessible loading/empty states.
- A local UI state store only for ephemeral state; durable learning data comes from the API.

New or changed screens:

- `Analyze`: upload artwork, capture intent/context, show job progress, render critique.
- `Exercise`: display instructions, references, rubric, timer, and submission action.
- `Compare`: synchronized before/after view, rubric deltas, confidence, reflection, and dispute feedback.
- `Progress`: evidence-based skill chart, activity XP, recent improvements, and weak-skill recommendations.
- `Settings`: account, OpenRouter connection, model/cost/privacy preferences, export, and deletion.
- Existing `Dashboard`: show the active learning loop instead of generic missions when an analysis exists.
- Existing `Practice Log`: become the artwork/attempt history and stop storing base64 data locally.

### 5.2 FastAPI application

Organize the backend as a modular monolith initially. It is easier to test and deploy than premature microservices while still exposing clear internal boundaries:

```text
backend/app/
  api/                 # FastAPI routers and request/response schemas
  auth/                # sessions/JWT, OpenRouter OAuth, credential access
  artworks/            # uploads, metadata, authorization, transformations
  coaching/            # exercises, rubrics, progression application service
  knowledge/           # ingestion, retrieval, citations, graph traversal
  models/              # OpenRouter client, capability registry, policies
  workflows/           # LangGraph state, nodes, graphs, checkpoints
  evaluation/          # pair comparison and offline/online eval logic
  observability/       # tracing, metrics, redaction, cost accounting
  db/                  # SQLAlchemy models, repositories, migrations
  workers/             # durable job entry points
  core/                # settings, errors, security, idempotency
```

API handlers should authenticate, authorize, validate, invoke an application service, and return. They should not contain prompts or agent logic.

### 5.3 Worker and queue

Artwork analysis is too slow and expensive for an in-process `BackgroundTasks` callback. Use a worker process and Redis-backed durable queue. A practical first choice is Celery because its retries, visibility, scheduling, and operational patterns are well understood; keep queue calls behind a small interface so the implementation can be changed.

Queue separation:

- `analysis`: interactive, user-facing workflows.
- `evaluation`: before/after comparisons.
- `ingestion`: knowledge parsing and embeddings.
- `maintenance`: cleanup, retention, aggregates, and offline eval jobs.

Every job needs an idempotency key, max attempts, exponential backoff with jitter, a hard timeout, and a dead-letter/failure state visible to the user.

### 5.4 Redis responsibilities

Use Redis for:

- queue/broker state;
- short-lived job progress snapshots;
- distributed rate limits by user and route;
- idempotency locks;
- short TTL caches for public model capability/catalog data;
- request deduplication keyed by image hash + prompt version + route policy;
- cancellation flags.

Do not cache raw API keys, original image bytes, full prompts, or full model responses in Redis.

### 5.5 Object storage and image pipeline

Upload flow:

1. Client requests an upload slot with MIME type, size, and SHA-256.
2. API enforces quota and returns a short-lived presigned upload URL.
3. Client uploads directly to object storage.
4. Client confirms the upload.
5. Worker verifies magic bytes, decodes the image, rejects malformed/polyglot files, scans if required, normalizes orientation, and creates analysis derivatives.
6. Workflow uses a bounded-size derivative; the original remains private.

Initial limits:

- JPEG, PNG, and WebP only.
- Maximum 20 MB and 20 megapixels per image.
- Decode-time and pixel-count limits to prevent decompression bombs.
- Generate a color-preserving analysis image with a maximum long edge appropriate for the selected model.
- Remove EXIF/GPS from derivatives.
- Delete abandoned uploads after 24 hours.

## 6. OpenRouter integration and user-owned credentials

### 6.1 Recommended connection modes

Implement two modes in this order:

1. **OpenRouter OAuth PKCE — preferred.** “Connect OpenRouter” sends the user through OpenRouter authorization and returns a user-controlled key. This is less error-prone than copying a secret and gives a clearer consent/revocation experience.
2. **Manual OpenRouter key — fallback.** The user pastes an `sk-or-...` key into ArtXP over TLS.

“Bring your own OpenRouter key” and OpenRouter's separate “BYOK provider credential” feature are not the same thing. ArtXP initially needs the former: a user-owned OpenRouter API key used for OpenRouter requests. Do not build the provider-credential management API into ArtXP unless users explicitly need to attach their OpenAI/Anthropic/etc. provider keys to OpenRouter.

### 6.2 Credential storage

Production approach:

- Exchange the OAuth code on the backend.
- Encrypt the API key with an envelope-encryption key from the cloud KMS.
- Store ciphertext, key version, masked label/hash, creation time, last successful validation time, and status.
- Decrypt only inside the worker immediately before an OpenRouter call.
- Never return the raw key after connection.
- Never include it in traces, exception messages, analytics, or queue payloads.
- Provide “test connection,” “replace,” and “disconnect” actions.
- Validate with a low-cost key metadata/capability call rather than a costly generation where possible.
- Maintain an in-memory secret for only the duration of the request and avoid writing request headers to debug logs.

For a local-only development mode, session memory may be offered explicitly, but `localStorage` must not be the production default.

### 6.3 Request policy

Centralize every OpenRouter call in one gateway. It should:

- accept a logical role rather than an arbitrary model from agent code;
- resolve model route policy and capability requirements;
- enforce per-user daily/monthly budget and per-run estimated maximum;
- set connect/read/total timeouts;
- retry only transient errors and never blindly retry a billed successful request;
- use an idempotency/deduplication record at the application layer;
- request strict JSON Schema outputs for every structured node;
- use provider parameter requirements so the selected endpoint supports requested features;
- use an ordered fallback model list for rate limits, provider downtime, or moderation refusal when product policy allows it;
- request data-collection denial and/or zero-data-retention routing when the user's privacy mode requires it;
- capture returned model/provider, input/output tokens, cached tokens, latency, finish reason, and cost metadata when present;
- redact message bodies from production logs by default.

### 6.4 Routing policy model

Store a versioned policy such as:

```yaml
policy_id: art_analysis_balanced_v1
role: composition_specialist
required:
  input_modalities: [text, image]
  parameters: [structured_outputs]
privacy:
  data_collection: deny
models:
  primary: ${OPENROUTER_COMPOSITION_MODEL}
  fallbacks:
    - ${OPENROUTER_VISION_FALLBACK_1}
    - ${OPENROUTER_VISION_FALLBACK_2}
limits:
  max_output_tokens: 1200
  timeout_seconds: 35
  max_estimated_cost_usd: 0.08
```

Resolve environment placeholders at deployment. Persist the actual route policy version and returned model/provider on every call so historical scores remain auditable.

### 6.5 Model selection process

Do not select the default model from anecdotal quality. Build a 50–100 item art-analysis benchmark stratified by skill level, medium, subject, style, and image quality. For each candidate route measure:

- specialist rubric agreement with expert annotations;
- top-priority agreement;
- evidence grounding (is the cited issue visible?);
- exercise relevance and difficulty fit;
- JSON/schema success rate;
- P50/P95 latency;
- cost per completed workflow, including retries;
- refusal and transient failure rate;
- before/after order consistency.

Choose separate routes for vision specialists, coaching, and judging if that improves the Pareto frontier. A single model for every role is an initial convenience, not an architectural requirement.

## 7. LangGraph workflow design

### 7.1 Analysis graph

```text
START
  |
  v
load_context_and_authorize
  |
  v
prepare_image
  |
  v
visual_baseline
  |
  +----------+------------+-------------+
  |          |            |             |
  v          v            v             v
anatomy   composition   lighting       color
  |          |            |             |
  +----------+------------+-------------+
                    |
                    v
             reconcile_findings
                    |
                    v
              choose_priority
                    |
                    v
             retrieve_knowledge
                    |
                    v
             generate_exercise
                    |
                    v
          validate_and_persist_result
                    |
                    v
                   END
```

Specialist branches run in parallel. A branch may return `not_applicable`; for example, anatomy may be irrelevant to an abstract landscape. The reconciler must identify agreement and contradiction rather than averaging everything.

### 7.2 Graph state

Keep raw, reusable facts in graph state rather than prose assembled for one prompt:

```python
class AnalysisState(TypedDict):
    schema_version: str
    job_id: UUID
    user_id: UUID
    artwork_id: UUID
    user_profile: UserProfileSnapshot
    artwork_context: ArtworkContext
    image_asset: ImageAssetRef
    baseline: VisualBaseline | None
    specialist_results: dict[SkillKey, SpecialistAnalysis]
    conflicts: list[FindingConflict]
    priority: CoachingPriority | None
    retrieved_chunks: list[RetrievedChunk]
    exercise: PersonalizedExercise | None
    usage: list[ModelCallUsage]
    warnings: list[WorkflowWarning]
```

Store only object references in checkpoints, not image bytes or decrypted secrets.

### 7.3 Specialist output contract

All specialists use the same outer contract and domain-specific rubrics:

```json
{
  "skill": "composition",
  "applicability": 0.95,
  "score": 62,
  "confidence": 0.78,
  "strengths": [
    {
      "claim": "The main silhouette reads clearly against the background.",
      "evidence": "The figure has a continuous high-contrast outer contour.",
      "region": { "x": 0.25, "y": 0.18, "width": 0.42, "height": 0.68 }
    }
  ],
  "issues": [
    {
      "criterion_id": "composition.focal_hierarchy",
      "severity": 0.72,
      "confidence": 0.81,
      "claim": "The secondary shape competes with the intended focal point.",
      "evidence": "It has similar size and contrast in the upper-right quadrant.",
      "region": { "x": 0.63, "y": 0.08, "width": 0.29, "height": 0.31 },
      "suggested_action": "Reduce its contrast or move it away from the focal cluster."
    }
  ],
  "uncertainties": [],
  "rubric_version": "composition_v1"
}
```

Normalized coordinates allow the UI to overlay evidence boxes. Claims must be tied to visible evidence, not assumptions about the artist's intent.

### 7.4 Priority selection

The coach selects exactly one primary focus and optionally one watch item. Use a transparent scoring function to constrain the model:

```text
priority_score =
  0.30 * severity
+ 0.20 * specialist_confidence
+ 0.20 * goal_relevance
+ 0.15 * prerequisite_readiness
+ 0.10 * expected_learning_gain
+ 0.05 * time_fit
- fatigue_penalty
- recently_practiced_penalty
```

The coach may override the numerical winner only with a structured reason. Beginner recommendations should prefer foundational, observable corrections over subtle polish. Avoid recommending a skill when applicability or confidence is below the configured threshold.

### 7.5 Exercise generation

An exercise must contain:

- one primary skill and criterion;
- why it was selected, in supportive language;
- prerequisites assumed;
- exact steps and repetitions;
- the user's available duration;
- materials/medium adaptations;
- success criteria that can be observed in a later upload;
- a compact scoring rubric with three to five criteria;
- common failure modes;
- retrieved citations;
- an easier and harder variant;
- safety/content flags if relevant;
- prompt, retrieval, and rubric version IDs.

Generate exercises from retrieved material and analysis facts. The model must not invent a citation or claim that a resource says something absent from the retrieved chunk.

### 7.6 Before/after evaluation graph

```text
START
  |
  v
validate_pair_and_load_original_rubric
  |
  v
normalize_pair_for_judging
  |
  +--------------------+
  |                    |
  v                    v
judge A->B          judge B->A
  |                    |
  +---------+----------+
            |
            v
  reconcile_order_and_confidence
            |
            v
 deterministic_image_metrics
            |
            v
 produce_delta_and_feedback
            |
            v
 update_skill_evidence
            |
            v
           END
```

The second judge call swaps image order and neutralizes “before”/“after” labels. This reveals position and expectation bias. If the two judgments disagree beyond a threshold, mark the result low-confidence, avoid a strong progression update, and optionally route to another judge or human review.

Compare only against the exercise's original rubric. Do not reward unrelated stylistic change. Preserve both absolute criterion scores and deltas.

## 8. Retrieval and art knowledge system

### 8.1 Knowledge sources and rights

Begin with a small, high-quality corpus rather than scraping the web. Sources may include:

- original ArtXP lessons written for the product;
- public-domain art instruction material;
- permissively licensed educational resources whose license allows the intended use;
- user-authored private notes, isolated to that user;
- metadata-only links to external resources when content ingestion is not permitted.

For every source store author, title, canonical URL, license, attribution text, ingestion date, checksum, language, and visibility. Do not ingest arbitrary copyrighted books or course transcripts without rights.

### 8.2 Ontology and knowledge graph

Initial node types:

- `skill`: anatomy, composition, lighting, color, gesture, perspective, linework;
- `concept`: value grouping, focal hierarchy, proportion, edge control, warm/cool contrast;
- `exercise_template`;
- `common_error`;
- `medium`;
- `style_context`;
- `resource`.

Initial edge types:

- `PREREQUISITE_OF`;
- `IMPROVES`;
- `ADDRESSES_ERROR`;
- `APPLIES_TO_MEDIUM`;
- `RELATED_TO`;
- `HAS_EXERCISE`;
- `SUPPORTED_BY_RESOURCE`.

Implement nodes and edges in normal relational tables with constrained edge types. Use recursive CTEs for the shallow prerequisite traversals expected in the first version.

### 8.3 Ingestion pipeline

1. Register the source and verify rights/metadata.
2. Extract and normalize text.
3. Split by semantic lesson boundaries, not fixed token count alone.
4. Attach skill, concept, level, medium, source, and license metadata.
5. Run quality checks and human approval.
6. Generate embeddings with a versioned embedding model.
7. Upsert chunks and graph links transactionally.
8. Run retrieval regression tests before publishing the corpus version.

### 8.4 Retrieval strategy

Use hybrid retrieval:

1. Filter by visibility, language, skill, appropriate level, medium, and active corpus version.
2. Retrieve semantic candidates with pgvector.
3. Retrieve lexical candidates with PostgreSQL full-text search.
4. Fuse rankings with reciprocal rank fusion.
5. Expand at most one or two graph hops for prerequisites and exercise templates.
6. Rerank the small candidate set based on the selected issue and user context.
7. Enforce source diversity and return three to six chunks.

Every returned chunk includes an immutable citation ID. The exercise response cites those IDs; the API resolves them into title/author/link/attribution for display.

### 8.5 Retrieval evaluation

Build labeled queries such as “beginner portrait has inconsistent eye alignment” and expected concepts/resources. Track Recall@5, MRR, nDCG@5, citation correctness, and human usefulness. Version the corpus, chunker, embedding model, filters, and reranker so retrieval changes can be compared offline.

## 9. Domain and data model

Use UUIDs, UTC timestamps, soft deletion where auditability matters, and row-level ownership checks in every repository query.

### 9.1 Core tables

| Table | Purpose and important fields |
|---|---|
| `users` | identity, locale, timezone, consent/version, status |
| `user_profiles` | goal, self-reported level, daily minutes, medium/style preferences |
| `external_credentials` | provider, encrypted secret, key version, masked label/hash, status; never raw key |
| `artworks` | owner, object key, derivative keys, dimensions, MIME, SHA-256, context, retention status |
| `learning_cycles` | original artwork, selected priority, exercise, status, started/completed timestamps |
| `submissions` | cycle, artwork version, role (`before`, `after`, `extra_attempt`), reflection |
| `analysis_runs` | artwork, workflow/prompt/policy version, status, timestamps, error category |
| `specialist_analyses` | run, skill, structured result, score/confidence, rubric version |
| `exercises` | selected skill/criterion, structured instructions, duration, difficulty, citations |
| `evaluation_runs` | before/after IDs, judge route, rubric, consistency, confidence, status |
| `criterion_scores` | run, criterion, before score, after score, delta, confidence, evidence |
| `skill_evidence` | user, skill/concept, source run, signed delta, confidence, observed timestamp |
| `skill_estimates` | materialized current estimate, uncertainty, evidence count, updated timestamp |
| `xp_events` | immutable activity ledger with source and idempotency key |
| `streak_events` | qualifying activity date in user's timezone |
| `model_calls` | role, route/model/provider, tokens, latency, cost, outcome; no raw key |
| `workflow_jobs` | graph/thread ID, status, stage, attempts, cancellation, timestamps |
| `user_feedback` | rating, issue flags, corrected priority, free text with consent rules |
| `audit_events` | credential/data actions and administrative access |

### 9.2 Knowledge tables

| Table | Purpose |
|---|---|
| `knowledge_sources` | provenance, rights, checksum, canonical URL, status |
| `knowledge_chunks` | text, metadata, search vector, embedding, version |
| `knowledge_nodes` | typed ontology entities |
| `knowledge_edges` | directed typed links with weight and provenance |
| `chunk_node_links` | concepts supported by each chunk |
| `exercise_templates` | reviewed reusable structures and parameter slots |

### 9.3 Progress model

Maintain two separate concepts:

- **Activity progression:** XP, streak, completed exercises. This rewards consistency.
- **Skill progression:** score estimate, confidence interval/uncertainty, and evidence history. This represents observed change.

An initial simple skill update can use a recency-weighted evidence average with confidence weighting. Avoid claiming scientific precision. Once there is enough longitudinal data, evaluate Bayesian updating or an Elo-like latent skill model against expert ratings.

## 10. API contract

Use `/api/v1`, JSON for metadata, presigned object-storage URLs for image transfer, and idempotency keys on mutation endpoints that can trigger cost.

### 10.1 Identity and profile

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /me`
- `PATCH /me/profile`
- `GET /me/export`
- `DELETE /me`

Use an established identity provider or well-reviewed authentication library rather than implementing password security from scratch. Prefer secure, HTTP-only, same-site cookies for the web app.

### 10.2 OpenRouter connection

- `GET /integrations/openrouter/authorize` — create PKCE state and authorization URL.
- `GET /integrations/openrouter/callback` — validate state, exchange code, encrypt credential.
- `POST /integrations/openrouter/manual-key` — save a manually supplied key securely.
- `POST /integrations/openrouter/test` — validate and return masked status/capabilities.
- `GET /integrations/openrouter`
- `DELETE /integrations/openrouter`
- `GET /models/available?capability=vision` — filtered server-side catalog, cached briefly.
- `PATCH /me/model-preferences` — quality/cost/privacy preferences, not unrestricted server configuration.

### 10.3 Artwork and workflow

- `POST /artworks/upload-intents`
- `POST /artworks/{id}/complete-upload`
- `GET /artworks/{id}`
- `DELETE /artworks/{id}`
- `POST /analyses` — accepts artwork ID/context; returns `202` and job ID.
- `GET /analyses/{id}`
- `GET /analyses/{id}/events` — SSE progress stream.
- `POST /analyses/{id}/cancel`
- `POST /learning-cycles/{id}/submissions` — upload/link revision.
- `POST /learning-cycles/{id}/evaluations` — returns `202` and job ID.
- `GET /evaluations/{id}`
- `POST /evaluations/{id}/feedback`

### 10.4 Progress and knowledge

- `GET /progress/skills`
- `GET /progress/skills/{skill}/evidence`
- `GET /learning-cycles`
- `GET /learning-cycles/{id}`
- `GET /knowledge/citations/{id}`
- Administrative ingestion endpoints should be on a separate protected surface.

### 10.5 Error format

Return a stable problem-details shape:

```json
{
  "type": "https://artxp.app/errors/model-budget-exceeded",
  "title": "Analysis budget exceeded",
  "status": 409,
  "code": "MODEL_BUDGET_EXCEEDED",
  "detail": "The selected quality route exceeds your per-run limit.",
  "request_id": "req_...",
  "retryable": false
}
```

Never expose upstream secrets or raw provider error bodies to the client.

## 11. Evaluation strategy

### 11.1 Three different things called “evaluation”

Keep these separate:

1. **Artwork evaluation:** did the user's revision improve against the exercise rubric?
2. **System quality evaluation:** did the agents produce correct, grounded, useful feedback?
3. **Product outcome evaluation:** is the user actually improving and continuing to practice?

### 11.2 Offline benchmark

Create a consented/licensed dataset with:

- artwork and context;
- artist level and goal;
- expert specialist scores and evidence;
- expert top-priority label;
- acceptable exercise characteristics;
- paired before/after examples when available;
- annotations from at least two raters for a calibration subset.

Required evaluators:

- deterministic schema and field-range checks;
- evidence-region validity checks;
- expert agreement by skill and artist level;
- top-priority accuracy/top-2 recall;
- pairwise exercise preference;
- citation entailment and retrieval relevance;
- style-preservation and tone rubric;
- image-order consistency for pair judging;
- cost/latency/failure aggregation.

Run the suite for every prompt, model route, rubric, retrieval, or graph change. Block deployment on severe regressions and maintain a small smoke set for pull requests plus a larger scheduled suite.

### 11.3 Online quality signals

Capture:

- helpful/not-helpful per specialist and exercise;
- “wrong focus,” “not visible,” “too easy,” “too hard,” and “unsafe” flags;
- edited/corrected priority from reviewers;
- exercise started/completed;
- revision submitted;
- accepted versus disputed comparison;
- 7-day and 30-day retention;
- repeated improvement on the same criterion.

Sample a privacy-safe percentage of eligible traces for automated online evaluation. Route low-confidence or heavily disputed cases into a review dataset, with explicit consent before using user artwork for product improvement.

### 11.4 User improvement metric

Avoid a single vanity score. Report a small hierarchy:

- per-cycle rubric delta;
- rolling skill estimate and uncertainty;
- exercise adherence;
- transfer: whether improvement persists on a later, different artwork;
- user-reported confidence and usefulness.

The strongest product metric is not “average AI score increased immediately”; it is improvement that transfers to later work and is supported by human/user judgment.

## 12. Observability, cost, and reliability

### 12.1 Trace structure

Create one trace per user-triggered workflow, with spans for:

- authorization/context loading;
- image download and transformation;
- each OpenRouter call;
- each specialist node;
- retrieval stages;
- database operations;
- queue delay;
- result validation/persistence;
- SSE delivery.

Attach only safe metadata: request/job IDs, hashed user ID, prompt/model/policy versions, model/provider, tokens, cost, latency, retries, schema status, cache status, and error category. Do not attach raw API keys. Make image/prompt tracing opt-in in non-production or explicitly consented review environments.

### 12.2 Metrics

| Category | Metrics |
|---|---|
| API | request count, 4xx/5xx, P50/P95/P99 latency, saturation |
| Workflow | completion rate, stage latency, retries, cancellations, queue delay, dead letters |
| Model | calls, input/output/image tokens, cost, time-to-first-token, total latency, provider/model, fallback rate, schema failure, refusal |
| Retrieval | latency, empty result rate, Recall@k on evals, citation use, reranker failures |
| Product | analysis completion, exercise acceptance, revision rate, helpfulness, transfer improvement |
| Infrastructure | CPU/memory, DB connections/locks, Redis memory/evictions, object errors, worker backlog |

### 12.3 Cost accounting

Record cost at model-call level and aggregate by workflow, user, role, model, provider, and day. If exact provider cost is unavailable, calculate an estimated cost from a versioned pricing snapshot and label it estimated.

Controls:

- preflight estimate shown before analysis;
- hard per-call and per-workflow output-token limits;
- per-user daily/monthly budget;
- route presets: economical, balanced, quality;
- reuse the baseline and retrieved chunks across specialists;
- prompt caching where the selected route supports it;
- content-hash deduplication for accidental repeated submissions;
- abort downstream work if the priority cannot be selected confidently;
- optional specialist selection when a domain is clearly not applicable.

### 12.4 Reliability targets and alerts

Start with:

- API availability: 99.5% monthly.
- Analysis completion: 95% within 60 seconds.
- Queue start delay: P95 under 5 seconds.
- Schema-valid result: 98% after bounded repair.
- Alert when failure rate exceeds 5% for 10 minutes, P95 latency exceeds 60 seconds, fallback rate spikes, budget burn exceeds threshold, or dead-letter count is non-zero.

Use circuit breakers for unhealthy routes. Distinguish user errors, credential/budget errors, safety refusals, provider transient errors, schema errors, and internal defects; each needs a different UI message and retry policy.

## 13. Security, privacy, and abuse controls

### 13.1 Threat model priorities

- Stolen user OpenRouter keys.
- Unauthorized access to private artwork or signed URLs.
- Prompt injection embedded in image text or knowledge content.
- Malformed/decompression-bomb uploads.
- Cross-user retrieval leakage.
- Cost abuse and repeated job creation.
- Sensitive prompt/image data in traces and logs.
- Model output rendered as unsafe HTML or links.

### 13.2 Required controls

- TLS everywhere and HSTS in production.
- HTTP-only session cookies, CSRF protection, strict CORS, and a Content Security Policy.
- Envelope encryption for external credentials and periodic key rotation.
- Per-object authorization before issuing short-lived signed URLs.
- MIME magic-byte validation, pixel/size limits, and isolated decoding.
- Treat image OCR text, retrieved chunks, and model outputs as untrusted data/instructions.
- Tool-free specialist agents; only explicit graph nodes can call retrieval or persistence services.
- Parameterized SQL/ORM and tenant filters on every user-owned query.
- Escape model output and render only allowlisted Markdown elements.
- Rate limits by account, IP, endpoint, and cost budget.
- Immutable audit events for credential and deletion actions.
- Data export and deletion jobs, including object storage and derived artifacts.
- Retention settings visible to the user.
- Content moderation policy appropriate to artwork, including a carefully designed policy for artistic nudity and anatomy studies.

### 13.3 Prompt injection policy

Specialist prompts must state that text visible inside an uploaded image is artwork content, not an instruction. Knowledge chunks are evidence, not commands. Models receive no arbitrary network or database tools. The application owns routing and persistence, and validates all model output before it changes state.

## 14. Testing plan

### 14.1 Backend tests

- Unit tests for route resolution, cost calculation, priority scoring, schema validation, progression updates, and access control.
- Contract tests using recorded/synthetic OpenRouter responses; never require paid calls for the normal unit suite.
- Graph tests for success, not-applicable branches, transient retry, schema repair, cancellation, fallback, and resume from checkpoint.
- Repository tests against ephemeral PostgreSQL with pgvector.
- Upload tests for wrong MIME, oversized pixels, corrupt images, duplicate hash, unauthorized access, and cleanup.
- Retrieval tests for tenant/visibility filtering and citation provenance.
- API integration tests for idempotency and problem-details errors.

### 14.2 Frontend tests

- Component tests for upload, progress, scorecards, evidence overlays, empty/error states, and credential forms.
- API mocking for every job status and error category.
- End-to-end tests for onboarding -> connect key -> analyze -> exercise -> revision -> compare -> progress.
- Refresh/reconnect tests while an SSE job is running.
- Accessibility checks: keyboard navigation, focus management, labels, contrast, and reduced motion.
- Visual regression tests for before/after layouts at mobile and desktop widths.

### 14.3 Load and resilience tests

- Concurrent upload and analysis initiation.
- Queue backlog and worker autoscaling.
- Slow or unavailable OpenRouter endpoint.
- Redis restart and PostgreSQL connection pressure.
- Duplicate client retries.
- Worker termination between graph nodes and successful resume.
- Object-store temporary failure.

## 15. Deployment and environments

### 15.1 Local development

Use Docker Compose for PostgreSQL + pgvector, Redis, an S3-compatible local object store, API, and worker. Run Vite normally for fast refresh. Provide seeded demo users, a small licensed knowledge corpus, and a fake-model mode that returns deterministic fixtures.

### 15.2 Reference cloud deployment

A concrete AWS reference architecture:

- Frontend: static assets on S3 + CloudFront, or a managed frontend host.
- API and worker: separate ECS Fargate services using the same image and different commands.
- Database: RDS PostgreSQL with pgvector support and automated backups.
- Redis: ElastiCache.
- Images: private S3 bucket with lifecycle policies and blocked public access.
- Secrets: Secrets Manager plus KMS for credential envelope encryption.
- Container registry: ECR.
- Metrics/traces/logs: OpenTelemetry collector to the chosen observability backend, with CloudWatch infrastructure alarms.
- Edge protection: WAF/rate limits when traffic warrants it.

Keep the design portable: S3 API, PostgreSQL, Redis, OpenTelemetry, and containers avoid coupling core business logic to AWS.

### 15.3 Environments and delivery

- `local`: fake models by default; developer-owned key only when explicitly enabled.
- `test`: ephemeral infrastructure and no external model calls.
- `staging`: isolated database/bucket/OpenRouter test budget; anonymized or synthetic data.
- `production`: separate cloud account/project, keys, KMS material, database, and bucket.

CI pipeline:

1. Lint and type-check frontend/backend.
2. Unit and integration tests.
3. Build immutable frontend and container artifacts.
4. Dependency, secret, container, and migration checks.
5. Deploy to staging.
6. Run smoke and small offline eval suite.
7. Require approval if quality/cost thresholds regress.
8. Deploy production with rolling/canary strategy.
9. Run post-deploy smoke test and watch error/budget dashboards.

Use backward-compatible expand/migrate/contract database migrations and maintain a rollback playbook.

## 16. Repository evolution

Recommended target layout:

```text
ArtXP/
  frontend/
    src/
      api/
      components/
      features/
        analysis/
        exercises/
        evaluation/
        progress/
        settings/
      routes/
      types/
  backend/
    app/
    migrations/
    tests/
    pyproject.toml
  evals/
    datasets/
    evaluators/
    experiments/
  knowledge/
    sources/
    manifests/
    ontology/
  infra/
    docker/
    terraform/
  docs/
    architecture/
    runbooks/
    adr/
  docker-compose.yml
```

Move the existing Vite application into `frontend/` in a dedicated, mechanical change before feature work. Preserve behavior and verify the build. Do not mix that move with TypeScript conversion or API migration.

## 17. Phased implementation roadmap

Durations are estimates for one focused developer with AI assistance. Quality, security review, and knowledge annotation can change the schedule.

### Phase 0 — Baseline and guardrails (2–3 days)

Deliverables:

- Add README setup instructions, `.env.example`, formatting/linting, and frontend tests.
- Capture screenshots and smoke tests for every current page.
- Document current `localStorage` keys and their shapes.
- Fix misleading `unsplash.js` naming to `pixabay.js` in a behavior-preserving change.
- Add a lightweight architecture decision record for Vite + FastAPI + PostgreSQL/pgvector + Redis + object storage.
- Define the initial art-analysis and exercise JSON Schemas.

Exit criteria:

- Current build and smoke tests pass.
- Existing behavior is documented before migration.
- Domain contracts are reviewed before backend code begins.

### Phase 1 — Backend foundation and durable user data (1 week)

Deliverables:

- Create FastAPI application, settings, structured logging, request IDs, health/readiness endpoints, and OpenAPI generation.
- Add PostgreSQL, SQLAlchemy, Alembic, Redis, local object storage, and Docker Compose.
- Add identity/session integration and user/profile tables.
- Implement profile, artwork upload-intent, upload-completion, and artwork metadata endpoints.
- Migrate the frontend to TypeScript, TanStack Query, and generated API types incrementally.
- Replace new practice-log image persistence with object storage.
- Add a one-time, user-approved migration from local profile/log data where practical; retain an export fallback.

Exit criteria:

- User data and new images survive browser/device changes.
- No new image or user record is written to `localStorage`.
- Unauthorized users cannot access another user's object or metadata.

### Phase 2 — OpenRouter BYOK gateway (4–6 days)

Deliverables:

- Implement OAuth PKCE connection and manual-key fallback.
- Encrypt credentials with a local dev key abstraction and production KMS implementation.
- Implement connect/test/status/disconnect UI and API.
- Create the centralized OpenRouter gateway with role-based route config, schemas, timeouts, safe retries, fallback, usage capture, and redaction.
- Replace `src/utils/gemini.js` daily/weekly calls with backend endpoints using structured output.
- Add user cost/privacy/model preference settings.

Exit criteria:

- Browser code never calls Gemini or OpenRouter directly.
- Raw OpenRouter keys do not appear in `localStorage`, API responses, queue messages, or logs.
- Existing daily missions and weekly plans work through the backend.

### Phase 3 — End-to-end analysis vertical slice (1–2 weeks)

Deliverables:

- Implement image normalization and private derivative access.
- Create the LangGraph state and nodes for baseline, four specialists, reconciliation, and priority selection.
- Use PostgreSQL-backed graph checkpoints.
- Add queue worker and job lifecycle.
- Add analysis endpoints, SSE progress, cancellation, retry, and refresh recovery.
- Build the Analyze result UI with specialist cards and evidence overlays.
- Persist prompt, rubric, graph, and route policy versions.

Start with one configured vision route for all specialists, but keep roles separate in code and telemetry. Parallelize specialist calls only after correct results and budget limits are verified.

Exit criteria:

- A real upload produces four schema-valid specialist results and one prioritized focus.
- Workflow resumes after a worker restart at a node boundary.
- Per-node latency, cost, model/provider, and failure data are visible.

### Phase 4 — Knowledge retrieval and exercise generation (1 week)

Deliverables:

- Define ontology, source manifest, license rules, ingestion command, chunking, and approval status.
- Curate an initial corpus covering the highest-value concepts for anatomy, composition, lighting, and color.
- Enable pgvector and full-text search; implement hybrid retrieval and shallow graph expansion.
- Add citation validation and retrieval telemetry.
- Implement the personalized exercise node and Exercise UI.
- Feed generated exercises into the dashboard/planner rather than creating a parallel mission system.

Exit criteria:

- Each exercise targets the selected issue, fits the user's time/level, and cites approved chunks.
- Citation IDs always resolve and quoted/paraphrased claims are supported.
- Retrieval benchmark meets the agreed Recall@5 target.

### Phase 5 — Before/after evaluation and progression (1–2 weeks)

Deliverables:

- Link submissions into a learning cycle.
- Implement original-rubric pair evaluation, swapped-order consistency check, deterministic image metadata, and reconciliation.
- Build Compare UI with aligned images, criterion deltas, confidence, evidence, reflection, and dispute controls.
- Add immutable skill evidence, current estimates, uncertainty, and timeline APIs/UI.
- Convert XP mutations to immutable, idempotent events and prevent duplicate awards.
- Define what qualifies a day for the streak using the user's timezone.

Exit criteria:

- A revision produces an auditable comparison tied to the original exercise rubric.
- Low-consistency results do not create strong skill updates.
- Every displayed skill change links back to its evidence.

### Phase 6 — Evaluation harness and model experiments (1 week initial, ongoing)

Deliverables:

- Assemble the first expert-annotated benchmark.
- Implement deterministic, expert-agreement, LLM-judge, retrieval, and pair-order evaluators.
- Create an experiment runner comparing OpenRouter routes on quality, latency, cost, and failures.
- Store experiment manifests and results.
- Add CI smoke-eval thresholds and a scheduled full benchmark.
- Add prompt/model/rubric promotion and rollback procedure.

Exit criteria:

- Default routes are selected from measured results.
- A model or prompt change cannot ship without a visible regression report.
- The project can produce a reproducible quality/latency/cost comparison for a portfolio or interview.

### Phase 7 — Production hardening and deployment (1–2 weeks)

Deliverables:

- Infrastructure as code for staging and production.
- Central traces, dashboards, SLOs, alerts, cost budgets, and runbooks.
- Rate limits, circuit breakers, dead-letter handling, backup/restore test, and retention jobs.
- Security review for credentials, uploads, object authorization, prompt injection, and cross-user data access.
- Load and failure-injection tests.
- Accessibility and responsive UI pass.
- Data export/deletion workflow and privacy/consent copy.
- Canary deployment and rollback automation.

Exit criteria:

- Staging passes functional, security, load, and evaluation gates.
- Backup restoration and credential rotation are demonstrated.
- Production dashboards show latency, cost/request, failure rate, evaluation score, and user-improvement signals.

## 18. Prioritized backlog

### P0 — required for the learning loop

- Backend/auth/database/object-storage foundation.
- Secure OpenRouter connection and centralized model gateway.
- Typed structured outputs and validation.
- Durable analysis graph with specialist nodes.
- Priority selection.
- Curated hybrid retrieval and citations.
- Personalized exercise and rubric.
- Linked revision upload and before/after evaluator.
- Evidence-based skill timeline.
- Cost, latency, failure, and quality tracing.

### P1 — required for a credible production beta

- Model benchmark and routing presets.
- Job cancellation/reconnect, dead-letter flow, and admin diagnostics.
- Consent, export, deletion, and retention controls.
- Rate limits, budget guardrails, and abuse detection.
- Retrieval/admin content workflow.
- Accessibility and mobile comparison experience.
- User feedback and low-confidence review queue.

### P2 — after usage validates demand

- Adaptive multi-week curriculum over the knowledge graph.
- Medium-specific rubrics and specialist prompts.
- Region annotation tools for expert reviewers.
- Teacher/mentor accounts and shared feedback.
- On-device preprocessing or privacy-enhanced modes.
- Dedicated graph database if measured traversal needs justify it.
- A/B experimentation and cohort analysis.

## 19. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Vision critique sounds confident but is wrong | User trust and learning harm | Evidence grounding, confidence, expert benchmark, dispute path, no unsupported claims |
| Four agents multiply cost and latency | Poor unit economics and UX | Shared baseline, parallel branches, applicability gating, route presets, cached/deduplicated work |
| Model judges favor the expected “after” image | False progression | Blind labels, swapped-order judging, calibration set, low-confidence suppression |
| User keys are leaked | Severe security incident | Backend-only use, KMS encryption, redaction, rotation/disconnect, no browser persistence |
| Knowledge content violates rights | Legal/reputation risk | Source manifests, license review, approval gate, metadata-only links where needed |
| Retrieval gives irrelevant pedagogy | Weak exercises | Metadata filters, hybrid retrieval, graph prerequisites, labeled retrieval evals |
| Model/provider behavior changes | Silent quality regression | Versioned route policies, endpoint capability checks, fallbacks, continuous evals |
| Progress score becomes a vanity number | Misleading product | Separate XP from evidence, uncertainty display, transfer measurement, auditable history |
| Replatforming stalls product work | Schedule risk | Keep Vite, modular-monolith backend, postpone Next.js/Neo4j/microservices |
| User artwork enters traces or training paths | Privacy breach | Metadata-only tracing by default, OpenRouter privacy routing, consent, retention controls |

## 20. Definition of done for each production feature

A feature is not complete when the happy-path UI renders. It is complete when:

- API and domain schemas are versioned.
- Authentication and ownership checks are covered by tests.
- Idempotency and retry behavior are defined.
- Expected failures have user-facing messages.
- Secrets and sensitive payloads are redacted.
- Metrics and trace spans exist.
- Cost impact is measured.
- Accessibility and mobile states are verified.
- Data retention/deletion behavior is known.
- Unit, integration, and relevant end-to-end tests pass.
- Offline evaluation shows no unacceptable quality regression.
- Documentation and runbook entries are updated.

## 21. First ten implementation tickets

These tickets create the shortest safe path from the current repository to the new system:

1. **Baseline current UI and add frontend quality gates.** Add ESLint, TypeScript-capable Vite configuration, Vitest, React Testing Library, and Playwright smoke coverage without changing behavior.
2. **Restructure into `frontend/` and `backend/`.** Mechanical move only; preserve the current Vite build.
3. **Bootstrap FastAPI and local infrastructure.** Health endpoints, settings, structured logging, Docker Compose, PostgreSQL/pgvector, Redis, and object storage.
4. **Implement identity and profile persistence.** Replace the `artxp_user` local-state gate with authenticated `/me` data.
5. **Implement secure artwork uploads.** Presigned URL, validation worker, metadata tables, private retrieval, and retention cleanup.
6. **Implement OpenRouter OAuth/manual connection.** PKCE state validation, encrypted credentials, status/test/disconnect, log redaction tests.
7. **Create the model gateway and migrate existing mission generation.** Role config, strict schema, usage/cost records, timeouts, and fallbacks.
8. **Define analysis schemas and graph skeleton with fake nodes.** End-to-end job, checkpoint, SSE, cancellation, and frontend progress before paid calls.
9. **Add real baseline plus four specialist nodes.** Persist structured results and render evidence overlays.
10. **Add coach priority and the first curated exercise corpus.** Hybrid retrieval, citations, exercise generation, and one complete Analyze -> Exercise flow.

Only after ticket 10 should the project expand into before/after judging and model bake-offs. This keeps the first milestone demonstrable and prevents infrastructure work from outrunning product validation.

## 22. Portfolio evidence to capture

Maintain reproducible artifacts while building:

- one architecture diagram and key ADRs;
- a trace screenshot showing specialist fan-out and reconciliation;
- a dashboard of P50/P95 latency, cost per completed workflow, failure/fallback rate, schema success, and queue delay;
- a model comparison table with a frozen dataset and route versions;
- retrieval metrics and example cited exercises;
- before/after evaluator agreement and order-bias analysis;
- a security note describing BYOK encryption, redaction, and image access;
- a load-test result and failure-recovery demonstration;
- a longitudinal view of skill evidence and user-improvement metrics.

The resulting project story becomes concrete:

> I designed and deployed a multimodal art-learning system with durable agent orchestration, capability-aware model routing through OpenRouter, user-owned credentials, hybrid retrieval over a versioned art knowledge base, automated before/after evaluation, evidence-based skill progression, and production observability. I measured and optimized quality, latency, reliability, cost, and user learning outcomes across model routes.

## 23. Relevant primary documentation

- [OpenRouter quickstart and OpenAI-compatible endpoint](https://openrouter.ai/docs/quickstart)
- [OpenRouter OAuth PKCE and user-controlled keys](https://openrouter.ai/docs/guides/overview/auth/oauth)
- [OpenRouter structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs)
- [OpenRouter model fallbacks](https://openrouter.ai/docs/guides/routing/model-fallbacks)
- [OpenRouter privacy, ZDR, and data-collection routing](https://openrouter.ai/docs/guides/features/sovereign-ai)
- [LangGraph workflow design and durable execution concepts](https://docs.langchain.com/oss/javascript/langgraph/thinking-in-langgraph)
- [LangSmith offline and online evaluation types](https://docs.langchain.com/langsmith/evaluation-types)
- [pgvector indexing, hybrid search, and multitenancy considerations](https://github.com/pgvector/pgvector)

