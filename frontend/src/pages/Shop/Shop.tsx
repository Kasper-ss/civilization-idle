import { useEffect, useState } from 'react';
import { Header } from '../../components/Header/Header';
import { VIPCard } from '../../components/VIPCard/VIPCard';
import { useGameStore } from '../../store/gameStore';
import { useLocaleStore } from '../../store/localeStore';

export function Shop() {
  const game = useGameStore((s) => s.game);
  const config = useGameStore((s) => s.config);
  const purchase = useGameStore((s) => s.purchase);
  const spin = useGameStore((s) => s.spin);
  const refresh = useGameStore((s) => s.refresh);
  const t = useLocaleStore((s) => s.t);
  const [reward, setReward] = useState('');
  const [paying, setPaying] = useState<string | null>(null);
  const [payError, setPayError] = useState('');

  useEffect(() => {
    refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  const buy = async (productId: string) => {
    if (paying) return;
    setPaying(productId);
    setPayError('');
    try {
      await purchase(productId);
    } catch (e) {
      setPayError((e as Error).message);
    } finally {
      setPaying(null);
    }
  };

  if (!game || !config) return null;

  const gemPacks = config.shop.filter((p) => p.id.startsWith('gems_'));
  const boosts = config.shop.filter((p) => p.type === 'boost' || p.type === 'resources' || p.type === 'instant_era');
  const starsLive = config.payments?.useInvoices ?? false;

  return (
    <div className="min-h-screen bg-civ-dark pb-24">
      <Header />
      <h2 className="mx-3 mt-2 font-display text-lg text-civ-gold">{t.shop.title}</h2>
      <p className="mx-3 text-xs text-white/50">{t.shop.payments}</p>
      {starsLive && (
        <p className="mx-3 mt-1 text-[10px] text-white/35">{t.shop.starsHint}</p>
      )}
      {payError && (
        <p className="mx-3 mt-2 rounded bg-red-500/20 px-3 py-2 text-xs text-red-300">{payError}</p>
      )}

      <div className="mx-3 mt-4 glass-panel p-4 text-center">
        <h3 className="font-display text-civ-gold">🎡 {t.shop.wheel}</h3>
        <p className="text-xs text-white/60">
          {game.dailySpinAvailable ? t.shop.freeSpin : t.shop.comeTomorrow}
        </p>
        {reward && <p className="mt-2 text-emerald-400">{reward}</p>}
        <div className="mt-3 flex gap-2">
          <button
            className="btn-gold flex-1 text-sm"
            disabled={!game.dailySpinAvailable || !!paying}
            onClick={async () => setReward((await spin(false)) || '')}
          >
            {t.shop.freeSpinBtn}
          </button>
          <button
            className="btn-outline flex-1 text-sm"
            disabled={!!paying}
            onClick={async () => setReward((await spin(true)) || '')}
          >
            {t.shop.spin10}
          </button>
        </div>
      </div>

      <h3 className="mx-3 mt-4 font-display text-sm text-civ-gold">{t.shop.gems}</h3>
      <div className="mx-3 mt-2 grid grid-cols-2 gap-2">
        {gemPacks.map((p) => (
          <button
            key={p.id}
            type="button"
            className="glass-panel p-3 text-center disabled:opacity-50"
            disabled={!!paying}
            onClick={() => buy(p.id)}
          >
            <p className="text-2xl">💎</p>
            <p className="font-semibold">{p.name}</p>
            <p className="text-xs text-amber-400">{paying === p.id ? '…' : `${p.stars} ⭐`}</p>
          </button>
        ))}
      </div>

      <h3 className="mx-3 mt-4 font-display text-sm text-civ-gold">{t.shop.boosters}</h3>
      <div className="mx-3 mt-2 space-y-2">
        {boosts.map((p) => (
          <button
            key={p.id}
            type="button"
            className="glass-panel flex w-full justify-between p-3 disabled:opacity-50"
            disabled={!!paying}
            onClick={() => buy(p.id)}
          >
            <span>{p.name}</span>
            <span className="text-amber-400">{paying === p.id ? '…' : `${p.stars} ⭐`}</span>
          </button>
        ))}
      </div>

      <h3 className="mx-3 mt-4 font-display text-sm text-civ-gold">{t.shop.vip}</h3>
      <div className="mx-3 mt-2 space-y-3">
        <VIPCard
          tier="bronze"
          price={299}
          perks={['+10% resources', 'VIP badge', 'Extra research queue']}
          active={game.vipTier === 'bronze'}
          onSelect={() => buy('vip_bronze')}
        />
        <VIPCard
          tier="silver"
          price={599}
          perks={['+20% resources', '+10% research speed', 'Unique frame']}
          active={game.vipTier === 'silver'}
          onSelect={() => buy('vip_silver')}
        />
        <VIPCard
          tier="gold"
          price={999}
          perks={['+30% resources', '+20% research speed', 'Golden nickname', 'Exclusive buildings']}
          active={game.vipTier === 'gold'}
          onSelect={() => buy('vip_gold')}
        />
      </div>
    </div>
  );
}
