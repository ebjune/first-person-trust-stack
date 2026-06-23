import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { FPNDTG } from "@fpndtg/brand-config";
import { verifyAllChains } from "@fpndtg/ledger-emulator";
import { logVerificationEvent } from "@fpndtg/db-infra";

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
  c.json({
    status: "ok",
    service: "fps-validator",
    didResolver: FPNDTG.dids,
  }),
);

// ---------------------------------------------------------------------------
// POST /verify
// Body: { presentation: unknown }
// Stub: accepts a VP, returns not-implemented.
// TODO Phase 2: resolve DIDs via dids.fpndtg.com, verify proofs, check status list
// ---------------------------------------------------------------------------
interface VerifyRequest {
  presentation?: unknown;
  verifierDid?: string;
}

app.post("/verify", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as VerifyRequest;

  if (!body.presentation) {
    return c.json({ valid: false, reason: "missing presentation" }, 400);
  }

  // Log the verification attempt to infra DB
  const presentationId =
    typeof body.presentation === "object" &&
    body.presentation !== null &&
    "id" in body.presentation
      ? String((body.presentation as Record<string, unknown>)["id"])
      : `unknown-${Date.now()}`;

  await logVerificationEvent({
    presentationId,
    verifierDid: body.verifierDid ?? "fps-validator",
    result: "invalid",
    details: {
      reason: "not implemented",
      resolver: FPNDTG.dids,
    },
  }).catch(() => null); // non-fatal if DB not connected

  return c.json({
    valid: false,
    reason: "not implemented",
    resolver: FPNDTG.dids,
  });
});

// ---------------------------------------------------------------------------
// GET /ledger/verify
// On-demand ledger hash-chain verification.
// Returns a full report of all ledger chain integrity checks.
// ---------------------------------------------------------------------------
app.get("/ledger/verify", async (c) => {
  try {
    const report = await verifyAllChains();
    return c.json(report, report.allValid ? 200 : 409);
  } catch (err) {
    return c.json(
      {
        allValid: false,
        error: err instanceof Error ? err.message : String(err),
        note: "Database connection may not be configured. Set DATABASE_INFRA_URL in .env",
      },
      503,
    );
  }
});

// ---------------------------------------------------------------------------
// GET /ledger/verify/vta
// Verify only the VTA event chain.
// ---------------------------------------------------------------------------
app.get("/ledger/verify/vta", async (c) => {
  const { verifyVtaChain } = await import("@fpndtg/ledger-emulator");
  try {
    const result = await verifyVtaChain();
    return c.json(result, result.valid ? 200 : 409);
  } catch (err) {
    return c.json(
      { valid: false, error: err instanceof Error ? err.message : String(err) },
      503,
    );
  }
});

// ---------------------------------------------------------------------------
// GET /ledger/verify/vtc
// Verify only the VTC event chain.
// ---------------------------------------------------------------------------
app.get("/ledger/verify/vtc", async (c) => {
  const { verifyVtcChain } = await import("@fpndtg/ledger-emulator");
  try {
    const result = await verifyVtcChain();
    return c.json(result, result.valid ? 200 : 409);
  } catch (err) {
    return c.json(
      { valid: false, error: err instanceof Error ? err.message : String(err) },
      503,
    );
  }
});

// ---------------------------------------------------------------------------
// GET /ledger/trust-tasks?limit=N
// Returns recent Trust Task log entries from fps_infra DB.
// ---------------------------------------------------------------------------
app.get("/ledger/trust-tasks", async (c) => {
  const limit = Math.min(Number(c.req.query("limit") ?? 20), 100);
  try {
    const { infraDb } = await import("@fpndtg/db-infra");
    const rows = await infraDb.trustTaskLog.findMany({
      orderBy: { timestamp: "desc" },
      take: limit,
      select: {
        id: true,
        taskUri: true,
        method: true,
        endpoint: true,
        statusCode: true,
        durationMs: true,
        timestamp: true,
      },
    });
    return c.json(rows.map((r) => ({
      id: r.id,
      taskUri: r.taskUri,
      method: r.method,
      endpoint: r.endpoint,
      statusCode: r.statusCode ?? 0,
      durationMs: r.durationMs ?? 0,
      createdAt: r.timestamp.toISOString(),
    })));
  } catch (err) {
    return c.json(
      { error: err instanceof Error ? err.message : String(err) },
      503,
    );
  }
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const port = Number(process.env.PORT ?? 8787);

serve({ fetch: app.fetch, port }, () => {
  console.log(`FPS validator listening on http://localhost:${port}`);
});
