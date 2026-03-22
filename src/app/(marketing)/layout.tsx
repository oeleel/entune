import type { ReactNode } from 'react';
import { DM_Sans, Playfair_Display } from 'next/font/google';

import { MarketingShell } from '@/components/marketing/marketing-shell';
import { SiteLanguageSwitcher } from '@/components/marketing/site-language-switcher';

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

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${dmSans.variable} ${playfair.variable} min-h-screen`}>
      <MarketingShell>
        <div className="relative z-20 flex justify-end px-4 pt-4">
          <SiteLanguageSwitcher />
        </div>
        {children}
      </MarketingShell>
    </div>
  );
}
