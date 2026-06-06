import { Prisma } from '@prisma/client';
import {
  BUILDING_DEFS,
  ENDGAME_PROJECTS,
  ERA_REQUIREMENTS,
  ERAS,
  RESEARCH_DEFS,
  SHOP_PRODUCTS,
  TERRITORIES,
  WONDER_DEFS,
  type BuildingKey,
  type ResearchKey,
  type ResourceKey,
} from '../config/gameData';
import { prisma } from '../lib/prisma';
import type { GameStateDto, OfflineIncome, ResourcesMap } from '../types/game';
import type { TelegramUser } from '../middleware/telegramAuth';
import {
  DEMO_LEADERBOARD_TELEGRAM_IDS,
  DEMO_LEADERBOARD_USERNAMES,
  isDemoLeaderboardAccount,
  isLeaderboardEligible,
} from './leaderboardEligibility';
import {
  addToTotalProduced,
  applyTickWithGains,
  buildingCost,
  manualClickGather,
  calculateCivilizationScore,
  calculateOfflineIncome,
  canAfford,
  checkEraRequirements,
  collectOfflineIncome,
  completeWonderIfReady,
  createInitialBuildings,
  createInitialResearches,
  createInitialResources,
  deductCost,
  isBuildingUnlocked,
  isResearchUnlocked,
  playerLevel,
  recalculateProduction,
  researchCost,
} from './gameEngine';

type DbGameState = {
  id: string;
  userId: string;
  era: number;
  totalXP: number;
  population: number;
  gems: number;
  resources: unknown;
  buildings: unknown;
  researches: unknown;
  wondersBuilt: unknown;
  activeWonder: unknown;
  territories: unknown;
  endgameProjects: unknown;
  vipTier: string | null;
  vipExpiresAt: Date | null;
  productionMultiplier: number;
  boostExpiresAt: Date | null;
  eraProductionBonus: number;
  scienceBonus: number;
  civilizationScore: number;
  totalResourcesProduced: unknown;
  autoGatherEnabled: boolean;
  autoGatherExpiresAt: Date | null;
  lastTickAt: Date;
  lastOfflineCollect: Date | null;
  dailySpinUsedAt: Date | null;
  referralCount: number;
  daysPlayed: number;
  firstPlayDate: Date;
  title: string | null;
  battlePass: unknown;
  cosmetics: unknown;
};

function parseJson<T>(val: unknown, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  return val as T;
}

async function syncLeaderboard(
  userId: string,
  telegramId: bigint,
  username: string | null,
  firstName: string | null,
  gs: DbGameState
) {
  if (
    isDemoLeaderboardAccount(telegramId, username) ||
    !isLeaderboardEligible(gs, telegramId, { firstName, username })
  ) {
    await prisma.leaderboardSnapshot.deleteMany({ where: { userId } });
    return;
  }

  const wonders = parseJson<string[]>(gs.wondersBuilt, []);
  const score = gs.civilizationScore;
  const level = playerLevel(gs.totalXP);
  await prisma.leaderboardSnapshot.deleteMany({ where: { userId } });
  await prisma.leaderboardSnapshot.create({
    data: {
      userId,
      telegramId,
      username,
      score,
      era: gs.era,
      level,
      wonders: wonders.length,
    },
  });
}

/** Recalculate score and push player into leaderboard after any progress change. */
export async function syncLeaderboardFromDb(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { gameState: true },
  });
  if (!user?.gameState) return;

  let gs = user.gameState as unknown as DbGameState;
  gs = await tickGameState(gs);

  await prisma.gameState.update({
    where: { id: gs.id },
    data: {
      resources: gs.resources as Prisma.InputJsonValue,
      population: gs.population,
      civilizationScore: gs.civilizationScore,
      lastTickAt: gs.lastTickAt,
    },
  });

  await syncLeaderboard(user.id, user.telegramId, user.username, user.firstName, gs);
}

export interface LeaderboardEntryDto {
  rank: number;
  userId: string;
  username: string | null;
  civilizationName: string;
  score: number;
  era: number;
  eraKey: string;
  level: number;
  wonders: number;
  telegramId: string;
}

export const AUTO_GATHER_DURATIONS = [4, 8, 12] as const;
export type AutoGatherHours = (typeof AUTO_GATHER_DURATIONS)[number] | 0;

function resolveAutoGather(gs: DbGameState): DbGameState {
  if (!gs.autoGatherEnabled) return gs;
  if (!gs.autoGatherExpiresAt) return gs;
  if (gs.autoGatherExpiresAt.getTime() > Date.now()) return gs;
  return { ...gs, autoGatherEnabled: false, autoGatherExpiresAt: null };
}

