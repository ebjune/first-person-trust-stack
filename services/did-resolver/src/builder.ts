// DID Document builder — constructs a valid did:webvh document from a VtaEvent.
// Phase 1: synthesizes minimal document from orchestrator payload.
// Phase 2B: will include real key material from VTI provisioning response.

import { FPNDTG } from "@fpndtg/brand-config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase: string | null;
}

export interface ServiceEndpoint {
  id: string;
  type: string;
  serviceEndpoint: string;
}

export interface DidDocument {
  "@context": string[];
  id: string;
  verificationMethod: VerificationMethod[];
  authentication: string[];
  service: ServiceEndpoint[];
  versionId: string;
  updated: string;
  previousVersionId?: string;
  deactivated?: boolean;
}

// Shape of the payload stored in vta_events by the orchestrator.
interface VtaEventPayload {
  did?: string;
  context?: string;
  provisionedAt?: string;
  source?: string;
  verificationMethod?: Array<{
    id?: string;
    type?: string;
    controller?: string;
    publicKeyMultibase?: string | null;
  }>;
  authentication?: string[];
  service?: Array<{
    id?: string;
    type?: string;
    serviceEndpoint?: string;
  }>;
}

// Minimal shape we need from a VtaEvent row.
export interface VtaEventRow {
  did: string;
  eventType: string;
  timestamp: Date;
  payload: unknown;
  hash: string;
  prevHash: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GENESIS_HASH = "0".repeat(64);

function isGenesisEvent(event: VtaEventRow): boolean {
  return event.prevHash === GENESIS_HASH;
}

function safePayload(raw: unknown): VtaEventPayload {
  if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as VtaEventPayload;
  }
  return {};
}

// ---------------------------------------------------------------------------
// Build DID document from a single VtaEvent row
// ---------------------------------------------------------------------------
export function buildDidDocument(event: VtaEventRow): DidDocument {
  const payload = safePayload(event.payload);
  const did = event.did;

  // Verification methods — use payload if present, otherwise synthesize placeholder
  let verificationMethod: VerificationMethod[];
  if (
    Array.isArray(payload.verificationMethod) &&
    payload.verificationMethod.length > 0
  ) {
    verificationMethod = payload.verificationMethod.map((vm) => ({
      id: vm.id ? `${did}${vm.id.startsWith("#") ? vm.id : `#${vm.id}`}` : `${did}#key-1`,
      type: vm.type ?? "Ed25519VerificationKey2020",
      controller: vm.controller ?? did,
      publicKeyMultibase: vm.publicKeyMultibase ?? null,
    }));
  } else {
    // Phase 1 placeholder — no real key material yet
    verificationMethod = [
      {
        id: `${did}#key-1`,
        type: "Ed25519VerificationKey2020",
        controller: did,
        publicKeyMultibase: null,
      },
    ];
  }

  // Authentication references
  const authentication: string[] =
    Array.isArray(payload.authentication) && payload.authentication.length > 0
      ? payload.authentication.map((ref) =>
          ref.startsWith("#") ? `${did}${ref}` : ref,
        )
      : [`${did}#key-1`];

  // Service endpoints — use payload if present, otherwise add default mediator
  let service: ServiceEndpoint[];
  if (Array.isArray(payload.service) && payload.service.length > 0) {
    service = payload.service.map((s) => ({
      id: s.id ? `${did}${s.id.startsWith("#") ? s.id : `#${s.id}`}` : `${did}#mediator`,
      type: s.type ?? "DIDCommMessaging",
      serviceEndpoint: s.serviceEndpoint ?? FPNDTG.mediator,
    }));
  } else {
    service = [
      {
        id: `${did}#mediator`,
        type: "DIDCommMessaging",
        serviceEndpoint: FPNDTG.mediator,
      },
    ];
  }

  const doc: DidDocument = {
    "@context": ["https://www.w3.org/ns/did/v1"],
    id: did,
    verificationMethod,
    authentication,
    service,
    versionId: `sha256:${event.hash}`,
    updated: event.timestamp.toISOString(),
  };

  // Add previousVersionId for all non-genesis events
  if (!isGenesisEvent(event)) {
    doc.previousVersionId = `sha256:${event.prevHash}`;
  }

  // Mark deactivated if event type is revoked
  if (event.eventType === "revoked") {
    doc.deactivated = true;
  }

  return doc;
}
