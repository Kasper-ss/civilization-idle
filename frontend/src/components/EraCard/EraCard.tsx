import { useEraName, useLocaleStore } from '../../store/localeStore';
import { useGameStore } from '../../store/gameStore';

interface Props {
  progress: number;
  canAdvance: boolean;
  onAdvance: () => void;
}

export function EraCard({ progress, canAdvance, onAdvance }: Props) {
  const game = useGameStore((s) => s.game);
  const t = useLocaleStore((s) => s.t);
  const eraName = useEraName(game?.eraKey || 'stone');

  return (
    <div className="glass-panel mx-3 p-4">
      <h2 className="font-display text-sm text-civ-gold">{t.era.progress}</h2>
      <p className="text-xs text-white/60">
        {t.era.current}: {eraName}
      </p>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/40">
        <div
          className="h-full bg-gradient-to-r from-amber-600 to-amber-300 transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <p className="mt-1 text-right text-xs">{Math.round(progress * 100)}%</p>
      <button className="btn-gold mt-3 w-full" disabled={!canAdvance} onClick={onAdvance}>
        {t.era.advance}
      </button>
    </div>
  );
}
