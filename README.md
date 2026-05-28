# Civilization Idle — Telegram Mini App

Idle civilization game for Telegram. Develop your tribe from the Stone Age to a interplanetary empire. Resources generate automatically, including while offline (up to 24 hours).

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, TypeScript, Vite, TailwindCSS, Zustand, @telegram-apps/sdk |
| Backend | Node.js, Express, Prisma |
| Database | PostgreSQL |
| Auth | Telegram WebApp InitData validation |
| Deploy | Docker, Docker Compose |

## Deploy to public URL (Vercel)

Step-by-step guide for beginners (Russian): **[DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)**

- **Vercel** — frontend (public game link)
- **Render** — backend API
- **Neon** — PostgreSQL database

## Quick Start (Docker)

```bash
# From project root
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Game (frontend) | http://localhost:5173 |
| API | http://localhost:3001/api |
| Health check | http://localhost:3001/health |

Open http://localhost:5173 in a browser. Without Telegram, the app runs in **dev mode** with a test user (`X-Dev-Telegram-Id: 123456789`).

## Local Development (without Docker)

### Prerequisites

- Node.js 20+
- PostgreSQL 16+

### Database

```bash
createdb civilization_idle
# Or use Docker only for Postgres:
docker run -d --name cividle-db -e POSTGRES_USER=cividle -e POSTGRES_PASSWORD=cividle_secret -e POSTGRES_DB=civilization_idle -p 5432:5432 postgres:16-alpine
```

### Backend

```bash
cd backend
cp ../.env.example .env
# Edit DATABASE_URL and BOT_TOKEN

npm install
npx prisma migrate deploy
npm run dev
```

API runs at http://localhost:3001

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at http://localhost:5173 (API proxied to :3001)

## Telegram Bot Setup

1. Open [@BotFather](https://t.me/BotFather) → `/newbot` → save the **bot token**.
2. `/newapp` → select your bot → set app title **Civilization Idle**.
3. Set the Web App URL to your hosted frontend (e.g. `https://your-domain.com`).
4. Optional: `/setdomain` for the bot domain.
5. Copy token to `.env`:

```env
BOT_TOKEN=123456:ABC-DEF...
BOT_USERNAME=YourBotUsername
```

### Mini App in Telegram

1. Deploy frontend + backend with HTTPS (required by Telegram).
2. Point the Mini App URL to your frontend.
3. Users open the game via bot menu or `https://t.me/YourBotUsername/app`.

### Referral Links

Referrals use `startapp=ref_{telegramId}`. The backend links new users to referrers and grants rewards.

## Telegram Stars (Monetization)

Stars payments use the [Telegram Bot Payments API](https://core.telegram.org/bots/payments):

1. Enable payments in BotFather for your bot.
2. Create invoice links for shop products (Gems, VIP, Battle Pass, boosters).
3. In production, replace the demo `purchase` handler with `WebApp.openInvoice()` and a backend webhook to verify `successful_payment`.

Current demo: Shop purchases apply instantly for testing without real Stars.

### Product IDs (backend)

| ID | Description |
|----|-------------|
| `gems_100` | 100 Gems (100 Stars) |
| `gems_600` | 600 Gems (500 Stars) |
| `vip_bronze` | VIP Bronze 30 days |
| `vip_silver` | VIP Silver 30 days |
| `vip_gold` | VIP Gold 30 days |
| `boost_x2` | x2 production 24h |
| `battle_pass` | Premium Battle Pass |

## Game Features

- **8 Eras**: Stone → Bronze → Iron → Medieval → Renaissance → Industrial → Modern → Space
- **Era advancement**: Resources + buildings + research + population + wonders
- **Server-side ticks**: All resource math runs on the API
- **Offline income**: Up to 24h, collect modal on return
- **Buildings**: Exponential cost `base × 1.15^level`
- **Research**: +20% bonuses per level, cost × 1.25^level
- **Wonders**: 7 wonders, timed construction, unique bonuses
- **World map**: 4 territories with permanent bonuses
- **Leaderboard**: Top 100 by Civilization Score
- **Referrals**: Milestones at 5/10/25/50/100 friends
- **Shop**: Gems, VIP, boosters, wheel of fortune
- **Endgame**: Moon/Mars colonies, orbital city, starship (Space Age)

## Project Structure

```
/frontend/src
  /components   Header, ResourceCard, BuildingCard, ...
  /pages        Home, Buildings, Research, World, ...
  /store        gameStore.ts (Zustand)
  /services     api.ts

/backend/src
  /config       gameData.ts (eras, buildings, wonders)
  /services     gameEngine.ts, gameService.ts
  /controllers  gameController.ts
  /routes       gameRoutes.ts
  /middleware   telegramAuth.ts

/backend/prisma
  schema.prisma
  /migrations
  seed (via src/seed.ts on startup)
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/config` | Game definitions |
| GET | `/api/leaderboard` | Top 100 |
| POST | `/api/auth` | Login / create user |
| GET | `/api/state/:userId` | Current game state |
| POST | `/api/offline/:userId/collect` | Collect offline income |
| POST | `/api/build/:userId` | Upgrade building |
| POST | `/api/research/:userId` | Upgrade research |
| POST | `/api/era/:userId/advance` | Advance era |
| POST | `/api/wonder/:userId/start` | Start wonder |
| POST | `/api/territory/:userId/unlock` | Unlock territory |
| POST | `/api/shop/:userId/purchase` | Shop purchase |
| POST | `/api/wheel/:userId/spin` | Wheel of fortune |
| GET | `/api/referrals/:userId` | Referral info |

All authenticated routes require header `X-Telegram-Init-Data` (or `X-Dev-Telegram-Id` in dev).

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BOT_TOKEN` | Telegram bot token |
| `BOT_USERNAME` | Bot username (referral links) |
| `JWT_SECRET` | Optional secret for future JWT use |
| `PORT` | API port (default 3001) |
| `VITE_API_URL` | Frontend API base (Docker: `/api`) |

## License

MIT
