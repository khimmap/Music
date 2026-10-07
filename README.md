# Ember

A shared listening room where friends watch YouTube and listen to music together
in real time — like a small radio station that keeps playing for your group.

This repository is a workspace scaffold: tooling, configuration, and a single
placeholder page. No product features are implemented yet.

## Requirements

- **Node.js** LTS (`.nvmrc` pins `24.17.0`; any Node ≥ 20 works)
- **pnpm 12** via Corepack (bundled with Node — no global install needed)

## Install

This repo uses pnpm through Corepack. If you don't have a global `pnpm`, prefix
commands with `corepack`:

```bash
corepack pnpm install
```

Copy the example env files before running:

```bash
cp apps/web/.env.example apps/web/.env
cp apps/server/.env.example apps/server/.env
```

| Variable                | Where        | Default                 |
| ----------------------- | ------------ | ----------------------- |
| `NEXT_PUBLIC_SOCKET_URL`| apps/web     | `http://localhost:4000` |
| `PORT`                  | apps/server  | `4000`                  |
| `CLIENT_ORIGIN`         | apps/server  | `http://localhost:3000` |

## Run

```bash
corepack pnpm dev
```

- Web app: http://localhost:3000 (shows "Ember — workspace ready")
- Server health check: http://localhost:4000/health → `ok`

## Test

```bash
corepack pnpm test:e2e
```

Playwright starts both apps automatically and runs the smoke tests.

## Scripts

| Script      | Description                               |
| ----------- | ----------------------------------------- |
| `dev`       | Run web + server in parallel              |
| `build`     | Build every workspace package             |
| `lint`      | ESLint across the monorepo                |
| `typecheck` | `tsc --noEmit` across packages            |
| `format`    | Prettier `--write`                        |
| `test:e2e`  | Playwright smoke tests                     |

## Layout

- `apps/web` — Next.js (App Router) + TypeScript + Tailwind CSS
- `apps/server` — Node + TypeScript + Socket.io
- `packages/shared` — shared types and Socket.io event contracts
- `e2e` — Playwright smoke tests
- `DESIGN.md` — design source of truth (see `CLAUDE.md` for UI rules)
