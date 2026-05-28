import { create } from 'zustand';
import { en } from '../i18n/locales/en';
import { ru } from '../i18n/locales/ru';
import type { TranslationKeys } from '../i18n/locales/en';

export type Locale = 'ru' | 'en';

const dictionaries: Record<Locale, TranslationKeys> = { en, ru };

interface LocaleStore {
  locale: Locale;
  t: TranslationKeys;
  setLocale: (locale: Locale) => void;
}

const stored = (typeof localStorage !== 'undefined' ? localStorage.getItem('cividle_locale') : null) as Locale | null;
const initial: Locale = stored === 'en' || stored === 'ru' ? stored : 'ru';

export const useLocaleStore = create<LocaleStore>((set) => ({
  locale: initial,
  t: dictionaries[initial],
  setLocale: (locale) => {
    localStorage.setItem('cividle_locale', locale);
    set({ locale, t: dictionaries[locale] });
  },
}));

export function useEraName(eraKey: string): string {
  const t = useLocaleStore((s) => s.t);
  const key = eraKey as keyof TranslationKeys['eras'];
  return t.eras[key] ?? eraKey;
}
