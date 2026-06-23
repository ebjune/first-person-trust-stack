/**
 * FPS Sync Service
 *
 * Subscribes to Postgres LISTEN/NOTIFY events from both databases
 * and reconciles cross-DB state. For example, when a VTA is created
 * in fps_infra, the sync service can update user records in fps_user.
 *
 * Phase 1: Connects to the event bridge and logs events.
 * Phase 2: Implement reconciliation handlers.
 */

import {
  createEventBusFromEnv,
  INFRA_CHANNELS,
  USER_CHANNELS,
  type InfraEvent,
  type UserEvent,
} from "@fpndtg/event-bridge";

const enabled = process.env["SYNC_SERVICE_ENABLED"] !== "false";

if (!enabled) {
  console.log("[sync-service] disabled via SYNC_SERVICE_ENABLED=false");
  process.exit(0);
}

const bus = createEventBusFromEnv();

async function handleInfraEvent(event: InfraEvent): Promise<void> {
  console.log(`[sync-service] infra event: ${event.type}`, event);

  // TODO Phase 2: implement reconciliation handlers
  // Example handlers:
  // - vta.created → ensure user record exists in fps_user if DID is known
  // - vtc.member_added → update VtcMembership in fps_user
  // - vmc.issued → store credential in user wallet if holder is known
}

async function handleUserEvent(event: UserEvent): Promise<void> {
  console.log(`[sync-service] user event: ${event.type}`, event);

  // TODO Phase 2: implement reconciliation handlers
  // Example handlers:
  // - user.vta.claimed → verify DID exists in fps_infra vta_events
  // - user.joined.vtc → verify community exists in fps_infra vtc_events
}

async function main() {
  console.log("[sync-service] connecting to event bridge...");
  await bus.connect();
  console.log("[sync-service] connected");

  // Subscribe to all infra channels
  bus.subscribeInfra(INFRA_CHANNELS.vtaEvents, handleInfraEvent);
  bus.subscribeInfra(INFRA_CHANNELS.vtcEvents, handleInfraEvent);
  bus.subscribeInfra(INFRA_CHANNELS.tspEvents, handleInfraEvent);
  bus.subscribeInfra(INFRA_CHANNELS.vmcEvents, handleInfraEvent);

  // Subscribe to all user channels
  bus.subscribeUser(USER_CHANNELS.userEvents, handleUserEvent);
  bus.subscribeUser(USER_CHANNELS.credentialEvents, handleUserEvent);

  console.log("[sync-service] listening for events...");

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("[sync-service] shutting down...");
    await bus.disconnect();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.log("[sync-service] shutting down...");
    await bus.disconnect();
    process.exit(0);
  });
}

main().catch((err: unknown) => {
  console.error("[sync-service] fatal error:", err);
  process.exit(1);
});
