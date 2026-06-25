# Deploying the DID Resolver to dids.fpndtg.com

> **Service:** `services/did-resolver`  
> **Target host:** The server where `dids.fpndtg.com` is configured  
> **Port:** 8792 (internal; Nginx proxies public traffic)

---

## Prerequisites on the server

- Node.js ≥ 20
- pnpm 9.x (`npm install -g pnpm`)
- Access to the `fps_infra` PostgreSQL database (`DATABASE_INFRA_URL`)
- Nginx already serving `dids.fpndtg.com`

---

## Step 1 — Clone / pull the repo

```bash
git clone https://github.com/ebjune/first-person-trust-stack.git
cd first-person-trust-stack
# or if already cloned:
git pull origin main
```

---

## Step 2 — Install dependencies and build

```bash
pnpm install
pnpm build
```

This compiles all packages including `services/did-resolver` to `services/did-resolver/dist/`.

---

## Step 3 — Configure environment

Create or update `.env` at the repo root. The DID resolver only needs:

```env
DATABASE_INFRA_URL=postgresql://devuser:PASSWORD@192.168.1.126:5432/fps_infra
DID_RESOLVER_PORT=8792
```

> The service reads `.env` via `dotenv-cli` when started with `pnpm start`.

---

## Step 4 — Run the service

### Option A: Direct (foreground, for testing)

```bash
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
WorkingDirectory=/path/to/first-person-trust-stack
ExecStart=/usr/bin/node services/did-resolver/dist/index.js
EnvironmentFile=/path/to/first-person-trust-stack/.env
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
pm2 start services/did-resolver/dist/index.js \
  --name fps-did-resolver \
  --env production
pm2 save
pm2 startup
```

---

## Step 5 — Configure Nginx

Add a server block for `dids.fpndtg.com`. If you already have one serving static files, **add the proxy location before any static file rules**:

```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name dids.fpndtg.com;

    # SSL config (certbot/Let's Encrypt)
    # ssl_certificate ...
    # ssl_certificate_key ...

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

## Step 7 — Run the E2E test against production

The test script accepts env vars to override the default localhost URLs:

```bash
ORCHESTRATOR=https://orchestrator.fpndtg.com \
RESOLVER=https://dids.fpndtg.com \
bash services/did-resolver/test-e2e.sh
```

> **Note:** The orchestrator must also be deployed and reachable for the provisioning step.

---

## Relationship to existing dids.fpndtg.com

Currently `dids.fpndtg.com` is listed as "Live" in the domain map — it may be serving static `did.jsonl` files directly. Once this service is deployed:

- Dynamic DID documents are served from the `fps_infra` ledger
- Version history is always consistent with the ledger hash chain
- The static files can be removed or kept as a fallback

---

## Rollback

If the service fails to start:

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
