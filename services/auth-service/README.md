# Auth Service

DID-based authentication service for FPS. Implements the VTA challenge/response auth flow.

**Port:** 8788 (configurable via `AUTH_SERVICE_PORT`)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/auth/challenge` | Generate a DID auth challenge |
| `POST` | `/auth/verify` | Verify signed challenge, issue session token |
| `GET` | `/auth/session` | Validate a session token |
| `DELETE` | `/auth/session` | Revoke a session token |

## Auth Flow

```
1. POST /auth/challenge { did: "did:web:..." }
   → { challenge: "<nonce>", did, expiresAt }

2. Client signs challenge with DID key

3. POST /auth/verify { challenge, signature, did }
   → { token, expiresAt, userId }

4. Use: Authorization: Bearer <token>
```

## Development Note

In Phase 1, `verifySignature()` is a stub that always returns false.
Set `AUTH_SKIP_SIGNATURE_VERIFY=true` in `.env` to bypass signature verification
during development. **Never set this in production.**
