# Sync Service

Subscribes to Postgres LISTEN/NOTIFY events from both `fps_infra` and `fps_user` databases and reconciles cross-DB state.

## Phase 1

Connects to the event bridge and logs all events. No reconciliation logic yet.

## Phase 2 (planned)

Implement reconciliation handlers:
- `vta.created` → ensure user record exists in fps_user if DID is known
- `vtc.member_added` → update VtcMembership in fps_user
- `vmc.issued` → store credential in user wallet if holder is known
- `user.vta.claimed` → verify DID exists in fps_infra vta_events
- `user.joined.vtc` → verify community exists in fps_infra vtc_events

## Configuration

```bash
SYNC_SERVICE_ENABLED=true   # set to false to disable
DATABASE_INFRA_URL=...
DATABASE_USER_URL=...
```
