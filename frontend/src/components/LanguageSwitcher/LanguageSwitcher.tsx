import { useLocaleStore, type Locale } from '../../store/localeStore';

export function LanguageSwitcher({ compact }: { compact?: boolean }) {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const t = useLocaleStore((s) => s.t);

  const btn = (lang: Locale, label: string) => (
    <button
      key={lang}
      type="button"
      onClick={() => setLocale(lang)}
      className={`rounded-md px-2 py-1 text-xs font-medium transition ${
        locale === lang ? 'bg-amber-500/30 text-amber-200' : 'text-white/50 hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );

  if (compact) {
    return (
      <div className="flex gap-1">
        {btn('ru', 'RU')}
        {btn('en', 'EN')}
      </div>
    );
  }

  return (
    <div className="glass-panel mx-3 mt-2 flex items-center justify-between p-2">
      <span className="text-xs text-white/60">{t.language.label}</span>
      <div className="flex gap-1">
        {btn('ru', t.language.ru)}
        {btn('en', t.language.en)}
      </div>
    </div>
  );
}
