# Start here

Open this repo in **Cursor on Windows** (not the WSL `verifiable-trust-infrastructure` workspace).

## First prompt for a new Cursor chat

Copy-paste this into Agent mode:

```
Read docs/SCAFFOLD-BRIEF.md and .cursor/rules/fps-scaffold.mdc, then scaffold the Phase 1 FPS monorepo exactly as specified there. Use pnpm workspaces, TypeScript, Vite+React for apps/web, Hono for apps/validator. Run pnpm install && pnpm build when done.
```

That gives the new session full context without this chat's history.

## Prerequisites (Windows)

```powershell
node -v    # 20+
npm install -g pnpm
pnpm -v
```

## After scaffold

```powershell
git add .
git commit -s -m "Scaffold FPS monorepo (Path A, pnpm workspaces)"
git push origin main
```
