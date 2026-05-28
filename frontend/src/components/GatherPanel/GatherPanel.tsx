import { useState, useCallback } from 'react';
import { ResourceCard } from '../ResourceCard/ResourceCard';
import { useGameStore } from '../../store/gameStore';
import { useLocaleStore } from '../../store/localeStore';
import type { ResourceKey } from '../../types/game';

const GATHER_RESOURCES: ResourceKey[] = ['food', 'wood'];

export function GatherPanel() {
  const game = useGameStore((s) => s.game);
  const manualGather = useGameStore((s) => s.manualGather);
  const toggleAutoGather = useGameStore((s) => s.toggleAutoGather);
  const t = useLocaleStore((s) => s.t);
  const [pulse, setPulse] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleGather = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setPulse(true);
    try {
      await manualGather();
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    } finally {
      setTimeout(() => setPulse(false), 200);
      setBusy(false);
    }
  }, [busy, manualGather]);

  if (!game) return null;

  const showStone = (game.buildings.quarry?.level ?? 0) > 0;
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

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleGather}
          disabled={busy}
          className={`relative flex-1 rounded-xl bg-gradient-to-b from-amber-500 to-amber-800 py-5 font-display text-lg font-bold text-stone-900 shadow-lg transition active:scale-95 disabled:opacity-50 ${
            pulse ? 'scale-105 ring-2 ring-amber-300' : ''
          }`}
        >
          ⛏️ {t.home.gather}
        </button>

        <button
          type="button"
          onClick={() => toggleAutoGather(!game.autoGatherEnabled)}
          aria-pressed={game.autoGatherEnabled}
          className={`flex min-w-[7rem] flex-col items-center justify-center rounded-xl border-2 px-2 py-2 text-center transition ${
            game.autoGatherEnabled
              ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.35)]'
              : 'border-amber-600/50 bg-amber-950/40 text-amber-100/80'
          }`}
        >
          <span className="text-2xl">{game.autoGatherEnabled ? '⚙️' : '✋'}</span>
          <span className="mt-1 text-[11px] font-bold leading-tight">{t.home.autoGather}</span>
          <span
            className={`mt-1 rounded px-2 py-0.5 text-[10px] font-semibold ${
              game.autoGatherEnabled ? 'bg-emerald-500/40' : 'bg-black/30'
            }`}
          >
            {game.autoGatherEnabled ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>

      <p className="mt-2 text-center text-xs text-white/50">
        {game.autoGatherEnabled ? t.home.disableAuto : t.home.gatherHint}
      </p>
    </div>
  );
}
