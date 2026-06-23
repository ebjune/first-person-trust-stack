# ADR 007 — Event Bridge via Postgres LISTEN/NOTIFY

**Status:** Accepted  
**Date:** 2026-06-23

## Context

With two separate databases (`fps_infra` and `fps_user`), FPS needs a communication layer to propagate events between them. For example:

- When a VTA is created in `fps_infra`, the user-facing VTA record in `fps_user` may need to be updated
- When a user joins a VTC in `fps_user`, the membership event should be cross-referenced against `fps_infra` VTC records

Options considered:
1. **Postgres LISTEN/NOTIFY** — built-in pub/sub using dedicated pg connections
2. **Redis pub/sub** — external dependency, more operational overhead
3. **Message queue (RabbitMQ, Kafka)** — heavy infrastructure for Phase 1
4. **HTTP polling** — simple but inefficient and adds latency
5. **Shared database** — violates the dual-DB architecture decision (ADR 004)

## Decision

Use **Postgres LISTEN/NOTIFY** as the event bridge between `fps_infra` and `fps_user`.

Implemented in `@fpndtg/event-bridge`:
- `PostgresEventBus` — two dedicated `pg.Client` connections (one per DB)
- `publishInfra(channel, event)` / `publishUser(channel, event)` — NOTIFY
- `subscribeInfra(channel, handler)` / `subscribeUser(channel, handler)` — LISTEN
- Typed event payloads: `InfraEvent` and `UserEvent` discriminated unions

The `sync-service` subscribes to all channels and reconciles cross-DB state.

## Channel Naming

| Channel | Database | Purpose |
|---------|----------|---------|
| `fps_infra_vta_events` | fps_infra | VTA lifecycle events |
| `fps_infra_vtc_events` | fps_infra | VTC lifecycle events |
| `fps_infra_tsp_events` | fps_infra | TSP message routing |
| `fps_infra_vmc_events` | fps_infra | VMC issuance |
| `fps_user_events` | fps_user | User account events |
| `fps_user_credential_events` | fps_user | Credential wallet events |

## Rationale

- **Zero additional infrastructure** — Postgres is already required; LISTEN/NOTIFY is built-in
- **Sufficient for Phase 1 event volumes** — low-frequency trust events (VTA/VTC lifecycle)
- **Typed payloads** — TypeScript discriminated unions prevent payload mismatches
- **Swap-ready** — `EventBus` interface allows replacing with Redis/Kafka without changing consumers

## Consequences

- LISTEN/NOTIFY payloads are limited to 8000 bytes — sufficient for trust event metadata
- Dedicated connections are held open for the lifetime of the sync-service process
- No message persistence — if sync-service is down, events are lost (acceptable for Phase 1)
- Phase 2 will add a persistent event log table for replay on reconnect

## Migration Path

| Phase | Event Bus |
|-------|-----------|
| Phase 1 | Postgres LISTEN/NOTIFY (this ADR) |
| Phase 2 | Postgres + persistent event log for replay |
| Phase 3 | Redis Streams or Kafka for higher throughput |
| Phase 4 | Gossip protocol / P2P event propagation |
