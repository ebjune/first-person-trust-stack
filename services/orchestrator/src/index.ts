import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { vtaHealth, vtcHealth, withTrustTask, TRUST_TASKS } from "@fpndtg/adapters-vti";
import { FPNDTG } from "@fpndtg/brand-config";
import {
  appendVtaLedgerEvent,
  appendVtcLedgerEvent,
} from "@fpndtg/ledger-emulator";
import { logTrustTask } from "@fpndtg/db-infra";
import { createEventBusFromEnv, INFRA_CHANNELS } from "@fpndtg/event-bridge";

const app = new Hono();

// ---------------------------------------------------------------------------
// CORS — allow the web app (localhost:5173 in dev, app.fpndtg.com in prod)
// ---------------------------------------------------------------------------
app.use(
  "/*",
  cors({
    origin: (origin) => {
      const allowed = [
        "http://localhost:5173",
        "https://app.fpndtg.com",
      ];
      return allowed.includes(origin) ? origin : null;
    },
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
app.get("/health", (c) =>
  c.json({ status: "ok", service: "fps-orchestrator" }),
);

// ---------------------------------------------------------------------------
// GET /vta/health — proxy VTA health check + log to infra DB
// ---------------------------------------------------------------------------
app.get("/vta/health", async (c) => {
  const start = Date.now();
  const result = await vtaHealth();
  const durationMs = Date.now() - start;

  await logTrustTask({
    taskUri: "health/vta",
    method: "GET",
    endpoint: result.url,
    statusCode: result.status,
    durationMs,
  });

  return c.json(result);
});

// ---------------------------------------------------------------------------
// GET /vtc/health — proxy VTC health check + log to infra DB
// ---------------------------------------------------------------------------
app.get("/vtc/health", async (c) => {
  const start = Date.now();
  const result = await vtcHealth();
  const durationMs = Date.now() - start;

  await logTrustTask({
    taskUri: "health/vtc",
    method: "GET",
    endpoint: result.url,
    statusCode: result.status,
    durationMs,
  });

  return c.json(result);
});

// ---------------------------------------------------------------------------
// POST /vta/provision
// Body: { did: string, context?: string }
// Logs VTA creation event to the ledger.
// TODO Phase 2: call VTI VTA provisioning API
// ---------------------------------------------------------------------------
app.post("/vta/provision", async (c) => {
  const body = await c
    .req.json<{ did?: string; context?: string }>()
    .catch(() => ({} as { did?: string; context?: string }));

  if (!body.did) {
    return c.json({ error: "did is required" }, 400);
  }

  // Log to ledger — include DID document fields so the DID resolver can serve them
  const event = await appendVtaLedgerEvent({
    did: body.did,
    eventType: "created",
    payload: {
      did: body.did,
      context: body.context ?? "default",
      provisionedAt: new Date().toISOString(),
      source: "orchestrator",
      // Phase 1 placeholder key material — real keys come from VTI in Phase 2B
      verificationMethod: [
        {
          id: "#key-1",
          type: "Ed25519VerificationKey2020",
          controller: body.did,
          publicKeyMultibase: null,
        },
      ],
      authentication: ["#key-1"],
      service: [
        {
          id: "#mediator",
          type: "DIDCommMessaging",
          serviceEndpoint: "https://mediator.fpndtg.com",
        },
      ],
    },
  });

  // Publish event to infra channel
  try {
    const bus = createEventBusFromEnv();
    await bus.connect();
    await bus.publishInfra(INFRA_CHANNELS.vtaEvents, {
      type: "vta.created",
      did: body.did,
      timestamp: event.timestamp.toISOString(),
    });
    await bus.disconnect();
  } catch (err) {
    // Non-fatal: event bus failure should not block provisioning
    console.warn("[orchestrator] event bus publish failed:", err);
  }

  return c.json({
    ok: true,
    did: body.did,
    sequence: event.sequence,
    timestamp: event.timestamp.toISOString(),
    note: "VTA ledger event recorded. VTI provisioning call not yet implemented.",
  });
});

// ---------------------------------------------------------------------------
// POST /vtc/provision
// Body: { cdid: string, adminDid: string, name?: string }
// Logs VTC creation event to the ledger.
// TODO Phase 2: call VTI VTC provisioning API
// ---------------------------------------------------------------------------
app.post("/vtc/provision", async (c) => {
  const body = await c
    .req.json<{ cdid?: string; adminDid?: string; name?: string }>()
    .catch(() => ({} as { cdid?: string; adminDid?: string; name?: string }));

  if (!body.cdid || !body.adminDid) {
    return c.json({ error: "cdid and adminDid are required" }, 400);
  }

  // Log to ledger
  const event = await appendVtcLedgerEvent({
    cdid: body.cdid,
    eventType: "created",
    payload: {
      cdid: body.cdid,
      adminDid: body.adminDid,
      name: body.name ?? "",
      createdAt: new Date().toISOString(),
      source: "orchestrator",
    },
  });

  // Publish event to infra channel
  try {
    const bus = createEventBusFromEnv();
    await bus.connect();
    await bus.publishInfra(INFRA_CHANNELS.vtcEvents, {
      type: "vtc.created",
      cdid: body.cdid,
      adminDid: body.adminDid,
      timestamp: event.timestamp.toISOString(),
    });
    await bus.disconnect();
  } catch (err) {
    console.warn("[orchestrator] event bus publish failed:", err);
  }

  return c.json({
    ok: true,
    cdid: body.cdid,
    sequence: event.sequence,
    timestamp: event.timestamp.toISOString(),
    note: "VTC ledger event recorded. VTI provisioning call not yet implemented.",
  });
});

// ---------------------------------------------------------------------------
// POST /vtc/join
// Body: { cdid: string, memberDid: string }
// Submits a join request via Trust Task + logs to ledger.
// ---------------------------------------------------------------------------
app.post("/vtc/join", async (c) => {
  const body = await c
    .req.json<{ cdid?: string; memberDid?: string }>()
    .catch(() => ({} as { cdid?: string; memberDid?: string }));

  if (!body.cdid || !body.memberDid) {
    return c.json({ error: "cdid and memberDid are required" }, 400);
  }

  const vtcBaseUrl = process.env["FPNDTG_VTC_URL"] ?? FPNDTG.vtc;
  const endpoint = `${vtcBaseUrl}/join-requests`;
  const start = Date.now();

  let statusCode = 0;
  let responseBody: unknown = null;

  try {
    const response = await fetch(
      endpoint,
      withTrustTask(TRUST_TASKS.joinRequestSubmit, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cdid: body.cdid, memberDid: body.memberDid }),
      }),
    );
    statusCode = response.status;
    responseBody = await response.json().catch(() => null);
  } catch (err) {
    statusCode = 0;
    responseBody = { error: String(err) };
  }

  const durationMs = Date.now() - start;

  // Log Trust Task call
  await logTrustTask({
    taskUri: TRUST_TASKS.joinRequestSubmit,
    method: "POST",
    endpoint,
    statusCode,
    requestBody: { cdid: body.cdid, memberDid: body.memberDid },
    responseBody: responseBody as Record<string, unknown>,
    durationMs,
  });

  // Log member_added event to ledger
  await appendVtcLedgerEvent({
    cdid: body.cdid,
    eventType: "member_added",
    payload: {
      cdid: body.cdid,
      memberDid: body.memberDid,
      joinedAt: new Date().toISOString(),
      vtcApiStatus: statusCode,
    },
  });

  return c.json({
    ok: statusCode >= 200 && statusCode < 300,
    statusCode,
    response: responseBody,
  });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const port = Number(process.env["ORCHESTRATOR_PORT"] ?? 8789);

serve({ fetch: app.fetch, port }, () => {
  console.log(`FPS orchestrator listening on http://localhost:${port}`);
});
