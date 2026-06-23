import { randomBytes } from "node:crypto";

// In-memory challenge store (TTL-based).
// Phase 2: replace with Redis or DB-backed store for multi-instance deployments.
interface ChallengeEntry {
  challenge: string;
  did: string;
  expiresAt: Date;
}

const challengeStore = new Map<string, ChallengeEntry>();

/** Clean up expired challenges. */
function pruneExpired(): void {
  const now = new Date();
  for (const [key, entry] of challengeStore.entries()) {
    if (entry.expiresAt < now) {
      challengeStore.delete(key);
    }
  }
}

export interface AuthChallenge {
  challenge: string;
  did: string;
  expiresAt: string;
}

/**
 * Generate a new auth challenge for a DID.
 * The challenge is a random 32-byte hex nonce.
 * TTL defaults to AUTH_CHALLENGE_TTL_SECONDS env var or 300 seconds.
 */
export function generateChallenge(did: string): AuthChallenge {
  pruneExpired();

  const challenge = randomBytes(32).toString("hex");
  const ttl = Number(process.env["AUTH_CHALLENGE_TTL_SECONDS"] ?? 300);
  const expiresAt = new Date(Date.now() + ttl * 1000);

  challengeStore.set(challenge, { challenge, did, expiresAt });

  return {
    challenge,
    did,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Consume a challenge (one-time use).
 * Returns the DID if the challenge is valid and not expired, null otherwise.
 */
export function consumeChallenge(challenge: string): string | null {
  const entry = challengeStore.get(challenge);
  if (!entry) return null;

  challengeStore.delete(challenge); // one-time use

  if (entry.expiresAt < new Date()) return null;

  return entry.did;
}
