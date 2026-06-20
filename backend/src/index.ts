import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import gameRoutes from './routes/gameRoutes';
import botRoutes from './routes/botRoutes';
import { setupTelegramBot } from './bot/setup';
import { prisma } from './lib/prisma';
import { seedDatabase } from './seed';
import { cleanupDemoLeaderboardEntries } from './services/leaderboardCleanup';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

app.use(helmet({ contentSecurityPolicy: false }));

const allowedOrigins = process.env.FRONTEND_URL?.split(',').map((s) => s.trim()).filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins?.length ? allowedOrigins : true,
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'X-Telegram-Init-Data',
      'X-Dev-Telegram-Id',
      'X-Start-Param',
    ],
  })
);
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', game: 'Civilization Idle' });
});

app.use('/api', gameRoutes);
app.use('/api/bot', botRoutes);

async function main() {
  await prisma.$connect();
  await cleanupDemoLeaderboardEntries();
  await seedDatabase();
  await setupTelegramBot();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Civilization Idle API running on port ${PORT}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