async function tickGameState(gs: DbGameState): Promise<DbGameState> {
  gs = resolveAutoGather(gs);
  const now = new Date();
  const seconds = Math.max(0, (now.getTime() - gs.lastTickAt.getTime()) / 1000);
  if (seconds < 1) return gs;

  let resources = parseJson<ResourcesMap>(gs.resources, createInitialResources());
  const buildings = parseJson(gs.buildings, createInitialBuildings());
  const researches = parseJson(gs.researches, createInitialResearches());
  const wondersBuilt = parseJson<string[]>(gs.wondersBuilt, []);
  const territories = parseJson<string[]>(gs.territories, []);

  resources = recalculateProduction(
    {
      era: gs.era,
      buildings,
      researches,
      wondersBuilt,
      territories,
      eraProductionBonus: gs.eraProductionBonus,
      scienceBonus: gs.scienceBonus,
      vipTier: gs.vipTier,
      productionMultiplier: gs.productionMultiplier,
      boostExpiresAt: gs.boostExpiresAt,
    },
    resources
  );

  let totalProduced = parseJson<Partial<Record<ResourceKey, number>>>(gs.totalResourcesProduced, {});

  if (gs.autoGatherEnabled) {
    const { resources: ticked, gained } = applyTickWithGains(resources, seconds);
    resources = ticked;
    totalProduced = addToTotalProduced(totalProduced, gained);
  }

  gs.population = resources.population?.currentAmount ?? gs.population;

  const score = calculateCivilizationScore(resources, buildings, researches, gs.era, wondersBuilt);

  return {
    ...gs,
    resources,
    totalResourcesProduced: totalProduced,
    civilizationScore: score,
    lastTickAt: now,
  };
}

function toDto(
  user: { telegramId: bigint; username: string | null; firstName: string | null; photoUrl: string | null; civilizationName: string },
  gs: DbGameState,
  offlineIncome: OfflineIncome | null
): GameStateDto {
  const resources = parseJson<ResourcesMap>(gs.resources, createInitialResources());
  const buildings = parseJson(gs.buildings, createInitialBuildings());
  const researches = parseJson(gs.researches, createInitialResearches());
  const wondersBuilt = parseJson<string[]>(gs.wondersBuilt, []);
  const { canAdvance, progress } = checkEraRequirements(
    gs.era,
    resources,
    buildings,
    researches,
    gs.population,
    wondersBuilt
  );

  const today = new Date().toDateString();
  const spinDate = gs.dailySpinUsedAt?.toDateString();
  const dailySpinAvailable = spinDate !== today;

  const totalProduced = parseJson<Partial<Record<ResourceKey, number>>>(gs.totalResourcesProduced, {});

  return {
    era: gs.era,
    eraKey: ERAS[gs.era]?.key ?? 'stone',
    eraName: ERAS[gs.era]?.nameRu ?? ERAS[gs.era]?.name ?? 'Unknown',
    totalXP: gs.totalXP,
    level: playerLevel(gs.totalXP),
    population: gs.population,
    gems: gs.gems,
    resources,
    buildings,
    researches,
    wondersBuilt,
    activeWonder: parseJson(gs.activeWonder, null),
    territories: parseJson<string[]>(gs.territories, []),
    endgameProjects: parseJson(gs.endgameProjects, {}),
    vipTier: gs.vipTier,
    vipExpiresAt: gs.vipExpiresAt?.toISOString() ?? null,
    productionMultiplier: gs.productionMultiplier,
    boostExpiresAt: gs.boostExpiresAt?.toISOString() ?? null,
    eraProductionBonus: gs.eraProductionBonus,
    scienceBonus: gs.scienceBonus,
    civilizationScore: gs.civilizationScore,
    civilizationName: user.civilizationName,
    canAdvanceEra: canAdvance,
    eraProgress: progress,
    offlineIncome,
    user: {
      telegramId: user.telegramId.toString(),
      username: user.username,
      firstName: user.firstName,
      photoUrl: user.photoUrl,
    },
    referralCount: gs.referralCount,
    daysPlayed: gs.daysPlayed,
    title: gs.title,
    dailySpinAvailable,
    autoGatherEnabled: gs.autoGatherEnabled ?? false,
    autoGatherExpiresAt: gs.autoGatherExpiresAt?.toISOString() ?? null,
    totalResourcesProduced: totalProduced,
  };
}

const REFERRAL_BOOST_HOURS = 3;
const REFERRAL_BOOST_MULTIPLIER = 5;
const REFERRAL_GEMS = 50;

