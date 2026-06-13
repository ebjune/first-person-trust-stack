# ADR-003: Entity model — VTA, VTC, VTN

## Status

Accepted

## Context

DTG and ToIP use specific meanings for VTA, VTC, and VTN. Confusing "VTN contains VTAs" or "VTC contains people as keys" breaks federation and credential semantics.

## Decision

```
Person  → administers VTC(s), may hold pVTA
VTA     → key custody + contexts (integrations); not membership roster
VTC     → governed community (C-DID); members are people/agents; issues VMC
VTN     → federation of VTCs; members are VTC C-DIDs; cross-community recognition
```

- One VTI VTC binary = one community. Scale by **provisioning more VTCs** (orchestrator), not merging communities in one process.
- VTN is **not in VTI** — implement in `services/vtn-service`.
- VTA hosts WebVH, DIDComm, REST; contexts isolate integrations (mediator, webvh-host, app, etc.).

## Consequences

- CNM manages VTCs; VTN Manager manages VTNs; PNM manages personal memberships and pVTA.
- Recognition flows are VTN-scoped, not VTA-scoped.
- Social app "groups" map to dedicated VTCs when on-graph; app DB remains default for private groups.
