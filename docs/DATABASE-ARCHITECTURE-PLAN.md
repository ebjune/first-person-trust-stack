# FPS Database Architecture Plan

> **Status:** Approved — ready for implementation  
> **Date:** 2026-06-23  
> **Author:** Architecture session with AI assistant

---

## Overview

This document describes the dual-database architecture for the First Person Trust Stack (FPS) emulator. The goal is to build a Postgres-backed system that emulates ledger functionality for decentralized trust operations (VTA issuance, VTC lifecycle, credential ceremonies, trust task activity) while maintaining a clean separation between infrastructure-level and user-level concerns.

The emulator is designed to be the **architectural proving ground** for the next iteration of the stack — demonstrating end-to-end usage of decentralized trust graph components, ToIP infrastructure, and application layers before migrating to a fully distributed/decentralized system.

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| ORM / migrations | **Prisma** | Type-safe, excellent migration tooling, easy to debug |
| Event bridge | **Postgres LISTEN/NOTIFY** | Simple, debuggable, no extra infrastructure |
| Authentication | **DID-based auth via VTA** | Aligns with sovereign identity paradigm; provides developer tooling for DID/VTA auth |
| Ledger verification | **On-demand via API** | Avoids background complexity; explicit verification when needed |
| Infrastructure | **Direct Postgres on Ubuntu server** | No Docker for now; easy debugging path; Docker when modules break out |
| Messaging protocol | **TSP (Trust Spanning Protocol)** | Replaces DIDComm; TSP supports DIDComm anyway |

---

## Two-Database Design

### Why Two Databases?

- **Separation of concerns:** Infrastructure events (immutable, append-only) vs. user state (mutable)
- **Different consistency requirements:** Ledger events are write-once; user data is updated frequently
- **Simulates network partition scenarios** for future distributed architecture
- **Clean API boundaries** enforced by physical separation — easier to migrate to distributed later
- **Different access patterns:** Infra DB is audit/compliance-oriented; User DB is query-optimized for UX

### Database 1: Infrastructure DB (`fps_infra`)

Logs all VTI-level and protocol-level operations. **Append-only by convention** — no UPDATEs, only INSERTs. Includes cryptographic hash chaining for tamper evidence.

**Tables:**
- `VtaEvent` — VTA lifecycle (created, rotated, revoked)
- `VtcEvent` — VTC lifecycle (created, member_added, governance_changed)
- `TspEvent` — TSP message routing logs
- `TrustTaskLog` — HTTP audit trail for Trust Task calls to VTI
- `VerificationEvent` — Credential verification attempts

### Database 2: User DB (`fps_user`)

Tracks user-facing state. Mutable. Optimized for UX queries.

**Tables:**
- `User` — User accounts (email optional, primary DID required)
- `UserVta` — User's view of their VTAs (friendly names, custody mode)
- `VtcMembership` — Community memberships and roles
- `WalletCredential` — VMCs and other VCs held by user
- `AuthSession` — Active authentication sessions
- `ActivityLog` — User action history

---

## Prisma Schema

### Infrastructure DB (`packages/db-infra/prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_INFRA_URL")
}

generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client-infra"
}

// Append-only event log for VTA lifecycle
model VtaEvent {
  id          String   @id @default(cuid())
  sequence    Int      @default(autoincrement())
  did         String   @db.VarChar(255)
  eventType   String   @db.VarChar(50)  // created | rotated | revoked
  timestamp   DateTime @default(now())
  payload     Json
  hash        String   @db.VarChar(64)  // SHA-256 of (prevHash + payload)
  prevHash    String   @db.VarChar(64)

  @@index([did, timestamp])
  @@index([sequence])
}

// VTC lifecycle events
model VtcEvent {
  id          String   @id @default(cuid())
  sequence    Int      @default(autoincrement())
  cdid        String   @db.VarChar(255)  // Community DID
  eventType   String   @db.VarChar(50)   // created | member_added | governance_changed
  timestamp   DateTime @default(now())
  payload     Json
  hash        String   @db.VarChar(64)
  prevHash    String   @db.VarChar(64)

  @@index([cdid, timestamp])
  @@index([sequence])
}

