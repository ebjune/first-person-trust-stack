import { userDb } from "../client.js";

export interface StoreCredentialInput {
  userId: string;
  credentialId: string;
  type: string;
  issuerDid: string;
  issuedAt: Date;
  expiresAt?: Date;
  credentialData: Record<string, unknown>;
}

/** Store a credential in the user's wallet. */
export async function storeCredential(input: StoreCredentialInput) {
  return userDb.walletCredential.create({
    data: {
      userId: input.userId,
      credentialId: input.credentialId,
      type: input.type,
      issuerDid: input.issuerDid,
      issuedAt: input.issuedAt,
      expiresAt: input.expiresAt,
      status: "active",
      credentialData: input.credentialData as Parameters<typeof userDb.walletCredential.create>[0]["data"]["credentialData"],
    },
  });
}

/** Get all active credentials for a user. */
export async function getUserCredentials(userId: string) {
  return userDb.walletCredential.findMany({
    where: { userId, status: "active" },
    orderBy: { issuedAt: "desc" },
  });
}

/** Get a specific credential by its credential ID. */
export async function getCredentialById(credentialId: string) {
  return userDb.walletCredential.findUnique({
    where: { credentialId },
    include: { user: true },
  });
}

/** Mark a credential as revoked. */
export async function revokeCredential(credentialId: string) {
  return userDb.walletCredential.update({
    where: { credentialId },
    data: { status: "revoked" },
  });
}

/** Mark expired credentials (call periodically or on-demand). */
export async function markExpiredCredentials() {
  const now = new Date();
  return userDb.walletCredential.updateMany({
    where: {
      status: "active",
      expiresAt: { lt: now },
    },
    data: { status: "expired" },
  });
}

/** Remove a credential from the wallet entirely. */
export async function removeCredential(credentialId: string) {
  return userDb.walletCredential.delete({
    where: { credentialId },
  });
}
