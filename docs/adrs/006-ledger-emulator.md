# ADR 006 — Postgres Ledger Emulator

**Status:** Accepted  
**Date:** 2026-06-23

## Context

FPS needs to demonstrate end-to-end trust graph operations (VTA issuance, VTC creation, VMC issuance, join ceremonies) with tamper-evident audit trails. A real distributed ledger (blockchain, IPFS, etc.) is not appropriate for Phase 1 because:

- It would require external infrastructure dependencies
- It would slow down local development iteration
- The protocol semantics can be validated without a real DLT

## Decision

Implement a **Postgres-backed ledger emulator** in `@fpndtg/ledger-emulator` that provides:

1. **Append-only semantics** — events are never updated or deleted
2. **SHA-256 hash chaining** — each event includes `hash = SHA256(prevHash + JSON.stringify(payload))`
3. **On-demand chain verification** — `verifyAllChains()` walks the chain and validates hashes
4. **Swap-ready interface** — the `appendVtaLedgerEvent()` / `appendVtcLedgerEvent()` API is designed to be replaced by a real DLT adapter without changing business logic

## Hash Chain Design

```
Event N:
  sequence: N
  prevHash: hash(Event N-1)
  hash: SHA256(prevHash + JSON.stringify(payload))
  payload: { ... event data ... }
```

The genesis event (sequence 1) uses `prevHash = "genesis"`.

Verification walks all events in sequence order and recomputes each hash. Any mismatch indicates tampering or data corruption.

## Rationale

- **No external dependencies** — runs entirely in Postgres, no blockchain node required
- **Demonstrates the architecture** — hash chaining is the same pattern used in real DLTs
- **Verifiable via HTTP** — `GET /ledger/verify` in the validator service exposes chain integrity
- **Swap-ready** — the interface layer means migrating to a real DLT is a package-level change, not a business logic change

## Consequences

- Hash chain verification is O(n) — acceptable for Phase 1 event volumes
- Postgres is not a real distributed ledger — tamper evidence is advisory, not cryptographically enforced at the storage layer
- Phase 2 will add Merkle tree structure for more efficient partial verification
- Phase 3 will add a real DLT adapter (Hyperledger Fabric or similar)

## Migration Path

| Phase | Ledger Backend |
|-------|---------------|
| Phase 1 | Postgres with hash chaining (this ADR) |
| Phase 2 | Postgres + Merkle tree indexing |
| Phase 3 | Hyperledger Fabric or IPFS adapter |
| Phase 4 | Fully distributed VDR (Verifiable Data Registry) |
