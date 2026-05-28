import { useEffect, useState } from 'react';
import { Header } from '../../components/Header/Header';
import { api } from '../../services/api';
import { useGameStore } from '../../store/gameStore';

export function Referrals() {
  const userId = useGameStore((s) => s.userId);
  const [info, setInfo] = useState<{
    referralCount: number;
    link: string;
    tiers: { count: number; reward: string; unlocked: boolean }[];
  } | null>(null);

  useEffect(() => {
    if (userId) api.referrals(userId).then(setInfo).catch(console.error);
  }, [userId]);

  const share = () => {
    const tg = window.Telegram?.WebApp;
    if (info?.link) {
      navigator.clipboard?.writeText(info.link);
      tg?.showAlert('Referral link copied!');
    }
  };

  return (
    <div className="min-h-screen bg-civ-dark pb-24">
      <Header />
      <h2 className="mx-3 mt-2 font-display text-lg text-civ-gold">Invite Friends</h2>
      <div className="mx-3 mt-4 glass-panel p-4 text-center">
        <p className="text-4xl font-bold text-civ-gold">{info?.referralCount ?? 0}</p>
        <p className="text-sm text-white/60">Friends invited</p>
        <p className="mt-2 text-xs text-white/50">
          Rewards: x5 production (3h), 50 Gems, reward chest per friend
        </p>
        <button className="btn-gold mt-4 w-full" onClick={share}>
          Copy Referral Link
        </button>
      </div>
      <div className="mx-3 mt-4 space-y-2">
        <h3 className="font-display text-sm text-civ-gold">Referral Milestones</h3>
        {info?.tiers.map((t) => (
          <div
            key={t.count}
            className={`glass-panel flex justify-between p-3 ${t.unlocked ? 'ring-1 ring-emerald-500/50' : 'opacity-60'}`}
          >
            <span>{t.count} friends</span>
            <span className="text-sm text-white/70">{t.reward}</span>
            {t.unlocked && <span className="text-emerald-400">✓</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
