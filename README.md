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
│   ├── web/                 # PNM + CNM + VTN Manager (React)
│   └── validator/           # VMC/VP verification API
├── services/
│   ├── governance-api/      # Structured rules → PEP (stub)
│   ├── vtn-service/         # VTN federation (greenfield stub)
│   └── orchestrator/        # Provision VTA context + VTC
├── packages/
│   ├── brand-config/        # fpndtg.com subdomain defaults
│   ├── adapters-vti/        # Trust-Task HTTP clients → VTI
│   ├── pnv/                 # Personal Network Vault types
│   ├── ceremonies/          # Port OpenVTC flows (stub)
│   ├── didcomm/             # DIDComm helpers (stub)
│   └── governance-rules/    # Rule schema types (stub)
└── docs/
    └── adrs/                # Architecture decision records
```

## Prerequisites

- Node.js ≥ 20
- [pnpm](https://pnpm.io/) 9.x

## Quick start

```bash
pnpm install
pnpm build
pnpm dev:web          # http://localhost:5173
pnpm dev:validator    # http://localhost:8787
```

## Architecture decisions

See [docs/adrs/](docs/adrs/) and [docs/SCAFFOLD-BRIEF.md](docs/SCAFFOLD-BRIEF.md).

## License

Apache-2.0
