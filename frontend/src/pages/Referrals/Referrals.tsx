import { useCallback, useEffect, useState } from 'react';
import { BackButton } from '../../components/BackButton/BackButton';
import { Header } from '../../components/Header/Header';
import { api } from '../../services/api';
import { useGameStore } from '../../store/gameStore';
import { useLocaleStore } from '../../store/localeStore';

export function Referrals() {
  const userId = useGameStore((s) => s.userId);
  const refresh = useGameStore((s) => s.refresh);
  const t = useLocaleStore((s) => s.t);
  const [info, setInfo] = useState<{
    referralCount: number;
    link: string;
    tiers: { count: number; reward: string; unlocked: boolean }[];
  } | null>(null);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(() => {
    if (!userId) return;
    setLoadError('');
    api
      .referrals(userId)
      .then(setInfo)
      .catch((e) => setLoadError((e as Error).message));
    refresh();
  }, [userId, refresh]);

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const share = () => {
    const tg = window.Telegram?.WebApp;
    if (info?.link) {
      navigator.clipboard?.writeText(info.link);
      tg?.showAlert(t.referrals.linkCopied);
    }
  };

  return (
    <div className="min-h-screen bg-civ-dark pb-24">
      <Header />
      <BackButton />
      <h2 className="mx-3 mt-1 font-display text-lg text-civ-gold">{t.referrals.title}</h2>
      <div className="mx-3 mt-4 glass-panel p-4 text-center">
        <p className="text-4xl font-bold text-civ-gold">{info?.referralCount ?? 0}</p>
        <p className="text-sm text-white/60">{t.referrals.invited}</p>
        <p className="mt-2 text-xs text-white/50">{t.referrals.rewards}</p>
        <p className="mt-2 text-[10px] text-white/35">{t.referrals.hint}</p>
        {loadError && <p className="mt-2 text-xs text-red-400">{loadError}</p>}
        <button className="btn-gold mt-4 w-full" onClick={share}>
          {t.referrals.copyLink}
        </button>
      </div>
      <div className="mx-3 mt-4 space-y-2">
        <h3 className="font-display text-sm text-civ-gold">{t.referrals.milestones}</h3>
        {info?.tiers.map((tier) => (
          <div
            key={tier.count}
            className={`glass-panel flex justify-between p-3 ${tier.unlocked ? 'ring-1 ring-emerald-500/50' : 'opacity-60'}`}
          >
            <span>{tier.count}</span>
            <span className="text-sm text-white/70">{tier.reward}</span>
            {tier.unlocked && <span className="text-emerald-400">✓</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