/** Parse start_param / startapp payload like ref_123456789. */
async function resolveReferrerId(
  startParam: string | undefined,
  newUserTelegramId: bigint
): Promise<string | undefined> {
  if (!startParam?.startsWith('ref_')) return undefined;

  const refTgId = startParam.slice(4).trim();
  if (!/^\d+$/.test(refTgId)) return undefined;

  try {
    const refTelegramId = BigInt(refTgId);
    if (refTelegramId === newUserTelegramId) return undefined;

    const referrer = await prisma.user.findUnique({
      where: { telegramId: refTelegramId },
    });
    return referrer?.id;
  } catch {
    return undefined;
  }
}

async function grantReferralReward(referrerId: string): Promise<void> {
  const referrerGs = await prisma.gameState.findUnique({ where: { userId: referrerId } });
  if (!referrerGs) return;

  const boostUntil = new Date(Date.now() + REFERRAL_BOOST_HOURS * 60 * 60 * 1000);
  const existingBoost = referrerGs.boostExpiresAt;
  const boostStillActive = existingBoost != null && existingBoost.getTime() > Date.now();
  const boostExpiresAt =
    boostStillActive && existingBoost.getTime() > boostUntil.getTime() ? existingBoost : boostUntil;
  const productionMultiplier = Math.max(referrerGs.productionMultiplier, REFERRAL_BOOST_MULTIPLIER);

  await prisma.gameState.update({
    where: { userId: referrerId },
    data: {
      referralCount: { increment: 1 },
      gems: { increment: REFERRAL_GEMS },
      productionMultiplier,
      boostExpiresAt,
    },
  });
}

export async function getOrCreateUser(tgUser: TelegramUser, startParam?: string) {
  const telegramId = BigInt(tgUser.id);
  let user = await prisma.user.findUnique({
    where: { telegramId },
    include: { gameState: true },
  });

  if (!user) {
    const referrerId = await resolveReferrerId(startParam, telegramId);

    const resources = createInitialResources();
    const buildings = createInitialBuildings();
    const researches = createInitialResearches();
    const prodResources = recalculateProduction({
      era: 0,
      buildings,
      researches,
      wondersBuilt: [],
      territories: [],
      eraProductionBonus: 0,
      scienceBonus: 0,
      vipTier: null,
      productionMultiplier: 1,
      boostExpiresAt: null,
    });

    user = await prisma.user.create({
      data: {
        telegramId,
        username: tgUser.username ?? null,
        firstName: tgUser.first_name ?? null,
        photoUrl: tgUser.photo_url ?? null,
        referrerId,
        gameState: {
          create: {
            era: 0,
            resources: prodResources as unknown as Prisma.InputJsonValue,
            buildings: buildings as unknown as Prisma.InputJsonValue,
            researches: researches as unknown as Prisma.InputJsonValue,
            population: 10,
          },
        },
      },
      include: { gameState: true },
    });

    if (referrerId) {
      await grantReferralReward(referrerId);
    }
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        username: tgUser.username ?? user.username,
        firstName: tgUser.first_name ?? user.firstName,
        photoUrl: tgUser.photo_url ?? user.photoUrl,
        lastSeenAt: new Date(),
      },
      include: { gameState: true },
    });
  }

  return user;
}

export async function fetchGameState(userId: string): Promise<GameStateDto | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { gameState: true },
  });
  if (!user?.gameState) return null;

  let gs = user.gameState as unknown as DbGameState;
  gs = await tickGameState(gs);

  let offlineIncome: OfflineIncome | null = null;
  const secondsSinceCollect = gs.lastOfflineCollect
    ? (Date.now() - gs.lastOfflineCollect.getTime()) / 1000
    : Infinity;

  if (gs.autoGatherEnabled && secondsSinceCollect > 60) {
    const resources = parseJson<ResourcesMap>(gs.resources, createInitialResources());
    const { income } = calculateOfflineIncome(resources, gs.lastTickAt, gs.lastOfflineCollect);
    const hasEarnings = Object.values(income.earned).some((v) => (v ?? 0) > 0);
    if (hasEarnings && income.secondsAway > 60) {
      offlineIncome = income;
    }
  }

  const activeWonder = parseJson(gs.activeWonder, null);
  const wonderCheck = completeWonderIfReady(activeWonder);
  if (wonderCheck.completed && wonderCheck.wonderId) {
    const wondersBuilt = parseJson<string[]>(gs.wondersBuilt, []);
    if (!wondersBuilt.includes(wonderCheck.wonderId)) {
      wondersBuilt.push(wonderCheck.wonderId);
      gs.totalXP += 500;
    }
    gs = { ...gs, wondersBuilt, activeWonder: null };
  }

  await prisma.gameState.update({
    where: { id: gs.id },
    data: {
      resources: gs.resources as Prisma.InputJsonValue,
      population: gs.population,
      civilizationScore: gs.civilizationScore,
      totalResourcesProduced: gs.totalResourcesProduced as Prisma.InputJsonValue,
      lastTickAt: gs.lastTickAt,
      wondersBuilt: gs.wondersBuilt as Prisma.InputJsonValue,
      activeWonder: gs.activeWonder as Prisma.InputJsonValue,
      totalXP: gs.totalXP,
      autoGatherEnabled: gs.autoGatherEnabled,
      autoGatherExpiresAt: gs.autoGatherExpiresAt,
    },
  });

  await syncLeaderboard(user.id, user.telegramId, user.username, user.firstName, gs);

  return toDto(user, gs, offlineIncome);
}

