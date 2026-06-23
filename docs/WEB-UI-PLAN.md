# Web UI Overhaul Plan — Phase 1

> **Status:** Approved — implementing in Act mode.
> **Stack:** React 19 + Vite + TypeScript + Tailwind CSS + React Hook Form + React Router

---

## Decisions

| Topic | Decision |
|-------|----------|
| Styling | Tailwind CSS |
| Forms | React Hook Form |
| Routing | React Router v7 |
| Auth stub | Accept any signature in Phase 1 (set `AUTH_SKIP_SIGNATURE_VERIFY=true`) |
| Real-time | Manual refresh in Phase 1 — **Phase 2: add WebSocket/polling** |
| Signature crypto | Stub in Phase 1 — **Phase 2: real DID signature verification** |

---

## Information Architecture

### 1. PNM — Personal Network Manager
User-facing view backed by `fps_user` DB.
- My VTAs (personal DIDs I control)
- My VTC Memberships (communities I belong to)
- My Credential Wallet (VMCs I've received)
- Session management (login/logout)

### 2. CNM — Community Network Manager
Admin view for VTC operators.
- VTC Provisioning (create new communities)
- Member Management (add VTAs to VTCs)
- VMC Issuance stub (Phase 2)
- Governance Rules (Phase 2)

### 3. VTN Manager
Greenfield federation view — **Phase 2 placeholder only**.

### 4. Infrastructure Monitor
Read-only ops dashboard.
- Ledger chain verification
- Trust Task audit log
- Service health checks

---

## Component Structure

```
apps/web/src/
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx          # Top nav + sidebar + main content
│   │   ├── ManagerNav.tsx        # PNM | CNM | VTN | Infra tabs
│   │   └── AuthGuard.tsx         # Redirect to /login if no session
│   ├── pnm/
│   │   ├── VtaList.tsx           # My VTAs table
│   │   ├── VtaCreateForm.tsx     # Provision new pVTA
│   │   ├── MembershipList.tsx    # VTCs I belong to
│   │   ├── CredentialWallet.tsx  # VMCs I hold
│   │   └── SessionInfo.tsx       # Current session + logout
│   ├── cnm/
│   │   ├── VtcList.tsx           # VTCs I administer
│   │   ├── VtcCreateForm.tsx     # Provision new VTC
│   │   ├── VtcMemberManager.tsx  # Add members to VTC
│   │   └── VmcIssueForm.tsx      # Issue VMC stub (Phase 2)
│   ├── vtn/
│   │   └── VtnPlaceholder.tsx    # "Coming in Phase 2"
│   └── infra/
│       ├── LedgerStatus.tsx      # Chain verify + event counts
│       ├── TrustTaskLog.tsx      # Recent Trust Task calls
│       └── ServiceHealth.tsx     # Service health check grid
├── contexts/
│   └── AuthContext.tsx           # Global auth state
├── lib/
│   ├── api.ts                    # Typed fetch wrappers for all services
│   ├── auth.ts                   # Session token storage helpers
│   └── types.ts                  # Shared TypeScript types
├── pages/
│   ├── LoginPage.tsx             # DID challenge/verify flow
│   ├── PnmPage.tsx               # PNM manager view
│   ├── CnmPage.tsx               # CNM manager view
│   ├── VtnPage.tsx               # VTN placeholder
│   └── InfraPage.tsx             # Infrastructure monitor
├── App.tsx                       # Router + AuthGuard
└── main.tsx
```

---

## API Integration (`lib/api.ts`)

### Orchestrator (port 8789)
- `GET /health`
- `GET /vta/health` — proxy VTA health + log
- `GET /vtc/health` — proxy VTC health + log
- `POST /vta/provision` — `{ did, context? }`
- `POST /vtc/provision` — `{ cdid, adminDid, name? }`
- `POST /vtc/join` — `{ cdid, memberDid }`

### Auth Service (port 8788)
- `GET /health`
- `POST /auth/challenge` — `{ did }`
- `POST /auth/verify` — `{ challenge, signature, did }`
- `GET /auth/session` — Bearer token
- `DELETE /auth/session` — Bearer token

### Validator (port 8787)
- `GET /health`
- `GET /ledger/verify` — full chain report
- `GET /ledger/verify/vta`
- `GET /ledger/verify/vtc`
- `POST /verify` — VP verification stub

---

## UX Flows

### Login
1. User enters DID
2. `POST /auth/challenge` → receive challenge string
3. Phase 1: any signature accepted (stub)
4. `POST /auth/verify` → receive session token
5. Store token in localStorage → redirect to /pnm

### VTA Provisioning (PNM)
1. Click "Create VTA"
2. Form: DID, context (personal/app/mediator)
3. `POST /vta/provision` → ledger event created
4. Refresh VTA list

### VTC Creation (CNM)
1. Click "Create Community"
2. Form: C-DID, admin DID (pre-filled), name
3. `POST /vtc/provision` → ledger event created
4. Refresh VTC list

### Member Management (CNM)
1. Select VTC
2. Click "Add Member"
3. Form: member DID
4. `POST /vtc/join` → Trust Task logged + ledger event
5. Refresh member list

---

## Phase 2 Notes

- [ ] Replace signature stub with real DID signature verification
- [ ] Add real-time updates via WebSocket or polling
- [ ] VMC issuance flow (CNM)
- [ ] Member removal from VTC (CNM)
- [ ] VTN Manager full implementation
- [ ] Trust Task log pagination + filtering
- [ ] Credential wallet with VP generation
