import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useLocaleStore } from '../../store/localeStore';
import { formatNumber } from '../../utils/format';

interface Props {
  buildingKey: string;
  name: string;
  level: number;
  production: string;
  cost: Record<string, number>;
  locked: boolean;
  eraUnlock: number;
}

export function BuildingCard({ buildingKey, name, level, production, cost, locked, eraUnlock }: Props) {
  const build = useGameStore((s) => s.build);
  const game = useGameStore((s) => s.game);
  const t = useLocaleStore((s) => s.t);
  const [animating, setAnimating] = useState(false);
  const [error, setError] = useState('');

  const handleBuild = async () => {
    try {
      setError('');
      await build(buildingKey);
      setAnimating(true);
      setTimeout(() => setAnimating(false), 600);
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const costStr = Object.entries(cost)
    .map(([k, v]) => {
      const have = game?.resources[k as keyof typeof game.resources]?.currentAmount ?? 0;
      const ok = have >= v;
      return `${ok ? '✓' : '✗'} ${formatNumber(v)} ${k}`;
    })
    .join(', ');

  return (
    <div className={`glass-panel p-3 transition ${animating ? 'scale-105 ring-2 ring-amber-400' : ''}`}>
      <div className="flex justify-between">
        <div>
          <h3 className="font-display font-semibold text-civ-gold">{name}</h3>
          <p className="text-xs text-white/60">Level {level}</p>
        </div>
        <div className="text-right text-xs text-emerald-400">{production}</div>
      </div>
      {locked ? (
        <p className="mt-2 text-xs text-red-400">
          {t.buildings.unlocksEra} {eraUnlock + 1}
        </p>
      ) : (
        <>
          <p className="mt-2 text-xs text-white/50">Cost: {costStr || '—'}</p>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button className="btn-gold mt-2 w-full text-sm" onClick={handleBuild}>
            {t.common.build}
          </button>
        </>
      )}
    </div>
  );
}
