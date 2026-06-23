import { infraDb } from "../client.js";

export interface LogTspEventInput {
  messageId: string;
  fromDid: string;
  toDid: string;
  eventType: "sent" | "delivered" | "failed" | "relayed";
  payload: Record<string, unknown>;
}

/** Log a TSP message routing event. */
export async function logTspEvent(input: LogTspEventInput) {
  return infraDb.tspEvent.create({
    data: {
      messageId: input.messageId,
      fromDid: input.fromDid,
      toDid: input.toDid,
      eventType: input.eventType,
      payload: input.payload as Parameters<typeof infraDb.tspEvent.create>[0]["data"]["payload"],
    },
  });
}

/** Query TSP events sent from a DID. */
export async function getTspEventsByFrom(fromDid: string) {
  return infraDb.tspEvent.findMany({
    where: { fromDid },
    orderBy: { timestamp: "desc" },
  });
}

/** Query TSP events sent to a DID. */
export async function getTspEventsByTo(toDid: string) {
  return infraDb.tspEvent.findMany({
    where: { toDid },
    orderBy: { timestamp: "desc" },
  });
}

/** Get a TSP event by message ID. */
export async function getTspEventByMessageId(messageId: string) {
  return infraDb.tspEvent.findUnique({
    where: { messageId },
  });
}
