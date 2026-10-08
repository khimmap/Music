# Asset licenses

This file logs the source and license of every binary asset shipped in
`apps/web/public/assets/`.

## Status

**No bundled binary assets.** Ember is a 2D listening room:

- Listeners are **icon avatars** (emoji + initials), rendered with CSS — no
  images.
- Track color comes from the YouTube thumbnail **palette**, extracted
  server-side at runtime (not stored) via `node-vibrant`.
- The ambient background and film grain are generated (WebGL shader / inline
  SVG noise) — no asset files.

The 3D low-poly furniture (Kenney Furniture Kit, CC0) used by the earlier 3D
prototype was removed in the 2D pivot.

### Shipped assets

_(none)_

| File | Source | License |
| ---- | ------ | ------- |
