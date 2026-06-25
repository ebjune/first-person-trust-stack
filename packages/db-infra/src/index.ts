// Infrastructure Database — public API
// Re-exports the Prisma client singleton and all repository functions.

export { infraDb } from "./client.js";

export {
  appendVtaEvent,
  getVtaEvents,
  getVtaEventBySequence,
  getVtaEventByHash,
  getVtaEventAtTime,
  verifyVtaChain,
  type AppendVtaEventInput,
} from "./repositories/vta-events.js";

export {
  appendVtcEvent,
  getVtcEvents,
  verifyVtcChain,
  type AppendVtcEventInput,
} from "./repositories/vtc-events.js";

export {
  logTspEvent,
  getTspEventsByFrom,
  getTspEventsByTo,
  getTspEventByMessageId,
  type LogTspEventInput,
} from "./repositories/tsp-events.js";

export {
  logTrustTask,
  getTrustTaskLogs,
  getRecentTrustTaskLogs,
  type LogTrustTaskInput,
} from "./repositories/trust-task-log.js";

export {
  logVerificationEvent,
  getVerificationEventsByVerifier,
  getVerificationEventsByPresentation,
  type LogVerificationEventInput,
} from "./repositories/verification-events.js";
