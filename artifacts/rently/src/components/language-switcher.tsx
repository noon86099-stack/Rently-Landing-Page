import { Languages } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();
  return (
    <div role="group" aria-label={t('Interface language', 'لغة الواجهة')} className="inline-flex shrink-0 items-center gap-1 border border-[#c5d4e0] bg-[#f4f7f9] p-1">
      <Languages size={14} className="mx-1 hidden text-[#53677c] sm:block" aria-hidden="true" />
      {(['ar', 'en'] as const).map((choice) => (
        <button
          key={choice}
          type="button"
          data-testid={`language-${choice}`}
          lang={choice}
          dir={choice === 'ar' ? 'rtl' : 'ltr'}
          aria-label={choice === 'ar' ? t('Arabic', 'العربية') : t('English', 'الإنجليزية')}
          aria-pressed={language === choice}
          onClick={() => setLanguage(choice)}
          className={`min-h-8 min-w-8 px-1.5 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f7cff] sm:px-2 sm:text-[11px] ${language === choice ? 'bg-[#102238] text-white' : 'text-[#53677c] hover:bg-[#e0e8f0]'}`}
        >
          {choice === 'ar'
            ? <><span className="sm:hidden">ع</span><span className="hidden sm:inline">العربية</span></>
            : <><span className="sm:hidden">EN</span><span className="hidden sm:inline">English</span></>}
        </button>
      ))}
    </div>
  );
}