// TSP message routing logs
model TspEvent {
  id          String   @id @default(cuid())
  messageId   String   @unique @db.VarChar(255)
  fromDid     String   @db.VarChar(255)
  toDid       String   @db.VarChar(255)
  eventType   String   @db.VarChar(50)  // sent | delivered | failed
  timestamp   DateTime @default(now())
  payload     Json

  @@index([fromDid, timestamp])
  @@index([toDid, timestamp])
}

// Trust Task HTTP audit log
model TrustTaskLog {
  id           String   @id @default(cuid())
  taskUri      String   @db.VarChar(500)
  method       String   @db.VarChar(10)
  endpoint     String   @db.VarChar(500)
  statusCode   Int
  timestamp    DateTime @default(now())
  requestBody  Json?
  responseBody Json?

  @@index([taskUri, timestamp])
}

// Verification attempts
model VerificationEvent {
  id             String   @id @default(cuid())
  presentationId String   @db.VarChar(255)
  verifierDid    String   @db.VarChar(255)
  result         String   @db.VarChar(20)  // valid | invalid | error
  timestamp      DateTime @default(now())
  details        Json

  @@index([verifierDid, timestamp])
}
```

### User DB (`packages/db-user/prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_USER_URL")
}

generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client-user"
}

model User {
  id          String   @id @default(cuid())
  email       String?  @unique
  primaryDid  String   @unique @db.VarChar(255)
  displayName String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  vtas        UserVta[]
  memberships VtcMembership[]
  credentials WalletCredential[]
  sessions    AuthSession[]
  activityLog ActivityLog[]
}

// User's view of their VTAs
model UserVta {
  id          String   @id @default(cuid())
  userId      String
  did         String   @unique @db.VarChar(255)
  label       String   @db.VarChar(100)
  custodyMode String   @db.VarChar(20)  // sovereign | delegated | custodial
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

// VTC memberships
model VtcMembership {
  id       String   @id @default(cuid())
  userId   String
  cdid     String   @db.VarChar(255)  // Community DID
  role     String   @db.VarChar(50)   // admin | member | viewer
  joinedAt DateTime @default(now())
  status   String   @db.VarChar(20)   // active | suspended | left

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, cdid])
  @@index([cdid])
}

// Wallet credentials (VMCs, VCs)
model WalletCredential {
  id             String    @id @default(cuid())
  userId         String
  credentialId   String    @unique @db.VarChar(255)
  type           String    @db.VarChar(100)
  issuerDid      String    @db.VarChar(255)
  issuedAt       DateTime
  expiresAt      DateTime?
  status         String    @db.VarChar(20)  // active | revoked | expired
  credentialData Json

  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, status])
  @@index([issuerDid])
}

// Auth sessions
model AuthSession {
  id         String   @id @default(cuid())
  userId     String
  token      String   @unique @db.VarChar(255)
  did        String   @db.VarChar(255)
  createdAt  DateTime @default(now())
  expiresAt  DateTime
  lastUsedAt DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
}

