import { infraDb } from "../client.js";

export interface LogTrustTaskInput {
  taskUri: string;
  method: string;
  endpoint: string;
  statusCode: number;
  requestBody?: Record<string, unknown>;
  responseBody?: Record<string, unknown>;
  durationMs?: number;
}

/** Log a Trust Task HTTP call to the audit trail. */
export async function logTrustTask(input: LogTrustTaskInput) {
  type TrustTaskLogData = Parameters<typeof infraDb.trustTaskLog.create>[0]["data"];
  return infraDb.trustTaskLog.create({
    data: {
      taskUri: input.taskUri,
      method: input.method,
      endpoint: input.endpoint,
      statusCode: input.statusCode,
      requestBody: input.requestBody as TrustTaskLogData["requestBody"],
      responseBody: input.responseBody as TrustTaskLogData["responseBody"],
      durationMs: input.durationMs,
    },
  });
}

/** Query Trust Task logs by task URI. */
export async function getTrustTaskLogs(taskUri: string) {
  return infraDb.trustTaskLog.findMany({
    where: { taskUri },
    orderBy: { timestamp: "desc" },
  });
}

/** Query recent Trust Task logs (last N entries). */
export async function getRecentTrustTaskLogs(limit = 50) {
  return infraDb.trustTaskLog.findMany({
    orderBy: { timestamp: "desc" },
    take: limit,
  });
}
