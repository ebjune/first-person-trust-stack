// Typed fetch wrappers for all FPS backend services
// Service ports: orchestrator=8789, auth=8788, validator=8787

import type {
  ChallengeResponse,
  AuthSession,
  VtaRecord,
  VtcRecord,
  VtcMembership,
  WalletCredential,
  LedgerVerifyReport,
  TrustTaskEntry,
  ServiceHealthResult,
} from "./types";
import { getToken } from "./auth";

// ---------------------------------------------------------------------------
// Base URLs — override via Vite env vars for staging/prod
// ---------------------------------------------------------------------------
const ORCHESTRATOR = (import.meta.env["VITE_ORCHESTRATOR_URL"] as string | undefined) ?? "http://localhost:8789";
const AUTH_SERVICE = (import.meta.env["VITE_AUTH_URL"] as string | undefined) ?? "http://localhost:8788";
const VALIDATOR = (import.meta.env["VITE_VALIDATOR_URL"] as string | undefined) ?? "http://localhost:8787";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Service Health
// ---------------------------------------------------------------------------
export async function checkServiceHealth(
  service: string,
  url: string,
): Promise<ServiceHealthResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${url}/health`);
    return {
      service,
      url,
      ok: res.ok,
      status: res.status,
      responseMs: Date.now() - start,
    };
  } catch (err) {
    return {
      service,
      url,
      ok: false,
      responseMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function checkAllServicesHealth(): Promise<ServiceHealthResult[]> {
  return Promise.all([
    checkServiceHealth("Orchestrator", ORCHESTRATOR),
    checkServiceHealth("Auth Service", AUTH_SERVICE),
    checkServiceHealth("Validator", VALIDATOR),
  ]);
}

// ---------------------------------------------------------------------------
// Auth Service
// ---------------------------------------------------------------------------
export async function requestChallenge(did: string): Promise<ChallengeResponse> {
  return apiFetch<ChallengeResponse>(`${AUTH_SERVICE}/auth/challenge`, {
    method: "POST",
    body: JSON.stringify({ did }),
  });
}

export async function verifyChallenge(
  challenge: string,
  signature: string,
  did: string,
): Promise<AuthSession> {
  return apiFetch<AuthSession>(`${AUTH_SERVICE}/auth/verify`, {
    method: "POST",
    body: JSON.stringify({ challenge, signature, did }),
  });
}

export async function fetchSession(): Promise<{ userId: string; did: string; expiresAt: string }> {
  return apiFetch(`${AUTH_SERVICE}/auth/session`);
}

export async function logout(): Promise<void> {
  await apiFetch(`${AUTH_SERVICE}/auth/session`, { method: "DELETE" }).catch(() => null);
}

// ---------------------------------------------------------------------------
// Orchestrator — VTA
// ---------------------------------------------------------------------------
export async function provisionVta(
  did: string,
  context?: string,
): Promise<{ ok: boolean; did: string; sequence: number; timestamp: string; note: string }> {
  return apiFetch(`${ORCHESTRATOR}/vta/provision`, {
    method: "POST",
    body: JSON.stringify({ did, context }),
  });
}

export async function fetchVtaHealth(): Promise<{ ok: boolean; status: number; url: string }> {
  return apiFetch(`${ORCHESTRATOR}/vta/health`);
}

// ---------------------------------------------------------------------------
// Orchestrator — VTC
// ---------------------------------------------------------------------------
export async function provisionVtc(
  cdid: string,
  adminDid: string,
  name?: string,
): Promise<{ ok: boolean; cdid: string; sequence: number; timestamp: string; note: string }> {
  return apiFetch(`${ORCHESTRATOR}/vtc/provision`, {
    method: "POST",
    body: JSON.stringify({ cdid, adminDid, name }),
  });
}

export async function joinVtc(
  cdid: string,
  memberDid: string,
): Promise<{ ok: boolean; statusCode: number; response: unknown }> {
  return apiFetch(`${ORCHESTRATOR}/vtc/join`, {
    method: "POST",
    body: JSON.stringify({ cdid, memberDid }),
  });
}

export async function fetchVtcHealth(): Promise<{ ok: boolean; status: number; url: string }> {
  return apiFetch(`${ORCHESTRATOR}/vtc/health`);
}

// ---------------------------------------------------------------------------
// Validator — Ledger
// ---------------------------------------------------------------------------
export async function verifyLedger(): Promise<LedgerVerifyReport> {
  return apiFetch<LedgerVerifyReport>(`${VALIDATOR}/ledger/verify`);
}

export async function verifyVtaChain(): Promise<{ valid: boolean; eventCount: number; error?: string }> {
  return apiFetch(`${VALIDATOR}/ledger/verify/vta`);
}

export async function verifyVtcChain(): Promise<{ valid: boolean; eventCount: number; error?: string }> {
  return apiFetch(`${VALIDATOR}/ledger/verify/vtc`);
}

// ---------------------------------------------------------------------------
// Validator — Trust Task Log
// ---------------------------------------------------------------------------
export async function fetchTrustTaskLog(limit = 20): Promise<TrustTaskEntry[]> {
  return apiFetch<TrustTaskEntry[]>(`${VALIDATOR}/ledger/trust-tasks?limit=${limit}`);
}

// ---------------------------------------------------------------------------
// User data — fetched from auth service session context
// These are derived from the fps_user DB via the auth service.
// Phase 2: dedicated user-data API endpoints.
// ---------------------------------------------------------------------------

// VTAs are tracked locally from provisioning calls in this session.
// Phase 2: fetch from a dedicated /user/vtas endpoint.
export type { VtaRecord, VtcRecord, VtcMembership, WalletCredential };
