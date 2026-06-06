import type { GameConfig, GameState } from '../types/game';

type EraRequirement = NonNullable<GameConfig['eraRequirements']>[number];

function requirementPart(have: number, need: number): number {
  if (need <= 0) return 1;
  return Math.min(1, Math.max(0, have / need));
}

/** Client-side era progress (matches backend checkEraRequirements). */
export function computeEraProgress(
  game: GameState,
  eraRequirements: EraRequirement[] | undefined
): { canAdvanceEra: boolean; eraProgress: number } {
  const maxEra = (eraRequirements?.length ?? 1) - 1;
  const req = eraRequirements?.[game.era + 1];

  if (!req || game.era >= maxEra) {
    return { canAdvanceEra: false, eraProgress: 1 };
  }

  const population = Math.max(game.population, game.resources.population?.currentAmount ?? 0);
  let total = 0;
  let met = 0;

  if (req.resources) {
    for (const [key, needed] of Object.entries(req.resources)) {
      total++;
      const have = game.resources[key as keyof typeof game.resources]?.currentAmount ?? 0;
      met += requirementPart(have, needed ?? 0);
    }
  }
  if (req.buildings) {
    for (const [key, needed] of Object.entries(req.buildings)) {
      total++;
      const level = game.buildings[key]?.level ?? 0;
      met += requirementPart(level, needed ?? 0);
    }
  }
  if (req.researches) {
    for (const [key, needed] of Object.entries(req.researches)) {
      total++;
      const level = game.researches[key]?.level ?? 0;
      met += requirementPart(level, needed ?? 0);
    }
  }
  if (req.population) {
    total++;
    met += requirementPart(population, req.population);
  }
  if (req.wondersBuilt) {
    total++;
    met += requirementPart(game.wondersBuilt.length, req.wondersBuilt);
  }

  const eraProgress = total > 0 ? Math.min(1, met / total) : 0;
  return { canAdvanceEra: eraProgress >= 1 - 1e-9, eraProgress };
}

export function isMaxEra(game: GameState, eraCount: number | undefined): boolean {
  const max = (eraCount ?? 1) - 1;
  return game.era >= max;
}
