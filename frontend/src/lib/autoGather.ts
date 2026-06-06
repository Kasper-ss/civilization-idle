import type { GameState } from '../types/game';

export const AUTO_GATHER_DURATIONS = [4, 8, 12] as const;
export type AutoGatherHours = (typeof AUTO_GATHER_DURATIONS)[number] | 0;

export function isAutoGatherActive(game: GameState): boolean {
  if (!game.autoGatherEnabled) return false;
  if (!game.autoGatherExpiresAt) return true;
  return new Date(game.autoGatherExpiresAt).getTime() > Date.now();
}

export function formatAutoGatherRemaining(expiresAt: string, ru: boolean): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return ru ? 'Завершено' : 'Finished';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return ru ? `${h}ч ${m}м` : `${h}h ${m}m`;
  return ru ? `${m}м` : `${m}m`;
}
