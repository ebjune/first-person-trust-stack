# ADR-001: Path A — TypeScript product + VTI adapters

## Status

Accepted

## Context

We need a user-manageable trust stack (PNM, CNM, VTN Manager) under `fpndtg.com`. VTI provides mature VTA/VTC wire protocols in Rust but CLI-heavy UX, embedded Rego governance, no VTN service, and unstable multi-path deployment docs.

Three paths were considered:

- **A** — Greenfield TS product + HTTP adapters to VTI
- **B** — Full greenfield TS engines (replace VTI over time)
- **C** — Extend VTI in Rust

## Decision

Adopt **Path A** for v1:

- FPS repo is **TypeScript-first** (pnpm monorepo).
- `packages/adapters-vti` calls live VTI at `vta.fpndtg.com` and `vtc.fpndtg.com`.
- Governance API and VTN service are **greenfield in FPS** (gaps VTI does not cover).
- OpenVTC informs ceremony UX; port to `packages/ceremonies` — not a runtime dependency.

## Consequences

- Fast product iteration without Rust rebuild cycles.
- VTI churn isolated behind adapter boundary.
- Re-evaluate Path B after Phase 2 if adapter maintenance cost exceeds benefit.
- Contract tests against VTI + Trust Task golden fixtures recommended.