export async function manualGatherClick(userId: string, clicks = 1): Promise<GameStateDto | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { gameState: true } });
  if (!user?.gameState) return null;

  const safeClicks = Math.min(Math.max(1, Math.floor(clicks)), 100);

  let gs = user.gameState as unknown as DbGameState;
  gs = await tickGameState(gs);

  let resources = parseJson<ResourcesMap>(gs.resources, createInitialResources());
  const buildings = parseJson(gs.buildings, createInitialBuildings());
  let totalProduced = parseJson<Partial<Record<ResourceKey, number>>>(gs.totalResourcesProduced, {});

  for (let i = 0; i < safeClicks; i++) {
    const { resources: updated, gained } = manualClickGather(resources, buildings, gs.era);
    resources = updated;
    totalProduced = addToTotalProduced(totalProduced, gained);
  }

  const researches = parseJson(gs.researches, createInitialResearches());
  const wondersBuilt = parseJson<string[]>(gs.wondersBuilt, []);
  const civilizationScore = calculateCivilizationScore(
    resources,
    buildings,
    researches,
    gs.era,
    wondersBuilt
  );

  gs = {
    ...gs,
    resources,
    totalResourcesProduced: totalProduced,
    population: resources.population?.currentAmount ?? gs.population,
    civilizationScore,
    lastTickAt: new Date(),
  };

  await prisma.gameState.update({
    where: { id: gs.id },
    data: {
      resources: resources as unknown as Prisma.InputJsonValue,
      totalResourcesProduced: totalProduced as unknown as Prisma.InputJsonValue,
      population: gs.population,
      civilizationScore: gs.civilizationScore,
      lastTickAt: gs.lastTickAt,
    },
  });

  await syncLeaderboardFromDb(userId);

  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { gameState: true },
  });
  if (!updatedUser?.gameState) return null;
  return toDto(updatedUser, updatedUser.gameState as unknown as DbGameState, null);
}

export async function setAutoGather(userId: string, hours: AutoGatherHours): Promise<GameStateDto | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { gameState: true } });
  if (!user?.gameState) return null;

  const data =
    hours === 0
      ? { autoGatherEnabled: false, autoGatherExpiresAt: null }
      : {
          autoGatherEnabled: true,
          autoGatherExpiresAt: new Date(Date.now() + hours * 3600 * 1000),
        };

  await prisma.gameState.update({
    where: { id: user.gameState.id },
    data,
  });

  return fetchGameState(userId);
}

export async function collectOffline(userId: string): Promise<GameStateDto | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { gameState: true } });
  if (!user?.gameState) return null;

  let gs = user.gameState as unknown as DbGameState;
  gs = await tickGameState(gs);
  const resources = parseJson<ResourcesMap>(gs.resources, createInitialResources());
  const { income } = calculateOfflineIncome(resources, gs.lastTickAt, gs.lastOfflineCollect);
  const updated = collectOfflineIncome(resources, income);
  const totalProduced = addToTotalProduced(
    parseJson<Partial<Record<ResourceKey, number>>>(gs.totalResourcesProduced, {}),
    income.earned
  );

  const buildings = parseJson(gs.buildings, createInitialBuildings());
  const researches = parseJson(gs.researches, createInitialResearches());
  const wondersBuilt = parseJson<string[]>(gs.wondersBuilt, []);
  const civilizationScore = calculateCivilizationScore(
    updated,
    buildings,
    researches,
    gs.era,
    wondersBuilt
  );

  gs = {
    ...gs,
    resources: updated,
    totalResourcesProduced: totalProduced,
    civilizationScore,
    lastOfflineCollect: new Date(),
    lastTickAt: new Date(),
  };

  await prisma.gameState.update({
    where: { id: gs.id },
    data: {
      resources: updated as unknown as Prisma.InputJsonValue,
      totalResourcesProduced: totalProduced as unknown as Prisma.InputJsonValue,
      civilizationScore: gs.civilizationScore,
      lastOfflineCollect: gs.lastOfflineCollect,
      lastTickAt: gs.lastTickAt,
    },
  });

  await syncLeaderboardFromDb(userId);

  return toDto(user, gs, null);
}

