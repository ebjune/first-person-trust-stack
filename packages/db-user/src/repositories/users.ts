import { userDb } from "../client.js";

export interface CreateUserInput {
  primaryDid: string;
  email?: string;
  displayName?: string;
}

export interface UpdateUserInput {
  email?: string;
  displayName?: string;
}

/** Create a new user account. */
export async function createUser(input: CreateUserInput) {
  return userDb.user.create({
    data: {
      primaryDid: input.primaryDid,
      email: input.email,
      displayName: input.displayName,
    },
  });
}

/** Find a user by their primary DID. */
export async function getUserByDid(did: string) {
  return userDb.user.findUnique({
    where: { primaryDid: did },
    include: {
      vtas: true,
      memberships: true,
    },
  });
}

/** Find a user by their internal ID. */
export async function getUserById(id: string) {
  return userDb.user.findUnique({
    where: { id },
    include: {
      vtas: true,
      memberships: true,
    },
  });
}

/** Find a user by email. */
export async function getUserByEmail(email: string) {
  return userDb.user.findUnique({
    where: { email },
  });
}

/** Update user profile. */
export async function updateUser(id: string, input: UpdateUserInput) {
  return userDb.user.update({
    where: { id },
    data: input,
  });
}

/** Log a user activity. */
export async function logActivity(
  userId: string,
  action: string,
  metadata?: Record<string, unknown>,
) {
  return userDb.activityLog.create({
    data: {
      userId,
      action,
      metadata: metadata as Parameters<typeof userDb.activityLog.create>[0]["data"]["metadata"],
    },
  });
}

/** Get recent activity for a user. */
export async function getUserActivity(userId: string, limit = 50) {
  return userDb.activityLog.findMany({
    where: { userId },
    orderBy: { timestamp: "desc" },
    take: limit,
  });
}
