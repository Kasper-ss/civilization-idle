export type ResourceKey =
  | 'food'
  | 'wood'
  | 'stone'
  | 'bronze'
  | 'iron'
  | 'gold'
  | 'science'
  | 'population'
  | 'energy'
  | 'coal'
  | 'titanium'
  | 'darkMatter'
  | 'gems';

export interface ResourceState {
  currentAmount: number;
  productionPerHour: number;
  storageLimit: number;
}

export type ResourcesMap = Record<ResourceKey, ResourceState>;

export interface GameState {
  era: number;
  eraName: string;
  totalXP: number;
  level: number;
  population: number;
  gems: number;
  resources: ResourcesMap;
  buildings: Record<string, { level: number }>;
  researches: Record<string, { level: number }>;
  wondersBuilt: string[];
  activeWonder: {
    wonderId: string;
    startedAt: string;
    completesAt: string;
    stage: number;
    totalStages: number;
  } | null;
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
  offlineIncome: {
    earned: Partial<Record<ResourceKey, number>>;
    secondsAway: number;
    capped: boolean;
  } | null;
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
  totalResourcesProduced: Partial<Record<ResourceKey, number>>;
  eraKey: string;
}

export interface GameConfig {
  eras: { id: number; key: string; name: string; nameRu: string }[];
  buildings: Record<string, { name: string; eraUnlock: number; baseCost: Record<string, number>; production: Record<string, number> }>;
  researches: Record<string, { name: string; eraUnlock: number; bonusType: string; bonusPercent: number }>;
  wonders: { id: string; name: string; bonusType: string; bonusPercent: number; durationHours: number; cost: Record<string, number> }[];
  territories: { id: string; name: string; bonus: Record<string, number>; cost: Record<string, number> }[];
  shop: { id: string; name: string; stars: number; gems?: number; type?: string }[];
}
