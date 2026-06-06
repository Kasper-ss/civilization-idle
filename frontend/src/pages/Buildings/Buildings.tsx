import { Header } from '../../components/Header/Header';
import { BuildingCard } from '../../components/BuildingCard/BuildingCard';
import { useGameStore } from '../../store/gameStore';
import { useLocaleStore } from '../../store/localeStore';

export function Buildings() {
  const game = useGameStore((s) => s.game);
  const config = useGameStore((s) => s.config);
  const t = useLocaleStore((s) => s.t);

  if (!game || !config) return null;

  return (
    <div className="min-h-screen bg-civ-dark pb-24">
      <Header />
      <h2 className="mx-3 mt-2 font-display text-lg text-civ-gold">{t.buildings.title}</h2>
      <div className="mx-3 mt-2 space-y-3">
        {Object.entries(config.buildings).map(([key, def]) => {
          const level = game.buildings[key]?.level ?? 0;
          const locked = def.eraUnlock > game.era;
          const mult = Math.pow(1.15, level);
          const cost: Record<string, number> = {};
          for (const [res, amt] of Object.entries(def.baseCost)) {
            cost[res] = Math.floor(amt * mult);
          }
          const prod = Object.entries(def.production)
            .map(([r, v]) => `+${(v as number) * Math.max(1, level)} ${r}/h`)
            .join(', ');

          return (
            <BuildingCard
              key={key}
              buildingKey={key}
              name={def.name}
              level={level}
              production={prod || '—'}
              cost={cost}
              locked={locked}
              eraUnlock={def.eraUnlock}
            />
          );
        })}
      </div>
    </div>
  );
}
