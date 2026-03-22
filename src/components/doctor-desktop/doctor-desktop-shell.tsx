import Link from 'next/link';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type DoctorDesktopShellProps = {
  children: ReactNode;
  className?: string;
};

export function DoctorDesktopShell({ children, className }: DoctorDesktopShellProps) {
  return (
    <div className={cn('entune-doctor-desktop relative min-h-screen', className)}>
      <div className="entune-dd-glow" aria-hidden />
      <header className="entune-dd-header">
        <Link href="/dashboard" className="entune-dd-wordmark">
          entune
        </Link>
        <nav className="entune-dd-nav" aria-label="Doctor">
          <Link href="/appointments">Appointments</Link>
          <Link href="/visits">Visits</Link>
          <Link href="/start-session">Start session</Link>
          <Link href="/live-translation">Live</Link>
          <Link href="/settings">Settings</Link>
        </nav>
      </header>
      <main className="entune-dd-main">{children}</main>
    </div>
  );
}
