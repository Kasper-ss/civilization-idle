import {
  BUILDING_DEFS,
  ERA_REQUIREMENTS,
  ERAS,
  MAX_OFFLINE_HOURS,
  RESEARCH_DEFS,
  WONDER_DEFS,
  type BuildingKey,
  type ResearchKey,
  type ResourceKey,
} from '../config/gameData';
import type {
  ActiveWonder,
  BuildingsMap,
  OfflineIncome,
  ResearchesMap,
  ResourceState,
  ResourcesMap,
} from '../types/game';

const BASE_RESOURCES: ResourceKey[] = [
  'food',
  'wood',
  'stone',
  'bronze',
  'iron',
  'gold',
  'science',
  'energy',
  'coal',
  'titanium',
  'darkMatter',
];

const DEFAULT_STORAGE: Record<ResourceKey, number> = {
  food: 10000,
  wood: 10000,
  stone: 10000,
  bronze: 5000,
  iron: 10000,
  gold: 10000,
  science: 50000,
  population: 999999999,
  energy: 50000,
  coal: 20000,
  titanium: 10000,
  darkMatter: 5000,
  gems: 999999,
};

export function createInitialResources(): ResourcesMap {
  const resources = {} as ResourcesMap;
  for (const key of BASE_RESOURCES) {
    resources[key] = {
      currentAmount: key === 'food' ? 100 : key === 'wood' ? 50 : 0,
      productionPerHour: 0,
      storageLimit: DEFAULT_STORAGE[key] ?? 10000,
    };
  }
  resources.population = {
    currentAmount: 10,
    productionPerHour: 1,
    storageLimit: DEFAULT_STORAGE.population,
  };
  resources.gems = { currentAmount: 0, productionPerHour: 0, storageLimit: DEFAULT_STORAGE.gems };
  return resources;
}

export function createInitialBuildings(): BuildingsMap {
  return { farm: { level: 1 }, lumberMill: { level: 0 } };
}

export function createInitialResearches(): ResearchesMap {
  return { agriculture: { level: 0 } };
}

export function playerLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 100)) + 1;
}

export function buildingCost(building: BuildingKey, level: number): Partial<Record<ResourceKey, number>> {
  const def = BUILDING_DEFS[building];
  if (!def) return {};
  const mult = Math.pow(1.15, level);
  const cost: Partial<Record<ResourceKey, number>> = {};
  for (const [res, amt] of Object.entries(def.baseCost)) {
    cost[res as ResourceKey] = Math.floor((amt as number) * mult);
  }
  return cost;
}

export function researchCost(research: ResearchKey, level: number): Partial<Record<ResourceKey, number>> {
  const def = RESEARCH_DEFS[research];
  if (!def) return {};
  const mult = Math.pow(1.25, level);
  const cost: Partial<Record<ResourceKey, number>> = {};
  for (const [res, amt] of Object.entries(def.baseCost)) {
    cost[res as ResourceKey] = Math.floor((amt as number) * mult);
  }
  return cost;
}

function getVipMultiplier(tier: string | null | undefined): number {
  if (tier === 'gold') return 1.3;
  if (tier === 'silver') return 1.2;
  if (tier === 'bronze') return 1.1;
  return 1;
}

function getResearchBonus(
  researches: ResearchesMap,
  resource: ResourceKey,
  scienceBonus: number
): number {
  let bonus = 1;
  for (const [key, data] of Object.entries(researches)) {
    const def = RESEARCH_DEFS[key as ResearchKey];
    if (!def || data.level <= 0) continue;
    const b = 1 + def.bonusPercent * data.level;
    if (def.bonusType === resource || def.bonusType === 'all') bonus *= b;
    if (def.bonusType === 'building' && resource !== 'population') bonus *= 1 + def.bonusPercent * data.level * 0.5;
  }
  if (resource === 'science') bonus *= 1 + scienceBonus;
  return bonus;
}

function getWonderBonuses(wondersBuilt: string[]): Record<string, number> {
  const bonuses: Record<string, number> = {};
  for (const id of wondersBuilt) {
    const w = WONDER_DEFS.find((x) => x.id === id);
    if (!w) continue;
    const key = w.bonusType === 'all' ? 'all' : w.bonusType;
    bonuses[key] = (bonuses[key] ?? 0) + w.bonusPercent;
  }
  return bonuses;
}

