import { useCallback, useEffect, useState } from 'react';
import { ResourceCard } from '../ResourceCard/ResourceCard';
import { useGameStore } from '../../store/gameStore';
import { useLocaleStore } from '../../store/localeStore';
import {
  AUTO_GATHER_HOURS,
  formatAutoGatherRemaining,
  isAutoGatherActive,
  type AutoGatherHours,
} from '../../lib/autoGather';
import type { ResourceKey } from '../../types/game';

const GATHER_RESOURCES: ResourceKey[] = ['food', 'wood'];

export function GatherPanel() {
  const game = useGameStore((s) => s.game);
  const manualGather = useGameStore((s) => s.manualGather);
  const setAutoGather = useGameStore((s) => s.setAutoGather);
  const locale = useLocaleStore((s) => s.locale);
  const t = useLocaleStore((s) => s.t);

  const autoActive = game ? isAutoGatherActive(game) : false;
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!game?.autoGatherExpiresAt || !autoActive) {
      setRemaining('');
      return;
    }
    const tick = () => setRemaining(formatAutoGatherRemaining(game.autoGatherExpiresAt!, locale === 'ru'));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [game?.autoGatherExpiresAt, autoActive, locale]);

  const handleGather = useCallback(() => {
    manualGather();
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    } catch {
      // ignore
    }
  }, [manualGather]);

  const handleAuto = useCallback(
    (hours: AutoGatherHours) => {
      void setAutoGather(hours);
      try {
        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
      } catch {
        // ignore
      }
    },
    [setAutoGather]
  );

  if (!game) return null;

  const showStone = (game.buildings.quarry?.level ?? 0) > 0 || game.era >= 1;
  const gatherKeys: ResourceKey[] = showStone ? [...GATHER_RESOURCES, 'stone'] : GATHER_RESOURCES;

  return (
    <div className="mx-3 mt-3 glass-panel p-4">
      <div className="mb-3 grid grid-cols-2 gap-2">
        {gatherKeys.map((key) => {
          const r = game.resources[key];
          if (!r) return null;
          return <ResourceCard key={key} resourceKey={key} data={r} compact />;
        })}
      </div>

      <button
        type="button"
        onClick={handleGather}
        disabled={autoActive}
        className={`relative w-full rounded-xl bg-gradient-to-b from-amber-500 to-amber-800 py-5 font-display text-lg font-bold text-stone-900 shadow-lg transition-transform select-none touch-manipulation ${
          autoActive ? 'opacity-50' : 'active:scale-95'
        }`}
      >
        ⛏️ {t.home.gather}
      </button>

      <div className="mt-3 rounded-xl border border-amber-600/30 bg-amber-950/30 p-3">
        <p className="text-center text-xs font-semibold text-amber-200/90">{t.home.autoGather}</p>

        {autoActive ? (
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-emerald-300">⚙️ {t.home.autoOn}</p>
              <p className="text-xs text-white/60">
                {t.home.autoGatherRemaining}: <span className="text-emerald-200">{remaining}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleAuto(0)}
              className="shrink-0 rounded-lg border border-red-400/50 bg-red-950/50 px-3 py-2 text-xs font-bold text-red-200 touch-manipulation active:scale-95"
            >
              {t.home.autoGatherStop}
            </button>
          </div>
        ) : (
          <>
            <p className="mt-1 text-center text-[11px] text-white/50">{t.home.autoGatherDuration}</p>
            <button
              type="button"
              onClick={() => handleAuto(AUTO_GATHER_HOURS)}
              className="mt-2 w-full rounded-lg border border-emerald-500/40 bg-emerald-500/15 py-3 text-sm font-bold text-emerald-200 touch-manipulation active:scale-95"
            >
              {AUTO_GATHER_HOURS}
              {t.home.autoGatherHoursSuffix}
            </button>
          </>
        )}
      </div>

      <p className="mt-2 text-center text-xs text-white/50">
        {autoActive ? t.home.autoOff : t.home.gatherHint}
      </p>
    </div>
  );
}
