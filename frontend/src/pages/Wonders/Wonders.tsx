import { BackButton } from '../../components/BackButton/BackButton';
import { Header } from '../../components/Header/Header';
import { WonderCard } from '../../components/WonderCard/WonderCard';
import { useGameStore } from '../../store/gameStore';
import { useLocaleStore } from '../../store/localeStore';
export function Wonders() {
  const game = useGameStore((s) => s.game);
  const config = useGameStore((s) => s.config);
  const t = useLocaleStore((s) => s.t);

  if (!game || !config) return null;

  const activeId = game.activeWonder?.wonderId;

  return (
    <div className="min-h-screen bg-civ-dark pb-28">
      <Header />
      <BackButton />
      <h2 className="mx-3 mt-1 font-display text-lg text-civ-gold">{t.wonders.title}</h2>
      {game.activeWonder && (
        <div className="mx-3 mt-2 glass-panel p-3 text-sm">
          <p className="text-amber-400">Construction in progress...</p>
          <p className="text-xs text-white/60">
            Completes: {new Date(game.activeWonder.completesAt).toLocaleString()}
          </p>
          <p className="text-xs">
            Stage {game.activeWonder.stage}/{game.activeWonder.totalStages}
          </p>
        </div>
      )}
      <div className="mx-3 mt-2 space-y-3">
        {config.wonders.map((w) => (
          <WonderCard
            key={w.id}
            id={w.id}
            name={w.name}
            bonus={`+${w.bonusPercent * 100}% ${w.bonusType}`}
            durationHours={w.durationHours}
            cost={w.cost}
            built={game.wondersBuilt.includes(w.id)}
            building={activeId === w.id}
          />
        ))}
      </div>
      <p className="mx-3 mt-4 text-center text-xs text-white/40">
        Only one wonder can be built at a time. Accelerate with Telegram Stars.
      </p>
    </div>
  );
}