export function recalculateProduction(
  state: {
    era: number;
    buildings: BuildingsMap;
    researches: ResearchesMap;
    wondersBuilt: string[];
    territories: string[];
    eraProductionBonus: number;
    scienceBonus: number;
    vipTier: string | null;
    productionMultiplier: number;
    boostExpiresAt: Date | null;
  },
  existing?: ResourcesMap
): ResourcesMap {
  const template = createInitialResources();
  const resources: ResourcesMap = existing
    ? (JSON.parse(JSON.stringify(existing)) as ResourcesMap)
    : (JSON.parse(JSON.stringify(template)) as ResourcesMap);

  for (const key of Object.keys(template) as ResourceKey[]) {
    if (!resources[key]) {
      resources[key] = { ...template[key] };
    }
    resources[key]!.productionPerHour = 0;
  }

  const eraMult = 1 + (ERAS[state.era]?.productionBonus ?? 0) + state.eraProductionBonus;
  const vipMult = getVipMultiplier(state.vipTier);
  let boostMult = state.productionMultiplier;
  if (state.boostExpiresAt && state.boostExpiresAt < new Date()) boostMult = 1;

  const wonderBonuses = getWonderBonuses(state.wondersBuilt);
  const territoryBonus: Record<string, number> = {};
  for (const t of state.territories) {
    if (t === 'forest') territoryBonus.wood = (territoryBonus.wood ?? 0) + 0.1;
    if (t === 'mountain') {
      territoryBonus.stone = (territoryBonus.stone ?? 0) + 0.1;
      territoryBonus.iron = (territoryBonus.iron ?? 0) + 0.05;
    }
    if (t === 'desert') territoryBonus.gold = (territoryBonus.gold ?? 0) + 0.1;
    if (t === 'ocean') {
      territoryBonus.science = (territoryBonus.science ?? 0) + 0.1;
      territoryBonus.gold = (territoryBonus.gold ?? 0) + 0.05;
    }
  }

  for (const [bKey, bData] of Object.entries(state.buildings)) {
    const def = BUILDING_DEFS[bKey as BuildingKey];
    if (!def || bData.level <= 0 || def.eraUnlock > state.era) continue;
    for (const [res, perHour] of Object.entries(def.production)) {
      const r = res as ResourceKey;
      if (!resources[r]) continue;
      resources[r].productionPerHour += (perHour as number) * bData.level;
    }
  }

  for (const key of BASE_RESOURCES) {
    const r = resources[key];
    if (!r) continue;
    let mult =
      eraMult *
      vipMult *
      boostMult *
      getResearchBonus(state.researches, key, state.scienceBonus);
    const wb = wonderBonuses[key] ?? wonderBonuses['all'] ?? 0;
    mult *= 1 + wb;
    mult *= 1 + (territoryBonus[key] ?? 0);
    r.productionPerHour *= mult;
    r.storageLimit = DEFAULT_STORAGE[key] ?? 10000;
  }

  const popBuilding = state.buildings.barracks?.level ?? 0;
  const popCathedral = state.buildings.cathedral?.level ?? 0;
  resources.population.productionPerHour =
    (1 + popBuilding * 2 + popCathedral * 5) * eraMult * vipMult;

  return resources;
}

export function applyTick(resources: ResourcesMap, seconds: number): ResourcesMap {
  return applyTickWithGains(resources, seconds).resources;
}

export function applyTickWithGains(
  resources: ResourcesMap,
  seconds: number
): { resources: ResourcesMap; gained: Partial<Record<ResourceKey, number>> } {
  const updated = JSON.parse(JSON.stringify(resources)) as ResourcesMap;
  const gained: Partial<Record<ResourceKey, number>> = {};

  for (const key of Object.keys(updated) as ResourceKey[]) {
    const r = updated[key];
    if (!r || key === 'gems') continue;
    const perSecond = r.productionPerHour / 3600;
    const gain = perSecond * seconds;
    const actual = Math.min(r.storageLimit - r.currentAmount, gain);
    if (actual > 0) {
      r.currentAmount += actual;
      gained[key] = actual;
    }
  }

  return { resources: updated, gained };
}

/** Manual gather: food + wood always; stone only after quarry; + 2s of building production. */
export function manualClickGather(
  resources: ResourcesMap,
  buildings: BuildingsMap = {},
  era = 0
): {
  resources: ResourcesMap;
  gained: Partial<Record<ResourceKey, number>>;
} {
  const updated = JSON.parse(JSON.stringify(resources)) as ResourcesMap;
  const gained: Partial<Record<ResourceKey, number>> = {};

  const addGain = (key: ResourceKey, amount: number) => {
    const r = updated[key];
    if (!r || amount <= 0 || key === 'gems') return;
    const actual = Math.min(r.storageLimit - r.currentAmount, amount);
    if (actual > 0) {
      r.currentAmount += actual;
      gained[key] = (gained[key] ?? 0) + actual;
    }
  };

  addGain('food', 3);
  addGain('wood', 2);
  if ((buildings.quarry?.level ?? 0) > 0 || era >= 1) {
    addGain('stone', 1);
  }

  for (const key of Object.keys(updated) as ResourceKey[]) {
    const r = updated[key];
    if (!r || key === 'gems') continue;
    if (r.productionPerHour > 0) {
      addGain(key, (r.productionPerHour / 3600) * 2);
    }
  }

  return { resources: updated, gained };
}

export function addToTotalProduced(
  total: Partial<Record<ResourceKey, number>>,
  gained: Partial<Record<ResourceKey, number>>
): Partial<Record<ResourceKey, number>> {
  const result = { ...total };
  for (const [key, amt] of Object.entries(gained)) {
    if (amt && amt > 0) {
      const k = key as ResourceKey;
      result[k] = (result[k] ?? 0) + amt;
    }
  }
  return result;
}

