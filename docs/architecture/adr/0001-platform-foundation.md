# ADR-0001: Platform foundation for the multimodal ArtXP system

- Status: Accepted
- Date: 2026-10-10
- Owners: ArtXP project

## Context

ArtXP is currently a Vite/React browser-only prototype. User data, uploaded image data, progress, generated plans, and provider credentials are stored in `localStorage`. Gemini and Pixabay are called directly from browser code. The planned product requires private image storage, durable agent workflows, model routing through OpenRouter, hybrid retrieval, before/after evaluation, longitudinal progression, and production observability.

The product comment proposed React/Next.js, FastAPI, LangGraph, model routing, vector and graph storage, PostgreSQL, Redis, evaluation, tracing, and cloud deployment. Adopting every named technology as a separate service immediately would slow the first end-to-end learning loop and create unnecessary operational surface.

## Decision

1. Keep React with Vite for the initial production implementation. Do not migrate to Next.js without a demonstrated SSR, SEO, or React Server Components requirement.
2. Add a FastAPI modular monolith as the authentication, authorization, credential, upload, and application-service boundary.
3. Run long model workflows through LangGraph in separate durable worker processes.
4. Use PostgreSQL as the system of record and enable pgvector for embeddings.
5. Represent the initial knowledge graph using relational node/edge tables and recursive queries in PostgreSQL.
6. Use Redis for the durable job broker, ephemeral progress, rate limits, and bounded caches—not as the source of truth.
7. Store artwork bytes in private S3-compatible object storage, with metadata and object keys in PostgreSQL.
8. Route all model calls through a centralized OpenRouter gateway using user-owned credentials, capability-aware policies, structured outputs, budgets, and telemetry.
9. Keep the system a modular monolith until measured scaling or ownership constraints justify extracting services.

## Consequences

### Positive

- Preserves the working frontend and focuses effort on the learning loop.
- Provides one transactional source of truth for domain, vector, and initial graph data.
- Keeps local development and deployment understandable for a small team.
- Allows model, prompt, retrieval, and rubric versions to be audited centrally.
- Leaves clear module boundaries for future service extraction.

### Negative

- Frontend and backend use different languages and toolchains.
- PostgreSQL graph traversal may eventually be less expressive than a dedicated graph store.
- Workers, Redis, object storage, and a database increase local environment complexity.
- A Vite SPA will not provide SSR for future public content without additional work.

## Alternatives considered

### Migrate immediately to Next.js

Rejected for the first production slice. It does not solve credential security, workflow durability, evaluation, or storage, and would spend migration effort without a current SSR requirement.

### Create independent microservices for orchestration, evaluation, retrieval, and uploads

Rejected initially. Domain contracts and load patterns are not stable enough to justify distributed transactions and extra deployments.

### Add a dedicated vector database and Neo4j immediately

Rejected initially. pgvector plus relational edges satisfy expected early query patterns and reduce operational overhead. Revisit using measured corpus scale and traversal latency.

### Continue calling models directly from the browser

Rejected for production because it prevents centralized policies, durable workflows, secret protection, budgets, trace redaction, and consistent output validation.

## Revisit triggers

- Public SEO/SSR requirements justify Next.js.
- Knowledge graph queries require deep, high-volume traversal that misses agreed PostgreSQL latency targets.
- A module needs independent scaling, release cadence, or ownership and has a stable API boundary.
- Regulatory or deployment constraints require a different data or inference topology.
