import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { BottomNav } from './components/BottomNav/BottomNav';
import { Home } from './pages/Home/Home';
import { Buildings } from './pages/Buildings/Buildings';
import { Research } from './pages/Research/Research';
import { World } from './pages/World/World';
import { Wonders } from './pages/Wonders/Wonders';
import { Leaderboard } from './pages/Leaderboard/Leaderboard';
import { Referrals } from './pages/Referrals/Referrals';
import { Shop } from './pages/Shop/Shop';
import { Profile } from './pages/Profile/Profile';
import { getTelegramAppLink, isInsideTelegram } from './lib/telegram';
import { useGameStore } from './store/gameStore';
import { useEraName, useLocaleStore } from './store/localeStore';
import { formatDuration, formatNumber, RESOURCE_ICONS } from './utils/format';
import type { ResourceKey } from './types/game';

function OfflineModal() {
  const game = useGameStore((s) => s.game);
  const show = useGameStore((s) => s.showOfflineModal);
  const collect = useGameStore((s) => s.collectOffline);
  const dismiss = useGameStore((s) => s.dismissOffline);
  const t = useLocaleStore((s) => s.t);

  if (!show || !game?.offlineIncome) return null;

  const income = game.offlineIncome;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="glass-panel max-w-sm w-full p-6 text-center">
        <h2 className="font-display text-xl text-civ-gold">{t.offline.welcome}</h2>
        <p className="mt-2 text-sm text-white/70">{t.offline.earned}</p>
        <p className="text-xs text-white/50">
          {t.offline.away} {formatDuration(income.secondsAway)}
          {income.capped && ` (${t.offline.max24})`}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {Object.entries(income.earned).map(([key, val]) => {
            if (!val || val <= 0) return null;
            const rk = key as ResourceKey;
            return (
              <div key={key} className="rounded bg-black/30 p-2">
                {RESOURCE_ICONS[key]} {formatNumber(val)} {t.resources[rk] ?? key}
              </div>
            );
          })}
        </div>
        <button className="btn-gold mt-6 w-full" onClick={collect}>
          {t.common.collect}
        </button>
        <button className="mt-2 text-xs text-white/40 underline" onClick={dismiss}>
          {t.common.skip}
        </button>
      </div>
    </div>
  );
}

function EraAdvanceModal() {
  const show = useGameStore((s) => s.showEraModal);
  const game = useGameStore((s) => s.game);
  const dismiss = useGameStore((s) => s.dismissEra);
  const t = useLocaleStore((s) => s.t);
  const eraName = useEraName(game?.eraKey || 'stone');

  if (!show || !game) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={dismiss}>
      <div className="animate-era-flash text-center" onClick={(e) => e.stopPropagation()}>
        <p className="text-6xl">🏛️</p>
        <h2 className="mt-4 font-display text-3xl font-bold text-civ-gold">{t.era.newEra}</h2>
        <p className="mt-2 text-xl">{eraName}</p>
        <p className="mt-4 text-sm text-white/60">{t.era.newEraDesc}</p>
        <button className="btn-gold mt-8 px-8" onClick={dismiss}>
          {t.era.continue}
        </button>
      </div>
    </div>
  );
}

function LoadingScreen() {
  const t = useLocaleStore((s) => s.t);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-civ-dark">
      <div className="text-6xl animate-pulse-slow">🏛️</div>
      <h1 className="mt-4 font-display text-2xl text-civ-gold">Civilization Idle</h1>
      <p className="mt-2 text-white/50">{t.common.loading}</p>
    </div>
  );
}

function ErrorScreen({ error }: { error: string }) {
  const init = useGameStore((s) => s.init);
  const t = useLocaleStore((s) => s.t);
  const locale = useLocaleStore((s) => s.locale);
  const inTg = isInsideTelegram();
  const isTelegramAuth =
    error.toLowerCase().includes('telegram') || error.toLowerCase().includes('init data');

  const openTelegram = () => {
    window.open(getTelegramAppLink(), '_blank');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-civ-dark p-6 text-center">
      <p className="text-red-400">{error}</p>

      {isTelegramAuth && !inTg && (
        <div className="mt-4 max-w-sm space-y-3 text-sm text-white/70">
          {locale === 'ru' ? (
            <>
              <p>Вы открыли игру в обычном браузере. Mini App работает внутри Telegram.</p>
              <p>
                1. Откройте бота в Telegram
                <br />
                2. Меню → ваше приложение
                <br />
                3. Или на Render добавьте <code className="text-amber-300">ALLOW_BROWSER_PLAY=true</code>{' '}
                для теста в браузере
              </p>
            </>
          ) : (
            <>
              <p>You opened the game in a regular browser. The Mini App runs inside Telegram.</p>
              <p>
                Open your bot in Telegram → Menu → App. For browser testing, set{' '}
                <code className="text-amber-300">ALLOW_BROWSER_PLAY=true</code> on Render.
              </p>
            </>
          )}
          <button type="button" className="btn-gold w-full" onClick={openTelegram}>
            {locale === 'ru' ? 'Открыть в Telegram' : 'Open in Telegram'}
          </button>
        </div>
      )}

      <button className="btn-gold mt-4" onClick={init}>
        {t.common.retry}
      </button>
    </div>
  );
}

const HIDE_NAV = ['/wonders', '/leaderboard', '/referrals', '/profile'];

export default function App() {
  const init = useGameStore((s) => s.init);
  const loading = useGameStore((s) => s.loading);
  const error = useGameStore((s) => s.error);
  const location = useLocation();

  useEffect(() => {
    init();
  }, [init]);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;

  const showNav = !HIDE_NAV.includes(location.pathname);

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/buildings" element={<Buildings />} />
        <Route path="/research" element={<Research />} />
        <Route path="/world" element={<World />} />
        <Route path="/wonders" element={<Wonders />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      {showNav && <BottomNav />}
      <OfflineModal />
      <EraAdvanceModal />
    </>
  );
}
