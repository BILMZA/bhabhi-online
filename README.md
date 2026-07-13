# Bhabhi Online

A real-time multiplayer implementation of **Bhabhi** (also known as "Thulla"), a classic South Asian card-shedding game, playable in the browser on desktop and mobile.

**Live app:** https://web-production-52c8c.up.railway.app

---

## Tech Stack

**Frontend** (`apps/web`)
- Next.js 16.2.10 (App Router, Turbopack)
- React 19
- TypeScript
- Tailwind CSS 4
- socket.io-client 4.8.1

**Backend** (`server`)
- Node.js + Express
- Socket.IO 4.8.1
- TypeScript

**Package management**
- pnpm monorepo

**Deployment**
- Railway (two services: `web` and `bhabhi-online-server`, deployed from the same GitHub repo)

---

## Project Structure

```
bhabhi-online/
├── apps/
│   └── web/                  # Next.js frontend
│       ├── app/               # App Router pages
│       ├── components/        # UI components (GameScreen, LobbyView, LobbyApp, etc.)
│       ├── hooks/
│       │   └── useSocket.ts   # Central socket connection + game state hook
│       └── lib/
│           └── socket.ts      # Socket.IO client instance setup
├── server/
│   └── src/
│       ├── index.ts           # Entry point — creates HTTP server, starts Socket.IO
│       ├── config/
│       │   └── env.ts         # Reads PORT and NODE_ENV from environment
│       ├── socket/
│       │   └── index.ts       # All socket event handlers (rooms, game actions)
│       └── services/
│           ├── RoomManager.ts # Lobby/room creation and membership
│           └── GameManager.ts # Core game rules, turn logic, thulla detection
```

---

## Running Locally

### Prerequisites
- Node.js 20+
- pnpm

### 1. Install dependencies
```bash
pnpm install
```

### 2. Start the backend
```bash
cd server
npm run dev
```
Runs on `http://localhost:3001` by default (or the `PORT` env var if set).

### 3. Start the frontend
```bash
cd apps/web
npm run dev
```
Runs on `http://localhost:3000`.

### 4. Environment variables

**`apps/web/.env.local`**
```
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

For testing on a physical phone over LAN, set this to your machine's LAN IP instead of `localhost` (e.g. `http://192.168.x.x:3001`), and make sure `next.config.ts` includes that IP under `experimental.allowedDevOrigins` — otherwise Next.js's dev server will silently block cross-origin requests from the phone.

**`server/.env`** (optional — defaults to `3001` if unset)
```
PORT=3001
```

---

## How to Play

Standard Bhabhi/Thulla rules:
- Deal all cards evenly among 2–5 players.
- The player holding the Ace of Spades leads the first trick.
- Each player must follow the led suit if they have a card of that suit in hand.
- If a player **cannot** follow suit, they must throw any other card — this triggers a **Thulla**. The player who led the trick picks up all cards played so far in that trick, plus the off-suit card, into their hand.
- The last player left holding cards when everyone else has emptied their hand is the "Bhabhi" (loser).

### The Thulla button
When a thulla is triggered, an amber **"Thulla!"** button appears for **all players**, but is only clickable by the player who broke suit, and only for a 5-second window. Clicking it plays a sound audible to everyone in the room. This is a custom UX addition on top of the standard rules — purely for fun/timing pressure, not a rules mechanic.

---

## Deployment (Railway)

The app is deployed as two separate Railway services from the same GitHub repo:

| Service | Root Directory | Build Command | Start Command |
|---|---|---|---|
| `web` (frontend) | `apps/web` | `npm run build` | `npm run start` |
| `bhabhi-online-server` (backend) | `server` | `npm run build` | `npm run start` |

**Required environment variable on the `web` service:**
```
NEXT_PUBLIC_SOCKET_URL=<public URL of the bhabhi-online-server Railway service>
```

Railway auto-generates a public domain per service (Settings → Networking → Generate Domain). Both services redeploy automatically on every push to `main`.

Vercel was intentionally avoided for the backend since Vercel's serverless functions don't support the long-lived WebSocket connections Socket.IO requires; Railway supports persistent Node processes for both services in one dashboard.

---

## Known Notes / Gotchas

- The frontend's `next start` script is pinned to Railway's dynamic port via `next start -p $PORT`.
- `apps/web/package-lock.json` must stay in sync with `package.json` — Railway's build uses `npm ci`, which fails hard on any drift (fixed once during initial deployment by re-running `npm install` locally and committing the updated lockfile).
- All `socket.emit(...)` calls in `useSocket.ts` guard against `socket` being `null`, since `getSocket()` can fail and return `null` in edge cases (e.g. server-side rendering, connection errors).

---

## License

Private project — not currently licensed for reuse.
