/**
 * @fpndtg/auth-vta — VTA-based DID authentication
 *
 * Provides the challenge/response authentication flow for DID-based auth.
 * This is the reference implementation for DID/VTA authentication that
 * app developers can adopt.
 *
 * Flow:
 *   1. POST /auth/challenge { did } → { challenge, did, expiresAt }
 *   2. Client signs challenge with DID key
 *   3. POST /auth/verify { challenge, signature, did } → { token, expiresAt }
 *   4. Use Bearer token for subsequent requests
 *
 * Note: verifySignature() is a stub in Phase 1.
 * Cryptographic verification is implemented in Phase 2.
 */

export {
  generateChallenge,
  consumeChallenge,
  type AuthChallenge,
} from "./challenge.js";

export {
  resolveDidDocument,
  verifySignature,
  getAuthenticationMethod,
  type DidDocument,
  type VerificationMethod,
} from "./verifier.js";
