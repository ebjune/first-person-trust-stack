/**
 * @fpndtg/tsp — Trust Spanning Protocol (TSP) types and transport interface.
 *
 * TSP is the messaging protocol for FPS, replacing DIDComm as the primary
 * transport. TSP supports DIDComm as a compatible transport layer, so
 * existing DIDComm infrastructure remains interoperable.
 *
 * Reference: https://trustoverip.github.io/tswg-tsp-specification/
 *
 * Phase 1: Types and interfaces only.
 * Phase 2: Implement transport adapters (HTTP, WebSocket, DIDComm relay).
 */

// ---------------------------------------------------------------------------
// Core TSP message types
// ---------------------------------------------------------------------------

/** A TSP message envelope. */
export interface TspMessage {
  /** Unique message ID (UUID or similar). */
  id: string;
  /** Message type URI (e.g. "https://trusttasks.org/fpndtg/tsp/vta/1.0"). */
  type: string;
  /** Sender DID. */
  from: string;
  /** Recipient DID. */
  to: string;
  /** Message body — type-specific payload. */
  body: unknown;
  /** ISO 8601 timestamp. */
  timestamp: string;
  /** Optional metadata (routing hints, reply-to, thread ID, etc.). */
  metadata?: TspMessageMetadata;
}

export interface TspMessageMetadata {
  /** Thread ID for correlated messages. */
  threadId?: string;
  /** Message this is a reply to. */
  replyTo?: string;
  /** Routing hints for intermediaries. */
  routingHints?: string[];
  /** Additional arbitrary metadata. */
  [key: string]: unknown;
}

/** Result of sending a TSP message. */
export interface TspSendResult {
  messageId: string;
  status: "sent" | "queued" | "failed";
  error?: string;
}

// ---------------------------------------------------------------------------
// Transport interface
// ---------------------------------------------------------------------------

/**
 * TspTransport — pluggable transport layer for TSP messages.
 *
 * Implementations:
 * - HttpTransport: POST to a TSP relay endpoint
 * - WebSocketTransport: persistent connection to a relay
 * - DIDCommTransport: wrap TSP messages in DIDComm envelopes
 */
export interface TspTransport {
  /** Send a TSP message. */
  send(message: TspMessage): Promise<TspSendResult>;
  /** Receive messages (async iterator). */
  receive(): AsyncIterableIterator<TspMessage>;
  /** Close the transport. */
  close(): Promise<void>;
}

// ---------------------------------------------------------------------------
// DIDComm compatibility shim (types only — implementation in Phase 2)
// ---------------------------------------------------------------------------

/** Minimal DIDComm v2 message shape for compatibility. */
export interface DIDCommMessage {
  id: string;
  type: string;
  from?: string;
  to?: string[];
  body: unknown;
  created_time?: number;
  expires_time?: number;
}

/**
 * Convert a TSP message to a DIDComm v2 envelope.
 * TODO: implement full DIDComm v2 packing in Phase 2.
 */
export function tspToDIDComm(msg: TspMessage): DIDCommMessage {
  return {
    id: msg.id,
    type: msg.type,
    from: msg.from,
    to: [msg.to],
    body: msg.body,
    created_time: Math.floor(new Date(msg.timestamp).getTime() / 1000),
  };
}

/**
 * Convert a DIDComm v2 message to a TSP envelope.
 * TODO: implement full DIDComm v2 unpacking in Phase 2.
 */
export function didCommToTsp(msg: DIDCommMessage): TspMessage {
  return {
    id: msg.id,
    type: msg.type,
    from: msg.from ?? "",
    to: msg.to?.[0] ?? "",
    body: msg.body,
    timestamp: msg.created_time
      ? new Date(msg.created_time * 1000).toISOString()
      : new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Well-known TSP message types for FPS
// ---------------------------------------------------------------------------
export const TSP_MESSAGE_TYPES = {
  /** VTA provisioning request. */
  vtaProvision: "https://trusttasks.org/fpndtg/tsp/vta/provision/1.0",
  /** VTC join request. */
  vtcJoinRequest: "https://trusttasks.org/fpndtg/tsp/vtc/join/1.0",
  /** VMC issuance notification. */
  vmcIssued: "https://trusttasks.org/fpndtg/tsp/vmc/issued/1.0",
  /** Generic trust task relay. */
  trustTaskRelay: "https://trusttasks.org/fpndtg/tsp/relay/1.0",
} as const;

export type TspMessageType =
  (typeof TSP_MESSAGE_TYPES)[keyof typeof TSP_MESSAGE_TYPES];
