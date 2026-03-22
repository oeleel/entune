import type { ReactNode } from 'react';
import { DM_Sans, Playfair_Display } from 'next/font/google';

import { DoctorDesktopShell } from '@/components/doctor-desktop/doctor-desktop-shell';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-entune-sans',
  weight: ['300', '400', '500', '600'],
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-entune-display',
  weight: ['400', '500'],
});

export default function DoctorDesktopLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${dmSans.variable} ${playfair.variable}`}>
      <DoctorDesktopShell>{children}</DoctorDesktopShell>
    </div>
  );
}
