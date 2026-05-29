import { prisma } from '../lib/prisma';
import {
  DEMO_LEADERBOARD_TELEGRAM_IDS,
  DEMO_LEADERBOARD_USERNAMES,
} from './leaderboardEligibility';

/** Remove demo bots from leaderboard snapshots (runs on every API start). */
export async function cleanupDemoLeaderboardEntries(): Promise<void> {
  const result = await prisma.leaderboardSnapshot.deleteMany({
    where: {
      OR: [
        { telegramId: { in: [...DEMO_LEADERBOARD_TELEGRAM_IDS] } },
        { username: { in: [...DEMO_LEADERBOARD_USERNAMES], mode: 'insensitive' } },
      ],
    },
  });

  if (result.count > 0) {
    console.log(`Leaderboard: removed ${result.count} demo snapshot(s)`);
  }
}
