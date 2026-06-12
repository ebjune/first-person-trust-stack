# FPS scaffold brief — read this first

> **For Cursor / AI agents:** This file is the authoritative handoff from the VTI planning session.
> When the user says "scaffold the FPS monorepo", execute **Phase 1 scaffold** below.
> Do **not** ask what FPS is — everything you need is here.

## What this repo is

**First Person Trust Stack (FPS)** — a **separate, TypeScript-first** product layer under **[fpndtg.com](https://www.fpndtg.com)**.

It gives developers and operators **web UX** for PNM (Personal Network Manager), CNM (Community Network Manager), and VTN Manager — plus a governance control plane, VTN service, PNV wallet module, and validator.

**VTI** ([verifiable-trust-infrastructure](https://github.com/openvtc/verifiable-trust-infrastructure)) is the **protocol reference backend only**. FPS does not live inside VTI and does not require rebuilding Rust to develop.

**OpenVTC** is a **reference** for DIDComm/ceremony/holder UX to port into `packages/ceremonies` — not a runtime dependency.

## Decisions already made (do not re-litigate)

| Topic | Decision |
|-------|----------|
| Implementation path | **Path A** — TS product + HTTP adapters to live VTI (`vta.fpndtg.com`, `vtc.fpndtg.com`) |
| Language | TypeScript (~80% of repo); Rust optional later |
| Branding | `fpndtg.com` + `trusttasks.org/fpndtg` — **not** OpenVTC/Affinidi user-facing strings |
| Phase 0 | **Skipped** — VTI deploy paths are unstable; adapters point at live fpndtg subdomains |
| Repo location | This repo — **not** inside `verifiable-trust-infrastructure` |
| Dev environment | **Windows native** (Node 20+, pnpm 9+) — not WSL for FPS work |

## Entity model

```
Person → administers VTC(s), holds pVTA
VTA    → key custody + contexts (not "people")
VTC    → governed community (C-DID); members are people/agents; issues VMC
VTN    → federation of VTCs (NOT in VTI today — greenfield in FPS)
```

VTI has VTA + VTC. **Zero VTN code** in VTI. VTN is built in `services/vtn-service`.

## Domain map (`fpndtg.com`)

| Host | Role | Status |
|------|------|--------|
| `www.fpndtg.com` | Developer landing (links only, not an API) | Live |
| `vta.fpndtg.com` | VTA REST + auth | Live |
| `mediator.fpndtg.com` | DIDComm v2 mediator | Live |
| `dids.fpndtg.com` | WebVH / did.jsonl hosting | Live |
| `vtc.fpndtg.com` | VTC API | Live / partial |
| `app.fpndtg.com` | PNM/CNM/VTN web UI → `apps/web` | Planned |
| `validator.fpndtg.com` | VMC/VP verifier → `apps/validator` | Planned |
| `governance.fpndtg.com` | Governance Control Plane → `services/governance-api` | Planned |
| `vtn.fpndtg.com` | VTN federation → `services/vtn-service` | Planned |

Defaults live in `packages/brand-config`.

## Target monorepo layout

```
first-person-trust-stack/
├── apps/
│   ├── web/                 # PNM + CNM + VTN Manager (React + Vite)
│   └── validator/           # VMC/VP verification API (Hono)
├── services/
│   ├── governance-api/      # Structured rules → PEP (stub README + package.json)
│   ├── vtn-service/         # VTN lifecycle (stub)
│   └── orchestrator/        # Provision VTA context + VTC via VTI (stub)
├── packages/
│   ├── brand-config/        # fpndtg.com subdomain constants
│   ├── adapters-vti/        # Trust-Task HTTP clients → VTA/VTC
│   ├── pnv/                 # Wallet / vault types (interfaces only for now)
│   ├── ceremonies/          # Port OpenVTC flows (stub)
│   ├── didcomm/             # DIDComm helpers (stub)
│   └── governance-rules/    # Rule schema types (stub)
├── deploy/docker-compose/   # Placeholder README (FPS + optional VTI later)
└── docs/
    └── adrs/
        ├── 001-path-a-vti-adapters.md
        ├── 002-custody-models.md
        └── 003-entity-model.md
```

## Phase 1 scaffold — what to build now

Create a **pnpm workspace** monorepo with:

### Root

- `package.json` — workspaces, scripts: `build`, `dev`, `dev:web`, `dev:validator`, `typecheck`
- `pnpm-workspace.yaml` — `apps/*`, `packages/*`, `services/*`
- `tsconfig.base.json`
- `.gitignore` — node_modules, dist, .env
- `README.md` — relationship to VTI, domain map, quick start

### `packages/brand-config`

Export typed constants for all fpndtg subdomains + Trust Task org prefix `trusttasks.org/fpndtg`.

### `packages/adapters-vti`

Minimal typed fetch clients:

- `vtaHealth(baseUrl)` — GET health/readiness
- `vtcHealth(baseUrl)`
- Pattern for `Trust-Task` HTTP header on VTC routes (see VTI `trust-tasks/` specs)
- Use `@fpndtg/brand-config` defaults; allow env override

Reference VTI repo (external): `trust-tasks/join-requests/submit/1.0/spec.md`

### `packages/pnv`

TypeScript interfaces only: `Credential`, `Presentation`, `WalletStore` — no crypto impl yet.

### `apps/validator`

Hono on Node, port 8787:

- `GET /health`
- `POST /verify` — stub: accepts `{ presentation }`, returns `{ valid: false, reason: "not implemented" }` with TODO for did resolution via `dids.fpndtg.com`

### `apps/web`

Vite + React + TypeScript, port 5173:

- Landing dashboard listing fpndtg subdomains with live/planned badges
- Links to VTA/VTC health checks via `@fpndtg/adapters-vti` (client-side fetch to public endpoints)
- Placeholder nav: PNM | CNM | VTN Manager

### Service stubs

Each of `governance-api`, `vtn-service`, `orchestrator`:

- `package.json`, `README.md` describing future role
- No implementation yet beyond package shell

### Package stubs

`ceremonies`, `didcomm`, `governance-rules` — `package.json` + README one-liner.

### ADRs (write content, not empty files)

- **001** — Path A chosen; VTI as adapter backend; TS for product velocity
- **002** — Sovereign / delegated / custodial hybrid; UI must label custody mode
- **003** — VTA vs VTC vs VTN hierarchy (see entity model above)

## Standards alignment (context only — not scaffold blockers)

- [ToIP model](https://trustoverip.org/toip-model/)
- [Trust Tasks](https://trusttasks.org/) — interoperability waist; contribute under `fpndtg` org
- DTG Hybrid Interaction Architecture baseline
- dtgwg-cred-tf dtg.md v0.3 — VMC/VRC bidirectional pairs (gap analysis later)

## What NOT to do

- Do not add FPS code to `verifiable-trust-infrastructure`
- Do not require VTI Rust rebuild for local FPS dev
- Do not document VTI deploy errors (Phase 0 skipped)
- Do not use Affinidi/OpenVTC branding in user-facing strings
- Do not over-engineer: stubs are fine; ship working `pnpm install && pnpm build`

## After scaffold

User will `git add`, commit, and push to `https://github.com/ebjune/first-person-trust-stack.git`.

Next phases (not this task):

1. Validator spike — real VP/VMC verify + status list
2. Governance API OpenAPI sketch
3. VTN service spec
4. CNM wizard via orchestrator

## External references

| Resource | URL |
|----------|-----|
| This repo | https://github.com/ebjune/first-person-trust-stack |
| VTI (reference) | https://github.com/openvtc/verifiable-trust-infrastructure |
| Live VTA | https://vta.fpndtg.com |
| Live mediator | https://mediator.fpndtg.com |
| Live DIDs | https://dids.fpndtg.com |
