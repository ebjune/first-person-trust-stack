/**
 * @fpndtg/ledger-emulator
 *
 * Provides append-only ledger semantics over the fps_infra Postgres database.
 * Hash chaining provides tamper evidence — each entry includes a SHA-256 hash
 * of (prevHash + JSON.stringify(payload)).
 *
 * The Ledger interface is designed so the Postgres implementation can be
 * swapped for a real DLT/blockchain in a future phase without changing
 * business logic.
 *
 * Verification is on-demand only — call verifyLedger() explicitly or
 * expose it via GET /ledger/verify in the validator service.
 */

export {
  verifyVtaChain,
  verifyVtcChain,
  verifyAllChains,
  type LedgerVerificationResult,
  type FullVerificationReport,
} from "./verifier.js";

export {
  appendVtaLedgerEvent,
  appendVtcLedgerEvent,
  type VtaLedgerEventInput,
  type VtcLedgerEventInput,
} from "./ledger.js";
