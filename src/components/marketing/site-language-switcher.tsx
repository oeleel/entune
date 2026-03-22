'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const otherLocales = LOCALES.filter((code) => code !== locale);

  return (
    <div
      ref={ref}
      className={cn(
        variant === 'marketing' ? 'entune-lang-switch' : 'entune-lang-switch entune-lang-switch-doctor',
        className
      )}
      role="group"
      aria-label={t('common.language')}
    >
      {/* Active language — always visible, toggles expansion on mobile */}
      <button
        type="button"
        className="entune-lang-btn entune-lang-btn-active"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {t(`lang.${locale}`)}
      </button>

      {/* Other languages — always visible on desktop, slide-in on mobile */}
      {otherLocales.map((code) => (
        <button
          key={code}
          type="button"
          className={cn(
            'entune-lang-btn entune-lang-other',
            open && 'entune-lang-other-visible'
          )}
          onClick={() => {
            setLocale(code);
            setOpen(false);
          }}
          aria-hidden={!open}
          tabIndex={open ? 0 : -1}
        >
          {t(`lang.${code}`)}
        </button>
      ))}
    </div>
  );
}
