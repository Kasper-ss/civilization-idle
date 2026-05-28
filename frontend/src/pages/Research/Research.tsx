import { Header } from '../../components/Header/Header';
import { ResearchCard } from '../../components/ResearchCard/ResearchCard';
import { useGameStore } from '../../store/gameStore';
import { useLocaleStore } from '../../store/localeStore';

export function Research() {
  const game = useGameStore((s) => s.game);
  const config = useGameStore((s) => s.config);
  const t = useLocaleStore((s) => s.t);

  if (!game || !config) return null;

  return (
    <div className="min-h-screen bg-civ-dark pb-24">
      <Header />
      <h2 className="mx-3 mt-2 font-display text-lg text-civ-gold">{t.research.title}</h2>
      <div className="mx-3 mt-2 space-y-3">
        {Object.entries(config.researches).map(([key, def]) => {
          const level = game.researches[key]?.level ?? 0;
          let status: 'locked' | 'available' | 'completed' = 'available';
          if (def.eraUnlock > game.era) status = 'locked';
          else if (level >= 10) status = 'completed';

          return (
            <ResearchCard
              key={key}
              researchKey={key}
              name={def.name}
              level={level}
              status={status}
              bonus={`+${def.bonusPercent * 100}% ${def.bonusType} per level`}
              eraUnlock={def.eraUnlock}
            />
          );
        })}
      </div>
    </div>
  );
}
