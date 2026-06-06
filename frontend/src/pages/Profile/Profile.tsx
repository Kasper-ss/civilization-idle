import { Link } from 'react-router-dom';
import { BackButton } from '../../components/BackButton/BackButton';
import { Header } from '../../components/Header/Header';
import { LanguageSwitcher } from '../../components/LanguageSwitcher/LanguageSwitcher';
import { useGameStore } from '../../store/gameStore';
import { useEraName, useLocaleStore } from '../../store/localeStore';
import { formatNumber } from '../../utils/format';

export function Profile() {
  const game = useGameStore((s) => s.game);
  const t = useLocaleStore((s) => s.t);
  const eraName = useEraName(game?.eraKey || 'stone');

  if (!game) return null;

  const totalProduced = Object.values(game.resources).reduce((s, r) => s + r.currentAmount, 0);

  return (
    <div className="min-h-screen bg-civ-dark pb-28">
      <Header />
      <BackButton />
      <div className="mx-3 mt-2 flex flex-col items-center glass-panel p-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/20 text-4xl">
          {game.user.photoUrl ? (
            <img src={game.user.photoUrl} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            '👑'
          )}
        </div>
        <h2 className="mt-3 font-display text-xl text-civ-gold">
          {game.user.firstName || game.user.username || 'Ruler'}
        </h2>
        {game.title && <p className="text-sm text-amber-300">{game.title}</p>}
        <p className="text-sm text-white/60">@{game.user.username || 'player'}</p>
      </div>

      <div className="mx-3 mt-4 grid grid-cols-2 gap-2">
        <div className="glass-panel p-3 text-center">
          <p className="text-2xl font-bold text-civ-gold">Lv.{game.level}</p>
          <p className="text-xs text-white/50">Player Level</p>
        </div>
        <div className="glass-panel p-3 text-center">
          <p className="text-lg font-bold">{eraName}</p>
          <p className="text-xs text-white/50">{t.profile.currentEra}</p>
        </div>
        <div className="glass-panel p-3 text-center">
          <p className="text-lg font-bold">{formatNumber(totalProduced)}</p>
          <p className="text-xs text-white/50">Resources Held</p>
        </div>
        <div className="glass-panel p-3 text-center">
          <p className="text-lg font-bold">{game.daysPlayed}</p>
          <p className="text-xs text-white/50">Days Played</p>
        </div>
        <div className="glass-panel p-3 text-center">
          <p className="text-lg font-bold">{game.wondersBuilt.length}</p>
          <p className="text-xs text-white/50">Wonders Built</p>
        </div>
        <div className="glass-panel p-3 text-center">
          <p className="text-lg font-bold uppercase">{game.vipTier || 'None'}</p>
          <p className="text-xs text-white/50">VIP Status</p>
        </div>
      </div>

      <LanguageSwitcher />
      <div className="mx-3 mt-4 space-y-2">
        <Link to="/referrals" className="btn-outline block text-center">
          👥 {t.profile.referrals}
        </Link>
        <Link to="/wonders" className="btn-outline block text-center">
          🏛️ My Wonders
        </Link>
        <Link to="/leaderboard" className="btn-outline block text-center">
          🏆 Leaderboard
        </Link>
      </div>
    </div>
  );
}