export async function upgradeBuilding(userId: string, buildingKey: string): Promise<GameStateDto | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { gameState: true } });
  if (!user?.gameState) return null;

  const key = buildingKey as BuildingKey;
  const def = BUILDING_DEFS[key];
  if (!def) throw new Error('Unknown building');

  let gs = user.gameState as unknown as DbGameState;
  gs = await tickGameState(gs);

  if (!isBuildingUnlocked(key, gs.era)) throw new Error('Building locked');

  const buildings = parseJson(gs.buildings, createInitialBuildings());
  const currentLevel = buildings[key]?.level ?? 0;
  const cost = buildingCost(key, currentLevel);
  let resources = parseJson<ResourcesMap>(gs.resources, createInitialResources());

  if (!canAfford(resources, cost)) throw new Error('Insufficient resources');

  resources = deductCost(resources, cost);
  buildings[key] = { level: currentLevel + 1 };
  gs.totalXP += 10;
  gs.population = resources.population?.currentAmount ?? gs.population;

  const researches = parseJson(gs.researches, createInitialResearches());
  const wondersBuilt = parseJson<string[]>(gs.wondersBuilt, []);
  const territories = parseJson<string[]>(gs.territories, []);

  resources = recalculateProduction(
    {
      era: gs.era,
      buildings,
      researches,
      wondersBuilt,
      territories,
      eraProductionBonus: gs.eraProductionBonus,
      scienceBonus: gs.scienceBonus,
      vipTier: gs.vipTier,
      productionMultiplier: gs.productionMultiplier,
      boostExpiresAt: gs.boostExpiresAt,
    },
    resources
  );

  gs = {
    ...gs,
    resources,
    buildings,
    civilizationScore: calculateCivilizationScore(resources, buildings, researches, gs.era, wondersBuilt),
  };

  await prisma.gameState.update({
    where: { id: gs.id },
    data: {
      resources: resources as unknown as Prisma.InputJsonValue,
      buildings: buildings as unknown as Prisma.InputJsonValue,
      totalXP: gs.totalXP,
      civilizationScore: gs.civilizationScore,
      population: gs.population,
      lastTickAt: new Date(),
    },
  });

  return fetchGameState(userId);
}

export async function upgradeResearch(userId: string, researchKey: string): Promise<GameStateDto | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { gameState: true } });
  if (!user?.gameState) return null;

  const key = researchKey as ResearchKey;
  const def = RESEARCH_DEFS[key];
  if (!def) throw new Error('Unknown research');

  let gs = user.gameState as unknown as DbGameState;
  gs = await tickGameState(gs);

  if (!isResearchUnlocked(key, gs.era)) throw new Error('Research locked');

  const researches = parseJson(gs.researches, createInitialResearches());
  const currentLevel = researches[key]?.level ?? 0;
  const cost = researchCost(key, currentLevel);
  let resources = parseJson<ResourcesMap>(gs.resources, createInitialResources());

  if (!canAfford(resources, cost)) throw new Error('Insufficient resources');

  resources = deductCost(resources, cost);
  researches[key] = { level: currentLevel + 1 };
  gs.totalXP += 25;

  const buildings = parseJson(gs.buildings, createInitialBuildings());
  const wondersBuilt = parseJson<string[]>(gs.wondersBuilt, []);
  const territories = parseJson<string[]>(gs.territories, []);

  resources = recalculateProduction(
    {
      era: gs.era,
      buildings,
      researches,
      wondersBuilt,
      territories,
      eraProductionBonus: gs.eraProductionBonus,
      scienceBonus: gs.scienceBonus,
      vipTier: gs.vipTier,
      productionMultiplier: gs.productionMultiplier,
      boostExpiresAt: gs.boostExpiresAt,
    },
    resources
  );

  await prisma.gameState.update({
    where: { id: gs.id },
    data: {
      resources: resources as unknown as Prisma.InputJsonValue,
      researches: researches as unknown as Prisma.InputJsonValue,
      totalXP: gs.totalXP,
      lastTickAt: new Date(),
    },
  });

  return fetchGameState(userId);
}

