# ADR 005 — TSP over DIDComm

**Status:** Accepted  
**Date:** 2026-06-23

## Context

FPS originally planned to use DIDComm v2 as the messaging protocol for agent-to-agent communication. The existing `packages/didcomm` stub was scaffolded with this in mind.

The Trust Spanning Protocol (TSP) is a newer ToIP specification designed as a transport-agnostic, DID-native messaging layer. TSP is explicitly designed to support DIDComm as one of its transport mechanisms, making it a superset of DIDComm routing.

## Decision

Use **TSP (Trust Spanning Protocol)** as the primary messaging protocol for FPS.

- New package: `@fpndtg/tsp` — TSP message types, transport interface, DIDComm compatibility shim
- `packages/didcomm` is retained as a compatibility layer for existing DIDComm infrastructure (mediator at `mediator.fpndtg.com`)
- TSP messages are logged to `fps_infra.tsp_events` for audit and debugging

## Rationale

- **ToIP alignment:** TSP is the Trust over IP Foundation's recommended spanning layer for interoperable trust messaging
- **DIDComm compatibility:** TSP supports DIDComm as a transport, so the existing mediator infrastructure remains usable
- **Future-proof:** TSP's transport-agnostic design supports HTTP, WebSocket, and DIDComm relay — easier to evolve
- **Simpler mental model:** TSP's `from`/`to` DID envelope is cleaner than DIDComm's packed message format for application-level code

## Consequences

- `packages/didcomm` becomes a DIDComm-to-TSP adapter rather than the primary protocol
- TSP transport implementations (HTTP, WebSocket) are deferred to Phase 2
- Phase 1 provides types and interfaces only — no wire protocol implementation yet
- All TSP message routing events are logged to `fps_infra.tsp_events` for observability

## Migration Path

| Phase | Status |
|-------|--------|
| Phase 1 | TSP types and interfaces; DIDComm shim stubs |
| Phase 2 | HTTP transport adapter; WebSocket transport |
| Phase 3 | DIDComm relay transport (wraps TSP in DIDComm envelopes) |
| Phase 4 | Gossip protocol transport for fully distributed operation |

## References

- [TSP Specification (ToIP)](https://trustoverip.github.io/tswg-tsp-specification/)
- [DIDComm v2 Specification](https://identity.foundation/didcomm-messaging/spec/)
