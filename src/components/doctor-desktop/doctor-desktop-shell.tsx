'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { SiteLanguageSwitcher } from '@/components/marketing/site-language-switcher';
import { useI18n } from '@/components/providers/i18n-provider';
import { useUser } from '@/hooks/use-user';
import { cn } from '@/lib/utils';

const PUBLIC_AUTH_PATHS = new Set(['/forgot-password', '/signup']);

type DoctorDesktopShellProps = {
  children: ReactNode;
  className?: string;
};

export function DoctorDesktopShell({ children, className }: DoctorDesktopShellProps) {
  const { t } = useI18n();
  const pathname = usePathname();
  const { user, isLoading } = useUser();

  const hideFullNav =
    PUBLIC_AUTH_PATHS.has(pathname) || !user || isLoading;

  const wordmarkHref =
    PUBLIC_AUTH_PATHS.has(pathname) || !user ? '/login' : '/dashboard';

  return (
    <div className={cn('entune-doctor-desktop relative min-h-screen', className)}>
      <div className="entune-dd-glow" aria-hidden />
      <header className="entune-dd-header">
        <Link href={wordmarkHref} className="entune-dd-wordmark">
          entune
        </Link>
        <div className="entune-dd-header-tools">
          {!hideFullNav ? (
            <nav className="entune-dd-nav" aria-label={t('doctor.navAria')}>
              <Link href="/appointments">{t('doctor.appointments')}</Link>
              <Link href="/visits">{t('doctor.visits')}</Link>
              <Link href="/start-session">{t('doctor.startSession')}</Link>
              <Link href="/live-translation">{t('doctor.live')}</Link>
              <Link href="/settings">{t('doctor.settings')}</Link>
            </nav>
          ) : null}
          <SiteLanguageSwitcher variant="doctor" />
        </div>
      </header>
      <main className="entune-dd-main">{children}</main>
    </div>
  );
}
