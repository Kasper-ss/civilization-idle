import { useNavigate, useLocation } from 'react-router-dom';
import { useLocaleStore } from '../../store/localeStore';

const tabs = [
  { path: '/', icon: '🏛️', labelKey: 'home' as const },
  { path: '/buildings', icon: '🏗️', labelKey: 'build' as const },
  { path: '/research', icon: '📜', labelKey: 'research' as const },
  { path: '/world', icon: '🌍', labelKey: 'world' as const },
  { path: '/shop', icon: '🛒', labelKey: 'shop' as const },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const t = useLocaleStore((s) => s.t);

  return (
    <nav className="fixed bottom-[calc(1.75rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-50 mx-auto max-w-[480px] border-t border-civ-border bg-civ-dark/95 backdrop-blur-lg">
      <div className="flex justify-around py-2">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 px-2 text-xs transition ${
                active ? 'text-civ-gold' : 'text-white/50'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{t.nav[tab.labelKey]}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
