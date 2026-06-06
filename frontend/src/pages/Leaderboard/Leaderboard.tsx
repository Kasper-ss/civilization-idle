import { useCallback, useEffect, useState } from 'react';
import { BackButton } from '../../components/BackButton/BackButton';
import { Header } from '../../components/Header/Header';
import { LeaderboardCard } from '../../components/LeaderboardCard/LeaderboardCard';
import { api } from '../../services/api';
import { useGameStore } from '../../store/gameStore';
import { useLocaleStore } from '../../store/localeStore';

interface Entry {
  rank: number;
  userId: string;
  username: string | null;
  civilizationName: string;
  score: number;
  era: number;
  eraKey: string;
  level: number;
  wonders: number;
  telegramId: string;
}

const REFRESH_MS = 10_000;

export function Leaderboard() {
  const game = useGameStore((s) => s.game);
  const userId = useGameStore((s) => s.userId);
  const t = useLocaleStore((s) => s.t);
  const locale = useLocaleStore((s) => s.locale);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.leaderboard(userId ?? undefined);
      setEntries(data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const myTelegramId = game?.user.telegramId;

  return (
    <div className="min-h-screen bg-civ-dark pb-28">
      <Header />
      <BackButton className="mx-3 mt-1" />
      <div className="mx-3 mt-1 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg text-civ-gold">{t.leaderboard.title}</h2>
          <p className="text-xs text-white/50">{t.leaderboard.subtitle}</p>
        </div>
        <button
          type="button"
          className="btn-outline shrink-0 px-3 py-2 text-xs"
          onClick={load}
          title={t.leaderboard.refresh}
        >
          ↻
        </button>
      </div>
      {lastUpdated && (
        <p className="mx-3 mt-1 text-[10px] text-white/35">
          {t.leaderboard.updated}: {lastUpdated.toLocaleTimeString(locale)}
        </p>
      )}
      <div className="mx-3 mt-3 space-y-2">
        {entries.map((e) => (
          <LeaderboardCard
            key={e.userId}
            rank={e.rank}
            username={e.username}
            civilizationName={e.civilizationName}
            score={e.score}
            eraKey={e.eraKey}
            level={e.level}
            wonders={e.wonders}
            isMe={myTelegramId != null && e.telegramId === myTelegramId}
          />
        ))}
        {loading && entries.length === 0 && (
          <p className="py-8 text-center text-white/50">{t.leaderboard.loading}</p>
        )}
        {!loading && entries.length === 0 && (
          <p className="py-8 text-center text-white/50">{t.leaderboard.empty}</p>
        )}
      </div>
    </div>
  );
}