// User activity log
model ActivityLog {
  id        String   @id @default(cuid())
  userId    String
  action    String   @db.VarChar(100)
  timestamp DateTime @default(now())
  metadata  Json?

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, timestamp])
}
```

---

## Revised Monorepo Structure

```
fpts-exploratory/
├── packages/
│   ├── db-infra/              # Infrastructure database (Prisma)
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── client.ts      # PrismaClient singleton
│   │       ├── repositories/  # Type-safe data access
│   │       └── index.ts
│   │
│   ├── db-user/               # User database (Prisma)
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── client.ts
│   │       ├── repositories/
│   │       └── index.ts
│   │
│   ├── event-bridge/          # Postgres LISTEN/NOTIFY bridge
│   │   └── src/
│   │       ├── bus.ts         # Event bus using pg NOTIFY
│   │       ├── handlers/      # Cross-DB event handlers
│   │       ├── types.ts       # Event schemas
│   │       └── index.ts
│   │
│   ├── ledger-emulator/       # Append-only ledger abstraction
│   │   └── src/
│   │       ├── index.ts       # Ledger interface
│   │       ├── vta-ledger.ts  # VTA issuance log
│   │       ├── vtc-ledger.ts  # VTC lifecycle log
│   │       └── verifier.ts    # Hash-chain verification
│   │
│   ├── tsp/                   # Trust Spanning Protocol
│   │   ├── README.md
│   │   └── src/
│   │       ├── index.ts       # TSP message types
│   │       ├── transport.ts   # Transport layer abstraction
│   │       └── didcomm-compat.ts  # DIDComm bridge (if needed)
│   │
│   └── auth-vta/              # VTA-based authentication
│       └── src/
│           ├── index.ts       # Auth middleware
│           ├── challenge.ts   # DID auth challenge/response
│           ├── verifier.ts    # Verify DID signatures
│           └── session.ts     # Session management
│
├── services/
│   ├── auth-service/          # Authentication service (Hono)
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── routes/
│   │       │   ├── challenge.ts   # POST /auth/challenge
│   │       │   ├── verify.ts      # POST /auth/verify
│   │       │   └── session.ts     # GET /auth/session
│   │       └── middleware/
│   │           └── did-auth.ts
│   │
│   ├── orchestrator/          # Enhanced with DB logging
│   │   └── src/
│   │       ├── index.ts
│   │       ├── vta-provisioner.ts  # Calls VTI + logs to infra DB
│   │       ├── vtc-provisioner.ts
│   │       └── event-logger.ts
│   │
│   └── sync-service/          # DB synchronization service
│       ├── package.json
│       └── src/
│           ├── index.ts       # Subscribes to NOTIFY events
│           ├── reconciler.ts
│           └── handlers/
│               ├── vta-sync.ts
│               └── vtc-sync.ts
│
├── apps/
│   ├── web/                   # Enhanced with auth + DB queries
│   │   └── src/
│   │       ├── auth/          # Auth context, hooks
│   │       ├── api/           # API client with auth headers
│   │       └── pages/
│   │           ├── Login.tsx
│   │           ├── PNM.tsx    # Personal Network Manager
│   │           ├── CNM.tsx    # Community Network Manager
│   │           └── VTN.tsx    # VTN Manager
│   │
│   └── validator/             # Enhanced with ledger verification
│       └── src/
│           ├── routes/
│           │   ├── verify.ts
│           │   └── ledger.ts  # GET /ledger/verify
│           └── index.ts
│
└── docs/
    ├── adrs/
    │   ├── 004-dual-database-architecture.md
    │   ├── 005-tsp-over-didcomm.md
    │   ├── 006-vta-based-authentication.md
    │   └── 007-ledger-emulation-strategy.md
    └── DATABASE-SETUP.md      # Postgres connection guide
```

---

## Event Bridge Design

Using Postgres LISTEN/NOTIFY for cross-database communication. This is the simplest possible event bridge — no extra infrastructure, easy to debug, and sufficient for the emulator phase.

```typescript
// packages/event-bridge/src/types.ts
export type InfraEvent =
  | { type: 'vta.created'; did: string; timestamp: string }
  | { type: 'vta.rotated'; did: string; timestamp: string }
  | { type: 'vtc.created'; cdid: string; adminDid: string }
  | { type: 'vtc.member_added'; cdid: string; memberDid: string }
  | { type: 'vmc.issued'; credentialId: string; holderDid: string };

export type UserEvent =
  | { type: 'user.vta.claimed'; userId: string; did: string }
  | { type: 'user.joined.vtc'; userId: string; cdid: string }
  | { type: 'user.credential.stored'; userId: string; credentialId: string };

