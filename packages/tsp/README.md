# @fpndtg/tsp — Trust Spanning Protocol

TypeScript types and transport interface for the [Trust Spanning Protocol (TSP)](https://trustoverip.github.io/tswg-tsp-specification/).

TSP is the messaging protocol for FPS, replacing DIDComm as the primary transport. TSP supports DIDComm as a compatible transport layer, so existing DIDComm infrastructure remains interoperable.

## Status

**Phase 1:** Types and interfaces only. Transport implementations are planned for Phase 2.

## What's here

- `TspMessage` — core message envelope (id, type, from, to, body, timestamp)
- `TspTransport` — pluggable transport interface (send, receive, close)
- `DIDCommMessage` — minimal DIDComm v2 shape for compatibility
- `tspToDIDComm()` / `didCommToTsp()` — conversion shims
- `TSP_MESSAGE_TYPES` — well-known FPS message type URIs

## Planned transports (Phase 2)

- `HttpTransport` — POST to a TSP relay endpoint
- `WebSocketTransport` — persistent connection to a relay
- `DIDCommTransport` — wrap TSP messages in DIDComm envelopes for mediator routing

## Relationship to DIDComm

TSP is designed to be a superset of DIDComm routing. The `packages/didcomm` package will be updated to use TSP as its underlying transport in Phase 2.
