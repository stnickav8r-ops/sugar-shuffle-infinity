# Sugar Shuffle Infinity

Pizza Tower–style candy platformer. Cuboe and Cubro run five floors inside a giant pumpkin.

## Continue later

This folder is the full game source. You do **not** need `node_modules` in the zip — install fresh.

```bash
npm install
npm run dev
```

Then open the URL the dev script prints. `npm run build` makes the production (Vercel) build.

## Stack

- TanStack Start + React 19 + Tailwind v4
- Phaser 3 arcade platformer (`src/game/`)
- Saves in `localStorage` (`sugar-shuffle-infinity-v1`)
- No accounts / no database

## Where to edit

| Area | Path |
| --- | --- |
| Levels, hubs, Sugar Time maps | `src/game/data/levels.ts` |
| Heroes, bosses, lore, codes, endings | `src/game/data/world.ts` |
| Movement, combat, bosses | `src/game/scenes/PlayScene.ts` |
| Title / HUD / minigames | `src/components/game-app.tsx` |
| Sprites and backgrounds | `public/game/` |

## Controls

A/D move · Space jump · J attack · Shift run · Q/C special · W/Up enter doors

Reach the exit door to start **Sugar Time**, then race back to the start.

## Coming back in Grok

Reopen the same Grok chat that built this app and keep prompting. Or upload this zip into a new Grok Build session and say “continue Sugar Shuffle Infinity.”
