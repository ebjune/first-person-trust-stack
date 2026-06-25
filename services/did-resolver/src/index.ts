import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  getVtaEvents,
  getVtaEventByHash,
  getVtaEventAtTime,
} from "@fpndtg/db-infra";
import { buildDidDocument } from "./builder.js";

const app = new Hono();

// ---------------------------------------------------------------------------
// CORS — allow the web app and validator
// ---------------------------------------------------------------------------
app.use(
  "/*",
  cors({
    origin: (origin) => {
      const allowed = [
        "http://localhost:5173",
        "https://app.fpndtg.com",
        "http://localhost:8787",
        "https://validator.fpndtg.com",
      ];
      return allowed.includes(origin) ? origin : null;
    },
    allowMethods: ["GET", "OPTIONS"],
    allowHeaders: ["Content-Type", "Accept"],
  }),
);

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
app.get("/health", (c) =>
  c.json({
    status: "ok",
    service: "fps-did-resolver",
    method: "did:webvh",
  }),
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse a DID from the URL parameter and validate it is a did:webvh DID. */
function parseDid(raw: string): { ok: true; did: string } | { ok: false; error: string } {
  // URL-decode in case the colon-separated DID was percent-encoded
  const did = decodeURIComponent(raw);
  if (!did.startsWith("did:webvh:")) {
    return { ok: false, error: `Invalid DID method — expected did:webvh, got: ${did}` };
  }
  return { ok: true, did };
}

// ---------------------------------------------------------------------------
// GET /:did/did.json
// Resolves the latest (or versioned) DID document for a given DID.
//
// Query params:
//   ?versionId=sha256:<hash>   — resolve a specific version by hash
//   ?versionTime=<ISO8601>     — resolve the version at a point in time
// ---------------------------------------------------------------------------
app.get("/:did/did.json", async (c) => {
  const rawDid = c.req.param("did");
  const parsed = parseDid(rawDid);
  if (!parsed.ok) {
    return c.json({ error: parsed.error }, 400);
  }
  const { did } = parsed;

  const versionId = c.req.query("versionId");
  const versionTime = c.req.query("versionTime");

  try {
    type VtaRow = Awaited<ReturnType<typeof getVtaEvents>>[number];
    let event: VtaRow | null = null;

    if (versionId !== undefined) {
      // Strip "sha256:" prefix if present
      const hash = versionId.startsWith("sha256:") ? versionId.slice(7) : versionId;
      const found = await getVtaEventByHash(hash);
      if (!found || found.did !== did) {
        return c.json({ error: `Version not found: ${versionId}` }, 404);
      }
      event = found;
    } else if (versionTime !== undefined) {
      const at = new Date(versionTime);
      if (isNaN(at.getTime())) {
        return c.json({ error: `Invalid versionTime: ${versionTime}` }, 400);
      }
      const found = await getVtaEventAtTime(did, at);
      if (!found) {
        return c.json(
          { error: `No DID document found for ${did} at ${versionTime}` },
          404,
        );
      }
      event = found;
    } else {
      // Latest version — get all events for this DID and take the last one
      const events = await getVtaEvents(did);
      if (events.length === 0) {
        return c.json({ error: `DID not found: ${did}` }, 404);
      }
      event = events[events.length - 1];
    }

    const doc = buildDidDocument(event);
    return c.body(JSON.stringify(doc), 200, {
      "Content-Type": "application/did+json",
    });
  } catch (err) {
    console.error("[did-resolver] error resolving DID document:", err);
    return c.json(
      {
        error: "Internal server error",
        note: "Database connection may not be configured. Set DATABASE_INFRA_URL in .env",
      },
      503,
    );
  }
});

// ---------------------------------------------------------------------------
// GET /:did/did.jsonl
// Returns the full version history as JSON Lines (one DID document per line).
// ---------------------------------------------------------------------------
app.get("/:did/did.jsonl", async (c) => {
  const rawDid = c.req.param("did");
  const parsed2 = parseDid(rawDid);
  if (!parsed2.ok) {
    return c.json({ error: parsed2.error }, 400);
  }
  const { did } = parsed2;

  try {
    const events = await getVtaEvents(did);
    if (events.length === 0) {
      return c.json({ error: `DID not found: ${did}` }, 404);
    }

    const lines = events
      .map((event) => JSON.stringify(buildDidDocument(event)))
      .join("\n");

    return c.body(lines + "\n", 200, {
      "Content-Type": "application/did+jsonl",
    });
  } catch (err) {
    console.error("[did-resolver] error resolving DID history:", err);
    return c.json(
      {
        error: "Internal server error",
        note: "Database connection may not be configured. Set DATABASE_INFRA_URL in .env",
      },
      503,
    );
  }
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const port = Number(process.env["DID_RESOLVER_PORT"] ?? 8792);

serve({ fetch: app.fetch, port }, () => {
  console.log(`FPS DID resolver listening on http://localhost:${port}`);
  console.log(`  Resolves: did:webvh:dids.fpndtg.com:*`);
});
