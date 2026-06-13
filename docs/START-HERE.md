# Start here

Open this repo in **Cursor on Windows** (not the WSL `verifiable-trust-infrastructure` workspace).

The Phase 1 monorepo is scaffolded. See [SCAFFOLD-BRIEF.md](./SCAFFOLD-BRIEF.md) for architecture context.

## Prerequisites (Windows)

```powershell
node -v    # 20+
npm install -g pnpm
pnpm -v
```

## Quick start

```powershell
pnpm install
pnpm build
pnpm dev:web          # http://localhost:5173
pnpm dev:validator    # http://localhost:8787
```

## New Cursor chat

Point the agent at `docs/SCAFFOLD-BRIEF.md` and `.cursor/rules/fps-scaffold.mdc` for full project context.
