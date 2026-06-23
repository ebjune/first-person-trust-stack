import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  generateChallenge,
  consumeChallenge,
  resolveDidDocument,
  verifySignature,
} from "@fpndtg/auth-vta";
import {
  getUserByDid,
  createUser,
  createSession,
  getSession,
  revokeSession,
  logActivity,
} from "@fpndtg/db-user";

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
  c.json({ status: "ok", service: "fps-auth-service" }),
);

// ---------------------------------------------------------------------------
// POST /auth/challenge
// Body: { did: string }
// Returns: { challenge, did, expiresAt }
// ---------------------------------------------------------------------------
app.post("/auth/challenge", async (c) => {
  const body = await c.req.json<{ did?: string }>().catch(() => ({} as { did?: string }));

  if (!body.did) {
    return c.json({ error: "did is required" }, 400);
  }

  const challenge = generateChallenge(body.did);
  return c.json(challenge);
});

// ---------------------------------------------------------------------------
// POST /auth/verify
// Body: { challenge: string, signature: string, did: string }
// Returns: { token, expiresAt } or 401
// ---------------------------------------------------------------------------
app.post("/auth/verify", async (c) => {
  const body = await c
    .req.json<{ challenge?: string; signature?: string; did?: string }>()
    .catch(() => ({} as { challenge?: string; signature?: string; did?: string }));

  if (!body.challenge || !body.signature || !body.did) {
    return c.json({ error: "challenge, signature, and did are required" }, 400);
  }

  // Consume the challenge (one-time use, validates TTL)
  const challengeDid = consumeChallenge(body.challenge);
  if (!challengeDid || challengeDid !== body.did) {
    return c.json({ error: "Invalid or expired challenge" }, 401);
  }

  // Resolve DID document
  const didDocument = await resolveDidDocument(body.did);

  // Verify signature
  const isValid = await verifySignature(
    body.challenge,
    body.signature,
    didDocument,
  );

  if (!isValid) {
    // NOTE: In Phase 1, verifySignature always returns false (not implemented).
    // To test the auth flow end-to-end before Phase 2 crypto is ready,
    // set AUTH_SKIP_SIGNATURE_VERIFY=true in .env (development only).
    const skipVerify =
      process.env["AUTH_SKIP_SIGNATURE_VERIFY"] === "true" &&
      process.env["NODE_ENV"] !== "production";

    if (!skipVerify) {
      return c.json(
        {
          error: "Signature verification failed",
          note: "Cryptographic verification not yet implemented. Set AUTH_SKIP_SIGNATURE_VERIFY=true in development to bypass.",
        },
        401,
      );
    }
  }

  // Find or create user
  const existingUser = await getUserByDid(body.did);
  const user = existingUser ?? (await createUser({ primaryDid: body.did }));

  // Create session
  const session = await createSession({ userId: user.id, did: body.did });

  // Log activity
  await logActivity(user.id, "auth.login", { did: body.did });

  return c.json({
    token: session.token,
    expiresAt: session.expiresAt.toISOString(),
    userId: user.id,
  });
});

// ---------------------------------------------------------------------------
// GET /auth/session
// Header: Authorization: Bearer <token>
// Returns: { userId, did, expiresAt } or 401
// ---------------------------------------------------------------------------
app.get("/auth/session", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Authorization header required" }, 401);
  }

  const token = authHeader.slice(7);
  const session = await getSession(token);

  if (!session) {
    return c.json({ error: "Invalid or expired session" }, 401);
  }

  return c.json({
    userId: session.userId,
    did: session.did,
    expiresAt: session.expiresAt.toISOString(),
  });
});

// ---------------------------------------------------------------------------
// DELETE /auth/session
// Header: Authorization: Bearer <token>
// ---------------------------------------------------------------------------
app.delete("/auth/session", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Authorization header required" }, 401);
  }

  const token = authHeader.slice(7);
  await revokeSession(token).catch(() => null);

  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const port = Number(process.env["AUTH_SERVICE_PORT"] ?? 8788);

serve({ fetch: app.fetch, port }, () => {
  console.log(`FPS auth service listening on http://localhost:${port}`);
});
