# ADR 004 — Dual Database Architecture

**Status:** Accepted  
**Date:** 2026-06-23

## Context

FPS needs to persist two fundamentally different categories of data:

1. **Infrastructure events** — VTA/VTC lifecycle, TSP routing, Trust Task audit trails, verification attempts. These are immutable, append-only records that form the basis of the trust ledger.

2. **User state** — Account profiles, VTA management, VTC memberships, credential wallets, auth sessions. These are mutable, user-facing records optimized for UX queries.

Combining these in a single database would blur the boundary between the immutable protocol layer and the mutable application layer, making it harder to migrate to a distributed architecture later.

## Decision

Use **two separate PostgreSQL databases**:

- `fps_infra` — Infrastructure events (append-only by convention)
- `fps_user` — User state (read/write)

Both managed with **Prisma** for type-safe schema management and migrations.

## Rationale

- **Separation of concerns:** Different consistency requirements (immutable vs. mutable), different access patterns (audit/compliance vs. UX queries)
- **Physical boundary enforces clean API contracts** — packages must explicitly import from `@fpndtg/db-infra` or `@fpndtg/db-user`, preventing accidental cross-contamination
- **Migration path:** Infrastructure DB → Verifiable Data Registry (blockchain/IPFS); User DB → local-first storage (IndexedDB/SQLite with sync)
- **Simulates network partition scenarios** for future distributed architecture testing

## Consequences

- Two Prisma schemas and two migration histories to maintain
- Cross-DB queries require the event bridge (Postgres LISTEN/NOTIFY)
- Eventual consistency between databases is acceptable for Phase 1
- `@fpndtg/db-infra` uses a separate Prisma client output (`client-infra`) to avoid collision with `@fpndtg/db-user` (`client-user`)

## Alternatives Considered

- **Single DB with schemas:** Rejected — physical separation enforces cleaner boundaries and better prepares for distributed migration
- **Single DB with row-level access control:** Rejected — doesn't provide the architectural separation needed for future decentralization
