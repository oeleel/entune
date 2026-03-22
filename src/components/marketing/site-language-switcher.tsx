'use client';

import { useI18n } from '@/components/providers/i18n-provider';
import type { SiteLocale } from '@/lib/i18n/dictionaries';
import { cn } from '@/lib/utils';

const LOCALES: SiteLocale[] = ['en', 'ko', 'es'];

type SiteLanguageSwitcherProps = {
  variant?: 'marketing' | 'doctor';
  className?: string;
};

export function SiteLanguageSwitcher({
  variant = 'marketing',
  className,
}: SiteLanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className={cn(
        variant === 'marketing' ? 'entune-lang-switch' : 'entune-lang-switch entune-lang-switch-doctor',
        className
      )}
      role="group"
      aria-label={t('common.language')}
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          className={cn(
            'entune-lang-btn',
            locale === code && 'entune-lang-btn-active'
          )}
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
        >
          {t(`lang.${code}`)}
        </button>
      ))}
    </div>
  );
}
