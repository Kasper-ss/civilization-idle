interface Props {
  rank: number;
  username: string | null;
  score: number;
  era: number;
  level: number;
  wonders: number;
  isMe?: boolean;
}

export function LeaderboardCard({ rank, username, score, era, level, wonders, isMe }: Props) {
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
        isMe ? 'bg-amber-500/20 ring-1 ring-amber-500/50' : 'bg-black/20'
      }`}
    >
      <span className="w-8 text-center font-display text-lg">
        {rank <= 3 ? medals[rank - 1] : `#${rank}`}
      </span>
      <div className="flex-1">
        <p className="font-medium">{username || 'Anonymous'}</p>
        <p className="text-xs text-white/50">
          Era {era + 1} • Lv.{level} • {wonders} wonders
        </p>
      </div>
      <span className="font-semibold text-civ-gold">{Math.floor(score).toLocaleString()}</span>
    </div>
  );
}