export interface EventBus {
  publishInfra(channel: string, event: InfraEvent): Promise<void>;
  publishUser(channel: string, event: UserEvent): Promise<void>;
  subscribeInfra(channel: string, handler: (event: InfraEvent) => Promise<void>): void;
  subscribeUser(channel: string, handler: (event: UserEvent) => Promise<void>): void;
}
```

```typescript
// packages/event-bridge/src/bus.ts
import { Client } from 'pg';

export class PostgresEventBus {
  private infraClient: Client;
  private userClient: Client;

  constructor(infraUrl: string, userUrl: string) {
    this.infraClient = new Client({ connectionString: infraUrl });
    this.userClient = new Client({ connectionString: userUrl });
  }

  async connect() {
    await this.infraClient.connect();
    await this.userClient.connect();
  }

  async publishInfra(channel: string, payload: unknown) {
    await this.infraClient.query(
      'SELECT pg_notify($1, $2)',
      [channel, JSON.stringify(payload)]
    );
  }

  subscribeInfra(channel: string, handler: (payload: unknown) => Promise<void>) {
    this.infraClient.query(`LISTEN ${channel}`);
    this.infraClient.on('notification', async (msg) => {
      if (msg.channel === channel) {
        await handler(JSON.parse(msg.payload!));
      }
    });
  }

  // Mirror pattern for userClient...
}
```

---

## Ledger Emulator Design

Provides append-only log semantics with hash-chain verification. The abstraction is designed so the Postgres implementation can be swapped for a real DLT/blockchain later.

```typescript
// packages/ledger-emulator/src/index.ts
export interface LedgerEntry<T> {
  sequence: number;
  timestamp: string;
  eventType: string;
  payload: T;
  hash: string;     // SHA-256 of (prevHash + JSON.stringify(payload))
  prevHash: string;
}

