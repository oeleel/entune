'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { useUser } from '@/hooks/use-user';
import { cn } from '@/lib/utils';

const PUBLIC_AUTH_PATHS = new Set(['/forgot-password', '/signup']);

type DoctorDesktopShellProps = {
  children: ReactNode;
  className?: string;
};

export function DoctorDesktopShell({ children, className }: DoctorDesktopShellProps) {
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
        {!hideFullNav ? (
          <nav className="entune-dd-nav" aria-label="Doctor">
            <Link href="/appointments">Appointments</Link>
            <Link href="/visits">Visits</Link>
            <Link href="/start-session">Start session</Link>
            <Link href="/live-translation">Live</Link>
            <Link href="/settings">Settings</Link>
          </nav>
        ) : null}
      </header>
      <main className="entune-dd-main">{children}</main>
    </div>
  );
}
