# Asset licenses

This file is the single source of truth for the source and license of **every**
3D asset shipped in `apps/web/public/assets/`. Ember uses **CC0 / public-domain
assets only** (see the 3D rules in `CLAUDE.md`).

## Status

**No assets have been downloaded yet.** The section below is a researched
candidate list only. When an asset is added, move it into a "Shipped assets"
table with: file path, pack name, author, exact source URL, license, and the
license URL.

### Shipped assets

_(none yet)_

| File | Pack | Author | Source URL | License |
| ---- | ---- | ------ | ---------- | ------- |

---

## Candidate packs (research only — verify each file's license before shipping)

Ranked best → weakest for **modular chibi characters** with the animations we
need (walk, sit, wave, clap, dance, throw, hit). Claims are from the packs'
public pages; items that could not be confirmed from the page are marked
_unverified_ and must be checked by inspecting the files.

### 1. Quaternius — best fit (truly modular, shared universal rig + CC0 anim library)

Site: https://quaternius.com · All pages below state CC0
(https://creativecommons.org/publicdomain/zero/1.0/).

- **Universal Base Characters** — https://quaternius.com/packs/universalbasecharacters.html
  - License: **CC0** · Formats: FBX, OBJ, Blend, **glTF**
  - Modular: **partial/yes** — 6 base models (M/F), 20 mix-and-match hairstyles, customizable eye/skin color. Humanoid rig, retargetable; "Compatible with the Universal Animation Library."
- **Modular Character Outfits – Fantasy** — https://quaternius.com/packs/modularcharacteroutfitsfantasy.html
  - License: **CC0** · Formats: FBX, OBJ, Blend, **glTF**
  - Modular: **yes** — 12 outfits / **62 separate modular parts**; attaches to Universal Base Characters; shares the universal rig.
- **Universal Animation Library** — https://quaternius.com/packs/universalanimationlibrary.html
  - License: **CC0** · Formats: FBX, **GLB**, Blend
  - Animations: 120+ on one shared humanoid rig. Confirmed: **walk ✓, sit ✓**. wave/clap/dance likely within "emotes" — _unverified_; throw/hit _unverified_ (check their on-site Animation Viewer).
- **Universal Animation Library 2** — https://quaternius.com/packs/universalanimationlibrary2.html
  - License: **CC0** · Formats: FBX, **GLB**, Blend
  - Animations: 130+ combat/parkour/etc.; hits split into separate impact+recovery clips → **hit ✓**. walk/sit/wave/clap/dance not enumerated.

### 2. KayKit (Kay Lousberg) — CC0, glTF, shared skeleton; partial modularity

All pages state: "Free for personal and commercial use, no attribution required. (CC0 Licensed)."

- **Character Pack: Adventurers** — https://kaylousberg.itch.io/kaykit-adventurers
  - License: **CC0** · Formats: FBX, **GLTF**
  - Modular: **partial** — removable helmet/visor/hood + 25+ handheld accessory attachment points (not full body-part swap). Shares the KayKit skeleton.
- **Character Animations** (the shared library) — https://kaylousberg.itch.io/kaykit-character-animations
  - License: **CC0** · Formats: FBX, **GLTF**
  - Animations: Rig_Medium 150+. Confirmed: **walk ✓, sit ✓, wave ✓, hit ✓**. _Gaps on current page: clap, dance, throw._
  - Legacy animations pack (also CC0) explicitly lists **Dance, Throw, Wave, Cheer, Pick up**: https://kaylousberg.itch.io/kaykit-animations
- **Character Pack: Skeletons** — https://kaylousberg.itch.io/kaykit-skeletons
  - License: **CC0** · Formats: FBX, GLTF · basic movement anims; compatible with Character Animations.

### 3. Kenney — CC0 and ideal chibi/blocky look; file specs unverified from pages

Site: https://kenney.nl · pages show a "Creative Commons CC0" label but do not
enumerate formats/animations/modularity in page text (_inspect files to confirm_).

- **Mini Characters** — https://kenney.nl/assets/mini-characters — **CC0**, "Animation" badge, 25 files. Formats/modularity/skeleton _unverified_.
- **Blocky Characters** — https://kenney.nl/assets/blocky-characters — **CC0**, "Animation" badge, 20 files. Formats/modularity/skeleton _unverified_.

### Animation-coverage note

- **walk, sit, wave, hit** are each confirmed on at least one Quaternius and/or KayKit page.
- **dance, throw** are confirmed in KayKit's **legacy** Character Animations pack; plausibly in Quaternius "emotes" (_unverified_).
- **clap** is not confirmed on any page — plan a custom/substitute clip.

## Sources to AVOID (not CC0)

- **Mixamo (Adobe)** — free but Adobe-licensed, **not CC0**; cannot be redistributed as public-domain.
- **Sketchfab** — mixed per-model licenses (many CC-BY); filter to CC0 per model.
- **Poly Pizza / Google Poly archive** — aggregator, many CC-BY; check each model.
- **Unity Asset Store / Unreal Marketplace** — proprietary store EULAs.
- **Ready Player Me, VRoid/VRM** — platform licenses, not CC0.
