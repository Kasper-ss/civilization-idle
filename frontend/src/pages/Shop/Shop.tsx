import { useState } from 'react';
import { Header } from '../../components/Header/Header';
import { VIPCard } from '../../components/VIPCard/VIPCard';
import { useGameStore } from '../../store/gameStore';

export function Shop() {
  const game = useGameStore((s) => s.game);
  const config = useGameStore((s) => s.config);
  const purchase = useGameStore((s) => s.purchase);
  const spin = useGameStore((s) => s.spin);
  const [reward, setReward] = useState('');

  if (!game || !config) return null;

  const gemPacks = config.shop.filter((p) => p.id.startsWith('gems_'));
  const boosts = config.shop.filter((p) => p.type === 'boost' || p.type === 'resources' || p.type === 'instant_era');

  return (
    <div className="min-h-screen bg-civ-dark pb-24">
      <Header />
      <h2 className="mx-3 mt-2 font-display text-lg text-civ-gold">Shop</h2>
      <p className="mx-3 text-xs text-white/50">Payments via Telegram Stars ⭐</p>

      <div className="mx-3 mt-4 glass-panel p-4 text-center">
        <h3 className="font-display text-civ-gold">🎡 Wheel of Fortune</h3>
        <p className="text-xs text-white/60">
          {game.dailySpinAvailable ? 'Free spin available!' : 'Come back tomorrow'}
        </p>
        {reward && <p className="mt-2 text-emerald-400">Won: {reward}</p>}
        <div className="mt-3 flex gap-2">
          <button
            className="btn-gold flex-1 text-sm"
            disabled={!game.dailySpinAvailable}
            onClick={async () => setReward((await spin(false)) || '')}
          >
            Free Spin
          </button>
          <button className="btn-outline flex-1 text-sm" onClick={async () => setReward((await spin(true)) || '')}>
            10 ⭐ Spin
          </button>
        </div>
      </div>

      <h3 className="mx-3 mt-4 font-display text-sm text-civ-gold">Gem Packs</h3>
      <div className="mx-3 mt-2 grid grid-cols-2 gap-2">
        {gemPacks.map((p) => (
          <button key={p.id} className="glass-panel p-3 text-center" onClick={() => purchase(p.id)}>
            <p className="text-2xl">💎</p>
            <p className="font-semibold">{p.name}</p>
            <p className="text-xs text-amber-400">{p.stars} ⭐</p>
          </button>
        ))}
      </div>

      <h3 className="mx-3 mt-4 font-display text-sm text-civ-gold">Boosters</h3>
      <div className="mx-3 mt-2 space-y-2">
        {boosts.map((p) => (
          <button
            key={p.id}
            className="glass-panel flex w-full justify-between p-3"
            onClick={() => purchase(p.id)}
          >
            <span>{p.name}</span>
            <span className="text-amber-400">{p.stars} ⭐</span>
          </button>
        ))}
      </div>

      <h3 className="mx-3 mt-4 font-display text-sm text-civ-gold">VIP Subscriptions</h3>
      <div className="mx-3 mt-2 space-y-3">
        <VIPCard
          tier="bronze"
          price={299}
          perks={['+10% resources', 'VIP badge', 'Extra research queue']}
          active={game.vipTier === 'bronze'}
          onSelect={() => purchase('vip_bronze')}
        />
        <VIPCard
          tier="silver"
          price={599}
          perks={['+20% resources', '+10% research speed', 'Unique frame']}
          active={game.vipTier === 'silver'}
          onSelect={() => purchase('vip_silver')}
        />
        <VIPCard
          tier="gold"
          price={999}
          perks={['+30% resources', '+20% research speed', 'Golden nickname', 'Exclusive buildings']}
          active={game.vipTier === 'gold'}
          onSelect={() => purchase('vip_gold')}
        />
      </div>

      <button className="btn-outline mx-3 mt-4 mb-4 w-[calc(100%-1.5rem)]" onClick={() => purchase('battle_pass')}>
        Battle Pass Premium — 499 ⭐
      </button>
    </div>
  );
}