export interface Ledger<T> {
  append(eventType: string, payload: T): Promise<LedgerEntry<T>>;
  getBySequence(seq: number): Promise<LedgerEntry<T> | null>;
  query(filter: Partial<T>): Promise<LedgerEntry<T>[]>;
  verify(): Promise<{ valid: boolean; brokenAt?: number; message?: string }>;
}
```

Verification is **on-demand only** — exposed via `GET /ledger/verify` in the validator service.

---

## VTA-Based Authentication Flow

```
1. Client sends POST /auth/challenge { did: "did:web:..." }
2. Auth service generates random nonce, stores it with TTL (5 min)
3. Auth service returns { challenge: "<nonce>", did, expiresAt }
4. Client signs the challenge with their DID key
5. Client sends POST /auth/verify { challenge, signature, did }
6. Auth service resolves DID document via dids.fpndtg.com
7. Auth service verifies signature against DID document's verification method
8. On success: creates session, returns { token, expiresAt }
9. Subsequent requests include Authorization: Bearer <token>
```

This flow is designed to be the **reference implementation** for DID/VTA authentication that app developers can adopt.

---

## TSP Package Design

TSP (Trust Spanning Protocol) replaces DIDComm as the messaging protocol. TSP supports DIDComm as a transport, so existing DIDComm infrastructure remains compatible.

```typescript
// packages/tsp/src/index.ts
export interface TspMessage {
  id: string;
  type: string;
  from: string;   // DID
  to: string;     // DID
  body: unknown;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface TspTransport {
  send(message: TspMessage): Promise<void>;
  receive(): AsyncIterator<TspMessage>;
}

// DIDComm compatibility
export function tspToDIDComm(msg: TspMessage): DIDCommMessage { ... }
export function didCommToTsp(msg: DIDCommMessage): TspMessage { ... }
```

---

## Environment Configuration

```bash
# .env (not committed — see .env.example)

# Database connections (Ubuntu Postgres server)
DATABASE_INFRA_URL=postgresql://fps_infra_user:password@localhost:5432/fps_infra
DATABASE_USER_URL=postgresql://fps_user_user:password@localhost:5432/fps_user

# VTI endpoints (override brand-config defaults for local dev)
FPNDTG_VTA_URL=https://vta.fpndtg.com
FPNDTG_VTC_URL=https://vtc.fpndtg.com
FPNDTG_DIDS_URL=https://dids.fpndtg.com

# Auth service
AUTH_SERVICE_PORT=8788
AUTH_SESSION_SECRET=<random-secret-min-32-chars>
AUTH_CHALLENGE_TTL_SECONDS=300

# Sync service
SYNC_SERVICE_ENABLED=true
SYNC_SERVICE_POLL_INTERVAL_MS=1000
```

---

## Migration Path to Decentralization

The emulator is explicitly designed to be replaced. Here's the migration path:

| Component (Emulator) | Component (Distributed) |
|----------------------|------------------------|
| Infrastructure Postgres DB | Verifiable Data Registry (blockchain, IPFS + Ceramic) |
| User Postgres DB | Local-first storage (IndexedDB, SQLite with sync) |
| Postgres LISTEN/NOTIFY | TSP + gossip protocols |
| Ledger emulator | Smart contracts or DID anchoring |
| Auth sessions in DB | DID-based bearer tokens (no server state) |
| Sync service | CRDTs + eventual consistency |

The key design principle: **keep interface boundaries clean** so implementations can be swapped without rewriting business logic.

---

## Implementation Phases

### Phase 1: Database Foundation
- [ ] Create `packages/db-infra` with Prisma schema and client
- [ ] Create `packages/db-user` with Prisma schema and client
- [ ] Write `docs/DATABASE-SETUP.md` for Ubuntu Postgres setup
- [ ] Add `.env.example` with both database URLs
- [ ] Run initial migrations against Ubuntu Postgres

### Phase 2: Ledger Emulation
- [ ] Implement `packages/ledger-emulator` with hash-chain
- [ ] Add repository methods for append-only writes
- [ ] Create `GET /ledger/verify` endpoint in validator

### Phase 3: Event Bridge
- [ ] Build `packages/event-bridge` with Postgres LISTEN/NOTIFY
- [ ] Create `services/sync-service`
- [ ] Add event handlers for VTA/VTC cross-DB sync

### Phase 4: Authentication
- [ ] Create `packages/auth-vta` with DID auth logic
- [ ] Build `services/auth-service` (Hono, port 8788)
- [ ] Add auth middleware to web app
- [ ] Implement DID login flow in `apps/web`

### Phase 5: TSP Integration
- [ ] Create `packages/tsp` with protocol types and transport interface
- [ ] Update `packages/didcomm` to use TSP
- [ ] Add TSP event logging to infra DB

### Phase 6: Orchestrator Integration
- [ ] Update `services/orchestrator` to log to infra DB via ledger emulator
- [ ] Add user-facing endpoints that write to user DB
- [ ] Implement event publishing for cross-DB sync

### Phase 7: Web UI Enhancement
- [ ] Add PNM page (manage VTAs, custody mode display)
- [ ] Add CNM page (manage VTC memberships)
- [ ] Add VTN Manager page (federation view)
- [ ] Add ledger verification UI

### Phase 8: Documentation
- [ ] ADR 004: Dual Database Architecture
- [ ] ADR 005: TSP over DIDComm
- [ ] ADR 006: VTA-Based Authentication
- [ ] ADR 007: Ledger Emulation Strategy

---

## New ADRs Required

| ADR | Title | Key Decision |
|-----|-------|-------------|
| 004 | Dual Database Architecture | Separate infra/user DBs for clean separation and migration path |
| 005 | TSP over DIDComm | TSP as primary protocol; DIDComm as compatible transport |
| 006 | VTA-Based Authentication | DID challenge/response auth; reference impl for app developers |
| 007 | Ledger Emulation Strategy | Postgres append-only + hash chain; swap for DLT later |

---

*See also: [SCAFFOLD-BRIEF.md](SCAFFOLD-BRIEF.md) for the original Phase 1 scaffold decisions.*
