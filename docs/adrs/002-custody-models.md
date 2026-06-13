# ADR-002: Custody models

## Status

Accepted

## Context

FPS serves sovereign server OS integrators (Client A) and hosted social apps (Client B). Key custody and trust boundaries must be explicit — not implied by defaults.

## Decision

Support three custody modes with **UI labels** on every flow that touches keys or credentials:

| Mode | Who holds keys | Typical user |
|------|----------------|--------------|
| **Sovereign** | User device / local pVTA | OS integrator, power users |
| **Delegated** | User keys, FPS/VTA signs on policy | Self-hosted with automation |
| **Custodial** | Platform-operated VTA | Hosted app onboarding |

Hybrid is allowed: e.g. custodial platform VTA for app identity + sovereign pVTA for personal VMC presentation.

Governance policies and VTN membership records are **portable JSON** exportable from the Governance API — not locked to one host.

## Consequences

- Every wizard and settings screen must show custody mode.
- PNV (`packages/pnv`) abstracts storage; implementations differ per mode.
- Validator and ceremonies must not assume custodial-only or sovereign-only.
