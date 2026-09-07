# Sugar Shuffle Infinity

Pizza Tower–style candy platformer. **Cuboe** and **Cubro** sprint five floors inside a giant pumpkin to save Halloween from the Candy Warlock.

This repo is the full game: Phaser 3 arcade playfield, React HUD, local saves. No accounts and no database required.

---

## Requirements

| Tool | Version | Why |
| --- | --- | --- |
| **Node.js** | **20.11+** (22 LTS is what we develop on) | Vite 8, TanStack Start, Phaser 3 |
| **npm** | 10+ (comes with Node) | Install and scripts |
| **Git** | any recent | Clone the repo |
| A **Chromium** browser | current Chrome, Edge, or Brave | Phaser + Web Audio |

Optional: **Docker Desktop** (Windows / macOS) or Docker Engine (Linux) if you would rather not install Node.

Check versions:

```bash
node -v    # v20.11.0 or newer
npm -v
```

If `node` is missing, install it first (pick your OS below).

---

## Quick start (any desktop)

```bash
git clone https://github.com/stnickav8r-ops/sugar-shuffle-infinity.git
cd sugar-shuffle-infinity
cp .env.example .env
npm install
npm run dev
```

Then open **http://localhost:8080**

The first `npm install` takes a minute. After that, `npm run dev` is the everyday command. Leave that terminal running while you play; Ctrl+C stops the server.

Copying `.env.example` → `.env` turns **auth off**. The game does not use sign-in. If you skip this step it still usually boots, but you may see harmless auth warnings.

---

## Windows

### Option A — native (PowerShell)

