# Phase 2A — DID Resolver Service

> **Status:** In progress  
> **Service:** `services/did-resolver`  
> **Port:** 8792 (configurable via `DID_RESOLVER_PORT`)  
> **Deployment target:** `dids.fpndtg.com` (Nginx reverse proxy → `localhost:8792`)

---

## Overview

Build `services/did-resolver` to implement the **did:webvh** specification, serving DID documents for `did:webvh:dids.fpndtg.com:*` identifiers. This service reads from the `fps_infra.vta_events` ledger to construct DID documents with full version history.

The resolver is **read-only** — it never writes to the ledger. All writes go through the orchestrator.

---

## Architecture

| Concern | Detail |
|---------|--------|
| Framework | Hono on Node (`@hono/node-server`) |
| Database | Read-only access to `fps_infra` via `@fpndtg/db-infra` |
| DID method | `did:webvh` |
| Port | 8792 |
| Dependencies | `@fpndtg/db-infra`, `@fpndtg/brand-config` |

---

## did:webvh Specification Requirements

1. **Serve DID documents** at `GET /:did/did.json` (latest version)
2. **Serve version history** at `GET /:did/did.jsonl` (append-only log, one JSON doc per line)
3. **Support version queries** via `?versionId=<hash>` or `?versionTime=<ISO8601>`
4. **Hash-chain integrity** — each version references the previous version's hash via `previousVersionId`
5. **Content-Type** — `application/did+json` for `.json`, `application/did+jsonl` for `.jsonl`

---

## API Endpoints

### `GET /health`

```json
{
  "status": "ok",
  "service": "fps-did-resolver",
  "method": "did:webvh"
}
```

---

### `GET /:did/did.json`

Resolve the **latest** DID document for a given DID.

**Example:** `GET /did:webvh:dids.fpndtg.com:alice/did.json`

**Logic:**
1. Parse DID → extract username (`alice`)
2. Query `fps_infra.vta_events` for the latest `created` or `rotated` event for that DID
3. Construct DID document from event payload
4. Return with `Content-Type: application/did+json`

**Response shape:**
```json
{
  "@context": ["https://www.w3.org/ns/did/v1"],
  "id": "did:webvh:dids.fpndtg.com:alice",
  "verificationMethod": [{
    "id": "did:webvh:dids.fpndtg.com:alice#key-1",
    "type": "Ed25519VerificationKey2020",
    "controller": "did:webvh:dids.fpndtg.com:alice",
    "publicKeyMultibase": "z6Mk..."
  }],
  "authentication": ["#key-1"],
  "service": [{
    "id": "#mediator",
    "type": "DIDCommMessaging",
    "serviceEndpoint": "https://mediator.fpndtg.com"
  }],
  "versionId": "sha256:abc123...",
  "updated": "2026-06-24T18:00:00Z"
}
```

**Phase 1 note:** VTA events created by the orchestrator currently store minimal payload (did, context, provisionedAt). The DID document builder synthesizes a minimal valid DID document from this. Full key material will be added in Phase 2B when VTI provisioning is wired up.

---

### `GET /:did/did.jsonl`

Serve the **full version history** as JSON Lines (one DID document per line, chronological).

**Example:** `GET /did:webvh:dids.fpndtg.com:alice/did.jsonl`

**Response:** `Content-Type: application/did+jsonl`

```jsonl
{"@context":["https://www.w3.org/ns/did/v1"],"id":"did:webvh:dids.fpndtg.com:alice",...,"versionId":"sha256:abc123","updated":"2026-06-24T18:00:00Z"}
{"@context":["https://www.w3.org/ns/did/v1"],"id":"did:webvh:dids.fpndtg.com:alice",...,"versionId":"sha256:def456","previousVersionId":"sha256:abc123","updated":"2026-06-24T19:00:00Z"}
```

---

### `GET /:did/did.json?versionId=<hash>`

