import type { GameState, ResourceKey, ResourcesMap } from '../types/game';

/** Mirrors backend manualClickGather — instant UI on tap. */
export function applyOptimisticGather(game: GameState): GameState {
  const resources = JSON.parse(JSON.stringify(game.resources)) as ResourcesMap;
  const gained: Partial<Record<ResourceKey, number>> = {};
  const buildings = game.buildings;

  const addGain = (key: ResourceKey, amount: number) => {
    const r = resources[key];
    if (!r || amount <= 0 || key === 'gems') return;
    const actual = Math.min(r.storageLimit - r.currentAmount, amount);
    if (actual > 0) {
      r.currentAmount += actual;
      gained[key] = (gained[key] ?? 0) + actual;
    }
  };

  addGain('food', 3);
  addGain('wood', 2);
  if ((buildings.quarry?.level ?? 0) > 0 || game.era >= 1) {
    addGain('stone', 1);
  }

  for (const key of Object.keys(resources) as ResourceKey[]) {
    const r = resources[key];
    if (!r || key === 'gems') continue;
    if (r.productionPerHour > 0) {
      addGain(key, (r.productionPerHour / 3600) * 2);
    }
  }

  const totalResourcesProduced = { ...game.totalResourcesProduced };
  for (const [key, amt] of Object.entries(gained)) {
    if (amt && amt > 0) {
      const k = key as ResourceKey;
      totalResourcesProduced[k] = (totalResourcesProduced[k] ?? 0) + amt;
    }
  }

  return {
    ...game,
    resources,
    totalResourcesProduced,
    population: resources.population?.currentAmount ?? game.population,
  };
}
