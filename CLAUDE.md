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
│   └── src/{app,features/room,effects,hooks,lib}
├── apps/server/           Node + TypeScript + Socket.io (GET /health)
│   └── src/{index.ts,config.ts,rooms/,palette/}
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
- **Room UI lives in `apps/web/src/features/room`; effects in
  `apps/web/src/effects`; socket/player logic in `apps/web/src/hooks`.** Keep
  components presentational and hooks stateful.
- **Every new feature ships with at least one Playwright test** in `e2e/`.

## 2D room & motion rules

Ember is a 2D listening room (no 3D, no characters). Listeners are icon avatars
(emoji/initials). Realism over cartoon: natural light, physical easing, no bounce.

- **Dark room per DESIGN.md.** The only light sources are the player (track
  palette color) and the single warm **ember** accent (`--color-ember`). No
  saturated CTA colors; keep DESIGN.md tokens as the source of truth.
- **Palette:** on `queue:add` the server extracts the thumbnail palette and sends
  it with the track; the client cross-fades palette colors (~1.5s) on change.
- **YouTube is a DOM `<iframe>`** (`hooks/useYouTubePlayer`). Never use video
  textures. Chat/queue/settings are 2D DOM overlays.
- **Animate only `transform`, `opacity`, `filter`** (and canvas/WebGL). Never
  animate layout properties. Shared springs/easings live in `lib/motion.ts`
  (heavy, well-damped; ease-out entrances, faster ease-in exits).
- **Quality tiers** (`effects/quality`): `QualityProvider` exposes `tier` + a
  feature-flag object (`QualityFlags`). Auto-detect, auto-downgrade on sustained
  low FPS (never auto-upgrade in a session, one-time toast), manual ⚙ setting
  saved to localStorage. **Define all flags; part 2 plugs new effects in.**
- **`prefers-reduced-motion` → fades only** (no drift, grain off), regardless of
  tier. **Hidden tab → pause loops.** Target 60fps desktop; low tier drops WebGL.
- **Max 12 users per room** (`MAX_ROOM_USERS` in `packages/shared/src/room.ts`).
- **Build order (one step at a time):**
  1. 2D room foundation: layout, palette, quality tiers, states (this part)
  2. Particles, burn transition, live cursors, micro-interactions (plug into the
     quality flags: `embersCount`, `burnTransition`, `liveCursors`, `tiltMagnetic`)