Resolve a **specific version** by its `versionId` (the event's `hash` field).

---

### `GET /:did/did.json?versionTime=<ISO8601>`

Resolve the DID document **as it existed at a specific time** — returns the latest event at or before the given timestamp.

---

## Database Schema (Existing — read-only)

The service reads from `fps_infra.vta_events`:

```
VtaEvent {
  id        String   // cuid
  sequence  Int      // autoincrement
  did       String   // e.g. "did:webvh:dids.fpndtg.com:alice"
  eventType String   // "created" | "rotated" | "revoked"
  timestamp DateTime
  payload   Json     // DID document data (see below)
  hash      String   // SHA-256 of (prevHash + JSON.stringify(payload))
  prevHash  String   // hash of previous event (or "000...0" for first)
}
```

**Payload structure** (as written by orchestrator `/vta/provision`):
```json
{
  "did": "did:webvh:dids.fpndtg.com:alice",
  "context": "personal",
  "provisionedAt": "2026-06-24T18:00:00Z",
  "source": "orchestrator"
}
```

**Phase 2B:** orchestrator will be updated to include `verificationMethod`, `authentication`, and `service` in the payload when VTI provisioning is wired up.

---

## DID Document Builder

`src/builder.ts` constructs a valid DID document from a `VtaEvent`:

- Synthesizes `verificationMethod` from payload if present, or generates a placeholder `#key-1` entry
- Adds `service` endpoint for `mediator.fpndtg.com` by default
- Sets `versionId` = `sha256:<event.hash>`
- Sets `previousVersionId` = `sha256:<event.prevHash>` (omitted for genesis event)
- Sets `updated` = `event.timestamp.toISOString()`

---

## New db-infra Queries

Two new query functions added to `packages/db-infra/src/repositories/vta-events.ts`:

- `getVtaEventByHash(hash: string)` — find event by its `hash` field (for `?versionId=`)
- `getVtaEventAtTime(did: string, timestamp: Date)` — find latest event for DID at or before timestamp (for `?versionTime=`)

Both are exported from `packages/db-infra/src/index.ts`.

---

## Orchestrator Update

`services/orchestrator/src/index.ts` — `POST /vta/provision` payload enriched to include:

```json
{
  "did": "did:webvh:dids.fpndtg.com:alice",
  "context": "personal",
  "provisionedAt": "...",
  "source": "orchestrator",
  "verificationMethod": [{
    "id": "#key-1",
    "type": "Ed25519VerificationKey2020",
    "controller": "did:webvh:dids.fpndtg.com:alice",
    "publicKeyMultibase": null
  }],
  "authentication": ["#key-1"],
  "service": [{
    "id": "#mediator",
    "type": "DIDCommMessaging",
    "serviceEndpoint": "https://mediator.fpndtg.com"
  }]
}
```

`publicKeyMultibase: null` is a Phase 1 placeholder — real key material comes from VTI in Phase 2B.

---

## Environment Variables

```env
DID_RESOLVER_PORT=8792
DATABASE_INFRA_URL=postgresql://...
```

---

## Deployment (Nginx)

```nginx
server {
    listen 80;
    server_name dids.fpndtg.com;

    location / {
        proxy_pass http://localhost:8792;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Success Criteria

- [ ] `pnpm build` passes with did-resolver included
- [ ] `GET /health` returns 200
- [ ] `GET /did:webvh:dids.fpndtg.com:alice/did.json` returns valid DID document for a provisioned DID
- [ ] `GET /did:webvh:dids.fpndtg.com:alice/did.jsonl` returns version history
- [ ] `?versionId=sha256:<hash>` returns the correct historical version
- [ ] `?versionTime=<ISO8601>` returns the correct historical version
- [ ] 404 returned for unknown DIDs
- [ ] 400 returned for malformed DID format
- [ ] CORS allows `localhost:5173` and `app.fpndtg.com`

---

## Next Steps (Phase 2B)

1. Wire VTI VTA provisioning API in orchestrator (replace ledger-only stub)
2. Store real key material (`publicKeyMultibase`) from VTI response in event payload
3. Add `deactivated` DID document support (for `revoked` events)
4. Add validator integration — resolve DIDs via this service for VP verification
