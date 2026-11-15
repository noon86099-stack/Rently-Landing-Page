import { createContext, useCallback, useContext, useLayoutEffect, useState, type ReactNode } from 'react';
import { translateSystemMessage } from './i18n-errors';

export type Language = 'ar' | 'en';
export type LocalizedText = { en: string; ar: string };
export type UiMessage = string | LocalizedText;
export const LANGUAGE_STORAGE_KEY = 'rently.language';

export function message(en: string, ar: string): LocalizedText {
  return { en, ar };
}

export function resolveMessage(value: UiMessage, language: Language): string {
  return typeof value === 'string' ? translateSystemMessage(value, language) : value[language];
}

export function languageDirection(language: Language): 'rtl' | 'ltr' {
  return language === 'ar' ? 'rtl' : 'ltr';
}

export function languageLocale(language: Language): string {
  // Lease dates are Gregorian in both languages; do not silently use the
  // default Islamic calendar of some Arabic locales.
  return language === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-US';
}

function initialLanguage(): Language {
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'ar' || saved === 'en') return saved;
  } catch {
    // A blocked preference store must not block authentication or records.
  }
  return 'ar';
}

type I18nContextValue = {
  language: Language;
  locale: string;
  direction: 'rtl' | 'ltr';
  setLanguage: (language: Language) => void;
  t: (en: string, ar: string) => string;
  text: (value: UiMessage) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, updateLanguage] = useState<Language>(initialLanguage);
  useLayoutEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = languageDirection(language);
    document.title = language === 'ar'
      ? 'Rently — عقاراتك وإيجاراتك بوضوح'
      : 'Rently — Rental records, connected';
    try {
      // Only a display preference is stored here, never business records.
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // The selection still works in this tab if browser storage is blocked.
    }
  }, [language]);
  const setLanguage = useCallback((next: Language) => {
    if (next === 'ar' || next === 'en') updateLanguage(next);
  }, []);
  const t = useCallback((en: string, ar: string) => language === 'ar' ? ar : en, [language]);
  const text = useCallback((value: UiMessage) => resolveMessage(value, language), [language]);
  return (
    <I18nContext.Provider value={{ language, locale: languageLocale(language), direction: languageDirection(language), setLanguage, t, text }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used within I18nProvider');
  return value;
}

export function useLocalizedFormats() {
  const { locale } = useI18n();
  return {
    formatDate: (value: string) => new Intl.DateTimeFormat(locale, {
      day: '2-digit', month: 'short', year: 'numeric',
    }).format(new Date(`${value}T00:00:00`)),
    formatMoney: (value: number) => new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(value),
    formatDateTime: (value: string) => new Date(value).toLocaleString(locale),
  };
}