1. Install **[Node.js LTS](https://nodejs.org)** (the `.msi`). Tick “Add to PATH”.
2. Install **[Git for Windows](https://git-scm.com/download/win)**.
3. Open **PowerShell**:

```powershell
git clone https://github.com/stnickav8r-ops/sugar-shuffle-infinity.git
cd sugar-shuffle-infinity
copy .env.example .env
npm install
npm run dev
```

4. Browser: http://localhost:8080

Port **8080** is required (`strictPort`). If Windows says the port is in use, close the other app or reboot, then run `npm run dev` again.

### Option B — WSL2 (closest to how this repo is built)

In Ubuntu on WSL:

```bash
sudo apt update
sudo apt install -y git
# Node via nvm: https://github.com/nvm-sh/nvm
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 22
cd ~
git clone https://github.com/stnickav8r-ops/sugar-shuffle-infinity.git
cd sugar-shuffle-infinity
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:8080 from Windows Chrome (WSL forwards the port).

---

## macOS

```bash
# Node via Homebrew (https://brew.sh)
brew install node git

git clone https://github.com/stnickav8r-ops/sugar-shuffle-infinity.git
cd sugar-shuffle-infinity
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:8080

Apple Silicon and Intel are both fine. If `brew` is not installed, the Node.js LTS `.pkg` from [nodejs.org](https://nodejs.org) works too.

---

## Linux

Debian / Ubuntu:

```bash
sudo apt update
sudo apt install -y git
# Node 22 from NodeSource, or use nvm
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

git clone https://github.com/stnickav8r-ops/sugar-shuffle-infinity.git
cd sugar-shuffle-infinity
cp .env.example .env
npm install
npm run dev
```

Fedora: `sudo dnf install git nodejs`. Arch: `sudo pacman -S git nodejs npm`.

Open http://localhost:8080. The dev server binds `0.0.0.0:8080`, so phones on the same LAN can use `http://<your-lan-ip>:8080`.

---

## Docker (any OS with Docker)

From the repo root:

```bash
docker build -t sugar-shuffle-infinity .
docker run --rm -p 8080:8080 sugar-shuffle-infinity
```

Then http://localhost:8080

This image runs the **dev server** so it matches local play. Rebuild after you pull new commits.

---

## Production build

```bash
npm run build
npm run preview
```

- `build` compiles the TanStack Start / Vite app. It also runs `db:migrate`, which **no-ops** when `DATABASE_URL` is unset (correct for this game).
- `preview` serves the production bundle at **http://127.0.0.1:8081**

Other useful scripts:

| Command | What it does |
| --- | --- |
| `npm run dev` | Hot-reload play server on port **8080** |
| `npm run build` | Production compile |
| `npm run preview` | Serve the production build on **8081** |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Scaffold unit tests (not the Phaser playfield) |

---

## Deploy

The Vite config uses the **Nitro `vercel` preset**. Vercel is the path of least resistance. Other static hosts (GitHub Pages, itch.io upload, Netlify drag-and-drop) will **not** work as a folder of HTML files — this is a Node/Nitro app, not a pure static export.

### Vercel (recommended)

1. Push this repo to GitHub (already: `stnickav8r-ops/sugar-shuffle-infinity`).
2. [vercel.com](https://vercel.com) → **Add New Project** → import that repo.
3. Framework: Vite. Build command `npm run build`. Output: leave default.
4. Environment: **do not** set `DATABASE_URL`. Optionally set `VITE_AUTH_ENABLED=false`.
5. Deploy. Play on the `*.vercel.app` URL.

CLI from this folder:

```bash
npx vercel
```

### A VPS / Node host (Railway, Render, Fly.io, a Linux box)

This preset is Vercel-shaped, so a generic Node host is a second-class option:

```bash
npm ci
npm run build
npm run preview
```

Put a reverse proxy (Caddy / nginx) in front of port **8081**, or change the process manager to keep `npm run preview` alive. For a first public URL, use Vercel.

### itch.io / Steam / “just a zip of HTML”

Not supported as a static upload. Host on Vercel and paste that URL into an itch.io **embedded site** (HTML5, “This file will be played in the browser”, external URL). Saves stay in the player’s browser `localStorage`.

### GitHub Pages

Not supported. Pages only serves static files; this app’s production server is Nitro.

---

## Controls

| Action | Keys | Touch |
| --- | --- | --- |
| Move | A / D or arrows | on-screen stick |
| Jump | Space, K, or Z | jump button |
| Attack | J | attack button |
| Run / mach | Shift or L | run button |
| Special | Q or C | special button |
| Enter doors / talk | W or Up | up button |
| Pause | Esc or P | — |

Reach the **exit door** to start **Sugar Time**, then race back to the start. Rank is P / S / A / B / C / D / F from score, damage, and secrets.

**Cuboe** (easy, 6 lives): shield, Aeraste stomp. **Cubro** (mild, 9 lives): faster mach, bounce, Super Saiyan Burst.

---

## Worlds in this build

| Floor | Rooms | Boss |
| --- | --- | --- |
| 1 Candy Corn Valley | Valley, Marsh Mellow Mash, Lolly Pop Forest, Butter Scotch Mountain | **Choco Man** (Hadoken, Shoryuken, Tatsumaki, jump-in) |
| 2 Sugar Rush Desert | Desert, Cookie War Farm, Sour Showdown, Butter Scotch Dune | Marshmallow Outlaw |
| 3 Raisin Ruins | Ruins, Smash City, Drunk Saloon, Scotch T.V. | Fake Candy Cubro |
| 4 Licorice Landfill | Landfill, Cube Factory, Sloppy Lab, Music Box | Fake Candy Cuboe |
| 5 Ruin Pizza Plex | Plex, Time Bomb Rush, … | Candy Warlock |

Progress, candy bux, combos, lore, promo codes, and endings live in **browser `localStorage`** under `sugar-shuffle-infinity-v1`. Clearing site data wipes the save. There is no cloud save.

---

## Project map

| Path | What lives there |
| --- | --- |
| `src/game/scenes/PlayScene.ts` | Movement, combat, bosses, HUD hooks |
| `src/game/data/levels.ts` | ASCII room maps, hubs, backgrounds |
| `src/game/data/world.ts` | Heroes, floors, bosses, lore, codes, endings |
| `src/game/phaserGame.ts` | Phaser boot + HMR |
| `src/components/game-app.tsx` | Title, menus, minigames, overlay HUD |
| `src/components/touch-pad.tsx` | Mobile controls |
| `public/game/sprites/` | Runtime sprite sheets |
| `public/game/bg/` | Named room backdrops |
| `assets/sprites/` | Source frames / pipeline dumps (not loaded at runtime) |
| `attachments/` | Original storyboard stills |

Stack: **TanStack Start + React 19 + Vite 8 + Tailwind v4 + Phaser 3.90**. Auth/DB scaffolding under `src/lib/auth` and `src/lib/db` is unused by the game. Leave `DATABASE_URL` unset.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Port 8080 is already in use` | Stop the other process using 8080. The dev script will not pick another port. |
| Blank page / “Couldn’t load that room” | Hard-refresh. If you pulled new art, restart `npm run dev`. |
| `npm install` fails on Windows with `EPERM` | Close editors locking `node_modules`, delete that folder, retry. |
| Audio silent | Click the page once; browsers block Web Audio until a gesture. |
| Save missing after a new clone | Saves are per-origin. `localhost:8080` and a Vercel URL do not share saves. |
| Auth / Postgres errors on a fresh clone | You skipped `.env`. Copy `.env.example` to `.env` so `VITE_AUTH_ENABLED=false`. |
| Type errors after a pull | `npm install` then `npm run typecheck`. |

Need Node on a machine that only has Python/Java? Use the **Docker** path above.

---

## Continue later

- **This GitHub repo** is the source of truth. `git pull` on any of the machines above.
- Zip the folder **without** `node_modules`, then `npm install` on the next computer.
- Grok Build: reopen the chat that made this app, or start a new Build session and point it at this repo.
