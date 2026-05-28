import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useLocaleStore, useEraName } from '../../store/localeStore';
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher';
import { formatNumber, RESOURCE_ICONS } from '../../utils/format';
import type { ResourceKey } from '../../types/game';

const STAT_KEYS: ResourceKey[] = [
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

export function Header() {
  const game = useGameStore((s) => s.game);
  const t = useLocaleStore((s) => s.t);
  const [expanded, setExpanded] = useState(false);
  const eraName = useEraName(game?.eraKey || 'stone');

  if (!game) return null;
  const produced = game.totalResourcesProduced ?? {};
  const producedEntries = STAT_KEYS.filter((k) => (produced[k] ?? 0) > 0);

  return (
    <header className="glass-panel mx-3 mt-3 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-lg font-bold text-civ-gold truncate">{game.civilizationName}</h1>
          <p className="text-xs text-white/60">{eraName}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <LanguageSwitcher compact />
          <div className="rounded-full bg-amber-500/20 px-3 py-1 text-sm font-semibold text-amber-300">
            {t.common.level} {game.level}
          </div>
          {game.vipTier && (
            <span className="text-xs uppercase text-amber-400">VIP {game.vipTier}</span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="mt-2 w-full text-left"
        aria-expanded={expanded}
      >
        <div className="flex flex-wrap gap-3 text-xs text-white/70">
          <span title={t.header.population}>
            👥 {formatNumber(game.population)}
            <span className="ml-1 block text-[10px] text-white/40">{t.header.population}</span>
          </span>
          <span title={t.header.gems}>
            💎 {formatNumber(game.gems)}
            <span className="ml-1 block text-[10px] text-white/40">{t.header.gems}</span>
          </span>
          <span title={t.header.score}>
            🏆 {formatNumber(game.civilizationScore)}
            <span className="ml-1 block text-[10px] text-white/40">{t.header.score}</span>
          </span>
        </div>
        <p className="mt-1 text-[10px] text-white/35">{expanded ? '▲' : '▼'} {t.header.tapToExpand}</p>
      </button>

      {expanded && (
        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="mb-2 text-xs font-semibold text-civ-gold">{t.header.totalGathered}</p>
          {producedEntries.length === 0 ? (
            <p className="text-xs text-white/40">—</p>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {producedEntries.map((key) => (
                <div key={key} className="flex justify-between rounded bg-black/25 px-2 py-1 text-xs">
                  <span>
                    {RESOURCE_ICONS[key]} {t.resources[key]}
                  </span>
                  <span className="font-medium text-amber-200/90">{formatNumber(produced[key] ?? 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
