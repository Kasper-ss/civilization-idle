import type { GameConfig, GameState, ResourceKey, ResourcesMap } from '../types/game';
import { computeEraProgress } from './eraProgress';

function scaleBuildingCost(baseCost: Record<string, number>, level: number): Record<string, number> {
  const mult = Math.pow(1.15, level);
  const cost: Record<string, number> = {};
  for (const [res, amt] of Object.entries(baseCost)) {
    cost[res] = Math.floor(amt * mult);
  }
  return cost;
}

function scaleResearchCost(baseCost: Record<string, number>, level: number): Record<string, number> {
  const mult = Math.pow(1.25, level);
  const cost: Record<string, number> = {};
  for (const [res, amt] of Object.entries(baseCost)) {
    cost[res] = Math.floor(amt * mult);
  }
  return cost;
}

function canAfford(resources: ResourcesMap, cost: Record<string, number>): boolean {
  for (const [key, amt] of Object.entries(cost)) {
    const r = resources[key as ResourceKey];
    if (!r || r.currentAmount + 1e-6 < amt) return false;
  }
  return true;
}

function deductCostResources(resources: ResourcesMap, cost: Record<string, number>): ResourcesMap {
  const updated = JSON.parse(JSON.stringify(resources)) as ResourcesMap;
  for (const [key, amt] of Object.entries(cost)) {
    const r = updated[key as ResourceKey];
    if (r && amt) r.currentAmount -= amt;
  }
  return updated;
}

function withEraProgress(game: GameState, config: GameConfig): GameState {
  return { ...game, ...computeEraProgress(game, config.eraRequirements) };
}

export function applyOptimisticBuild(
  game: GameState,
  buildingKey: string,
  config: GameConfig
): GameState | null {
  const def = config.buildings[buildingKey];
  if (!def || def.eraUnlock > game.era) return null;

  const level = game.buildings[buildingKey]?.level ?? 0;
  const cost = scaleBuildingCost(def.baseCost, level);
  if (!canAfford(game.resources, cost)) return null;

  const resources = deductCostResources(game.resources, cost);
  const buildings = { ...game.buildings, [buildingKey]: { level: level + 1 } };
  return withEraProgress({ ...game, resources, buildings }, config);
}

export function applyOptimisticResearch(
  game: GameState,
  researchKey: string,
  config: GameConfig
): GameState | null {
  const def = config.researches[researchKey] as
    | (GameConfig['researches'][string] & { baseCost?: Record<string, number> })
    | undefined;
  if (!def || def.eraUnlock > game.era) return null;

  const level = game.researches[researchKey]?.level ?? 0;
  if (!def.baseCost) return null;

  const cost = scaleResearchCost(def.baseCost, level);
  if (!canAfford(game.resources, cost)) return null;

  const resources = deductCostResources(game.resources, cost);
  const researches = { ...game.researches, [researchKey]: { level: level + 1 } };
  return withEraProgress({ ...game, resources, researches }, config);
}
