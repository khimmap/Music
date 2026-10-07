# CLAUDE.md — Ember

Ember is a shared listening room where friends watch YouTube and listen to music
together in real time — a small radio station that keeps playing for your group.
It is a pnpm monorepo: a Next.js web client, a Node + Socket.io realtime server,
and a shared types/events package.

## Folder tree (condensed)

```
ember/
├── .claude/skills/        design-taste-frontend, web-design-guidelines
├── apps/web/              Next.js (App Router) + TypeScript + Tailwind
│   └── src/{app,components,hooks,lib}
├── apps/server/           Node + TypeScript + Socket.io (GET /health)
│   └── src/{index.ts,config.ts,rooms/}
├── packages/shared/       types + Socket.io event contracts (@ember/shared)
├── e2e/                   Playwright smoke tests + config
├── DESIGN.md              design source of truth (ElevenLabs analysis)
└── tsconfig.base.json, eslint.config.mjs, pnpm-workspace.yaml, …
```

## Run commands

Install prerequisite note: there is no global `pnpm`; this repo uses pnpm via
Corepack. Run pnpm as `corepack pnpm <cmd>` (or a bare `pnpm` inside package
scripts, which resolves to the pinned local `pnpm` dev dependency).

```bash
corepack pnpm install        # install all workspaces
corepack pnpm dev            # web (:3000) + server (:4000) in parallel
corepack pnpm build          # build every package
corepack pnpm lint           # ESLint across the monorepo
corepack pnpm typecheck      # tsc --noEmit across packages
corepack pnpm format         # Prettier --write
corepack pnpm test:e2e       # Playwright smoke tests (auto-starts both apps)
```

## UI rules

- **DESIGN.md is the single source of truth** for colors, fonts, radius, and
  tokens. Never override it. Tokens live as CSS variables in
  `apps/web/src/app/globals.css` and are mapped 1:1 in `apps/web/tailwind.config.ts`.
- Use the **design-taste-frontend** skill (`.claude/skills/design-taste-frontend`)
  for layout, hierarchy, motion, and spacing. If it ever conflicts with DESIGN.md
  on color or typography, **DESIGN.md wins.**
- After each screen is built, run a **web-design-guidelines** review
  (`.claude/skills/web-design-guidelines`) and fix every finding.
- **Build one screen at a time.** Never build the whole app in one pass.
- **No default purple gradients, no generic rounded-card layouts.** The brand is
  editorial and photographic: off-white canvas, warm near-black ink, pastel
  atmospheric gradient orbs as decoration only.

## Code rules

- **TypeScript strict; no `any`.** `tsconfig.base.json` is extended by every
  package and must stay strict.
- **All Socket.io events are declared in `packages/shared/src/events.ts`.** Both
  client and server import names from `@ember/shared` — never hard-code an event
  string.
- **UI components go in `apps/web/src/components`; socket logic goes in
  `apps/web/src/hooks`.** Keep components presentational and hooks stateful.
- **Every new feature ships with at least one Playwright test** in `e2e/`.

## 3D rules

Ember's room is a 3D social space (three + @react-three/fiber + drei). Scene
code lives in `apps/web/src/scene`, characters in `apps/web/src/characters`,
interactions in `apps/web/src/interactions`, client state in
`apps/web/src/stores`. 3D contracts (avatar, seat, interaction) live in
`packages/shared`.

- **Style:** low-poly / chibi. **CC0 assets only** — every asset is logged in
  `apps/web/public/assets/LICENSES.md` with its source and license before use.
- **YouTube is a DOM `<iframe>`** aligned to the 3D screen anchor. Never use
  video textures.
- **2D overlay UI** (chat input, queue, settings) stays as regular DOM on top of
  the canvas — do not rebuild it in 3D.
- **Interactions require a server-side cooldown** (see `INTERACTION_COOLDOWNS` in
  `packages/shared/src/interaction.ts`); users can opt out of being targeted.
- **Performance:** target 60fps on desktop; provide a **"lite mode"** for
  low-end / mobile devices.
- **Max 12 users per room** (`MAX_ROOM_USERS` in `packages/shared/src/room.ts`).
- The Canvas is **client-only** — always load it with `next/dynamic` and
  `ssr: false`.
- **Build order (one step at a time, never all at once):**
  1. Static 3D room + synced YouTube
  2. Avatars seated + chat bubbles
  3. Door entrance animation
  4. Character creator
  5. Throw / emotes
