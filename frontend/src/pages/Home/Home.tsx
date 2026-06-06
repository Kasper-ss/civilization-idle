import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/Header/Header';
import { ResourceCard } from '../../components/ResourceCard/ResourceCard';
import { EraCard } from '../../components/EraCard/EraCard';
import { GatherPanel } from '../../components/GatherPanel/GatherPanel';
import { isAutoGatherActive } from '../../lib/autoGather';
import { useGameStore } from '../../store/gameStore';
import { useLocaleStore } from '../../store/localeStore';
import { ERA_BACKGROUNDS, formatNumber } from '../../utils/format';
import type { ResourceKey } from '../../types/game';

const OTHER_RESOURCES: ResourceKey[] = ['stone', 'bronze', 'iron', 'gold', 'science', 'energy'];

function isResourceUnlocked(key: ResourceKey, game: NonNullable<ReturnType<typeof useGameStore.getState>['game']>): boolean {
  if (key === 'stone') return (game.buildings.quarry?.level ?? 0) > 0;
  const r = game.resources[key];
  if (!r) return false;
  return r.productionPerHour > 0;
}

export function Home() {
  const game = useGameStore((s) => s.game);
  const advanceEra = useGameStore((s) => s.advanceEra);
  const refresh = useGameStore((s) => s.refresh);
  const t = useLocaleStore((s) => s.t);

  useEffect(() => {
    const ms = game && isAutoGatherActive(game) ? 5000 : 15000;
    const interval = setInterval(() => refresh(), ms);
    return () => clearInterval(interval);
  }, [refresh, game?.autoGatherEnabled, game?.autoGatherExpiresAt]);

  if (!game) return null;

  const bg = ERA_BACKGROUNDS[game.era] ?? ERA_BACKGROUNDS[0];
  const totalPerHour = Object.values(game.resources).reduce((s, r) => s + (r?.productionPerHour ?? 0), 0);
  const otherVisible = OTHER_RESOURCES.filter((key) => isResourceUnlocked(key, game));

  return (
    <div className={`min-h-screen bg-gradient-to-b ${bg} pb-28`}>
      <Header />
      <GatherPanel />
      {otherVisible.length > 0 && (
        <div className="mx-3 mt-3 grid grid-cols-2 gap-2">
          {otherVisible.map((key) => {
            const r = game.resources[key];
            if (!r) return null;
            return <ResourceCard key={key} resourceKey={key} data={r} />;
          })}
        </div>
      )}
      <div className="mx-3 mt-3 glass-panel p-3 text-center text-sm">
        {t.home.totalProduction}:{' '}
        <span className="text-civ-gold font-semibold">
          {formatNumber(totalPerHour)}
          {t.home.perHour}
        </span>
        {game.productionMultiplier > 1 && (
          <span className="ml-2 text-emerald-400">
            x{game.productionMultiplier} {t.home.boost}
          </span>
        )}
      </div>
      <EraCard progress={game.eraProgress} canAdvance={game.canAdvanceEra} onAdvance={advanceEra} />
      <div className="mx-3 mt-3 grid grid-cols-3 gap-2">
        <Link to="/wonders" className="btn-outline text-center text-xs py-3">
          🏛️ {t.home.wonders}
        </Link>
        <Link to="/leaderboard" className="btn-outline text-center text-xs py-3">
          🏆 {t.home.rank}
        </Link>
        <Link to="/profile" className="btn-outline text-center text-xs py-3">
          👤 {t.home.profile}
        </Link>
      </div>
    </div>
  );
}
