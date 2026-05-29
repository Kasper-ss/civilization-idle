import { prisma } from './lib/prisma';
import { createInitialBuildings, createInitialResearches, createInitialResources, recalculateProduction } from './services/gameEngine';

export async function seedDatabase(): Promise<void> {
  // Demo leaderboard bots only for local dev when explicitly enabled.
  if (process.env.SEED_DEMO_LEADERBOARD !== 'true') return;

  const count = await prisma.leaderboardSnapshot.count();
  if (count > 0) return;

  const demoUsers = [
    { telegramId: 111111111n, username: 'caesar', firstName: 'Julius', score: 50000 },
    { telegramId: 222222222n, username: 'cleopatra', firstName: 'Cleopatra', score: 45000 },
    { telegramId: 333333333n, username: 'alexander', firstName: 'Alexander', score: 40000 },
    { telegramId: 444444444n, username: 'genghis', firstName: 'Genghis', score: 35000 },
    { telegramId: 555555555n, username: 'napoleon', firstName: 'Napoleon', score: 30000 },
  ];

  for (let i = 0; i < demoUsers.length; i++) {
    const d = demoUsers[i];
    const buildings = createInitialBuildings();
    buildings.farm = { level: 5 + i };
    buildings.lumberMill = { level: 4 + i };
    const researches = createInitialResearches();
    researches.agriculture = { level: 3 + i };

    let resources = createInitialResources();
    for (const key of Object.keys(resources)) {
      const r = resources[key as keyof typeof resources];
      if (r) r.currentAmount = 1000 * (i + 1);
    }

    resources = recalculateProduction(
      {
        era: Math.min(i + 2, 7),
        buildings,
        researches,
        wondersBuilt: i > 2 ? ['pyramid'] : [],
        territories: i > 1 ? ['forest'] : [],
        eraProductionBonus: i * 0.05,
        scienceBonus: 0,
        vipTier: i === 0 ? 'gold' : null,
        productionMultiplier: 1,
        boostExpiresAt: null,
      },
      resources
    );

    const user = await prisma.user.upsert({
      where: { telegramId: d.telegramId },
      create: {
        telegramId: d.telegramId,
        username: d.username,
        firstName: d.firstName,
        civilizationName: `${d.firstName}'s Empire`,
        gameState: {
          create: {
            era: Math.min(i + 2, 7),
            totalXP: 5000 * (i + 1),
            population: 500 * (i + 1),
            gems: 100 * i,
            resources: resources as object,
            buildings: buildings as object,
            researches: researches as object,
            wondersBuilt: i > 2 ? ['pyramid'] : [],
            civilizationScore: d.score,
            vipTier: i === 0 ? 'gold' : null,
          },
        },
      },
      update: {},
      include: { gameState: true },
    });

    if (user.gameState) {
      await prisma.leaderboardSnapshot.create({
        data: {
          userId: user.id,
          telegramId: d.telegramId,
          username: d.username,
          score: d.score,
          era: user.gameState.era,
          level: Math.floor(Math.sqrt(user.gameState.totalXP / 100)) + 1,
          wonders: i > 2 ? 1 : 0,
        },
      });
    }
  }

  console.log('Seed: demo leaderboard users created');
}
