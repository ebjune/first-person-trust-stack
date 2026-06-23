import { randomBytes } from "node:crypto";
import { userDb } from "../client.js";

export interface CreateSessionInput {
  userId: string;
  did: string;
  ttlSeconds?: number;
}

/** Create a new auth session for a user. */
export async function createSession(input: CreateSessionInput) {
  const token = randomBytes(32).toString("hex");
  const ttl = input.ttlSeconds ?? 86400; // default 24 hours
  const expiresAt = new Date(Date.now() + ttl * 1000);

  return userDb.authSession.create({
    data: {
      userId: input.userId,
      token,
      did: input.did,
      expiresAt,
    },
  });
}

/** Look up a session by token. Returns null if not found or expired. */
export async function getSession(token: string) {
  const session = await userDb.authSession.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    // Expired — clean it up
    await userDb.authSession.delete({ where: { token } });
    return null;
  }

  // Update lastUsedAt
  await userDb.authSession.update({
    where: { token },
    data: { lastUsedAt: new Date() },
  });

  return session;
}

/** Revoke a specific session. */
export async function revokeSession(token: string) {
  return userDb.authSession.delete({ where: { token } });
}

/** Revoke all sessions for a user (e.g. on password change or security event). */
export async function revokeAllUserSessions(userId: string) {
  return userDb.authSession.deleteMany({ where: { userId } });
}

/** Clean up expired sessions (run periodically). */
export async function pruneExpiredSessions() {
  return userDb.authSession.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}
