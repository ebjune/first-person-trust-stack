import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { FPNDTG } from "@fpndtg/brand-config";

const app = new Hono();

app.get("/health", (c) =>
  c.json({
    status: "ok",
    service: "fps-validator",
    didResolver: FPNDTG.dids,
  }),
);

interface VerifyRequest {
  presentation?: unknown;
}

app.post("/verify", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as VerifyRequest;

  if (!body.presentation) {
    return c.json({ valid: false, reason: "missing presentation" }, 400);
  }

  // TODO: resolve DIDs via dids.fpndtg.com, verify proofs, check status list
  return c.json({
    valid: false,
    reason: "not implemented",
    resolver: FPNDTG.dids,
  });
});

const port = Number(process.env.PORT ?? 8787);

serve({ fetch: app.fetch, port }, () => {
  console.log(`FPS validator listening on http://localhost:${port}`);
});