export async function advanceEra(userId: string, force = false): Promise<GameStateDto | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { gameState: true } });
  if (!user?.gameState) return null;

  let gs = user.gameState as unknown as DbGameState;
  gs = await tickGameState(gs);

  const resources = parseJson<ResourcesMap>(gs.resources, createInitialResources());
  const buildings = parseJson(gs.buildings, createInitialBuildings());
  const researches = parseJson(gs.researches, createInitialResearches());
  const wondersBuilt = parseJson<string[]>(gs.wondersBuilt, []);

  const { canAdvance } = checkEraRequirements(gs.era, resources, buildings, researches, gs.population, wondersBuilt);
  if (!canAdvance && !force) throw new Error('Era requirements not met');

  if (gs.era >= ERAS.length - 1) throw new Error('Already at max era');

  const nextEra = gs.era + 1;
  const req = ERA_REQUIREMENTS[nextEra];
  let eraProductionBonus = gs.eraProductionBonus;
  let scienceBonus = gs.scienceBonus;

  if (req?.scienceBonusOnAdvance) scienceBonus += req.scienceBonusOnAdvance;
  eraProductionBonus += ERAS[nextEra]?.productionBonus ?? 0;

  gs = {
    ...gs,
    era: nextEra,
    totalXP: gs.totalXP + 100,
    eraProductionBonus,
    scienceBonus,
  };

  const territories = parseJson<string[]>(gs.territories, []);
  const newResources = recalculateProduction(
    {
      era: gs.era,
      buildings,
      researches,
      wondersBuilt,
      territories,
      eraProductionBonus: gs.eraProductionBonus,
      scienceBonus: gs.scienceBonus,
      vipTier: gs.vipTier,
      productionMultiplier: gs.productionMultiplier,
      boostExpiresAt: gs.boostExpiresAt,
    },
    resources
  );

  await prisma.gameState.update({
    where: { id: gs.id },
    data: {
      era: gs.era,
      totalXP: gs.totalXP,
      eraProductionBonus: gs.eraProductionBonus,
      scienceBonus: gs.scienceBonus,
      resources: newResources as unknown as Prisma.InputJsonValue,
    },
  });

  return fetchGameState(userId);
}

export async function startWonder(userId: string, wonderId: string): Promise<GameStateDto | null> {
  const wonder = WONDER_DEFS.find((w) => w.id === wonderId);
  if (!wonder) throw new Error('Unknown wonder');

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { gameState: true } });
  if (!user?.gameState) return null;

  let gs = user.gameState as unknown as DbGameState;
  gs = await tickGameState(gs);

  if (gs.activeWonder) throw new Error('Already building a wonder');
  const wondersBuilt = parseJson<string[]>(gs.wondersBuilt, []);
  if (wondersBuilt.includes(wonderId)) throw new Error('Wonder already built');

  let resources = parseJson<ResourcesMap>(gs.resources, createInitialResources());
  const cost = wonder.cost as Partial<Record<ResourceKey, number>>;
  if (!canAfford(resources, cost)) throw new Error('Insufficient resources');

  resources = deductCost(resources, cost);
  const now = new Date();
  const completesAt = new Date(now.getTime() + wonder.durationHours * 3600 * 1000);

  const activeWonder = {
    wonderId,
    startedAt: now.toISOString(),
    completesAt: completesAt.toISOString(),
    stage: 1,
    totalStages: 3,
  };

  await prisma.gameState.update({
    where: { id: gs.id },
    data: {
      resources: resources as unknown as Prisma.InputJsonValue,
      activeWonder: activeWonder as unknown as Prisma.InputJsonValue,
    },
  });

  return fetchGameState(userId);
}

export async function unlockTerritory(userId: string, territoryId: string): Promise<GameStateDto | null> {
  const territory = TERRITORIES.find((t) => t.id === territoryId);
  if (!territory) throw new Error('Unknown territory');

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { gameState: true } });
  if (!user?.gameState) return null;

  let gs = user.gameState as unknown as DbGameState;
  gs = await tickGameState(gs);

  const territories = parseJson<string[]>(gs.territories, []);
  if (territories.includes(territoryId)) throw new Error('Already unlocked');

  let resources = parseJson<ResourcesMap>(gs.resources, createInitialResources());
  const cost = territory.cost as Partial<Record<ResourceKey, number>>;
  if (!canAfford(resources, cost)) throw new Error('Insufficient resources');

  resources = deductCost(resources, cost);
  territories.push(territoryId);

  const buildings = parseJson(gs.buildings, createInitialBuildings());
  const researches = parseJson(gs.researches, createInitialResearches());
  const wondersBuilt = parseJson<string[]>(gs.wondersBuilt, []);

  resources = recalculateProduction(
    {
      era: gs.era,
      buildings,
      researches,
      wondersBuilt,
      territories,
      eraProductionBonus: gs.eraProductionBonus,
      scienceBonus: gs.scienceBonus,
      vipTier: gs.vipTier,
      productionMultiplier: gs.productionMultiplier,
      boostExpiresAt: gs.boostExpiresAt,
    },
    resources
  );

  await prisma.gameState.update({
    where: { id: gs.id },
    data: {
      resources: resources as unknown as Prisma.InputJsonValue,
      territories: territories as unknown as Prisma.InputJsonValue,
    },
  });

  return fetchGameState(userId);
}

