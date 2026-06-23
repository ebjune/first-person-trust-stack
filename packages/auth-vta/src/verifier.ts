import { FPNDTG } from "@fpndtg/brand-config";

/**
 * DID Document verification method (minimal shape).
 * Full W3C DID Document spec: https://www.w3.org/TR/did-core/
 */
export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyJwk?: Record<string, unknown>;
  publicKeyMultibase?: string;
}

export interface DidDocument {
  id: string;
  verificationMethod?: VerificationMethod[];
  authentication?: (string | VerificationMethod)[];
}

/**
 * Resolve a DID document via dids.fpndtg.com.
 * Uses the WebVH / did.jsonl hosting endpoint.
 *
 * TODO Phase 2: implement full DID resolution with caching and error handling.
 */
export async function resolveDidDocument(
  did: string,
  didsBaseUrl: string = FPNDTG.dids,
): Promise<DidDocument | null> {
  // Convert DID to resolution URL
  // e.g. did:web:vta.fpndtg.com:users:abc -> https://dids.fpndtg.com/did:web:vta.fpndtg.com:users:abc/did.json
  const encodedDid = encodeURIComponent(did);
  const url = `${didsBaseUrl}/${encodedDid}/did.json`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    return (await response.json()) as DidDocument;
  } catch {
    return null;
  }
}

/**
 * Verify a challenge signature against a DID document.
 *
 * TODO Phase 2: implement actual cryptographic verification.
 * Currently a stub that validates the structure and returns false
 * (not implemented) to prevent accidental auth bypass.
 *
 * The real implementation will:
 * 1. Extract the authentication verification method from the DID document
 * 2. Verify the signature using the appropriate algorithm (Ed25519, P-256, etc.)
 * 3. Return true only if the signature is cryptographically valid
 */
export async function verifySignature(
  _challenge: string,
  _signature: string,
  didDocument: DidDocument | null,
): Promise<boolean> {
  if (!didDocument) return false;

  // Ensure the DID document has at least one authentication method
  if (
    !didDocument.authentication ||
    didDocument.authentication.length === 0
  ) {
    return false;
  }

  // TODO: implement Ed25519/P-256 signature verification
  // For now, return false to prevent accidental auth bypass in development
  console.warn(
    "[auth-vta] verifySignature: cryptographic verification not yet implemented",
  );
  return false;
}

/**
 * Extract the primary authentication verification method from a DID document.
 */
export function getAuthenticationMethod(
  didDocument: DidDocument,
): VerificationMethod | null {
  if (!didDocument.authentication || didDocument.authentication.length === 0) {
    return null;
  }

  const first = didDocument.authentication[0];

  if (typeof first === "string") {
    // Reference to a verification method by ID
    return (
      didDocument.verificationMethod?.find((vm) => vm.id === first) ?? null
    );
  }

  return first;
}
