import { useState } from 'react';
import { Header } from '../../components/Header/Header';
import { useGameStore } from '../../store/gameStore';
import { formatNumber } from '../../utils/format';

const TERRITORY_VISUALS: Record<string, { emoji: string; desc: string }> = {
  forest: { emoji: '🌲', desc: '+10% Wood' },
  mountain: { emoji: '⛰️', desc: '+10% Stone, +5% Iron' },
  desert: { emoji: '🏜️', desc: '+10% Gold' },
  ocean: { emoji: '🌊', desc: '+10% Science, +5% Gold' },
};

export function World() {
  const game = useGameStore((s) => s.game);
  const config = useGameStore((s) => s.config);
  const unlockTerritory = useGameStore((s) => s.unlockTerritory);
  const [error, setError] = useState('');

  if (!game || !config) return null;

  const handleUnlock = async (id: string) => {
    try {
      setError('');
      await unlockTerritory(id);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-civ-dark pb-28">
      <Header />
      <h2 className="mx-3 mt-2 font-display text-lg text-civ-gold">World Map</h2>
      <div className="mx-3 mt-4 grid grid-cols-2 gap-3">
        {config.territories.map((t) => {
          const unlocked = game.territories.includes(t.id);
          const visual = TERRITORY_VISUALS[t.id];
          return (
            <div
              key={t.id}
              className={`glass-panel flex flex-col items-center p-4 ${unlocked ? 'ring-2 ring-emerald-500/50' : ''}`}
            >
              <span className="text-4xl">{visual?.emoji}</span>
              <h3 className="mt-2 font-display text-civ-gold">{t.name}</h3>
              <p className="text-xs text-white/60 text-center">{visual?.desc}</p>
              {unlocked ? (
                <span className="mt-2 text-xs text-emerald-400">Explored</span>
              ) : (
                <button className="btn-gold mt-2 text-xs" onClick={() => handleUnlock(t.id)}>
                  Explore ({Object.entries(t.cost).map(([k, v]) => `${formatNumber(v)} ${k}`).join(', ')})
                </button>
              )}
            </div>
          );
        })}
      </div>
      {error && <p className="mx-3 mt-2 text-center text-sm text-red-400">{error}</p>}
      <div className="mx-3 mt-6 glass-panel p-4 text-center text-sm text-white/60">
        🗺️ Your civilization expands across the known world. Unlock territories for permanent bonuses.
      </div>
    </div>
  );
}
