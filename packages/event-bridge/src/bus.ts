import { Client } from "pg";
import type {
  EventBus,
  InfraChannel,
  InfraEvent,
  UserChannel,
  UserEvent,
} from "./types.js";

/**
 * PostgresEventBus — implements the EventBus interface using Postgres LISTEN/NOTIFY.
 *
 * Uses two dedicated pg.Client connections (one per database) so that
 * LISTEN subscriptions don't interfere with regular query traffic.
 *
 * Usage:
 *   const bus = new PostgresEventBus(process.env.DATABASE_INFRA_URL!, process.env.DATABASE_USER_URL!);
 *   await bus.connect();
 *   bus.subscribeInfra(INFRA_CHANNELS.vtaEvents, async (event) => { ... });
 *   await bus.publishInfra(INFRA_CHANNELS.vtaEvents, { type: 'vta.created', ... });
 */
export class PostgresEventBus implements EventBus {
  private infraClient: Client;
  private userClient: Client;
  private connected = false;

  constructor(infraUrl: string, userUrl: string) {
    this.infraClient = new Client({ connectionString: infraUrl });
    this.userClient = new Client({ connectionString: userUrl });
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    await this.infraClient.connect();
    await this.userClient.connect();
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    await this.infraClient.end();
    await this.userClient.end();
    this.connected = false;
  }

  async publishInfra(channel: InfraChannel, event: InfraEvent): Promise<void> {
    await this.infraClient.query("SELECT pg_notify($1, $2)", [
      channel,
      JSON.stringify(event),
    ]);
  }

  async publishUser(channel: UserChannel, event: UserEvent): Promise<void> {
    await this.userClient.query("SELECT pg_notify($1, $2)", [
      channel,
      JSON.stringify(event),
    ]);
  }

  subscribeInfra(
    channel: InfraChannel,
    handler: (event: InfraEvent) => Promise<void>,
  ): void {
    void this.infraClient.query(`LISTEN "${channel}"`);
    this.infraClient.on("notification", (msg) => {
      if (msg.channel !== channel || !msg.payload) return;
      const event = JSON.parse(msg.payload) as InfraEvent;
      handler(event).catch((err: unknown) => {
        console.error(`[event-bridge] infra handler error on ${channel}:`, err);
      });
    });
  }

  subscribeUser(
    channel: UserChannel,
    handler: (event: UserEvent) => Promise<void>,
  ): void {
    void this.userClient.query(`LISTEN "${channel}"`);
    this.userClient.on("notification", (msg) => {
      if (msg.channel !== channel || !msg.payload) return;
      const event = JSON.parse(msg.payload) as UserEvent;
      handler(event).catch((err: unknown) => {
        console.error(`[event-bridge] user handler error on ${channel}:`, err);
      });
    });
  }
}

/**
 * Create a PostgresEventBus from environment variables.
 * Reads DATABASE_INFRA_URL and DATABASE_USER_URL.
 */
export function createEventBusFromEnv(): PostgresEventBus {
  const infraUrl = process.env["DATABASE_INFRA_URL"];
  const userUrl = process.env["DATABASE_USER_URL"];

  if (!infraUrl) throw new Error("DATABASE_INFRA_URL is not set");
  if (!userUrl) throw new Error("DATABASE_USER_URL is not set");

  return new PostgresEventBus(infraUrl, userUrl);
}
