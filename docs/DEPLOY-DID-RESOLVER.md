# Deploying the DID Resolver to dids.fpndtg.com

> **Service:** `services/did-resolver`  
> **Target host:** The server where `dids.fpndtg.com` is configured  
> **Port:** 8792 (internal; Nginx proxies public traffic)

---

## ⚠️ Current deployment constraint: monorepo dependency

The DID resolver currently depends on `@fpndtg/db-infra` (a workspace package) and `@fpndtg/brand-config`. This means the full monorepo must be present on the server to build and run it.

**This is a known limitation.** The long-term goal is to publish each service as a standalone deployable. The path to get there is:

1. Publish `@fpndtg/db-infra` and `@fpndtg/brand-config` to a private npm registry (or GitHub Packages)
2. Move `services/did-resolver` to its own repo (or keep it here but build a standalone Docker image)
3. The service itself has no other dependencies — it only needs `DATABASE_INFRA_URL` and Node.js

Until then, the full repo must be cloned on the server. This is the same requirement as all other FPS services.

---

## Prerequisites on the server

- Node.js ≥ 20
- pnpm 9.x (`npm install -g pnpm`)
- Access to the `fps_infra` PostgreSQL database (`DATABASE_INFRA_URL`)
- Nginx already serving `dids.fpndtg.com`
- Git access to `https://github.com/ebjune/fpts-exploratory`

---

## Step 1 — Clone / pull the repo

```bash
git clone https://github.com/ebjune/fpts-exploratory.git /opt/fps
cd /opt/fps
# or if already cloned:
git -C /opt/fps pull origin main
```

---

## Step 2 — Install dependencies and build

```bash
cd /opt/fps
pnpm install --frozen-lockfile
pnpm build
```

This compiles all packages. The DID resolver output is at `services/did-resolver/dist/index.js`.

---

## Step 3 — Configure environment

Create `/opt/fps/.env` (do not commit this file):

```env
DATABASE_INFRA_URL=postgresql://devuser:PASSWORD@DB_HOST:5432/fps_infra
DID_RESOLVER_PORT=8792
```

The service reads `.env` via `dotenv-cli` when started with `pnpm start`.

---

## Step 4 — Run the service

### Option A: Direct (foreground, for testing)

```bash
cd /opt/fps
pnpm --filter @fpndtg/did-resolver start
```

### Option B: systemd (recommended for production)

Create `/etc/systemd/system/fps-did-resolver.service`:

```ini
[Unit]
Description=FPS DID Resolver (did:webvh)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/fps
ExecStart=/usr/bin/node services/did-resolver/dist/index.js
EnvironmentFile=/opt/fps/.env
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable fps-did-resolver
sudo systemctl start fps-did-resolver
sudo systemctl status fps-did-resolver
```

### Option C: PM2

```bash
npm install -g pm2
cd /opt/fps
pm2 start services/did-resolver/dist/index.js \
  --name fps-did-resolver \
  --cwd /opt/fps
pm2 save
pm2 startup
```

---

## Step 5 — Configure Nginx

Add or update the server block for `dids.fpndtg.com`:

```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name dids.fpndtg.com;

    # SSL config (certbot/Let's Encrypt)
    # ssl_certificate /etc/letsencrypt/live/dids.fpndtg.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/dids.fpndtg.com/privkey.pem;

    # Proxy all requests to the DID resolver
    location / {
        proxy_pass http://127.0.0.1:8792;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # did:webvh content types
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, OPTIONS";
    }
}
```

Reload Nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## Step 6 — Verify

```bash
# Health check
curl https://dids.fpndtg.com/health

# Resolve a DID (must have been provisioned via orchestrator first)
curl https://dids.fpndtg.com/did:webvh:dids.fpndtg.com:alice/did.json | jq

# Version history
curl https://dids.fpndtg.com/did:webvh:dids.fpndtg.com:alice/did.jsonl
```

---

## Relationship to existing dids.fpndtg.com

Currently `dids.fpndtg.com` is listed as "Live" in the domain map — it may be serving static `did.jsonl` files directly. Once this service is deployed:

- Dynamic DID documents are served from the `fps_infra` ledger
- Version history is always consistent with the ledger hash chain
- The static files can be removed or kept as a fallback

---

## Dependency on the orchestrator

The DID resolver is **read-only** — it only serves DID documents that already exist in the `fps_infra.vta_events` ledger. VTA provisioning (writing to the ledger) is done by the **orchestrator** service.

The orchestrator does not need to be deployed to `dids.fpndtg.com`. It can run on any server that has access to the same `fps_infra` database. See `services/orchestrator/README.md` for its role.

> **Infrastructure gap:** The orchestrator currently has no public URL configured (`orchestrator.fpndtg.com` is not yet set up). This needs to be addressed before the full provisioning → resolution flow can be tested end-to-end in production. The orchestrator is an internal service — it does not need to be publicly accessible; it only needs to be reachable from the web app server.

---

## Rollback

```bash
sudo systemctl stop fps-did-resolver
# Restore previous Nginx config to serve static files
sudo systemctl reload nginx
```

---

## Logs

```bash
# systemd
sudo journalctl -u fps-did-resolver -f

# PM2
pm2 logs fps-did-resolver
```

---

## Future: standalone deployment

To deploy the DID resolver without the full monorepo:

1. Add a `Dockerfile` to `services/did-resolver/` that:
   - Copies only `services/did-resolver/dist/` and its `node_modules`
   - Sets `DATABASE_INFRA_URL` and `DID_RESOLVER_PORT` as env vars
2. Build and push the image to a container registry
3. Run on the server with `docker run` or in a compose stack

This is the recommended path once the service stabilizes. A `Dockerfile` can be added in a future task.
