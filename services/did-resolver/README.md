# DID Resolver Service

Implements the **did:webvh** specification for `did:webvh:dids.fpndtg.com:*` identifiers.

Reads from the `fps_infra.vta_events` ledger to serve DID documents and version history.

**Port:** 8792  
**Deployment target:** `dids.fpndtg.com`  
**Spec:** [docs/PHASE-2A-DID-RESOLVER.md](../../docs/PHASE-2A-DID-RESOLVER.md)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/:did/did.json` | Latest DID document |
| `GET` | `/:did/did.json?versionId=sha256:<hash>` | Specific version by hash |
| `GET` | `/:did/did.json?versionTime=<ISO8601>` | Version at a point in time |
| `GET` | `/:did/did.jsonl` | Full version history (JSON Lines) |
