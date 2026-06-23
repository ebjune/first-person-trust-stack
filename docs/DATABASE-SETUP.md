# Database Setup Guide

This guide covers setting up the two PostgreSQL databases required by FPS on your Ubuntu server.

## Prerequisites

- PostgreSQL 14+ running on your Ubuntu server
- `psql` client available locally (for running setup commands)
- The two databases already created: `fps_infra` and `fps_user`

---

## Step 1: Create the Databases

Connect to your Postgres server and create both databases:

```bash
psql "postgresql://USER:PASSWORD@HOST:5432/postgres" <<'SQL'
CREATE DATABASE fps_infra;
CREATE DATABASE fps_user;
SQL
```

Or interactively:

```bash
psql "postgresql://USER:PASSWORD@HOST:5432/postgres"
```

```sql
CREATE DATABASE fps_infra;
CREATE DATABASE fps_user;
\q
```

---

## Step 2: Configure Environment Variables

Copy `.env.example` to `.env` at the repo root and fill in your connection strings:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
DATABASE_INFRA_URL=postgresql://fpc:YOUR_PASSWORD@192.168.1.126:5432/fps_infra
DATABASE_USER_URL=postgresql://fpc:YOUR_PASSWORD@192.168.1.126:5432/fps_user
```

> **Note:** `.env` is gitignored and must never be committed.

---

## Step 3: Run Prisma Migrations

Each database package manages its own Prisma schema and migrations independently.

### Infrastructure DB

```bash
cd packages/db-infra
pnpm prisma migrate dev --name init
```

### User DB

```bash
cd packages/db-user
pnpm prisma migrate dev --name init
```

Or from the repo root using workspace filters:

```bash
pnpm --filter @fpndtg/db-infra prisma migrate dev --name init
pnpm --filter @fpndtg/db-user prisma migrate dev --name init
```

---

## Step 4: Verify Connections

After migrations run, verify both databases are accessible:

```bash
pnpm --filter @fpndtg/db-infra db:check
pnpm --filter @fpndtg/db-user db:check
```

Or directly with psql:

```bash
psql "$DATABASE_INFRA_URL" -c "\dt"
psql "$DATABASE_USER_URL" -c "\dt"
```

---

## Database Architecture

| Database | Purpose | Access Pattern |
|----------|---------|----------------|
| `fps_infra` | Infrastructure events (VTA/VTC lifecycle, TSP routing, Trust Task audit) | Append-only; no UPDATEs |
| `fps_user` | User state (accounts, wallets, memberships, sessions) | Read/write |

See [DATABASE-ARCHITECTURE-PLAN.md](DATABASE-ARCHITECTURE-PLAN.md) for full schema details.

---

## Prisma Schema Locations

| Package | Schema | Migrations |
|---------|--------|------------|
| `packages/db-infra` | `packages/db-infra/prisma/schema.prisma` | `packages/db-infra/prisma/migrations/` |
| `packages/db-user` | `packages/db-user/prisma/schema.prisma` | `packages/db-user/prisma/migrations/` |

---

## Resetting Databases (Development Only)

To wipe and re-migrate from scratch:

```bash
pnpm --filter @fpndtg/db-infra prisma migrate reset
pnpm --filter @fpndtg/db-user prisma migrate reset
```

> ⚠️ This destroys all data. Development only.

---

## Troubleshooting

### Connection refused

Check that Postgres is running and accepting remote connections:

```bash
# On the Ubuntu server
sudo systemctl status postgresql
sudo -u postgres psql -c "SHOW listen_addresses;"
```

Ensure `postgresql.conf` has `listen_addresses = '*'` and `pg_hba.conf` allows your client IP.

### Authentication failed

Verify the user has privileges on both databases:

```sql
-- On the Ubuntu server as postgres superuser
GRANT ALL PRIVILEGES ON DATABASE fps_infra TO fpc;
GRANT ALL PRIVILEGES ON DATABASE fps_user TO fpc;
```

### Prisma can't find .env

Prisma reads `.env` from the package directory. Each `packages/db-*` package has a `prisma/schema.prisma` that references `env("DATABASE_INFRA_URL")` or `env("DATABASE_USER_URL")`. The root `.env` is loaded automatically when running from the repo root via pnpm workspace filters.

If running `prisma` directly from inside a package directory, ensure the root `.env` is symlinked or the env vars are exported in your shell.