export function calculateOfflineIncome(
  resources: ResourcesMap,
  lastTickAt: Date,
  lastOfflineCollect: Date | null
): { income: OfflineIncome; newResources: ResourcesMap } {
  const now = new Date();
  let secondsAway = (now.getTime() - lastTickAt.getTime()) / 1000;
  const capped = secondsAway > MAX_OFFLINE_HOURS * 3600;
  secondsAway = Math.min(secondsAway, MAX_OFFLINE_HOURS * 3600);

  const earned: Partial<Record<ResourceKey, number>> = {};
  const newResources = JSON.parse(JSON.stringify(resources)) as ResourcesMap;

  for (const key of Object.keys(newResources) as ResourceKey[]) {
    const r = newResources[key];
    if (!r || key === 'gems') continue;
    const gain = (r.productionPerHour / 3600) * secondsAway;
    const actual = Math.min(r.storageLimit - r.currentAmount, gain);
    earned[key] = actual > 0 ? actual : 0;
  }

  return {
    income: { earned, secondsAway, capped },
    newResources,
  };
}

export function collectOfflineIncome(
  resources: ResourcesMap,
  income: OfflineIncome
): ResourcesMap {
  const updated = JSON.parse(JSON.stringify(resources)) as ResourcesMap;
  for (const [key, amt] of Object.entries(income.earned)) {
    const r = updated[key as ResourceKey];
    if (r && amt) r.currentAmount = Math.min(r.storageLimit, r.currentAmount + amt);
  }
  return updated;
}

export function canAfford(
  resources: ResourcesMap,
  cost: Partial<Record<ResourceKey, number>>
): boolean {
  for (const [key, amt] of Object.entries(cost)) {
    const r = resources[key as ResourceKey];
    const need = amt ?? 0;
    if (!r || r.currentAmount + 1e-6 < need) return false;
  }
  return true;
}

export function deductCost(
  resources: ResourcesMap,
  cost: Partial<Record<ResourceKey, number>>
): ResourcesMap {
  const updated = JSON.parse(JSON.stringify(resources)) as ResourcesMap;
  for (const [key, amt] of Object.entries(cost)) {
    const r = updated[key as ResourceKey];
    if (r && amt) r.currentAmount -= amt;
  }
  return updated;
}

export function checkEraRequirements(
  era: number,
  resources: ResourcesMap,
  buildings: BuildingsMap,
  researches: ResearchesMap,
  population: number,
  wondersBuilt: string[]
): { canAdvance: boolean; progress: number } {
  const req = ERA_REQUIREMENTS[era + 1];
  if (!req || era >= ERAS.length - 1) return { canAdvance: false, progress: 1 };

  const effectivePopulation = Math.max(population, resources.population?.currentAmount ?? 0);

  const part = (have: number, need: number): number => {
    if (need <= 0) return 1;
    return Math.min(1, Math.max(0, have / need));
  };

  let total = 0;
  let met = 0;

  if (req.resources) {
    for (const [key, needed] of Object.entries(req.resources)) {
      total++;
      const have = resources[key as ResourceKey]?.currentAmount ?? 0;
      met += part(have, needed ?? 0);
    }
  }
  if (req.buildings) {
    for (const [key, needed] of Object.entries(req.buildings)) {
      total++;
      const level = buildings[key]?.level ?? 0;
      met += part(level, needed ?? 0);
    }
  }
  if (req.researches) {
    for (const [key, needed] of Object.entries(req.researches)) {
      total++;
      const level = researches[key]?.level ?? 0;
      met += part(level, needed ?? 0);
    }
  }
  if (req.population) {
    total++;
    met += part(effectivePopulation, req.population);
  }
  if (req.wondersBuilt) {
    total++;
    met += part(wondersBuilt.length, req.wondersBuilt);
  }

  const progress = total > 0 ? Math.min(1, met / total) : 0;
  const canAdvance = progress >= 1 - 1e-9;
  return { canAdvance, progress };
}

export function calculateCivilizationScore(
  resources: ResourcesMap,
  buildings: BuildingsMap,
  researches: ResearchesMap,
  era: number,
  wondersBuilt: string[]
): number {
  let score = 0;
  for (const r of Object.values(resources)) {
    score += r.currentAmount * 0.01;
  }
  for (const b of Object.values(buildings)) {
    score += b.level * 100;
  }
  for (const r of Object.values(researches)) {
    score += r.level * 50;
  }
  score *= 1 + era * 0.5;
  score *= 1 + wondersBuilt.length * 0.25;
  return Math.floor(score);
}

export function completeWonderIfReady(activeWonder: ActiveWonder | null): {
  completed: boolean;
  wonderId?: string;
} {
  if (!activeWonder) return { completed: false };
  if (new Date(activeWonder.completesAt) <= new Date()) {
    return { completed: true, wonderId: activeWonder.wonderId };
  }
  return { completed: false };
}

export function isBuildingUnlocked(building: BuildingKey, era: number): boolean {
  const def = BUILDING_DEFS[building];
  return def ? def.eraUnlock <= era : false;
}

export function isResearchUnlocked(research: ResearchKey, era: number): boolean {
  const def = RESEARCH_DEFS[research];
  return def ? def.eraUnlock <= era : false;
}
