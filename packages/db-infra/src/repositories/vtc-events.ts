import { createHash } from "node:crypto";
import { infraDb } from "../client.js";

export interface AppendVtcEventInput {
  cdid: string;
  eventType:
    | "created"
    | "member_added"
    | "member_removed"
    | "governance_changed"
    | "dissolved";
  payload: Record<string, unknown>;
}

function computeHash(prevHash: string, payload: unknown): string {
  return createHash("sha256")
    .update(prevHash + JSON.stringify(payload))
    .digest("hex");
}

/** Append an immutable VTC lifecycle event to the ledger. */
export async function appendVtcEvent(input: AppendVtcEventInput) {
  const last = await infraDb.vtcEvent.findFirst({
    orderBy: { sequence: "desc" },
    select: { hash: true },
  });

  const prevHash = last?.hash ?? "0".repeat(64);
  const hash = computeHash(prevHash, input.payload);

  return infraDb.vtcEvent.create({
    data: {
      cdid: input.cdid,
      eventType: input.eventType,
      payload: input.payload as Parameters<typeof infraDb.vtcEvent.create>[0]["data"]["payload"],
      hash,
      prevHash,
    },
  });
}

/** Query VTC events for a specific community DID. */
export async function getVtcEvents(cdid: string) {
  return infraDb.vtcEvent.findMany({
    where: { cdid },
    orderBy: { sequence: "asc" },
  });
}

/** Verify the hash chain integrity for all VTC events. */
export async function verifyVtcChain(): Promise<{
  valid: boolean;
  brokenAt?: number;
  message?: string;
}> {
  const events = await infraDb.vtcEvent.findMany({
    orderBy: { sequence: "asc" },
  });

  if (events.length === 0) {
    return { valid: true, message: "No VTC events to verify" };
  }

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const expectedPrevHash = i === 0 ? "0".repeat(64) : events[i - 1].hash;

    if (event.prevHash !== expectedPrevHash) {
      return {
        valid: false,
        brokenAt: event.sequence,
        message: `Hash chain broken at sequence ${event.sequence}: prevHash mismatch`,
      };
    }

    const expectedHash = computeHash(event.prevHash, event.payload);
    if (event.hash !== expectedHash) {
      return {
        valid: false,
        brokenAt: event.sequence,
        message: `Hash chain broken at sequence ${event.sequence}: hash mismatch`,
      };
    }
  }

  return { valid: true, message: `Verified ${events.length} VTC events` };
}
