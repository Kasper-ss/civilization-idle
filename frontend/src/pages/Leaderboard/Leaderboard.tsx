import { useEffect, useState } from 'react';
import { Header } from '../../components/Header/Header';
import { LeaderboardCard } from '../../components/LeaderboardCard/LeaderboardCard';
import { api } from '../../services/api';
import { useGameStore } from '../../store/gameStore';

interface Entry {
  username: string | null;
  score: number;
  era: number;
  level: number;
  wonders: number;
  telegramId: string | bigint;
}

export function Leaderboard() {
  const game = useGameStore((s) => s.game);
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    api.leaderboard().then(setEntries).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-civ-dark pb-24">
      <Header />
      <h2 className="mx-3 mt-2 font-display text-lg text-civ-gold">Top Civilizations</h2>
      <p className="mx-3 text-xs text-white/50">Ranked by Civilization Score</p>
      <div className="mx-3 mt-3 space-y-2">
        {entries.map((e, i) => (
          <LeaderboardCard
            key={i}
            rank={i + 1}
            username={e.username}
            score={e.score}
            era={e.era}
            level={e.level}
            wonders={e.wonders}
            isMe={game?.user.username === e.username}
          />
        ))}
        {entries.length === 0 && (
          <p className="text-center text-white/50 py-8">Loading leaderboard...</p>
        )}
      </div>
    </div>
  );
}
