// User Database — public API
// Re-exports the Prisma client singleton and all repository functions.

export { userDb } from "./client.js";

export {
  createUser,
  getUserByDid,
  getUserById,
  getUserByEmail,
  updateUser,
  logActivity,
  getUserActivity,
  type CreateUserInput,
  type UpdateUserInput,
} from "./repositories/users.js";

export {
  addUserVta,
  getUserVtas,
  getUserVtaByDid,
  updateUserVta,
  removeUserVta,
  type AddUserVtaInput,
  type UpdateUserVtaInput,
} from "./repositories/vtas.js";

export {
  joinVtc,
  getUserMemberships,
  getVtcMembers,
  updateMembershipRole,
  leaveVtc,
  suspendMembership,
  type JoinVtcInput,
} from "./repositories/memberships.js";

export {
  storeCredential,
  getUserCredentials,
  getCredentialById,
  revokeCredential,
  markExpiredCredentials,
  removeCredential,
  type StoreCredentialInput,
} from "./repositories/credentials.js";

export {
  createSession,
  getSession,
  revokeSession,
  revokeAllUserSessions,
  pruneExpiredSessions,
  type CreateSessionInput,
} from "./repositories/sessions.js";
