import { useEraName, useLocaleStore } from '../../store/localeStore';

interface Props {
  rank: number;
  username: string | null;
  civilizationName?: string;
  score: number;
  eraKey: string;
  level: number;
  wonders: number;
  isMe?: boolean;
}

export function LeaderboardCard({
  rank,
  username,
  civilizationName,
  score,
  eraKey,
  level,
  wonders,
  isMe,
}: Props) {
  const t = useLocaleStore((s) => s.t);
  const eraName = useEraName(eraKey);
  const medals = ['🥇', '🥈', '🥉'];
  const displayName = civilizationName || username || 'Anonymous';

  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
        isMe ? 'bg-amber-500/20 ring-1 ring-amber-500/50' : 'bg-black/20'
      }`}
    >
      <span className="w-8 text-center font-display text-lg">
        {rank <= 3 ? medals[rank - 1] : `#${rank}`}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{displayName}</p>
        {civilizationName && username && (
          <p className="text-[10px] text-white/40 truncate">@{username}</p>
        )}
        <p className="text-xs text-white/50">
          {eraName} • {t.leaderboard.level}{level} • {wonders} {t.leaderboard.wonders}
        </p>
      </div>
      <span className="font-semibold text-civ-gold shrink-0">{Math.floor(score).toLocaleString()}</span>
    </div>
  );
}
