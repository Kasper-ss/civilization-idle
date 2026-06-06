import type { BuildingKey, ResearchKey, ResourceKey } from '../config/gameData';

export interface ResourceState {
  currentAmount: number;
  productionPerHour: number;
  storageLimit: number;
}

export type ResourcesMap = Record<ResourceKey, ResourceState>;
export type BuildingsMap = Record<string, { level: number }>;
export type ResearchesMap = Record<string, { level: number }>;

export interface ActiveWonder {
  wonderId: string;
  startedAt: string;
  completesAt: string;
  stage: number;
  totalStages: number;
}

export interface OfflineIncome {
  earned: Partial<Record<ResourceKey, number>>;
  secondsAway: number;
  capped: boolean;
}

export interface GameStateDto {
  era: number;
  eraName: string;
  totalXP: number;
  level: number;
  population: number;
  gems: number;
  resources: ResourcesMap;
  buildings: BuildingsMap;
  researches: ResearchesMap;
  wondersBuilt: string[];
  activeWonder: ActiveWonder | null;
  territories: string[];
  endgameProjects: Record<string, number>;
  vipTier: string | null;
  vipExpiresAt: string | null;
  productionMultiplier: number;
  boostExpiresAt: string | null;
  eraProductionBonus: number;
  scienceBonus: number;
  civilizationScore: number;
  civilizationName: string;
  canAdvanceEra: boolean;
  eraProgress: number;
  offlineIncome: OfflineIncome | null;
  user: {
    telegramId: string;
    username: string | null;
    firstName: string | null;
    photoUrl: string | null;
  };
  referralCount: number;
  daysPlayed: number;
  title: string | null;
  dailySpinAvailable: boolean;
  autoGatherEnabled: boolean;
  autoGatherExpiresAt: string | null;
  totalResourcesProduced: Partial<Record<ResourceKey, number>>;
  eraKey: string;
}
