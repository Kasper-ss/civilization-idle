import type { ResourceKey } from '../config/gameData';
import { createInitialBuildings, createInitialResearches } from './gameEngine';

function parseJson<T>(val: unknown, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  return val as T;
}

/** Demo accounts created by prisma seed for a populated leaderboard. */
export const DEMO_LEADERBOARD_TELEGRAM_IDS: readonly bigint[] = [
  111111111n,
  222222222n,
  333333333n,
  444444444n,
  555555555n,
] as const;

export const DEV_BROWSER_TELEGRAM_ID = 123456789n;

type GameProgressSlice = {
  era: number;
  totalXP: number;
  totalResourcesProduced: unknown;
  buildings: unknown;
  researches: unknown;
  wondersBuilt: unknown;
};

/** True if the player did more than open the app (gather, build, research, etc.). */
export function hasMeaningfulGameProgress(gs: GameProgressSlice): boolean {
  if (gs.era > 0) return true;
  if (gs.totalXP > 0) return true;

  const wonders = parseJson<string[]>(gs.wondersBuilt, []);
  if (wonders.length > 0) return true;

  const totalProduced = parseJson<Partial<Record<ResourceKey, number>>>(gs.totalResourcesProduced, {});
  if (Object.values(totalProduced).some((v) => (v ?? 0) > 0)) return true;

  const researches = parseJson(gs.researches, createInitialResearches());
  if (Object.values(researches).some((r) => r.level > 0)) return true;

  const buildings = parseJson(gs.buildings, createInitialBuildings());
  if ((buildings.lumberMill?.level ?? 0) > 0) return true;
  if ((buildings.farm?.level ?? 0) > 1) return true;

  for (const [key, b] of Object.entries(buildings)) {
    if (key === 'farm' || key === 'lumberMill') continue;
    if (b.level > 0) return true;
  }

  return false;
}

export function isLeaderboardEligible(
  gs: GameProgressSlice,
  telegramId: bigint,
  user: { firstName: string | null; username: string | null }
): boolean {
  if (DEMO_LEADERBOARD_TELEGRAM_IDS.includes(telegramId)) return false;

  if (process.env.NODE_ENV === 'production' && telegramId === DEV_BROWSER_TELEGRAM_ID) {
    return false;
  }

  if (!user.firstName?.trim() && !user.username?.trim()) {
    return false;
  }

  if (!hasMeaningfulGameProgress(gs)) return false;

  return true;
}
