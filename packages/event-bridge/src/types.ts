// Event types for the Postgres LISTEN/NOTIFY event bridge.
// InfraEvents flow from fps_infra; UserEvents flow from fps_user.
// The sync-service subscribes to both and reconciles cross-DB state.

// ---------------------------------------------------------------------------
// Infrastructure Events (published from fps_infra)
// ---------------------------------------------------------------------------
export type InfraEvent =
  | { type: "vta.created"; did: string; timestamp: string }
  | { type: "vta.rotated"; did: string; timestamp: string }
  | { type: "vta.revoked"; did: string; timestamp: string }
  | {
      type: "vtc.created";
      cdid: string;
      adminDid: string;
      timestamp: string;
    }
  | {
      type: "vtc.member_added";
      cdid: string;
      memberDid: string;
      timestamp: string;
    }
  | {
      type: "vtc.member_removed";
      cdid: string;
      memberDid: string;
      timestamp: string;
    }
  | {
      type: "vtc.governance_changed";
      cdid: string;
      timestamp: string;
    }
  | {
      type: "vmc.issued";
      credentialId: string;
      holderDid: string;
      issuerCdid: string;
      timestamp: string;
    }
  | {
      type: "tsp.message_sent";
      messageId: string;
      fromDid: string;
      toDid: string;
      timestamp: string;
    };

// ---------------------------------------------------------------------------
// User Events (published from fps_user)
// ---------------------------------------------------------------------------
export type UserEvent =
  | { type: "user.created"; userId: string; did: string; timestamp: string }
  | {
      type: "user.vta.claimed";
      userId: string;
      did: string;
      timestamp: string;
    }
  | {
      type: "user.joined.vtc";
      userId: string;
      cdid: string;
      role: string;
      timestamp: string;
    }
  | {
      type: "user.left.vtc";
      userId: string;
      cdid: string;
      timestamp: string;
    }
  | {
      type: "user.credential.stored";
      userId: string;
      credentialId: string;
      timestamp: string;
    };

// ---------------------------------------------------------------------------
// Channel names for LISTEN/NOTIFY
// ---------------------------------------------------------------------------
export const INFRA_CHANNELS = {
  vtaEvents: "fps_infra_vta_events",
  vtcEvents: "fps_infra_vtc_events",
  tspEvents: "fps_infra_tsp_events",
  vmcEvents: "fps_infra_vmc_events",
} as const;

export const USER_CHANNELS = {
  userEvents: "fps_user_events",
  credentialEvents: "fps_user_credential_events",
} as const;

export type InfraChannel = (typeof INFRA_CHANNELS)[keyof typeof INFRA_CHANNELS];
export type UserChannel = (typeof USER_CHANNELS)[keyof typeof USER_CHANNELS];

// ---------------------------------------------------------------------------
// Event bus interface
// ---------------------------------------------------------------------------
export interface EventBus {
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  publishInfra(channel: InfraChannel, event: InfraEvent): Promise<void>;
  publishUser(channel: UserChannel, event: UserEvent): Promise<void>;

  subscribeInfra(
    channel: InfraChannel,
    handler: (event: InfraEvent) => Promise<void>,
  ): void;
  subscribeUser(
    channel: UserChannel,
    handler: (event: UserEvent) => Promise<void>,
  ): void;
}