/** Free daily wheel spin only. Paid spins go through Stars → fulfillShopPurchase('spin_10'). */
export async function spinWheel(userId: string): Promise<{ game: GameStateDto | null; reward: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { gameState: true } });
  if (!user?.gameState) return { game: null, reward: '' };

  let gs = user.gameState as unknown as DbGameState;
  const today = new Date().toDateString();
  if (gs.dailySpinUsedAt?.toDateString() === today) {
    throw new Error('Daily spin already used');
  }

  gs = await tickGameState(gs);
  const { reward, resources, gems, dailySpinUsedAt } = applyWheelSpin(gs, false);

  await prisma.gameState.update({
    where: { id: gs.id },
    data: {
      resources: resources as unknown as Prisma.InputJsonValue,
      gems,
      dailySpinUsedAt,
    },
  });

  const game = await fetchGameState(userId);
  return { game, reward };
}

function applyWheelSpin(
  gs: DbGameState,
  paid: boolean
): {
  reward: string;
  resources: ResourcesMap;
  gems: number;
  dailySpinUsedAt: Date | null;
} {
  let resources = parseJson<ResourcesMap>(gs.resources, createInitialResources());
  let gems = gs.gems;

  const rewards = [
    { type: 'food', amount: 500 },
    { type: 'gems', amount: 10 },
    { type: 'gold', amount: 200 },
    { type: 'science', amount: 100 },
    { type: 'wood', amount: 300 },
  ];
  const pick = rewards[Math.floor(Math.random() * rewards.length)];
  const key = pick.type as ResourceKey;
  if (key === 'gems') gems += pick.amount;
  else if (resources[key]) resources[key].currentAmount += pick.amount;

  return {
    reward: `${pick.amount} ${pick.type}`,
    resources,
    gems,
    dailySpinUsedAt: paid ? gs.dailySpinUsedAt : new Date(),
  };
}

export interface PurchasePaymentMeta {
  chargeId: string;
  starsAmount: number;
}

/** Apply shop product after verified Stars payment (or demo purchase). */
export async function fulfillShopPurchase(
  userId: string,
  productId: string,
  payment?: PurchasePaymentMeta
): Promise<GameStateDto | null> {
  const product = SHOP_PRODUCTS.find((p) => p.id === productId);
  if (!product) throw new Error('Unknown product');

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { gameState: true } });
  if (!user?.gameState) return null;

  let gs = user.gameState as unknown as DbGameState;
  gs = await tickGameState(gs);

  const p = product as Record<string, unknown>;

  if (p.gems) gs.gems += p.gems as number;
  if (p.type === 'boost') {
    gs.productionMultiplier = p.multiplier as number;
    gs.boostExpiresAt = new Date(Date.now() + (p.hours as number) * 3600 * 1000);
  }
  if (p.type === 'vip') {
    gs.vipTier = p.tier as string;
    gs.vipExpiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  }
  if (p.type === 'instant_era') {
    await prisma.purchase.create({
      data: {
        userId,
        productId,
        starsAmount: payment?.starsAmount ?? product.stars,
        status: 'completed',
        payload: payment?.chargeId
          ? ({ telegram_payment_charge_id: payment.chargeId } as Prisma.InputJsonValue)
          : undefined,
      },
    });
    await advanceEra(userId, true);
    return fetchGameState(userId);
  }
  if (p.type === 'resources') {
    let resources = parseJson<ResourcesMap>(gs.resources, createInitialResources());
    const hours = p.hours as number;
    for (const key of Object.keys(resources) as ResourceKey[]) {
      const r = resources[key];
      if (r && key !== 'gems') {
        r.currentAmount = Math.min(r.storageLimit, r.currentAmount + (r.productionPerHour * hours));
      }
    }
    gs.resources = resources;
  }
  if (p.type === 'spin') {
    const spinResult = applyWheelSpin(gs, true);
    gs.gems = spinResult.gems;
    gs.resources = spinResult.resources;
    gs.dailySpinUsedAt = spinResult.dailySpinUsedAt;
  }

  await prisma.purchase.create({
    data: {
      userId,
      productId,
      starsAmount: payment?.starsAmount ?? product.stars,
      status: 'completed',
      payload: payment?.chargeId
        ? ({ telegram_payment_charge_id: payment.chargeId } as Prisma.InputJsonValue)
        : undefined,
    },
  });

  await prisma.gameState.update({
    where: { id: gs.id },
    data: {
      gems: gs.gems,
      productionMultiplier: gs.productionMultiplier,
      boostExpiresAt: gs.boostExpiresAt,
      vipTier: gs.vipTier,
      vipExpiresAt: gs.vipExpiresAt,
      resources: gs.resources as Prisma.InputJsonValue,
      dailySpinUsedAt: gs.dailySpinUsedAt,
    },
  });

  return fetchGameState(userId);
}

