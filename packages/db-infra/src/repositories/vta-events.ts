import { createHash } from "node:crypto";
import { infraDb } from "../client.js";

export interface AppendVtaEventInput {
  did: string;
  eventType: "created" | "rotated" | "revoked";
  payload: Record<string, unknown>;
}

/** Compute SHA-256 of (prevHash + JSON.stringify(payload)). */
function computeHash(prevHash: string, payload: unknown): string {
  return createHash("sha256")
    .update(prevHash + JSON.stringify(payload))
    .digest("hex");
}

/** Append an immutable VTA lifecycle event to the ledger. */
export async function appendVtaEvent(input: AppendVtaEventInput) {
  // Get the last event to chain hashes
  const last = await infraDb.vtaEvent.findFirst({
    orderBy: { sequence: "desc" },
    select: { hash: true },
  });

  const prevHash = last?.hash ?? "0".repeat(64);
  const hash = computeHash(prevHash, input.payload);

  return infraDb.vtaEvent.create({
    data: {
      did: input.did,
      eventType: input.eventType,
      payload: input.payload as Parameters<typeof infraDb.vtaEvent.create>[0]["data"]["payload"],
      hash,
      prevHash,
    },
  });
}

/** Query VTA events for a specific DID. */
export async function getVtaEvents(did: string) {
  return infraDb.vtaEvent.findMany({
    where: { did },
    orderBy: { sequence: "asc" },
  });
}

/** Get a single VTA event by sequence number. */
export async function getVtaEventBySequence(sequence: number) {
  return infraDb.vtaEvent.findFirst({
    where: { sequence },
  });
}

/** Verify the hash chain integrity for all VTA events. */
export async function verifyVtaChain(): Promise<{
  valid: boolean;
  brokenAt?: number;
  message?: string;
}> {
  const events = await infraDb.vtaEvent.findMany({
    orderBy: { sequence: "asc" },
  });

  if (events.length === 0) {
    return { valid: true, message: "No VTA events to verify" };
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

  return { valid: true, message: `Verified ${events.length} VTA events` };
}
