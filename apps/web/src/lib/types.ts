// Shared TypeScript types for the FPS web UI

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface AuthSession {
  token: string;
  userId: string;
  did: string;
  expiresAt: string;
}

export interface ChallengeResponse {
  challenge: string;
  did: string;
  expiresAt: string;
}

// ---------------------------------------------------------------------------
// VTA
// ---------------------------------------------------------------------------

export interface VtaRecord {
  id: string;
  did: string;
  context: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// VTC
// ---------------------------------------------------------------------------

export interface VtcRecord {
  id: string;
  cdid: string;
  name: string;
  adminDid: string;
  createdAt: string;
}

export interface VtcMembership {
  id: string;
  cdid: string;
  memberDid: string;
  role: string;
  joinedAt: string;
}

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

export interface WalletCredential {
  id: string;
  type: string;
  issuerDid: string;
  subjectDid: string;
  issuedAt: string;
  raw: unknown;
}

// ---------------------------------------------------------------------------
// Ledger
// ---------------------------------------------------------------------------

export interface ChainVerifyResult {
  valid: boolean;
  chain: string;
  eventCount: number;
  error?: string;
}

export interface LedgerVerifyReport {
  allValid: boolean;
  chains: ChainVerifyResult[];
  checkedAt: string;
}

// ---------------------------------------------------------------------------
// Trust Task Log
// ---------------------------------------------------------------------------

export interface TrustTaskEntry {
  id: string;
  taskUri: string;
  method: string;
  endpoint: string;
  statusCode: number;
  durationMs: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Service Health
// ---------------------------------------------------------------------------

export interface ServiceHealthResult {
  service: string;
  url: string;
  ok: boolean;
  status?: number;
  responseMs?: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// API response wrappers
// ---------------------------------------------------------------------------

export interface ApiError {
  error: string;
  note?: string;
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