/** @deprecated Use fulfillShopPurchase — kept for demo mode API. */
export async function processPurchase(userId: string, productId: string): Promise<GameStateDto | null> {
  return fulfillShopPurchase(userId, productId);
}

export async function getLeaderboard(limit = 100, currentUserId?: string): Promise<LeaderboardEntryDto[]> {
  if (currentUserId) {
    await syncLeaderboardFromDb(currentUserId);
  }

  const rows = await prisma.gameState.findMany({
    where: {
      user: {
        telegramId: { notIn: [...DEMO_LEADERBOARD_TELEGRAM_IDS] },
        NOT: {
          username: { in: [...DEMO_LEADERBOARD_USERNAMES], mode: 'insensitive' },
        },
      },
    },
    orderBy: [{ civilizationScore: 'desc' }, { totalXP: 'desc' }],
    take: Math.min(limit * 5, 500),
    include: {
      user: {
        select: {
          username: true,
          firstName: true,
          telegramId: true,
          civilizationName: true,
        },
      },
    },
  });

  const eligible = rows.filter((gs) =>
    isLeaderboardEligible(gs, gs.user.telegramId, {
      firstName: gs.user.firstName,
      username: gs.user.username,
    })
  );

  return eligible.slice(0, limit).map((gs, index) => {
    const wonders = parseJson<string[]>(gs.wondersBuilt, []);
    return {
      rank: index + 1,
      userId: gs.userId,
      username: gs.user.username ?? gs.user.firstName,
      civilizationName: gs.user.civilizationName,
      score: gs.civilizationScore,
      era: gs.era,
      eraKey: ERAS[gs.era]?.key ?? 'stone',
      level: playerLevel(gs.totalXP),
      wonders: wonders.length,
      telegramId: gs.user.telegramId.toString(),
    };
  });
}

export async function getReferralInfo(userId: string, botUsername: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { gameState: true, referrals: true },
  });
  if (!user) return null;

  const link = `https://t.me/${botUsername}?startapp=ref_${user.telegramId}`;
  // Count real invited users (User.referrerId), not just the counter field.
  const referralCount = user.referrals.length;
  const storedCount = user.gameState?.referralCount ?? 0;
  if (storedCount !== referralCount) {
    await prisma.gameState.update({
      where: { userId: user.id },
      data: { referralCount },
    });
  }

  return {
    referralCount,
    referrals: referralCount,
    link,
    tiers: [
      { count: 5, reward: 'Unique Avatar', unlocked: referralCount >= 5 },
      { count: 10, reward: 'VIP Bronze 3 days', unlocked: referralCount >= 10 },
      { count: 25, reward: 'Gold Profile Frame', unlocked: referralCount >= 25 },
      { count: 50, reward: 'Unique Title', unlocked: referralCount >= 50 },
      { count: 100, reward: 'Unique Monument', unlocked: referralCount >= 100 },
    ],
  };
}

export async function updateCivilizationName(userId: string, name: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { civilizationName: name.slice(0, 50) },
  });
}

export function getGameConfig() {
  const token = process.env.BOT_TOKEN ?? '';
  const demoPurchases = process.env.ALLOW_DEMO_PURCHASES === 'true';
  const starsEnabled = !!token && token !== 'dev_bot_token_change_me';

  return {
    eras: ERAS,
    eraRequirements: ERA_REQUIREMENTS,
    buildings: BUILDING_DEFS,
    researches: RESEARCH_DEFS,
    wonders: WONDER_DEFS,
    territories: TERRITORIES,
    endgame: ENDGAME_PROJECTS,
    shop: SHOP_PRODUCTS,
    payments: {
      demoPurchases,
      starsEnabled,
      useInvoices: starsEnabled && !demoPurchases,
    },
  };
}
