import { infraDb } from "../client.js";

export interface LogVerificationEventInput {
  presentationId: string;
  verifierDid: string;
  result: "valid" | "invalid" | "error";
  details: Record<string, unknown>;
}

/** Log a credential/presentation verification attempt. */
export async function logVerificationEvent(input: LogVerificationEventInput) {
  return infraDb.verificationEvent.create({
    data: {
      presentationId: input.presentationId,
      verifierDid: input.verifierDid,
      result: input.result,
      details: input.details as Parameters<typeof infraDb.verificationEvent.create>[0]["data"]["details"],
    },
  });
}

/** Query verification events for a specific verifier DID. */
export async function getVerificationEventsByVerifier(verifierDid: string) {
  return infraDb.verificationEvent.findMany({
    where: { verifierDid },
    orderBy: { timestamp: "desc" },
  });
}

/** Query verification events for a specific presentation ID. */
export async function getVerificationEventsByPresentation(
  presentationId: string,
) {
  return infraDb.verificationEvent.findMany({
    where: { presentationId },
    orderBy: { timestamp: "desc" },
  });
}
