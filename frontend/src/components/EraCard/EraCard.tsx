import { useState } from 'react';
import { useEraName, useLocaleStore } from '../../store/localeStore';
import { useGameStore } from '../../store/gameStore';
import { isMaxEra } from '../../utils/eraProgress';

interface Props {
  progress: number;
  canAdvance: boolean;
  onAdvance: () => void;
}

export function EraCard({ progress, canAdvance, onAdvance }: Props) {
  const game = useGameStore((s) => s.game);
  const config = useGameStore((s) => s.config);
  const t = useLocaleStore((s) => s.t);
  const eraName = useEraName(game?.eraKey || 'stone');
  const atMaxEra = game ? isMaxEra(game, config?.eras.length) : false;
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const [advancing, setAdvancing] = useState(false);

  const handleAdvance = async () => {
    if (advancing || !canAdvance) return;
    setAdvancing(true);
    try {
      await onAdvance();
    } catch (e) {
      window.Telegram?.WebApp?.showAlert?.((e as Error).message);
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <div className="glass-panel mx-3 p-4">
      <h2 className="font-display text-sm text-civ-gold">{t.era.progress}</h2>
      <p className="text-xs text-white/60">
        {t.era.current}: {eraName}
      </p>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/40">
        <div
          className="h-full bg-gradient-to-r from-amber-600 to-amber-300 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-right text-xs">{pct}%</p>
      {atMaxEra ? (
        <p className="mt-3 text-center text-xs text-emerald-300/80">{t.era.maxEra}</p>
      ) : (
        <button
          className="btn-gold mt-3 w-full disabled:opacity-50"
          disabled={!canAdvance || advancing}
          onClick={() => void handleAdvance()}
        >
          {advancing ? '...' : t.era.advance}
        </button>
      )}
    </div>
  );
}
