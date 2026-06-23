# First Person Trust Stack (FPS)

TypeScript-first product layer for sovereign trust infrastructure under [fpndtg.com](https://www.fpndtg.com).

FPS provides web UX for **PNM** (Personal Network Manager), **CNM** (Community Network Manager), and **VTN** (Verifiable Trust Network) operations, plus a governance control plane and validator — while using [Verifiable Trust Infrastructure](https://github.com/openvtc/verifiable-trust-infrastructure) (VTI) as the **protocol reference backend** via HTTP adapters.

## Relationship to VTI

| Layer | Role |
|-------|------|
| **FPS** (this repo) | Product UX, ceremonies, governance API, VTN service, PNV, validator |
| **VTI** (external) | VTA/VTC wire protocol, sealed transfer, Trust Tasks — deployed at `*.fpndtg.com` |
| **OpenVTC** (reference) | Holder client patterns to port into `packages/ceremonies` |

You do **not** need to rebuild VTI to develop FPS. Point adapters at live endpoints (see `packages/brand-config`).

## Domain map (`fpndtg.com`)

| Host | Service | Status |
|------|---------|--------|
| [www.fpndtg.com](https://www.fpndtg.com) | Developer landing | Live |
| [vta.fpndtg.com](https://vta.fpndtg.com) | Verifiable Trust Agent | Live |
| [mediator.fpndtg.com](https://mediator.fpndtg.com) | DIDComm mediator | Live |
| [dids.fpndtg.com](https://dids.fpndtg.com) | WebVH / did.jsonl hosting | Live |
| [vtc.fpndtg.com](https://vtc.fpndtg.com) | Verifiable Trust Community | Live / partial |
| [app.fpndtg.com](https://app.fpndtg.com) | PNM / CNM / VTN web UI (`apps/web`) | Planned |
| [validator.fpndtg.com](https://validator.fpndtg.com) | VMC / VP verifier (`apps/validator`) | Planned |
| [governance.fpndtg.com](https://governance.fpndtg.com) | Governance Control Plane | Planned |
| [vtn.fpndtg.com](https://vtn.fpndtg.com) | VTN federation service | Planned |

## Repository layout

```
first-person-trust-stack/
├── apps/
│   ├── web/                 # PNM + CNM + VTN Manager (React + Vite + Tailwind)
│   └── validator/           # VMC/VP verification API (Hono, port 8787)
├── services/
│   ├── auth-service/        # DID challenge/verify + session management (Hono, port 8788)
│   ├── orchestrator/        # VTA/VTC provisioning + Trust Task proxy (Hono, port 8789)
│   ├── sync-service/        # Cross-DB event sync (infra ↔ user)
│   ├── governance-api/      # Structured rules → PEP (stub)
│   └── vtn-service/         # VTN federation (greenfield stub)
├── packages/
│   ├── brand-config/        # fpndtg.com subdomain defaults
│   ├── adapters-vti/        # Trust-Task HTTP clients → VTI
│   ├── auth-vta/            # DID challenge generation + signature verification
│   ├── ledger-emulator/     # Postgres-backed append-only event ledger
│   ├── db-infra/            # Prisma client for fps_infra (infrastructure DB)
│   ├── db-user/             # Prisma client for fps_user (user activity DB)
│   ├── event-bridge/        # Cross-DB pub/sub channel (infra ↔ user)
│   ├── tsp/                 # Trust Spanning Protocol event types
│   ├── pnv/                 # Personal Network Vault types
│   ├── ceremonies/          # Port OpenVTC flows (stub)
│   ├── didcomm/             # DIDComm helpers (stub)
│   └── governance-rules/    # Rule schema types (stub)
└── docs/
    ├── SCAFFOLD-BRIEF.md    # Authoritative project handoff doc
    ├── WEB-UI-PLAN.md       # Web UI architecture plan
    └── adrs/                # Architecture decision records
```

## Prerequisites

- Node.js ≥ 20
- [pnpm](https://pnpm.io/) 9.x
- PostgreSQL (two databases: `fps_infra` and `fps_user`)

## Environment setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Key variables:

```env
# DB Connection Variables
----------------------------------------------
DB_HOST=REPLACE_WITH_DB_HOST
DB_PORT=REPLACE_WITH_DB_PORT (typically 5432)
DB_USER=REPLACE_WITH_DB_USER
DB_PASSWORD=REPLACE_WITH_DB_USER_PASSWORD

# Infrastructure DB (VTA/VTC events, Trust Task audit log, verification events)
DATABASE_INFRA_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/fps_infra

# User DB (sessions, user profiles, activity log)
DATABASE_USER_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/fps_user

# Phase 1: bypass DID signature verification (development only)
AUTH_SKIP_SIGNATURE_VERIFY=true

# Service ports (optional — these are the defaults)
AUTH_SERVICE_PORT=8788
ORCHESTRATOR_PORT=8789
```

## Database setup

Run Prisma migrations for both databases:

```bash
# Infrastructure DB
pnpm --filter @fpndtg/db-infra db:migrate

# User DB
pnpm --filter @fpndtg/db-user db:migrate
```

## Build

```bash
pnpm install
pnpm build
```

## Running the full stack (development)

Each service runs in its own terminal. Start them in this order:

```bash
# Terminal 1 — Auth Service (port 8788)
pnpm --filter @fpndtg/auth-service start

# Terminal 2 — Orchestrator (port 8789)
pnpm --filter @fpndtg/orchestrator start

# Terminal 3 — Validator (port 8787)
pnpm --filter @fpndtg/validator start

# Terminal 4 — Web UI (port 5173)
pnpm dev:web
```

Then open **http://localhost:5173** in your browser.

### Service summary

| Service | Port | Purpose |
|---------|------|---------|
| `auth-service` | 8788 | DID challenge/verify, session tokens, user creation |
| `orchestrator` | 8789 | VTA/VTC provisioning, Trust Task proxy, ledger writes |
| `validator` | 8787 | VP/VMC verification (stub), ledger integrity checks, Trust Task log |
| `web` | 5173 | React UI — PNM, CNM, VTN Manager, Infra Monitor |

## First-time login

1. Open http://localhost:5173
2. Click **"Create a new VTA"**
3. Enter a username (e.g. `alice`) — your DID will be `did:webvh:dids.fpndtg.com:alice`
4. Choose a context (`personal` for your primary identity)
5. Click **"Create VTA & Sign in"**
6. On the challenge screen, click **"Sign in"** (Phase 1: signature is stubbed)

> **Note:** `AUTH_SKIP_SIGNATURE_VERIFY=true` must be set in `.env` for the stub login to work. This will be replaced with real `did:webvh` signature verification in Phase 2.

## Entity model

```
Person → administers VTC(s), holds pVTA
VTA    → key custody + contexts (not "people")
           └─ did:webvh:dids.fpndtg.com:<username>
VTC    → governed community (C-DID); members are people/agents; issues VMC
VTN    → federation of VTCs (greenfield in FPS — not in VTI)
```

## Database architecture

FPS uses **two separate Postgres databases** to separate concerns:

| Database | Package | Purpose |
|----------|---------|---------|
| `fps_infra` | `@fpndtg/db-infra` | VTA/VTC ledger events, Trust Task audit log, TSP events, verification events |
| `fps_user` | `@fpndtg/db-user` | User profiles, sessions, activity log, VTA/VTC associations |

The `@fpndtg/event-bridge` package provides a pub/sub channel between the two databases so infrastructure events (e.g. VTA created) can trigger user-side updates (e.g. associate VTA with user profile) without tight coupling.

## Ledger emulator

`@fpndtg/ledger-emulator` provides a Postgres-backed append-only event ledger that emulates distributed ledger semantics:

- Each event has a sequence number, timestamp, and SHA-256 hash of `(previousHash + payload)`
- The hash chain can be verified at any time via `GET /ledger/verify` on the validator
- Separate chains for VTA events and VTC events
- Designed to be replaced by a real distributed ledger in a future phase

## Architecture decisions

See [docs/adrs/](docs/adrs/) and [docs/SCAFFOLD-BRIEF.md](docs/SCAFFOLD-BRIEF.md).

## License

Apache-2.0
